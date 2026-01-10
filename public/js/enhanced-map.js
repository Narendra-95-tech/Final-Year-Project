/**
 * Enhanced Map Utility
 * Features: Multiple map styles, search, clustering, heatmap, geofencing, and more
 */

class EnhancedMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.map = null;
    this.mapToken = options.mapToken;
    this.center = options.center || [75.93, 19.85]; // Default: Bharaj Bk, Maharashtra
    this.zoom = options.zoom || 12;
    this.style = options.style || 'mapbox://styles/mapbox/streets-v12';
    this.markers = new Map();
    this.routes = new Map();
    this.heatmapData = [];
    this.clusterEnabled = options.clusterEnabled !== false;
    this.searchEnabled = options.searchEnabled !== false;

    // Search features
    this.autocompleteCache = new Map();
    this.searchHistory = [];

    // Real-time location tracking
    this.userLocationMarker = null;
    this.locationWatchId = null;
    this.isTrackingLocation = false;
    this.locationAccuracy = null;

    // Interactive map layers
    this.activeLayers = new Set();
    this.layerSources = new Map();
    this.trafficLayerId = null;
    this.transitLayerId = null;
    this.buildingsLayerId = null;
    this.weatherLayerId = null;
    this.bordersLayerId = null;
    this.contoursLayerId = null;
    this.poisLayerId = null;
    this.waterLayerId = null;
    this.landuseLayerId = null;
    this.roadsLayerId = null;
    this.labelsLayerId = null;
    this.satelliteLayerId = null;
    this.railwaysLayerId = null;
    this.aerialLayerId = null;
    this.currentStyle = 'streets';

    this.init();
  }

  init() {
    if (!this.mapToken) {
      console.error('Mapbox token is required');
      return;
    }

    mapboxgl.accessToken = this.mapToken;
    this.map = new mapboxgl.Map({
      container: this.containerId,
      style: this.style,
      center: this.center,
      zoom: this.zoom,
      pitch: 0,
      bearing: 0
    });

    this.setupControls();
    this.setupEventListeners();
  }

  setupControls() {
    // Navigation controls (zoom in/out, reset bearing to north)
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Fullscreen control
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Geolocate control (real-time location tracking)
    this.addLocationControl();

    // Map layers control
    this.addLayersControl();

    // Geocoder (search)
    if (this.searchEnabled) {
      this.addGeocoder();
    }


    // Scale control
    this.map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Add tooltips to all control buttons
    this.addControlTooltips();
  }

  addLocationControl() {
    const locationContainer = document.createElement('div');
    locationContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    locationContainer.innerHTML = `
      <button 
        id="location-btn" 
        class="mapboxgl-ctrl-icon" 
        style="background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;"
        title="Track my location"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display: block;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </button>
    `;

    const topRight = document.querySelector('.mapboxgl-ctrl-top-right');
    if (topRight) {
      topRight.appendChild(locationContainer);
    }

    const locationBtn = document.getElementById('location-btn');

    locationBtn.addEventListener('click', () => {
      if (this.isTrackingLocation) {
        this.stopLocationTracking();
        locationBtn.style.color = '';
        locationBtn.title = 'Track my location';
      } else {
        const success = this.startLocationTracking();
        if (success) {
          locationBtn.style.color = '#3b82f6';
          locationBtn.title = 'Stop tracking';

          // Center map on user location
          this.getCurrentLocation().then(location => {
            this.flyTo(location.coords, 16);
          }).catch(err => {
            console.error('Error getting location:', err);
          });
        }
      }
    });
  }

  addLayersControl() {
    const layersContainer = document.createElement('div');
    layersContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-group layers-control';
    layersContainer.innerHTML = `
      <button 
        id="layers-btn" 
        class="mapboxgl-ctrl-icon" 
        style="background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;"
        title="Map layers"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
    `;

    const topRight = document.querySelector('.mapboxgl-ctrl-top-right');
    if (topRight) {
      topRight.appendChild(layersContainer);
    }

    // Create layers panel
    this.createLayersPanel();

    // Add event listener
    document.getElementById('layers-btn').addEventListener('click', () => {
      this.toggleLayersPanel();
    });
  }

  createLayersPanel() {
    const panel = document.createElement('div');
    panel.id = 'layers-panel';
    panel.style.cssText = `
      position: absolute;
      top: 60px;
      right: 10px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      min-width: 300px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 1000;
      display: none;
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 600;">Map Layers</h4>
        <button 
          id="close-layers-panel" 
          style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s ease;"
          title="Close layers panel"
          onmouseover="this.style.backgroundColor='#f8f9fa'"
          onmouseout="this.style.backgroundColor='transparent'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div style="margin-bottom: 16px;">
        <h5 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">Map Style:</h5>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="streets" checked style="margin-right: 8px;">
            <span>🛣️ Streets</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="satellite" style="margin-right: 8px;">
            <span>🛰️ Satellite</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="terrain" style="margin-right: 8px;">
            <span>🏔️ Terrain</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="dark" style="margin-right: 8px;">
            <span>🌙 Dark Mode</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="light" style="margin-right: 8px;">
            <span>☀️ Light</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="outdoors" style="margin-right: 8px;">
            <span>🌲 Outdoors</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="navigation-day" style="margin-right: 8px;">
            <span>🗺️ Navigation Day</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="radio" name="map-style" value="navigation-night" style="margin-right: 8px;">
            <span>🌃 Navigation Night</span>
          </label>
        </div>
      </div>
      
      <div style="margin-bottom: 16px; padding-top: 12px; border-top: 1px solid #e9ecef;">
        <h5 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500;">Overlay Layers:</h5>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="traffic-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🚦 Traffic</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="transit-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🚌 Public Transport</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="buildings-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🏢 3D Buildings</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="weather-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🌤️ Weather</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="borders-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🗺️ Administrative Borders</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="contours-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">⛰️ Elevation Contours</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="pois-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">📍 Points of Interest</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="water-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">💧 Water Bodies</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="landuse-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🌳 Land Use</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="roads-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🛣️ Road Network</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="labels-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🏷️ Place Labels</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="satellite-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🛰️ Satellite Imagery</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="railways-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">🚂 Railways</span>
          </label>
          <label style="display: flex; align-items: center; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
            <input type="checkbox" id="aerial-layer" style="margin-right: 10px; transform: scale(1.1);">
            <span style="font-size: 13px;">✈️ Aerial View</span>
          </label>
        </div>
      </div>
      
      <button id="apply-layers" style="width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
        Apply Changes
      </button>
    `;

    const mapContainer = this.map.getContainer();
    mapContainer.appendChild(panel);

    // Add event listeners
    document.querySelectorAll('input[name="map-style"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.changeMapStyle(e.target.value);
      });
    });

    document.getElementById('traffic-layer').addEventListener('change', (e) => {
      this.toggleTrafficLayer(e.target.checked);
    });

    document.getElementById('transit-layer').addEventListener('change', (e) => {
      this.toggleTransitLayer(e.target.checked);
    });

    document.getElementById('buildings-layer').addEventListener('change', (e) => {
      this.toggleBuildingsLayer(e.target.checked);
    });

    document.getElementById('weather-layer').addEventListener('change', (e) => {
      this.toggleWeatherLayer(e.target.checked);
    });

    document.getElementById('borders-layer').addEventListener('change', (e) => {
      this.toggleBordersLayer(e.target.checked);
    });

    document.getElementById('contours-layer').addEventListener('change', (e) => {
      this.toggleContoursLayer(e.target.checked);
    });

    document.getElementById('pois-layer').addEventListener('change', (e) => {
      this.togglePOIsLayer(e.target.checked);
    });

    document.getElementById('water-layer').addEventListener('change', (e) => {
      this.toggleWaterLayer(e.target.checked);
    });

    document.getElementById('landuse-layer').addEventListener('change', (e) => {
      this.toggleLanduseLayer(e.target.checked);
    });

    document.getElementById('roads-layer').addEventListener('change', (e) => {
      this.toggleRoadsLayer(e.target.checked);
    });

    document.getElementById('labels-layer').addEventListener('change', (e) => {
      this.toggleLabelsLayer(e.target.checked);
    });

    document.getElementById('satellite-layer').addEventListener('change', (e) => {
      this.toggleSatelliteLayer(e.target.checked);
    });

    document.getElementById('railways-layer').addEventListener('change', (e) => {
      this.toggleRailwaysLayer(e.target.checked);
    });

    document.getElementById('aerial-layer').addEventListener('change', (e) => {
      this.toggleAerialLayer(e.target.checked);
    });

    document.getElementById('apply-layers').addEventListener('click', () => {
      this.applyLayerSettings();
    });

    document.getElementById('close-layers-panel').addEventListener('click', () => {
      this.toggleLayersPanel();
    });
  }

  toggleLayersPanel() {
    const panel = document.getElementById('layers-panel');
    const isVisible = panel.style.display === 'block';

    panel.style.display = isVisible ? 'none' : 'block';

    // Update button color
    const btn = document.getElementById('layers-btn');
    btn.style.color = isVisible ? '' : '#007bff';
  }

  changeMapStyle(style) {
    const styleMap = {
      'streets': 'mapbox://styles/mapbox/streets-v12',
      'satellite': 'mapbox://styles/mapbox/satellite-v9',
      'terrain': 'mapbox://styles/mapbox/outdoors-v12',
      'dark': 'mapbox://styles/mapbox/dark-v11',
      'light': 'mapbox://styles/mapbox/light-v11',
      'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
      'navigation-day': 'mapbox://styles/mapbox/navigation-day-v1',
      'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1'
    };

    if (styleMap[style]) {
      this.currentStyle = style;
      this.map.setStyle(styleMap[style]);

      // Re-add layers after style change
      this.map.on('style.load', () => {
        this.restoreActiveLayers();
      });
    }
  }

  toggleTrafficLayer(enabled) {
    if (enabled) {
      this.addTrafficLayer();
    } else {
      this.removeTrafficLayer();
    }
  }

  addTrafficLayer() {
    if (this.trafficLayerId) return;

    // Add traffic source (simulated)
    this.map.addSource('traffic-source', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-traffic-v1'
    });

    // Add traffic layers
    this.trafficLayerId = ['traffic-line', 'traffic-bg'];

    this.map.addLayer({
      id: 'traffic-bg',
      type: 'line',
      source: 'traffic-source',
      'source-layer': 'traffic',
      paint: {
        'line-color': [
          'match',
          ['get', 'congestion'],
          'low', '#28a745',
          'moderate', '#ffc107',
          'heavy', '#fd7e14',
          'severe', '#dc3545',
          '#6c757d'
        ],
        'line-width': 3,
        'line-opacity': 0.6
      }
    });

    this.activeLayers.add('traffic');
  }

  removeTrafficLayer() {
    if (!this.trafficLayerId) return;

    this.trafficLayerId.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource('traffic-source')) {
      this.map.removeSource('traffic-source');
    }

    this.trafficLayerId = null;
    this.activeLayers.delete('traffic');
  }

  toggleTransitLayer(enabled) {
    if (enabled) {
      this.addTransitLayer();
    } else {
      this.removeTransitLayer();
    }
  }

  addTransitLayer() {
    if (this.transitLayerId) return;

    // Add transit source (simulated)
    this.map.addSource('transit-source', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-transit-v1'
    });

    // Add transit layers
    this.transitLayerId = ['transit-line', 'transit-station'];

    this.map.addLayer({
      id: 'transit-line',
      type: 'line',
      source: 'transit-source',
      'source-layer': 'transit',
      paint: {
        'line-color': '#007bff',
        'line-width': 2,
        'line-opacity': 0.7
      }
    });

    this.map.addLayer({
      id: 'transit-station',
      type: 'circle',
      source: 'transit-source',
      'source-layer': 'transit-stops',
      paint: {
        'circle-color': '#007bff',
        'circle-radius': 4,
        'circle-stroke-color': 'white',
        'circle-stroke-width': 2
      }
    });

    this.activeLayers.add('transit');
  }

  removeTransitLayer() {
    if (!this.transitLayerId) return;

    this.transitLayerId.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource('transit-source')) {
      this.map.removeSource('transit-source');
    }

    this.transitLayerId = null;
    this.activeLayers.delete('transit');
  }

  toggleBuildingsLayer(enabled) {
    if (enabled) {
      this.addBuildingsLayer();
    } else {
      this.removeBuildingsLayer();
    }
  }

  addBuildingsLayer() {
    if (this.buildingsLayerId) return;

    // Add 3D buildings
    this.map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    });

    this.buildingsLayerId = '3d-buildings';
    this.activeLayers.add('buildings');
  }

  removeBuildingsLayer() {
    if (!this.buildingsLayerId) return;

    if (this.map.getLayer(this.buildingsLayerId)) {
      this.map.removeLayer(this.buildingsLayerId);
    }

    this.buildingsLayerId = null;
    this.activeLayers.delete('buildings');
  }

  toggleWeatherLayer(enabled) {
    if (enabled) {
      this.addWeatherLayer();
    } else {
      this.removeWeatherLayer();
    }
  }

  addWeatherLayer() {
    if (this.weatherLayerId) return;

    // Add weather overlay (simulated)
    this.map.addSource('weather-source', {
      type: 'raster',
      tiles: [
        'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY'
      ],
      tileSize: 256
    });

    this.map.addLayer({
      id: 'weather-layer',
      type: 'raster',
      source: 'weather-source',
      paint: {
        'raster-opacity': 0.6
      }
    });

    this.weatherLayerId = 'weather-layer';
    this.activeLayers.add('weather');
  }

  removeWeatherLayer() {
    if (!this.weatherLayerId) return;

    if (this.map.getLayer(this.weatherLayerId)) {
      this.map.removeLayer(this.weatherLayerId);
    }
    if (this.map.getSource('weather-source')) {
      this.map.removeSource('weather-source');
    }

    this.weatherLayerId = null;
    this.activeLayers.delete('weather');
  }

  toggleBordersLayer(enabled) {
    if (enabled) {
      this.addBordersLayer();
    } else {
      this.removeBordersLayer();
    }
  }

  addBordersLayer() {
    if (this.bordersLayerId) return;

    // Add administrative borders
    this.map.addSource('borders-source', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8'
    });

    this.map.addLayer({
      id: 'admin-boundaries',
      type: 'line',
      source: 'borders-source',
      'source-layer': 'admin',
      paint: {
        'line-color': '#ff0000',
        'line-width': 1,
        'line-opacity': 0.5
      }
    });

    this.bordersLayerId = 'admin-boundaries';
    this.activeLayers.add('borders');
  }

  removeBordersLayer() {
    if (!this.bordersLayerId) return;

    if (this.map.getLayer(this.bordersLayerId)) {
      this.map.removeLayer(this.bordersLayerId);
    }
    if (this.map.getSource('borders-source')) {
      this.map.removeSource('borders-source');
    }

    this.bordersLayerId = null;
    this.activeLayers.delete('borders');
  }

  toggleContoursLayer(enabled) {
    if (enabled) {
      this.addContoursLayer();
    } else {
      this.removeContoursLayer();
    }
  }

  addContoursLayer() {
    if (this.contoursLayerId) return;

    // Add elevation contours
    this.map.addSource('contours-source', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-terrain-v2'
    });

    this.map.addLayer({
      id: 'contours',
      type: 'line',
      source: 'contours-source',
      'source-layer': 'contour',
      paint: {
        'line-color': '#877766',
        'line-width': 1,
        'line-opacity': 0.4
      }
    });

    this.contoursLayerId = 'contours';
    this.activeLayers.add('contours');
  }

  removeContoursLayer() {
    if (!this.contoursLayerId) return;

    if (this.map.getLayer(this.contoursLayerId)) {
      this.map.removeLayer(this.contoursLayerId);
    }
    if (this.map.getSource('contours-source')) {
      this.map.removeSource('contours-source');
    }

    this.contoursLayerId = null;
    this.activeLayers.delete('contours');
  }

  togglePOIsLayer(enabled) {
    if (enabled) {
      this.addPOIsLayer();
    } else {
      this.removePOIsLayer();
    }
  }

  addPOIsLayer() {
    if (this.poisLayerId) return;

    // Add points of interest
    this.map.addLayer({
      id: 'poi-labels',
      type: 'symbol',
      source: 'composite',
      'source-layer': 'poi_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#666',
        'text-halo-color': 'rgba(255,255,255,0.75)',
        'text-halo-width': 1
      }
    });

    this.poisLayerId = 'poi-labels';
    this.activeLayers.add('pois');
  }

  removePOIsLayer() {
    if (!this.poisLayerId) return;

    if (this.map.getLayer(this.poisLayerId)) {
      this.map.removeLayer(this.poisLayerId);
    }

    this.poisLayerId = null;
    this.activeLayers.delete('pois');
  }

  toggleWaterLayer(enabled) {
    if (enabled) {
      this.addWaterLayer();
    } else {
      this.removeWaterLayer();
    }
  }

  addWaterLayer() {
    if (this.waterLayerId) return;

    this.map.addLayer({
      id: 'water-layer',
      type: 'fill',
      source: 'composite',
      'source-layer': 'water',
      paint: {
        'fill-color': '#4da6ff',
        'fill-opacity': 0.6
      }
    });

    this.waterLayerId = 'water-layer';
    this.activeLayers.add('water');
  }

  removeWaterLayer() {
    if (!this.waterLayerId) return;

    if (this.map.getLayer(this.waterLayerId)) {
      this.map.removeLayer(this.waterLayerId);
    }

    this.waterLayerId = null;
    this.activeLayers.delete('water');
  }

  toggleLanduseLayer(enabled) {
    if (enabled) {
      this.addLanduseLayer();
    } else {
      this.removeLanduseLayer();
    }
  }

  addLanduseLayer() {
    if (this.landuseLayerId) return;

    this.map.addLayer({
      id: 'landuse-layer',
      type: 'fill',
      source: 'composite',
      'source-layer': 'landuse',
      paint: {
        'fill-color': [
          'match',
          ['get', 'class'],
          'park', '#4caf50',
          'grass', '#8bc34a',
          'cemetery', '#795548',
          'pitch', '#ff9800',
          'sand', '#ffc107',
          'farmland', '#8d6e63',
          'forest', '#2e7d32',
          'wood', '#388e3c',
          '#9e9e9e'
        ],
        'fill-opacity': 0.5
      }
    });

    this.landuseLayerId = 'landuse-layer';
    this.activeLayers.add('landuse');
  }

  removeLanduseLayer() {
    if (!this.landuseLayerId) return;

    if (this.map.getLayer(this.landuseLayerId)) {
      this.map.removeLayer(this.landuseLayerId);
    }

    this.landuseLayerId = null;
    this.activeLayers.delete('landuse');
  }

  toggleRoadsLayer(enabled) {
    if (enabled) {
      this.addRoadsLayer();
    } else {
      this.removeRoadsLayer();
    }
  }

  addRoadsLayer() {
    if (this.roadsLayerId) return;

    this.map.addLayer({
      id: 'roads-layer',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      paint: {
        'line-color': '#ff5722',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    this.roadsLayerId = 'roads-layer';
    this.activeLayers.add('roads');
  }

  removeRoadsLayer() {
    if (!this.roadsLayerId) return;

    if (this.map.getLayer(this.roadsLayerId)) {
      this.map.removeLayer(this.roadsLayerId);
    }

    this.roadsLayerId = null;
    this.activeLayers.delete('roads');
  }

  toggleLabelsLayer(enabled) {
    if (enabled) {
      this.addLabelsLayer();
    } else {
      this.removeLabelsLayer();
    }
  }

  addLabelsLayer() {
    if (this.labelsLayerId) return;

    this.map.addLayer({
      id: 'labels-layer',
      type: 'symbol',
      source: 'composite',
      'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': 'rgba(255,255,255,0.8)',
        'text-halo-width': 2
      }
    });

    this.labelsLayerId = 'labels-layer';
    this.activeLayers.add('labels');
  }

  removeLabelsLayer() {
    if (!this.labelsLayerId) return;

    if (this.map.getLayer(this.labelsLayerId)) {
      this.map.removeLayer(this.labelsLayerId);
    }

    this.labelsLayerId = null;
    this.activeLayers.delete('labels');
  }

  toggleSatelliteLayer(enabled) {
    if (enabled) {
      this.addSatelliteLayer();
    } else {
      this.removeSatelliteLayer();
    }
  }

  addSatelliteLayer() {
    if (this.satelliteLayerId) return;

    this.map.addSource('satellite-source', {
      type: 'raster',
      tiles: [
        'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=' + this.mapToken
      ],
      tileSize: 512
    });

    this.map.addLayer({
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite-source',
      paint: {
        'raster-opacity': 0.7
      }
    });

    this.satelliteLayerId = 'satellite-layer';
    this.activeLayers.add('satellite');
  }

  removeSatelliteLayer() {
    if (!this.satelliteLayerId) return;

    if (this.map.getLayer(this.satelliteLayerId)) {
      this.map.removeLayer(this.satelliteLayerId);
    }
    if (this.map.getSource('satellite-source')) {
      this.map.removeSource('satellite-source');
    }

    this.satelliteLayerId = null;
    this.activeLayers.delete('satellite');
  }

  toggleRailwaysLayer(enabled) {
    if (enabled) {
      this.addRailwaysLayer();
    } else {
      this.removeRailwaysLayer();
    }
  }

  addRailwaysLayer() {
    if (this.railwaysLayerId) return;

    this.map.addLayer({
      id: 'railways-layer',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      filter: ['==', ['get', 'class'], 'rail'],
      paint: {
        'line-color': '#795548',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    this.railwaysLayerId = 'railways-layer';
    this.activeLayers.add('railways');
  }

  removeRailwaysLayer() {
    if (!this.railwaysLayerId) return;

    if (this.map.getLayer(this.railwaysLayerId)) {
      this.map.removeLayer(this.railwaysLayerId);
    }

    this.railwaysLayerId = null;
    this.activeLayers.delete('railways');
  }

  toggleAerialLayer(enabled) {
    if (enabled) {
      this.addAerialLayer();
    } else {
      this.removeAerialLayer();
    }
  }

  addAerialLayer() {
    if (this.aerialLayerId) return;

    this.map.addSource('aerial-source', {
      type: 'raster',
      tiles: [
        'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=' + this.mapToken
      ],
      tileSize: 512
    });

    this.map.addLayer({
      id: 'aerial-layer',
      type: 'raster',
      source: 'aerial-source',
      paint: {
        'raster-opacity': 0.9,
        'raster-hue-rotate': 10
      }
    });

    this.aerialLayerId = 'aerial-layer';
    this.activeLayers.add('aerial');
  }

  removeAerialLayer() {
    if (!this.aerialLayerId) return;

    if (this.map.getLayer(this.aerialLayerId)) {
      this.map.removeLayer(this.aerialLayerId);
    }
    if (this.map.getSource('aerial-source')) {
      this.map.removeSource('aerial-source');
    }

    this.aerialLayerId = null;
    this.activeLayers.delete('aerial');
  }

  restoreActiveLayers() {
    // Restore all active layers after style change
    const activeLayersCopy = new Set(this.activeLayers);

    this.activeLayers.clear();

    activeLayersCopy.forEach(layer => {
      switch (layer) {
        case 'traffic':
          this.toggleTrafficLayer(true);
          break;
        case 'transit':
          this.toggleTransitLayer(true);
          break;
        case 'buildings':
          this.toggleBuildingsLayer(true);
          break;
        case 'weather':
          this.toggleWeatherLayer(true);
          break;
        case 'borders':
          this.toggleBordersLayer(true);
          break;
        case 'contours':
          this.toggleContoursLayer(true);
          break;
        case 'pois':
          this.togglePOIsLayer(true);
          break;
        case 'water':
          this.toggleWaterLayer(true);
          break;
        case 'landuse':
          this.toggleLanduseLayer(true);
          break;
        case 'roads':
          this.toggleRoadsLayer(true);
          break;
        case 'labels':
          this.toggleLabelsLayer(true);
          break;
        case 'satellite':
          this.toggleSatelliteLayer(true);
          break;
        case 'railways':
          this.toggleRailwaysLayer(true);
          break;
        case 'aerial':
          this.toggleAerialLayer(true);
          break;
      }
    });
  }

  applyLayerSettings() {
    // Apply all layer settings and close panel
    this.toggleLayersPanel();
  }

  addGeocoder() {
    const geocoderContainer = document.createElement('div');
    geocoderContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-group geocoder-container';
    geocoderContainer.innerHTML = `
      <div style="padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <input 
          type="text" 
          id="geocoder-input" 
          placeholder="🔍 Search location..." 
          style="width: 200px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
        />
        <div id="geocoder-results" style="position: absolute; top: 45px; width: 200px; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 200px; overflow-y: auto; display: none; z-index: 1000;"></div>
        <div id="search-suggestions" style="position: absolute; top: 45px; left: 0; width: 250px; background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; display: none; z-index: 999; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 5px;">
          <div style="font-size: 13px; color: #666; margin-bottom: 8px; font-weight: 600;">💡 Popular Searches:</div>
          <div id="suggestion-tags" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
        </div>
      </div>
    `;

    const topRight = document.querySelector('.mapboxgl-ctrl-top-right');
    if (topRight) {
      topRight.insertBefore(geocoderContainer, topRight.firstChild);
    }

    const input = document.getElementById('geocoder-input');
    const resultsDiv = document.getElementById('geocoder-results');
    const suggestionsDiv = document.getElementById('search-suggestions');

    // Show suggestions when input is focused
    input.addEventListener('focus', () => {
      this.showPopularSuggestions();
    });

    input.addEventListener('input', (e) => {
      this.handleGeocoderSearch(e.target.value, resultsDiv);
      // Hide popular suggestions when user starts typing results
      if (suggestionsDiv) {
        if (e.target.value.length > 0) {
          suggestionsDiv.style.display = 'none';
        } else {
          suggestionsDiv.style.display = 'block';
        }
      }
    });

    // Initialize suggestions when map loads
    setTimeout(() => {
      this.showPopularSuggestions();
    }, 500);

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!geocoderContainer.contains(e.target)) {
        const suggestionsDiv = document.getElementById('search-suggestions');
        const resultsDiv = document.getElementById('geocoder-results');
        if (suggestionsDiv) suggestionsDiv.style.display = 'none';
        if (resultsDiv) resultsDiv.style.display = 'none';
      }
    });
  }

  showPopularSuggestions() {
    const suggestionsDiv = document.getElementById('search-suggestions');
    const tagsDiv = document.getElementById('suggestion-tags');

    if (!suggestionsDiv || !tagsDiv) return;

    // Always show suggestions
    suggestionsDiv.style.display = 'block';
    tagsDiv.innerHTML = '';

    const popularSearches = [
      { text: 'Mumbai Airport', icon: '✈️' },
      { text: 'Pune Railway Station', icon: '🚂' },
      { text: 'Lonavala', icon: '🏔️' },
      { text: 'Mahabaleshwar', icon: '🕉️' },
      { text: 'Shirdi', icon: '🛕' },
      { text: 'Goa Beach', icon: '🏖️' },
      { text: 'Mumbai Hotels', icon: '🏨' },
      { text: 'Pune Restaurants', icon: '🍽️' }
    ];

    popularSearches.forEach(search => {
      const tag = document.createElement('span');
      tag.style.cssText = `
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 15px;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #666;
        margin: 2px;
      `;

      tag.innerHTML = `<span style="font-size: 14px;">${search.icon}</span> ${search.text}`;

      tag.addEventListener('click', () => {
        document.getElementById('geocoder-input').value = search.text;
        this.handleGeocoderSearch(search.text, document.getElementById('geocoder-results'));
      });

      tag.addEventListener('mouseenter', () => {
        tag.style.background = '#e0e0e0';
        tag.style.borderColor = '#999';
        tag.style.color = '#333';
      });

      tag.addEventListener('mouseleave', () => {
        tag.style.background = '#f0f0f0';
        tag.style.borderColor = '#ddd';
        tag.style.color = '#666';
      });

      tagsDiv.appendChild(tag);
    });
  }

  async handleGeocoderSearch(query, resultsDiv) {
    if (query.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.mapToken}`
      );
      const data = await response.json();

      resultsDiv.innerHTML = '';
      data.features.slice(0, 5).forEach(feature => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; hover: background: #f5f5f5;';
        div.textContent = feature.place_name;
        div.addEventListener('click', () => {
          this.map.flyTo({
            center: feature.center,
            zoom: 14,
            duration: 1000
          });
          resultsDiv.style.display = 'none';
          document.getElementById('geocoder-input').value = feature.place_name;
        });
        resultsDiv.appendChild(div);
      });

      resultsDiv.style.display = data.features.length > 0 ? 'block' : 'none';

      // Hide popular suggestions when search results are showing
      const suggestionsDiv = document.getElementById('search-suggestions');
      if (suggestionsDiv) {
        if (data.features.length > 0) {
          suggestionsDiv.style.display = 'none';
        } else if (query.length === 0) {
          suggestionsDiv.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }


  addControlTooltips() {
    // Wait for map to load and controls to be added
    setTimeout(() => {
      this.addIconsToNavigationControls();
      this.addIconsToFullscreenControl();
      this.addTooltipsToNavigationControls();
      this.addTooltipsToFullscreenControl();
      this.addTooltipsToGeocoder();
      this.addTooltipsToScaleControl();
    }, 100);
  }

  addIconsToNavigationControls() {
    const navControls = document.querySelectorAll('.mapboxgl-ctrl-nav button');
    const icons = [
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display: block;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>', // Plus for Zoom In
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display: block;"><path d="M19 13H5v-2h14v2z"/></svg>', // Minus for Zoom Out
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display: block;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>' // Compass for Reset Bearing
    ];

    navControls.forEach((button, index) => {
      if (icons[index]) {
        // Clear existing content completely
        button.innerHTML = '';
        button.textContent = '';

        // Create SVG element
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = icons[index];
        svgContainer.style.display = 'flex';
        svgContainer.style.alignItems = 'center';
        svgContainer.style.justifyContent = 'center';
        svgContainer.style.width = '100%';
        svgContainer.style.height = '100%';

        // Add to button
        button.appendChild(svgContainer);

        // Force button styles
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.padding = '12px';
        button.style.minWidth = '44px';
        button.style.minHeight = '44px';
      }
    });
  }

  addIconsToFullscreenControl() {
    const fullscreenBtn = document.querySelector('.mapboxgl-ctrl-fullscreen button');
    if (fullscreenBtn) {
      const fullscreenIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display: block;"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';

      // Clear existing content completely
      fullscreenBtn.innerHTML = '';
      fullscreenBtn.textContent = '';

      // Create SVG element
      const svgContainer = document.createElement('div');
      svgContainer.innerHTML = fullscreenIcon;
      svgContainer.style.display = 'flex';
      svgContainer.style.alignItems = 'center';
      svgContainer.style.justifyContent = 'center';
      svgContainer.style.width = '100%';
      svgContainer.style.height = '100%';

      // Add to button
      fullscreenBtn.appendChild(svgContainer);

      // Force button styles
      fullscreenBtn.style.display = 'flex';
      fullscreenBtn.style.alignItems = 'center';
      fullscreenBtn.style.justifyContent = 'center';
      fullscreenBtn.style.padding = '12px';
      fullscreenBtn.style.minWidth = '44px';
      fullscreenBtn.style.minHeight = '44px';
    }
  }

  addTooltipsToNavigationControls() {
    const navControls = document.querySelectorAll('.mapboxgl-ctrl-nav button');
    const tooltips = ['Zoom In', 'Zoom Out', 'Reset Bearing to North'];

    navControls.forEach((button, index) => {
      if (tooltips[index]) {
        this.addTooltipToButton(button, tooltips[index]);
      }
    });
  }

  addTooltipsToFullscreenControl() {
    const fullscreenBtn = document.querySelector('.mapboxgl-ctrl-fullscreen button');
    if (fullscreenBtn) {
      this.addTooltipToButton(fullscreenBtn, 'Toggle Fullscreen');
    }
  }

  addTooltipsToGeocoder() {
    const searchInput = document.querySelector('#geocoder-input');
    if (searchInput) {
      searchInput.setAttribute('title', 'Search for a location');
    }
  }


  addTooltipsToScaleControl() {
    const scaleControl = document.querySelector('.mapboxgl-ctrl-scale');
    if (scaleControl) {
      scaleControl.setAttribute('title', 'Map scale reference');
    }
  }

  addTooltipToButton(button, tooltipText) {
    // Remove existing title attribute to avoid default tooltip
    button.removeAttribute('title');

    // Create custom tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'map-control-tooltip';
    tooltip.textContent = tooltipText;
    tooltip.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #333, #555);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      margin-bottom: 8px;
      z-index: 1001;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-family: 'Poppins', sans-serif;
    `;

    // Create arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #333;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      margin-bottom: -3px;
      z-index: 1001;
    `;

    // Position button relatively
    button.style.position = 'relative';

    // Add tooltip and arrow to button
    button.appendChild(tooltip);
    button.appendChild(arrow);

    // Show/hide tooltip on hover
    button.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      arrow.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      arrow.style.opacity = '0';
    });
  }


  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  setupEventListeners() {
    this.map.on('load', () => {
      console.log('Enhanced map loaded');
    });

    // Hover effects
    this.map.on('mousemove', (e) => {
      const features = this.map.queryRenderedFeatures({ point: e.point });
      this.map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : 'grab';
    });
  }

  // Add a marker with custom options
  addMarker(id, coords, options = {}) {
    const {
      color = 'red',
      title = '',
      description = '',
      icon = null,
      customElement = null, // New option for fully custom DOM elements
      popup = true,
      draggable = false,
      offset = null // [x, y] offset from center
    } = options;

    let markerEl = null;

    if (customElement) {
      markerEl = customElement;
    } else if (icon && icon !== 'home' && icon !== 'user') {
      // Keep support for URL icons if they aren't our special keywords
      markerEl = document.createElement('div');
      markerEl.style.backgroundImage = `url('${icon}')`;
      markerEl.style.width = '32px';
      markerEl.style.height = '32px';
      markerEl.style.backgroundSize = 'contain';
      markerEl.style.backgroundRepeat = 'no-repeat';
    }

    // Construct Mapbox Marker options properly
    const markerOptions = { draggable };
    if (markerEl) {
      markerOptions.element = markerEl;
    } else {
      markerOptions.color = color;
    }

    const marker = new mapboxgl.Marker(markerOptions)
      .setLngLat(coords);

    if (popup && (title || description)) {
      marker.setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: Arial, sans-serif;">
            ${title ? `<h6 style="margin: 0 0 5px 0; font-weight: 600;">${title}</h6>` : ''}
            ${description ? `<p style="margin: 0; font-size: 12px; color: #666;">${description}</p>` : ''}
          </div>
        `)
      );
    }

    marker.addTo(this.map);
    this.markers.set(id, marker);
    return marker;
  }

  // Remove a marker
  removeMarker(id) {
    const marker = this.markers.get(id);
    if (marker) {
      marker.remove();
      this.markers.delete(id);
    }
  }

  // Add a route with animation
  async addRoute(id, coords, options = {}) {
    const {
      color = '#007bff',
      width = 4,
      animate = true,
      transportMode = 'driving'
    } = options;

    try {
      // Validate coordinates
      if (!coords || coords.length < 2) {
        console.error('Invalid coordinates for route:', coords);
        return;
      }

      // Validate each coordinate pair
      for (let i = 0; i < coords.length; i++) {
        const [lng, lat] = coords[i];
        if (typeof lng !== 'number' || typeof lat !== 'number' ||
          lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          console.error(`Invalid coordinate at index ${i}:`, coords[i]);
          return;
        }
      }

      // Ensure transport mode is valid
      const validTransportModes = ['driving', 'walking', 'cycling'];
      const mode = validTransportModes.includes(transportMode) ? transportMode : 'driving';

      // Format coordinates correctly (longitude,latitude)
      const coordsStr = coords.map(c => `${c[0]},${c[1]}`).join(';');
      const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coordsStr}?geometries=geojson&access_token=${this.mapToken}`;

      console.log('Requesting route:', apiUrl);
      console.log('Coordinates:', coords);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        console.error('Request URL:', apiUrl);

        // Try to get more error details
        const errorText = await response.text();
        console.error('Error response:', errorText);

        // Create fallback straight-line route
        console.log('Creating fallback straight-line route');
        this.createFallbackRoute(id, coords, color, width, animate);
        return;
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.error('No route found - API response:', data);
        console.log('Creating fallback straight-line route');

        // Create fallback straight-line route
        const routeGeometry = {
          type: 'LineString',
          coordinates: coords
        };

        this.addRouteGeometry(id, routeGeometry, { color, width, animate });
        return;
      }

      const routeGeometry = data.routes[0].geometry;
      this.addRouteGeometry(id, routeGeometry, { color, width, animate });
    } catch (error) {
      console.error('Error creating route:', error);
    }
  }

  addRouteGeometry(id, routeGeometry, options = {}) {
    const { color = '#007bff', width = 4, animate = true } = options;
    const sourceId = `route-source-${id}`;
    const layerId = `route-layer-${id}`;

    // Remove existing route if any
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    // Add route source
    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: routeGeometry
      }
    });

    // Add route layer
    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': 0.8
      }
    });

    // Store route data
    this.routes.set(id, {
      geometry: routeGeometry,
      sourceId,
      layerId,
      color,
      width
    });

    // Animate route if enabled
    if (animate) {
      this.animateRoute(layerId);
    }
  }

  // Animate route with moving dot
  animateRoute(layerId) {
    if (!this.map.getLayer(layerId)) return;

    // Create animation dot
    const dot = document.createElement('div');
    dot.className = 'route-animation-dot';
    dot.style.cssText = `
      width: 12px;
      height: 12px;
      background: #ff6b6b;
      border: 2px solid white;
      border-radius: 50%;
      position: absolute;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: none;
    `;

    // Get route coordinates
    const route = this.routes.get(layerId.replace('route-layer-', ''));
    if (!route || !route.geometry) return;

    const coordinates = route.geometry.coordinates;
    let currentIndex = 0;

    // Animation function
    const animate = () => {
      if (currentIndex >= coordinates.length) {
        currentIndex = 0; // Loop animation
      }

      const coord = coordinates[currentIndex];
      const screenPoint = this.map.project(coord);

      // Position dot on screen
      dot.style.left = `${screenPoint.x - 6}px`;
      dot.style.top = `${screenPoint.y - 6}px`;

      // Add dot to map container if not already added
      if (!dot.parentNode) {
        this.map.getContainer().appendChild(dot);
      }

      currentIndex++;
      this.animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Clean up on route removal
    const originalRemoveRoute = this.removeRoute.bind(this);
    this.removeRoute = (id) => {
      if (dot.parentNode) {
        dot.parentNode.removeChild(dot);
      }
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      return originalRemoveRoute(id);
    };
  }

  // Remove a route
  removeRoute(id) {
    const route = this.routes.get(id);
    if (route) {
      if (this.map.getLayer(route.layerId)) {
        this.map.removeLayer(route.layerId);
        this.map.removeSource(route.sourceId);
      }
      this.routes.delete(id);
    }
  }

  // Add heatmap layer
  addHeatmap(id, data, options = {}) {
    const { color = 'blue', intensity = 1 } = options;

    const sourceId = `heatmap-source-${id}`;
    const layerId = `heatmap-layer-${id}`;

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
      this.map.removeSource(sourceId);
    }

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: data.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          properties: {
            mag: point.intensity || 1
          }
        }))
      }
    });

    this.map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0, 0, 255, 0)',
          0.1, 'royalblue',
          0.3, 'cyan',
          0.5, 'lime',
          0.7, 'yellow',
          1, 'red'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
      }
    });
  }

  // Add clustering
  addClusteredMarkers(id, data, options = {}) {
    const { clusterRadius = 50, clusterMaxZoom = 14 } = options;

    const sourceId = `cluster-source-${id}`;
    const layerId = `cluster-layer-${id}`;

    if (this.map.getSource(sourceId)) {
      this.map.removeLayer(layerId);
      this.map.removeSource(sourceId);
    }

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: data
      },
      cluster: true,
      clusterRadius,
      clusterMaxZoom
    });

    // Cluster layer
    this.map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#51bbd6',
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
      }
    });

    // Cluster count layer
    this.map.addLayer({
      id: `${layerId}-count`,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium'],
        'text-size': 12
      }
    });

    // Individual point layer
    this.map.addLayer({
      id: `${layerId}-point`,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ff6b6b',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    });
  }

  // Fly to location
  flyTo(coords, zoom = 14, duration = 1000) {
    this.map.flyTo({
      center: coords,
      zoom,
      duration
    });
  }

  // Get map instance
  getMap() {
    return this.map;
  }

  // Start real-time location tracking
  startLocationTracking() {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }

    this.isTrackingLocation = true;

    // Watch position for real-time updates
    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = [longitude, latitude];
        this.locationAccuracy = accuracy;

        // Update or create user location marker
        if (this.userLocationMarker) {
          this.userLocationMarker.setLngLat(coords);
        } else {
          this.userLocationMarker = new mapboxgl.Marker({
            color: '#3b82f6',
            scale: 1.2
          })
            .setLngLat(coords)
            .addTo(this.map);

          // Add accuracy circle
          this.addAccuracyCircle(coords, accuracy);
        }

        // Update accuracy circle if exists
        this.updateAccuracyCircle(coords, accuracy);
      },
      (error) => {
        console.error('Error getting location:', error);
        this.stopLocationTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return true;
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    this.isTrackingLocation = false;
  }

  // Add accuracy circle around user location
  addAccuracyCircle(coords, accuracy) {
    if (!this.map.getSource('accuracy-circle')) {
      this.map.addSource('accuracy-circle', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        }
      });

      this.map.addLayer({
        id: 'accuracy-circle',
        type: 'circle',
        source: 'accuracy-circle',
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': accuracy / 2,
          'circle-opacity': 0.2,
          'circle-stroke-color': '#3b82f6',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.4
        }
      });
    }
  }

  // Update accuracy circle
  updateAccuracyCircle(coords, accuracy) {
    if (this.map.getSource('accuracy-circle')) {
      this.map.getSource('accuracy-circle').setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        }
      });

      this.map.setPaintProperty('accuracy-circle', 'circle-radius', accuracy / 2);
    }
  }

  // Get current user location (one-time)
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: [position.coords.longitude, position.coords.latitude],
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Cleanup
  destroy() {
    if (this.map) {
      this.stopLocationTracking();
      this.map.remove();
    }
  }

  // Create fallback straight-line route when API fails
  createFallbackRoute(id, coords, color, width, animate) {
    try {
      const routeGeometry = {
        type: 'LineString',
        coordinates: coords
      };

      const routeData = {
        type: 'Feature',
        properties: {
          color: color,
          width: width
        },
        geometry: routeGeometry
      };

      // Remove existing route if it exists
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
      if (this.map.getSource(id)) {
        this.map.removeSource(id);
      }

      // Add the route source and layer
      this.map.addSource(id, {
        type: 'geojson',
        data: routeData
      });

      this.map.addLayer({
        id: id,
        type: 'line',
        source: id,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': 0.8
        }
      });

      console.log('Fallback route created successfully');
    } catch (error) {
      console.error('Error creating fallback route:', error);
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedMap;
}

// Make available globally for browser
window.EnhancedMap = EnhancedMap;
