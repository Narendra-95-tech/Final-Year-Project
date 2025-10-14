const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// BOOK & PAY ROUTE
router.post("/:id/book", isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const { startDate, endDate, guests } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: "Select valid dates" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return res.status(400).json({ error: "End date must be after start date" });

    const safeGuests = Math.max(1, Number(guests || 1));
    const totalPrice = listing.price * nights * safeGuests;

    // Overlap condition: (existing.start <= newEnd) && (existing.end >= newStart)
    const overlapping = await Booking.findOne({
      listing: listing._id,
      startDate: { $lte: end },
      endDate: { $gte: start }
    });
    if (overlapping) return res.status(400).json({ error: "Selected dates are already booked!" });

    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      startDate: start,
      endDate: end,
      guests: safeGuests,
      totalPrice
    });
    await booking.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: { name: `Booking: ${listing.title}` },
          unit_amount: totalPrice * 100
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/bookings/${booking._id}/success`,
      cancel_url: `${req.protocol}://${req.get("host")}/bookings/${booking._id}/payment`
    });

    res.json({ sessionUrl: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// AVAILABILITY CHECK
router.post("/:id/availability", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ available: false, error: "Listing not found" });
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ available: false, error: "Invalid dates" });
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!(end > start)) return res.status(400).json({ available: false, error: "End must be after start" });

    const overlapping = await Booking.findOne({
      listing: listing._id,
      startDate: { $lte: end },
      endDate: { $gte: start }
    });
    res.json({ available: !overlapping });
  } catch (e) {
    console.error(e);
    res.status(500).json({ available: false, error: "Server error" });
  }
});

// PAYMENT SUCCESS
router.get("/:id/success", isLoggedIn, async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("listing");
  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings");
  }
  booking.isPaid = true;
  await booking.save();

  req.flash("success", "Payment successful! Your booking is confirmed.");
  res.redirect("/bookings");
});

// VIEW USER BOOKINGS
router.get("/", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("bookings/index", { bookings });
});

module.exports = router;