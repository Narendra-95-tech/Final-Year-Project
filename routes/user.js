const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
const { render } = require("ejs");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/users.js");


router.route("/signup")
.get( userController.renderSignupForm)
.post( wrapAsync(userController.signup));


router.route("/login")
.get( userController.renderLoginForm)
.post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }), userController.login);


router.get("/logout", userController.logout);

// Wishlist (Favorites)
router.post("/favorites/:listingId", isLoggedIn, wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const user = await User.findById(req.user._id);
  const existingIndex = user.favorites.findIndex(id => id.equals(listing._id));
  if (existingIndex >= 0) {
    user.favorites.splice(existingIndex, 1);
    await user.save();
    req.flash("success", "Removed from wishlist");
  } else {
    user.favorites.push(listing._id);
    await user.save();
    req.flash("success", "Saved to wishlist");
  }
  res.redirect(req.get("referer") || "/listings");
}));

router.get("/wishlist", isLoggedIn, wrapAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");
  res.render("bookings/myBookings", { bookings: [], wishlist: user.favorites });
}));

module.exports = router;