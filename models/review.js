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
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});


module.exports = mongoose.model("Review", reviewSchema);