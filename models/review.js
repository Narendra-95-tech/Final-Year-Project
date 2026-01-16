const mongoose = require("mongoose");
// const { create } = require("./listing");
const { string } = require("joi");
const Schema = mongoose.Schema;


const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    // Detailed rating categories
    ratings: {
        cleanliness: {
            type: Number,
            min: 1,
            max: 5,
            default: function () { return this.rating; }
        },
        accuracy: {
            type: Number,
            min: 1,
            max: 5,
            default: function () { return this.rating; }
        },
        checkin: {
            type: Number,
            min: 1,
            max: 5,
            default: function () { return this.rating; }
        },
        communication: {
            type: Number,
            min: 1,
            max: 5,
            default: function () { return this.rating; }
        },
        location: {
            type: Number,
            min: 1,
            max: 5,
            default: function () { return this.rating; }
        },
        value: {
            type: Number,
            min: 1,
            max: 5,
            default: function () { return this.rating; }
        }
    },
    images: [{
        url: String,
        filename: String
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    // Parent References for My Reviews Dashboard
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing"
    },
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: "Vehicle"
    },
    dhaba: {
        type: Schema.Types.ObjectId,
        ref: "Dhaba"
    },
    modelType: {
        type: String,
        enum: ['Listing', 'Vehicle', 'Dhaba']
    }
}, {
    timestamps: true
});


module.exports = mongoose.model("Review", reviewSchema);