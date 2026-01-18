const mongoose = require('mongoose');
const Booking = require('../../models/booking');
const Listing = require('../../models/listing');
const User = require('../../models/user');

// Load env vars
require('dotenv').config({ path: '../../.env' });

const MONGO_URL = process.env.ATLASDB_URL;

async function verifyUpiFlow() {
    console.log("🚀 Starting UPI Payment Verification...");

    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ Connected to Database");

        // 1. Get a Demo User & Listing
        const user = await User.findOne({ username: 'demo' }); // Adjust if your demo user is different
        if (!user) throw new Error("Demo user not found");

        const listing = await Listing.findOne({});
        if (!listing) throw new Error("No listings found");

        console.log(`👤 User: ${user.username}`);
        console.log(`🏠 Listing: ${listing.title}`);

        // 2. Create a Dummy Pending Booking
        // In a real app, we'd use the controller, but here we simulate the DB state
        const booking = new Booking({
            user: user._id,
            listing: listing._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // tomorrow
            totalPrice: 1500,
            status: 'Pending',
            paymentStatus: 'Pending',
            guests: 2,
            type: 'listing'
        });
        await booking.save();
        console.log(`📝 Created Pending Booking: ${booking._id}`);

        // 3. Simulate UPI Payment Request (as if hitting proper route)
        // We'll mimic the Logic from routes/bookings.js:267
        const paymentReference = "TEST_UTR_" + Date.now();
        console.log(`💳 Paying with UTR: ${paymentReference}`);

        // Update booking as the route would
        booking.paymentStatus = 'Paid';
        booking.isPaid = true;
        booking.status = 'Confirmed';
        booking.paymentMethod = 'UPI';
        booking.paymentDetails = {
            utr: paymentReference,
            mode: 'UPI_MANUAL',
            timestamp: new Date()
        };
        await booking.save();

        // 4. Verification
        const refreshedBooking = await Booking.findById(booking._id);
        if (refreshedBooking.status === 'Confirmed' && refreshedBooking.isPaid) {
            console.log("✅ VERIFICATION SUCCESS: Booking is Confirmed via UPI!");
        } else {
            console.error("❌ VERIFICATION FAILED: Booking status mismatch.");
        }

        // Cleanup
        await Booking.findByIdAndDelete(booking._id);
        console.log("🧹 Cleaned up test booking");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyUpiFlow();
