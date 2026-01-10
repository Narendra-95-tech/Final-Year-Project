/**
 * Map-Based Listings View
 * Display listings directly on the map with interactive cards and filtering
 */

class MapListingsView {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.mapToken = options.mapToken;
    this.listings = options.listings || [];
    this.listingType = options.listingType || 'listings'; // listings, vehicles, dhabas
    this.map = null;
    this.markers = new Map();
    this.selectedMarker = null;
    this.filterOptions = options.filterOptions || {};
    this.onListingSelect = options.onListingSelect || null;

    this.markerColors = {
      listings: 'red',
      vehicles: 'green',
      dhabas: 'orange'
    };

    this.init();
    console.log('MapListingsView initialized with:', this.listings.length, 'listings');
  }

  init() {
    if (!this.mapToken) {
      console.error('Mapbox token is required');
      return;
    }

    mapboxgl.accessToken = this.mapToken;

    // Create container structure
    this.createContainer();

    // Initialize map
    this.initializeMap();

    // Add listings to map
    this.addListingsToMap();

    // Setup event listeners
    this.setupEventListeners();
  }

  createContainer() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="map-listings-container">
        <!-- Left Sidebar: Listings List -->
        <div class="listings-sidebar glass-sidebar">
          <div class="listings-header-premium">
            <div class="header-top">
              <h3 class="premium-title">${this.listingType.charAt(0).toUpperCase() + this.listingType.slice(1)}</h3>
              <div class="header-badge">Live</div>
            </div>
            
            <div class="premium-search-container">
              <i class="fas fa-search"></i>
              <input type="text" id="listings-search" placeholder="Search ${this.listingType}..." class="premium-search-input">
              <div id="sidebar-search-clear" class="search-clear-btn" style="display: none;">
                <i class="fas fa-times"></i>
              </div>
            </div>

            <div class="premium-filters">
              <div class="filter-select-wrapper">
                <i class="fas fa-star star-3d"></i>
                <select id="listings-sort" class="premium-select">
                  <option value="rating">Rating</option>
                  <option value="price-low">Price: Low</option>
                  <option value="price-high">Price: High</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <button class="filter-icon-btn" title="Advanced Filters">
                <i class="fas fa-sliders-h"></i>
              </button>
            </div>
          </div>
          
          <div class="listings-list" id="listings-list">
            <!-- Listings will be populated here -->
          </div>
        </div>

        <!-- Right Side: Map -->
        <div class="map-container">
          <!-- Premium Search Bar -->
          <div class="map-search-overlay">
            <div class="search-box-premium">
              <i class="fas fa-search search-icon-p"></i>
              <input type="text" id="map-location-search" placeholder="Search location..." autocomplete="off">
              <div id="search-clear" class="search-clear-btn" style="display: none;">
                <i class="fas fa-times"></i>
              </div>
            </div>
            <div id="search-results-overlay" class="search-results-premium" style="display: none;"></div>
          </div>

          <div id="map" style="width: 100%; height: 100%;"></div>
          
          <!-- Listing Card Popup -->
          <div class="listing-card-popup" id="listing-popup">
            <div class="popup-header">
              <h4 id="popup-title"></h4>
              <button id="popup-close" class="popup-close">✕</button>
            </div>
            <div class="popup-content">
              <img id="popup-image" src="" alt="listing" class="popup-image">
              <div class="popup-info">
                <p id="popup-location" class="popup-location"></p>
                <p id="popup-price" class="popup-price"></p>
                <div class="popup-rating">
                  <span id="popup-rating" class="rating-stars"></span>
                  <span id="popup-reviews" class="review-count"></span>
                </div>
                <p id="popup-description" class="popup-description"></p>
              </div>
            </div>
            <div class="popup-footer">
              <button id="popup-view" class="btn-primary">View Details</button>
              <button id="popup-directions" class="btn-secondary">Get Directions</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Calculate center from listings
    const center = this.calculateCenter();

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Add map controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');
    this.map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Setup map event listeners
    this.map.on('load', () => {
      console.log('Map loaded');
      // Add tooltips to controls after map loads
      this.addControlTooltips();
    });
  }

  calculateCenter() {
    if (this.listings.length === 0) {
      return [75.93, 19.85]; // Default center
    }

    let totalLng = 0, totalLat = 0;
    this.listings.forEach(listing => {
      if (listing.geometry && listing.geometry.coordinates) {
        totalLng += listing.geometry.coordinates[0];
        totalLat += listing.geometry.coordinates[1];
      }
    });

    return [
      totalLng / this.listings.length,
      totalLat / this.listings.length
    ];
  }

  addListingsToMap() {
    this.listings.forEach((listing, index) => {
      if (!listing.geometry || !listing.geometry.coordinates) return;

      const coords = listing.geometry.coordinates;
      const markerId = `listing-${index}`;

      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = `map-marker marker-${this.listingType}`;
      markerEl.innerHTML = `
        <div class="marker-content">
          <span class="marker-price">₹${this.formatPrice(listing.price)}</span>
        </div>
      `;

      // Add markers with staggered animation
      const delay = (index % 20) * 0.05;
      markerEl.style.animation = `cinematicMarkerEntry 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s forwards`;
      markerEl.style.opacity = '0';
      markerEl.style.transform = 'scale(0)';

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat(coords)
        .addTo(this.map);

      this.markers.set(markerId, {
        marker: marker,
        listing: listing,
        element: markerEl
      });

      // Add click event
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectListing(markerId, listing);
      });

      // Add hover events for preview
      markerEl.addEventListener('mouseenter', () => {
        this.showHoverPreview(marker, listing);
      });

      markerEl.addEventListener('mouseleave', () => {
        this.hideHoverPreview();
      });
    });

    // Fit bounds to all markers
    this.fitBoundsToMarkers();
  }

  fitBoundsToMarkers() {
    if (this.markers.size === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach(({ listing }) => {
      if (listing.geometry && listing.geometry.coordinates) {
        bounds.extend(listing.geometry.coordinates);
      }
    });

    this.map.fitBounds(bounds, { padding: 100 });
  }

  selectListing(markerId, listing) {
    // Remove previous selection
    if (this.selectedMarker) {
      const prevMarker = this.markers.get(this.selectedMarker);
      if (prevMarker) {
        prevMarker.element.classList.remove('marker-selected');
      }
    }

    // Select new marker
    this.selectedMarker = markerId;
    const markerData = this.markers.get(markerId);
    if (markerData) {
      markerData.element.classList.add('marker-selected');
    }

    // Show popup
    this.showListingPopup(listing);

    // Highlight in sidebar
    this.highlightInSidebar(markerId);

    // Callback
    if (this.onListingSelect) {
      this.onListingSelect(listing);
    }
  }

  showListingPopup(listing) {
    const popup = document.getElementById('listing-popup');
    if (!popup) return;

    // Populate popup
    document.getElementById('popup-title').textContent = listing.title;
    document.getElementById('popup-location').textContent = `📍 ${listing.location}`;
    document.getElementById('popup-price').textContent = `₹${this.formatPrice(listing.price)}`;
    document.getElementById('popup-image').src = listing.image?.url || 'https://via.placeholder.com/300x200';
    document.getElementById('popup-description').textContent = listing.description?.substring(0, 100) + '...';

    // Rating
    const ratingStars = this.generateStars(listing.rating || 4);
    document.getElementById('popup-rating').innerHTML = ratingStars;
    document.getElementById('popup-reviews').textContent = `(${listing.reviews?.length || 0} reviews)`;

    // Show popup
    popup.classList.add('show');

    // Setup buttons
    document.getElementById('popup-view').onclick = () => {
      window.location.href = `/listings/${listing._id}`;
    };

    document.getElementById('popup-directions').onclick = () => {
      const coords = listing.geometry.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`);
    };

    document.getElementById('popup-close').onclick = () => {
      popup.classList.remove('show');
    };
  }

  highlightInSidebar(markerId) {
    // Remove previous highlight
    document.querySelectorAll('.listing-item').forEach(item => {
      item.classList.remove('active');
    });

    // Highlight current
    const item = document.querySelector(`[data-marker-id="${markerId}"]`);
    if (item) {
      item.classList.add('active');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderListingsList() {
    const listingsList = document.getElementById('listings-list');
    console.log('Rendering listings list, container found:', !!listingsList);
    if (!listingsList) return;

    console.log('Rendering', this.listings.length, 'listings in sidebar');
    listingsList.innerHTML = '';

    if (this.listings.length === 0) {
      listingsList.innerHTML = `
        <div class="no-listings-premium">
          <div class="no-listings-icon">
            <i class="fas fa-search-location"></i>
          </div>
          <h4>No results found</h4>
          <p>We couldn't find any ${this.listingType} in this area. Try adjusting your filters or moving the map.</p>
          <button class="reset-view-btn" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i> Refresh Page
          </button>
        </div>
      `;
      return;
    }

    try {
      this.listings.forEach((listing, index) => {
        const markerId = `listing-${index}`;
        const item = document.createElement('div');
        item.className = 'listing-item';
        item.setAttribute('data-marker-id', markerId);

        const delay = (index % 10) * 0.1;
        item.style.animationDelay = `${delay}s`;

        const rating = listing.rating || 4;
        const stars = this.generateStars(rating);

        item.innerHTML = `
          <div class="listing-item-image">
            <img src="${listing.image?.url || 'https://via.placeholder.com/150x100'}" alt="${listing.title}">
            <span class="listing-item-price">₹${this.formatPrice(listing.price)}</span>
          </div>
          <div class="listing-item-content">
            <h4 class="listing-item-title">${listing.title}</h4>
            <p class="listing-item-location">📍 ${listing.location}</p>
            <div class="listing-item-rating">
              ${stars}
              <span class="rating-text">${rating.toFixed(1)}</span>
            </div>
            <p class="listing-item-description">${listing.description?.substring(0, 60)}...</p>
          </div>
        `;

        item.addEventListener('click', () => {
          this.selectListing(markerId, listing);
          // Fly to marker
          const coords = listing.geometry.coordinates;
          this.map.flyTo({
            center: coords,
            zoom: 15,
            duration: 1000
          });
        });

        listingsList.appendChild(item);
      });
      console.log('Successfully rendered', this.listings.length, 'listing items');
    } catch (err) {
      console.error('Error rendering listings list:', err);
      listingsList.innerHTML = `<div class="p-4 text-danger">Error loading listings: ${err.message}</div>`;
    }
  }

  setupEventListeners() {
    // Sidebar Search
    const searchInput = document.getElementById('listings-search');
    const sidebarClearBtn = document.getElementById('sidebar-search-clear');

    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (sidebarClearBtn) {
          sidebarClearBtn.style.display = query ? 'flex' : 'none';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.filterListings(query);
        }, 300);
      });
    }

    if (sidebarClearBtn && searchInput) {
      sidebarClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        sidebarClearBtn.style.display = 'none';
        this.filterListings('');
        searchInput.focus();
      });
    }

    // Sort
    const sortSelect = document.getElementById('listings-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => this.sortListings(e.target.value));
    }

    // Render listings list
    this.renderListingsList();

    // Search as I move
    this.map.on('moveend', () => {
      this.handleSearchAsIMove();
    });

    // Location Geocoder Search
    const locationSearchInput = document.getElementById('map-location-search');
    const searchResultsOverlay = document.getElementById('search-results-overlay');
    const searchClearBtn = document.getElementById('search-clear');

    if (locationSearchInput) {
      let debounceTimer;
      locationSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        searchClearBtn.style.display = query ? 'flex' : 'none';

        clearTimeout(debounceTimer);
        if (!query) {
          searchResultsOverlay.style.display = 'none';
          return;
        }

        debounceTimer = setTimeout(() => {
          this.performGeocodeSearch(query, searchResultsOverlay);
        }, 400);
      });

      locationSearchInput.addEventListener('focus', () => {
        if (locationSearchInput.value.trim()) {
          searchResultsOverlay.style.display = 'block';
        }
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        locationSearchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchResultsOverlay.style.display = 'none';
        locationSearchInput.focus();
      });
    }

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
      const searchOverlay = document.querySelector('.map-search-overlay');
      if (searchOverlay && !searchOverlay.contains(e.target)) {
        searchResultsOverlay.style.display = 'none';
      }
    });
  }

  async performGeocodeSearch(query, resultsContainer) {
    resultsContainer.innerHTML = '<div class="search-loading-p"><i class="fas fa-spinner fa-spin"></i> Finding location...</div>';
    resultsContainer.style.display = 'block';

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.mapToken}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        resultsContainer.innerHTML = data.features.map(feature => `
          <div class="search-result-item-p" data-coords='${JSON.stringify(feature.center)}' data-name="${feature.place_name}">
            <i class="fas fa-map-marker-alt"></i>
            <div class="result-text-p">
              <div class="result-name-p">${feature.text}</div>
              <div class="result-address-p">${feature.place_name}</div>
            </div>
          </div>
        `).join('');

        // Add result click listeners
        resultsContainer.querySelectorAll('.search-result-item-p').forEach(item => {
          item.addEventListener('click', () => {
            const coords = JSON.parse(item.dataset.coords);
            const name = item.dataset.name;
            const shortName = item.querySelector('.result-name-p').textContent;
            this.handleLocationSelected(coords, name);
            resultsContainer.style.display = 'none';
            document.getElementById('map-location-search').value = shortName;
          });
        });
      } else {
        resultsContainer.innerHTML = '<div class="search-no-results-p">No locations found</div>';
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      resultsContainer.innerHTML = '<div class="search-error-p">Error finding location</div>';
    }
  }

  handleLocationSelected(coords, name) {
    // Add a temporary highlight marker
    if (this.searchMarker) this.searchMarker.remove();

    this.searchMarker = new mapboxgl.Marker({ color: '#ff385c', scale: 1.2 })
      .setLngLat(coords)
      .addTo(this.map);

    // Fly to the location
    this.map.flyTo({
      center: coords,
      zoom: 14,
      speed: 1.5,
      curve: 1,
      essential: true
    });

    // Optionally show a popup
    new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setLngLat(coords)
      .setHTML(`<div style="padding: 5px; font-weight: 600;">${name.split(',')[0]}</div>`)
      .addTo(this.map);
  }

  handleSearchAsIMove() {
    const bounds = this.map.getBounds();
    const visibleListings = this.listings.filter(listing => {
      if (!listing.geometry || !listing.geometry.coordinates) return false;
      const [lng, lat] = listing.geometry.coordinates;
      return lng >= bounds.getWest() && lng <= bounds.getEast() &&
        lat >= bounds.getSouth() && lat <= bounds.getNorth();
    });

    this.updateListingsList(visibleListings);
    this.updateMarkersSearchMove(visibleListings);
  }

  updateMarkersSearchMove(visibleListings) {
    const visibleIds = new Set(visibleListings.map(l => l._id));
    this.markers.forEach((data, id) => {
      const isVisible = visibleIds.has(data.listing._id);
      data.element.style.opacity = isVisible ? '1' : '0.3';
      data.element.style.pointerEvents = isVisible ? 'auto' : 'none';
    });
  }

  showHoverPreview(marker, listing) {
    this.hideHoverPreview();

    const popupNode = document.createElement('div');
    popupNode.className = 'map-hover-preview';
    popupNode.innerHTML = `
      <div class="preview-card-p">
        <img src="${listing.image?.url || 'https://via.placeholder.com/150x100'}" class="preview-img-p">
        <div class="preview-info-p">
          <div class="preview-title-p">${listing.title}</div>
          <div class="preview-meta-p">
            <span>⭐ ${listing.rating || '4.8'}</span>
            <span>₹${this.formatPrice(listing.price)}</span>
          </div>
        </div>
      </div>
    `;

    this.hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      maxWidth: '200px',
      className: 'premium-preview-popup'
    })
      .setLngLat(listing.geometry.coordinates)
      .setDOMContent(popupNode)
      .addTo(this.map);
  }

  hideHoverPreview() {
    if (this.hoverPopup) {
      this.hoverPopup.remove();
      this.hoverPopup = null;
    }
  }

  filterListings(query) {
    const filtered = this.listings.filter(listing =>
      listing.title.toLowerCase().includes(query.toLowerCase()) ||
      listing.location.toLowerCase().includes(query.toLowerCase())
    );

    this.updateMarkersVisibility(filtered);
    this.updateListingsList(filtered);
  }

  sortListings(sortBy) {
    const sorted = [...this.listings];

    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'distance':
        // Sort by distance from center
        const center = this.map.getCenter();
        sorted.sort((a, b) => {
          const distA = this.calculateDistance(center.lat, center.lng, a.geometry.coordinates[1], a.geometry.coordinates[0]);
          const distB = this.calculateDistance(center.lat, center.lng, b.geometry.coordinates[1], b.geometry.coordinates[0]);
          return distA - distB;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    this.listings = sorted;
    this.renderListingsList();
  }

  updateMarkersVisibility(visibleListings) {
    const visibleIds = new Set(visibleListings.map(l => l._id || l.title));

    this.markers.forEach((data, markerId) => {
      const id = data.listing._id || data.listing.title;
      const isVisible = visibleIds.has(id);
      data.element.style.display = isVisible ? 'block' : 'none';

      // Also hide popup if marker becomes hidden
      if (!isVisible && this.selectedMarker === markerId) {
        const popup = document.getElementById('listing-popup');
        if (popup) popup.style.display = 'none';
      }
    });
  }

  updateListingsList(listings) {
    const listingsList = document.getElementById('listings-list');
    if (!listingsList) return;

    listingsList.innerHTML = '';

    listings.forEach((listing, index) => {
      const item = document.createElement('div');
      item.className = 'listing-item';

      const delay = (index % 10) * 0.1;
      item.style.animationDelay = `${delay}s`;

      const rating = listing.rating || 4;
      const stars = this.generateStars(rating);

      item.innerHTML = `
        <div class="listing-item-image">
          <img src="${listing.image?.url || 'https://via.placeholder.com/150x100'}" alt="${listing.title}">
          <span class="listing-item-price">₹${this.formatPrice(listing.price)}</span>
        </div>
        <div class="listing-item-content">
          <h4 class="listing-item-title">${listing.title}</h4>
          <p class="listing-item-location">📍 ${listing.location}</p>
          <div class="listing-item-rating">
            ${stars}
            <span class="rating-text">${rating.toFixed(1)}</span>
          </div>
          <p class="listing-item-description">${listing.description?.substring(0, 60)}...</p>
        </div>
      `;

      item.addEventListener('click', () => {
        this.selectListing(`listing-${this.listings.indexOf(listing)}`, listing);
      });

      listingsList.appendChild(item);
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  generateStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) {
        stars += '⭐';
      } else if (i < rating) {
        stars += '⭐';
      } else {
        stars += '☆';
      }
    }
    return stars;
  }

  formatPrice(price) {
    return price.toLocaleString('en-IN');
  }

  addControlTooltips() {
    // Wait for controls to be added
    setTimeout(() => {
      this.addIconsToNavigationControls();
      this.addIconsToFullscreenControl();
      this.addTooltipsToNavigationControls();
      this.addTooltipsToFullscreenControl();
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

  destroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapListingsView;
}
