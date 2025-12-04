// ===== VEHICLE RENTALS SYSTEM =====

class VehicleBookingSystem {
  constructor(pricePerDay = 0, pricePerHour = 0) {
    this.pricePerDay = pricePerDay;
    this.pricePerHour = pricePerHour;
    this.startDate = null;
    this.endDate = null;
    this.startTime = null;
    this.endTime = null;
    this.rentalType = 'daily'; // 'daily' or 'hourly'
    this.taxRate = 0.18; // 18% GST
    this.securityDeposit = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setMinDates();
  }

  setupEventListeners() {
    // Date pickers
    const startDateInput = document.getElementById('vehicle-start-date');
    const endDateInput = document.getElementById('vehicle-end-date');
    const startTimeInput = document.getElementById('vehicle-start-time');
    const endTimeInput = document.getElementById('vehicle-end-time');
    
    if (startDateInput) {
      startDateInput.addEventListener('change', (e) => {
        this.startDate = new Date(e.target.value);
        this.updatePriceCalculation();
      });
    }

    if (endDateInput) {
      endDateInput.addEventListener('change', (e) => {
        this.endDate = new Date(e.target.value);
        this.updatePriceCalculation();
      });
    }

    if (startTimeInput) {
      startTimeInput.addEventListener('change', (e) => {
        this.startTime = e.target.value;
        this.updatePriceCalculation();
      });
    }

    if (endTimeInput) {
      endTimeInput.addEventListener('change', (e) => {
        this.endTime = e.target.value;
        this.updatePriceCalculation();
      });
    }

    // Rental type toggle
    const rentalTypeInputs = document.querySelectorAll('input[name="rentalType"]');
    rentalTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.rentalType = e.target.value;
        this.updatePriceCalculation();
      });
    });
  }

  setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('vehicle-start-date');
    
    if (startDateInput) {
      startDateInput.setAttribute('min', today);
    }
  }

  calculateDays() {
    if (!this.startDate || !this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // Minimum 1 day
  }

  calculateHours() {
    if (!this.startTime || !this.endTime) return 0;
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const diffMinutes = endMinutes - startMinutes;
    return Math.ceil(diffMinutes / 60);
  }

  calculateSubtotal() {
    if (this.rentalType === 'daily') {
      const days = this.calculateDays();
      return this.pricePerDay * days;
    } else {
      const hours = this.calculateHours();
      return this.pricePerHour * hours;
    }
  }

  calculateTax() {
    const subtotal = this.calculateSubtotal();
    return subtotal * this.taxRate;
  }

  calculateTotal() {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    return subtotal + tax + this.securityDeposit;
  }

  updatePriceCalculation() {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const total = this.calculateTotal();

    const priceDisplay = document.getElementById('vehicle-price-display');
    if (priceDisplay && subtotal > 0) {
      const duration = this.rentalType === 'daily' 
        ? `${this.calculateDays()} day${this.calculateDays() > 1 ? 's' : ''}`
        : `${this.calculateHours()} hour${this.calculateHours() > 1 ? 's' : ''}`;

      priceDisplay.innerHTML = `
        <div class="price-breakdown">
          <div class="price-row">
            <span class="price-label">Rental (${duration})</span>
            <span class="price-value">₹${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="price-row">
            <span class="price-label">GST (18%)</span>
            <span class="price-value">₹${tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          ${this.securityDeposit > 0 ? `
          <div class="price-row">
            <span class="price-label">Security Deposit (Refundable)</span>
            <span class="price-value">₹${this.securityDeposit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          ` : ''}
          <div class="price-row total">
            <span>Total Amount</span>
            <span>₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      `;
    }
  }

  validateBooking() {
    if (!this.startDate || !this.endDate) {
      return { valid: false, message: 'Please select pickup and return dates' };
    }

    if (this.endDate <= this.startDate) {
      return { valid: false, message: 'Return date must be after pickup date' };
    }

    if (this.rentalType === 'hourly' && (!this.startTime || !this.endTime)) {
      return { valid: false, message: 'Please select pickup and return times' };
    }

    return { valid: true };
  }

  getBookingData() {
    return {
      startDate: this.startDate ? this.startDate.toISOString().split('T')[0] : null,
      endDate: this.endDate ? this.endDate.toISOString().split('T')[0] : null,
      startTime: this.startTime,
      endTime: this.endTime,
      rentalType: this.rentalType,
      totalPrice: this.calculateTotal(),
      duration: this.rentalType === 'daily' ? this.calculateDays() : this.calculateHours()
    };
  }
}

// ===== VEHICLE COMPARISON SYSTEM =====

class VehicleCompareSystem {
  constructor() {
    this.selectedVehicles = [];
    this.maxCompare = 3;
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    // Compare checkboxes
    document.querySelectorAll('.compare-checkbox input').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const vehicleId = e.target.dataset.vehicleId;
        if (e.target.checked) {
          this.addVehicle(vehicleId);
        } else {
          this.removeVehicle(vehicleId);
        }
      });
    });

    // Compare button
    const compareBtn = document.getElementById('btn-compare-vehicles');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => this.showCompareModal());
    }

    // Clear compare
    const clearBtn = document.getElementById('btn-clear-compare');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }

    // Close modal
    const closeBtn = document.getElementById('close-compare-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideCompareModal());
    }
  }

  addVehicle(vehicleId) {
    if (this.selectedVehicles.length >= this.maxCompare) {
      alert(`You can only compare up to ${this.maxCompare} vehicles at a time`);
      // Uncheck the checkbox
      const checkbox = document.querySelector(`input[data-vehicle-id="${vehicleId}"]`);
      if (checkbox) checkbox.checked = false;
      return;
    }

    if (!this.selectedVehicles.includes(vehicleId)) {
      this.selectedVehicles.push(vehicleId);
      this.saveToStorage();
      this.updateUI();
      showNotification('Vehicle added to comparison', 'success');
    }
  }

  removeVehicle(vehicleId) {
    this.selectedVehicles = this.selectedVehicles.filter(id => id !== vehicleId);
    this.saveToStorage();
    this.updateUI();
    showNotification('Vehicle removed from comparison', 'info');
  }

  clearAll() {
    this.selectedVehicles = [];
    this.saveToStorage();
    this.updateUI();
    
    // Uncheck all checkboxes
    document.querySelectorAll('.compare-checkbox input').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    showNotification('Comparison cleared', 'info');
  }

  updateUI() {
    const compareBar = document.getElementById('compare-bar');
    const compareCount = document.getElementById('compare-count');
    
    if (compareBar && compareCount) {
      if (this.selectedVehicles.length > 0) {
        compareBar.classList.add('active');
        compareCount.textContent = this.selectedVehicles.length;
      } else {
        compareBar.classList.remove('active');
      }
    }

    // Update checkboxes based on storage
    document.querySelectorAll('.compare-checkbox input').forEach(checkbox => {
      const vehicleId = checkbox.dataset.vehicleId;
      checkbox.checked = this.selectedVehicles.includes(vehicleId);
    });
  }

  async showCompareModal() {
    if (this.selectedVehicles.length < 2) {
      alert('Please select at least 2 vehicles to compare');
      return;
    }

    const modal = document.getElementById('compare-modal');
    if (modal) {
      modal.classList.add('active');
      await this.loadCompareData();
    }
  }

  hideCompareModal() {
    const modal = document.getElementById('compare-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  async loadCompareData() {
    // This would fetch vehicle data from server
    // For now, we'll use data from the page
    const compareBody = document.getElementById('compare-modal-body');
    if (!compareBody) return;

    const vehicles = this.selectedVehicles.map(id => {
      const card = document.querySelector(`[data-vehicle-id="${id}"]`)?.closest('.vehicle-card');
      if (!card) return null;

      return {
        id,
        name: card.querySelector('.vehicle-title')?.textContent || 'Unknown',
        image: card.querySelector('.vehicle-image')?.src || '',
        price: card.querySelector('.price-main')?.textContent || 'N/A',
        // Extract other data from card
      };
    }).filter(v => v !== null);

    // Render comparison table
    this.renderCompareTable(vehicles);
  }

  renderCompareTable(vehicles) {
    const compareBody = document.getElementById('compare-modal-body');
    if (!compareBody) return;

    const attributes = [
      { label: 'Vehicle', key: 'name' },
      { label: 'Price per Day', key: 'price' },
      { label: 'Type', key: 'type' },
      { label: 'Fuel Type', key: 'fuelType' },
      { label: 'Transmission', key: 'transmission' },
      { label: 'Seats', key: 'seats' },
      { label: 'Mileage', key: 'mileage' },
      { label: 'Rating', key: 'rating' }
    ];

    let html = '<div class="compare-grid">';
    
    // Header row
    html += '<div class="compare-row">';
    html += '<div class="compare-label"></div>';
    vehicles.forEach(vehicle => {
      html += `
        <div class="compare-vehicle-header">
          <img src="${vehicle.image}" alt="${vehicle.name}" class="compare-vehicle-image">
          <div class="compare-vehicle-name">${vehicle.name}</div>
          <div class="compare-vehicle-price">${vehicle.price}</div>
        </div>
      `;
    });
    html += '</div>';

    // Attribute rows
    attributes.forEach(attr => {
      html += '<div class="compare-row">';
      html += `<div class="compare-label">${attr.label}</div>`;
      vehicles.forEach(vehicle => {
        html += `<div class="compare-value">${vehicle[attr.key] || 'N/A'}</div>`;
      });
      html += '</div>';
    });

    html += '</div>';
    compareBody.innerHTML = html;
  }

  saveToStorage() {
    localStorage.setItem('vehicleCompare', JSON.stringify(this.selectedVehicles));
  }

  loadFromStorage() {
    const stored = localStorage.getItem('vehicleCompare');
    if (stored) {
      this.selectedVehicles = JSON.parse(stored);
    }
  }
}

// ===== AVAILABILITY CHECK SYSTEM =====

class AvailabilityChecker {
  constructor() {
    this.bookedDates = [];
  }

  async checkAvailability(vehicleId, startDate, endDate) {
    try {
      const response = await fetch(`/vehicles/${vehicleId}/availability?start=${startDate}&end=${endDate}`);
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Availability check error:', error);
      return false;
    }
  }

  async updateAvailabilityDisplay(vehicleId) {
    const badge = document.querySelector(`[data-vehicle-id="${vehicleId}"] .availability-badge`);
    if (!badge) return;

    const isAvailable = await this.checkAvailability(vehicleId, new Date(), new Date());
    
    if (isAvailable) {
      badge.classList.remove('unavailable');
      badge.classList.add('available');
      badge.innerHTML = '<i class="fas fa-check-circle"></i> Available';
    } else {
      badge.classList.remove('available');
      badge.classList.add('unavailable');
      badge.innerHTML = '<i class="fas fa-times-circle"></i> Booked';
    }
  }

  disableDatePicker(bookedDates) {
    // This would integrate with a date picker library
    // to disable booked dates
    this.bookedDates = bookedDates;
  }
}

// ===== UTILITY FUNCTIONS =====

function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast show align-items-center text-white bg-${type === 'success' ? 'success' : 'info'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  const container = document.querySelector('.position-fixed.top-0.end-0');
  if (container) {
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
  // Initialize vehicle booking system
  const pricePerDay = parseFloat(document.getElementById('price-per-day')?.textContent || '0');
  const pricePerHour = parseFloat(document.getElementById('price-per-hour')?.textContent || '0');
  window.vehicleBookingSystem = new VehicleBookingSystem(pricePerDay, pricePerHour);

  // Initialize compare system
  window.vehicleCompareSystem = new VehicleCompareSystem();

  // Initialize availability checker
  window.availabilityChecker = new AvailabilityChecker();

  // Handle booking form submission
  const bookingForm = document.getElementById('vehicle-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const validation = window.vehicleBookingSystem.validateBooking();
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      const bookingData = window.vehicleBookingSystem.getBookingData();
      console.log('Booking Data:', bookingData);
      
      // Submit to server
      submitVehicleBooking(bookingData);
    });
  }

  // Staggered animations for vehicle cards
  const cards = document.querySelectorAll('.vehicle-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
});

// Submit vehicle booking
async function submitVehicleBooking(bookingData) {
  try {
    const vehicleId = document.getElementById('vehicle-id')?.value;
    if (!vehicleId) {
      throw new Error('Vehicle ID not found');
    }

    // First create the booking
    const bookingResponse = await fetch(`/bookings/vehicles/${vehicleId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    const bookingResult = await bookingResponse.json();
    
    if (!bookingResponse.ok) {
      throw new Error(bookingResult.error || 'Failed to create booking');
    }

    // Then create Stripe checkout session using the booking ID
    const checkoutResponse = await fetch('/bookings/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: bookingResult.bookingId
      })
    });

    const checkoutResult = await checkoutResponse.json();
    
    if (!checkoutResponse.ok) {
      throw new Error(checkoutResult.error || 'Payment setup failed');
    }

    if (checkoutResult.url) {
      window.location.href = checkoutResult.url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert(error.message || 'An error occurred while processing your booking.');
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    VehicleBookingSystem, 
    VehicleCompareSystem, 
    AvailabilityChecker,
    submitVehicleBooking 
  };
}
