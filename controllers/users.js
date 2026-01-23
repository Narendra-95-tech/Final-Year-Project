const User = require("../models/user");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");
const Notification = require("../models/notification");
const logger = require("../config/logger");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.renderProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("wishlist")
    .populate("wishlistVehicles")
    .populate("wishlistDhabas");

  const bookingCount = await Booking.countDocuments({ user: req.user._id });
  const reviewCount = await Review.countDocuments({ author: req.user._id });
  const favoritesCount = (user.wishlist?.length || 0) + (user.wishlistVehicles?.length || 0) + (user.wishlistDhabas?.length || 0);
  res.render("users/profile.ejs", {
    user,
    bookingCount,
    reviewCount,
    favoritesCount
  });
};

module.exports.renderMyReviews = async (req, res) => {
  const reviews = await Review.find({ author: req.user._id })
    .populate('listing')
    .populate('vehicle')
    .populate('dhaba')
    .sort({ createdAt: -1 });

  res.render("users/reviews.ejs", { reviews });
};

module.exports.renderNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate("sender", "username avatar")
    .sort({ createdAt: -1 })
    .limit(50);

  // Mark all unread notifications as read
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.render("users/notifications.ejs", { notifications });
};

module.exports.clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    // Also clear the reference array on the User model
    await User.findByIdAndUpdate(req.user._id, { $set: { notifications: [] } });

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: "All notifications cleared" });
    }
    req.flash("success", "All notifications cleared");
    res.redirect("/notifications");
  } catch (error) {
    logger.error("Clear Notifications Error: %O", error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: "Failed to clear notifications" });
    }
    req.flash("error", "Failed to clear notifications");
    res.redirect("/notifications");
  }
};


module.exports.renderHostDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch all items owned by the user
    const [listings, vehicles, dhabas] = await Promise.all([
      Listing.find({ owner: userId }).select('_id title price image').lean(),
      Vehicle.find({ owner: userId }).select('_id title price image').lean(),
      Dhaba.find({ owner: userId }).select('_id title price image').lean()
    ]);

    const itemIds = [
      ...listings.map(l => l._id),
      ...vehicles.map(v => v._id),
      ...dhabas.map(d => d._id)
    ];

    // 2. Fetch all relevant bookings for these items using a robust $and/$or grouping
    const bookings = await Booking.find({
      $and: [
        {
          $or: [
            { listing: { $in: listings.map(l => l._id) } },
            { vehicle: { $in: vehicles.map(v => v._id) } },
            { dhaba: { $in: dhabas.map(d => d._id) } }
          ]
        },
        {
          $or: [{ isPaid: true }, { status: 'Cancelled' }, { status: 'Pending' }]
        }
      ]
    }).populate('user', 'username email avatar').sort({ createdAt: -1 }).lean();

    // 3. Aggregate statistics
    let totalGrossEarnings = 0;
    let totalRefunds = 0;
    let cancelledCount = 0;
    let pendingCount = 0;
    const itemsStats = {};
    const earningsByMonth = {};
    let totalBookedDays = 0;

    bookings.forEach(booking => {
      const amount = booking.totalPrice || booking.amount || 0;

      if (booking.isPaid) {
        totalGrossEarnings += amount;
        if (booking.status === 'Cancelled' || booking.paymentStatus === 'Refunded') {
          totalRefunds += amount;
        }
      }

      if (booking.status === 'Cancelled' || booking.paymentStatus === 'Refunded') {
        cancelledCount++;
      } else if (booking.status === 'Pending' && !booking.isPaid) {
        pendingCount++;
      }

      // Simple occupancy approximation
      if (booking.startDate && booking.endDate && booking.status !== 'Cancelled') {
        const diffTime = Math.abs(new Date(booking.endDate) - new Date(booking.startDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        totalBookedDays += diffDays;
      }

      // Per item stats
      const itemKey = booking.listing || booking.vehicle || booking.dhaba;
      if (!itemKey) return;

      const itemId = itemKey.toString();
      if (!itemsStats[itemId]) {
        let title = "Unknown Item";
        let itemImage = null;
        const foundItem = listings.find(l => l._id.toString() === itemId) ||
          vehicles.find(v => v._id.toString() === itemId) ||
          dhabas.find(d => d._id.toString() === itemId);
        if (foundItem) {
          title = foundItem.title;
          itemImage = foundItem.image;
        }

        itemsStats[itemId] = { title, itemImage, earnings: 0, count: 0, type: booking.type, refunds: 0, bookings: [], rating: 0 };
      }

      if (booking.status !== 'Cancelled' && booking.paymentStatus !== 'Refunded') {
        if (booking.isPaid) {
          itemsStats[itemId].earnings += amount;
        }
        itemsStats[itemId].count += 1;
        itemsStats[itemId].bookings.push(booking);
      } else if (booking.isPaid) {
        itemsStats[itemId].refunds += amount;
      }

      // Group by month
      if (booking.isPaid && booking.status !== 'Cancelled') {
        const month = new Date(booking.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        earningsByMonth[month] = (earningsByMonth[month] || 0) + amount;
      }
    });

    // 4. Fetch Reviews for Host Items
    const reviews = await Review.find({
      $or: [
        { listing: { $in: listings.map(l => l._id) } },
        { vehicle: { $in: vehicles.map(v => v._id) } },
        { dhaba: { $in: dhabas.map(d => d._id) } }
      ]
    }).populate('author', 'username avatar').sort({ createdAt: -1 }).limit(10).lean();

    // Calculate rating averages per item
    reviews.forEach(review => {
      const itemKey = review.listing || review.vehicle || review.dhaba;
      if (itemKey) {
        const itemId = itemKey.toString();
        if (itemsStats[itemId]) {
          itemsStats[itemId].totalRating = (itemsStats[itemId].totalRating || 0) + review.rating;
          itemsStats[itemId].ratingCount = (itemsStats[itemId].ratingCount || 0) + 1;
          itemsStats[itemId].rating = (itemsStats[itemId].totalRating / itemsStats[itemId].ratingCount).toFixed(1);
        }
      }
    });

    const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "N/A";

    // 5. Host Performance Score calculation
    let hostScore = 70;
    if (listings.length + vehicles.length + dhabas.length > 0) {
      const earningsWeight = Math.min(totalGrossEarnings / 500, 15);
      const ratingWeight = averageRating !== "N/A" ? (Number(averageRating) * 2) : 0;
      hostScore = Math.min(65 + earningsWeight + ratingWeight, 100).toFixed(0);
    }

    const topItems = Object.values(itemsStats).sort((a, b) => b.earnings - a.earnings).slice(0, 5);

    // 6. Detailed item list with rating
    const myItems = [
      ...listings.map(l => ({ ...l, type: 'listing' })),
      ...vehicles.map(v => ({ ...v, type: 'vehicle' })),
      ...dhabas.map(d => ({ ...d, type: 'dhaba' }))
    ].map(item => {
      const stats = itemsStats[item._id.toString()] || { earnings: 0, count: 0, refunds: 0, rating: "N/A" };
      return {
        ...item,
        earnings: stats.earnings,
        bookingCount: stats.count,
        refunds: stats.refunds,
        rating: stats.rating || "N/A"
      };
    });

    res.render("users/dashboard.ejs", {
      totalEarnings: totalGrossEarnings - totalRefunds,
      grossEarnings: totalGrossEarnings,
      totalRefunds,
      cancelledCount,
      pendingCount,
      totalBookings: bookings.filter(b => b.status !== 'Cancelled').length,
      listingsCount: listings.length,
      vehiclesCount: vehicles.length,
      dhabasCount: dhabas.length,
      recentBookings: bookings.slice(0, 10),
      topItems,
      myItems,
      earningsByMonth,
      itemsStats,
      recentReviews: reviews.slice(0, 5),
      averageRating,
      hostScore,
      totalBookedDays
    });
  } catch (error) {
    logger.error("Host Dashboard Error: %O", error);
    req.flash("error", "Failed to load dashboard data");
    res.redirect("/profile");
  }
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    // Trim whitespace from inputs
    username = username.trim();
    email = email.trim().toLowerCase(); // Normalize email to lowercase
    password = password.trim();

    // Basic validation
    if (!username || !email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/signup");
    }

    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/signup");
    }

    // Username validation
    if (username.length < 3) {
      req.flash("error", "Username must be at least 3 characters long");
      return res.redirect("/signup");
    }

    // Email validation - more permissive but still valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash("error", "Please enter a valid email address");
      return res.redirect("/signup");
    }

    // Check if user already exists
    try {
      const existingUser = await User.findOne({
        $or: [{ email: email }, { username: username }]
      });

      if (existingUser) {
        if (existingUser.email === email) {
          req.flash("error", "Email is already registered. Please login.");
        } else {
          req.flash("error", "Username is already taken");
        }
        return res.redirect("/signup");
      }
    } catch (dbError) {
      logger.error("Database error checking existing user: %O", dbError);
      req.flash("error", "An error occurred. Please try again.");
      return res.redirect("/signup");
    }

    // Create new user
    const newUser = new User({ email, username });
    newUser.isVerified = false; // Start as unverified

    try {
      const registeredUser = await User.register(newUser, password);
      logger.info("User registered successfully: %s", registeredUser.username);

      // Send OTP for verification
      const { sendOTP } = require('../utils/otpService');
      await sendOTP(email, 'registration');

      req.flash("success", "Registration successful! Please verify your email with the OTP sent.");
      res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);

    } catch (registrationError) {
      logger.error("Registration error: %O", registrationError);
      if (registrationError.name === 'UserExistsError') {
        req.flash("error", "This email or username is already registered");
      } else if (registrationError.name === 'ValidationError') {
        req.flash("error", "Invalid input: " + registrationError.message);
      } else {
        req.flash("error", "Registration failed. Please try again.");
      }
      return res.redirect("/signup");
    }

  } catch (e) {
    logger.error("Unexpected signup error: %O", e);
    req.flash("error", "An unexpected error occurred. Please try again.");
    res.redirect("/signup");
  }
};

module.exports.renderVerifyOTPForm = (req, res) => {
  const { email } = req.query;
  if (!email) {
    req.flash("error", "Email is required for verification.");
    return res.redirect("/signup");
  }
  res.render("users/verify-otp.ejs", { email });
};

module.exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const { verifyOTP } = require('../utils/otpService');

    const result = await verifyOTP(email, otp, 'registration');

    if (result.success) {
      const user = await User.findOne({ email });
      if (user) {
        user.isVerified = true;
        await user.save();

        // Auto-login after successful verification
        req.login(user, (err) => {
          if (err) {
            req.flash("success", "Email verified! Please login.");
            return res.redirect("/login");
          }
          req.flash("success", "Email verified! Welcome to WanderLust.");
          res.redirect("/listings");
        });
      } else {
        req.flash("error", "User not found.");
        res.redirect("/signup");
      }
    } else {
      req.flash("error", result.message || "Invalid or expired OTP");
      res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }
  } catch (err) {
    logger.error("OTP Verification Error: %O", err);
    req.flash("error", "An error occurred during verification.");
    res.redirect("/signup");
  }
};

module.exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const { sendOTP } = require('../utils/otpService');

    await sendOTP(email, 'registration');
    req.flash("success", "A new OTP has been sent to your email.");
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (err) {
    logger.error("Resend OTP Error: %O", err);
    req.flash("error", "Failed to resend OTP.");
    res.redirect("back");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs")
};

module.exports.login = async (req, res) => {
  // Check if user is verified
  if (!req.user.isVerified) {
    const email = req.user.email;
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      req.flash("error", "Please verify your email address first.");
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    });
    return;
  }

  req.flash("success", "Welcome back to Wanderlust!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};

module.exports.renderForgotPasswordForm = (req, res) => {
  res.render("users/forgot-password.ejs");
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "No account found with that email address.");
      return res.redirect("/forgot-password");
    }

    const { sendOTP } = require('../utils/otpService');
    await sendOTP(email, 'password-reset');

    req.flash("success", "Password reset code sent to your email.");
    res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  } catch (err) {
    logger.error("Forgot Password Error: %O", err);
    req.flash("error", "Failed to send reset code.");
    res.redirect("/forgot-password");
  }
};

module.exports.renderResetPasswordForm = (req, res) => {
  const { email } = req.query;
  if (!email) {
    req.flash("error", "Email is required to reset password.");
    return res.redirect("/forgot-password");
  }
  res.render("users/reset-password.ejs", { email });
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const { verifyOTP } = require('../utils/otpService');

    const result = await verifyOTP(email, otp, 'password-reset');

    if (result.success) {
      const user = await User.findOne({ email });
      if (user) {
        // Use passport-local-mongoose's setPassword method
        await user.setPassword(newPassword);
        await user.save();

        req.flash("success", "Password reset successful! Please login with your new password.");
        res.redirect("/login");
      } else {
        req.flash("error", "User not found.");
        res.redirect("/forgot-password");
      }
    } else {
      req.flash("error", result.message || "Invalid or expired OTP");
      res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  } catch (err) {
    logger.error("Reset Password Error: %O", err);
    req.flash("error", "An error occurred during password reset.");
    res.redirect("/forgot-password");
  }
};

module.exports.renderEditProfile = (req, res) => {
  res.render("users/editProfile.ejs", { user: req.user });
};

module.exports.updateProfile = async (req, res) => {
  try {
    const {
      username,
      email,
      firstName,
      lastName,
      bio,
      location,
      website,
      social
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/profile");
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (bio) user.bio = bio.trim();
    if (location) user.location = location.trim();
    if (website) user.website = website.trim();

    if (social) {
      user.social = {
        facebook: social.facebook ? social.facebook.trim() : "",
        twitter: social.twitter ? social.twitter.trim() : "",
        instagram: social.instagram ? social.instagram.trim() : ""
      };
    }

    if (req.body.removeAvatar === "true") {
      user.avatar = undefined;
    } else if (typeof req.file !== "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      user.avatar = { url, filename };
    }

    await user.save();
    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");

  } catch (e) {
    req.flash("error", "Failed to update profile");
    res.redirect("/profile/edit");
  }
};