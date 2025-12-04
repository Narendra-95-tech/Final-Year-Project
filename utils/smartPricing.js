const openai = require("../openai");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

class SmartPricing {
    async generatePriceSuggestion(type, itemData) {
        try {
            // Gather market data
            const marketData = await this.getMarketData(type, itemData.location);
            
            // Generate AI analysis
            const prompt = this.generatePricingPrompt(type, itemData, marketData);
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            });

            // Parse and validate suggestion
            const suggestion = this.parsePricingSuggestion(response.choices[0].message.content);
            return this.validatePricingSuggestion(suggestion, marketData);
        } catch (error) {
            console.error("Pricing suggestion error:", error);
            return null;
        }
    }

    async getMarketData(type, location) {
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

        // Get average prices in the area
        const similarItems = await Model.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: location.coordinates
                    },
                    $maxDistance: 10000 // 10km radius
                }
            }
        });

        return {
            averagePrice: this.calculateAveragePrice(similarItems),
            priceRange: this.calculatePriceRange(similarItems),
            demandMetrics: await this.getDemandMetrics(type, location)
        };
    }

    calculateAveragePrice(items) {
        if (!items.length) return 0;
        return items.reduce((sum, item) => sum + item.price, 0) / items.length;
    }

    calculatePriceRange(items) {
        if (!items.length) return { min: 0, max: 0 };
        const prices = items.map(item => item.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }

    async getDemandMetrics(type, location) {
        // Implement demand calculation based on bookings and searches
        return {
            seasonalDemand: await this.calculateSeasonalDemand(type, location),
            currentDemand: await this.calculateCurrentDemand(type, location)
        };
    }

    generatePricingPrompt(type, itemData, marketData) {
        return `Generate optimal pricing suggestion for ${type}:
        Item details: ${JSON.stringify(itemData)}
        Market data: ${JSON.stringify(marketData)}
        Consider: location, amenities, competition, demand`;
    }

    parsePricingSuggestion(aiResponse) {
        // Parse AI response into structured pricing data
        try {
            return {
                basePrice: parseFloat(aiResponse.match(/basePrice: (\d+)/)[1]),
                seasonalMultipliers: {
                    peak: 1.3,
                    offPeak: 0.8
                },
                confidenceScore: 0.85
            };
        } catch (error) {
            console.error("Error parsing pricing suggestion:", error);
            return null;
        }
    }

    validatePricingSuggestion(suggestion, marketData) {
        if (!suggestion) return null;

        // Ensure price is within reasonable market range
        const { min, max } = marketData.priceRange;
        suggestion.basePrice = Math.max(min * 0.8, Math.min(max * 1.2, suggestion.basePrice));

        return suggestion;
    }

    async calculateSeasonalDemand(type, location) {
        // Implement seasonal demand calculation
        return 1.0; // Default multiplier
    }

    async calculateCurrentDemand(type, location) {
        // Implement current demand calculation
        return 1.0; // Default multiplier
    }
}

module.exports = new SmartPricing();