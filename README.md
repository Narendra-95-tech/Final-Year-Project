<<<<<<< HEAD
# WanderLust - Complete Travel Platform

A comprehensive travel platform that combines vacation rentals, vehicle rentals, and local dhaba (restaurant) listings in one seamless experience.

# WanderLust - Complete Travel Platform

A comprehensive travel platform that combines vacation rentals, vehicle rentals, and local dhaba (restaurant) listings in one seamless experience.

## 🚀 Features

### 🏡 Vacation Rentals (Listings)
- Browse and search vacation homes, apartments, and unique stays
- Advanced filtering by price, location, and amenities
- Interactive maps with location-based search
- Owner dashboard for listing management
- Airbnb-style layout with professional cards

### 🚗 Vehicle Rentals
- Rent cars, bikes, vans, trucks, and scooters
- Filter by vehicle type, brand, fuel type, transmission, and seats
- Real-time availability checking
- Comprehensive vehicle specifications
- Clean booking cards with pricing and details

### 🍽️ Local Dhabas
- Discover authentic local restaurants and eateries
- Filter by cuisine type, price range, and ratings
- Star rating system (1-5 stars)
- Interactive maps showing exact locations
- Zomato-style restaurant listings

## 🎨 Modern UI/UX

- **Orange Theme**: Beautiful orange accent colors (#ff6b35)
- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Modern Cards**: Rounded corners, shadows, hover effects
- **Smooth Animations**: CSS transitions and hover effects
- **Professional Layout**: Clean, modern interface throughout

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: EJS templating, Bootstrap 5, Font Awesome
- **Authentication**: Passport.js with local strategy
- **File Upload**: Cloudinary integration (ready)
- **Maps**: Mapbox integration for location services
- **Payments**: Stripe integration (ready for implementation)

## 📱 Complete MVC Architecture

### Models
- **User**: Authentication and profile management
- **Listing**: Vacation rental properties
- **Vehicle**: Rental vehicles with specifications
- **Dhaba**: Restaurants with ratings and details
- **Review**: Review and rating system
- **Booking**: Booking management system

### Controllers
- **listings.js**: CRUD operations for vacation rentals
- **vehicles.js**: CRUD operations for vehicle rentals
- **dhabas.js**: CRUD operations for restaurants
- **users.js**: User management and authentication
- **reviews.js**: Review and rating management

### Routes
- **/listings**: Vacation rental routes
- **/vehicles**: Vehicle rental routes
- **/dhabas**: Restaurant listing routes
- **/search**: Global search across all sections
- **/users**: Authentication routes

### Views
- **listings/**: Vacation rental templates
- **vehicles/**: Vehicle rental templates
- **dhabas/**: Restaurant listing templates
- **search.ejs**: Global search results
- **home.ejs**: Featured content from all sections

## 🌐 Global Search & Filtering

### Universal Search
- Search across all three sections simultaneously
- Smart field matching for each section
- Real-time results with beautiful cards

### Advanced Filtering
- **Listings**: Price, location, amenities, guest capacity
- **Vehicles**: Type, brand, fuel, transmission, seats, price
- **Dhabas**: Cuisine, price range, rating, location

### Smart Sorting
- Multiple sort options for each section
- Price-based sorting (low to high, high to low)
- Rating-based sorting (highest rated first)
- Date-based sorting (newest first)

## 📊 Sample Data

### Vacation Rentals (18+ listings)
- Beachfront cottages, mountain cabins, luxury villas
- Various price ranges from budget to premium
- Global locations (Malibu, NYC, Aspen, Costa Rica, etc.)

### Vehicle Rentals (6+ vehicles)
- Cars: Toyota Innova, Maruti Swift, Mahindra Thar
- Bikes: Royal Enfield Classic 350, Bajaj Pulsar 220
- Scooters: Honda Activa 6G
- Complete specifications and pricing

### Local Dhabas (6+ restaurants)
- Various cuisines: North Indian, Punjabi, South Indian
- Different price ranges: ₹100-300 to ₹800+
- Star ratings from 4.1 to 4.6
- Real locations in major Indian cities

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Mapbox account for maps functionality (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Narendra-95-tech/MAJORPROJECT.git
   cd MAJORPROJECT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   ATLASDB_URL=your_mongodb_connection_string
   MAP_TOKEN=your_mapbox_token (optional)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name (optional)
   CLOUDINARY_API_KEY=your_cloudinary_key (optional)
   CLOUDINARY_API_SECRET=your_cloudinary_secret (optional)
   ```

4. **Seed the database**
   ```bash
   # Seed all sections with sample data
   npm run seed

   # Or seed individual sections
   npm run seed:listings
   npm run seed:vehicles
   npm run seed:dhabas
   ```

5. **Start the server**
   ```bash
   node app.js
   ```

6. **Open your browser**
   ```
   http://localhost:8080
   ```

## 📋 Usage

### 🏠 Homepage
- Featured content from all three sections
- Quick access to search and browse
- Beautiful hero section with call-to-actions

### 🔍 Search & Browse
- **Global Search**: Search across all sections at once
- **Section-Specific**: Browse individual sections with filters
- **Advanced Filters**: Multiple filter options for each section

### ➕ Add Content
- **Listings**: Add vacation rental properties
- **Vehicles**: Add rental vehicles with specifications
- **Dhabas**: Add restaurants with ratings and details

### ⭐ Reviews & Ratings
- Rate and review all listings
- 5-star rating system
- Owner responses and management

## 🎯 API Endpoints

### Listings
- `GET /listings` - Browse all listings
- `POST /listings` - Create new listing
- `GET /listings/new` - New listing form
- `GET /listings/:id` - View listing details
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing

### Vehicles
- `GET /vehicles` - Browse all vehicles
- `POST /vehicles` - Create new vehicle
- `GET /vehicles/new` - New vehicle form
- `GET /vehicles/:id` - View vehicle details
- `PUT /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Delete vehicle

### Dhabas
- `GET /dhabas` - Browse all dhabas
- `POST /dhabas` - Create new dhaba
- `GET /dhabas/new` - New dhaba form
- `GET /dhabas/:id` - View dhaba details
- `PUT /dhabas/:id` - Update dhaba
- `DELETE /dhabas/:id` - Delete dhaba

### Search
- `GET /search?q=query` - Global search
- `GET /search?q=query&minRating=4.0` - Search with filters

### Authentication
- `GET /signup` - User registration
- `POST /signup` - Create account
- `GET /login` - User login
- `POST /login` - Authenticate
- `GET /logout` - Logout

## 🎨 Design System

### Colors
- **Primary Orange**: #ff6b35
- **Secondary Orange**: #f7931e
- **Accent Orange**: #ff8c42
- **Dark Orange**: #e55a2b
- **Background**: #f8f9fa

### Typography
- **Font Family**: Plus Jakarta Sans
- **Headings**: Bold, modern styling
- **Body Text**: Clean, readable

### Components
- **Cards**: Rounded corners, shadows, hover effects
- **Buttons**: Orange theme with smooth transitions
- **Forms**: Modern styling with focus states
- **Navigation**: Responsive with orange accents

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Perfect layout on tablets
- **Desktop**: Full-featured desktop experience
- **Touch-Friendly**: Large touch targets and smooth interactions

## 🔒 Security Features

- **User Authentication**: Secure login/registration
- **Authorization**: Owner-only edit/delete permissions
- **Input Validation**: Joi schema validation
- **File Upload Security**: Safe file handling
- **XSS Protection**: Secure template rendering

## 🌟 Production Ready

- **Error Handling**: Comprehensive error management
- **Logging**: Console logging for debugging
- **Environment Config**: .env file support
- **Database Optimization**: Efficient queries and indexing
- **Performance**: Optimized loading and rendering

## 📞 Support

For support and questions:
- Email: support@wanderlust.com
- Phone: +91 98765 43210

---

**WanderLust** - Your complete travel companion! 🏖️🚗🍽️
=======
# Full-Project
This My First Project
>>>>>>> 1e071d2d7663b48f93775652bdb0ffcfaad76660
