const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const Booking = require("./booking.js");
const { ref } = require("joi");


const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  // Image gallery support (multiple images)
  images: [{
    url: String,
    filename: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  price: Number,
  location: String,
  country: String,

  // Property details
  propertyType: {
    type: String,
    enum: ['Apartment', 'House', 'Villa', 'Hotel', 'Cottage', 'Cabin', 'Bungalow', 'Guesthouse', 'Resort', 'Other'],
    default: 'Apartment'
  },
  guests: {
    type: Number,
    default: 1,
    min: 1
  },
  bedrooms: {
    type: Number,
    default: 1,
    min: 0
  },
  beds: {
    type: Number,
    default: 1,
    min: 1
  },
  bathrooms: {
    type: Number,
    default: 1,
    min: 0.5
  },

  // Amenities
  amenities: [{
    type: String
  }],

  // Policies and rules
  houseRules: [{
    type: String
  }],
  cancellationPolicy: {
    type: String,
    default: 'Flexible: Full refund 24 hours before check-in'
  },
  safetyGuidelines: [{
    type: String
  }],
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
  owner: {
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

  // Additional metadata
  capacity: {
    type: Number,
    default: function () { return this.guests || 2; }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for Search & Filter Performance
listingSchema.index({ title: 'text', location: 'text', country: 'text' });
listingSchema.index({ price: 1 });
listingSchema.index({ propertyType: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ guests: 1 });
listingSchema.index({ geometry: '2dsphere' }); // Geospatial Index

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ _id: { $in: listing.bookings } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;