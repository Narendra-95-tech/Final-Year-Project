const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
const { render } = require("ejs");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/users.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


router.route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));


router.route("/login")
  .get(userController.renderLoginForm)
  .post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }), userController.login);

// Email Verification Routes
router.route("/verify-otp")
  .get(userController.renderVerifyOTPForm)
  .post(wrapAsync(userController.verifyOTP));

router.post("/resend-otp", wrapAsync(userController.resendOTP));

// Password Reset Routes
router.route("/forgot-password")
  .get(userController.renderForgotPasswordForm)
  .post(wrapAsync(userController.forgotPassword));

router.route("/reset-password")
  .get(userController.renderResetPasswordForm)
  .post(wrapAsync(userController.resetPassword));

// Logout
router.get("/logout", userController.logout);

// User Profile
router.get("/profile", isLoggedIn, userController.renderProfile);
router.get("/profile/reviews", isLoggedIn, userController.renderMyReviews);
router.get("/notifications", isLoggedIn, userController.renderNotifications);
router.delete("/notifications", isLoggedIn, wrapAsync(userController.clearNotifications));
router.get("/dashboard", isLoggedIn, (req, res) => res.redirect("/profile"));

// Wishlist (Favorites) - Universal Route
router.post("/wishlist/:type/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { type, id } = req.params;
  const user = await User.findById(req.user._id);

  let targetModel;
  let targetField;

  if (type === 'listing') {
    targetModel = Listing;
    targetField = 'wishlist';
  } else if (type === 'vehicle') {
    targetModel = require("../models/vehicle");
    targetField = 'wishlistVehicles';
  } else if (type === 'dhaba') {
    targetModel = require("../models/dhaba");
    targetField = 'wishlistDhabas';
  } else {
    req.flash("error", "Invalid item type");
    return res.redirect("back");
  }

  const item = await targetModel.findById(id);
  if (!item) {
    req.flash("error", "Item not found");
    return res.redirect("back");
  }

  const existingIndex = user[targetField].findIndex(itemId => itemId.equals(item._id));
  if (existingIndex >= 0) {
    user[targetField].splice(existingIndex, 1);
    await user.save();
    req.flash("success", "Removed from wishlist");
  } else {
    user[targetField].push(item._id);
    await user.save();
    req.flash("success", "Saved to wishlist");
  }
  res.redirect(req.get("referer") || "/listings");
}));

router.get("/wishlist", isLoggedIn, wrapAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("wishlist")
    .populate("wishlistVehicles")
    .populate("wishlistDhabas");

  res.render("users/wishlist", {
    wishlist: user.wishlist || [],
    wishlistVehicles: user.wishlistVehicles || [],
    wishlistDhabas: user.wishlistDhabas || []
  });
}));

// Edit Profile
router.route("/profile/edit")
  .get(isLoggedIn, userController.renderEditProfile)
  .post(isLoggedIn, upload.single("avatar"), wrapAsync(userController.updateProfile));

module.exports = router;