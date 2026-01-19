const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const Booking = require("./booking.js");

const dhabaSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: [
        {
            url: String,
            filename: String,
        }
    ],
    price: {
        type: Number,
        required: true,
        min: 0
    },
    location: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    // Dhaba-specific fields
    cuisine: {
        type: String,
        enum: ['North Indian', 'South Indian', 'Punjabi', 'Chinese', 'Multi-Cuisine', 'Street Food', 'Rajasthani', 'Gujarati', 'Bengali', 'Continental'],
        required: true,
    },
    category: {
        type: String,
        enum: ['Fine Dining', 'Casual Dining', 'Fast Food', 'Cafe', 'Food Truck', 'Buffet', 'Family Restaurant'],
        required: true,
    },
    establishedYear: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear(),
    },
    operatingHours: {
        opens: {
            type: String,
            required: true,
        },
        closes: {
            type: String,
            required: true,
        },
        isOpen24Hours: {
            type: Boolean,
            default: false,
        },
    },
    specialties: [String], // Signature dishes
    facilities: [String], // AC, parking, wifi, etc.
    phone: {
        type: String,
        required: true,
    },
    email: String,
    website: String,
    isVegetarian: {
        type: Boolean,
        default: false,
    },
    isVegan: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4.0
    },
    // Detailed ratings
    detailedRatings: {
        foodTaste: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        hygiene: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        service: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        ambience: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        }
    },
    // Menu items
    menuItems: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        price: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            enum: ['Starters', 'Main Course', 'Breads', 'Rice', 'Desserts', 'Beverages', 'Snacks', 'Specials'],
            required: true
        },
        isVegetarian: {
            type: Boolean,
            default: true
        },
        isVegan: Boolean,
        isSignatureDish: {
            type: Boolean,
            default: false
        },
        image: {
            url: String,
            filename: String
        },
        spiceLevel: {
            type: String,
            enum: ['Mild', 'Medium', 'Hot', 'Extra Hot']
        },
        preparationTime: Number, // in minutes
        isAvailable: {
            type: Boolean,
            default: true
        },
        calories: Number,
        allergens: [String]
    }],
    // Table booking
    tables: {
        totalTables: {
            type: Number,
            default: 10
        },
        availableTables: {
            type: Number,
            default: 10
        },
        tableTypes: [{
            type: {
                type: String,
                enum: ['2-seater', '4-seater', '6-seater', '8-seater', 'Private Room']
            },
            count: Number,
            pricePerHour: Number
        }]
    },
    // Popularity tracking
    totalOrders: {
        type: Number,
        default: 0
    },
    weeklyOrders: {
        type: Number,
        default: 0
    },
    monthlyOrders: {
        type: Number,
        default: 0
    },
    lastOrderDate: Date,
    popularityScore: {
        type: Number,
        default: 0
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
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
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: false,
        },
        coordinates: {
            type: [Number],
            required: false,
        },
    },
});

// Indexes for Search & Filter Performance
dhabaSchema.index({ title: 'text', location: 'text', cuisine: 'text' });
dhabaSchema.index({ category: 1 });
dhabaSchema.index({ cuisine: 1 });
dhabaSchema.index({ rating: -1 }); // Optimize for top-rated
dhabaSchema.index({ price: 1 }); // Optimize price filters
dhabaSchema.index({ owner: 1 }); // Optimize owner lookups
dhabaSchema.index({ cuisine: 1, category: 1, rating: -1 }); // Compound index for common filters
dhabaSchema.index({ geometry: '2dsphere' });

dhabaSchema.post("findOneAndDelete", async (dhaba) => {
    if (dhaba) {
        await Review.deleteMany({ _id: { $in: dhaba.reviews } });
        await Booking.deleteMany({ _id: { $in: dhaba.bookings } });
    }
});

const Dhaba = mongoose.model("Dhaba", dhabaSchema);
module.exports = Dhaba;
