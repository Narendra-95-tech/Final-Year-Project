/**
 * Enhanced Map Usage Examples
 * Shows how to use the EnhancedMap class with various features
 */

// Example 1: Basic Map with All Features
function initializeBasicEnhancedMap(mapToken) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: [75.93, 19.85],
    zoom: 12,
    style: 'mapbox://styles/mapbox/streets-v12',
    clusterEnabled: true,
    searchEnabled: true
  });

  return map;
}

// Example 2: Listing Detail Map with Route
function initializeListingMap(mapToken, listingCoords, listingData) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: listingCoords,
    zoom: 14,
    searchEnabled: true
  });

  // Add listing marker
  map.addMarker('listing', listingCoords, {
    color: 'red',
    title: listingData.title,
    description: `₹${listingData.price} per night`,
    popup: true
  });

  // Add route from user location to listing
  const userCoords = [75.93, 19.85]; // Default user location
  map.addRoute('listing-route', [userCoords, listingCoords], {
    color: '#007bff',
    width: 4,
    transportMode: 'driving'
  });

  return map;
}

// Example 3: Multiple Markers with Clustering
function initializeMultipleListingsMap(mapToken, listings) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: [75.93, 19.85],
    zoom: 12,
    searchEnabled: true
  });

  // Prepare data for clustering
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
  map.addClusteredMarkers('listings', features, {
    clusterRadius: 50,
    clusterMaxZoom: 14
  });

  // Add individual markers
  listings.forEach((listing, index) => {
    map.addMarker(`listing-${index}`, listing.geometry.coordinates, {
      color: 'red',
      title: listing.title,
      description: `₹${listing.price} per night | Rating: ${listing.rating}⭐`,
      popup: true
    });
  });

  return map;
}

// Example 4: Heatmap for Popular Areas
function initializeHeatmapMap(mapToken, heatmapData) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: [75.93, 19.85],
    zoom: 12,
    searchEnabled: true
  });

  // Add heatmap layer
  map.addHeatmap('popular-areas', heatmapData, {
    color: 'red',
    intensity: 1
  });

  return map;
}

// Example 5: Route Comparison (Multiple Routes)
async function initializeRouteComparisonMap(mapToken, startCoords, endCoords) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: startCoords,
    zoom: 12,
    searchEnabled: true
  });

  // Add start and end markers
  map.addMarker('start', startCoords, {
    color: 'blue',
    title: 'Start Location',
    popup: true
  });

  map.addMarker('end', endCoords, {
    color: 'red',
    title: 'Destination',
    popup: true
  });

  // Add different routes for different transport modes
  const transportModes = ['driving', 'walking', 'cycling'];
  const colors = ['#007bff', '#28a745', '#ffc107'];

  for (let i = 0; i < transportModes.length; i++) {
    await map.addRoute(
      `route-${transportModes[i]}`,
      [startCoords, endCoords],
      {
        color: colors[i],
        width: 3,
        transportMode: transportModes[i]
      }
    );
  }

  return map;
}

// Example 6: Vehicle Rental Map
function initializeVehicleMap(mapToken, vehicleCoords, vehicleData) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: vehicleCoords,
    zoom: 14,
    searchEnabled: true
  });

  // Add vehicle marker with custom icon
  map.addMarker('vehicle', vehicleCoords, {
    title: vehicleData.title,
    description: `${vehicleData.type} | ₹${vehicleData.price} per day`,
    icon: vehicleData.icon || null,
    popup: true
  });

  return map;
}

// Example 7: Dhaba Listings Map
function initializeDhabaMap(mapToken, dhabaCoords, dhabaData) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: dhabaCoords,
    zoom: 14,
    searchEnabled: true
  });

  // Add dhaba marker
  map.addMarker('dhaba', dhabaCoords, {
    color: 'orange',
    title: dhabaData.title,
    description: `${dhabaData.cuisine} | ₹${dhabaData.price} per guest | ⭐${dhabaData.rating}`,
    popup: true
  });

  return map;
}

// Example 8: Search and Filter Map
function initializeSearchableMap(mapToken, allListings) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: [75.93, 19.85],
    zoom: 12,
    searchEnabled: true
  });

  // Add all listings
  allListings.forEach((listing, index) => {
    map.addMarker(`listing-${index}`, listing.geometry.coordinates, {
      color: listing.category === 'luxury' ? 'gold' : 'red',
      title: listing.title,
      description: `₹${listing.price} | ${listing.category}`,
      popup: true
    });
  });

  // Add filter functionality
  const filterBtn = document.createElement('button');
  filterBtn.textContent = '🔍 Filter';
  filterBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 10px 15px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    z-index: 100;
  `;

  filterBtn.addEventListener('click', () => {
    const priceRange = prompt('Enter max price (e.g., 5000):');
    if (priceRange) {
      // Filter and update markers
      allListings.forEach((listing, index) => {
        if (listing.price <= priceRange) {
          map.addMarker(`listing-${index}`, listing.geometry.coordinates, {
            color: 'green',
            title: listing.title,
            description: `₹${listing.price}`,
            popup: true
          });
        }
      });
    }
  });

  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.parentElement.style.position = 'relative';
    mapContainer.parentElement.appendChild(filterBtn);
  }

  return map;
}

// Example 9: Real-time Location Tracking
function initializeTrackingMap(mapToken, startCoords) {
  const map = new EnhancedMap('map', {
    mapToken: mapToken,
    center: startCoords,
    zoom: 14,
    searchEnabled: true
  });

  // Add user location marker
  map.addMarker('user-location', startCoords, {
    color: 'blue',
    title: 'Your Location',
    popup: true,
    draggable: true
  });

  // Simulate location updates
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      map.addMarker('user-location', [longitude, latitude], {
        color: 'blue',
        title: 'Your Location',
        popup: true
      });
      map.flyTo([longitude, latitude], 14);
    });
  }

  return map;
}

// Example 10: Comparison Map (Side by Side)
function initializeComparisonMap(mapToken, location1, location2) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Create two map containers
  mapContainer.innerHTML = `
    <div style="display: flex; gap: 10px; height: 400px;">
      <div id="map-1" style="flex: 1; border-radius: 8px; overflow: hidden;"></div>
      <div id="map-2" style="flex: 1; border-radius: 8px; overflow: hidden;"></div>
    </div>
  `;

  // Initialize both maps
  const map1 = new EnhancedMap('map-1', {
    mapToken: mapToken,
    center: location1.coords,
    zoom: 14
  });

  const map2 = new EnhancedMap('map-2', {
    mapToken: mapToken,
    center: location2.coords,
    zoom: 14
  });

  // Add markers
  map1.addMarker('location', location1.coords, {
    title: location1.title,
    popup: true
  });

  map2.addMarker('location', location2.coords, {
    title: location2.title,
    popup: true
  });

  return { map1, map2 };
}

// Utility: Initialize map based on page type
function initializeMapByPageType(pageType, mapToken, data) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.warn('Map container not found');
    return null;
  }

  switch (pageType) {
    case 'listing-detail':
      return initializeListingMap(mapToken, data.coords, data.listing);

    case 'vehicle-detail':
      return initializeVehicleMap(mapToken, data.coords, data.vehicle);

    case 'dhaba-detail':
      return initializeDhabaMap(mapToken, data.coords, data.dhaba);

    case 'listings-browse':
      return initializeMultipleListingsMap(mapToken, data.listings);

    case 'heatmap':
      return initializeHeatmapMap(mapToken, data.heatmapData);

    case 'route-comparison':
      return initializeRouteComparisonMap(mapToken, data.start, data.end);

    case 'tracking':
      return initializeTrackingMap(mapToken, data.startCoords);

    case 'searchable':
      return initializeSearchableMap(mapToken, data.listings);

    default:
      return initializeBasicEnhancedMap(mapToken);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeBasicEnhancedMap,
    initializeListingMap,
    initializeMultipleListingsMap,
    initializeHeatmapMap,
    initializeRouteComparisonMap,
    initializeVehicleMap,
    initializeDhabaMap,
    initializeSearchableMap,
    initializeTrackingMap,
    initializeComparisonMap,
    initializeMapByPageType
  };
}
