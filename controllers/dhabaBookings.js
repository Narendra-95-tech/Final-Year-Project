const Booking = require("../models/booking");
const Dhaba = require("../models/dhaba");
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
      .populate("dhaba")
      .populate("listing")
      .populate("user");
  }

  if (!booking) {
    booking = await Booking.findOne({ stripeSessionId: session.id })
      .populate("dhaba")
      .populate("listing")
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
        booking.paymentId = session.payment_intent;
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
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("dhaba")
    .populate("listing");

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
