const OpenAI = require('openai');
const Listing = require('../models/listing');
const Vehicle = require('../models/vehicle');
const Dhaba = require('../models/dhaba');
const { getDistance, geocodeLocation, getTravelTime } = require('./location');

// Initialize OpenAI with API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a trip plan using AI
 * @param {string} query - Natural language query (e.g., "Plan a 3-day trip to Manali under ₹10,000")
 * @param {object} user - User object for personalization
 * @returns {object} - Structured trip plan
 */
async function generateTripPlan(query, user = {}) {
    try {
        // Step 1: Extract key information from the query using AI
        const extractionPrompt = `Extract the following information from this travel query in JSON format: 
        {"destination": "city or place name", "duration": "number of days", "budget": "budget in INR", "travelers": "number of people", "interests": ["list", "of", "interests"]}
        
        Query: ${query}`;

        const extractionResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: extractionPrompt }],
            temperature: 0.3,
        });

        const tripDetails = JSON.parse(extractionResponse.choices[0].message.content);
        
        // Get coordinates for the destination
        const destinationCoords = await geocodeLocation(tripDetails.destination);
        
        // Calculate date range for the trip
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (parseInt(tripDetails.duration) || 3));
        
        // Format dates for display
        const formatDate = (date) => {
            return date.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        };

        // Step 2: Find relevant listings, vehicles, and dhabas near the destination
        const [listings, vehicles, dhabas] = await Promise.all([
            Listing.find({ 
                location: { 
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [destinationCoords.lng, destinationCoords.lat]
                        },
                        $maxDistance: 50000 // 50km radius
                    }
                }
            })
            .limit(10)
            .populate('reviews')
            .lean(),
            
            Vehicle.find({ 
                location: { 
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [destinationCoords.lng, destinationCoords.lat]
                        },
                        $maxDistance: 50000 // 50km radius
                    }
                },
                available: true
            })
            .limit(5)
            .populate('reviews')
            .lean(),
            
            Dhaba.find({ 
                location: { 
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [destinationCoords.lng, destinationCoords.lat]
                        },
                        $maxDistance: 20000 // 20km radius
                    }
                },
                'openingHours.openNow': true
            })
            .limit(15)
            .populate('reviews')
            .lean()
        ]);

        // Step 3: Generate a detailed itinerary using AI
        const itineraryPrompt = `Create a detailed ${tripDetails.duration || 3}-day trip plan for ${tripDetails.travelers || 2} people to ${tripDetails.destination || 'the destination'} with a budget of ₹${tripDetails.budget || 'flexible'}. 
        
        Trip Details:
        - Destination: ${tripDetails.destination}
        - Duration: ${tripDetails.duration || 3} days
        - Travelers: ${tripDetails.travelers || 2} people
        - Budget: ₹${tripDetails.budget || 'Flexible'}
        - Interests: ${tripDetails.interests ? tripDetails.interests.join(', ') : 'Not specified'}
        
        Available Accommodations (${listings.length}):
        ${listings.slice(0, 5).map((l, i) => `${i+1}. ${l.title} - ₹${l.price}/night (${l.rating || 'No'} reviews)`).join('\n')}
        
        Available Vehicles (${vehicles.length}):
        ${vehicles.slice(0, 5).map((v, i) => `${i+1}. ${v.name} - ₹${v.pricePerDay}/day (${v.type})`).join('\n')}
        
        Available Restaurants (${dhabas.length}):
        ${dhabas.slice(0, 5).map((d, i) => `${i+1}. ${d.name} - ${d.cuisineType || 'Multi-cuisine'} (${d.averageRating ? d.averageRating + '★' : 'No ratings'})`).join('\n')}
        
        Create a detailed itinerary with the following structure for each day:
        - Morning activities
        - Lunch
        - Afternoon activities
        - Dinner
        - Evening activities
        - Recommended transportation between locations
        
        Format the response as JSON with this structure:
        {
            "summary": "Brief trip overview",
            "totalEstimatedCost": "Total estimated cost in INR",
            "startDate": "DD/MM/YYYY",
            "endDate": "DD/MM/YYYY",
            "destination": "Destination name",
            "travelers": number,
            "budget": "Budget in INR",
            "days": [
                {
                    "day": 1,
                    "date": "DD/MM/YYYY",
                    "activities": [
                        {
                            "time": "HH:MM",
                            "type": "activity/meal/transport",
                            "title": "Activity/Meal/Transport name",
                            "description": "Detailed description",
                            "location": "Location name",
                            "duration": "Duration in hours",
                            "cost": "Estimated cost in INR per person",
                            "transportToNext": "Transportation details to next activity"
                        }
                    ]
                }
            ],
            "accommodationRecommendations": [
                {
                    "id": "listing_id",
                    "name": "Accommodation name",
                    "type": "Hotel/Resort/Homestay",
                    "pricePerNight": 1000,
                    "rating": 4.5,
                    "amenities": ["WiFi", "Pool", "Restaurant"],
                    "image": "image_url"
                }
            ],
            "transportationRecommendations": [
                {
                    "id": "vehicle_id",
                    "name": "Vehicle name",
                    "type": "Car/Bike/Scooter",
                    "pricePerDay": 1500,
                    "seats": 4,
                    "image": "image_url"
                }
            ],
            "diningRecommendations": [
                {
                    "id": "dhaba_id",
                    "name": "Restaurant name",
                    "cuisine": "Cuisine type",
                    "averageCostForTwo": 500,
                    "rating": 4.2,
                    "specialtyDishes": ["Dish 1", "Dish 2"],
                    "image": "image_url"
                }
            ]
        }`;

        const itineraryResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: itineraryPrompt }],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        let itinerary;
        try {
            // Try to parse the response content as JSON
            const responseContent = itineraryResponse.choices[0].message.content;
            // Clean up the response if it's not valid JSON
            const cleanJson = responseContent
                .replace(/```json\n|```/g, '')  // Remove markdown code block markers
                .replace(/([{\s*])\s*'/g, '$1"')  // Replace single quotes with double quotes
                .replace(/\'/g, "'")  // Un-escape single quotes in text
                .replace(/,\s*([}\]])/g, '$1');  // Remove trailing commas
                
            itinerary = JSON.parse(cleanJson);
        } catch (e) {
            console.error('Error parsing AI response:', e);
            throw new Error('Failed to generate valid trip plan: ' + e.message);
        }

        // Add metadata and real data references
        itinerary.metadata = {
            generatedAt: new Date().toISOString(),
            destinationCoords,
            query,
            userId: user._id
        };
        
        // Add real data references if not already included
        if (!itinerary.accommodationRecommendations?.length && listings.length) {
            itinerary.accommodationRecommendations = listings.slice(0, 3).map(l => ({
                id: l._id,
                name: l.title,
                type: l.type || 'Accommodation',
                pricePerNight: l.price,
                rating: l.rating || 0,
                amenities: l.amenities || [],
                image: l.images?.[0] || ''
            }));
        }
        
        if (!itinerary.transportationRecommendations?.length && vehicles.length) {
            itinerary.transportationRecommendations = vehicles.slice(0, 3).map(v => ({
                id: v._id,
                name: v.name,
                type: v.type || 'Vehicle',
                pricePerDay: v.pricePerDay,
                seats: v.seats || 2,
                image: v.images?.[0] || ''
            }));
        }
        
        if (!itinerary.diningRecommendations?.length && dhabas.length) {
            itinerary.diningRecommendations = dhabas.slice(0, 5).map(d => ({
                id: d._id,
                name: d.name,
                cuisine: d.cuisineType || 'Multi-cuisine',
                averageCostForTwo: d.averageCostForTwo || 0,
                rating: d.averageRating || 0,
                specialtyDishes: d.specialtyDishes || [],
                image: d.images?.[0] || ''
            }));
        }
        
        // Ensure dates are properly formatted
        if (!itinerary.startDate) {
            itinerary.startDate = formatDate(startDate);
        }
        if (!itinerary.endDate) {
            itinerary.endDate = formatDate(endDate);
        }
        
        // Add travel time estimates between activities
        if (itinerary.days?.length) {
            for (const day of itinerary.days) {
                if (day.activities?.length > 1) {
                    for (let i = 0; i < day.activities.length - 1; i++) {
                        const currentActivity = day.activities[i];
                        const nextActivity = day.activities[i + 1];
                        
                        // Only calculate if locations are different
                        if (currentActivity.location && nextActivity.location && 
                            currentActivity.location !== nextActivity.location) {
                            try {
                                const travelInfo = await getTravelTime(
                                    { lat: destinationCoords.lat, lng: destinationCoords.lng },
                                    { lat: destinationCoords.lat, lng: destinationCoords.lng },
                                    'driving'
                                );
                                
                                // Add travel time to the next activity
                                currentActivity.transportToNext = {
                                    mode: 'Car',
                                    duration: travelInfo.duration,
                                    distance: travelInfo.distance.toFixed(1) + ' km'
                                };
                            } catch (e) {
                                console.error('Error calculating travel time:', e);
                            }
                        }
                    }
                }
            }
        }

        return itinerary;
    } catch (error) {
        console.error('Error generating trip plan:', error);
        throw new Error('Failed to generate trip plan: ' + error.message);
    }
}

module.exports = {
    generateTripPlan
};
