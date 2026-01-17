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
// Cloudinary config remains in cloudConfig.js
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");
const logger = require("./config/logger");
const { initSentry, Sentry } = require("./config/sentry");
const requestLogger = require("./middleware/requestLogger");


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
const otpRouter = require("./routes/otp");

// --------------------  
// Database Connection
// --------------------
// --------------------  
// Database Connection
// --------------------
const dbUrl = process.env.ATLASDB_URL;

if (!dbUrl) {
  console.error("⚠️ WARNING: ATLASDB_URL is not defined. Database features will fail.");
  // process.exit(1); // Don't crash, let the app start so we can debug
}

console.log("🚀 Connecting to Database...");
console.log(`Target: ${dbUrl.includes("mongodb+srv") ? "MongoDB Atlas (Cloud)" : "Local MongoDB"}`);

if (dbUrl) {
  mongoose.connect(dbUrl)
    .then(() => {
      console.log("✅ Database Connected Successfully!");
    })
    .catch((err) => {
      console.error("❌ Database Connection Failed:", err);
      console.log("Retrying in 5 seconds...");
      setTimeout(() => {
        if (dbUrl) mongoose.connect(dbUrl).catch(e => console.error("Retry failed:", e));
      }, 5000);
    });
} else {
  console.log("⚠️ Skipping Database Connection (ATLASDB_URL missing)");
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connection established.");
});

// --------------------
// Express Setup
// --------------------
const app = express();

// Enable view caching in production for performance
if (process.env.NODE_ENV === "production") {
  app.set("view cache", true);
}

// Initialize Sentry (must be before other middleware)
initSentry(app);
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

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
      console.log("⚡ SOCKET HIT for ai_message:", message);
      require('fs').writeFileSync('socket_hit.txt', `Hit at ${new Date().toISOString()} with: ${message}\n`);
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

const compression = require('compression');

// Compress all HTTP responses
app.use(compression());

// --------------------
// Security Middleware
// --------------------

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://js.stripe.com",
        "https://api.mapbox.com",
        "https://cdn.socket.io",
        "https://maps.googleapis.com",
        "blob:" // Required for Mapbox workers
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com",
        "https://api.mapbox.com",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http:",
        "blob:",
        "*.cloudinary.com",
        "images.unsplash.com",
        "via.placeholder.com",
        "https://*.mapbox.com",
        "https://images.unsplash.com"
      ],
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://*.mapbox.com",
        "https://maps.googleapis.com",
        "http:",
        "wss:",
        "ws:",
        "*.stripe.com"
      ],
      fontSrc: [
        "'self'",
        "https:",
        "http:",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      workerSrc: ["'self'", "blob:"], // Explicitly allow Mapbox workers
      childSrc: ["'self'", "blob:"],
      scriptSrcAttr: ["'unsafe-inline'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      upgradeInsecureRequests: null, // Don't force HTTPS on localhost
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 0, // Explicitly tell the browser to clear HSTS for localhost
    includeSubDomains: true
  },
}));

// MongoDB sanitization - Prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized potentially malicious input: ${key} from IP: ${req.ip}`);
  },
}));

// XSS protection - Sanitize user input
app.use(xss());

// HTTP Parameter Pollution protection
app.use(hpp({
  whitelist: ['price', 'guests', 'bedrooms', 'rating', 'propertyType'] // Allow duplicate params for filters
}));

// Rate limiting configurations
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.',
});

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many booking attempts, please try again later.',
});

// Request logging
app.use(requestLogger);

// Serve static files from public directory with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache static assets for 1 day
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

// Handle favicon.ico requests - redirect to favicon.png
app.get('/favicon.ico', (req, res) => res.redirect('/favicon.png'));

// Health check endpoint for Render/Monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
const healthRouter = require("./routes/health");

app.use("/", healthRouter); // Health check endpoints
app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/vehicles", vehicleRouter);
app.use("/dhabas", dhabaRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/vehicles/:id/reviews", reviewRouter);
app.use("/dhabas/:id/reviews", reviewRouter);
app.use("/admin", adminRoutes);
app.use("/bookings", bookingLimiter, bookingRoutes); // Apply booking rate limiter
app.use("/ai", apiLimiter, aiRoutes); // Apply API rate limiter
app.use("/social", socialRoutes);
app.use("/api/social", apiLimiter, socialInteractions);
app.use("/api/trip", apiLimiter, tripPlannerRoutes);
app.use("/auth", authLimiter, authRoutes); // Apply auth rate limiter
app.use("/api/wishlist", apiLimiter, wishlistRoutes);
app.use("/ai/magic", apiLimiter, aiMagicRouter);
app.use("/trust", trustRouter);
app.use("/api/otp", authLimiter, otpRouter); // Apply auth rate limiter to OTP



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

// DEBUG: Check Cloudinary Config (Safe View)
app.get('/debug/cloudinary', (req, res) => {
  const secret = process.env.CLOUD_API_SECRET || "";
  const key = process.env.CLOUD_API_KEY || "";

  res.json({
    cloud_name: process.env.CLOUD_NAME || "MISSING",
    api_key: {
      length: key.length,
      first_char: key.charAt(0),
      last_char: key.charAt(key.length - 1),
      is_set: !!process.env.CLOUD_API_KEY
    },
    api_secret: {
      length: secret.length,
      first_char: secret.charAt(0),
      last_char: secret.charAt(secret.length - 1),
      is_set: !!process.env.CLOUD_API_SECRET
    },
    timestamp_on_server: Math.floor(Date.now() / 1000)
  });
});

// TEMPORARY DEBUG ROUTE for Email
app.get('/debug/email', async (req, res) => {
  const { transporter } = require('./utils/emailService');

  // 0. TCP Connectivity Test
  const net = require('net');
  const tcpTest = (host, port) => new Promise(resolve => {
    const socket = net.createConnection(port, host, () => {
      socket.end();
      resolve('CONNECTED');
    });
    socket.on('error', err => resolve('ERROR: ' + err.message));
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve('TIMEOUT');
    });
  });

  const tcpResults = {
    'google_443': await tcpTest('google.com', 443),
    'brevo_api_443': await tcpTest('api.brevo.com', 443),
    'gmail_465': await tcpTest('smtp.gmail.com', 465),
    'gmail_587': await tcpTest('smtp.gmail.com', 587)
  };

  // 1. Check Env Vars (Masked)
  const envStatus = {
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    EMAIL_USER: process.env.EMAIL_USER ? 'Set (Ends with ' + process.env.EMAIL_USER.slice(-4) + ')' : 'MISSING',
    BREVO_API_KEY: process.env.BREVO_API_KEY ? 'Set (Starts with ' + process.env.BREVO_API_KEY.slice(0, 5) + '...)' : 'MISSING',
    BASE_URL: process.env.BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ATLASDB_URL: process.env.ATLASDB_URL ? 'Set' : 'MISSING',
    CLEANED_LOGIC: transporter.debugInfo
  };

  try {
    const { sendEmailViaBrevo } = require('./utils/emailService');
    const targetEmail = req.user ? req.user.email : (process.env.EMAIL_USER || 'test@example.com');

    let info;
    if (process.env.BREVO_API_KEY) {
      // 2. Test Brevo API
      info = await sendEmailViaBrevo({
        to: targetEmail,
        subject: 'Render Debug Test (Brevo API)',
        text: 'If you see this, Brevo API is working on Render!',
        html: '<h1>Brevo API Test</h1><p>Working!</p>'
      });
    } else {
      // Fallback to Transporter verify
      await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
          if (error) reject(error);
          else resolve(success);
        });
      });

      info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: targetEmail,
        subject: 'Render Debug Test (SMTP)',
        text: 'If you see this, SMTP is working (Unlikely on Render Free)!'
      });
    }

    res.json({
      status: 'Success',
      message: 'Email sent successfully!',
      messageId: info.messageId,
      recipient: targetEmail,
      tcp: tcpResults,
      env: envStatus
    });

  } catch (error) {
    res.status(500).json({
      status: 'Failed',
      error: error.message,
      stack: error.stack,
      tcp: tcpResults,
      env: envStatus
    });
  }
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

// Sentry Error Handler - Must be before other error handlers
app.use(Sentry.Handlers.errorHandler());

// Error Handler
app.use((err, req, res, next) => {
  // Log error
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
  });

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
