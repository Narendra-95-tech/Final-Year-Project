# 🗺️ Enhanced Map - Quick Reference Card

## 🚀 Quick Start (Copy-Paste Ready)

### Initialize Map
```javascript
const map = new EnhancedMap('map', {
  mapToken: '<%= mapToken %>',
  center: [75.93, 19.85],
  zoom: 12,
  searchEnabled: true,
  clusterEnabled: true
});
```

### Add Marker
```javascript
map.addMarker('id', [lng, lat], {
  color: 'red',
  title: 'Title',
  description: 'Description',
  popup: true
});
```

### Add Route
```javascript
map.addRoute('id', [[lng1, lat1], [lng2, lat2]], {
  color: '#007bff',
  width: 4,
  transportMode: 'driving'
});
```

### Add Heatmap
```javascript
map.addHeatmap('id', [
  { lat: 19.85, lng: 75.93, intensity: 5 },
  { lat: 19.86, lng: 75.94, intensity: 3 }
]);
```

### Add Clustering
```javascript
map.addClusteredMarkers('id', features, {
  clusterRadius: 50,
  clusterMaxZoom: 14
});
```

---

## 📍 Marker Colors

| Color | Use Case |
|-------|----------|
| 🔴 red | Listings |
| 🟢 green | Vehicles |
| 🟠 orange | Dhabas |
| 🔵 blue | User location |
| 🟡 gold | Premium items |

---

## 🚗 Transport Modes

| Mode | Icon | Use |
|------|------|-----|
| driving | 🚗 | Cars, fastest |
| walking | 🚶 | Pedestrians |
| cycling | 🚴 | Bikes |
| bus | 🚌 | Public transit |

---

## 🎨 Map Styles

| Style | URL |
|-------|-----|
| Streets | `mapbox://styles/mapbox/streets-v12` |
| Satellite | `mapbox://styles/mapbox/satellite-v9` |
| Outdoors | `mapbox://styles/mapbox/outdoors-v12` |
| Light | `mapbox://styles/mapbox/light-v11` |
| Dark | `mapbox://styles/mapbox/dark-v11` |

---

## 📚 API Methods

### Markers
```javascript
map.addMarker(id, coords, options)
map.removeMarker(id)
```

### Routes
```javascript
map.addRoute(id, coords, options)
map.removeRoute(id)
```

### Heatmap
```javascript
map.addHeatmap(id, data, options)
```

### Clustering
```javascript
map.addClusteredMarkers(id, features, options)
```

### Navigation
```javascript
map.flyTo(coords, zoom, duration)
map.getMap()
map.destroy()
```

---

## 🔧 Options Reference

### Map Options
```javascript
{
  mapToken: 'required',
  center: [lng, lat],
  zoom: 12,
  style: 'mapbox://styles/mapbox/streets-v12',
  searchEnabled: true,
  clusterEnabled: true
}
```

### Marker Options
```javascript
{
  color: 'red',
  title: 'Title',
  description: 'Description',
  icon: 'url',
  popup: true,
  draggable: false
}
```

### Route Options
```javascript
{
  color: '#007bff',
  width: 4,
  transportMode: 'driving',
  animate: true
}
```

### Heatmap Options
```javascript
{
  color: 'blue',
  intensity: 1
}
```

### Cluster Options
```javascript
{
  clusterRadius: 50,
  clusterMaxZoom: 14
}
```

---

## 🎯 Common Tasks

### Show Multiple Listings
```javascript
const features = listings.map(l => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: l.geometry.coordinates
  },
  properties: { title: l.title }
}));

map.addClusteredMarkers('listings', features);
```

### Show Route Between Two Points
```javascript
const routeData = await map.addRoute('route', [
  [userLng, userLat],
  [destLng, destLat]
], {
  transportMode: 'driving'
});

console.log(`Distance: ${routeData.distance}m`);
console.log(`Duration: ${routeData.duration}s`);
```

### Show Popular Areas
```javascript
const heatmapData = listings.map(l => ({
  lat: l.geometry.coordinates[1],
  lng: l.geometry.coordinates[0],
  intensity: l.rating
}));

map.addHeatmap('popular', heatmapData);
```

### Animate to Location
```javascript
map.flyTo([75.93, 19.85], 14, 1000);
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map blank | Check mapToken, container height |
| No markers | Verify [lng, lat] format |
| Routes fail | Check transport mode, coordinates |
| Slow | Use clustering for 100+ markers |
| Dark mode off | Check system preferences |

---

## 📱 HTML Structure

```html
<!-- Map Container -->
<div id="map" style="height: 400px;"></div>

<!-- Transport Selector (optional) -->
<select id="transport-mode">
  <option value="driving">🚗 Car</option>
  <option value="walking">🚶 Walking</option>
  <option value="cycling">🚴 Cycling</option>
  <option value="bus">🚌 Bus</option>
</select>

<!-- Info Display (optional) -->
<span id="route-info"></span>

<!-- Refresh Button (optional) -->
<button id="refresh-location">🔄 Refresh</button>
```

---

## 🔗 Important Links

- **API Guide**: `ENHANCED_MAP_GUIDE.md`
- **Examples**: `/public/js/map-examples.js`
- **Integration**: `UPDATE_OTHER_PAGES.md`
- **Visual Guide**: `MAP_FEATURES_VISUAL_GUIDE.md`
- **Mapbox Docs**: https://docs.mapbox.com/

---

## ⚡ Performance Tips

1. Use clustering for 100+ markers
2. Limit heatmap data to relevant area
3. Remove unused markers
4. Destroy map when navigating away
5. Use flyTo for smooth animations

---

## 🎨 Styling

### Change Marker Color
```css
.mapboxgl-marker {
  background-color: #ff6b6b !important;
}
```

### Custom Popup
```css
.mapboxgl-popup-content {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
}
```

### Custom Control
```css
.mapboxgl-ctrl button {
  background: #ff6b6b;
  color: white;
}
```

---

## 📊 Data Format

### Coordinates
```javascript
[longitude, latitude]  // Always [lng, lat]
```

### Heatmap Data
```javascript
[
  { lat: 19.85, lng: 75.93, intensity: 5 },
  { lat: 19.86, lng: 75.94, intensity: 3 }
]
```

### Cluster Features
```javascript
[
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    properties: { title: 'Name' }
  }
]
```

---

## 🔐 Security

- ✅ Never expose Mapbox token in frontend
- ✅ Pass token from server only
- ✅ Use environment variables
- ✅ Validate all requests

---

## 📈 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers
- ❌ IE11

---

## 🎓 Learning Path

1. **Basics**: Read `ENHANCED_MAP_GUIDE.md`
2. **Examples**: Check `/public/js/map-examples.js`
3. **Integration**: Follow `UPDATE_OTHER_PAGES.md`
4. **Visual**: Review `MAP_FEATURES_VISUAL_GUIDE.md`
5. **Practice**: Implement on your pages
6. **Deploy**: Test and deploy

---

## 💾 Files Reference

```
/public/js/enhanced-map.js      ← Main class
/public/js/map-examples.js      ← 10 examples
/public/css/enhanced-map.css    ← Styling
ENHANCED_MAP_GUIDE.md           ← Full API
UPDATE_OTHER_PAGES.md           ← Integration
MAP_FEATURES_VISUAL_GUIDE.md    ← Visual ref
```

---

## ✅ Checklist

- [ ] Map loads
- [ ] Markers show
- [ ] Routes work
- [ ] Search works
- [ ] Styles switch
- [ ] Mobile works
- [ ] Dark mode works
- [ ] No console errors

---

**Version**: 1.0 | **Status**: ✅ Production Ready | **Last Updated**: Dec 3, 2025
