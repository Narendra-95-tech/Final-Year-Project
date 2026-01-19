const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listings");
const Listing = require("../models/listing");
const { isLoggedIn, isOwner, validateListing, normalizeListingForm, isEmailVerified } = require("../middleware");
const openai = require("../openai").default;

// ============================
// LISTINGS ROUTES
// ============================

// GET all listings or POST new listing
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    isEmailVerified,
    upload.array("listing[image]"),
    normalizeListingForm,
    validateListing,
    wrapAsync(listingController.createListing)
  );

// New Listing Form
router.get("/new", isLoggedIn, isEmailVerified, listingController.renderNewForm);

// API: Get Map Data (Lazy Load)
router.get("/api/map", wrapAsync(listingController.getMapData));

// ============================
// AI: Generate Description (Owner Only)
// ============================
router.get("/:id/generate-description", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // Only owner can generate AI description
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission to generate AI description");
    return res.redirect(`/listings/${id}`);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Write a short, catchy description for hotel "${listing.title}".` }
      ]
    });

    listing.description = response.choices[0].message.content;
    await listing.save();

    req.flash("success", "AI-generated description added!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to generate description");
    res.redirect(`/listings/${id}`);
  }
}));

// ============================
// AI: Chatbot Route (POST)
// ============================
router.post("/chat", isLoggedIn, wrapAsync(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    const aiMessage = response.choices[0].message.content;
    res.json({ aiMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
}));

// ============================
// SINGLE LISTING ROUTES
// ============================
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("listing[image]"),
    normalizeListingForm,
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit Form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// Get Bookings for Calendar
router.get("/:id/bookings", wrapAsync(listingController.getListingBookings));

// ============================
// AVAILABILITY MANAGEMENT (Host Only)
// ============================
router.get("/:id/availability", isLoggedIn, isOwner, wrapAsync(listingController.renderAvailability));
router.post("/:id/availability", isLoggedIn, isOwner, wrapAsync(listingController.updateAvailability));

// Advanced Availability Routes
const availabilityRouter = require("./availability");
router.use("/:id/availability", availabilityRouter);

module.exports = router;
