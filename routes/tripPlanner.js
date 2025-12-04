const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const ExpressError = require('../utils/ExpressError');

// GET route for the trip planner page
router.get('/', (req, res) => {
    res.render('trip-planner');
});

// Initialize OpenAI client with enhanced configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30 seconds timeout
    maxRetries: 2,
});

// In-memory conversation history (in production, use a database)
const conversationHistory = new Map();

// Helper function to determine if a trip is complete
function isTripComplete(content) {
    // Check if the AI's response indicates the trip is complete
    // This is a simple check - you might want to make it more sophisticated
    const completeIndicators = [
        'enjoy your trip',
        'have a great time',
        'trip summary',
        'itinerary complete',
        'safe travels'
    ];
    
    const lowerContent = content.toLowerCase();
    return completeIndicators.some(indicator => lowerContent.includes(indicator));
}

// Helper function to get system message
const getSystemMessage = () => ({
    role: 'system',
    content: `You are WanderLust AI, a helpful travel assistant specialized in creating detailed travel itineraries. 
    - Always respond in a friendly, conversational tone
    - Provide detailed, personalized travel recommendations
    - Include estimated costs in Indian Rupees (₹)
    - Suggest local experiences and hidden gems
    - Consider budget constraints and preferences
    - Format responses with clear sections and emojis`
});

// Trip planning endpoint with conversation support
router.post('/plan', async (req, res, next) => {
    console.log('Trip planner request received:', {
        body: req.body,
        headers: req.headers,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY
        }
    });
    
    if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key is not configured');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error: Missing API key',
            code: 'MISSING_API_KEY'
        });
    }
    try {
        const { 
            message, 
            conversationId = Date.now().toString(),
            destination,
            duration,
            budget,
            preferences = ''
        } = req.body;

        // Get or initialize conversation history
        if (!conversationHistory.has(conversationId)) {
            conversationHistory.set(conversationId, [getSystemMessage()]);
            
            // If it's the first message, add initial context
            if (destination && duration && budget) {
                conversationHistory.get(conversationId).push({
                    role: 'user',
                    content: `Plan a ${duration} day trip to ${destination} with a budget of ₹${budget}. ${preferences}`
                });
            }
        }

        // Add user message to history if provided
        if (message) {
            conversationHistory.get(conversationId).push({
                role: 'user',
                content: message
            });
        }

        // Get the conversation context
        const messages = conversationHistory.get(conversationId);

        console.log('Sending request to OpenAI with messages:', messages);
        
        // Call OpenAI API with the conversation history
        let response;
        try {
            response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            });
            console.log('Received response from OpenAI');
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate trip plan: ${error.message}`);
        }

        // Get AI response
        const aiResponse = response.choices[0]?.message;
        
        if (!aiResponse || !aiResponse.content) {
            console.error('Invalid response from OpenAI:', response);
            throw new Error('Invalid response from trip planning service');
        }
        
        // Add AI response to conversation history
        conversationHistory.get(conversationId).push(aiResponse);

        // Clean up old conversations (in a production app, use a database with TTL)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        for (const [id, conversation] of conversationHistory.entries()) {
            const lastMessageTime = new Date(conversation[conversation.length - 1]?.timestamp || 0).getTime();
            if (id !== conversationId && lastMessageTime < oneHourAgo) {
                conversationHistory.delete(id);
            }
        }
        if (conversationHistory.size > 100) {
            // Keep only the 50 most recent conversations
            const keys = Array.from(conversationHistory.keys()).slice(-50);
            const newMap = new Map();
            keys.forEach(key => newMap.set(key, conversationHistory.get(key)));
            conversationHistory.clear();
            newMap.forEach((value, key) => conversationHistory.set(key, value));
        }

        // Send response
        console.log('Sending successful response to client');
        res.json({
            success: true,
            data: {
                content: aiResponse.content,
                destination,
                duration,
                budget,
                preferences,
                timestamp: new Date().toISOString()
            },
            conversationId
        });
    } catch (error) {
        console.error('Error in trip planning:', error);
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || 'Failed to generate trip plan';
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            code: error.code || 'TRIP_PLAN_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

module.exports = router;
