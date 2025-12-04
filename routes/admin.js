const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const User = require('../models/user');
const Listing = require('../models/listing');
const Vehicle = require('../models/vehicle');
const Dhaba = require('../models/dhaba');
const Booking = require('../models/booking');
const Review = require('../models/review');

// Admin Dashboard
router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    try {
        // Get counts for dashboard
        const [
            totalUsers,
            totalListings,
            totalVehicles,
            totalDhabas,
            totalBookings,
            recentBookings,
            recentUsers,
            recentReviews
        ] = await Promise.all([
            User.countDocuments(),
            Listing.countDocuments(),
            Vehicle.countDocuments(),
            Dhaba.countDocuments(),
            Booking.countDocuments(),
            Booking.find().sort({ createdAt: -1 }).limit(5).populate('user').populate('listing'),
            User.find().sort({ createdAt: -1 }).limit(5),
            Review.find().sort({ createdAt: -1 }).limit(5).populate('author').populate('listing')
        ]);

        // Calculate revenue (example calculation)
        const bookings = await Booking.find({ status: 'completed' });
        const revenue = bookings.reduce((total, booking) => total + (booking.totalAmount || 0), 0);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            stats: {
                totalUsers,
                totalListings,
                totalVehicles,
                totalDhabas,
                totalBookings,
                revenue: revenue.toFixed(2)
            },
            recentBookings,
            recentUsers,
            recentReviews,
            currentPath: '/admin'
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('error', 'Error loading admin dashboard');
        res.redirect('back');
    }
});

// List all users
router.get('/users', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.render('admin/users', { 
            title: 'Manage Users',
            users,
            currentPath: '/admin/users'
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        req.flash('error', 'Error fetching users');
        res.redirect('/admin');
    }
});

// List all listings
router.get('/listings', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const listings = await Listing.find({}).sort({ createdAt: -1 }).populate('owner');
        res.render('admin/listings', { 
            title: 'Manage Listings',
            listings,
            currentPath: '/admin/listings'
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        req.flash('error', 'Error fetching listings');
        res.redirect('/admin');
    }
});

// List all bookings
router.get('/bookings', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .populate('user')
            .populate('listing');
            
        res.render('admin/bookings', { 
            title: 'Manage Bookings',
            bookings,
            currentPath: '/admin/bookings'
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        req.flash('error', 'Error fetching bookings');
        res.redirect('/admin');
    }
});

// Update booking status
router.put('/bookings/:id/status', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/admin/bookings');
        }
        
        req.flash('success', 'Booking status updated successfully');
        res.redirect('/admin/bookings');
    } catch (error) {
        console.error('Error updating booking status:', error);
        req.flash('error', 'Error updating booking status');
        res.redirect('/admin/bookings');
    }
});

// Toggle user status (active/suspended)
router.put('/users/:id/toggle-status', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }
        
        user.isActive = !user.isActive;
        await user.save();
        
        const status = user.isActive ? 'activated' : 'suspended';
        req.flash('success', `User ${status} successfully`);
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error toggling user status:', error);
        req.flash('error', 'Error updating user status');
        res.redirect('/admin/users');
    }
});

// Delete listing
router.delete('/listings/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        await Listing.findByIdAndDelete(req.params.id);
        req.flash('success', 'Listing deleted successfully');
        res.redirect('/admin/listings');
    } catch (error) {
        console.error('Error deleting listing:', error);
        req.flash('error', 'Error deleting listing');
        res.redirect('/admin/listings');
    }
});

module.exports = router;
