const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const Dhaba = require("../models/dhaba");
const { isLoggedIn, isAdmin } = require("../middleware");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not configured in environment variables');
}

const {
  createListingBooking,
  checkListingAvailability,
} = require("../controllers/listingsBookings");

const {
  createVehicleBooking,
  checkVehicleAvailability,
} = require("../controllers/vehiclesBookings");

const {
  createDhabaBooking,
  checkAvailability,
  handleSuccess,
  handleCancel,
  verifyPayment,
  getUserBookings,
  getAdminBookings,
  updateBookingStatus,
} = require("../controllers/dhabaBookings");

// Test endpoint to verify request handling
router.get('/test-endpoint', (req, res) => {
  console.log('Test endpoint hit');
  res.json({
    success: true,
    message: 'Test endpoint working',
    body: req.body,
    headers: req.headers
  });
});

// Create a new booking and redirect to Stripe checkout
router.post("/create-checkout-session", isLoggedIn, async (req, res) => {
  try {
    console.log('=== NEW BOOKING REQUEST ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Raw body:', req.body);
    console.log('Request method:', req.method);
    console.log('Content-Type header:', req.get('Content-Type'));
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe not configured');
      return res.status(500).json({
        success: false,
        error: 'STRIPE_NOT_CONFIGURED'
      });
    }

    // First check if this is a pre-created booking
    const { bookingId } = req.body;
    let existingBooking;

    if (bookingId) {
      // If bookingId is provided, load the existing booking
      existingBooking = await Booking.findById(bookingId)
        .populate('listing')
        .populate('vehicle')
        .populate('dhaba');

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
          error: 'BOOKING_NOT_FOUND'
        });
      }

      // Use the booking details for the Stripe session
      const itemTitle = existingBooking.type === 'listing' ? existingBooking.listing?.title :
        existingBooking.type === 'vehicle' ? existingBooking.vehicle?.title :
          existingBooking.dhaba?.title;

      if (!itemTitle) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking details',
          error: 'INVALID_BOOKING'
        });
      }

      // Create description based on booking type
      let description;
      if (existingBooking.type === 'listing') {
        description = `${itemTitle} - ${existingBooking.nights || 1} night(s) for ${existingBooking.guests} guest(s)`;
      } else if (existingBooking.type === 'vehicle') {
        const days = Math.ceil((new Date(existingBooking.endDate) - new Date(existingBooking.startDate)) / (1000 * 60 * 60 * 24));
        description = `${itemTitle} - ${days} day(s) rental`;
      } else if (existingBooking.type === 'dhaba') {
        description = `${itemTitle} - Table for ${existingBooking.guests} guest(s)`;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: {
              name: itemTitle,
              description: description
            },
            unit_amount: Math.round(existingBooking.totalPrice * 100), // Convert to paisa
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/bookings/cancel`,
        metadata: {
          bookingId: existingBooking._id.toString(),
          userId: req.user._id.toString(),
          type: existingBooking.type
        },
        customer_email: req.user.email
      });

      // Update booking with session ID
      existingBooking.stripeSessionId = session.id;
      await existingBooking.save();

      return res.json({
        success: true,
        url: session.url,
        bookingId: existingBooking._id
      });
    }

    // If no bookingId, validate required fields for direct booking
    const { type, listingId, startDate, endDate, guests, time, date, pickupLocation } = req.body;

    const missingFields = [];
    if (!type) missingFields.push('type');
    if (!listingId) missingFields.push('listingId');

    // Validate fields based on booking type
    switch (type) {
      case 'listing':
        if (!startDate) missingFields.push('startDate');
        if (!endDate) missingFields.push('endDate');
        if (!guests) missingFields.push('guests');
        break;
      case 'vehicle':
        if (!startDate) missingFields.push('startDate');
        if (!endDate) missingFields.push('endDate');
        if (!pickupLocation) missingFields.push('pickupLocation');
        break;
      case 'dhaba':
        if (!date) missingFields.push('date');
        if (!time) missingFields.push('time');
        if (!guests) missingFields.push('guests');
        break;
    }

    if (missingFields.length > 0) {
      console.error('Missing required fields:', {
        receivedFields: req.body,
        missingFields: missingFields
      });
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'MISSING_FIELDS',
        missingFields,
        receivedFields: req.body
      });
    }

    // Validate dates for all booking types
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD',
        error: 'INVALID_DATE_FORMAT'
      });
    }

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past',
        error: 'INVALID_START_DATE'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
        error: 'INVALID_DATE_RANGE'
      });
    }

    // Validate number of guests
    if (guests < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of guests must be at least 1',
        error: 'INVALID_GUEST_COUNT'
      });
    }

    // Find the listing based on type
    let listing;
    let Model;
    switch (type) {
      case 'vehicle':
        Model = require('../models/vehicle');
        listing = await Model.findById(listingId);
        break;
      case 'dhaba':
        Model = require('../models/dhaba');
        listing = await Model.findById(listingId);
        break;
      default:
        Model = require('../models/listing');
        listing = await Model.findById(listingId);
    }

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found`
      });
    }

    // Prevent owner from booking their own item
    if (listing.owner && listing.owner.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: `You cannot book your own ${type}!`,
        error: 'OWNER_BOOKING_RESTRICTED'
      });
    }

    // Calculate price based on type
    let subtotal, tax, platformFee, totalPrice, description;
    let bookingData = {
      user: req.user._id,
      [type]: listingId,
      type,
      guests: guests || 1,
      status: 'Pending'
    };

    // Calculate duration for all booking types
    const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (duration < 1) {
      return res.status(400).json({
        success: false,
        message: 'Booking duration must be at least 1 day',
        error: 'INVALID_DURATION'
      });
    }

    const nights = duration; // Maintain compatibility with existing code

    // Calculate prices consistently for all types
    subtotal = listing.price * duration * guests; // Base price * duration * number of guests
    tax = subtotal * 0.18; // 18% GST for all types
    platformFee = subtotal * 0.05; // 5% platform fee for all types
    totalPrice = subtotal + tax + platformFee;

    // Common booking data for all types
    bookingData.startDate = startDate;
    bookingData.endDate = endDate;
    bookingData.totalPrice = totalPrice;
    bookingData.duration = duration;
    bookingData.guests = guests;

    // Type-specific details and descriptions
    if (type === 'listing') {
      description = `${listing.title} - ${duration} night(s) for ${guests} guest(s)`;
      bookingData.nights = duration; // Keep for backward compatibility
    } else if (type === 'vehicle') {
      description = `${listing.brand} ${listing.model} (${listing.vehicleType}) - ${duration} day(s)`;
      bookingData.pickupLocation = pickupLocation;
    } else if (type === 'dhaba') {
      description = `${listing.title} - ${duration} day(s) for ${guests} guest(s)`;
    }

    // Create booking
    const booking = new Booking(bookingData);
    await booking.save();

    // Log before creating session
    console.log('Creating Stripe session with params:', {
      totalPrice,
      nights: booking.nights,
      listingTitle: listing.title,
      bookingId: booking._id,
      userId: req.user._id,
      customerEmail: req.user.email
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: listing.title || (type === 'vehicle' ? `${listing.brand} ${listing.model}` : 'Booking'),
            description: description,
            images: listing.image?.url ? [listing.image.url] : undefined
          },
          unit_amount: Math.round(Math.max(totalPrice, 1) * 100), // Convert to paisa, ensure minimum of 1
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/bookings/cancel`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        type: type
      },
      customer_email: req.user.email
    });

    // Update booking with session ID
    booking.stripeSessionId = session.id;
    await booking.save();

    console.log('Checkout session created:', session.id);
    res.json({
      success: true,
      url: session.url,
      bookingId: booking._id
    });
  } catch (error) {
    console.error('Stripe checkout error:', {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code,
      param: error.param,
      detail: error.detail
    });

    let errorMessage = 'Failed to create checkout session';
    if (error.type === 'StripeCardError') {
      errorMessage = 'Your card was declined';
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid payment request';
    } else if (error.code === 'currency_not_supported') {
      errorMessage = 'Currency not supported';
    }

    // Delete the booking if payment failed
    try {
      await Booking.findByIdAndDelete(booking._id);
    } catch (deleteError) {
      console.error('Failed to delete booking after payment error:', deleteError);
    }

    return res.status(500).json({
      error: errorMessage,
      details: error.message
    });
  }
});

router.post("/listings/:id/book", isLoggedIn, createListingBooking);
router.post("/listings/:id/availability", checkListingAvailability);

router.post("/vehicles/:id/book", isLoggedIn, createVehicleBooking);
router.post("/vehicles/:id/availability", checkVehicleAvailability);

router.post("/dhabas/:id/book", isLoggedIn, createDhabaBooking);
router.post("/dhabas/:id/availability", checkAvailability);

// Stripe Webhook for Payment Success
// --------------------
router.get('/success', isLoggedIn, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.redirect('/bookings');
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== 'paid') {
      return res.redirect('/bookings?payment=failed');
    }

    // Find and update the booking
    const booking = await Booking.findById(session.metadata.bookingId);
    if (!booking) {
      return res.redirect('/bookings?error=booking_not_found');
    }

    // Verify the booking belongs to the logged-in user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.redirect('/bookings?error=unauthorized');
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentId = session.payment_intent;
    await booking.save();

    // Redirect to booking confirmation page
    res.redirect(`/bookings/${booking._id}`);
  } catch (error) {
    console.error('Payment success error:', error);
    res.redirect('/bookings?error=payment_error');
  }
});

// --------------------
// Handle Cancelled Payments
// --------------------
router.get('/cancel', isLoggedIn, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session && session.metadata.bookingId) {
        // Optionally update the booking status to cancelled
        await Booking.findByIdAndUpdate(session.metadata.bookingId, {
          status: 'cancelled',
          paymentStatus: 'cancelled'
        });
      }
    }
    res.redirect('/bookings?payment=cancelled');
  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.redirect('/bookings?error=cancellation_failed');
  }
});

router.get("/", isLoggedIn, getUserBookings);
router.get("/user", isLoggedIn, getUserBookings); // Keep for backward compatibility

// Pay Now for existing booking
router.post("/:id/pay", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('listing').populate('vehicle').populate('dhaba');

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/bookings");
    }

    // Verify ownership
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You do not have permission to pay for this booking");
      return res.redirect("/bookings");
    }

    if (booking.isPaid) {
      req.flash("success", "This booking is already paid");
      return res.redirect("/bookings");
    }

    // Determine details based on type
    let itemTitle, description, image;
    if (booking.type === 'listing' && booking.listing) {
      itemTitle = booking.listing.title;
      description = `${itemTitle} - ${booking.nights || 1} night(s)`;
      image = booking.listing.image?.url;
    } else if (booking.type === 'vehicle' && booking.vehicle) {
      itemTitle = `${booking.vehicle.brand} ${booking.vehicle.model}`;
      description = `${itemTitle} - Rental`;
      image = booking.vehicle.image?.url;
    } else if (booking.type === 'dhaba' && booking.dhaba) {
      itemTitle = booking.dhaba.title;
      description = `${itemTitle} - Dining Reservation`;
      image = booking.dhaba.images?.[0]?.url;
    } else {
      itemTitle = "Booking Payment";
      description = `Payment for Booking #${booking._id.toString().slice(-6).toUpperCase()}`;
    }

    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: itemTitle,
            description: description,
            images: image ? [image] : undefined,
          },
          unit_amount: Math.round(booking.totalPrice * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/bookings/cancel`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        type: booking.type
      },
      customer_email: req.user.email
    });

    // Save session ID
    booking.stripeSessionId = session.id;
    await booking.save();

    res.redirect(session.url);

  } catch (error) {
    console.error("Payment initiation error:", error);
    req.flash("error", "Failed to initiate payment");
    res.redirect("/bookings");
  }
});

router.get("/admin", isLoggedIn, isAdmin, getAdminBookings);
router.post("/admin/:bookingId/status", isLoggedIn, isAdmin, updateBookingStatus);

module.exports = router;