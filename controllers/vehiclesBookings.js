const Booking = require("../models/booking");
const Vehicle = require("../models/vehicle");
const wrapAsync = require("../utils/wrapAsync");

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE = process.env.STRIPE_PUBLISHABLE_KEY;
const stripe = STRIPE_SECRET ? require("stripe")(STRIPE_SECRET) : null;

const ensureStripe = () => {
  if (!stripe) {
    console.error('Stripe not configured:', { STRIPE_SECRET: !!STRIPE_SECRET, stripe: !!stripe });
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
  vehicle: booking.vehicle,
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

exports.createVehicleBooking = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, startTime, endTime, pickupLocation, message } = req.body;

  const start = normaliseDate(startDate);
  const end = normaliseDate(endDate);

  if (!start || !end) {
    return res.status(400).json({ error: "Please select valid start and end dates." });
  }

  if (end <= start) {
    return res.status(400).json({ error: "End date must be after start date." });
  }

  const now = new Date();
  if (start < normaliseDate(now)) {
    return res.status(400).json({ error: "You cannot book for a past date." });
  }

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found." });
  }

  // Prevent owner from booking their own vehicle
  if (vehicle.owner.equals(req.user._id)) {
    return res.status(400).json({ error: "You cannot book your own vehicle!" });
  }

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const perDayPrice = Number(vehicle.price) || 0;
  const amount = perDayPrice * days;

  if (amount <= 0) {
    return res.status(400).json({ error: "Vehicle price is not configured correctly." });
  }

  const booking = new Booking({
    vehicle: vehicle._id,
    user: req.user._id,
    startDate: start,
    endDate: end,
    startTime: startTime || "",
    endTime: endTime || "",
    pickupLocation: pickupLocation?.trim() || "",
    message: message?.trim() || "",
    guests: 1, // Vehicle rentals typically have 1 driver
    amount,
    totalPrice: amount,
    paymentStatus: "Pending",
    status: "Pending",
    type: "vehicle",
  });
  await booking.save();

  vehicle.bookings.push(booking._id);
  await vehicle.save();

  res.json({
    bookingId: booking._id,
    amount,
    currency: "INR",
  });
});

exports.checkVehicleAvailability = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body;
  const start = normaliseDate(startDate);
  const end = normaliseDate(endDate);

  if (!start || !end || end <= start) {
    return res.status(400).json({ available: false, error: "Invalid date range." });
  }

  const existing = await Booking.findOne({
    vehicle: id,
    status: { $ne: "Cancelled" },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } },
      { startDate: { $gte: start, $lte: end } },
      { endDate: { $gte: start, $lte: end } }
    ]
  });

  res.json({ available: !existing });
});

exports.handleSuccess = wrapAsync(async (req, res) => {
  const { session_id: sessionId } = req.query;
  if (!sessionId) {
    req.flash("error", "Payment session not found.");
    return res.redirect("/vehicles");
  }

  const { booking } = await getBookingFromSession(sessionId);

  // Send confirmation emails and notifications if payment is successful
  if (booking.isPaid && booking.user) {
    try {
      const { sendBookingConfirmation, sendPaymentReceipt, sendOwnerBookingAlert } = require('../utils/emailService');
      const Notification = require('../models/notification');

      // 1. Notify Guest (Email)
      if (booking.user.email) {
        sendBookingConfirmation(booking, booking.user).catch(err =>
          console.error('Guest Email failed:', err.message)
        );
        sendPaymentReceipt(booking, booking.user).catch(err =>
          console.error('Guest Receipt failed:', err.message)
        );
      }

      // 2. Notify Owner (Email + In-App)
      const item = booking.listing || booking.dhaba || booking.vehicle;
      if (item && item.owner) {
        // Email Alert
        if (item.owner.email) {
          sendOwnerBookingAlert(booking, item.owner, booking.user).catch(err =>
            console.error('Owner Alert Email failed:', err.message)
          );
        }

        // In-App Notification
        Notification.createNotification(
          item.owner._id,
          booking.user._id,
          'booking',
          {
            content: `received a new rental booking for ${item.title || (item.brand + ' ' + item.model)}`,
            link: `/bookings/${booking._id}`,
            metadata: { bookingId: booking._id }
          }
        ).catch(err => console.error('In-App Notification failed:', err.message));
      }

      console.log('📧 Notifications triggered for vehicle booking:', booking._id);
    } catch (error) {
      console.error('Notification service error:', error.message);
    }
  }

  req.flash("success", `Your rental of ${booking.vehicle.title} is confirmed!`);
  res.render("bookings/success", { booking, sessionId });
});

exports.handleCancel = wrapAsync(async (req, res) => {
  const { session_id: sessionId } = req.query;
  let booking = null;
  if (sessionId) {
    booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate('listing')
      .populate('vehicle')
      .populate('dhaba');

    if (booking) {
      booking.status = "Cancelled";
      booking.paymentStatus = "Failed";
      await booking.save();
      console.log(`❌ (Vehicle) Booking ${booking._id} marked as Cancelled due to payment abandonment.`);
    }
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
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("dhaba")
    .populate("listing")
    .populate("vehicle");

  res.render("bookings/myBookings", { bookings });
});

exports.getAdminBookings = wrapAsync(async (req, res) => {
  const { status, paymentStatus, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (type) filter.type = type;

  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .populate("dhaba")
    .populate("listing")
    .populate("vehicle")
    .populate("user");

  res.render("bookings/admin", { bookings, filters: { status: status || "", paymentStatus: paymentStatus || "", type: type || "" } });
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
