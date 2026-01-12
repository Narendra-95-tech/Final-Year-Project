const User = require("../models/user");
const Booking = require("../models/booking");
const Review = require("../models/review");

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
      console.error("Database error checking existing user:", dbError);
      req.flash("error", "An error occurred. Please try again.");
      return res.redirect("/signup");
    }

    // Create new user
    const newUser = new User({ email, username });
    newUser.isVerified = false; // Start as unverified

    try {
      const registeredUser = await User.register(newUser, password);
      console.log("User registered successfully:", registeredUser.username);

      // Send OTP for verification
      const { sendOTP } = require('../utils/otpService');
      await sendOTP(email, 'registration');

      req.flash("success", "Registration successful! Please verify your email with the OTP sent.");
      res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);

    } catch (registrationError) {
      console.error("Registration error:", registrationError);
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
    console.error("Unexpected signup error:", e);
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
    console.error("OTP Verification Error:", err);
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
    console.error("Resend OTP Error:", err);
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
    console.error("Forgot Password Error:", err);
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
    console.error("Reset Password Error:", err);
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