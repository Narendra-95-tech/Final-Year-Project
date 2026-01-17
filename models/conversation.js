const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system', 'function'],
            required: true
        },
        content: String,
        functionCall: {
            name: String,
            arguments: String
        },
        functionName: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    context: {
        lastLocation: String,
        preferences: {
            priceRange: { min: Number, max: Number },
            amenities: [String],
            vehicleType: String,
            cuisine: [String]
        }
    },
    learnings: {
        favoriteDestinations: [String],
        budgetRange: { min: Number, max: Number },
        travelStyle: {
            type: String,
            enum: ['budget', 'luxury', 'adventure', 'relaxation']
        },
        dietaryPreferences: [String],
        repeatedSearches: [{
            query: String,
            count: { type: Number, default: 1 }
        }]
    },
    metadata: {
        totalMessages: { type: Number, default: 0 },
        functionsUsed: [String],
        lastActive: { type: Date, default: Date.now }
    }
}, { timestamps: true });

// Index for faster queries
conversationSchema.index({ user: 1, 'metadata.lastActive': -1 });

// Method to add a message
conversationSchema.methods.addMessage = function (role, content, functionCall = null, functionName = null) {
    this.messages.push({ role, content, functionCall, functionName });
    this.metadata.totalMessages += 1;
    this.metadata.lastActive = new Date();

    // Keep only last 20 messages to prevent document from growing too large
    if (this.messages.length > 20) {
        this.messages = this.messages.slice(-20);
    }

    return this.save();
};

// Method to get recent messages
conversationSchema.methods.getRecentMessages = function (limit = 8) {
    return this.messages.slice(-limit);
};

module.exports = mongoose.model('Conversation', conversationSchema);
