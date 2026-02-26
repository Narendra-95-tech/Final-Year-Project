const User = require("../models/user");
const Booking = require("../models/booking");
const Listing = require("../models/listing.js");
const Vehicle = require("../models/vehicle.js");
const Dhaba = require("../models/dhaba.js");
const wrapAsync = require("../utils/wrapAsync");

// Render Payout / Earnings Dashboard
module.exports.renderDashboard = wrapAsync(async (req, res) => {
    const userId = req.user._id;

    // 1. Find all listings/vehicles/dhabas owned by this user
    const [listings, vehicles, dhabas] = await Promise.all([
        Listing.find({ owner: userId }).select('_id title'),
        require("../models/vehicle").find({ owner: userId }).select('_id brand model'),
        require("../models/dhaba").find({ owner: userId }).select('_id title')
    ]);

    const listingIds = listings.map(l => l._id);
    const vehicleIds = vehicles.map(v => v._id);
    const dhabaIds = dhabas.map(d => d._id);

    // 2. Fetch all PAID bookings for those items (earnings)
    const earnedBookings = await Booking.find({
        $or: [
            { listing: { $in: listingIds } },
            { vehicle: { $in: vehicleIds } },
            { dhaba: { $in: dhabaIds } }
        ],
        paymentStatus: 'Paid',
        status: 'Confirmed'
    })
        .populate('listing', 'title image')
        .populate('vehicle', 'brand model image')
        .populate('dhaba', 'title image')
        .populate('user', 'username email fullName')
        .sort({ createdAt: -1 });

    // 3. Pending bookings (confirmed but payment pending — e.g., UPI manual pending review)
    const pendingBookings = await Booking.find({
        $or: [
            { listing: { $in: listingIds } },
            { vehicle: { $in: vehicleIds } },
            { dhaba: { $in: dhabaIds } }
        ],
        status: 'Confirmed',
        paymentStatus: 'Pending'
    })
        .populate('listing', 'title')
        .populate('vehicle', 'brand model')
        .populate('dhaba', 'title')
        .populate('user', 'username email fullName');

    // 4. Calculate stats
    const totalEarned = earnedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const platformFee = Math.round(totalEarned * 0.10); // 10% platform commission
    const netEarnings = totalEarned - platformFee;
    const pendingAmount = pendingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // 5. Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyData = {};

    earnedBookings
        .filter(b => new Date(b.createdAt) >= sixMonthsAgo)
        .forEach(b => {
            const month = new Date(b.createdAt).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
            monthlyData[month] = (monthlyData[month] || 0) + (b.totalPrice || 0);
        });

    // 6. Breakdown by type
    const byType = {
        listing: earnedBookings.filter(b => b.type === 'listing').reduce((s, b) => s + (b.totalPrice || 0), 0),
        vehicle: earnedBookings.filter(b => b.type === 'vehicle').reduce((s, b) => s + (b.totalPrice || 0), 0),
        dhaba: earnedBookings.filter(b => b.type === 'dhaba').reduce((s, b) => s + (b.totalPrice || 0), 0),
    };

    res.render("users/payouts", {
        user: req.user,
        earnedBookings: earnedBookings.slice(0, 10), // last 10 for table
        pendingBookings,
        totalEarned,
        platformFee,
        netEarnings,
        pendingAmount,
        monthlyData,
        byType,
        totalBookings: earnedBookings.length,
        hasListings: listings.length > 0 || vehicles.length > 0 || dhabas.length > 0
    });
});

// Update Payout UPI
module.exports.updateUPI = wrapAsync(async (req, res) => {
    const { upiId } = req.body;
    if (!upiId) {
        req.flash("error", "UPI ID cannot be empty");
        return res.redirect("/payouts/dashboard");
    }

    await User.findByIdAndUpdate(req.user._id, { payoutUPI: upiId });
    req.flash("success", "Payout UPI ID updated successfully! 💸");
    res.redirect("/payouts/dashboard");
});

// Connect Bank Account
module.exports.connectBank = wrapAsync(async (req, res) => {
    const { holderName, accountNumber, ifscCode, bankName } = req.body;

    if (!holderName || !accountNumber || !ifscCode) {
        req.flash("error", "Please fill all required bank details");
        return res.redirect("/payouts/dashboard");
    }

    const bankDetails = {
        accountHolderName: holderName,
        accountNumber: accountNumber,
        ifscCode: ifscCode,
        bankName: bankName || "Connected Bank",
        isVerified: true,
        connectedAt: new Date()
    };

    await User.findByIdAndUpdate(req.user._id, { bankDetails });
    req.flash("success", "Bank Account connected successfully! You're now ready for direct payouts. 🏦✨");
    res.redirect("/payouts/dashboard");
});

// Stub: kept for backward compat
module.exports.createConnectAccount = wrapAsync(async (req, res) => {
    req.flash("info", "Earnings are tracked automatically when guests pay for your listings.");
    res.redirect("/payouts/dashboard");
});
