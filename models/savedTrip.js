const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const savedTripSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true
    },
    budget: {
        type: Number,
        required: true
    },
    preferences: {
        type: String,
        trim: true
    },
    // Full AI-generated itinerary content (markdown/text)
    content: {
        type: String,
        required: true
    },
    // Parsed structured data if available
    structuredPlan: {
        type: Schema.Types.Mixed
    },
    // Quick summary stats
    estimatedCost: String,
    travelers: Number,
    emoji: {
        type: String,
        default: '✈️'
    },
    // User metadata
    isPublic: {
        type: Boolean,
        default: false
    },
    shareToken: {
        type: String,
        unique: true,
        sparse: true
    },
    tags: [String]
}, {
    timestamps: true
});

// Create share token on demand
savedTripSchema.methods.generateShareToken = function () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 10; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.shareToken = token;
    return token;
};

module.exports = mongoose.model('SavedTrip', savedTripSchema);
