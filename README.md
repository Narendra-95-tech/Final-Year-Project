# WanderLust - Travel Booking Platform

A comprehensive travel booking platform built with Node.js, Express, and MongoDB. Book stays, rent vehicles, discover local dhabas, and plan your perfect trip with AI assistance.

## 🚀 Features

- **Multi-Category Bookings**: Listings (stays), Vehicles (rentals), Dhabas (dining)
- **AI Trip Planner**: Smart itinerary generation
- **Real-time Chat**: Socket.IO powered messaging
- **Payment Integration**: Stripe for secure payments
- **Social Features**: User profiles, reviews, wishlists
- **Advanced Search**: Filters, map view, and smart recommendations
- **Security**: Helmet, rate limiting, XSS protection, CSRF tokens
- **Monitoring**: Sentry error tracking, Winston logging

## 📋 Prerequisites

- Node.js 18.x or higher
- MongoDB Atlas account
- Cloudinary account (for image uploads)
- Stripe account (for payments)
- Mapbox API key (for maps)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Final-Year-Project
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
ATLASDB_URL=your_mongodb_atlas_connection_string

# Session
SECRET=your_session_secret_key

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_SERVICE=gmail
BREVO_API_KEY=your_brevo_api_key

# URLs
BASE_URL=http://localhost:8080
CLIENT_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key

# Mapbox
MAP_TOKEN=your_mapbox_token

# Security
CSRF_SECRET=your_csrf_secret_here

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Environment
NODE_ENV=development
```

4. **Seed the database** (optional)
```bash
npm run seed
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## 📁 Project Structure

```
Final-Year-Project/
├── config/              # Configuration files
├── controllers/         # Route controllers
├── docs/                # [NEW] Project documentation (walkthroughs, plans)
├── middleware/          # Custom middleware
├── models/              # Mongoose models
├── public/              # Static assets
├── routes/              # Express routes
├── scripts/             # Utility and seed scripts
│   └── tools/           # [NEW] Internal dev tools and debug scripts
├── tests/               # Test files
├── utils/               # Utility functions
├── views/               # EJS templates
└── app.js               # Main application file
```

## 🔒 Security Features

- **Helmet.js**: Security headers (CSP, XSS Protection, etc.)
- **Rate Limiting**: Prevents brute force and DDoS attacks
- **CSRF Protection**: Cross-site request forgery prevention
- **XSS Clean**: Input sanitization
- **MongoDB Sanitization**: NoSQL injection prevention
- **HPP**: HTTP Parameter Pollution protection

## 📊 Monitoring & Logging

- **Sentry**: Real-time error tracking and performance monitoring
- **Winston**: Structured logging with file rotation
- **Health Checks**: `/health` and `/health/ready` endpoints

## 🌐 API Endpoints

### Health Checks
- `GET /health` - Application health status
- `GET /health/ready` - Readiness probe

### Authentication
- `POST /login` - User login (rate limited)
- `POST /signup` - User registration (rate limited)
- `POST /logout` - User logout

### Listings
- `GET /listings` - Get all listings
- `GET /listings/:id` - Get single listing
- `POST /listings` - Create listing (auth required)
- `PUT /listings/:id` - Update listing (owner only)
- `DELETE /listings/:id` - Delete listing (owner only)

### Bookings
- `POST /bookings/initiate` - Initiate booking (rate limited)
- `GET /bookings/my-bookings` - User's bookings
- `PATCH /bookings/:id/cancel` - Cancel booking

## 🚀 Deployment

### Render Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy!

### Environment Variables for Production

Ensure all environment variables from `.env` are added to your Render service, especially:
- `SENTRY_DSN` for error tracking
- `NODE_ENV=production`
- Update `BASE_URL` and `CLIENT_URL` to production URLs

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests with coverage
- `npm run seed` - Seed database with sample data

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

WanderLust Development Team

## 🙏 Acknowledgments

- Express.js team
- MongoDB team
- All open-source contributors
