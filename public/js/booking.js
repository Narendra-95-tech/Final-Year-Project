// ===== BOOKING SYSTEM ===== 

class BookingSystem {
  constructor(pricePerNight = 0) {
    this.pricePerNight = pricePerNight;
    this.guests = 1;
    this.startDate = null;
    this.endDate = null;
    this.taxRate = 0.18; // 18% GST
    this.platformFee = 0.05; // 5% platform fee

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setMinDates();
  }

  setupEventListeners() {
    // Date pickers
    const startDateInput = document.getElementById('booking-start-date');
    const endDateInput = document.getElementById('booking-end-date');

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

    // Guest counter
    const decreaseBtn = document.getElementById('decrease-guests');
    const increaseBtn = document.getElementById('increase-guests');

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => this.decreaseGuests());
    }

    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => this.increaseGuests());
    }
  }

  setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('booking-start-date');

    if (startDateInput) {
      startDateInput.setAttribute('min', today);
    }
  }

  increaseGuests() {
    const maxGuests = 20;
    if (this.guests < maxGuests) {
      this.guests++;
      this.updateGuestDisplay();
    }
  }

  decreaseGuests() {
    if (this.guests > 1) {
      this.guests--;
      this.updateGuestDisplay();
    }
  }

  updateGuestDisplay() {
    const guestDisplay = document.getElementById('guest-count');
    if (guestDisplay) {
      guestDisplay.textContent = this.guests;
    }
  }

  calculateNights() {
    if (!this.startDate || !this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  calculateSubtotal() {
    const nights = this.calculateNights();
    return this.pricePerNight * nights;
  }

  calculateTax() {
    const subtotal = this.calculateSubtotal();
    return subtotal * this.taxRate;
  }

  calculatePlatformFee() {
    const subtotal = this.calculateSubtotal();
    return subtotal * this.platformFee;
  }

  calculateTotal() {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const platformFee = this.calculatePlatformFee();
    return subtotal + tax + platformFee;
  }

  updatePriceCalculation() {
    const nights = this.calculateNights();

    if (nights <= 0) {
      this.clearPriceDisplay();
      return;
    }

    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const platformFee = this.calculatePlatformFee();
    const total = this.calculateTotal();

    // Update price breakdown
    this.updatePriceBreakdown(subtotal, tax, platformFee, total, nights);
  }

  updatePriceBreakdown(subtotal, tax, platformFee, total, nights) {
    const priceDisplay = document.getElementById('price-display');
    const breakdownDisplay = document.getElementById('price-breakdown-display');

    if (priceDisplay) {
      priceDisplay.innerHTML = `
        <div class="price-breakdown">
          <div class="price-row">
            <span class="price-label">₹${this.pricePerNight.toLocaleString('en-IN')} × ${nights} night${nights > 1 ? 's' : ''}</span>
            <span class="price-value">₹${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="price-row">
            <span class="price-label">GST (18%)</span>
            <span class="price-value">₹${tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="price-row">
            <span class="price-label">Platform Fee (5%)</span>
            <span class="price-value">₹${platformFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="price-row total">
            <span>Total</span>
            <span>₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      `;
    }

    if (breakdownDisplay) {
      breakdownDisplay.innerHTML = `
        <div class="booking-summary">
          <div class="summary-title">Booking Summary</div>
          <div class="summary-item">
            <span>Check-in:</span>
            <span>${this.startDate.toLocaleDateString('en-IN')}</span>
          </div>
          <div class="summary-item">
            <span>Check-out:</span>
            <span>${this.endDate.toLocaleDateString('en-IN')}</span>
          </div>
          <div class="summary-item">
            <span>Guests:</span>
            <span>${this.guests} guest${this.guests > 1 ? 's' : ''}</span>
          </div>
          <div class="summary-item">
            <span>Nights:</span>
            <span>${nights}</span>
          </div>
          <div class="summary-item total">
            <span>Total Amount</span>
            <span>₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      `;
    }
  }

  clearPriceDisplay() {
    const priceDisplay = document.getElementById('price-display');
    if (priceDisplay) {
      priceDisplay.innerHTML = '<p class="text-muted">Select dates to see pricing</p>';
    }
  }

  getBookingData() {
    return {
      startDate: this.startDate ? this.startDate.toISOString().split('T')[0] : null,
      endDate: this.endDate ? this.endDate.toISOString().split('T')[0] : null,
      guests: this.guests,
      totalPrice: this.calculateTotal(),
      nights: this.calculateNights()
    };
  }

  validateBooking() {
    if (!this.startDate || !this.endDate) {
      return { valid: false, message: 'Please select check-in and check-out dates' };
    }

    if (this.endDate <= this.startDate) {
      return { valid: false, message: 'Check-out date must be after check-in date' };
    }

    if (this.guests < 1) {
      return { valid: false, message: 'Please select at least 1 guest' };
    }

    return { valid: true };
  }
}

// Initialize booking system when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  const pricePerNight = parseFloat(document.getElementById('price-per-night')?.textContent || '0');
  window.bookingSystem = new BookingSystem(pricePerNight);

  // Handle booking form submission
  const bookingForm = document.getElementById('listing-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const validation = window.bookingSystem.validateBooking();
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      const bookingData = window.bookingSystem.getBookingData();
      console.log('Booking Data:', bookingData);

      // Submit to server
      submitBooking(bookingData);
    });
  }
});

// Submit booking to server
async function submitBooking(bookingData) {
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn?.innerHTML;

  // Debug: Log the received booking data
  console.log('submitBooking called with data:', bookingData);

  // Ensure bookingData is an object
  if (!bookingData || typeof bookingData !== 'object') {
    console.error('Invalid booking data:', bookingData);
    alert('Invalid booking data. Please try again.');
    return;
  }

  try {
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    const listingId = document.getElementById('listing-id')?.value;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Prepare booking data
    if (!listingId) {
      console.error('No listing ID found');
      alert('Error: Could not find listing ID');
      return;
    }

    const bookingPayload = {
      listingId,
      type: 'listing',
      ...bookingData
    };

    console.log('Submitting booking with data:', bookingPayload);

    const response = await fetch(`/bookings/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'CSRF-Token': csrfToken || ''
      },
      credentials: 'same-origin',
      body: JSON.stringify(bookingPayload)
    });

    const result = await response.json().catch(() => ({
      message: 'Invalid server response',
      error: 'INVALID_RESPONSE'
    }));

    if (!response.ok) {
      console.error('Booking API error:', {
        status: response.status,
        statusText: response.statusText,
        result
      });

      // Handle UNAUTHORIZED (401)
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      let errorMessage = 'Failed to process your booking. ';

      // Handle specific error cases
      if (result.error === 'MISSING_FIELDS') {
        errorMessage += 'Please fill in all required fields.';
      } else if (result.error === 'INVALID_DATE_RANGE') {
        errorMessage += 'Please select a valid date range.';
      } else if (result.error === 'UNAVAILABLE_DATES') {
        errorMessage += 'The selected dates are not available. Please choose different dates.';
      } else if (result.message) {
        errorMessage += result.message;
      } else {
        errorMessage += 'Please try again later.';
      }

      throw new Error(errorMessage);
    }

    if (result.url) {
      // Redirect to Stripe Checkout
      console.log('Redirecting to Stripe checkout:', result.url);
      window.location.href = result.url;
    } else {
      throw new Error('No redirect URL received from server');
    }
  } catch (error) {
    console.error('Booking error:', {
      error: error.message,
      stack: error.stack
    });

    // Show error message to user
    const errorContainer = document.getElementById('booking-error') ||
      document.createElement('div');

    if (!document.getElementById('booking-error')) {
      errorContainer.id = 'booking-error';
      errorContainer.className = 'alert alert-danger mt-3';
      document.querySelector('.booking-form')?.appendChild(errorContainer);
    }

    errorContainer.innerHTML = `
      <i class="fas fa-exclamation-circle me-2"></i>
      ${error.message || 'An unexpected error occurred. Please try again.'}
    `;

    // Scroll to error message
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } finally {
    // Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BookingSystem, submitBooking, formatCurrency };
}
