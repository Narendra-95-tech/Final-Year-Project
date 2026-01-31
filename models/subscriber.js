const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriberSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    isSubscribed: {
        type: Boolean,
        default: true
    },
    preferences: [{
        type: String,
        enum: ['all', 'listings', 'vehicles', 'dhabas'],
        default: 'all'
    }],
    subscribedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Subscriber", subscriberSchema);
