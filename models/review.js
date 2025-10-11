const mongoose = require("mongoose");
// const { create } = require("./listing");
const { string } = require("joi");
const Schema = mongoose.Schema;


const reviewSchema = new Schema ({
    comment : {
        type:String,
        required:true
    },
    rating: {
        type: Number,
        min:  1,
        max: 5,
        required:true

    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    author: {
        type:Schema.Types.ObjectId,
        ref: "User"
    }
});


module.exports = mongoose.model("Review", reviewSchema);