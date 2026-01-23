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

  // Availability Management
  unavailableDates: [{
    type: Date
  }],

  // Advanced Availability Features
  pricingVariations: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      default: 'Custom Pricing'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  recurringBlocks: [{
    type: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true
    },
    pattern: [{
      type: Number,
      required: true
    }], // For weekly: 0-6 (Sun-Sat), For monthly: 1-31 (day of month)
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: 'Recurring Block'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  availabilitySettings: {
    minStay: {
      type: Number,
      default: 1,
      min: 1
    },
    maxStay: {
      type: Number,
      default: 365,
      min: 1
    },
    advanceNotice: {
      type: Number,
      default: 0,
      min: 0
    }, // days in advance required for booking
    preparationTime: {
      type: Number,
      default: 0,
      min: 0
    } // days needed between bookings for cleaning/prep
  },

  // Additional metadata
  capacity: {
    type: Number,
    default: function () { return this.guests || 2; }
  },
  isTrending: {
    type: Boolean,
    default: false
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
listingSchema.index({ owner: 1 }); // Optimize owner lookups
listingSchema.index({ unavailableDates: 1 }); // Optimize availability queries
listingSchema.index({ propertyType: 1, price: 1, guests: 1 }); // Compound index for common filters
listingSchema.index({ geometry: '2dsphere' }); // Geospatial Index

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ _id: { $in: listing.bookings } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;