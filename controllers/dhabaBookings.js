const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Dhaba = require("../models/dhaba");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE = process.env.STRIPE_PUBLISHABLE_KEY;
const stripe = STRIPE_SECRET ? require("stripe")(STRIPE_SECRET) : null;

const ensureStripe = () => {
  if (!stripe) {
    const message = "Stripe keys are not configured. Set STRIPE_SECRET_KEY & STRIPE_PUBLISHABLE_KEY.";
    const err = new Error(message);
    err.status = 500;
    throw err;
  }
};

const normaliseDate = (input) => {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildBookingResponse = (booking) => ({
  id: booking._id,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  amount: booking.amount,
  dhaba: booking.dhaba,
  user: booking.user,
});

async function getBookingFromSession(sessionId) {
  ensureStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const bookingId = session?.metadata?.bookingId;
  let booking = null;
  if (bookingId) {
    booking = await Booking.findById(bookingId)
      .populate({ path: "listing", populate: { path: "owner" } })
      .populate({ path: "dhaba", populate: { path: "owner" } })
      .populate({ path: "vehicle", populate: { path: "owner" } })
      .populate("user");
  }

  if (!booking) {
    booking = await Booking.findOne({ stripeSessionId: session.id })
      .populate({ path: "listing", populate: { path: "owner" } })
      .populate({ path: "dhaba", populate: { path: "owner" } })
      .populate({ path: "vehicle", populate: { path: "owner" } })
      .populate("user");
  }

  if (!booking) {
    const error = new Error("Booking not found for this payment session.");
    error.status = 404;
    throw error;
  }

  const amountPaid = session.amount_total ? session.amount_total / 100 : booking.amount;
  const paymentIntentId = session.payment_intent?.id || booking.paymentIntentId;
  const paymentStatus = session.payment_status === "paid" ? "Paid" : booking.paymentStatus;
  const isPaid = session.payment_status === "paid";
  const status = isPaid ? "Confirmed" : booking.status;

  booking.amount = booking.amount || amountPaid;
  booking.totalPrice = booking.totalPrice || amountPaid;
  booking.paymentIntentId = paymentIntentId;
  booking.paymentStatus = paymentStatus;
  booking.isPaid = booking.isPaid || isPaid;
  booking.status = status;
  await booking.save();

  return { booking, session };
}

exports.createDhabaBooking = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { date, time, guests, message } = req.body;

  const bookingDate = normaliseDate(date);
  if (!bookingDate) {
    return res.status(400).json({ error: "Please select a valid date." });
  }

  if (!time || !/^([0-1]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    return res.status(400).json({ error: "Please select a valid time." });
  }

  const guestCount = Math.max(1, Number(guests || 1));
  const now = new Date();
  if (bookingDate < normaliseDate(now)) {
    return res.status(400).json({ error: "You cannot book for a past date." });
  }

  const dhaba = await Dhaba.findById(id);
  if (!dhaba) {
    return res.status(404).json({ error: "Dhaba not found." });
  }

  // Prevent owner from booking their own dhaba
  if (dhaba.owner.equals(req.user._id)) {
    return res.status(400).json({ error: "You cannot book your own dhaba!" });
  }

  const perGuestPrice = Number(dhaba.price) || 0;
  const amount = perGuestPrice * guestCount;
  if (amount <= 0) {
    return res.status(400).json({ error: "Dhaba price is not configured correctly." });
  }

  const booking = new Booking({
    dhaba: dhaba._id,
    user: req.user._id,
    date: bookingDate,
    time,
    guests: guestCount,
    message: message?.trim() || "",
    amount,
    totalPrice: amount,
    paymentStatus: "Pending",
    status: "Pending",
    type: "dhaba",
  });
  await booking.save();

  dhaba.bookings.push(booking._id);
  await dhaba.save();

  res.json({
    bookingId: booking._id,
    amount,
    currency: "INR",
  });
});

exports.checkAvailability = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;
  const bookingDate = normaliseDate(date);

  if (!bookingDate || !time) {
    return res.status(400).json({ available: false, error: "Invalid date or time." });
  }

  const existing = await Booking.findOne({
    dhaba: id,
    date: bookingDate,
    time,
    status: { $ne: "Cancelled" },
  });

  res.json({ available: !existing });
});

exports.handleSuccess = wrapAsync(async (req, res) => {
  const { session_id: sessionId } = req.query;
  if (!sessionId) {
    req.flash("error", "Payment session not found.");
    return res.redirect("/");
  }

  try {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Find and update the booking
      const booking = await Booking.findOne({ stripeSessionId: sessionId })
        .populate('listing')
        .populate('vehicle')
        .populate('dhaba');

      if (booking) {
        booking.paymentStatus = 'Paid';
        booking.isPaid = true;
        booking.paymentIntentId = session.payment_intent; // Store specific intent ID for refunds
        booking.paymentDate = new Date();
        booking.status = 'Confirmed';
        await booking.save();

        let itemTitle;
        if (booking.type === 'listing') {
          itemTitle = booking.listing.title;
        } else if (booking.type === 'vehicle') {
          itemTitle = booking.vehicle.title;
        } else if (booking.type === 'dhaba') {
          itemTitle = booking.dhaba.title;
        }

        // Trigger notifications
        try {
          const { sendBookingConfirmation, sendPaymentReceipt, sendOwnerBookingAlert } = require('../utils/emailService');
          const Notification = require('../models/notification');

          // Notify Guest
          if (booking.user && booking.user.email) {
            sendBookingConfirmation(booking, booking.user).catch(e => console.error('Guest confirmation email failed:', e.message));
            sendPaymentReceipt(booking, booking.user).catch(e => console.error('Guest receipt email failed:', e.message));
          }

          // Notify Owner
          const item = booking.listing || booking.dhaba || booking.vehicle;
          if (item && item.owner) {
            if (item.owner.email) {
              sendOwnerBookingAlert(booking, item.owner, booking.user).catch(e => console.error('Owner alert email failed:', e.message));
            }
            Notification.createNotification(
              item.owner._id,
              booking.user ? booking.user._id : req.user._id,
              'booking',
              {
                content: `received a new dining reservation for ${item.title}`,
                link: `/bookings/${booking._id}`,
                metadata: { bookingId: booking._id }
              }
            ).catch(e => console.error('Owner in-app notification failed:', e.message));
          }
          console.log('📧 Notifications triggered for dining booking:', booking._id);
        } catch (notifierErr) {
          console.error('Notification service error:', notifierErr.message);
        }

        req.flash("success", `Payment successful! Your booking for ${itemTitle} is confirmed.`);
      }
    }

    // Find the booking for display
    const booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate('listing')
      .populate('vehicle')
      .populate('dhaba');

    res.render("bookings/success", { booking, sessionId });
  } catch (error) {
    console.error('Error handling payment success:', error);
    req.flash("error", "There was an error processing your payment.");
    res.redirect("/");
  }
});

exports.handleCancel = wrapAsync(async (req, res) => {
  const { session_id: sessionId } = req.query;
  let booking = null;
  if (sessionId) {
    booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate('listing')
      .populate('vehicle')
      .populate('dhaba');
  }

  res.render("bookings/cancel", { booking });
});

exports.verifyPayment = wrapAsync(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  const { booking } = await getBookingFromSession(sessionId);
  res.json({
    message: "Payment verified successfully.",
    booking: buildBookingResponse(booking),
  });
});

exports.getUserBookings = wrapAsync(async (req, res) => {
  // Fetch all bookings (unsorted from DB)
  let bookings = await Booking.find({ user: req.user._id })
    .populate("dhaba")
    .populate("listing")
    .populate("vehicle");

  // Normalize data first
  for (let booking of bookings) {
    // Infer type if missing
    if (!booking.type) {
      if (booking.listing) booking.type = 'listing';
      else if (booking.dhaba) booking.type = 'dhaba';
      else if (booking.vehicle) booking.type = 'vehicle';
    }

    // Normalize status
    if (booking.status && booking.status.toLowerCase() === 'confirmed') booking.status = 'Confirmed';
    if (booking.status && booking.status.toLowerCase() === 'cancelled') booking.status = 'Cancelled';
    if (booking.status && booking.status.toLowerCase() === 'pending') booking.status = 'Pending';
    if (booking.paymentStatus && booking.paymentStatus.toLowerCase() === 'paid') booking.paymentStatus = 'Paid';
  }

  // Smart Sort: By Trip Date (Ascending)
  // This puts the "Next Trip" at the top of the list (provided we filter out past ones in the view)
  // For dashboard, having them chronologically 2024 -> 2025 makes most sense for the "Timeline"
  bookings.sort((a, b) => {
    const dateA = new Date(a.startDate || a.date);
    const dateB = new Date(b.startDate || b.date);
    return dateA - dateB;
  });

  res.render("bookings/myBookings", { bookings });
});

exports.getAdminBookings = wrapAsync(async (req, res) => {
  const { status, paymentStatus } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .populate("dhaba")
    .populate("listing")
    .populate("vehicle")
    .populate("user");

  res.render("bookings/admin", { bookings, filters: { status: status || "", paymentStatus: paymentStatus || "" } });
});

exports.updateBookingStatus = wrapAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["Pending", "Confirmed", "Cancelled"];

  if (!allowedStatuses.includes(status)) {
    req.flash("error", "Invalid status value.");
    return res.redirect("/admin/bookings");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/admin/bookings");
  }

  booking.status = status;
  if (status === "Cancelled") {
    booking.paymentStatus = booking.isPaid ? "Paid" : "Failed";
  }
  await booking.save();

  req.flash("success", "Booking status updated.");
  res.redirect("/admin/bookings");
});

exports.cancelBooking = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings");
  }

  // Verify ownership
  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You do not have permission to cancel this booking");
    return res.redirect("/bookings");
  }

  // Check if already cancelled
  if (booking.status === "Cancelled") {
    req.flash("error", "This booking is already cancelled");
    return res.redirect("/bookings");
  }

  let refundSuccess = false;
  let refundMsg = "";

  // 1. Handle Wallet Refund
  // Check for explicit flag OR legacy string check
  if (booking.isPaid && (booking.paidWithWallet || booking.paymentMethod === 'Wallet')) {
    const user = await User.findById(booking.user);
    if (user) {
      user.walletBalance = (user.walletBalance || 0) + booking.totalPrice;
      await user.save();
      refundSuccess = true;
      refundMsg = `₹${booking.totalPrice} has been refunded to your Wander Wallet.`;
    }
  }
  // 2. Handle Stripe Refund (If Stripe is configured)
  else if (booking.isPaid && (booking.paymentIntentId || booking.stripeSessionId)) {
    try {
      if (stripe) {
        let piId = booking.paymentIntentId;

        // If we only have sessionId, retrieve the session to get the PaymentIntent
        if (!piId && booking.stripeSessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
            piId = session.payment_intent;
          } catch (err) {
            console.log("Could not retrieve session for refund:", err.message);
          }
        }

        if (piId) {
          await stripe.refunds.create({
            payment_intent: piId,
          });
          refundSuccess = true;
          refundMsg = `₹${booking.totalPrice} has been refunded to your original payment method.`;
        } else {
          console.log("No PaymentIntent found for booking:", booking._id);
          refundMsg = "Could not locate payment details for auto-refund. Please contact support.";
        }
      } else {
        refundMsg = "Automated Stripe refund is unavailable (API keys missing). Please contact support.";
      }
    } catch (stripeError) {
      console.error("Stripe Refund Error:", stripeError);
      refundMsg = "Stripe refund failed (it may have already been refunded). Please check your statement.";
    }
  }

  // Update status
  booking.status = "Cancelled";
  if (refundSuccess) {
    booking.paymentStatus = "Refunded";
  } else if (booking.isPaid) {
    booking.paymentStatus = "Refund Pending";
  }

  await booking.save();

  // Send cancellation email notification
  try {
    const { sendCancellationEmail } = require('../utils/emailService');
    const user = await User.findById(booking.user);
    if (user && user.email) {
      sendCancellationEmail(booking, user, booking.totalPrice).catch(e => console.error('Cancellation email failed:', e.message));
      console.log('📧 Triggering cancellation email for booking:', booking._id);
    }
  } catch (emailErr) {
    console.error('Email service trigger error:', emailErr.message);
  }

  const successHeader = `Booking cancelled.`; // Simplified header
  req.flash("success", refundSuccess ? `${successHeader} ${refundMsg}` : `${successHeader} Refund status: ${booking.paymentStatus}.`);
  res.redirect("/bookings");
});

exports.deleteBooking = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings");
  }

  // Verify ownership
  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You do not have permission to delete this booking");
    return res.redirect("/bookings");
  }

  const { type, listing, dhaba, vehicle } = booking;

  // Cleanup references in parent models
  if (type === 'listing' && listing) {
    await mongoose.model('Listing').findByIdAndUpdate(listing, { $pull: { bookings: id } });
  } else if (type === 'dhaba' && dhaba) {
    await mongoose.model('Dhaba').findByIdAndUpdate(dhaba, { $pull: { bookings: id } });
  } else if (type === 'vehicle' && vehicle) {
    await mongoose.model('Vehicle').findByIdAndUpdate(vehicle, {
      $pull: { bookings: id, bookedDates: { bookingId: id } }
    });
  }

  await Booking.findByIdAndDelete(id);

  req.flash("success", "Booking record removed from your history");
  res.redirect("/bookings");
});

exports.bulkDeleteBookings = wrapAsync(async (req, res) => {
  const { bookingIds } = req.body;
  if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({ success: false, message: "No bookings selected for deletion" });
  }

  const bookings = await Booking.find({
    _id: { $in: bookingIds },
    user: req.user._id
  });

  if (bookings.length === 0) {
    return res.status(404).json({ success: false, message: "No valid bookings found to delete" });
  }

  for (let booking of bookings) {
    const { type, listing, dhaba, vehicle } = booking;
    const bookingId = booking._id;

    // Cleanup references in parent models
    if (type === 'listing' && listing) {
      await mongoose.model('Listing').findByIdAndUpdate(listing, { $pull: { bookings: bookingId } });
    } else if (type === 'dhaba' && dhaba) {
      await mongoose.model('Dhaba').findByIdAndUpdate(dhaba, { $pull: { bookings: bookingId } });
    } else if (type === 'vehicle' && vehicle) {
      await mongoose.model('Vehicle').findByIdAndUpdate(vehicle, {
        $pull: { bookings: bookingId, bookedDates: { bookingId: bookingId } }
      });
    }
    await Booking.findByIdAndDelete(bookingId);
  }

  res.json({ success: true, message: `${bookings.length} bookings removed from your history` });
});

exports.showBooking = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id)
    .populate('listing')
    .populate('vehicle')
    .populate('dhaba');

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings");
  }

  // Verify ownership
  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You do not have permission to view this booking");
    return res.redirect("/bookings");
  }

  // If booking is paid, show the enhanced success/receipt page
  if (booking.isPaid || booking.status === 'Confirmed') {
    return res.render("bookings/success", { booking, currUser: req.user, sessionId: null });
  }

  // Otherwise show the payment confirmation page
  res.render("bookings/payment", { booking, currUser: req.user });
});
