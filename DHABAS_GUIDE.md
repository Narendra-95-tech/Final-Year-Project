# Dhabas Section Enhancement - Complete Guide

## 🍴 Overview

Comprehensive dhaba/restaurant system with table booking, meal ordering, detailed ratings, menu display, Google Maps integration, and Stripe payment processing.

---

## ✨ Features Implemented

### 1. **Enhanced Dhaba Model**

#### New Fields Added
```javascript
// Detailed ratings (4 categories)
detailedRatings: {
  foodTaste: Number (0-5),
  hygiene: Number (0-5),
  service: Number (0-5),
  ambience: Number (0-5)
}

// Complete menu system
menuItems: [{
  name: String,
  description: String,
  price: Number,
  category: String, // Starters, Main Course, Breads, etc.
  isVegetarian: Boolean,
  isVegan: Boolean,
  isSignatureDish: Boolean,
  image: { url, filename },
  spiceLevel: String, // Mild, Medium, Hot, Extra Hot
  preparationTime: Number, // minutes
  isAvailable: Boolean,
  calories: Number,
  allergens: [String]
}]

// Table booking system
tables: {
  totalTables: Number,
  availableTables: Number,
  tableTypes: [{
    type: String, // 2-seater, 4-seater, etc.
    count: Number,
    pricePerHour: Number
  }]
}

// Popularity tracking
totalOrders: Number,
weeklyOrders: Number,
monthlyOrders: Number,
lastOrderDate: Date,
popularityScore: Number
```

### 2. **Booking System for Tables and Meals**

#### Features
- **Dual Booking Types**:
  - Table booking (reserve tables)
  - Meal ordering (food delivery/takeout)
- **Date and time selection**
- **Guest count selection**
- **Table type selection** (2-seater, 4-seater, 6-seater, 8-seater, Private Room)
- **Real-time price calculation**
- **Stripe payment integration**

#### Implementation
```javascript
class DhabaBookingSystem {
  - selectTable(tableType, price)
  - addToCart(item)
  - removeFromCart(itemId)
  - updateQuantity(itemId, change)
  - calculateSubtotal()
  - calculateTax() // 5% GST
  - calculateTotal()
  - validateBooking()
  - getBookingData()
}
```

### 3. **Menu Display with Signature Dishes**

#### Features
- **Menu categories**:
  - Starters
  - Main Course
  - Breads
  - Rice
  - Desserts
  - Beverages
  - Snacks
  - Specials
- **Signature dishes section** (highlighted)
- **Dish images** with descriptions
- **Price display**
- **Dietary indicators** (Veg/Non-Veg/Vegan)
- **Spice level indicators**
- **Preparation time**
- **Availability status**
- **Add to cart functionality**

#### Menu Card Display
```html
<div class="menu-item-card">
  <img src="dish-image.jpg" class="menu-item-image">
  <div class="menu-item-info">
    <h6 class="menu-item-name">Butter Chicken</h6>
    <div class="menu-item-badges">
      <span class="menu-badge signature">Signature</span>
      <span class="menu-badge spicy">Medium Spicy</span>
    </div>
    <p class="menu-item-description">Tender chicken in rich tomato gravy...</p>
    <div class="menu-item-footer">
      <span class="menu-item-price">₹350</span>
      <button class="menu-item-add-btn">Add to Cart</button>
    </div>
  </div>
</div>
```

### 4. **Multi-Category Rating System**

#### Rating Categories
1. **Food Taste** (0-5 stars)
2. **Hygiene** (0-5 stars)
3. **Service** (0-5 stars)
4. **Ambience** (0-5 stars)

#### Display
```html
<div class="detailed-ratings">
  <div class="rating-item">
    <div class="rating-label">Food Taste</div>
    <div class="rating-value">
      <span class="rating-stars">★★★★★</span>
      <span class="rating-number">4.8</span>
    </div>
  </div>
  <!-- Repeat for other categories -->
</div>
```

#### Review Submission
```javascript
{
  dhabaId: ObjectId,
  userId: ObjectId,
  ratings: {
    foodTaste: 5,
    hygiene: 4,
    service: 5,
    ambience: 4
  },
  comment: "Excellent food and service!",
  orderVerified: true // Only if user has ordered
}
```

### 5. **Google Maps Integration**

#### Features
- **Interactive map** showing dhaba location
- **Marker** with dhaba name
- **Info window** with details
- **Directions** to dhaba
- **Nearby dhabas** finder
- **Distance calculation**

#### Implementation
```javascript
function initDhabaMap(lat, lng, dhabaName) {
  const map = new google.maps.Map(mapContainer, {
    center: { lat, lng },
    zoom: 15
  });

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    title: dhabaName,
    animation: google.maps.Animation.DROP
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<h6>${dhabaName}</h6><p>Click for directions</p>`
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}
```

#### Find Nearby Dhabas
```javascript
async function findNearbyDhabas(lat, lng, radius = 5000) {
  const response = await fetch(`/dhabas/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  const data = await response.json();
  return data.dhabas;
}
```

### 6. **Dish Images and Descriptions**

#### Image Storage
- **Cloudinary integration** for image uploads
- **Multiple images per dish** (optional)
- **Image optimization** for web
- **Lazy loading** for performance

#### Dish Information
```javascript
{
  name: "Paneer Tikka Masala",
  description: "Grilled cottage cheese cubes in creamy tomato gravy with aromatic spices",
  image: {
    url: "https://res.cloudinary.com/.../paneer-tikka.jpg",
    filename: "paneer-tikka-123"
  },
  price: 280,
  category: "Main Course",
  isVegetarian: true,
  isSignatureDish: true,
  spiceLevel: "Medium",
  preparationTime: 20,
  calories: 450,
  allergens: ["Dairy", "Nuts"]
}
```

### 7. **Top-Rated and Popular Dhabas**

#### Top-Rated Section
- **Highest average rating** (based on all 4 categories)
- **Minimum review count** (e.g., 10+ reviews)
- **Visual highlight** with special styling
- **Badge display** ("Top Rated")

#### Most Popular This Week
- **Based on weekly orders** count
- **Trending indicator**
- **Popularity score** calculation
- **Updated weekly**

#### Calculation
```javascript
// Popularity Score Formula
popularityScore = (weeklyOrders * 0.4) + 
                  (averageRating * 20 * 0.3) + 
                  (totalReviews * 0.2) + 
                  (monthlyOrders * 0.1)

// Top Rated Criteria
averageRating >= 4.5 && totalReviews >= 10

// Popular This Week Criteria
weeklyOrders >= 50 || popularityScore >= 100
```

### 8. **Stripe Payment Integration**

#### Payment Flow
1. User completes booking/order
2. System creates payment intent
3. Stripe checkout modal opens
4. User enters card details
5. Payment processed
6. Booking confirmed
7. Receipt generated

#### Implementation
```javascript
async function processPayment(amount, dhabaId, bookingData) {
  // Create payment intent
  const response = await fetch('/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      dhabaId,
      bookingData,
      type: 'dhaba'
    })
  });

  const { clientSecret } = await response.json();
  
  // Confirm payment with Stripe
  const stripe = Stripe(STRIPE_PUBLIC_KEY);
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: { name, email }
    }
  });

  if (result.error) {
    // Handle error
  } else {
    // Payment successful
    window.location.href = `/bookings/${result.paymentIntent.id}/confirmation`;
  }
}
```

---

## 📁 Files Created

### CSS Files
```
/public/css/dhabas.css (700+ lines)
- Dhaba card styles
- Menu display styles
- Detailed ratings styles
- Table booking styles
- Order cart styles
- Top-rated section styles
- Map container styles
- Responsive design
- Dark mode support
```

### JavaScript Files
```
/public/js/dhabas.js (450+ lines)
- DhabaBookingSystem class
- Menu filtering
- Cart management
- Google Maps integration
- Stripe payment processing
- Nearby dhabas finder
```

### View Files
```
/views/dhabas/index-enhanced.ejs (to be created)
- Enhanced dhaba listing page
- Detailed ratings display
- Menu categories
- Top-rated section
- Popular this week section
```

---

## 🎨 UI Components

### Dhaba Card
```
┌─────────────────────────┐
│  [Image]                │
│  🔥 Popular  North Indian│
│  ✓ Open / ✗ Closed      │
├─────────────────────────┤
│  Detailed Ratings:       │
│  Food: ★★★★★ 4.8        │
│  Hygiene: ★★★★☆ 4.5     │
│  Service: ★★★★★ 4.9     │
│  Ambience: ★★★★☆ 4.6    │
├─────────────────────────┤
│  Dhaba Name             │
│  📍 Location            │
│  ₹₹ Price Range         │
│  [View Menu] [Book]     │
└─────────────────────────┘
```

### Menu Display
```
┌─────────────────────────────────┐
│  Menu                            │
│  [All] [Starters] [Main] [Desserts]│
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ [Image] Dish Name       │   │
│  │         🌱 Veg 🔥 Spicy │   │
│  │         Description...   │   │
│  │         ₹250  [Add +]   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Order Cart (Fixed)
```
┌─────────────────────────┐
│  Your Order        [×]  │
├─────────────────────────┤
│  Butter Chicken         │
│  ₹350                   │
│  [-] 2 [+]             │
├─────────────────────────┤
│  Naan                   │
│  ₹40                    │
│  [-] 3 [+]             │
├─────────────────────────┤
│  Total: ₹820            │
│  [Proceed to Checkout]  │
└─────────────────────────┘
```

---

## 🔧 Integration Steps

### 1. Update Dhaba Model
```bash
# Already done - model updated with new fields
```

### 2. Add CSS and JS Files
```html
<!-- In boilerplate.ejs -->
<link rel="stylesheet" href="/css/dhabas.css">
<script src="/js/dhabas.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
<script src="https://js.stripe.com/v3/"></script>
```

### 3. Create API Endpoints

#### Get Nearby Dhabas
```javascript
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;
  
  const dhabas = await Dhaba.find({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius)
      }
    }
  }).limit(10);
  
  res.json({ dhabas });
});
```

#### Create Dhaba Booking
```javascript
router.post('/bookings/dhaba/create', isLoggedIn, async (req, res) => {
  const { dhabaId, bookingType, selectedTable, selectedDate, selectedTime, guests, orderItems, totalPrice } = req.body;
  
  const booking = new Booking({
    dhaba: dhabaId,
    user: req.user._id,
    date: selectedDate,
    time: selectedTime,
    guests,
    totalPrice,
    type: 'dhaba',
    status: 'Pending',
    bookingType, // 'table' or 'meal'
    tableType: selectedTable?.type,
    orderItems: orderItems || []
  });
  
  await booking.save();
  
  // Update dhaba statistics
  await Dhaba.findByIdAndUpdate(dhabaId, {
    $inc: {
      totalOrders: 1,
      weeklyOrders: 1,
      monthlyOrders: 1
    },
    lastOrderDate: new Date()
  });
  
  res.json({ success: true, bookingId: booking._id });
});
```

#### Stripe Payment Intent
```javascript
router.post('/create-payment-intent', isLoggedIn, async (req, res) => {
  const { amount, dhabaId, bookingData } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // in paise
    currency: 'inr',
    metadata: {
      dhabaId,
      userId: req.user._id.toString(),
      bookingType: bookingData.bookingType
    }
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

#### Submit Detailed Review
```javascript
router.post('/:id/reviews/detailed', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { foodTaste, hygiene, service, ambience, comment } = req.body;
  
  const review = new Review({
    author: req.user._id,
    comment,
    rating: (foodTaste + hygiene + service + ambience) / 4, // Overall
    detailedRatings: {
      foodTaste,
      hygiene,
      service,
      ambience
    }
  });
  
  await review.save();
  
  const dhaba = await Dhaba.findById(id);
  dhaba.reviews.push(review._id);
  
  // Update dhaba's detailed ratings (average)
  const allReviews = await Review.find({ _id: { $in: dhaba.reviews } });
  dhaba.detailedRatings = {
    foodTaste: avg(allReviews.map(r => r.detailedRatings.foodTaste)),
    hygiene: avg(allReviews.map(r => r.detailedRatings.hygiene)),
    service: avg(allReviews.map(r => r.detailedRatings.service)),
    ambience: avg(allReviews.map(r => r.detailedRatings.ambience))
  };
  
  await dhaba.save();
  
  res.json({ success: true });
});
```

### 4. Environment Variables
```env
# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSy...

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 📊 Database Schema Updates

### Dhaba Model (Enhanced)
```javascript
{
  // Existing fields...
  detailedRatings: {
    foodTaste: Number,
    hygiene: Number,
    service: Number,
    ambience: Number
  },
  menuItems: [{
    name: String,
    description: String,
    price: Number,
    category: String,
    isVegetarian: Boolean,
    isVegan: Boolean,
    isSignatureDish: Boolean,
    image: { url, filename },
    spiceLevel: String,
    preparationTime: Number,
    isAvailable: Boolean,
    calories: Number,
    allergens: [String]
  }],
  tables: {
    totalTables: Number,
    availableTables: Number,
    tableTypes: [{
      type: String,
      count: Number,
      pricePerHour: Number
    }]
  },
  totalOrders: Number,
  weeklyOrders: Number,
  monthlyOrders: Number,
  lastOrderDate: Date,
  popularityScore: Number
}
```

### Review Model (Enhanced)
```javascript
{
  author: ObjectId,
  comment: String,
  rating: Number, // Overall average
  detailedRatings: {
    foodTaste: Number,
    hygiene: Number,
    service: Number,
    ambience: Number
  },
  orderVerified: Boolean,
  createdAt: Date
}
```

### Booking Model (Dhaba-specific)
```javascript
{
  dhaba: ObjectId,
  user: ObjectId,
  date: Date,
  time: String,
  guests: Number,
  bookingType: String, // 'table' or 'meal'
  tableType: String, // if bookingType is 'table'
  orderItems: [{
    menuItemId: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalPrice: Number,
  paymentStatus: String,
  paymentId: String,
  status: String,
  type: 'dhaba'
}
```

---

## 🧪 Testing Checklist

### Booking System
- [ ] Table booking works
- [ ] Meal ordering works
- [ ] Date/time selection works
- [ ] Guest count updates
- [ ] Price calculation accurate
- [ ] Cart functionality works
- [ ] Checkout process smooth

### Menu Display
- [ ] All categories display
- [ ] Filtering works
- [ ] Images load correctly
- [ ] Add to cart works
- [ ] Signature dishes highlighted
- [ ] Dietary badges show correctly

### Ratings
- [ ] All 4 categories display
- [ ] Star ratings accurate
- [ ] Review submission works
- [ ] Average calculation correct
- [ ] Rating updates in real-time

### Maps
- [ ] Map loads correctly
- [ ] Marker shows location
- [ ] Info window displays
- [ ] Directions work
- [ ] Nearby dhabas found
- [ ] Responsive on mobile

### Payment
- [ ] Stripe integration works
- [ ] Payment intent created
- [ ] Card processing works
- [ ] Confirmation received
- [ ] Receipt generated

### Popular/Top-Rated
- [ ] Top-rated dhabas display
- [ ] Popular this week shows
- [ ] Calculations accurate
- [ ] Updates weekly
- [ ] Badges display correctly

---

## 🚀 Deployment

### 1. Install Dependencies
```bash
npm install stripe @google/maps
```

### 2. Set Environment Variables
```bash
GOOGLE_MAPS_API_KEY=your_key
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Seed Menu Data
```javascript
// Create sample menu items
const sampleMenuItems = [
  {
    name: "Butter Chicken",
    description: "Tender chicken in rich tomato gravy",
    price: 350,
    category: "Main Course",
    isVegetarian: false,
    isSignatureDish: true,
    spiceLevel: "Medium",
    preparationTime: 20
  },
  // Add more items...
];
```

### 4. Test Everything
```bash
# Test booking flow
# Test payment integration
# Test maps integration
# Test menu display
```

---

## 📱 Mobile Optimization

- Touch-friendly menu cards
- Swipeable menu categories
- Bottom sheet for cart
- Optimized map sizing
- Large tap targets (40px+)

---

## 🎯 Future Enhancements

### Phase 2
- [ ] Live order tracking
- [ ] Table availability calendar
- [ ] Chef's special of the day
- [ ] Loyalty rewards program
- [ ] Group ordering

### Phase 3
- [ ] Video menu (dish preparation)
- [ ] AR menu preview
- [ ] Voice ordering
- [ ] Multi-language support
- [ ] Dietary preference filters

---

**Status**: ✅ **READY FOR IMPLEMENTATION**
**Version**: 1.0
**Last Updated**: 2024
