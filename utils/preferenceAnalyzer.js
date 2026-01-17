/**
 * PreferenceAnalyzer - Extracts user preferences and travel patterns from chat messages
 */
class PreferenceAnalyzer {
    constructor() {
        this.patterns = {
            budget: {
                keywords: ['cheap', 'budget', 'affordable', 'low cost', 'economical', 'inexpensive', 'under', 'below'],
                category: 'travelStyle',
                value: 'budget'
            },
            luxury: {
                keywords: ['luxury', 'expensive', 'premium', '5 star', 'five star', 'lavish', 'deluxe', 'resort'],
                category: 'travelStyle',
                value: 'luxury'
            },
            adventure: {
                keywords: ['adventure', 'trek', 'hike', 'rafting', 'camping', 'skydiving', 'explore', 'mountain'],
                category: 'travelStyle',
                value: 'adventure'
            },
            relaxation: {
                keywords: ['relax', 'chill', 'spa', 'calm', 'peaceful', 'quiet', 'beach', 'sunset'],
                category: 'travelStyle',
                value: 'relaxation'
            },
            family: {
                keywords: ['family', 'kids', 'children', 'safe', 'park', 'zoo', 'playground'],
                category: 'travelStyle',
                value: 'family'
            },
            beach: {
                keywords: ['beach', 'sea', 'ocean', 'coast', 'sand', 'water sports'],
                category: 'interest',
                value: 'beach'
            },
            nature: {
                keywords: ['nature', 'forest', 'green', 'park', 'wildlife', 'safari', 'lake'],
                category: 'interest',
                value: 'nature'
            },
            city: {
                keywords: ['city', 'urban', 'shopping', 'mall', 'nightlife', 'club', 'market'],
                category: 'interest',
                value: 'city'
            }
        };
    }

    /**
     * Analyze a message to extract preferences
     * @param {string} message - The user's message
     * @returns {Object} Extracted preferences
     */
    analyzeMessage(message) {
        const lowerMsg = message.toLowerCase();
        const extracted = {
            travelStyle: new Set(),
            interests: new Set(),
            budgetHint: null // 'low', 'medium', 'high'
        };

        // Check for keywords
        for (const [key, config] of Object.entries(this.patterns)) {
            if (config.keywords.some(k => lowerMsg.includes(k))) {
                if (config.category === 'travelStyle') {
                    extracted.travelStyle.add(config.value);
                } else if (config.category === 'interest') {
                    extracted.interests.add(config.value);
                }
            }
        }

        // Specific budget analysis
        if (lowerMsg.match(/(?:under|below|<)\s*(\d+)/)) {
            const amount = parseInt(lowerMsg.match(/(?:under|below|<)\s*(\d+)/)[1]);
            if (amount < 4000) extracted.budgetHint = 'low';
            else if (amount > 10000) extracted.budgetHint = 'high';
            else extracted.budgetHint = 'medium';
        }

        return {
            travelStyle: Array.from(extracted.travelStyle),
            interests: Array.from(extracted.interests),
            budgetHint: extracted.budgetHint
        };
    }

    /**
     * Update conversation learnings based on new analysis
     * @param {Object} currentLearnings - Existing learnings from DB
     * @param {Object} newAnalysis - Result from analyzeMessage
     * @returns {Object} Updated learnings object
     */
    updateLearnings(currentLearnings, newAnalysis) {
        const updated = { ...currentLearnings };

        // Initialize if undefined
        if (!updated.travelStyle) updated.travelStyle = {};
        if (!updated.favoriteDestinations) updated.favoriteDestinations = [];

        // Update Travel Style (simple frequency counter could be better, but we'll use latest detected for now)
        if (newAnalysis.travelStyle.length > 0) {
            // Priority: Luxury > Adventure > Budget > Relaxation
            // Or just store the primary style identified
            updated.travelStyle.type = newAnalysis.travelStyle[0];
        }

        // Update Interests (could be added to a list)
        // For simplicity in the schema, we might map these to dietary or other fields, 
        // but let's assume valid fields or just store in a generic 'tags' field if schema allows.
        // The current schema has 'dietaryPreferences' and simple 'travelStyle' string.
        // We might want to expand the schema later.

        // Budget Range
        if (newAnalysis.budgetHint) {
            if (!updated.budgetRange) updated.budgetRange = { min: 0, max: 0 };

            if (newAnalysis.budgetHint === 'low') {
                updated.budgetRange.max = 5000;
            } else if (newAnalysis.budgetHint === 'high') {
                updated.budgetRange.min = 10000;
                updated.budgetRange.max = 50000;
            }
        }

        return updated;
    }
}

module.exports = new PreferenceAnalyzer();
