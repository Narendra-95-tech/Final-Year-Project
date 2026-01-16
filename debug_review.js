const mongoose = require('mongoose');
const Booking = require('./models/booking');
const Review = require('./models/review');
const User = require('./models/user');

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function inspect() {
    await mongoose.connect(dbUrl);
    console.log("Connected to DB");

    const reviewer = await User.findOne({ username: 'reviewer' });
    if (!reviewer) {
        console.log("Reviewer user not found");
        return;
    }
    console.log(`Reviewer ID: ${reviewer._id}`);

    const booking = await Booking.findOne({ user: reviewer._id }).sort({ createdAt: -1 });
    console.log("Latest Booking:", booking);

    const review = await Review.findOne({ author: reviewer._id }).sort({ createdAt: -1 });
    console.log("Latest Review:", review);

    if (booking) {
        booking.status = 'Confirmed';
        await booking.save();
        console.log("Updated Booking Status to 'Confirmed'");
    }

    if (review) {
        await Review.findByIdAndDelete(review._id);
        console.log("Deleted existing review");

        // Also remove from listing reviews array if necessary, but for now just cleaning up the review doc
        // The Listing model reference might still exist, but that's okay for this test
    }

    mongoose.connection.close();
}

inspect();
