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
  createOrder: createRazorpayOrder,
  verifyPayment: verifyRazorpayPayment,
} = require("../controllers/razorpayController");

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
    const { type, listingId, vehicleId, dhabaId, startDate, endDate, date, time, guests, message } = req.body;

    // Basic validation
    if (!type) {
      return res.status(400).json({ success: false, message: "Booking type is required" });
    }

    // ✅ SECURITY FIX: Recalculate price SERVER-SIDE — never trust frontend price!
    let serverCalculatedPrice = 0;

    let bookingData = {
      user: req.user._id,
      status: 'Pending',
      paymentStatus: 'Pending',
      type: type,
      guests: guests || 1,
      message: message || '',
    };

    // Specific logic per type
    if (type === 'listing') {
      if (!listingId || !startDate || !endDate) return res.status(400).json({ success: false, message: 'Missing fields for listing booking' });
      const listing = await Listing.findById(listingId);
      if (!listing) throw new Error('Listing not found');
      if (listing.owner.equals(req.user._id)) throw new Error('Cannot book your own listing');

      // ✅ Calculate price from DB, not from user input
      const start = new Date(startDate);
      const end = new Date(endDate);
      const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      serverCalculatedPrice = listing.price * nights;

      bookingData.listing = listingId;
      bookingData.startDate = start;
      bookingData.endDate = end;

    } else if (type === 'vehicle') {
      if (!vehicleId || !startDate || !endDate) return res.status(400).json({ success: false, message: 'Missing fields for vehicle booking' });
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');

      // ✅ Calculate price from DB
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      serverCalculatedPrice = (vehicle.pricePerDay || vehicle.price) * days;

      bookingData.vehicle = vehicleId;
      bookingData.startDate = start;
      bookingData.endDate = end;

    } else if (type === 'dhaba') {
      if (!dhabaId || !date || !time) return res.status(400).json({ success: false, message: 'Missing fields for dhaba booking' });
      const dhaba = await Dhaba.findById(dhabaId);
      if (!dhaba) throw new Error('Dhaba not found');

      // ✅ Use dhaba's price * guests from DB
      serverCalculatedPrice = dhaba.price * (parseInt(guests) || 1);

      bookingData.dhaba = dhabaId;
      bookingData.date = new Date(date);
      bookingData.time = time;
    }

    // ✅ Always use the server-calculated price
    bookingData.amount = serverCalculatedPrice;
    bookingData.totalPrice = serverCalculatedPrice;

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

// ==========================================
// RAZORPAY PAYMENT ROUTES
// ==========================================
// 1. Create a Razorpay Order
router.post("/razorpay/create-order", isLoggedIn, createRazorpayOrder);
// 2. Verify payment after user pays on Razorpay popup
router.post("/razorpay/verify-payment", isLoggedIn, verifyRazorpayPayment);

// Stripe Success & Cancel Routes
router.get("/success", isLoggedIn, handleSuccess);
router.get("/cancel", isLoggedIn, handleCancel);
router.post("/verify", isLoggedIn, verifyPayment);

// Processing Route (Intermediate from Stripe)
router.get("/processing", isLoggedIn, (req, res) => {
  const { session_id, booking_id } = req.query;
  if (!booking_id) return res.redirect('/bookings');
  res.render("bookings/processing", { booking: { _id: booking_id }, sessionId: session_id });
});

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

    // ✅ SECURITY FIX: Only the booking owner can pay with wallet
    if (!booking.user || booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: This is not your booking" });
    }

    // ✅ Prevent double-payment
    if (booking.isPaid || booking.status === 'Confirmed') {
      return res.status(400).json({ success: false, message: "This booking is already paid" });
    }

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
    const booking = await Booking.findById(id)
      .populate({ path: 'listing', populate: { path: 'owner' } })
      .populate({ path: 'vehicle', populate: { path: 'owner' } })
      .populate({ path: 'dhaba', populate: { path: 'owner' } })
      .populate('user');

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // ✅ SECURITY: Only the booking owner can pay for it
    if (!booking.user || booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: This is not your booking" });
    }

    // ✅ Prevent double-payment
    if (booking.isPaid || booking.status === 'Confirmed') {
      return res.status(400).json({ success: false, message: "This booking is already paid" });
    }

    // ✅ SECURITY: Validate UTR format (UPI reference is 12 digits)
    if (!paymentReference || !/^[A-Za-z0-9]{8,35}$/.test(paymentReference.trim())) {
      return res.status(400).json({ success: false, message: "Invalid Payment Reference (UTR). Please enter the correct UTR from your UPI app." });
    }

    // ✅ SECURITY FIX: Mark as PENDING VERIFICATION, not instantly Confirmed.
    // Admin must verify the UTR manually before confirming.
    // This prevents fake/made-up UTR numbers from bypassing payment.
    booking.paymentStatus = 'Pending Verification';
    booking.isPaid = false;  // NOT paid until admin confirms
    booking.status = 'Pending';  // NOT confirmed until admin verifies
    booking.paymentMethod = 'UPI';
    booking.paymentId = paymentReference.trim(); // Store UTR for admin to verify
    booking.paymentDate = new Date();

    await booking.save();

    // Trigger notifications (Email)
    try {
      const { sendBookingConfirmation, sendPaymentReceipt, sendOwnerBookingAlert } = require('../utils/emailService');
      const Notification = require('../models/notification');

      if (booking.user && booking.user.email) {
        sendBookingConfirmation(booking, booking.user).catch(e => console.error('Guest email failed:', e.message));
        sendPaymentReceipt(booking, booking.user).catch(e => console.error('Receipt failed:', e.message));
      }

      // Notify Owner
      const item = booking.listing || booking.dhaba || booking.vehicle;
      if (item && item.owner) {
        if (item.owner.email) {
          sendOwnerBookingAlert(booking, item.owner, booking.user).catch(e => console.error('Owner alert failed:', e.message));
        }

        const itemTitle = item.title || (item.brand + ' ' + item.model);
        Notification.createNotification(
          item.owner._id || item.owner,
          booking.user._id,
          'booking',
          {
            content: `received a new UPI payment for ${itemTitle}`,
            link: `/bookings/${booking._id}`,
            metadata: { bookingId: booking._id }
          }
        ).catch(e => console.error('In-app notification failed:', e.message));
      }
      console.log('📧 UPI Payment notifications triggered for booking:', booking._id);
    } catch (e) {
      console.error("UPI Notification Error:", e.message);
    }

    res.json({
      success: true,
      message: "UPI reference submitted. Your booking is pending admin verification.",
      status: "Pending Verification",
      redirectUrl: `/bookings/${booking._id}`
    });

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

    // ✅ SECURITY FIX: Use role-based check, not req.user.isAdmin (which doesn't exist)
    if (!booking.user || (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
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