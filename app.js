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
const cookieParser = require("cookie-parser");
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
const dbUrl = process.env.ATLASDB_URL;

if (!dbUrl) {
  logger.error("⚠️ WARNING: ATLASDB_URL is not defined. Database features will fail.");
  // process.exit(1); // Don't crash, let the app start so we can debug
}

logger.info("🚀 Connecting to Database...");
logger.info("Target: %s", dbUrl.includes("mongodb+srv") ? "MongoDB Atlas (Cloud)" : "Local MongoDB");
logger.info("Server restarted at: " + new Date().toISOString());

if (dbUrl) {
  mongoose.connect(dbUrl)
    .then(() => {
      logger.info("✅ Database Connected Successfully!");
    })
    .catch((err) => {
      logger.error("❌ Database Connection Failed: %O", err);
      logger.info("Retrying in 5 seconds...");
      setTimeout(() => {
        if (dbUrl) mongoose.connect(dbUrl).catch(e => logger.error("Retry failed: %O", e));
      }, 5000);
    });
} else {
  logger.info("⚠️ Skipping Database Connection (ATLASDB_URL missing)");
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  logger.info("Database connection established.");
});

// --------------------
// Express Setup
// --------------------
const app = express();

// Trust proxy - REQUIRED for Render/Heroku deployment (behind reverse proxy)
// This MUST be set before session middleware
app.set('trust proxy', 1);

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
  logger.info('New client connected: %s', socket.id);

  // Handle user authentication and store socket with user ID
  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
      logger.info(`User ${userId} authenticated on socket ${socket.id}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        break;
      }
    }
  });

  // Handle real-time AI Assistant chat
  socket.on('ai_message', async ({ message, userId, context }) => {
    try {
      logger.debug("⚡ SOCKET HIT for ai_message: %s", message);
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
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://js.stripe.com",
        "https://api.mapbox.com",
        "https://cdn.socket.io",
        "https://maps.googleapis.com",
        "https://checkout.razorpay.com",  // Razorpay Checkout
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
        "*.stripe.com",
        "https://api.razorpay.com",        // Razorpay API
        "https://checkout.razorpay.com",   // Razorpay Checkout
        "https://lumberjack.razorpay.com", // Razorpay logging
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
      frameSrc: ["'self'", "https://js.stripe.com", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      upgradeInsecureRequests: null, // Don't force HTTPS on localhost
      formAction: ["'self'", "*.stripe.com"], // Allow forms to submit to self and Stripe
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

// Static Files - Optimized with caching
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0', // 1 year in production
  etag: true, // Enable ETags for cache validation
  lastModified: true, // Enable Last-Modified header
  setHeaders: (res, filePath) => {
    // Set immutable cache for assets (js, css, png, jpg, jpeg, gif, svg, ico, woff, woff2, ttf, eot)
    if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Set shorter cache for HTML files
    if (filePath.match(/\.html$/)) {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }

    // Enable CORS for fonts
    if (filePath.match(/\.(woff|woff2|ttf|eot)$/)) {
      res.set('Access-Control-Allow-Origin', '*');
    }
  }
};

app.use(express.static(path.join(__dirname, "public"), staticOptions));

// Serve minified assets from /dist in production
if (process.env.NODE_ENV === 'production') {
  app.use('/dist', express.static(path.join(__dirname, "public/dist"), staticOptions));
}

// Handle favicon.ico requests - redirect to favicon.png
app.get('/favicon.ico', (req, res) => res.redirect('/favicon.png'));

// Health check endpoint for Render/Monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});



// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  process.env.CLIENT_URL,
  process.env.BASE_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Normalize origins by removing trailing slashes
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(ao => {
      if (!ao) return false;
      return ao.replace(/\/$/, '') === normalizedOrigin;
    });

    if (isAllowed || origin.includes('onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ==========================================
// STRIPE WEBHOOK ROUTE (Must be before body parsers)
// ==========================================
const webhookRouter = require("./routes/webhook");
// Use raw body parser for webhook route to verify signature
app.use("/webhook", express.raw({ type: "application/json" }), webhookRouter);

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

const isProduction = process.env.NODE_ENV === 'production';

const sessionConfig = {
  store,
  name: 'wanderlust.sid',
  secret: process.env.SECRET || 'thisshouldbeabettersecret!',
  resave: false,               // Standard for connect-mongo
  saveUninitialized: false,    // Standard for passport
  rolling: true,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: isProduction || !!process.env.RENDER,
    sameSite: 'lax',            // More reliable for same-site requests
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

// Session diagnostic endpoint (AFTER session/passport middleware)
app.get('/debug/session', (req, res) => {
  const rzpKey = process.env.RAZORPAY_KEY_ID || '';
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET || '';
  res.json({
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    userId: req.user ? req.user._id : null,
    sessionID: req.sessionID,
    sessionExists: !!req.session,
    cookieHeader: req.headers.cookie ? 'Present (length: ' + req.headers.cookie.length + ')' : 'MISSING',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      RENDER: process.env.RENDER || 'not set',
    },
    razorpay: {
      key_set: !!rzpKey,
      key_preview: rzpKey ? rzpKey.substring(0, 12) + '...' + rzpKey.slice(-4) : 'NOT SET',
      key_is_live: rzpKey.startsWith('rzp_live_'),
      key_is_test: rzpKey.startsWith('rzp_test_'),
      secret_set: !!rzpSecret,
      secret_length: rzpSecret.length,
    },
    cookieConfig: {
      secure: sessionConfig.cookie.secure,
      sameSite: sessionConfig.cookie.sameSite,
      name: sessionConfig.name,
    }
  });
});

// --------------------
// Middleware
// Make user and flash messages available in all templates
// Middleware
// Make user and flash messages available in all templates
app.use((req, res, next) => {
  res.locals.currUser = req.user || null;  // For EJS templates using currUser
  res.locals.currentUser = req.user || null; // For any components using currentUser
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  res.locals.isAdmin = req.user && req.user.role === 'admin';

  // FIX: Prevent caching of dynamic HTML pages (Session consistency)
  // If it's a GET request for a page (not assets), disable cache
  if (req.method === 'GET' && !req.path.startsWith('/static') && !req.originalUrl.includes('.')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  // Debug: Log if API request is unauthenticated on Render
  if (!!process.env.RENDER && req.originalUrl.includes('razorpay') && !req.isAuthenticated()) {
    console.warn(`[Session Alert] Unauthenticated Razorpay request: ${req.method} ${req.originalUrl}`);
    console.warn(`[Session Alert] User Object Exists? ${!!req.user}`);
    console.warn(`[Session Alert] Session ID: ${req.sessionID}`);
  }

  next();
});

// Image Optimization Middleware
const { imageOptimizationMiddleware } = require('./utils/imageOptimization');
app.use(imageOptimizationMiddleware);

// --------------------
// Routes
// --------------------
const healthRouter = require("./routes/health");

app.use("/", healthRouter); // Health check endpoints
app.use("/", userRouter);
app.use("/payouts", require("./routes/payouts.js")); // Payouts Route
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
app.get("/trust", trustRouter);
app.use("/api/otp", authLimiter, otpRouter); // Apply auth rate limiter to OTP
app.use("/api/push", require("./routes/push")); // Push notifications

const { isLoggedIn, isAdmin } = require("./middleware.js");

// Marketing Routes
const marketingController = require("./controllers/marketing");
const adminController = require("./controllers/admin");
app.post("/subscribe", marketingController.subscribe);
app.get("/admin", isLoggedIn, isAdmin, adminController.renderDashboard);
app.get("/admin/newsletter", isLoggedIn, isAdmin, marketingController.renderAdminNewsletter);
app.post("/admin/newsletter/test", isLoggedIn, isAdmin, marketingController.sendTestEmail);
app.post("/admin/newsletter/broadcast", isLoggedIn, isAdmin, marketingController.broadcastEmail);

// Cache Management Routes (Admin only)
const { cacheStatsRoute, clearCacheRoute } = require('./middleware/cache');
app.get("/api/cache/stats", isLoggedIn, isAdmin, cacheStatsRoute);
app.post("/api/cache/clear", isLoggedIn, isAdmin, clearCacheRoute);

// Map Routes
const mapRouter = require("./routes/map.js");
app.use("/api/map", mapRouter);

// Interactive Map Page
app.get("/map", (req, res) => {
  res.render("map-search-interactive", {
    title: "Explore on Map | WanderLust",
    description: "Discover listings, vehicles, and dhabas near you with our interactive map.",
    mapToken: process.env.MAP_TOKEN
  });
});



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

// Home route - render homepage directly (with caching for non-logged-in users)
const { cacheMiddleware } = require('./middleware/cache');
app.get("/", cacheMiddleware(300), async (req, res) => {
  try {
    const Listing = require("./models/listing");
    const Vehicle = require("./models/vehicle");
    const Dhaba = require("./models/dhaba");

    // Get featured items from each section (Parallel Execution - Optimized with .lean() and .select())
    const [featuredListings, featuredVehicles, featuredDhabas, localLegendsRaw] = await Promise.all([
      Listing.find({}).select('title description image price location country propertyType rating').sort({ createdAt: -1 }).limit(3).lean(),
      Vehicle.find({}).select('title description image price location vehicleType brand model rating').sort({ createdAt: -1 }).limit(3).lean(),
      Dhaba.find({}).select('title description image price location cuisine category rating').sort({ createdAt: -1 }).limit(3).lean(),
      require("./models/user").find({}).select('firstName lastName email avatar').limit(4).lean()
    ]);

    let localLegends = localLegendsRaw;

    // Augment with legend metadata
    const legendTitles = ["Superhost Elite", "Safe Traveler", "Flavor Master", "Road King"];
    localLegends = localLegends.map((user, i) => {
      const u = { ...user }; // Lean documents are already plain objects, just spread to copy

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

    // Get featured items from each section (Optimized with .lean() and .select())
    const [featuredListings, featuredVehicles, featuredDhabas, localLegendsRaw] = await Promise.all([
      Listing.find({}).select('title description image price location country propertyType rating').sort({ createdAt: -1 }).limit(3).lean(),
      Vehicle.find({}).select('title description image price location vehicleType brand model rating').sort({ createdAt: -1 }).limit(3).lean(),
      Dhaba.find({}).select('title description image price location cuisine category rating').sort({ createdAt: -1 }).limit(3).lean(),
      require("./models/user").find({}).select('firstName lastName email avatar').limit(4).lean()
    ]);

    let localLegends = localLegendsRaw;

    // Augment with legend metadata
    const legendTitles = ["Superhost Elite", "Safe Traveler", "Flavor Master", "Road King"];
    localLegends = localLegends.map((user, i) => {
      const u = { ...user }; // Lean documents are already plain objects, just spread to copy

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

  const { statusCode = 500, message = 'Something went wrong!' } = err;

  // Detect if this is an API/AJAX request that expects JSON
  const isJsonRequest = (
    req.originalUrl.startsWith('/api') ||
    req.originalUrl.includes('/razorpay/') ||
    req.originalUrl.includes('/pay-wallet') ||
    req.originalUrl.includes('/pay-upi') ||
    req.originalUrl.includes('/create-checkout-session') ||
    req.originalUrl.includes('/bookings/initiate') ||
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type']?.includes('application/json') ||
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    req.method === 'DELETE'
  );

  // Return JSON for API/AJAX requests
  if (isJsonRequest) {
    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  // Handle ExpressError specifically
  if (err instanceof ExpressError) {
    // Ensure currUser is always defined for rendering
    if (typeof res.locals.currUser === 'undefined') {
      res.locals.currUser = req.user || null;
    }
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

  // Ensure currUser is always defined before rendering any page
  if (typeof res.locals.currUser === 'undefined') {
    res.locals.currUser = req.user || null;
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
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`WebSocket server is running on port ${PORT}`);
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
      process.exit(1);
    } else {
      logger.error('Server error: %O', error);
      process.exit(1);
    }
  });
}
