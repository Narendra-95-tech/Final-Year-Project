const openai = require("../openai");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

class SmartChatbot {
    constructor() {
        this.context = {
            conversationHistory: [],
            maxHistory: 5
        };
    }

    async handleMessage(message, userId) {
        try {
            // Add user message to history
            this.addToHistory("user", message);

            // Generate context-aware response
            const prompt = this.generatePrompt(message);
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: this.getSystemPrompt() },
                    ...this.context.conversationHistory.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                ],
                temperature: 0.7
            });

            const reply = response.choices[0].message.content;
            this.addToHistory("assistant", reply);

            // Handle any actions needed (booking, search, etc.)
            await this.handleActions(message, reply);

            return reply;
        } catch (error) {
            console.error("Chatbot error:", error);
            return "I apologize, but I'm having trouble processing your request right now.";
        }
    }

    getSystemPrompt() {
        return `You are a helpful assistant for the WanderLust travel platform. You can help with:
        - Finding accommodations, vehicles, and restaurants
        - Making bookings
        - Answering questions about services
        - Providing travel recommendations
        Be concise and friendly in your responses.`;
    }

    addToHistory(role, content) {
        this.context.conversationHistory.push({ role, content });
        if (this.context.conversationHistory.length > this.context.maxHistory) {
            this.context.conversationHistory.shift();
        }
    }

    async handleActions(userMessage, botReply) {
        // Implement action handling based on message content
        if (userMessage.toLowerCase().includes("book") || 
            userMessage.toLowerCase().includes("reserve")) {
            // Handle booking intent
            await this.handleBookingIntent(userMessage);
        } else if (userMessage.toLowerCase().includes("search") ||
                   userMessage.toLowerCase().includes("find")) {
            // Handle search intent
            await this.handleSearchIntent(userMessage);
        }
    }

    async handleBookingIntent(message) {
        // Implement booking logic
    }

    async handleSearchIntent(message) {
        // Implement search logic
    }
}

module.exports = new SmartChatbot();