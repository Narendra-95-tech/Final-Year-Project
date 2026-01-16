const mongoose = require('mongoose');
const Booking = require('./models/booking');
const Review = require('./models/review');
const Listing = require('./models/listing');
const User = require('./models/user');
// Mock req, res objects to call the controller directly or just replicate logic?
// Replicating logic is bad, we want to test the actual controller.
// But calling controller requires mocking Express req/res.
// Instead, I will write a script that performs the same logic as the controller to verify the Mongoose queries work as expected,
// OR better: I can just use the models directly to simulate the scenario, determining if the *Verification Logic* which resides in the controller is correct.
// Wait, the verification logic IS in the controller.
// So I should import the controller.

const reviewController = require('./controllers/reviews');

// Mock helpers
const mockRequest = (body, params, user, files = []) => ({
    body,
    params,
    user,
    files,
});

const mockResponse = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    res.redirect = (url) => { res.redirectUrl = url; return res; };
    res.locals = {}; // Flash messages often use locals
    // Mock flash
    return res;
};

// Mock flash middleware (basic)
// In the actual app, req.flash is used.
const mockRequestWithFlash = (body, params, user, files = []) => ({
    body,
    params,
    user,
    files,
    flash: (type, msg) => console.log(`[FLASH] ${type}: ${msg}`),
});


if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function runTest() {
    await mongoose.connect(dbUrl);
    console.log("Connected to DB");

    try {
        // Setup Data
        // 1. Create User
        const user = new User({ email: 'test_backend@example.com', username: 'test_backend' });
        await User.register(user, 'password'); // Salt/hash
        const userId = user._id;

        // 2. Create Listing
        const listing = new Listing({
            title: 'Test Backend Listing',
            description: 'Test Desc',
            image: { url: 'http://e.com/i.jpg', filename: 'i.jpg' },
            owner: userId, // Owner reviews own listing? preventReview checks this.
            // Wait, owner cannot review own listing. Need 2 users.
        });
        await listing.save();

        // Create 2nd User (Reviewer)
        const reviewer = new User({ email: 'reviewer_backend@example.com', username: 'reviewer_backend' });
        await User.register(reviewer, 'password');
        const reviewerId = reviewer._id;


        // Case 1: Verified Review (Confirmed Booking)
        console.log("\n--- Case 1: Verified Review ---");
        const booking1 = new Booking({
            listing: listing._id,
            user: reviewerId,
            startDate: new Date(),
            endDate: new Date(),
            status: 'Confirmed', // KEY
            type: 'listing'
        });
        await booking1.save();

        // Call Controller
        const req1 = mockRequestWithFlash(
            { review: { rating: 5, comment: "Should be verified" } },
            { id: listing._id },
            reviewer, // User object
            [] // Files
        );
        const res1 = mockResponse();

        await reviewController.createReview(req1, res1);

        // Check DB for the review
        const review1 = await Review.findOne({ comment: "Should be verified" });
        if (review1 && review1.isVerified === true) {
            console.log("PASS: Review is Verified.");
        } else {
            console.log("FAIL: Review NOT Verified.", review1);
        }

        // Clean up Review 1
        if (review1) await Review.findByIdAndDelete(review1._id);


        // Case 2: Unverified Review (Pending Booking)
        console.log("\n--- Case 2: Unverified Review (Pending Booking) ---");
        booking1.status = 'Pending';
        await booking1.save();

        const req2 = mockRequestWithFlash(
            { review: { rating: 4, comment: "Should NOT be verified" } },
            { id: listing._id },
            reviewer,
            []
        );
        const res2 = mockResponse();

        await reviewController.createReview(req2, res2);

        const review2 = await Review.findOne({ comment: "Should NOT be verified" });
        if (review2 && review2.isVerified === false) {
            console.log("PASS: Review is defaults to Unverified.");
        } else {
            console.log("FAIL: Review IS Verified incorrectly.", review2);
        }

        // Cleanup
        await User.findByIdAndDelete(userId);
        await User.findByIdAndDelete(reviewerId);
        await Listing.findByIdAndDelete(listing._id);
        await Booking.findByIdAndDelete(booking1._id);
        if (review1) await Review.findByIdAndDelete(review1._id);
        if (review2) await Review.findByIdAndDelete(review2._id);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

runTest();
