const User = require("../models/user");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");
const Booking = require("../models/booking");
const Subscriber = require("../models/subscriber");
const Review = require("../models/review");

module.exports.renderDashboard = async (req, res) => {
    try {
        const stats = {
            users: await User.countDocuments(),
            listings: await Listing.countDocuments(),
            vehicles: await Vehicle.countDocuments(),
            dhabas: await Dhaba.countDocuments(),
            bookings: await Booking.countDocuments(),
            subscribers: await Subscriber.countDocuments(),
        };

        // Analytics Data for Charts (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueAnalytics = await Booking.aggregate([
            { $match: { paymentStatus: 'Paid', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: { $ifNull: ["$totalPrice", "$amount"] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get Recent Bookings
        const recentBookings = await Booking.find()
            .populate("user", "username email")
            .sort({ createdAt: -1 })
            .limit(5);

        // Get Recent Users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate Total Revenue
        const totalRevenue = await Booking.aggregate([
            { $match: { paymentStatus: 'Paid' } },
            { $group: { _id: null, total: { $sum: { $ifNull: ["$totalPrice", "$amount"] } } } }
        ]);

        res.render("admin/dashboard", {
            stats,
            recentBookings,
            recentUsers,
            revenue: totalRevenue[0] ? totalRevenue[0].total : 0,
            revenueAnalytics: JSON.stringify(revenueAnalytics)
        });
    } catch (e) {
        console.error(e);
        req.flash("error", "Failed to load Admin Dashboard");
        res.redirect("/");
    }
};

// --- Asset Management ---

module.exports.manageVehicles = async (req, res) => {
    const vehicles = await Vehicle.find({}).populate('owner');
    res.render("admin/vehicles", { vehicles, currentPath: '/admin/vehicles' });
};

module.exports.manageDhabas = async (req, res) => {
    const dhabas = await Dhaba.find({}).populate('owner');
    res.render("admin/dhabas", { dhabas, currentPath: '/admin/dhabas' });
};

module.exports.manageReviews = async (req, res) => {
    const reviews = await Review.find({}).populate('author').sort({ createdAt: -1 });
    res.render("admin/reviews", { reviews, currentPath: '/admin/reviews' });
};

module.exports.manageUsers = async (req, res) => {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.render("admin/users", { users, currentPath: '/admin/users' });
};

module.exports.manageListings = async (req, res) => {
    const listings = await Listing.find({}).sort({ createdAt: -1 }).populate('owner');
    res.render("admin/listings", { listings, currentPath: '/admin/listings' });
};

module.exports.manageBookings = async (req, res) => {
    const bookings = await Booking.find({})
        .sort({ createdAt: -1 })
        .populate('user')
        .populate('listing');
    res.render("admin/bookings", { bookings, currentPath: '/admin/bookings' });
};

module.exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body;
    await Booking.findByIdAndUpdate(req.params.id, { status });
    req.flash("success", "Booking status updated");
    res.redirect("/admin/bookings");
};

module.exports.toggleUserStatus = async (req, res) => {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    req.flash("success", `User ${user.isActive ? 'activated' : 'suspended'}`);
    res.redirect("/admin/users");
};

module.exports.deleteListing = async (req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted");
    res.redirect("/admin/listings");
};

module.exports.deleteVehicle = async (req, res) => {
    await Vehicle.findByIdAndDelete(req.params.id);
    req.flash("success", "Vehicle deleted successfully");
    res.redirect("/admin/vehicles");
};

module.exports.deleteDhaba = async (req, res) => {
    await Dhaba.findByIdAndDelete(req.params.id);
    req.flash("success", "Dhaba deleted successfully");
    res.redirect("/admin/dhabas");
};

module.exports.deleteReview = async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    req.flash("success", "Review removed successfully");
    res.redirect("/admin/reviews");
};
