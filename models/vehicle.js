const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const Booking = require("./booking.js");

const vehicleSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    images: [
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
    // Vehicle-specific fields
    vehicleType: {
        type: String,
        enum: ['car', 'bike', 'van', 'truck', 'scooter'],
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid'],
        required: true,
    },
    transmission: {
        type: String,
        enum: ['manual', 'automatic'],
        required: true,
    },
    seats: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    mileage: {
        type: String, // km/liter or km per charge
    },
    features: [String], // AC, GPS, etc.
    availability: {
        type: Boolean,
        default: true,
    },
    // Booking availability tracking
    bookedDates: [{
        startDate: Date,
        endDate: Date,
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: "Booking"
        }
    }],
    // Pricing
    pricePerHour: Number,
    pricePerDay: Number,
    pricePerWeek: Number,
    securityDeposit: {
        type: Number,
        default: 0
    },
    // Additional details
    registrationNumber: String,
    insuranceValid: {
        type: Boolean,
        default: true
    },
    lastServiceDate: Date,
    totalTrips: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
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
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: false,
        },
        coordinates: {
            type: [Number],
            required: false,
        },
    },

});

vehicleSchema.post("findOneAndDelete", async (vehicle) => {
    if (vehicle) {
        await Review.deleteMany({ _id: { $in: vehicle.reviews } });
        await Booking.deleteMany({ _id: { $in: vehicle.bookings } });
    }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
