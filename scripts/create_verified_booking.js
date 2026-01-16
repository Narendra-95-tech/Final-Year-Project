const mongoose = require('mongoose');
const Listing = require('../models/listing');
const User = require('../models/user');
const Booking = require('../models/booking');

// Connect to DB (Same logic as app.js)
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(dbUrl);
    console.log("Connected to DB");

    const demoUser = await User.findOne({ username: 'demo' });
    if (!demoUser) {
        console.log("Demo user not found!");
        process.exit(1);
    }

    const listing = await Listing.findOne({}); // Get the first listing
    if (!listing) {
        console.log("No listings found!");
        process.exit(1);
    }

    console.log(`Creating verified booking for User: ${demoUser.username} on Listing: ${listing.title}`);

    // Check if booking already exists
    const existing = await Booking.findOne({
        user: demoUser._id,
        listing: listing._id,
        status: 'Confirmed'
    });

    if (existing) {
        console.log("Confirmed booking already exists.");
    } else {
        const booking = new Booking({
            user: demoUser._id,
            listing: listing._id,
            type: 'listing',
            status: 'Confirmed',
            guests: 2,
            totalPrice: 5000,
            startDate: new Date(),
            endDate: new Date()
        });
        await booking.save();
        console.log("Confirmed booking created!");
    }

    console.log(`Target URL: http://localhost:8080/listings/${listing._id}`);

    // Also create one for Dhaba for completeness if needed, but Listing is enough for verification.
}

main().then(() => {
    mongoose.connection.close();
}).catch(err => {
    console.error(err);
    mongoose.connection.close();
});
