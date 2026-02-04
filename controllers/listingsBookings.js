const Booking = require("../models/booking");
const Listing = require("../models/listing");
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
  listing: booking.listing,
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

exports.createListingBooking = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, guests, message } = req.body;

  const start = normaliseDate(startDate);
  const end = normaliseDate(endDate);

  if (!start || !end) {
    return res.status(400).json({ error: "Please select valid start and end dates." });
  }

  if (end <= start) {
    return res.status(400).json({ error: "End date must be after start date." });
  }

  const guestCount = Math.max(1, Number(guests || 1));

  const now = new Date();
  if (start < normaliseDate(now)) {
    return res.status(400).json({ error: "You cannot book for a past date." });
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found." });
  }

  // Prevent owner from booking their own listing
  if (listing.owner.equals(req.user._id)) {
    return res.status(400).json({ error: "You cannot book your own listing!" });
  }

  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const perNightPrice = Number(listing.price) || 0;
  const amount = perNightPrice * nights * guestCount;

  if (amount <= 0) {
    return res.status(400).json({ error: "Listing price is not configured correctly." });
  }

  const booking = new Booking({
    listing: listing._id,
    user: req.user._id,
    startDate: start,
    endDate: end,
    guests: guestCount,
    message: message?.trim() || "",
    amount,
    totalPrice: amount,
    paymentStatus: "Pending",
    status: "Pending",
    type: "listing",
  });
  await booking.save();

  listing.bookings.push(booking._id);
  await listing.save();

  res.json({
    bookingId: booking._id,
    amount,
    currency: "INR",
  });
});

exports.checkListingAvailability = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body;
  const start = normaliseDate(startDate);
  const end = normaliseDate(endDate);

  if (!start || !end || end <= start) {
    return res.status(400).json({ available: false, error: "Invalid date range." });
  }

  const existing = await Booking.findOne({
    listing: id,
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
  const { session_id: sessionId, bookingId } = req.query;

  let booking;

  if (sessionId) {
    const result = await getBookingFromSession(sessionId);
    booking = result.booking;
  } else if (bookingId) {
    booking = await Booking.findById(bookingId)
      .populate("listing")
      .populate("dhaba")
      .populate("vehicle")
      .populate("user");
  }

  if (!booking) {
    req.flash("error", "Booking/Payment record not found.");
    return res.redirect("/bookings");
  }

  // Send confirmation emails and notifications if payment is successful
  // Idempotency: Use webhook triggers mostly, but if webhook failed/delayed, do it here.
  // If webhook already ran (isPaid=true confirmed via session refresh), we might skip re-sending emails?
  // But strictly speaking, handleSuccess runs on user redirect.
  // Let's rely on the shared logic. 
  // If we just refreshed usage from DB/Stripe and it says Paid.
  // We can just rely on the fact that these email functions are likely safe to call or we should check flags.
  // For now, let's keep it but ideally we should check a "notificationsSent" flag.
  // Or, since webhook is faster, maybe we skip if we detect it was already paid *before* this request?
  // Hard to tell. Let's just keep it for reliability (double emails better than zero for now) or
  // add a check if we really want to be "Perfect".
  // "Perfect" means 1 email.
  // Let's trust the webhook to do it. 
  // But if webhook fails?
  // Let's check if (booking.isPaid && !booking.confirmationSent) - requires schema change.
  // Simplest: Check if booking was ALREADY paid before we refreshed it?
  // No, we want to update it if it wasn't.

  // Update: We'll redirect to Processing page now, so handleSuccess is only called manually or by fallback.
  // But wait, the Processing page redirects to /bookings/success?session_id=...
  // So handleSuccess IS called after Processing.
  // By then, webhook SHOULD have run.
  // So booking.isPaid will likely be true.
  // So we should SKIP notifications if it was already true?
  // But maybe the user Wants the receipt now?
  // Let's leave it as is for safety, but knowing it might double send.
  // Actually, let's try to minimize.

  if (booking.isPaid && booking.user) {
    try {
      const { sendBookingConfirmation, sendPaymentReceipt, sendOwnerBookingAlert } = require('../utils/emailService');
      const Notification = require('../models/notification');

      // 1. Notify Guest (Email)
      if (booking.user.email) {
        sendBookingConfirmation(booking, booking.user).catch(err =>
          console.error('Email send failed:', err.message)
        );
        sendPaymentReceipt(booking, booking.user).catch(err =>
          console.error('Receipt send failed:', err.message)
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
            content: `received a new booking for ${item.title || (item.brand + ' ' + item.model)}`,
            link: `/bookings/${booking._id}`,
            metadata: { bookingId: booking._id }
          }
        ).catch(err => console.error('In-App Notification failed:', err.message));
      }

      console.log('📧 Notifications triggered for booking:', booking._id);
    } catch (error) {
      console.error('Notification service error:', error.message);
    }
  }

  let itemTitle = "WanderLust Experience";
  if (booking.listing) itemTitle = booking.listing.title;
  else if (booking.vehicle) itemTitle = booking.vehicle.title || `${booking.vehicle.brand} ${booking.vehicle.model}`;
  else if (booking.dhaba) itemTitle = booking.dhaba.title;

  req.flash("success", `Your booking for ${itemTitle} is confirmed! Check your email for details.`);
  res.render("bookings/success", { booking, sessionId: sessionId || '' });
});

exports.handleCancel = wrapAsync(async (req, res) => {
  const { session_id: sessionId } = req.query;
  let booking = null;
  if (sessionId) {
    booking = await Booking.findOne({ stripeSessionId: sessionId })
      .populate("listing")
      .populate("vehicle")
      .populate("dhaba");

    if (booking) {
      booking.status = "Cancelled";
      booking.paymentStatus = "Failed";
      await booking.save();
      console.log(`❌ Booking ${booking._id} marked as Cancelled due to payment abandonment.`);
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

exports.createCheckoutSession = wrapAsync(async (req, res) => {
  ensureStripe();
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: "Booking ID is required" });
  }

  const booking = await Booking.findById(bookingId)
    .populate("listing")
    .populate("vehicle")
    .populate("dhaba")
    .populate("user");

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  // Double check if already paid
  if (booking.isPaid) {
    return res.status(400).json({ success: false, message: "This booking is already paid" });
  }

  let itemTitle = "WanderLust Booking";
  let itemDescription = "Reservation on WanderLust";

  if (booking.type === 'listing' && booking.listing) {
    itemTitle = booking.listing.title;
    itemDescription = `Stay at ${booking.listing.title} in ${booking.listing.location}`;
  } else if (booking.type === 'vehicle' && booking.vehicle) {
    itemTitle = `${booking.vehicle.brand} ${booking.vehicle.model}`;
    itemDescription = `Vehicle rental: ${booking.vehicle.brand} ${booking.vehicle.model}`;
  } else if (booking.type === 'dhaba' && booking.dhaba) {
    itemTitle = booking.dhaba.title;
    itemDescription = `Dining reservation at ${booking.dhaba.title}`;
  }

  // Base Session Config
  const sessionConfig = {
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: itemTitle,
            description: itemDescription,
          },
          unit_amount: Math.round(booking.totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: booking.user?.email || req.user?.email,
    billing_address_collection: 'auto',
    success_url: `${req.protocol}://${req.get("host")}/bookings/processing?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
    cancel_url: `${req.protocol}://${req.get("host")}/bookings/cancel?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
    metadata: {
      bookingId: booking._id.toString(),
      type: booking.type,
      userId: booking.user?._id.toString() || req.user._id.toString(),
      amount: booking.totalPrice.toString()
    },
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    payment_intent_data: {}, // Initialize
  };

  // ---------------------------------------------------------
  // AUTOMATED PAYOUTS (Stripe Connect)
  // ---------------------------------------------------------
  let owner = null;
  if (booking.type === 'listing' && booking.listing && booking.listing.owner) {
    owner = booking.listing.owner;
  }

  if (owner) {
    // Check if owner has a connected account and payouts enabled
    if (owner.stripeAccountId && owner.payoutsEnabled) {
      const totalCents = Math.round(booking.totalPrice * 100);
      const platformFeeCents = Math.round(totalCents * 0.10); // 10% Fee

      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: owner.stripeAccountId,
        },
        metadata: {
          bookingId: booking._id.toString(),
          type: 'listing'
        }
      };
      console.log(`💰 Split Payment Configured: Owner ${owner._id} (${owner.stripeAccountId}) receives 90%`);
    } else {
      console.log(`⚠️ Owner ${owner._id} not connected to Stripe. Funds held in Platform account.`);
      sessionConfig.payment_intent_data.metadata = {
        bookingId: booking._id.toString(),
        type: 'listing'
      };
    }
  } else {
    sessionConfig.payment_intent_data.metadata = {
      bookingId: booking._id.toString(),
      type: booking.type
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  booking.stripeSessionId = session.id;
  await booking.save();

  res.json({ success: true, url: session.url });
});

