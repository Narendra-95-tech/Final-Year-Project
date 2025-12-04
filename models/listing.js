const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const Booking = require("./booking.js");
const { ref } = require("joi");


const listingSchema = new Schema({
    title: {
        type :String,
        required: true,
    },
    description: String,
    image: { 
       url:String,
       filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
       {
        type: Schema.Types.ObjectId,
        ref: "Review",
       },
    ],
    bookings: [
       {
        type: Schema.Types.ObjectId,
        ref: "Booking",
       },
    ],
    owner : {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ["Point"], // 'location.type' must be 'Point'
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
    
});

listingSchema.post("findOneAndDelete", async(listing) => {
    if(listing ) {
        await Review.deleteMany({_id : {$in: listing.reviews}});
        await Booking.deleteMany({_id : {$in: listing.bookings}});
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;