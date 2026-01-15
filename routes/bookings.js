const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const Dhaba = require("../models/dhaba");
const Vehicle = require("../models/vehicle");
const User = require("../models/user");
const { isLoggedIn, isAdmin, isEmailVerified } = require("../middleware");

// Import Controllers
const {
  createListingBooking,
  checkListingAvailability,
  createCheckoutSession,
  handleSuccess,
  handleCancel,
} = require("../controllers/listingsBookings");

const {
  createVehicleBooking,
  checkVehicleAvailability,
} = require("../controllers/vehiclesBookings");

const {
  createDhabaBooking,
  checkAvailability,
  verifyPayment,
  getUserBookings,
  getAdminBookings,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  bulkDeleteBookings,
  showBooking,
} = require("../controllers/dhabaBookings");

const MERCHANT_VPA = "wanderlust@upi"; // Replace with real VPA
const MERCHANT_NAME = "WanderLust Booking";

// ==========================================
// 1. INITIATION & CREATION ROUTES
// ==========================================

// Centralized Initiate Route (Used by Listing/Vehicle/Dhaba Booking Widgets)
router.post("/initiate", isLoggedIn, isEmailVerified, async (req, res) => {
  try {
    const { type, listingId, vehicleId, dhabaId, startDate, endDate, date, time, guests, totalPrice, message } = req.body;

    // Basic validation
    if (!type) {
      return res.status(400).json({ success: false, message: "Booking type is required" });
    }

    let bookingData = {
      user: req.user._id,
      status: 'Pending',
      paymentStatus: 'Pending',
      type: type,
      guests: guests || 1,
      message: message || '',
      amount: totalPrice, // Trusted from frontend for initialization, but should ideally be recalculated
      totalPrice: totalPrice
    };

    // Specific logic per type
    if (type === 'listing') {
      if (!listingId || !startDate || !endDate) return res.status(400).json({ success: false, message: 'Missing fields for listing booking' });
      bookingData.listing = listingId;
      bookingData.startDate = new Date(startDate);
      bookingData.endDate = new Date(endDate);

      // Add to user/listing later or now? Usually simpler to just save Booking.
      // Syncing arrays (listing.bookings) usually happens on confirmation or here.
      // Let's do it here to reserve the slot (conceptually).
      const listing = await Listing.findById(listingId);
      if (!listing) throw new Error('Listing not found');
      if (listing.owner.equals(req.user._id)) throw new Error('Cannot book your own listing');

    } else if (type === 'vehicle') {
      if (!vehicleId || !startDate || !endDate) return res.status(400).json({ success: false, message: 'Missing fields for vehicle booking' });
      bookingData.vehicle = vehicleId;
      bookingData.startDate = new Date(startDate);
      bookingData.endDate = new Date(endDate);

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');

    } else if (type === 'dhaba') {
      if (!dhabaId || !date || !time) return res.status(400).json({ success: false, message: 'Missing fields for dhaba booking' });
      bookingData.dhaba = dhabaId;
      bookingData.date = new Date(date);
      bookingData.time = time;

      const dhaba = await Dhaba.findById(dhabaId);
      if (!dhaba) throw new Error('Dhaba not found');
    }

    const booking = new Booking(bookingData);
    await booking.save();

    // Add booking to parent entity references
    if (type === 'listing') {
      await Listing.findByIdAndUpdate(listingId, { $push: { bookings: booking._id } });
    } else if (type === 'vehicle') {
      await Vehicle.findByIdAndUpdate(vehicleId, { $push: { bookings: booking._id } });
    } else if (type === 'dhaba') {
      await Dhaba.findByIdAndUpdate(dhabaId, { $push: { bookings: booking._id } });
    }

    res.json({
      success: true,
      bookingId: booking._id,
      redirectUrl: `/bookings/${booking._id}/confirm`
    });

  } catch (error) {
    console.error("Booking initiation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate booking"
    });
  }
});

// ==========================================
// 1.5 DHABA SPECIFIC ENDPOINTS (Legacy/Direct)
// ==========================================
router.post("/dhabas/:id/availability", isLoggedIn, checkAvailability);
router.post("/dhabas/:id/book", isLoggedIn, createDhabaBooking);

// ==========================================
// 2. PAYMENT & CONFIRMATION ROUTES
// ==========================================

// Confirm Page (Intermediate Step)
router.get("/:id/confirm", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('listing')
      .populate('vehicle')
      .populate('dhaba')
      .populate('user'); // Populate user for context if needed

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/listings");
    }

    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized");
      return res.redirect("/listings");
    }

    if (booking.isPaid || booking.status === 'Confirmed') {
      req.flash("success", "This booking is already confirmed.");
      return res.redirect(`/bookings/${booking._id}`);
    }

    res.render("bookings/payment", {
      booking,
      currUser: req.user,
      merchantVpa: MERCHANT_VPA,
      merchantName: MERCHANT_NAME
    });
  } catch (error) {
    console.error("Error rendering confirm page:", error);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
});

// Pay Now (Redirect to Payment Page)
router.post("/:id/pay", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/bookings");
    }

    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized");
      return res.redirect("/bookings");
    }

    if (booking.isPaid || booking.status === 'Confirmed') {
      req.flash("success", "This booking is already paid");
      return res.redirect(`/bookings/${booking._id}`);
    }

    // Redirect to payment confirmation page
    res.redirect(`/bookings/${booking._id}/confirm`);
  } catch (error) {
    console.error("Error processing pay request:", error);
    req.flash("error", "Something went wrong");
    res.redirect("/bookings");
  }
});

// Pay with Card (Stripe Checkout)
router.post("/create-checkout-session", isLoggedIn, createCheckoutSession);

// Stripe Success & Cancel Routes
router.get("/success", isLoggedIn, handleSuccess);
router.get("/cancel", isLoggedIn, handleCancel);

// Pay with Wallet
router.post("/:id/pay-wallet", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('listing')
      .populate('vehicle')
      .populate('dhaba')
      .populate('user');
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Real Wallet Logic
    const user = await User.findById(req.user._id);

    if (user.walletBalance < booking.totalPrice) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    user.walletBalance -= booking.totalPrice;
    await user.save();

    booking.paymentStatus = 'Paid';
    booking.isPaid = true;
    booking.status = 'Confirmed';
    booking.paymentMethod = 'Wallet';
    booking.paidWithWallet = true; // Explicitly flag for refund logic
    booking.paymentDate = new Date();
    await booking.save();

    // Send confirmation emails
    if (booking.user && booking.user.email) {
      try {
        const { sendBookingConfirmation, sendPaymentReceipt } = require('../utils/emailService');
        sendBookingConfirmation(booking, booking.user).catch(err => console.error('Email failed:', err.message));
        sendPaymentReceipt(booking, booking.user).catch(err => console.error('Receipt failed:', err.message));
        console.log('📧 Sending emails to:', booking.user.email);
      } catch (error) {
        console.error('Email service error:', error.message);
      }
    }

    res.json({ success: true, redirectUrl: `/bookings/success?bookingId=${booking._id}` });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Wallet payment failed" });
  }
});

// Pay with UPI
router.post("/:id/pay-upi", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReference } = req.body;
    const booking = await Booking.findById(id).populate('listing').populate('vehicle').populate('dhaba');
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // In valid manual flow, we record the UTR
    if (!paymentReference) {
      return res.status(400).json({ success: false, message: "Payment Reference (UTR) is required" });
    }

    booking.paymentStatus = 'Paid';
    booking.isPaid = true;
    booking.status = 'Confirmed';
    booking.paymentMethod = 'UPI';
    booking.paymentDetails = {
      ...booking.paymentDetails,
      utr: paymentReference,
      mode: 'UPI_MANUAL',
      timestamp: new Date()
    }; // Assuming schema supports this, otherwise just added properties
    await booking.save();

    res.json({ success: true, redirectUrl: `/bookings/${booking._id}` });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "UPI payment failed" });
  }
});

// ==========================================
// 3. ADMIN & MANAGEMENT ROUTES
// ==========================================

router.get("/admin", isLoggedIn, isAdmin, getAdminBookings);
router.post("/admin/:bookingId/status", isLoggedIn, isAdmin, updateBookingStatus);

// ==========================================
// 4. GENERAL BOOKING ROUTES
// ==========================================

// User's bookings list (must be before /:id route)
router.get("/", isLoggedIn, getUserBookings);
router.post("/:id/cancel", isLoggedIn, cancelBooking);
router.delete("/bulk", isLoggedIn, bulkDeleteBookings);
router.delete("/:id", isLoggedIn, deleteBooking);

// Generic Show Route (Must be last)
router.get("/:id", isLoggedIn, showBooking);

// Download Invoice Route
router.get("/:id/invoice", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const { generateBookingInvoice } = require('../utils/pdfService');

    const booking = await Booking.findById(id)
      .populate('user')
      .populate('listing')
      .populate('vehicle')
      .populate('dhaba');

    if (!booking) {
      req.flash("error", "Booking not found.");
      return res.redirect("/bookings");
    }

    // Security: Only owner or admin can download
    if (!booking.user || (booking.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin)) {
      req.flash("error", "You do not have permission to download this invoice.");
      return res.redirect("/listings");
    }

    const pdfBuffer = await generateBookingInvoice(booking);

    const fileName = `WanderLust-Invoice-${booking._id.toString().slice(-8).toUpperCase()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF Download Error:", err);
    req.flash("error", "Failed to generate invoice.");
    res.redirect("back");
  }
});

module.exports = router;