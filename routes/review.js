const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const Vehicle = require("../models/vehicle.js");
const Dhaba = require("../models/dhaba.js");
const {validateReview, isLoggedIn, isReviewAuthor} =require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

// Post Review Route - works for listings, vehicles, and dhabas
router.post("/",isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete Review Route - works for listings, vehicles, and dhabas
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;