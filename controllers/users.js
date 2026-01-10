const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.renderProfile = (req, res) => {
  res.render("users/profile.ejs");
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
          req.flash("error", "Email is already registered");
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

    try {
      const registeredUser = await User.register(newUser, password);
      console.log("User registered successfully:", registeredUser.username);

      // Auto-login after registration
      req.login(registeredUser, (err) => {
        if (err) {
          console.error("Login error after signup:", err);
          req.flash("success", "Registration successful! Please login with your credentials.");
          return res.redirect("/login");
        }
        req.flash("success", "Welcome to WanderLust!");
        res.redirect("/listings");
      });

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

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs")
};


module.exports.login = async (req, res) => {
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

module.exports.renderEditProfile = (req, res) => {
  res.render("users/editProfile.ejs", { user: req.user });
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/profile");
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");

  } catch (e) {
    req.flash("error", "Failed to update profile");
    res.redirect("/profile/edit");
  }
};