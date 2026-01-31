const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middleware');
const User = require('../models/user');
const Listing = require('../models/listing');
const Vehicle = require('../models/vehicle');
const Dhaba = require('../models/dhaba');
const Booking = require('../models/booking');
const Review = require('../models/review');

const adminController = require('../controllers/admin');

// Admin Dashboard
router.get('/', isLoggedIn, isAdmin, adminController.renderDashboard);

// List all users
router.get('/users', isLoggedIn, isAdmin, adminController.manageUsers);

// List all listings
router.get('/listings', isLoggedIn, isAdmin, adminController.manageListings);

// List all bookings
router.get('/bookings', isLoggedIn, isAdmin, adminController.manageBookings);

// Update booking status
router.put('/bookings/:id/status', isLoggedIn, isAdmin, adminController.updateBookingStatus);

// Toggle user status (active/suspended)
router.put('/users/:id/toggle-status', isLoggedIn, isAdmin, adminController.toggleUserStatus);

// Delete listing
router.delete('/listings/:id', isLoggedIn, isAdmin, adminController.deleteListing);

// List all vehicles
router.get('/vehicles', isLoggedIn, isAdmin, adminController.manageVehicles);

// List all dhabas
router.get('/dhabas', isLoggedIn, isAdmin, adminController.manageDhabas);

// List all reviews
router.get('/reviews', isLoggedIn, isAdmin, adminController.manageReviews);

// Delete vehicle
router.delete('/vehicles/:id', isLoggedIn, isAdmin, adminController.deleteVehicle);

// Delete dhaba
router.delete('/dhabas/:id', isLoggedIn, isAdmin, adminController.deleteDhaba);

// Delete review
router.delete('/reviews/:id', isLoggedIn, isAdmin, adminController.deleteReview);

module.exports = router;
