/**
 * Amenities Modal Component
 * Displays all amenities in categorized format
 */

class AmenitiesModal {
  constructor(amenities, categorizedAmenities) {
    this.amenities = amenities || [];
    this.categorizedAmenities = categorizedAmenities || {};
    this.modal = null;
  }

  // Amenity icon mapping
  getIcon(amenityName) {
    const iconMap = {
      // Essentials
      'wifi': 'fas fa-wifi',
      'kitchen': 'fas fa-utensils',
      'washer': 'fas fa-tshirt',
      'dryer': 'fas fa-wind',
      'air conditioning': 'fas fa-snowflake',
      'heating': 'fas fa-fire',
      'workspace': 'fas fa-laptop',
      'tv': 'fas fa-tv',
      'hair dryer': 'fas fa-wind',
      'iron': 'fas fa-tshirt',

      // Safety
      'smoke alarm': 'fas fa-bell',
      'carbon monoxide alarm': 'fas fa-exclamation-triangle',
      'first aid kit': 'fas fa-first-aid',
      'fire extinguisher': 'fas fa-fire-extinguisher',
      'security cameras': 'fas fa-video',
      'lock': 'fas fa-lock',

      // Kitchen
      'refrigerator': 'fas fa-temperature-low',
      'microwave': 'fas fa-microwave',
      'coffee maker': 'fas fa-coffee',
      'dishes': 'fas fa-utensils',
      'dishwasher': 'fas fa-sink',
      'stove': 'fas fa-fire',
      'oven': 'fas fa-oven',

      // Entertainment
      'cable': 'fas fa-tv',
      'netflix': 'fab fa-netflix',
      'amazon prime': 'fab fa-amazon',
      'games': 'fas fa-chess',
      'books': 'fas fa-book',
      'sound system': 'fas fa-volume-up',
      'piano': 'fas fa-music',
      'exercise': 'fas fa-dumbbell',

      // Outdoor
      'balcony': 'fas fa-building',
      'garden': 'fas fa-leaf',
      'bbq': 'fas fa-fire',
      'outdoor furniture': 'fas fa-chair',
      'patio': 'fas fa-home',
      'pool': 'fas fa-swimming-pool',
      'hot tub': 'fas fa-hot-tub',
      'beach': 'fas fa-umbrella-beach',

      // Bathroom
      'shampoo': 'fas fa-pump-soap',
      'conditioner': 'fas fa-pump-soap',
      'body soap': 'fas fa-soap',
      'hot water': 'fas fa-temperature-high',
      'bathtub': 'fas fa-bath',
      'shower': 'fas fa-shower',

      // Parking
      'parking': 'fas fa-parking',
      'garage': 'fas fa-warehouse',
      'ev charger': 'fas fa-charging-station',

      // Services
      'breakfast': 'fas fa-coffee',
      'cleaning': 'fas fa-broom',
      'luggage': 'fas fa-suitcase',
      'self check-in': 'fas fa-key',
      '24-hour check-in': 'fas fa-clock'
    };

    const normalized = amenityName.toLowerCase();
    for (const key in iconMap) {
      if (normalized.includes(key)) {
        return iconMap[key];
      }
    }

    return 'fas fa-check-circle';
  }

  renderTopAmenities(count = 8) {
    const topAmenities = this.amenities.slice(0, count);
    return topAmenities.map(amenity => `
      <div class="amenity-item">
        <i class="amenity-icon ${this.getIcon(amenity)}"></i>
        <span>${amenity}</span>
      </div>
    `).join('');
  }

  renderModal() {
    const categories = {
      'Essentials': ['WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 'Dedicated workspace', 'TV', 'Hair dryer', 'Iron'],
      'Safety': ['Smoke alarm', 'Carbon monoxide alarm', 'First aid kit', 'Fire extinguisher', 'Security cameras', 'Lock on bedroom door'],
      'Kitchen & Dining': ['Refrigerator', 'Microwave', 'Coffee maker', 'Dishes and silverware', 'Dishwasher', 'Stove', 'Oven', 'Cooking basics'],
      'Entertainment': ['TV with cable', 'Netflix', 'Amazon Prime', 'Board games', 'Books', 'Sound system', 'Piano', 'Exercise equipment'],
      'Outdoor': ['Balcony', 'Garden', 'BBQ grill', 'Outdoor furniture', 'Patio', 'Pool', 'Hot tub', 'Beach access'],
      'Bathroom': ['Shampoo', 'Conditioner', 'Body soap', 'Hot water', 'Bathtub', 'Shower gel'],
      'Parking & Facilities': ['Free parking', 'Garage', 'EV charger'],
      'Services': ['Breakfast', 'Cleaning', 'Long term stays', 'Luggage dropoff', 'Self check-in', '24-hour check-in']
    };

    const modalHTML = `
      <div class="amenities-modal-premium" id="amenities-modal">
        <div class="amenities-modal-content-premium">
          <div class="modal-header-premium">
            <button class="modal-back-btn" id="close-amenities-modal">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h2 class="modal-title-premium">What this place offers</h2>
          </div>
          
          <div class="modal-scroll-area">
            ${Object.entries(categories).map(([category, items]) => {
      const availableItems = items.filter(item =>
        this.amenities.some(a => a.toLowerCase().includes(item.toLowerCase()))
      );

      if (availableItems.length === 0) return '';

      return `
                  <div class="amenities-category-premium">
                    <h3 class="category-title-premium">${category}</h3>
                    <div class="category-grid-premium">
                      ${availableItems.map(item => `
                        <div class="amenity-item-premium">
                          <i class="amenity-icon-p ${this.getIcon(item)}"></i>
                          <span class="amenity-text-p">${item}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
    }).join('')}
          </div>
        </div>
      </div>
    `;

    return modalHTML;
  }

  open() {
    // Create modal if it doesn't exist
    if (!document.getElementById('amenities-modal')) {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = this.renderModal();
      document.body.appendChild(modalContainer.firstElementChild);

      // Attach event listeners
      const closeBtn = document.getElementById('close-amenities-modal');
      const modal = document.getElementById('amenities-modal');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.close();
        });
      }

      // Keyboard support
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }

    const modal = document.getElementById('amenities-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    const modal = document.getElementById('amenities-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AmenitiesModal;
}
