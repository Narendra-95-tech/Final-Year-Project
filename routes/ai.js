const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const smartChatbot = require("../utils/smartChatbot");
const recommendations = require("../utils/recommendations");
const smartPricing = require("../utils/smartPricing");
const reviewAnalyzer = require("../utils/reviewAnalyzer");
const contentModerator = require("../utils/contentModerator");
const { generateTripPlan } = require("../utils/aiTripPlanner");
const Listing = require("../models/listing");
const Dhaba = require("../models/dhaba");
const Vehicle = require("../models/vehicle");
const { getDistance, geocodeLocation, getTravelTime } = require("../utils/location");
const axios = require('axios');

// Environment variables for API keys
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

// AI Assistant endpoints
router.post("/assistant/message", isLoggedIn, async (req, res) => {
    try {
        const { message, location, context = [] } = req.body;
        const userId = req.user._id;
        
        // Process the message with context
        const response = await processAssistantMessage(message, userId, location, context);
        
        res.json({
            reply: response.reply,
            suggestions: response.suggestions,
            data: response.data,
            type: response.type || 'text'
        });
    } catch (error) {
        console.error('AI Assistant error:', error);
        res.status(500).json({ 
            error: "Sorry, I encountered an error processing your request." 
        });
    }
});

// Get nearby places based on location and type
router.get("/assistant/nearby", isLoggedIn, async (req, res) => {
    try {
        const { latitude, longitude, type, radius = 10 } = req.query;
        
        if (!latitude || !longitude || !type) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        
        let results = [];
        const location = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
        const maxDistance = parseFloat(radius) * 1000; // Convert km to meters
        
        switch (type) {
            case 'hotels':
                results = await Listing.find({
                    location: {
                        $near: {
                            $geometry: location,
                            $maxDistance: maxDistance
                        }
                    },
                    available: true
                }).limit(10);
                break;
                
            case 'dhabas':
                results = await Dhaba.find({
                    location: {
                        $near: {
                            $geometry: location,
                            $maxDistance: maxDistance
                        }
                    }
                }).limit(10);
                break;
                
            case 'vehicles':
                results = await Vehicle.find({
                    available: true,
                    'location.coordinates': {
                        $near: {
                            $geometry: location,
                            $maxDistance: maxDistance
                        }
                    }
                }).limit(10);
                break;
                
            default:
                return res.status(400).json({ error: "Invalid place type" });
        }
        
        res.json({ results });
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        res.status(500).json({ error: "Failed to fetch nearby places" });
    }
});

// Get weather information for a location
router.get("/assistant/weather", isLoggedIn, async (req, res) => {
    try {
        const { latitude, longitude, city } = req.query;
        let weatherData;
        
        if (city) {
            // Get weather by city name
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
            );
            weatherData = response.data;
        } else if (latitude && longitude) {
            // Get weather by coordinates
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
            );
            weatherData = response.data;
        } else {
            return res.status(400).json({ error: "Location data required" });
        }
        
        // Format the weather data
        const weatherInfo = {
            location: weatherData.name,
            temperature: Math.round(weatherData.main.temp),
            condition: weatherData.weather[0].main,
            description: weatherData.weather[0].description,
            icon: `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
            sunrise: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString(),
            sunset: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()
        };
        
        res.json(weatherInfo);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: "Failed to fetch weather information" });
    }
});

// Process image with AI (for landmark recognition, etc.)
router.post("/assistant/process-image", isLoggedIn, async (req, res) => {
    try {
        // In a real implementation, you would process the image here
        // For now, we'll return a mock response
        res.json({
            success: true,
            landmarks: [
                {
                    name: "Taj Mahal",
                    confidence: 0.95,
                    description: "An ivory-white marble mausoleum on the right bank of the river Yamuna in the Indian city of Agra.",
                    location: {
                        name: "Agra, Uttar Pradesh, India",
                        coordinates: [78.0421, 27.1750]
                    },
                    imageUrl: "https://example.com/taj-mahal.jpg"
                }
            ]
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: "Failed to process image" });
    }
});

// Helper function to process assistant messages
async function processAssistantMessage(message, userId, location = null, context = []) {
    // Convert message to lowercase for easier matching
    const lowerMessage = message.toLowerCase();
    
    // Check for specific intents
    if (lowerMessage.includes('trip') || lowerMessage.includes('vacation') || lowerMessage.includes('holiday')) {
        // Handle trip planning
        const tripPlan = await generateTripPlan(message, { _id: userId });
        return {
            reply: tripPlan.summary,
            type: 'trip_plan',
            data: tripPlan,
            suggestions: [
                { text: 'Show me hotels', action: 'find_hotels' },
                { text: 'Find flights', action: 'find_flights' },
                { text: 'Create itinerary', action: 'create_itinerary' }
            ]
        };
    } 
    
    // Handle dhaba/restaurant queries
    else if (lowerMessage.includes('dhaba') || lowerMessage.includes('restaurant') || lowerMessage.includes('food')) {
        let locationText = '';
        if (location) {
            locationText = ` near ${location.name || 'your location'}`;
        }
        
        return {
            reply: `I can help you find great dhabas${locationText}. Here are some top-rated options:`,
            type: 'dhaba_list',
            action: 'find_dhabas',
            data: { location },
            suggestions: [
                { text: 'Show on map', action: 'show_on_map' },
                { text: 'Filter by cuisine', action: 'filter_cuisine' },
                { text: 'Show reviews', action: 'show_reviews' }
            ]
        };
    }
    
    // Handle vehicle rental queries
    else if (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('rent')) {
        return {
            reply: 'I can help you find available vehicles for rent. What type of vehicle are you looking for?',
            type: 'vehicle_rental',
            suggestions: [
                { text: 'Economy Cars', action: 'find_vehicles', params: { type: 'economy' } },
                { text: 'SUVs', action: 'find_vehicles', params: { type: 'suv' } },
                { text: 'Luxury Cars', action: 'find_vehicles', params: { type: 'luxury' } }
            ]
        };
    }
    
    // Handle weather queries
    else if (lowerMessage.includes('weather')) {
        return {
            reply: 'I can check the weather for you. Please share your location or specify a city.',
            type: 'weather',
            action: 'get_weather',
            requiresLocation: true
        };
    }
    
    // Default response for general queries
    return {
        reply: `I'm here to help with your travel plans! You asked: "${message}". ` +
               `I can help you plan trips, find dhabas, rent vehicles, and more. ` +
               `What would you like to do?`,
        type: 'text',
        suggestions: [
            { text: 'Plan a trip', action: 'plan_trip' },
            { text: 'Find dhabas', action: 'find_dhabas' },
            { text: 'Rent a car', action: 'rent_car' },
            { text: 'Check weather', action: 'check_weather' }
        ]
    };
}

// Export the router
module.exports = router;

// Recommendations endpoints
router.get("/recommendations/:type", isLoggedIn, async (req, res) => {
    try {
        const recommendations = await recommendations.getPersonalizedRecommendations(
            req.user,
            req.params.type,
            req.query
        );
        res.json({ recommendations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get recommendations" });
    }
});

// Smart pricing endpoints
router.post("/pricing/suggest", isLoggedIn, async (req, res) => {
    try {
        const suggestion = await smartPricing.generatePriceSuggestion(
            req.body.type,
            req.body.itemData
        );
        res.json({ suggestion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate price suggestion" });
    }
});

// Review analysis endpoints
router.post("/reviews/analyze", isLoggedIn, async (req, res) => {
    try {
        const analysis = await reviewAnalyzer.analyzeSentiment(req.body.review);
        res.json({ analysis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to analyze review" });
    }
});

// Content moderation endpoints
router.post("/moderate/content", isLoggedIn, async (req, res) => {
    try {
        const result = await contentModerator.moderateContent(
            req.body.content,
            req.body.type
        );
        res.json({ result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to moderate content" });
    }
});

router.post("/moderate/image", isLoggedIn, async (req, res) => {
    try {
        const result = await contentModerator.moderateImage(req.body.imageUrl);
        res.json({ result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to moderate image" });
    }
});

// AI Trip Planner endpoints
router.post('/trip/plan', isLoggedIn, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        const tripPlan = await generateTripPlan(query, req.user);
        res.json(tripPlan);
    } catch (error) {
        console.error('Error generating trip plan:', error);
        res.status(500).json({ error: 'Failed to generate trip plan', details: error.message });
    }
});

// Voice search endpoint
router.post('/voice/search', isLoggedIn, async (req, res) => {
    try {
        const { audioData } = req.body;
        // In a real implementation, you would process the audio data here
        // and convert it to text using a speech-to-text service
        // For now, we'll just echo back the request
        res.json({ 
            query: 'Find dhabas near Pune under ₹500', // This would be the transcribed text
            results: [] // This would be the search results
        });
    } catch (error) {
        console.error('Error processing voice search:', error);
        res.status(500).json({ error: 'Failed to process voice search' });
    }
});

// Image search endpoint
router.post('/image/search', isLoggedIn, async (req, res) => {
    try {
        const { imageUrl } = req.body;
        // In a real implementation, you would process the image here
        // and use computer vision to identify the location
        // For now, we'll just return a mock response
        res.json({
            identifiedLocation: 'Taj Mahal, Agra',
            similarPlaces: [
                { name: 'Taj Mahal', type: 'Landmark', location: 'Agra, India' },
                { name: 'Agra Fort', type: 'Landmark', location: 'Agra, India' },
                { name: 'Fatehpur Sikri', type: 'Landmark', location: 'Agra, India' }
            ]
        });
    } catch (error) {
        console.error('Error processing image search:', error);
        res.status(500).json({ error: 'Failed to process image search' });
    }
});

module.exports = router;