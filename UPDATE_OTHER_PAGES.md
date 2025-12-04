# Update Other Pages with Enhanced Map

This guide shows how to update Vehicles and Dhabas pages with the enhanced map system.

## 1. Update Vehicles Detail Page

### File: `views/vehicles/show.ejs`

Replace the old map initialization with:

```javascript
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const vehicleCoords = vehicle.geometry.coordinates;
    if (!vehicleCoords || vehicleCoords.length !== 2) {
      document.getElementById("map").innerHTML = "<p class='text-center mt-3'>Map location not available</p>";
      return;
    }

    // Initialize enhanced map
    const enhancedMap = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: vehicleCoords,
      zoom: 14,
      searchEnabled: true
    });

    // Add vehicle marker
    enhancedMap.addMarker('vehicle', vehicleCoords, {
      color: 'green',
      title: vehicle.title,
      description: `${vehicle.type} | ₹${vehicle.price.toLocaleString("en-IN")}/day`,
      popup: true
    });

    // User location
    const userLat = 19.85;
    const userLng = 75.93;

    // Add route on transport mode change
    async function updateRoute() {
      const transportSelect = document.getElementById("transport-mode");
      const transportMode = transportSelect.value;

      try {
        const routeData = await enhancedMap.addRoute('vehicle-route', [
          [userLng, userLat],
          vehicleCoords
        ], {
          color: '#28a745',
          width: 4,
          transportMode: transportMode
        });

        if (routeData) {
          const distanceKm = (routeData.distance / 1000).toFixed(1);
          const durationMin = Math.round(routeData.duration / 60);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          const etaText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          document.getElementById("route-info").textContent = `📍 Distance: ${distanceKm} km | ⏱️ ETA: ${etaText}`;
        }
      } catch (err) {
        console.error('Route error:', err);
        document.getElementById("route-info").textContent = '❌ Route not available';
      }
    }

    // Initial route
    updateRoute();

    // Event listeners
    document.getElementById("refresh-location")?.addEventListener("click", updateRoute);
    document.getElementById("transport-mode")?.addEventListener("change", updateRoute);
  });
</script>
```

## 2. Update Dhabas Detail Page

### File: `views/dhabas/show.ejs`

Replace the old map initialization with:

```javascript
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const dhabaCoords = dhaba.geometry.coordinates;
    if (!dhabaCoords || dhabaCoords.length !== 2) {
      document.getElementById("map").innerHTML = "<p class='text-center mt-3'>Map location not available</p>";
      return;
    }

    // Initialize enhanced map
    const enhancedMap = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: dhabaCoords,
      zoom: 14,
      searchEnabled: true
    });

    // Add dhaba marker
    enhancedMap.addMarker('dhaba', dhabaCoords, {
      color: 'orange',
      title: dhaba.title,
      description: `${dhaba.cuisine} | ₹${dhaba.price.toLocaleString("en-IN")} per guest | ⭐${dhaba.rating}`,
      popup: true
    });

    // User location
    const userLat = 19.85;
    const userLng = 75.93;

    // Add route on transport mode change
    async function updateRoute() {
      const transportSelect = document.getElementById("transport-mode");
      const transportMode = transportSelect.value;

      try {
        const routeData = await enhancedMap.addRoute('dhaba-route', [
          [userLng, userLat],
          dhabaCoords
        ], {
          color: '#ff8c00',
          width: 4,
          transportMode: transportMode
        });

        if (routeData) {
          const distanceKm = (routeData.distance / 1000).toFixed(1);
          const durationMin = Math.round(routeData.duration / 60);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          const etaText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          document.getElementById("route-info").textContent = `📍 Distance: ${distanceKm} km | ⏱️ ETA: ${etaText}`;
        }
      } catch (err) {
        console.error('Route error:', err);
        document.getElementById("route-info").textContent = '❌ Route not available';
      }
    }

    // Initial route
    updateRoute();

    // Event listeners
    document.getElementById("refresh-location")?.addEventListener("click", updateRoute);
    document.getElementById("transport-mode")?.addEventListener("change", updateRoute);
  });
</script>
```

## 3. Update Browse/Index Pages (Clustering)

### File: `views/listings/index.ejs`

Add this to display clustered markers:

```javascript
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // Initialize enhanced map
    const enhancedMap = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: [75.93, 19.85],
      zoom: 12,
      searchEnabled: true
    });

    // Prepare features for clustering
    const features = listings.map((listing, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: listing.geometry.coordinates
      },
      properties: {
        id: listing._id,
        title: listing.title,
        price: listing.price,
        rating: listing.rating
      }
    }));

    // Add clustered markers
    enhancedMap.addClusteredMarkers('listings', features, {
      clusterRadius: 50,
      clusterMaxZoom: 14
    });

    // Optional: Add individual markers with popups
    listings.forEach((listing, index) => {
      enhancedMap.addMarker(`listing-${index}`, listing.geometry.coordinates, {
        color: 'red',
        title: listing.title,
        description: `₹${listing.price.toLocaleString("en-IN")} per night | ⭐${listing.rating}`,
        popup: true
      });
    });
  });
</script>
```

## 4. Update Vehicles Browse Page

### File: `views/vehicles/index.ejs`

```javascript
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // Initialize enhanced map
    const enhancedMap = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: [75.93, 19.85],
      zoom: 12,
      searchEnabled: true
    });

    // Prepare features
    const features = vehicles.map((vehicle, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: vehicle.geometry.coordinates
      },
      properties: {
        id: vehicle._id,
        title: vehicle.title,
        type: vehicle.type,
        price: vehicle.price
      }
    }));

    // Add clustered markers
    enhancedMap.addClusteredMarkers('vehicles', features);

    // Add individual markers
    vehicles.forEach((vehicle, index) => {
      enhancedMap.addMarker(`vehicle-${index}`, vehicle.geometry.coordinates, {
        color: 'green',
        title: vehicle.title,
        description: `${vehicle.type} | ₹${vehicle.price.toLocaleString("en-IN")}/day`,
        popup: true
      });
    });
  });
</script>
```

## 5. Update Dhabas Browse Page

### File: `views/dhabas/index.ejs`

```javascript
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // Initialize enhanced map
    const enhancedMap = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: [75.93, 19.85],
      zoom: 12,
      searchEnabled: true
    });

    // Prepare features
    const features = dhabas.map((dhaba, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: dhaba.geometry.coordinates
      },
      properties: {
        id: dhaba._id,
        title: dhaba.title,
        cuisine: dhaba.cuisine,
        price: dhaba.price
      }
    }));

    // Add clustered markers
    enhancedMap.addClusteredMarkers('dhabas', features);

    // Add individual markers
    dhabas.forEach((dhaba, index) => {
      enhancedMap.addMarker(`dhaba-${index}`, dhaba.geometry.coordinates, {
        color: 'orange',
        title: dhaba.title,
        description: `${dhaba.cuisine} | ₹${dhaba.price.toLocaleString("en-IN")} per guest | ⭐${dhaba.rating}`,
        popup: true
      });
    });
  });
</script>
```

## 6. Add Heatmap for Popular Areas

### New File: `views/maps/heatmap.ejs`

```javascript
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // Initialize enhanced map
    const enhancedMap = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: [75.93, 19.85],
      zoom: 10,
      searchEnabled: true
    });

    // Prepare heatmap data from listings
    const heatmapData = listings.map(listing => ({
      lat: listing.geometry.coordinates[1],
      lng: listing.geometry.coordinates[0],
      intensity: listing.rating || 3
    }));

    // Add heatmap
    enhancedMap.addHeatmap('popular-areas', heatmapData, {
      color: 'red',
      intensity: 1
    });
  });
</script>
```

## 7. HTML Structure Required

All pages need this basic HTML structure:

```html
<!-- Map Container -->
<div id="map" style="height: 400px; border-radius: 12px;"></div>

<!-- Transport Mode Selector (for detail pages) -->
<div class="text-center mb-2">
  <label for="transport-mode" class="fw-bold">Select Transport:</label>
  <select id="transport-mode" class="form-select form-select-sm d-inline w-auto">
    <option value="driving">🚗 Car</option>
    <option value="walking">🚶 Walking</option>
    <option value="cycling">🚴 Cycling</option>
    <option value="bus">🚌 Bus</option>
  </select>
</div>

<!-- Distance & ETA Info -->
<div class="text-center mb-2">
  <span id="route-info" class="fw-bold"></span>
</div>

<!-- Refresh Button -->
<div class="text-center mb-3">
  <button id="refresh-location" class="btn btn-primary btn-sm">🔄 Refresh My Location</button>
</div>
```

## 8. Pass mapToken from Controller

Ensure your controllers pass the mapToken:

```javascript
// In controllers/listings.js
module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({path: "reviews", populate:{path:"author"}})
    .populate("owner");
  
  res.render("listings/show", { 
    listing, 
    mapToken: process.env.MAP_TOKEN 
  });
};

// In controllers/vehicles.js
module.exports.showVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate({path: "reviews", populate:{path:"author"}})
    .populate("owner");
  
  res.render("vehicles/show", { 
    vehicle, 
    mapToken: process.env.MAP_TOKEN 
  });
};

// In controllers/dhabas.js
module.exports.showDhaba = async (req, res) => {
  const dhaba = await Dhaba.findById(req.params.id)
    .populate({path: "reviews", populate:{path:"author"}})
    .populate("owner");
  
  res.render("dhabas/show", { 
    dhaba, 
    mapToken: process.env.MAP_TOKEN 
  });
};
```

## 9. Marker Colors Reference

- 🔴 **red** - Listings
- 🟢 **green** - Vehicles
- 🟠 **orange** - Dhabas
- 🔵 **blue** - User location
- 🟡 **gold** - Premium/Featured

## 10. Testing Checklist

- [ ] Map loads without errors
- [ ] Markers display correctly
- [ ] Popups show on marker click
- [ ] Search works
- [ ] Style switcher works
- [ ] Routes calculate correctly
- [ ] Transport mode changes work
- [ ] Clustering works (100+ markers)
- [ ] Dark mode works
- [ ] Mobile responsive

## 11. Performance Optimization

For pages with 100+ markers:

```javascript
// Use clustering only
enhancedMap.addClusteredMarkers('listings', features);

// Don't add individual markers
// This improves performance significantly
```

## 12. Common Issues & Solutions

### Issue: Map not showing
**Solution**: Ensure map container has height and mapToken is passed

### Issue: Markers not visible
**Solution**: Check coordinates are [lng, lat] format

### Issue: Routes not calculating
**Solution**: Verify Mapbox token has directions API enabled

### Issue: Slow performance
**Solution**: Use clustering for 100+ markers, remove unused markers

## Summary

Update these pages in order:
1. ✅ Listings Detail - Already done
2. 🔄 Vehicles Detail - Use code above
3. 🔄 Dhabas Detail - Use code above
4. 🔄 Listings Browse - Use clustering
5. 🔄 Vehicles Browse - Use clustering
6. 🔄 Dhabas Browse - Use clustering
7. 🔄 Heatmap Page - New feature

All code is copy-paste ready!
