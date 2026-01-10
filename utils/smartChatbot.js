const openai = require("../openai");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

class SmartChatbot {
    constructor() {
        this.contextMap = new Map(); // Store history by session/user
        this.maxHistory = 8;
    }

    async handleMessage(message, userId, userContext = {}) {
        try {
            const userHistory = this.contextMap.get(userId) || [];

            // Generate system prompt with WanderLust personality
            const systemPrompt = this.getSystemPrompt(userContext);

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Faster and efficient
                messages: [
                    { role: "system", content: systemPrompt },
                    ...userHistory.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const reply = response.choices[0].message.content;

            // Update history
            this.addToHistory(userId, "user", message);
            this.addToHistory(userId, "assistant", reply);

            // Extract potential actions/suggestions
            const suggestions = this.extractSuggestions(reply, message);

            return {
                reply,
                suggestions,
                type: 'text'
            };
        } catch (error) {
            console.error("Chatbot error:", error);
            return {
                reply: "I'm having a bit of trouble connecting to my travel brain. Could you repeat that?",
                suggestions: [{ text: "Try again", action: "retry" }]
            };
        }
    }

    getSystemPrompt(context = {}) {
        const userName = context.firstName || context.username || "Traveler";
        const location = context.location || "the unknown";

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

        Interaction Guidelines:
        - If the user is vague, ask about their vibe (Peaceful? Adventurous? Foodie?).
        - Use emojis to represent the pillars (🏠, 🚗, 🍲) but keep them professional.
        - Never mention being an AI unless directly asked. You are the digital spirit of WanderLust.`;
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

    addToHistory(userId, role, content) {
        const history = this.contextMap.get(userId) || [];
        history.push({ role, content });
        if (history.length > this.maxHistory) history.shift();
        this.contextMap.set(userId, history);
    }
}

module.exports = new SmartChatbot();