const openai = require("../openai");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

async function getPersonalizedRecommendations(user, type, preferences) {
    try {
        const prompt = generateRecommendationPrompt(user, type, preferences);
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const recommendationLogic = response.choices[0].message.content;
        return await executeRecommendations(type, recommendationLogic, preferences);
    } catch (error) {
        console.error("Recommendation error:", error);
        return [];
    }
}

function generateRecommendationPrompt(user, type, preferences) {
    return `Based on user preferences:
    - Past bookings: ${preferences.pastBookings || 'None'}
    - Price range: ${preferences.priceRange || 'Any'}
    - Location: ${preferences.location || 'Any'}
    - Rating minimum: ${preferences.minRating || 'Any'}
    Generate recommendation logic for ${type}`;
}

async function executeRecommendations(type, logic, preferences) {
    let Model;
    switch(type) {
        case 'listing':
            Model = Listing;
            break;
        case 'vehicle':
            Model = Vehicle;
            break;
        case 'dhaba':
            Model = Dhaba;
            break;
        default:
            throw new Error('Invalid type');
    }

    const query = buildRecommendationQuery(preferences);
    return await Model.find(query).limit(5);
}

function buildRecommendationQuery(preferences) {
    const query = {};
    if (preferences.priceRange) {
        query.price = { 
            $gte: preferences.priceRange.min, 
            $lte: preferences.priceRange.max 
        };
    }
    if (preferences.location) {
        query.location = preferences.location;
    }
    if (preferences.minRating) {
        query.rating = { $gte: preferences.minRating };
    }
    return query;
}

module.exports = {
    getPersonalizedRecommendations
};