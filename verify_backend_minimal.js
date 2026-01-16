const mongoose = require('mongoose');
const Booking = require('./models/booking');
const Review = require('./models/review');
const Listing = require('./models/listing');
const User = require('./models/user');
const reviewController = require('./controllers/reviews');

// Mock req/res
const mockRequestWithFlash = (body, params, user) => ({
    body, params, user, files: [],
    originalUrl: '/listings/mock',
    flash: (t, m) => console.log(`[FLASH] ${t}: ${m}`)
});
const mockResponse = () => ({
    status: (c) => ({ json: (d) => ({}), send: (d) => ({}) }),
    redirect: (u) => console.log(`[REDIRECT] ${u}`),
});

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function run() {
    try {
        await mongoose.connect(dbUrl);
        console.log("DB Connected");

        // 1. User
        console.log("Creating User...");
        const user = new User({ email: `test_${Date.now()}@ex.com`, username: `user_${Date.now()}` });
        try {
            await User.register(user, 'p');
        } catch (e) { console.error("User Create Failed", e.message); return; }
        console.log("User Created");

        // 2. Listing
        console.log("Creating Listing...");
        const listing = new Listing({
            title: 'Test List',
            description: 'Desc',
            image: { url: 'u', filename: 'f' },
            owner: user._id,
            price: 100,
            location: 'Loc',
            country: 'Country'
        });
        try {
            await listing.save();
            console.log("Listing Created");
        } catch (e) { console.error("Listing Create Failed", e.message); return; }

        // 2a. Reviewer
        console.log("Creating Reviewer...");
        const reviewer = new User({ email: `rev_${Date.now()}@ex.com`, username: `reviewer_${Date.now()}` });
        try {
            await User.register(reviewer, 'p');
        } catch (e) { console.error("Reviewer Create Failed", e.message); return; }

        // 3. Booking
        console.log("Creating Booking...");
        const booking = new Booking({
            listing: listing._id,
            user: reviewer._id,
            startDate: new Date(),
            endDate: new Date(),
            status: 'Confirmed',
            type: 'listing',
            guests: 1
        });
        try {
            await booking.save();
            console.log("Booking Created");
        } catch (e) { console.error("Booking Create Failed", e.message); return; }

        // 4. Controller Test
        console.log("Testing Controller...");
        const req = mockRequestWithFlash(
            { review: { rating: 5, comment: "Test Rev" } },
            { id: listing._id },
            reviewer
        );
        const res = mockResponse();

        try {
            await reviewController.createReview(req, res);
            console.log("Controller Executed");
        } catch (e) { console.error("Controller Failed", e.message); }

        // 5. Check Result
        const rev = await Review.findOne({ comment: "Test Rev" });
        if (rev) {
            console.log("Review Found. isVerified:", rev.isVerified);
        } else {
            console.log("Review NOT Found");
        }

    } catch (err) {
        console.error("Global Error", err);
    } finally {
        mongoose.connection.close();
    }
}

run();
