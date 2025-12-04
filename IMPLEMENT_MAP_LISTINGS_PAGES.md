# 🗺️ Implement Map Listings View - Step-by-Step Guide

## Overview

This guide shows how to update your Listings, Vehicles, and Dhabas index pages to use the Map Listings View.

---

## 1. Update Listings Index Page

### File: `views/listings/index.ejs`

**Replace entire file with:**

```html
<% layout("/layouts/boilerplate") -%>

<!-- Map Listings View Container -->
<div id="map-listings-container"></div>

<!-- Listing Data Script -->
<script type="application/json" id="listings-data">
  <%- JSON.stringify(listings) %>
</script>

<!-- Initialize Map Listings View -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Get listings data
    const listingsData = JSON.parse(document.getElementById('listings-data').textContent);
    
    // Initialize map view
    const mapView = new MapListingsView('map-listings-container', {
      mapToken: '<%= mapToken %>',
      listings: listingsData,
      listingType: 'listings',
      onListingSelect: (listing) => {
        console.log('Selected listing:', listing.title);
      }
    });
  });
</script>
```

### Update Controller: `controllers/listings.js`

```javascript
module.exports.index = async (req, res) => {
  const listings = await Listing.find()
    .populate('owner')
    .populate('reviews');
  
  res.render('listings/index', { 
    listings,
    mapToken: process.env.MAP_TOKEN
  });
};
```

---

## 2. Update Vehicles Index Page

### File: `views/vehicles/index.ejs`

**Replace entire file with:**

```html
<% layout("/layouts/boilerplate") -%>

<!-- Map Listings View Container -->
<div id="map-listings-container"></div>

<!-- Vehicle Data Script -->
<script type="application/json" id="vehicles-data">
  <%- JSON.stringify(vehicles) %>
</script>

<!-- Initialize Map Listings View -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Get vehicles data
    const vehiclesData = JSON.parse(document.getElementById('vehicles-data').textContent);
    
    // Initialize map view
    const mapView = new MapListingsView('map-listings-container', {
      mapToken: '<%= mapToken %>',
      listings: vehiclesData,
      listingType: 'vehicles',
      onListingSelect: (vehicle) => {
        console.log('Selected vehicle:', vehicle.title);
      }
    });
  });
</script>
```

### Update Controller: `controllers/vehicles.js`

```javascript
module.exports.index = async (req, res) => {
  const vehicles = await Vehicle.find()
    .populate('owner')
    .populate('reviews');
  
  res.render('vehicles/index', { 
    vehicles,
    mapToken: process.env.MAP_TOKEN
  });
};
```

---

## 3. Update Dhabas Index Page

### File: `views/dhabas/index.ejs`

**Replace entire file with:**

```html
<% layout("/layouts/boilerplate") -%>

<!-- Map Listings View Container -->
<div id="map-listings-container"></div>

<!-- Dhaba Data Script -->
<script type="application/json" id="dhabas-data">
  <%- JSON.stringify(dhabas) %>
</script>

<!-- Initialize Map Listings View -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Get dhabas data
    const dhabasData = JSON.parse(document.getElementById('dhabas-data').textContent);
    
    // Initialize map view
    const mapView = new MapListingsView('map-listings-container', {
      mapToken: '<%= mapToken %>',
      listings: dhabasData,
      listingType: 'dhabas',
      onListingSelect: (dhaba) => {
        console.log('Selected dhaba:', dhaba.title);
      }
    });
  });
</script>
```

### Update Controller: `controllers/dhabas.js`

```javascript
module.exports.index = async (req, res) => {
  const dhabas = await Dhaba.find()
    .populate('owner')
    .populate('reviews');
  
  res.render('dhabas/index', { 
    dhabas,
    mapToken: process.env.MAP_TOKEN
  });
};
```

---

## 4. Data Requirements

Ensure each listing object has these fields:

```javascript
{
  _id: 'unique-id',
  title: 'Name',
  description: 'Description',
  price: 5000,
  location: 'City, State',
  country: 'Country',
  image: {
    url: 'https://...',
    filename: 'name'
  },
  geometry: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  rating: 4.5,
  reviews: [],
  createdAt: '2025-01-01'
}
```

---

## 5. Ensure Geometry Data

If listings don't have geometry data, add it during creation:

### In Listing Controller

```javascript
module.exports.createListing = async (req, res, next) => {
  try {
    // Geocode location
    const response = await geocodingClient.forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    }).send();
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url: req.file.path, filename: req.file.filename };
    
    // Add geometry from geocoding
    if (response.body.features[0]) {
      newListing.geometry = response.body.features[0].geometry;
    }
    
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};
```

---

## 6. Backfill Missing Geometry

If you have existing listings without geometry, run this script:

### File: `scripts/backfill-geometry.js`

```javascript
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const geocodingClient = require('@mapbox/mapbox-sdk/services/geocoding');

const client = geocodingClient({ 
  accessToken: process.env.MAP_TOKEN 
});

async function backfillGeometry() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');
    
    // Find listings without geometry
    const listings = await Listing.find({ 
      $or: [
        { geometry: { $exists: false } },
        { geometry: null }
      ]
    });
    
    console.log(`Found ${listings.length} listings without geometry`);
    
    for (let listing of listings) {
      try {
        const response = await client.forwardGeocode({
          query: listing.location,
          limit: 1,
        }).send();
        
        if (response.body.features[0]) {
          listing.geometry = response.body.features[0].geometry;
          await listing.save();
          console.log(`✅ Updated: ${listing.title}`);
        }
      } catch (err) {
        console.log(`❌ Error for ${listing.title}:`, err.message);
      }
    }
    
    console.log('✅ Backfill complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

backfillGeometry();
```

**Run with:**
```bash
node scripts/backfill-geometry.js
```

---

## 7. Testing

### Test Checklist

- [ ] Map loads without errors
- [ ] All listings show as markers
- [ ] Sidebar displays all listings
- [ ] Search filters correctly
- [ ] Sorting works (all 5 options)
- [ ] Marker selection highlights
- [ ] Popup shows on click
- [ ] "View Details" button works
- [ ] "Get Directions" button works
- [ ] Responsive on desktop
- [ ] Responsive on tablet
- [ ] Responsive on mobile
- [ ] Dark mode works
- [ ] No console errors

### Manual Testing

1. **Desktop**: Open in Chrome, Firefox, Safari
2. **Tablet**: Test on iPad or tablet device
3. **Mobile**: Test on iPhone or Android
4. **Dark Mode**: Enable system dark mode
5. **Search**: Type in search box
6. **Sort**: Try each sort option
7. **Markers**: Click different markers
8. **Buttons**: Test all buttons

---

## 8. Troubleshooting

### Issue: Map not showing

**Solution:**
```javascript
// Check if mapToken is passed
console.log('mapToken:', '<%= mapToken %>');

// Check if listings have geometry
console.log('listings:', <%= JSON.stringify(listings) %>);
```

### Issue: Markers not visible

**Solution:**
```javascript
// Verify coordinates format [lng, lat]
listings.forEach(l => {
  if (l.geometry && l.geometry.coordinates) {
    console.log('Coords:', l.geometry.coordinates);
  }
});
```

### Issue: Search not working

**Solution:**
```javascript
// Check if search input exists
const searchInput = document.getElementById('listings-search');
console.log('Search input:', searchInput);

// Verify listings have title/location
listings.forEach(l => {
  console.log('Title:', l.title, 'Location:', l.location);
});
```

### Issue: Slow performance

**Solution:**
```javascript
// Reduce listings count
const filtered = listings.slice(0, 100);

// Or use clustering
mapView.addClusteredMarkers('listings', features);
```

---

## 9. Customization

### Change Sidebar Width

```html
<style>
  .listings-sidebar {
    width: 400px !important;
  }
</style>
```

### Change Header Color

```html
<style>
  .listings-header {
    background: linear-gradient(135deg, #667eea, #764ba2) !important;
  }
</style>
```

### Add Custom Callback

```javascript
const mapView = new MapListingsView('map-listings-container', {
  mapToken: '<%= mapToken %>',
  listings: listingsData,
  listingType: 'listings',
  onListingSelect: (listing) => {
    // Your custom logic
    console.log('Selected:', listing);
    // Example: Track analytics
    // analytics.track('listing_selected', { id: listing._id });
  }
});
```

---

## 10. Advanced Features

### Add Filters

```javascript
// Add price filter
const priceFilter = document.createElement('input');
priceFilter.type = 'range';
priceFilter.min = '0';
priceFilter.max = '10000';
priceFilter.addEventListener('change', (e) => {
  const maxPrice = e.target.value;
  const filtered = listingsData.filter(l => l.price <= maxPrice);
  mapView.listings = filtered;
  mapView.renderListingsList();
});
```

### Add Amenities Filter

```javascript
// Filter by amenities
const amenitiesFilter = document.createElement('select');
amenitiesFilter.addEventListener('change', (e) => {
  const amenity = e.target.value;
  const filtered = listingsData.filter(l => 
    l.amenities && l.amenities.includes(amenity)
  );
  mapView.listings = filtered;
  mapView.renderListingsList();
});
```

### Add Rating Filter

```javascript
// Filter by minimum rating
const ratingFilter = document.createElement('select');
ratingFilter.addEventListener('change', (e) => {
  const minRating = parseFloat(e.target.value);
  const filtered = listingsData.filter(l => 
    (l.rating || 0) >= minRating
  );
  mapView.listings = filtered;
  mapView.renderListingsList();
});
```

---

## 11. Performance Optimization

### Lazy Load Images

```javascript
// In map-listings-view.js, update image loading
const img = document.createElement('img');
img.loading = 'lazy';
img.src = listing.image?.url;
```

### Debounce Search

```javascript
// Add debounce to search
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const searchInput = document.getElementById('listings-search');
searchInput.addEventListener('input', debounce((e) => {
  mapView.filterListings(e.target.value);
}, 300));
```

### Limit Initial Listings

```javascript
// Show only first 50 listings initially
const initialListings = listingsData.slice(0, 50);
const mapView = new MapListingsView('map-listings-container', {
  mapToken: '<%= mapToken %>',
  listings: initialListings,
  listingType: 'listings'
});

// Load more on scroll
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    // Load more listings
  }
});
```

---

## 12. Deployment Checklist

- [ ] All files created
- [ ] Controllers updated
- [ ] Views updated
- [ ] Routes updated (if needed)
- [ ] Geometry data backfilled
- [ ] Tested on desktop
- [ ] Tested on tablet
- [ ] Tested on mobile
- [ ] Dark mode tested
- [ ] No console errors
- [ ] Performance optimized
- [ ] Ready for production

---

## 13. Rollback Plan

If you need to revert to the old view:

```javascript
// Keep old index view as index-old.ejs
// Update route to use old view if needed
router.get('/listings-old', (req, res) => {
  res.render('listings/index-old', { listings });
});
```

---

## 14. Monitoring

### Add Analytics

```javascript
// Track user interactions
const mapView = new MapListingsView('map-listings-container', {
  mapToken: '<%= mapToken %>',
  listings: listingsData,
  onListingSelect: (listing) => {
    // Send analytics
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event: 'listing_selected',
        listing_id: listing._id,
        listing_type: 'listings'
      })
    });
  }
});
```

### Monitor Performance

```javascript
// Measure load time
const startTime = performance.now();

const mapView = new MapListingsView('map-listings-container', {
  mapToken: '<%= mapToken %>',
  listings: listingsData
});

const endTime = performance.now();
console.log(`Map loaded in ${endTime - startTime}ms`);
```

---

## Summary

### Files to Update

1. ✅ `views/listings/index.ejs` - Replace with map view
2. ✅ `views/vehicles/index.ejs` - Replace with map view
3. ✅ `views/dhabas/index.ejs` - Replace with map view
4. ✅ `controllers/listings.js` - Add mapToken
5. ✅ `controllers/vehicles.js` - Add mapToken
6. ✅ `controllers/dhabas.js` - Add mapToken

### Optional

- 🔄 Run backfill script for geometry data
- 🔄 Add custom filters
- 🔄 Add analytics tracking
- 🔄 Optimize performance

### Testing

- ✅ Desktop browsers
- ✅ Mobile devices
- ✅ Dark mode
- ✅ All features
- ✅ Performance

---

**Status**: 🟢 Ready to Implement | **Version**: 1.0 | **Last Updated**: Dec 3, 2025
