# Enhanced Map Features Guide

## Overview

The Enhanced Map system provides advanced Mapbox integration with multiple features for location-based services in WanderLust.

## Features Included

### 1. **Multiple Map Styles** 🎨
- Streets (default)
- Satellite
- Outdoors
- Light
- Dark

Switch between styles using the style switcher button in the top-right corner.

### 2. **Geocoding & Search** 🔍
- Real-time location search
- Autocomplete suggestions
- Fly-to functionality
- Search results dropdown

### 3. **Navigation Controls** 🧭
- Zoom in/out
- Rotate map
- Pitch control
- Fullscreen mode

### 4. **Measurement Tool** 📏
- Measure distances between points
- Click to add measurement points
- Real-time distance calculation
- Visual line drawing

### 5. **Markers & Popups** 📍
- Custom colored markers
- Draggable markers
- Rich popup information
- Custom icons support

### 6. **Routes & Directions** 🛣️
- Multiple transport modes:
  - Driving
  - Walking
  - Cycling
  - Bus
- Real-time route calculation
- Distance and ETA display
- Animated route visualization

### 7. **Clustering** 🎯
- Automatic marker clustering
- Cluster count display
- Zoom-based expansion
- Performance optimization

### 8. **Heatmaps** 🔥
- Density visualization
- Color-coded intensity
- Popular area identification
- Custom data support

### 9. **Scale Control** 📐
- Distance reference
- Responsive scaling
- Multiple unit support

### 10. **Dark Mode Support** 🌙
- Automatic theme detection
- Custom dark mode styles
- Seamless transitions

## Installation

### 1. Files Added
```
/public/js/enhanced-map.js          # Main map class
/public/js/map-examples.js          # Usage examples
/public/css/enhanced-map.css        # Styling
```

### 2. Already Included in Boilerplate
- Mapbox GL JS v3.15.0
- Mapbox GL CSS v3.15.0
- Enhanced map CSS and JS imports

## Usage

### Basic Implementation

```html
<!-- HTML -->
<div id="map" style="height: 400px;"></div>

<!-- JavaScript -->
<script>
  const map = new EnhancedMap('map', {
    mapToken: '<%= mapToken %>',
    center: [75.93, 19.85],
    zoom: 12,
    searchEnabled: true,
    clusterEnabled: true
  });
</script>
```

### Listing Detail Page

```javascript
const map = new EnhancedMap('map', {
  mapToken: mapToken,
  center: listing.geometry.coordinates,
  zoom: 14,
  searchEnabled: true
});

// Add listing marker
map.addMarker('listing', listing.geometry.coordinates, {
  color: 'red',
  title: listing.title,
  description: `₹${listing.price} per night`,
  popup: true
});

// Add route from user location
map.addRoute('listing-route', [userCoords, listing.geometry.coordinates], {
  color: '#007bff',
  width: 4,
  transportMode: 'driving'
});
```

### Multiple Listings (Browse Page)

```javascript
const map = new EnhancedMap('map', {
  mapToken: mapToken,
  center: [75.93, 19.85],
  zoom: 12,
  searchEnabled: true
});

// Add clustered markers
const features = listings.map(listing => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: listing.geometry.coordinates
  },
  properties: {
    title: listing.title,
    price: listing.price
  }
}));

map.addClusteredMarkers('listings', features);
```

### Heatmap for Popular Areas

```javascript
const map = new EnhancedMap('map', {
  mapToken: mapToken,
  center: [75.93, 19.85],
  zoom: 12
});

const heatmapData = [
  { lat: 19.85, lng: 75.93, intensity: 5 },
  { lat: 19.86, lng: 75.94, intensity: 3 },
  // ... more points
];

map.addHeatmap('popular-areas', heatmapData);
```

## API Reference

### EnhancedMap Class

#### Constructor
```javascript
new EnhancedMap(containerId, options)
```

**Options:**
- `mapToken` (string, required): Mapbox access token
- `center` (array): [longitude, latitude] - default: [75.93, 19.85]
- `zoom` (number): Initial zoom level - default: 12
- `style` (string): Map style URL - default: streets-v12
- `searchEnabled` (boolean): Enable geocoding search - default: true
- `clusterEnabled` (boolean): Enable marker clustering - default: true

#### Methods

##### addMarker(id, coords, options)
Add a marker to the map.

```javascript
map.addMarker('marker-1', [75.93, 19.85], {
  color: 'red',
  title: 'Location Name',
  description: 'Additional info',
  icon: 'url-to-icon',
  popup: true,
  draggable: false
});
```

##### removeMarker(id)
Remove a marker by ID.

```javascript
map.removeMarker('marker-1');
```

##### addRoute(id, coords, options)
Add a route between coordinates.

```javascript
map.addRoute('route-1', [
  [75.93, 19.85],
  [75.94, 19.86]
], {
  color: '#007bff',
  width: 4,
  transportMode: 'driving',
  animate: true
});
```

##### removeRoute(id)
Remove a route by ID.

```javascript
map.removeRoute('route-1');
```

##### addHeatmap(id, data, options)
Add a heatmap layer.

```javascript
map.addHeatmap('heatmap-1', [
  { lat: 19.85, lng: 75.93, intensity: 5 },
  { lat: 19.86, lng: 75.94, intensity: 3 }
], {
  color: 'blue',
  intensity: 1
});
```

##### addClusteredMarkers(id, features, options)
Add clustered markers.

```javascript
map.addClusteredMarkers('clusters', features, {
  clusterRadius: 50,
  clusterMaxZoom: 14
});
```

##### flyTo(coords, zoom, duration)
Animate map to location.

```javascript
map.flyTo([75.93, 19.85], 14, 1000);
```

##### getMap()
Get the underlying Mapbox map instance.

```javascript
const mapboxMap = map.getMap();
```

##### destroy()
Clean up and remove the map.

```javascript
map.destroy();
```

## Styling

### CSS Classes

- `.mapboxgl-ctrl` - Control container
- `.geocoder-container` - Search box
- `.style-switcher` - Style selector
- `.map-info-box` - Information display
- `.transport-selector` - Transport mode selector
- `.mapboxgl-popup` - Popup styling

### Customization

Override default styles in your CSS:

```css
/* Custom marker color */
.mapboxgl-marker {
  background-color: #ff6b6b !important;
}

/* Custom popup styling */
.mapboxgl-popup-content {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
}

/* Custom control styling */
.mapboxgl-ctrl button {
  background: #ff6b6b;
  color: white;
}
```

## Examples

### Example 1: Listing Detail Page

```javascript
// In views/listings/show.ejs
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const map = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: listing.geometry.coordinates,
      zoom: 14,
      searchEnabled: true
    });

    // Add listing marker
    map.addMarker('listing', listing.geometry.coordinates, {
      color: 'red',
      title: listing.title,
      description: `₹${listing.price} per night | Rating: ${listing.rating}⭐`,
      popup: true
    });

    // Add route
    const userCoords = [75.93, 19.85];
    map.addRoute('route', [userCoords, listing.geometry.coordinates], {
      color: '#007bff',
      transportMode: 'driving'
    });
  });
</script>
```

### Example 2: Browse Listings

```javascript
// In views/listings/index.ejs
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const map = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: [75.93, 19.85],
      zoom: 12,
      searchEnabled: true
    });

    const features = listings.map(listing => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: listing.geometry.coordinates
      },
      properties: {
        title: listing.title,
        price: listing.price
      }
    }));

    map.addClusteredMarkers('listings', features);
  });
</script>
```

### Example 3: Vehicle Rental

```javascript
// In views/vehicles/show.ejs
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const map = new EnhancedMap('map', {
      mapToken: '<%= mapToken %>',
      center: vehicle.geometry.coordinates,
      zoom: 14
    });

    map.addMarker('vehicle', vehicle.geometry.coordinates, {
      title: vehicle.title,
      description: `${vehicle.type} | ₹${vehicle.price}/day`,
      popup: true
    });
  });
</script>
```

## Performance Tips

1. **Use Clustering** for 100+ markers
   ```javascript
   map.addClusteredMarkers('listings', features);
   ```

2. **Limit Heatmap Data** to relevant area
   ```javascript
   const filtered = data.filter(p => 
     p.lat > 19 && p.lat < 20 && 
     p.lng > 75 && p.lng < 76
   );
   ```

3. **Remove Unused Markers**
   ```javascript
   map.removeMarker('old-marker');
   ```

4. **Destroy Map When Not Needed**
   ```javascript
   map.destroy();
   ```

## Troubleshooting

### Map Not Displaying
- Check Mapbox token is valid
- Verify map container has height
- Check browser console for errors

### Markers Not Showing
- Verify coordinates are [lng, lat] format
- Check zoom level is appropriate
- Ensure map has loaded (use `map.getMap().on('load', ...)`

### Search Not Working
- Verify Mapbox token has geocoding permissions
- Check network requests in browser DevTools
- Ensure search is enabled in options

### Routes Not Calculating
- Verify start and end coordinates are valid
- Check transport mode is supported
- Ensure coordinates are in correct format [lng, lat]

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## Dependencies

- Mapbox GL JS v3.15.0
- Mapbox GL CSS v3.15.0
- Modern browser with ES6 support

## Future Enhancements

- [ ] 3D terrain visualization
- [ ] Custom layer support
- [ ] Advanced filtering UI
- [ ] Real-time location sharing
- [ ] Offline map support
- [ ] Custom map style builder
- [ ] Analytics integration

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Mapbox token and permissions
3. Review examples in `map-examples.js`
4. Check Mapbox documentation: https://docs.mapbox.com/

## License

Same as WanderLust project license.
