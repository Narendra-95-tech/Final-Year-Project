if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");

const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const bookingRoutes = require("./routes/bookings");

// --------------------
// MongoDB Connection
// --------------------
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("MongoDB connection error:", err));

// --------------------
// Express Setup
// --------------------
const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// Session Configuration
// --------------------
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET || "thisshouldbeabettersecret" },
  touchAfter: 24 * 3600
});
store.on("error", e => console.log("SESSION STORE ERROR", e));

const sessionConfig = {
  store,
  secret: process.env.SECRET || "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7*24*60*60*1000,
    maxAge: 7*24*60*60*1000
  }
};
app.use(session(sessionConfig));
app.use(flash());

// --------------------
// Passport Setup
// --------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --------------------
// Middleware for locals
// --------------------
app.use((req, res, next) => {
  res.locals.currUser = req.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  // Defaults for navbar search controls so includes don't throw on undefined
  res.locals.query = typeof req.query.q === "string" ? req.query.q : "";
  res.locals.sort = typeof req.query.sort === "string" ? req.query.sort : "";
  res.locals.minPrice = typeof req.query.minPrice === "string" ? req.query.minPrice : "";
  res.locals.maxPrice = typeof req.query.maxPrice === "string" ? req.query.maxPrice : "";
  res.locals.category = typeof req.query.category === "string" ? req.query.category : "";
  res.locals.startDate = typeof req.query.startDate === "string" ? req.query.startDate : "";
  res.locals.endDate = typeof req.query.endDate === "string" ? req.query.endDate : "";
  res.locals.guests = typeof req.query.guests === "string" ? req.query.guests : "";
  next();
});

// --------------------
// Routes
// --------------------
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/bookings", bookingRoutes);

// Home route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// --------------------
// 404 Handler
// --------------------
app.all("/", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// --------------------
// Error Handler
// --------------------
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { message });
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// --------------------
// Middleware: isLoggedIn
// --------------------
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }
  next();
};
