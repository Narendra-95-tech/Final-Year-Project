const openai = require("../openai");

class ContentModerator {
    constructor() {
        this.moderationRules = {
            profanity: true,
            hate_speech: true,
            spam: true,
            inappropriate_content: true
        };
    }

    async moderateContent(content, type) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: `Moderate this ${type} content: "${content}". 
                    Check for:
                    - Profanity
                    - Hate speech
                    - Spam/promotional content
                    - Inappropriate content
                    - Personal information
                    Provide a JSON response with flags and suggested actions.`
                }],
                temperature: 0.1
            });

            return this.parseModerationResult(response.choices[0].message.content);
        } catch (error) {
            console.error("Content moderation error:", error);
            return null;
        }
    }

    async moderateImage(imageUrl) {
        try {
            // Implement image moderation using AI vision API
            const response = await openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this image for inappropriate content:" },
                        { type: "image_url", image_url: imageUrl }
                    ]
                }],
                temperature: 0.1
            });

            return this.parseImageModerationResult(response.choices[0].message.content);
        } catch (error) {
            console.error("Image moderation error:", error);
            return null;
        }
    }

    parseModerationResult(aiResponse) {
        try {
            const result = JSON.parse(aiResponse);
            return {
                isApproved: !result.flags.some(flag => flag.severity === 'high'),
                flags: result.flags,
                suggestedActions: result.actions,
                moderationScore: this.calculateModerationScore(result.flags),
                timestamp: new Date()
            };
        } catch (error) {
            console.error("Error parsing moderation result:", error);
            return null;
        }
    }

    parseImageModerationResult(aiResponse) {
        try {
            const result = JSON.parse(aiResponse);
            return {
                isApproved: result.is_appropriate,
                flags: result.concerns,
                suggestedActions: result.recommendations,
                moderationScore: this.calculateModerationScore(result.concerns),
                timestamp: new Date()
            };
        } catch (error) {
            console.error("Error parsing image moderation result:", error);
            return null;
        }
    }

    calculateModerationScore(flags) {
        const weights = {
            profanity: 0.3,
            hate_speech: 0.8,
            spam: 0.4,
            inappropriate_content: 0.6
        };

        return flags.reduce((score, flag) => {
            return score + (weights[flag.type] || 0.5) * flag.confidence;
        }, 0);
    }

    async autoModerateReview(review) {
        const textModeration = await this.moderateContent(review.text, 'review');
        let imageModeration = null;
        if (review.images && review.images.length) {
            imageModeration = await Promise.all(
                review.images.map(img => this.moderateImage(img))
            );
        }

        return {
            reviewId: review._id,
            textModeration,
            imageModeration,
            isApproved: this.getFinalApprovalStatus(textModeration, imageModeration)
        };
    }

    getFinalApprovalStatus(textMod, imageMod) {
        if (!textMod) return false;
        if (!textMod.isApproved) return false;
        if (imageMod && imageMod.some(mod => !mod.isApproved)) return false;
        return true;
    }
}

module.exports = new ContentModerator();