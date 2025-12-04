if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    override: true,
    processEnv: process.env
  });
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const adminRoutes = require("./routes/admin");
const ejsMate = require("ejs-mate");

// Database connection
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

mongoose.connect(dbUrl)
  .then(() => console.log('MongoDB connected for admin server'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

// View engine setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: process.env.SECRET || 'thisshouldbeabettersecret!'
  }
});

const sessionConfig = {
  store,
  name: 'admin-session',
  secret: process.env.SECRET || 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true, // Enable in production with HTTPS
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
};

app.use(session(sessionConfig));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Admin middleware
app.use((req, res, next) => {
  // Check if user is authenticated and is admin
  if (req.isAuthenticated() && req.user.role === 'admin') {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.isAdmin = true;
    return next();
  }
  
  // If not admin, redirect to login
  if (req.path !== '/login') {
    req.flash('error', 'Please log in as admin to continue');
    return res.redirect('/login');
  }
  
  next();
});

// Routes
app.use('/', adminRoutes);

// Login route for admin
app.get('/login', (req, res) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return res.redirect('/');
  }
  res.render('admin/login', { title: 'Admin Login' });
});

// Handle login
app.post('/login', passport.authenticate('local', {
  failureFlash: true,
  failureRedirect: '/login'
}), (req, res) => {
  if (req.user.role !== 'admin') {
    req.logout();
    req.flash('error', 'You do not have admin privileges');
    return res.redirect('/login');
  }
  req.flash('success', 'Welcome back!');
  const redirectUrl = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Successfully logged out');
  res.redirect('/login');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  const { statusCode = 500, message = 'Something went wrong!' } = err;
  res.status(statusCode).render('error', { 
    title: 'Error',
    message: statusCode === 404 ? 'Page Not Found' : message 
  });
});

// Start the server
const PORT = 8081; // Changed from 8080 to 8081
app.listen(PORT, () => {
  console.log(`Admin server is running on http://localhost:${PORT}`);
  console.log('Note: Main application should be running on port 8080');
});
