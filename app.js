if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    override: true,
    processEnv: process.env
  });
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
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');

const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");
const cors = require('cors');

const listingRouter = require("./routes/listing");
const vehicleRouter = require("./routes/vehicles");
const dhabaRouter = require("./routes/dhabas");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const bookingRoutes = require("./routes/bookings");
const aiRoutes = require("./routes/ai");
const socialRoutes = require("./routes/social");
const socialInteractions = require("./routes/socialInteractions");
const adminRoutes = require("./routes/admin");
const tripPlannerRoutes = require("./routes/tripPlanner");
const authRoutes = require("./routes/auth");
const wishlistRoutes = require("./routes/wishlist");
const aiMagicRouter = require("./routes/aiMagic");
const trustRouter = require("./routes/trust");

// --------------------  
// Database Connection
// --------------------
// --------------------  
// Database Connection
// --------------------
const dbUrl = process.env.ATLASDB_URL;

if (!dbUrl) {
  console.error("❌ FATAL ERROR: ATLASDB_URL is not defined.");
  process.exit(1);
}

console.log("🚀 Connecting to Database...");
console.log(`Target: ${dbUrl.includes("mongodb+srv") ? "MongoDB Atlas (Cloud)" : "Local MongoDB"}`);

mongoose.connect(dbUrl)
  .then(() => {
    console.log("✅ Database Connected Successfully!");
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed:", err);
    console.log("Retrying in 5 seconds...");
    setTimeout(() => {
      mongoose.connect(dbUrl).catch(e => console.error("Retry failed:", e));
    }, 5000);
  });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connection established.");
});

// --------------------
// Express Setup
// --------------------
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle user authentication and store socket with user ID
  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  // Handle real-time AI Assistant chat
  socket.on('ai_message', async ({ message, userId, context }) => {
    try {
      const smartChatbot = require("./utils/smartChatbot");
      const response = await smartChatbot.handleMessage(message, userId, context);

      // Emit back to the user
      socket.emit('ai_response', response);
    } catch (error) {
      console.error('Socket AI Error:', error);
      socket.emit('ai_response', {
        reply: "I'm having a small glitch in my systems. Can we try that again?",
        suggestions: [{ text: "Retry", action: "retry" }]
      });
    }
  });

  // Handle real-time notifications
  socket.on('notification', async ({ userId, type, data }) => {
    try {
      // Emit to the specific user if online
      const recipientSocketId = connectedUsers.get(userId.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newNotification', { type, data });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });
});

// Make io accessible in routes
app.set('io', io);

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for specific file types if needed
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    }
  }
}));

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Parse JSON and urlencoded request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride("_method"));
app.use('/uploads', express.static('uploads'));

// --------------------
// Session Configuration
// --------------------
const secret = process.env.SECRET || "thisshouldbeabettersecret";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  collectionName: 'sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10 // In minutes
});

store.on('error', function (error) {
  console.error('Session store error:', error);
  // Fallback to memory store if MongoDB session store fails
  console.log('Falling back to memory store for sessions');
  const MemoryStore = require('memorystore')(session);
  const memoryStore = new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  });

  // Update session config to use memory store
  sessionConfig.store = memoryStore;
});

const sessionConfig = {
  store,
  name: 'session',
  secret: process.env.SECRET || 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// --------------------
// Passport Configuration
// --------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
require("./config/passport");

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

// --------------------
// Middleware
// Make user and flash messages available in all templates
app.use((req, res, next) => {
  res.locals.currUser = req.user || null;  // For EJS templates using currUser
  res.locals.currentUser = req.user || null; // For any components using currentUser
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  res.locals.isAdmin = req.user && req.user.role === 'admin';
  next();
});

// --------------------
// Routes
// --------------------
app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/vehicles", vehicleRouter);
app.use("/dhabas", dhabaRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/vehicles/:id/reviews", reviewRouter);
app.use("/dhabas/:id/reviews", reviewRouter);
app.use("/admin", adminRoutes);
app.use("/bookings", bookingRoutes);
app.use("/ai", aiRoutes);
app.use("/social", socialRoutes);
app.use("/api/social", socialInteractions);
app.use("/api/trip", tripPlannerRoutes);
app.use("/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/ai/magic", aiMagicRouter);
app.use("/trust", trustRouter);



// Trip planner page route
app.get("/trip-planner", (req, res) => {
  res.render("trip-planner", {
    title: "AI Trip Planner | WanderLust",
    description: "Plan your perfect trip with our AI-powered trip planner. Get personalized travel itineraries, budget estimates, and local recommendations."
  });
});

// Map search demo page route
app.get("/map-search-demo", (req, res) => {
  res.render("map-search-demo", {
    title: "Map Search Location | WanderLust",
    description: "Search for locations and explore places with our interactive map search feature."
  });
});

// Debug route to check database
app.get('/debug/database', async (req, res) => {
  try {
    const User = require("./models/user");
    const users = await User.find({});
    res.json({
      message: "Database connection successful",
      userCount: users.length,
      users: users.map(u => ({
        email: u.email,
        username: u.username,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: "Database error",
      error: error.message
    });
  }
});

// Debug route to test if server is responding
app.get('/test', (req, res) => {
  res.send('Server is running!');
});

// Home route - render homepage directly
app.get("/", async (req, res) => {
  try {
    const Listing = require("./models/listing");
    const Vehicle = require("./models/vehicle");
    const Dhaba = require("./models/dhaba");

    // Get featured items from each section
    const featuredListings = await Listing.find({}).sort({ _id: -1 }).limit(3);
    const featuredVehicles = await Vehicle.find({}).sort({ _id: -1 }).limit(3);
    const featuredDhabas = await Dhaba.find({}).sort({ _id: -1 }).limit(3);

    // Get "Local Legends" (Simulated for Demo)
    const User = require("./models/user");
    let localLegends = await User.find({}).limit(4);

    // Augment with legend metadata
    const legendTitles = ["Superhost Elite", "Safe Traveler", "Flavor Master", "Road King"];
    localLegends = localLegends.map((user, i) => {
      const u = user.toObject();

      // Fixed Personas for "Local Legends" Hall of Fame
      const personas = [
        { name: "Narendra", title: "Superhost Elite", color: "2D6A4F" }, // N
        { name: "Rohan", title: "Safe Traveler", color: "1D3557" },    // R
        { name: "Rutik", title: "Flavor Master", color: "E63946" },    // R
        { name: "Aditya", title: "Road King", color: "F1A00A" }        // A
      ];

      if (i < personas.length) {
        const p = personas[i];
        u.firstName = p.name;
        u.legendTitle = p.title;
        // Force initials avatar for consistency in the "Hall of Fame"
        u.avatar = { url: `https://ui-avatars.com/api/?name=${p.name}&background=${p.color}&color=fff&size=128&bold=true&length=1` };
      } else {
        u.legendTitle = legendTitles[i % legendTitles.length];
      }

      u.legendRating = (4.8 + (Math.random() * 0.2)).toFixed(1);
      u.hostedCount = Math.floor(Math.random() * 50) + 10;
      return u;
    });

    // Check for real visual messages
    const existingSuccess = res.locals.success;
    const hasVisualSuccess = existingSuccess && existingSuccess.length > 0 && existingSuccess.some(m => m && m.trim().length > 0);

    if (!hasVisualSuccess) {
      res.locals.success = "Welcome to WanderLust!";
    }

    res.render("home", {
      featuredListings,
      featuredVehicles,
      featuredDhabas,
      localLegends,
      mapToken: process.env.MAP_TOKEN,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading homepage");
  }
});

// Global Search Route
app.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.redirect("/");
  }

  try {
    const Listing = require("./models/listing");
    const Vehicle = require("./models/vehicle");
    const Dhaba = require("./models/dhaba");

    const terms = q.trim().split(/\s+/);
    const buildFilter = (fields) => ({
      $and: terms.map(term => ({
        $or: fields.map(field => ({ [field]: new RegExp(term, "i") }))
      }))
    });

    const buildPipeline = (fields) => [
      { $match: buildFilter(fields) },
      {
        $addFields: {
          relevance: {
            $add: fields.map(field => ({
              $cond: [{ $regexMatch: { input: "$" + field, regex: q.trim(), options: "i" } }, 10, 0]
            }))
          }
        }
      },
      { $sort: { relevance: -1, _id: -1 } },
      { $limit: 12 }
    ];

    const [listings, vehicles, dhabas] = await Promise.all([
      Listing.aggregate(buildPipeline(['title', 'location', 'country', 'propertyType'])),
      Vehicle.aggregate(buildPipeline(['title', 'location', 'country', 'brand', 'model', 'vehicleType'])),
      Dhaba.aggregate(buildPipeline(['title', 'location', 'country', 'cuisine', 'category'])),
    ]);

    const totalResults = listings.length + vehicles.length + dhabas.length;

    res.render("search", {
      query: q,
      listings,
      vehicles,
      dhabas,
      totalResults,
      mapToken: process.env.MAP_TOKEN,
    });
  } catch (error) {
    console.error("Search error:", error);
    req.flash("error", "Error performing search");
    res.redirect("/");
  }
});

// Homepage with all sections
app.get("/home", async (req, res) => {
  try {
    const Listing = require("./models/listing");
    const Vehicle = require("./models/vehicle");
    const Dhaba = require("./models/dhaba");

    // Get featured items from each section
    const featuredListings = await Listing.find({}).sort({ _id: -1 }).limit(3);
    const featuredVehicles = await Vehicle.find({}).sort({ _id: -1 }).limit(3);
    const featuredDhabas = await Dhaba.find({}).sort({ _id: -1 }).limit(3);

    // Get "Local Legends" (Simulated for Demo)
    const User = require("./models/user");
    let localLegends = await User.find({}).limit(4);

    // Augment with legend metadata
    const legendTitles = ["Superhost Elite", "Safe Traveler", "Flavor Master", "Road King"];
    localLegends = localLegends.map((user, i) => {
      const u = user.toObject();

      // Fixed Personas for "Local Legends" Hall of Fame
      const personas = [
        { name: "Narendra", title: "Superhost Elite", color: "2D6A4F" }, // N
        { name: "Rohan", title: "Safe Traveler", color: "1D3557" },    // R
        { name: "Rutik", title: "Flavor Master", color: "E63946" },    // R
        { name: "Aditya", title: "Road King", color: "F1A00A" }        // A
      ];

      if (i < personas.length) {
        const p = personas[i];
        u.firstName = p.name;
        u.legendTitle = p.title;
        // Force initials avatar for consistency in the "Hall of Fame"
        u.avatar = { url: `https://ui-avatars.com/api/?name=${p.name}&background=${p.color}&color=fff&size=128&bold=true&length=1` };
      } else {
        u.legendTitle = legendTitles[i % legendTitles.length];
      }

      u.legendRating = (4.8 + (Math.random() * 0.2)).toFixed(1);
      u.hostedCount = Math.floor(Math.random() * 50) + 10;
      return u;
    });

    // Check for real visual messages
    const existingSuccessHome = res.locals.success;
    const hasVisualSuccessHome = existingSuccessHome && existingSuccessHome.length > 0 && existingSuccessHome.some(m => m && m.trim().length > 0);

    if (!hasVisualSuccessHome) {
      res.locals.success = "Welcome to WanderLust!";
    }

    res.render("home", {
      featuredListings,
      featuredVehicles,
      featuredDhabas,
      localLegends,
      mapToken: process.env.MAP_TOKEN,
    });
  } catch (err) {
    console.error(err);
    res.render("error", { message: "Error loading homepage" });
  }
});

// 404 Handler - Must be after all other routes
app.all('*', (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(`Error [${req.method} ${req.originalUrl}]:`, err.message);

  // Handle ExpressError specifically
  if (err instanceof ExpressError) {
    return res.status(err.statusCode).render('error', {
      title: 'Error',
      message: err.message
    });
  }

  // Handle file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'File too large. Maximum size is 10MB');
      return res.redirect('back');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      req.flash('error', 'Too many files. Maximum 10 files allowed');
      return res.redirect('back');
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    req.flash('error', messages.join(', '));
    return res.redirect('back');
  }

  // Handle other errors
  const { statusCode = 500, message = 'Something went wrong!' } = err;

  // If the request is an API request, return JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  // Otherwise, render an error page
  res.status(statusCode).render('error', {
    title: 'Error',
    message: statusCode === 404 ? 'Page Not Found' : message
  });
});

// Start Server
const PORT = process.env.PORT || 8080;

// Only start server if this file is run directly
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket server is running on port ${PORT}`);
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
}
