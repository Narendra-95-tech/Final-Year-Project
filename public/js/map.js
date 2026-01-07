mapboxgl.accessToken = mapToken;

// Create the map instance
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: listing.geometry.coordinates,
  zoom: 12,
  minZoom: 8,
  maxZoom: 18,
  pitch: 45,
  bearing: -17.6,
  antialias: true
});

// Create a custom navigation control with tooltips
class CustomNavigationControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group custom-navigation';
    
    // Zoom in button
    this._zoomInButton = this._createButton(
      'Zoom in', 
      'mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in', 
      () => map.zoomIn()
    );
    this._container.appendChild(this._zoomInButton);
    
    // Zoom out button
    this._zoomOutButton = this._createButton(
      'Zoom out', 
      'mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-out', 
      () => map.zoomOut()
    );
    this._container.appendChild(this._zoomOutButton);
    
    // Compass button
    this._compassButton = this._createButton(
      'Reset bearing', 
      'mapboxgl-ctrl-icon mapboxgl-ctrl-compass', 
      () => map.resetNorthPitch()
    );
    this._container.appendChild(this._compassButton);
    
    return this._container;
  }
  
  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
  
  _createButton(title, className, fn) {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    });
    
    // Add tooltip container
    const tooltip = document.createElement('span');
    tooltip.className = 'map-tooltip';
    tooltip.textContent = title;
    button.appendChild(tooltip);
    
    return button;
  }
}

// Add custom navigation control
map.addControl(new CustomNavigationControl(), 'top-right');

// Add geolocation control with label
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: true,
  showAccuracyCircle: true,
  fitBoundsOptions: {
    maxZoom: 15
  }
});

// Add label to geolocate control
document.addEventListener('DOMContentLoaded', () => {
  const geolocateButton = document.querySelector('.mapboxgl-ctrl-geolocate');
  if (geolocateButton) {
    const label = document.createElement('span');
    label.className = 'map-control-label';
    label.textContent = 'My Location';
    geolocateButton.parentNode.insertBefore(label, geolocateButton.nextSibling);
  }
});

map.addControl(geolocate, 'top-right');

// Add fullscreen control with label
const fullscreen = new mapboxgl.FullscreenControl({
  container: document.querySelector('body')
});

// Add label to fullscreen control
document.addEventListener('DOMContentLoaded', () => {
  const fullscreenButton = document.querySelector('.mapboxgl-ctrl-fullscreen');
  if (fullscreenButton) {
    const label = document.createElement('span');
    label.className = 'map-control-label';
    label.textContent = 'Fullscreen';
    fullscreenButton.parentNode.insertBefore(label, fullscreenButton.nextSibling);
  }
});

map.addControl(fullscreen, 'top-right');

// Create custom marker with better visibility
const el = document.createElement('div');
el.className = 'map-marker';
el.innerHTML = `
  <div class="marker-container">
    <div class="marker-icon">
      <i class="fas fa-utensils"></i>
    </div>
    <div class="marker-pulse"></div>
    <div class="marker-label">${listing.title}</div>
  </div>
`;

// Add marker with custom popup
const popup = new mapboxgl.Popup({ offset: 25 })
  .setHTML(`
    <div class="map-popup">
      <h6 class="popup-title">${listing.title}</h6>
      <div class="d-flex align-items-center mb-2">
        <span class="badge bg-primary me-2">${listing.cuisine || 'Dhaba'}</span>
        <div class="rating">
          ${'<i class="fas fa-star text-warning"></i>'.repeat(Math.floor(listing.rating || 0))}
          ${'<i class="far fa-star text-warning"></i>'.repeat(5 - Math.floor(listing.rating || 0))}
        </div>
      </div>
      <p class="mb-1 small">${listing.location || 'Location not specified'}</p>
      <p class="mb-0 fw-bold text-success">₹${listing.price ? listing.price.toLocaleString('en-IN') : 'N/A'} per guest</p>
      <div class="mt-2">
        <button class="btn btn-sm btn-primary w-100" onclick="window.location.href='/dhabas/${listing._id}'">
          View Details
        </button>
      </div>
    </div>
  `);

// Add marker to map
new mapboxgl.Marker(el)
  .setLngLat(listing.geometry.coordinates)
  .setPopup(popup)
  .addTo(map);

// Add 3D buildings when map loads
map.on('style.load', () => {
  // Add terrain
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
  
  // Add terrain with slight exaggeration for better visibility
  map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

  // Add 3D buildings
  map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
      'fill-extrusion-color': '#aaa',
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'height']
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.6
    }
  });
});