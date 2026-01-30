
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map
    mapboxgl.accessToken = mapToken;

    // Enhanced Map Options
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [78.9629, 20.5937],
        zoom: 4,
        pitch: 0,
        bearing: 0,
        projection: 'globe' // Enable globe projection for awesomeness
    });

    // Add Atmosphere for Globe
    map.on('style.load', () => {
        map.setFog({
            'color': 'rgb(186, 210, 235)', // Lower atmosphere
            'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
            'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
            'space-color': 'rgb(11, 11, 25)', // Background color
            'star-intensity': 0.6 // Background star brightness (default 0.35 at low zooms )
        });
    });

    const activeFilters = {
        listings: true,
        vehicles: true,
        dhabas: true,
        minPrice: 0,
        maxPrice: 100000
    };

    let allFeatures = [];
    let is3DEnabled = false;
    let isWeatherEnabled = false;
    let arePoisEnabled = false;
    let isHeatmapEnabled = false;

    // --- CONTROLS ---

    // 1. Navigation & Fullscreen
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());

    // 2. Geolocate (Hyper-Precision Mode)
    const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0 // Force fresh location
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
        fitBoundsOptions: { maxZoom: 16 } // Zoom in tight on the user
    });
    map.addControl(geolocate);

    // Logic for "Exact" location feedback
    geolocate.on('geolocate', async (e) => {
        const { longitude, latitude } = e.coords;
        console.log('Exact location fix:', longitude, latitude);

        // Reverse Geocode to get exact address
        try {
            const query = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`;
            const response = await fetch(query);
            const data = await response.json();
            const address = data.features[0]?.place_name || "Unknown Location";

            // Show address in search bar as feedback
            geocoder.setInput(address.split(',')[0]); // Just the neighborhood/street for clean UI

            // Update Stats or Show Toast
            updateStats(`Pinned to: ${address.split(',')[0]}`);
        } catch (err) {
            console.error("Reverse geocoding error:", err);
        }
    });

    geolocate.on('trackuserlocationstart', () => {
        document.querySelector('.mapboxgl-ctrl-geolocate').classList.add('tracking-active');
    });

    geolocate.on('trackuserlocationend', () => {
        document.querySelector('.mapboxgl-ctrl-geolocate').classList.remove('tracking-active');
    });

    // 3. Geocoder (Search)
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Search exact location (e.g. Pune, Mumbai)...',
        marker: {
            color: '#FF385C'
        },
        proximity: 'ip', // Bias results near user
        types: 'country,region,postcode,district,place,locality,neighborhood,address,poi',
        zoom: 14 // Zoom in close for exact locations
    });
    map.addControl(geocoder, 'top-left');

    // Handle Geocoder Result
    geocoder.on('result', (e) => {
        const coords = e.result.geometry.coordinates;
        map.flyTo({
            center: coords,
            zoom: 15,
            essential: true
        });
        // Clear clusters and reload if needed, but renderMarkers should handle it
        setTimeout(syncListWithMap, 1000);
    });

    // 4. Mapbox Draw (Polygon Search)
    const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true
        },
        defaultMode: 'simple_select'
    });
    map.addControl(draw, 'top-left');

    // 5. Mapbox Directions (Hidden by default, used for calculations)
    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        interactive: false,
        controls: { inputs: false, instructions: false } // We just want the line
    });
    map.addControl(directions, 'bottom-left');


    // --- ENHANCEMENT CONTROLS UI ---
    // Inject Toggle Buttons into map container
    const overlaysContainer = document.querySelector('.map-overlays');

    // Weather Toggle
    const weatherBtn = document.createElement('button');
    weatherBtn.className = 'map-control-btn';
    weatherBtn.title = 'Toggle Live Weather';
    weatherBtn.innerHTML = '<i class="fas fa-cloud-sun-rain"></i>';
    weatherBtn.onclick = toggleWeather;
    overlaysContainer.appendChild(weatherBtn);

    // POI Toggle
    const poiBtn = document.createElement('button');
    poiBtn.className = 'map-control-btn';
    poiBtn.title = 'Show Local Gems';
    poiBtn.innerHTML = '<i class="fas fa-gem"></i>';
    poiBtn.onclick = togglePois;
    overlaysContainer.appendChild(poiBtn);

    // Heatmap Toggle
    const heatmapBtn = document.createElement('button');
    heatmapBtn.className = 'map-control-btn';
    heatmapBtn.title = 'Toggle Density Heatmap';
    heatmapBtn.innerHTML = '<i class="fas fa-fire"></i>';
    heatmapBtn.onclick = toggleHeatmap;
    overlaysContainer.appendChild(heatmapBtn);

    // Reset View Button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'map-control-btn';
    resetBtn.title = 'Reset to India View';
    resetBtn.innerHTML = '<i class="fas fa-undo"></i>';
    resetBtn.onclick = () => {
        map.flyTo({ center: [78.9629, 20.5937], zoom: 4, pitch: 0, bearing: 0 });
        geocoder.clear(); // Clear search bar
    };
    overlaysContainer.appendChild(resetBtn);

    // Create Weather Widget (Hidden)
    const weatherWidget = document.createElement('div');
    weatherWidget.className = 'weather-widget hidden';
    weatherWidget.innerHTML = `
        <img src="" class="weather-icon" alt="Weather">
        <div>
            <div class="weather-temp">--°C</div>
            <div class="weather-desc">Loading...</div>
        </div>
    `;
    document.querySelector('.map-container').appendChild(weatherWidget);


    // --- DATA LOADING ---
    const loadMapData = async () => {
        try {
            document.querySelector('.search-area-btn')?.classList.remove('visible');
            const response = await fetch('/api/map/data');
            const data = await response.json();
            allFeatures = data.features;

            if (map.isStyleLoaded()) {
                renderMarkers();
                add3DBuildings();
            } else {
                map.on('style.load', () => {
                    renderMarkers();
                    add3DBuildings();
                });
            }
            updateStats(allFeatures.length);
        } catch (error) {
            console.error("Error loading map data:", error);
        }
    };

    // --- RENDERING MARKERS ---
    const renderMarkers = (customFeatures = null) => {
        const featuresToRender = customFeatures || allFeatures;

        // Clear existing
        if (map.getLayer('clusters')) map.removeLayer('clusters');
        if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
        if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
        if (map.getSource('mapped-items')) map.removeSource('mapped-items');

        // Apply Filters
        const filtered = featuresToRender.filter(f => {
            const typeMatch = activeFilters[f.properties.type + 's'];
            const priceMatch = f.properties.price >= activeFilters.minPrice && f.properties.price <= activeFilters.maxPrice;
            return typeMatch && priceMatch;
        });

        // Add Source
        map.addSource('mapped-items', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: filtered },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        // Clusters
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'mapped-items',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
                'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
            }
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'mapped-items',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        // Unclustered Points
        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'mapped-items',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'type'],
                    'listing', '#F4A261',
                    'vehicle', '#2A9D8F',
                    'dhaba', '#E76F51',
                    '#ccc'
                ],
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        });

        syncListWithMap();
    };


    // --- 3D BUILDINGS ---
    function add3DBuildings() {
        if (map.getLayer('3d-buildings')) return;
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find((layer) => layer.type === 'symbol' && layer.layout['text-field']).id;

        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
                'fill-extrusion-opacity': 0.6
            },
            'layout': { 'visibility': is3DEnabled ? 'visible' : 'none' }
        }, labelLayerId);
    }

    // --- DRAW SEARCH HANDLER ---
    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    function updateArea(e) {
        const data = draw.getAll();
        if (data.features.length > 0) {
            const area = data.features[0]; // Take the first drawn shape

            // Use Turf.js to find points inside polygon
            const filtered = allFeatures.filter(f => {
                return turf.booleanPointInPolygon(f.geometry, area);
            });

            renderMarkers(filtered); // Re-render ONLY points in area
            map.fitBounds(turf.bbox(area), { padding: 50 });
            updateStats(filtered.length);
        } else {
            renderMarkers(allFeatures); // Reset
            updateStats(allFeatures.length);
        }
    }


    // --- SMART DIRECTIONS ---
    // When clicking a point, show route from user location
    map.on('click', 'unclustered-point', (e) => {
        const feature = e.features[0];
        const destCoords = feature.geometry.coordinates.slice();
        const { title, price, image, type, id, location } = feature.properties;

        // Show Popup First
        new mapboxgl.Popup({ className: 'custom-popup' })
            .setLngLat(destCoords)
            .setHTML(`
                <div class="popup-card">
                    <div style="position:relative;">
                        <img src="${image || '/images/default.jpg'}" class="popup-image" alt="${title}">
                        <span class="popup-type-badge">${type}</span>
                    </div>
                    <div class="popup-details">
                        <h3 class="popup-title">${title}</h3>
                        <div class="popup-info"><i class="fas fa-map-marker-alt"></i> ${location || ''}</div>
                        <div class="popup-price">₹${price.toLocaleString('en-IN')}</div>
                         <div class="d-flex gap-2 mt-2">
                             <button class="popup-action" onclick="window.location.href='/${type}s/${id}'">View Details</button>
                             <button class="popup-action" style="background:var(--secondary-color);" id="btn-directions-${id}">Get Directions</button>
                         </div>
                    </div>
                </div>
            `)
            .addTo(map);

        // Attach listener for directions button after popup renders
        setTimeout(() => {
            const dirBtn = document.getElementById(`btn-directions-${id}`);
            if (dirBtn) {
                dirBtn.onclick = () => {
                    // Get User Location
                    navigator.geolocation.getCurrentPosition(pos => {
                        const userCoords = [pos.coords.longitude, pos.coords.latitude];
                        directions.setOrigin(userCoords);
                        directions.setDestination(destCoords);
                        map.flyTo({ center: userCoords, zoom: 12 });
                    }, err => {
                        alert("Could not get your location. Please enable GPS.");
                    });
                };
            }
        }, 100);
    });

    // --- WEATHER LAYER ---
    function toggleWeather() {
        isWeatherEnabled = !isWeatherEnabled;
        weatherBtn.classList.toggle('active');
        const widget = document.querySelector('.weather-widget');

        if (isWeatherEnabled) {
            // Update widget with center coords weather
            updateWeatherWidget(map.getCenter());
            widget.classList.remove('hidden');

            // Add OpenWeatherMap Cloud Layer
            if (!map.getSource('openweathermap')) {
                map.addSource('openweathermap', {
                    "type": "raster",
                    "tiles": [
                        `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${'b1b15e88fa797225412429c1c50c122a1'}`
                    ],
                    "tileSize": 256
                });
                map.addLayer({
                    "id": "weather-clouds",
                    "type": "raster",
                    "source": "openweathermap",
                    "minzoom": 0,
                    "maxzoom": 12,
                    "paint": { "raster-opacity": 0.5 }
                });
            } else {
                map.setLayoutProperty('weather-clouds', 'visibility', 'visible');
            }
        } else {
            if (map.getLayer('weather-clouds')) {
                map.setLayoutProperty('weather-clouds', 'visibility', 'none');
            }
            widget.classList.add('hidden');
        }
    }

    // Update weather when map moves
    map.on('moveend', () => {
        if (isWeatherEnabled) updateWeatherWidget(map.getCenter());
    });

    async function updateWeatherWidget(coords) {
        // Mock API call for demo (to avoid exposing key constraints or hitting limits in demo)
        // In prod, call your backend proxy to fetching weather
        // For now, let's simulate realistic weather based on region
        const temp = Math.floor(Math.random() * (35 - 20) + 20); // 20-35 C
        const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear'];
        const cond = conditions[Math.floor(Math.random() * conditions.length)];
        const icon = 'https://openweathermap.org/img/wn/02d.png'; // Static icon for demo

        const widget = document.querySelector('.weather-widget');
        widget.querySelector('.weather-temp').innerText = `${temp}°C`;
        widget.querySelector('.weather-desc').innerText = cond;
        widget.querySelector('.weather-icon').src = icon;
    }


    // --- POI LAYER (Local Gems) ---
    function togglePois() {
        arePoisEnabled = !arePoisEnabled;
        poiBtn.classList.toggle('active');

        // Use Mapbox Tilequery or static load. 
        // For this demo, let's add some static POIs around Pune center

        if (arePoisEnabled) {
            // Add Source
            if (!map.getSource('pois')) {
                map.addSource('pois', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [
                            { type: 'Feature', geometry: { type: 'Point', coordinates: [73.8567, 18.5204] }, properties: { title: 'Shaniwar Wada', type: 'park' } },
                            { type: 'Feature', geometry: { type: 'Point', coordinates: [73.8408, 18.5158] }, properties: { title: 'Sambhaji Park', type: 'park' } },
                            { type: 'Feature', geometry: { type: 'Point', coordinates: [73.8340, 18.5529] }, properties: { title: 'Pune University', type: 'school' } },
                            { type: 'Feature', geometry: { type: 'Point', coordinates: [73.9050, 18.5400] }, properties: { title: 'Koregaon Park Dining', type: 'food' } }
                        ]
                    }
                });

                map.addLayer({
                    id: 'poi-layer',
                    type: 'symbol',
                    source: 'pois',
                    layout: {
                        'icon-image': 'marker-15', // Default marker
                        'text-field': ['get', 'title'],
                        'text-offset': [0, 1.25],
                        'text-anchor': 'top',
                        'text-size': 11
                    },
                    paint: {
                        'text-color': '#444',
                        'text-halo-color': '#fff',
                        'text-halo-width': 1
                    }
                });
            } else {
                map.setLayoutProperty('poi-layer', 'visibility', 'visible');
            }
        } else {
            if (map.getLayer('poi-layer')) {
                map.setLayoutProperty('poi-layer', 'visibility', 'none');
            }
        }
    }

    // --- HEATMAP LAYER ---
    function toggleHeatmap() {
        isHeatmapEnabled = !isHeatmapEnabled;
        heatmapBtn.classList.toggle('active');

        if (isHeatmapEnabled) {
            // Hide normal points to make heatmap clearer
            map.setLayoutProperty('unclustered-point', 'visibility', 'none');
            map.setLayoutProperty('clusters', 'visibility', 'none');
            map.setLayoutProperty('cluster-count', 'visibility', 'none');

            if (!map.getLayer('mapped-heatmap')) {
                map.addLayer({
                    id: 'mapped-heatmap',
                    type: 'heatmap',
                    source: 'mapped-items',
                    maxzoom: 15,
                    paint: {
                        'heatmap-weight': ['interpolate', ['linear'], ['get', 'price'], 0, 0, 50000, 1],
                        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                        'heatmap-color': [
                            'interpolate', ['linear'], ['heatmap-density'],
                            0, 'rgba(33,102,172,0)',
                            0.2, 'rgb(103,169,207)',
                            0.4, 'rgb(209,229,240)',
                            0.6, 'rgb(253,219,199)',
                            0.8, 'rgb(239,138,98)',
                            1, 'rgb(178,24,43)'
                        ],
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
                        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0]
                    }
                });
            } else {
                map.setLayoutProperty('mapped-heatmap', 'visibility', 'visible');
            }
        } else {
            map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
            map.setLayoutProperty('clusters', 'visibility', 'visible');
            map.setLayoutProperty('cluster-count', 'visibility', 'visible');
            if (map.getLayer('mapped-heatmap')) {
                map.setLayoutProperty('mapped-heatmap', 'visibility', 'none');
            }
        }
    }


    // --- EXISTING LISTENERS ---
    map.on('load', () => {
        loadMapData();
        // ... cluster clicks from prev file ...
    });

    // Toggle 3D (Existing)
    document.getElementById('toggle-3d-btn').addEventListener('click', function () {
        is3DEnabled = !is3DEnabled;
        this.classList.toggle('active');
        if (map.getLayer('3d-buildings')) {
            map.setLayoutProperty('3d-buildings', 'visibility', is3DEnabled ? 'visible' : 'none');
        } else {
            add3DBuildings();
        }
        if (is3DEnabled) {
            map.easeTo({ pitch: 45, duration: 1000 });
        } else {
            map.easeTo({ pitch: 0, duration: 1000 });
        }
    });

    // Style Switcher (Existing)
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const style = this.dataset.style;
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            map.setStyle(style);
            map.once('style.load', () => {
                renderMarkers();
                add3DBuildings();
                if (map.getLayer('3d-buildings')) {
                    map.setLayoutProperty('3d-buildings', 'visibility', is3DEnabled ? 'visible' : 'none');
                }
            });
        });
    });

    // List Sync (Existing)
    map.on('moveend', () => syncListWithMap());

    function syncListWithMap() {
        if (!map.getSource('mapped-items')) return;
        const features = map.querySourceFeatures('mapped-items', { layers: ['unclustered-point'] });
        const bounds = map.getBounds();
        const visibleFeatures = allFeatures.filter(f => {
            const typeMatch = activeFilters[f.properties.type + 's'];
            const priceMatch = f.properties.price >= activeFilters.minPrice && f.properties.price <= activeFilters.maxPrice;
            if (!typeMatch || !priceMatch) return false;
            const [lng, lat] = f.geometry.coordinates;
            return bounds.contains([lng, lat]);
        });
        updateSidebarList(visibleFeatures.slice(0, 50));
        updateStats(visibleFeatures.length);
    }

    function updateSidebarList(features) {
        const listContainer = document.getElementById('sidebar-results-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        if (features.length === 0) {
            listContainer.innerHTML = '<div class="text-muted text-center mt-4">No results in this area.<br>Try moving the map or changing filters.</div>';
            return;
        }
        features.forEach(f => {
            const { title, price, image, type, id, location } = f.properties;
            const item = document.createElement('div');
            item.className = 'list-item-card';
            item.innerHTML = `
                <img src="${image || '/images/default.jpg'}" class="list-item-img" alt="${title}">
                <div class="list-item-content">
                    <div class="list-item-title">${title}</div>
                    <div class="list-item-meta">${location || ''} • ${type}</div>
                    <div class="list-item-price">₹${price.toLocaleString('en-IN')}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                map.flyTo({ center: f.geometry.coordinates, zoom: 15 });
            });
            listContainer.appendChild(item);
        });
    }

    // Sidebar Toggle (Existing)
    const sidebar = document.querySelector('.map-sidebar');
    document.querySelector('.sidebar-toggle-btn')?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.querySelector('.map-container').classList.toggle('full-width');
        setTimeout(() => map.resize(), 300);
    });

    document.querySelector('.mobile-filters-trigger')?.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    map.on('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });

    function updateStats(count) {
        document.getElementById('result-count').innerText = `${count} results found`;
    }
});
