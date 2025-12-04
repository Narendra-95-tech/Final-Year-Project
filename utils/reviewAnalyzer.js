const openai = require("../openai");

class ReviewAnalyzer {
    async analyzeSentiment(review) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: `Analyze the sentiment of this review: "${review.text}". 
                    Provide a JSON response with:
                    - sentiment (positive/negative/neutral)
                    - score (-1 to 1)
                    - key_aspects (array of mentioned aspects)
                    - highlights (key positive/negative points)
                    - toxicity_flag (boolean)`
                }],
                temperature: 0.3
            });

            return this.parseAnalysis(response.choices[0].message.content);
        } catch (error) {
            console.error("Sentiment analysis error:", error);
            return null;
        }
    }

    parseAnalysis(aiResponse) {
        try {
            const analysis = JSON.parse(aiResponse);
            return {
                sentiment: analysis.sentiment,
                score: analysis.score,
                keyAspects: analysis.key_aspects,
                highlights: analysis.highlights,
                toxicityFlag: analysis.toxicity_flag,
                timestamp: new Date()
            };
        } catch (error) {
            console.error("Error parsing sentiment analysis:", error);
            return null;
        }
    }

    async batchAnalyzeReviews(reviews) {
        const analyses = [];
        for (const review of reviews) {
            const analysis = await this.analyzeSentiment(review);
            if (analysis) {
                analyses.push({
                    reviewId: review._id,
                    analysis
                });
            }
        }
        return analyses;
    }

    getSentimentSummary(analyses) {
        if (!analyses.length) return null;

        return {
            averageScore: this.calculateAverageScore(analyses),
            sentimentDistribution: this.calculateSentimentDistribution(analyses),
            commonAspects: this.extractCommonAspects(analyses),
            toxicityPercentage: this.calculateToxicityPercentage(analyses)
        };
    }

    calculateAverageScore(analyses) {
        return analyses.reduce((sum, item) => sum + item.analysis.score, 0) / analyses.length;
    }

    calculateSentimentDistribution(analyses) {
        const distribution = {
            positive: 0,
            neutral: 0,
            negative: 0
        };

        analyses.forEach(item => {
            distribution[item.analysis.sentiment]++;
        });

        return distribution;
    }

    extractCommonAspects(analyses) {
        const aspects = {};
        analyses.forEach(item => {
            item.analysis.keyAspects.forEach(aspect => {
                aspects[aspect] = (aspects[aspect] || 0) + 1;
            });
        });

        return Object.entries(aspects)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([aspect, count]) => ({ aspect, count }));
    }

    calculateToxicityPercentage(analyses) {
        const toxicCount = analyses.filter(item => item.analysis.toxicityFlag).length;
        return (toxicCount / analyses.length) * 100;
    }
}

module.exports = new ReviewAnalyzer();