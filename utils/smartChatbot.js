const openai = require("../openai");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

class SmartChatbot {
    constructor() {
        this.maxHistory = 10;
    }

    async handleMessage(message, userId, userContext = {}) {
        try {
            const Conversation = require("../models/conversation");

            // Fetch or create conversation
            let conversation = await Conversation.findOne({ user: userId });
            if (!conversation) {
                conversation = new Conversation({ user: userId, messages: [] });
                await conversation.save();
            }

            const preferenceAnalyzer = require("./preferenceAnalyzer");

            // Analyze user message for preferences
            const analysis = preferenceAnalyzer.analyzeMessage(message);

            // Update learnings if analysis found something
            if (analysis.travelStyle.length > 0 || analysis.interests.length > 0 || analysis.budgetHint) {
                // Initialize learnings if empty
                if (!conversation.learnings) conversation.learnings = {};

                // Update Travel Style
                if (analysis.travelStyle.length > 0) {
                    conversation.learnings.travelStyle = analysis.travelStyle[0]; // Just the string value
                    console.log(`🎓 Learned Travel Style: ${analysis.travelStyle[0]}`);
                }

                // Update Budget Range
                if (analysis.budgetHint) {
                    if (!conversation.learnings.budgetRange) conversation.learnings.budgetRange = { min: 0, max: 0 };

                    if (analysis.budgetHint === 'low') {
                        conversation.learnings.budgetRange.max = 5000;
                    } else if (analysis.budgetHint === 'high') {
                        conversation.learnings.budgetRange.min = 10000;
                        conversation.learnings.budgetRange.max = 100000;
                    } else {
                        conversation.learnings.budgetRange.min = 4000;
                        conversation.learnings.budgetRange.max = 10000;
                    }
                    console.log(`🎓 Learned Budget: ${analysis.budgetHint}`);
                }

                await conversation.save();
            }

            // Get recent history for context
            const userHistory = conversation.getRecentMessages(this.maxHistory);

            // Format history for OpenAI (remove Mongoose specific fields)
            const formattedHistory = userHistory.map(msg => {
                const m = { role: msg.role, content: msg.content };
                if (msg.functionCall && msg.functionCall.name) {
                    m.function_call = msg.functionCall;
                }
                if (msg.functionName) {
                    m.name = msg.functionName;
                }
                return m;
            });

            // Pass learnings to system prompt for personalization
            const systemPrompt = this.getSystemPrompt(userContext, conversation.learnings);
            const functions = this.getFunctionDefinitions();

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...userHistory,
                    { role: "user", content: message }
                ],
                functions: functions,
                function_call: "auto", // Let AI decide when to call functions
                temperature: 0.7,
                max_tokens: 500
            });

            const aiMessage = response.choices[0].message;

            // Debug: Write full response to file
            const fs = require('fs');
            const path = require('path');
            const debugPath = path.join(__dirname, '../debug_openai_response.json');
            console.log(`📝 Writing debug log to: ${debugPath}`);
            fs.writeFileSync(debugPath, JSON.stringify(aiMessage, null, 2));

            // Check if AI wants to call a function
            if (aiMessage.function_call) {
                const functionName = aiMessage.function_call.name;
                const functionArgs = JSON.parse(aiMessage.function_call.arguments);

                console.log(`🔧 Function called: ${functionName}`, functionArgs);

                // Execute the function
                const functionResult = await this.executeFunction(functionName, functionArgs, userId);

                // Add function call to history
                this.addToHistory(userId, "assistant", null, aiMessage.function_call);
                this.addToHistory(userId, "function", JSON.stringify(functionResult), null, functionName);

                // Get final response from AI with function result
                const finalResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...formattedHistory, // Use the same history snapshot
                        { role: "user", content: message },
                        aiMessage, // The Function Call request
                        { role: "function", name: functionName, content: JSON.stringify(functionResult) }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                });

                const finalReply = finalResponse.choices[0].message.content;
                this.addToHistory(userId, "assistant", finalReply);

                return {
                    reply: finalReply,
                    functionCalled: functionName,
                    functionResult: functionResult,
                    suggestions: this.extractSuggestions(finalReply, message),
                    type: 'function_result'
                };
            }

            // Normal text response
            const reply = aiMessage.content;
            this.addToHistory(userId, "user", message);
            this.addToHistory(userId, "assistant", reply);

            return {
                reply,
                suggestions: this.extractSuggestions(reply, message),
                type: 'text'
            };
        } catch (error) {
            console.error("Chatbot error:", error);
            require('fs').writeFileSync(require('path').join(__dirname, '../error_log.txt'), `Error at ${new Date().toISOString()}: ${error.message}\nStack: ${error.stack}\n`);

            // --- FALLBACK MECHANISM FOR 429/QUOTA ERRORS ---
            if (error.status === 429 || error.message.includes('quota') || error.message.includes('billing')) {
                console.log("⚠️ OpenAI Quota Exceeded. Switching to Rule-Based Fallback.");

                const lowerMsg = message.toLowerCase();
                let location = "Mumbai"; // Default
                const locationMatch = message.match(/in\s+([a-zA-Z\s]+?)(?:\s+under|\s+below|\s+for|$)/i);
                if (locationMatch) location = locationMatch[1].trim();

                let priceMax = null;
                const priceMatch = message.match(/(?:under|below|<|₹)\s*(\d+)/i);
                if (priceMatch) priceMax = parseInt(priceMatch[1]);

                // Try to guess the intent
                let functionName = null;
                let args = { location, priceMax };

                if (lowerMsg.includes('stay') || lowerMsg.includes('hotel') || lowerMsg.includes('room') || lowerMsg.includes('villa')) {
                    functionName = "search_listings";
                } else if (lowerMsg.includes('vehicle') || lowerMsg.includes('car') || lowerMsg.includes('bike') || lowerMsg.includes('rent')) {
                    functionName = "search_vehicles";
                } else if (lowerMsg.includes('dhaba') || lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('restaurant')) {
                    functionName = "search_dhabas";
                }

                if (functionName) {
                    console.log(`🤖 Fallback executing: ${functionName} with`, args);
                    const functionResult = await this.executeFunction(functionName, args, userId);

                    // Construct a simple fallback response
                    const fallbackReply = `(Offline Mode) I found ${functionResult.count} options for you in ${location}. Check them out below!`;
                    this.addToHistory(userId, "assistant", fallbackReply);

                    return {
                        reply: fallbackReply,
                        functionCalled: functionName,
                        functionResult: functionResult,
                        suggestions: this.extractSuggestions(fallbackReply, message),
                        type: 'function_result'
                    };
                }
            }

            return {
                reply: "I'm having a bit of trouble connecting to my travel brain (Quota Exceeded). But I'm still here! Try asking for 'Hotels in Mumbai' explicitly.",
                suggestions: [{ text: "Try again", action: "retry" }]
            };
        }
    }

    getSystemPrompt(context = {}, learnings = {}) {
        const userName = context.firstName || context.username || "Traveler";

        // Personalization based on learnings
        let personalization = "";
        if (learnings.travelStyle && learnings.travelStyle.type) {
            const style = learnings.travelStyle.type;
            personalization += `\nUSER PROFILE: This user prefers a "${style.toUpperCase()}" travel style. Adjust your recommendations to match this vibe.`;
            if (style === 'budget') personalization += " Focus on affordability and value.";
            if (style === 'luxury') personalization += " Focus on premium experiences and comfort.";
            if (style === 'adventure') personalization += " Highlight thrill and exploration.";
        }

        return `You are "WanderAssistant", the premium, soul-stirring AI travel guide for the WanderLust platform. 
        Your mission is to help ${userName} script an extraordinary adventure.

        WanderLust Pillars:
        1. 🏠 Stays: Unique homes, farmstays, and luxury villas.
        2. 🚗 Wheels: Rugged SUVs, cruisers, and local cars for the road.
        3. 🍲 Dhabas: Authentic Indian roadside culinary treasures.

        Your Personality:
        - Evocative & Sensory: Don't just list places; describe the "crisp mountain air of Himachal" or the "sizzling spice of a highway Dhaba".
        - Knowledgeable & Professional: You know the Indian landscape like the back of your hand.
        - Action-Oriented: Subtle nudges towards viewing listings or renting vehicles.
        - Concise yet Warm: Respect the user's time but remain friendly and empathetic.
        ${personalization}

        Interaction Guidelines:
        - If the user is vague, ask about their vibe (Peaceful? Adventurous? Foodie?).
        - Use emojis to represent the pillars (🏠, 🚗, 🍲) but keep them professional.
        - Never mention being an AI unless directly asked. You are the digital spirit of WanderLust.
        
        CRITICAL: 
        - If a function call returns NO results (count: 0), you must HONESTLY say "I couldn't find any listings matching your criteria." 
        - Do NOT invent, hallucinate, or make up listings, vehicles, or dhabas that are not provided in the function results.`;
    }

    extractSuggestions(reply, originalMessageText) {
        const lowerReply = reply.toLowerCase();
        const lowerOriginal = originalMessageText.toLowerCase();
        const suggestions = [];

        // Check for keywords and add relevant suggestions
        if (lowerReply.includes("stay") || lowerReply.includes("hotel") || lowerOriginal.includes("where to sleep")) {
            suggestions.push({ text: "🏠 Explore Stays", action: "find_hotels" });
        }

        if (lowerReply.includes("vehicle") || lowerReply.includes("car") || lowerReply.includes("drive") || lowerOriginal.includes("road trip")) {
            suggestions.push({ text: "🚗 Rent Wheels", action: "find_vehicles" });
        }

        if (lowerReply.includes("dhaba") || lowerReply.includes("food") || lowerReply.includes("eat") || lowerOriginal.includes("hungry")) {
            suggestions.push({ text: "🍲 Find Dhabas", action: "find_dhabas" });
        }

        if (lowerReply.includes("itinerary") || lowerReply.includes("plan") || lowerOriginal.includes("trip")) {
            suggestions.push({ text: "📅 Plan Trip", action: "plan_trip" });
        }

        // Add variety if needed
        if (suggestions.length < 2) {
            suggestions.push({ text: "💡 Surprise Me!", action: "get_ideas" });
        }

        if (suggestions.length < 3) {
            suggestions.push({ text: "🗺️ Nearby Gems", action: "check_nearby" });
        }

        return suggestions.slice(0, 4);
    }

    async addToHistory(userId, role, content, functionCall = null, functionName = null) {
        try {
            const Conversation = require("../models/conversation");
            let conversation = await Conversation.findOne({ user: userId });

            if (conversation) {
                await conversation.addMessage(role, content, functionCall, functionName);
            }
        } catch (error) {
            console.error("Error saving to history:", error);
        }
    }

    // Define available functions for OpenAI
    getFunctionDefinitions() {
        return [
            {
                name: "search_listings",
                description: "Search for accommodations/stays based on location, dates, and preferences",
                parameters: {
                    type: "object",
                    properties: {
                        location: { type: "string", description: "City or area name to search in" },
                        priceMax: { type: "number", description: "Maximum price per night in rupees" },
                        propertyType: { type: "string", description: "Type of property (villa, apartment, farmstay, etc.)" }
                    },
                    required: ["location"]
                }
            },
            {
                name: "search_vehicles",
                description: "Search for rental vehicles like cars, bikes, SUVs",
                parameters: {
                    type: "object",
                    properties: {
                        location: { type: "string", description: "City or area where vehicle is needed" },
                        vehicleType: { type: "string", description: "Type of vehicle (car, bike, suv, luxury)" },
                        priceMax: { type: "number", description: "Maximum rental price per day" }
                    },
                    required: ["location"]
                }
            },
            {
                name: "search_dhabas",
                description: "Find nearby restaurants, dhabas, and dining options",
                parameters: {
                    type: "object",
                    properties: {
                        location: { type: "string", description: "City or area to find dhabas" },
                        cuisine: { type: "string", description: "Type of cuisine (punjabi, south indian, chinese, etc.)" },
                        priceRange: { type: "string", enum: ["budget", "moderate", "expensive"], description: "Price range preference" }
                    },
                    required: ["location"]
                }
            },
            {
                name: "get_user_bookings",
                description: "Retrieve user's bookings - past, upcoming, or all",
                parameters: {
                    type: "object",
                    properties: {
                        status: { type: "string", enum: ["upcoming", "past", "all", "confirmed", "pending"], description: "Filter bookings by status" }
                    }
                }
            }
        ];
    }

    // Execute the function called by AI
    async executeFunction(functionName, args, userId) {
        try {
            const Listing = require("../models/listing");
            const Vehicle = require("../models/vehicle");
            const Dhaba = require("../models/dhaba");
            const Booking = require("../models/booking");

            switch (functionName) {
                case "search_listings":
                    const listingQuery = {
                        $or: [
                            { location: new RegExp(args.location, 'i') },
                            { country: new RegExp(args.location, 'i') },
                            { title: new RegExp(args.location, 'i') }
                        ]
                    };

                    if (args.priceMax) {
                        listingQuery.price = { $lte: args.priceMax };
                    }

                    if (args.propertyType) {
                        listingQuery.propertyType = new RegExp(args.propertyType, 'i');
                    }

                    const listings = await Listing.find(listingQuery)
                        .limit(5)
                        .select('title location price propertyType image rating');

                    return {
                        success: true,
                        results: listings.map(l => ({
                            id: l._id,
                            title: l.title,
                            location: l.location,
                            price: l.price,
                            type: l.propertyType,
                            image: l.image?.url,
                            rating: l.rating || 'New'
                        })),
                        count: listings.length
                    };

                case "search_vehicles":
                    const vehicleQuery = {
                        $or: [
                            { location: new RegExp(args.location, 'i') },
                            { country: new RegExp(args.location, 'i') }
                        ],
                        available: true
                    };

                    if (args.vehicleType) {
                        vehicleQuery.vehicleType = new RegExp(args.vehicleType, 'i');
                    }

                    if (args.priceMax) {
                        vehicleQuery.price = { $lte: args.priceMax };
                    }

                    const vehicles = await Vehicle.find(vehicleQuery)
                        .limit(5)
                        .select('brand model location price vehicleType image');

                    return {
                        success: true,
                        results: vehicles.map(v => ({
                            id: v._id,
                            name: `${v.brand} ${v.model}`,
                            location: v.location,
                            price: v.price,
                            type: v.vehicleType,
                            image: v.image?.url
                        })),
                        count: vehicles.length
                    };

                case "search_dhabas":
                    const dhabaQuery = {
                        $or: [
                            { location: new RegExp(args.location, 'i') },
                            { country: new RegExp(args.location, 'i') }
                        ]
                    };

                    if (args.cuisine) {
                        dhabaQuery.cuisine = new RegExp(args.cuisine, 'i');
                    }

                    const dhabas = await Dhaba.find(dhabaQuery)
                        .limit(5)
                        .select('title location cuisine specialties image rating');

                    return {
                        success: true,
                        results: dhabas.map(d => ({
                            id: d._id,
                            name: d.title,
                            location: d.location,
                            cuisine: d.cuisine,
                            specialties: d.specialties,
                            image: d.image?.url,
                            rating: d.rating || 'New'
                        })),
                        count: dhabas.length
                    };

                case "get_user_bookings":
                    const bookingQuery = { user: userId };

                    if (args.status && args.status !== 'all') {
                        if (args.status === 'upcoming') {
                            bookingQuery.startDate = { $gte: new Date() };
                            bookingQuery.status = { $in: ['confirmed', 'pending'] };
                        } else if (args.status === 'past') {
                            bookingQuery.endDate = { $lt: new Date() };
                        } else {
                            bookingQuery.status = args.status;
                        }
                    }

                    const bookings = await Booking.find(bookingQuery)
                        .populate('listing vehicle dhaba')
                        .sort({ createdAt: -1 })
                        .limit(10);

                    return {
                        success: true,
                        bookings: bookings.map(b => ({
                            id: b._id,
                            type: b.listing ? 'stay' : b.vehicle ? 'vehicle' : 'dining',
                            item: b.listing?.title || b.vehicle?.brand + ' ' + b.vehicle?.model || b.dhaba?.title,
                            startDate: b.startDate,
                            endDate: b.endDate,
                            status: b.status,
                            totalPrice: b.totalPrice
                        })),
                        count: bookings.length
                    };

                default:
                    return { success: false, error: "Unknown function" };
            }
        } catch (error) {
            console.error(`Error executing function ${functionName}:`, error);
            return { success: false, error: error.message };
        }
    }

    // --- AI MAGIC: Smart Pricing ---
    async calculatePrice(itemData) {
        try {
            const { title, location, type, currentPrice, description } = itemData;

            const prompt = `As a real estate and travel pricing expert, suggest an optimal price for this listing on WanderLust:
            Title: ${title}
            Location: ${location}
            Type: ${type}
            Current Price: ${currentPrice || 'Not set'}
            Description: ${description || 'N/A'}
            
            Consider local demand, seasonal trends in ${location}, and the premium nature of WanderLust.
            Provide a JSON response with:
            - suggestedPrice (number)
            - confidence (0-1)
            - reasoning (short string)
            - seasonalTips (list of 2 strings)`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "You are a pricing expert. Return ONLY valid JSON." }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("Smart Pricing error:", error);
            return { suggestedPrice: itemData.currentPrice || 5000, confidence: 0.5, reasoning: "Based on historical average." };
        }
    }

    // --- AI MAGIC: Visual Intelligence ---
    async analyzeImage(imageUrl, context = {}) {
        try {
            const prompt = `Analyze this travel image: ${imageUrl} ${context.title ? `associated with "${context.title}"` : ''}
            Suggest the most fitting category from these WanderLust options:
            Categories: Iconic Cities, Amazing Pools, Mountains, Beachfront, Adventure Wheels, Luxury Cars, Spicy Food, Traditional.
            
            Return JSON:
            - suggestedCategory (string)
            - tags (array of 3 strings)
            - description (short vibe description)`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "You are a visual travel analyst. Return ONLY valid JSON." }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("Visual Intelligence error:", error);
            return { suggestedCategory: "Iconic Cities", tags: ["travel", "explore"] };
        }
    }
}

module.exports = new SmartChatbot();