class MapSearchLocation {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    this.options = {
      placeholder: 'Search location...',
      popularLocations: [
        { name: 'Mumbai Airport', icon: '✈️', coords: [72.8679, 19.0896] },
        { name: 'Pune Railway Station', icon: '🚂', coords: [73.8567, 18.5294] },
        { name: 'Lonavala', icon: '🏔️', coords: [73.4084, 18.7546] },
        { name: 'Mahabaleshwar', icon: '🌲', coords: [73.6588, 17.9249] },
        { name: 'Shirdi', icon: '🙏', coords: [74.4797, 19.7680] },
        { name: 'Gateway of India', icon: '🏛️', coords: [72.8347, 18.9220] },
        { name: 'Marine Drive', icon: '🌊', coords: [72.8209, 18.9440] },
        { name: 'Khandala', icon: '⛰️', coords: [73.3270, 18.7516] }
      ],
      onLocationSelect: (location) => {
        console.log('Location selected:', location);
      },
      onSearch: (query) => {
        console.log('Searching for:', query);
      },
      ...options
    };

    this.searchResults = [];
    this.isLoading = false;
    this.debounceTimer = null;

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="map-search-container">
        <div class="search-wrapper">
          <div class="search-tooltip">Search for a location</div>
          <input 
            type="text" 
            class="search-input" 
            placeholder="${this.options.placeholder}"
            autocomplete="off"
          >
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <div class="search-results"></div>
        </div>

        <div class="popular-searches">
          <h3>Popular searches</h3>
          <div class="location-grid">
            ${this.options.popularLocations.map(location => `
              <button class="location-btn" data-location='${JSON.stringify(location)}'>
                <div class="location-icon">${location.icon}</div>
                <span>${location.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.searchInput = this.container.querySelector('.search-input');
    this.searchResultsContainer = this.container.querySelector('.search-results');
    this.locationButtons = this.container.querySelectorAll('.location-btn');
  }

  attachEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim()) {
        this.showSearchResults();
      }
    });

    // Click outside to close results
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideSearchResults();
      }
    });

    // Location button clicks
    this.locationButtons.forEach(button => {
      button.addEventListener('click', () => {
        const location = JSON.parse(button.dataset.location);
        this.selectLocation(location);
      });
    });

    // Keyboard navigation
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });
  }

  handleSearch(query) {
    clearTimeout(this.debounceTimer);
    
    if (!query.trim()) {
      this.hideSearchResults();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  async performSearch(query) {
    this.setLoading(true);
    
    try {
      // Call the search callback
      await this.options.onSearch(query);
      
      // Simulate search results (replace with actual API call)
      const mockResults = this.getMockSearchResults(query);
      this.displaySearchResults(mockResults);
      
    } catch (error) {
      console.error('Search error:', error);
      this.displayError('Search failed. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  getMockSearchResults(query) {
    const allLocations = [
      { name: 'Mumbai Airport', subtitle: 'Chhatrapati Shivaji Maharaj International Airport', coords: [72.8679, 19.0896] },
      { name: 'Pune Railway Station', subtitle: 'Pune Junction Railway Station', coords: [73.8567, 18.5294] },
      { name: 'Lonavala Hill Station', subtitle: 'Popular hill station near Mumbai-Pune', coords: [73.4084, 18.7546] },
      { name: 'Mahabaleshwar', subtitle: 'Hill station in Western Ghats', coords: [73.6588, 17.9249] },
      { name: 'Shirdi Temple', subtitle: 'Sai Baba Temple', coords: [74.4797, 19.7680] },
      { name: 'Gateway of India', subtitle: 'Historic monument in Mumbai', coords: [72.8347, 18.9220] },
      { name: 'Marine Drive', subtitle: 'Queen\'s Necklace, Mumbai', coords: [72.8209, 18.9440] },
      { name: 'Khandala', subtitle: 'Hill station near Lonavala', coords: [73.3270, 18.7516] }
    ];

    return allLocations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.subtitle.toLowerCase().includes(query.toLowerCase())
    );
  }

  displaySearchResults(results) {
    this.searchResults = results;
    
    if (results.length === 0) {
      this.searchResultsContainer.innerHTML = `
        <div class="search-result-item">
          <span class="search-result-text">No locations found</span>
        </div>
      `;
    } else {
      this.searchResultsContainer.innerHTML = results.map((result, index) => `
        <div class="search-result-item" data-index="${index}">
          <svg class="search-result-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <div class="search-result-text">
            <div>${result.name}</div>
            <div class="search-result-subtitle">${result.subtitle}</div>
          </div>
        </div>
      `).join('');

      // Add click handlers to search results
      this.searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          this.selectLocation(this.searchResults[index]);
        });
      });
    }

    this.showSearchResults();
  }

  displayError(message) {
    this.searchResultsContainer.innerHTML = `
      <div class="search-result-item">
        <span class="search-result-text" style="color: #ff6b6b;">${message}</span>
      </div>
    `;
    this.showSearchResults();
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    if (loading) {
      this.searchResultsContainer.innerHTML = `
        <div class="search-loading">Searching</div>
      `;
      this.showSearchResults();
    }
  }

  showSearchResults() {
    this.searchResultsContainer.classList.add('active');
  }

  hideSearchResults() {
    this.searchResultsContainer.classList.remove('active');
  }

  selectLocation(location) {
    this.searchInput.value = location.name;
    this.hideSearchResults();
    
    // Call the location select callback
    this.options.onLocationSelect(location);
    
    // Add visual feedback
    this.animateSelection();
  }

  animateSelection() {
    this.searchInput.style.borderColor = '#28a745';
    this.searchInput.style.boxShadow = '0 0 0 4px rgba(40, 167, 69, 0.1)';
    
    setTimeout(() => {
      this.searchInput.style.borderColor = '';
      this.searchInput.style.boxShadow = '';
    }, 1500);
  }

  handleKeyNavigation(e) {
    const items = this.searchResultsContainer.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    let currentIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains('selected')) {
        currentIndex = index;
      }
    });

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        this.highlightResult(items, currentIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        this.highlightResult(items, currentIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && this.searchResults[currentIndex]) {
          this.selectLocation(this.searchResults[currentIndex]);
        }
        break;
        
      case 'Escape':
        this.hideSearchResults();
        this.searchInput.blur();
        break;
    }
  }

  highlightResult(items, index) {
    items.forEach(item => item.classList.remove('selected'));
    if (items[index]) {
      items[index].classList.add('selected');
      items[index].style.background = '#f8f9fa';
    }
  }

  // Public methods
  setValue(value) {
    this.searchInput.value = value;
  }

  getValue() {
    return this.searchInput.value;
  }

  clear() {
    this.searchInput.value = '';
    this.hideSearchResults();
  }

  focus() {
    this.searchInput.focus();
  }

  destroy() {
    clearTimeout(this.debounceTimer);
    document.removeEventListener('click', this.handleOutsideClick);
    this.container.innerHTML = '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapSearchLocation;
} else if (typeof window !== 'undefined') {
  window.MapSearchLocation = MapSearchLocation;
}
