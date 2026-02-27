// ===== DHABAS SYSTEM =====

class DhabaBookingSystem {
  constructor() {
    this.bookingType = 'table';
    this.selectedTable = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.guests = 2;
    this.orderItems = [];
    this.taxRate = 0.05;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCart();
  }

  setupEventListeners() {
    const bookingTypeInputs = document.querySelectorAll('input[name="bookingType"]');
    bookingTypeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.bookingType = e.target.value;
        this.updateBookingUI();
      });
    });

    const dateInput = document.getElementById('dhaba-booking-date');
    const timeInput = document.getElementById('dhaba-booking-time');

    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.selectedDate = e.target.value;
        this.updatePriceCalculation();
      });
    }

    if (timeInput) {
      timeInput.addEventListener('change', (e) => {
        this.selectedTime = e.target.value;
        this.updatePriceCalculation();
      });
    }

    const decreaseBtn = document.getElementById('decrease-guests-dhaba');
    const increaseBtn = document.getElementById('increase-guests-dhaba');

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => this.decreaseGuests());
    }

    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => this.increaseGuests());
    }
  }

  updateBookingUI() {
    const tableSection = document.getElementById('table-booking-section');
    const mealSection = document.getElementById('meal-order-section');

    if (this.bookingType === 'table') {
      if (tableSection) tableSection.style.display = 'block';
      if (mealSection) mealSection.style.display = 'none';
    } else {
      if (tableSection) tableSection.style.display = 'none';
      if (mealSection) mealSection.style.display = 'block';
    }
  }

  selectTable(tableType, price) {
    this.selectedTable = { type: tableType, price };

    document.querySelectorAll('.table-type-card').forEach(card => {
      card.classList.remove('selected');
    });
    event.target.closest('.table-type-card').classList.add('selected');

    this.updatePriceCalculation();
  }

  increaseGuests() {
    if (this.guests < 20) {
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
    const guestDisplay = document.getElementById('guest-count-dhaba');
    if (guestDisplay) {
      guestDisplay.textContent = this.guests;
    }
  }

  addToCart(item) {
    const existingItem = this.orderItems.find(i => i.id === item.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.orderItems.push({ ...item, quantity: 1 });
    }

    this.saveCart();
    this.updateCartUI();
    showNotification(`${item.name} added to cart`, 'success');
  }

  removeFromCart(itemId) {
    this.orderItems = this.orderItems.filter(item => item.id !== itemId);
    this.saveCart();
    this.updateCartUI();
  }

  updateQuantity(itemId, change) {
    const item = this.orderItems.find(i => i.id === itemId);
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        this.saveCart();
        this.updateCartUI();
      }
    }
  }

  calculateSubtotal() {
    if (this.bookingType === 'table' && this.selectedTable) {
      return this.selectedTable.price;
    } else {
      return this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
  }

  calculateTax() {
    return this.calculateSubtotal() * this.taxRate;
  }

  calculateTotal() {
    return this.calculateSubtotal() + this.calculateTax();
  }

  updatePriceCalculation() {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const total = this.calculateTotal();

    const priceDisplay = document.getElementById('dhaba-price-display');
    if (priceDisplay && subtotal > 0) {
      priceDisplay.innerHTML = `
        <div class="price-breakdown">
          <div class="price-row">
            <span class="price-label">${this.bookingType === 'table' ? 'Table Booking' : 'Order Total'}</span>
            <span class="price-value">₹${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="price-row">
            <span class="price-label">GST (5%)</span>
            <span class="price-value">₹${tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div class="price-row total">
            <span>Total Amount</span>
            <span>₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      `;
    }
  }

  updateCartUI() {
    const cartBody = document.getElementById('order-cart-body');
    const cartTotal = document.getElementById('cart-total-amount');
    const orderCart = document.getElementById('order-cart');

    if (this.orderItems.length === 0) {
      if (orderCart) orderCart.classList.remove('active');
      return;
    }

    if (orderCart) orderCart.classList.add('active');

    if (cartBody) {
      cartBody.innerHTML = this.orderItems.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price}</div>
            <div class="cart-item-quantity">
              <button class="qty-btn" onclick="dhabaBookingSystem.updateQuantity('${item.id}', -1)">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" onclick="dhabaBookingSystem.updateQuantity('${item.id}', 1)">+</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (cartTotal) {
      cartTotal.textContent = `₹${this.calculateTotal().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
  }

  saveCart() {
    localStorage.setItem('dhabaCart', JSON.stringify(this.orderItems));
  }

  loadCart() {
    const saved = localStorage.getItem('dhabaCart');
    if (saved) {
      this.orderItems = JSON.parse(saved);
      this.updateCartUI();
    }
  }

  clearCart() {
    this.orderItems = [];
    this.saveCart();
    this.updateCartUI();
  }

  validateBooking() {
    if (this.bookingType === 'table') {
      if (!this.selectedTable) {
        return { valid: false, message: 'Please select a table type' };
      }
      if (!this.selectedDate || !this.selectedTime) {
        return { valid: false, message: 'Please select date and time' };
      }
    } else {
      if (this.orderItems.length === 0) {
        return { valid: false, message: 'Please add items to your order' };
      }
    }
    return { valid: true };
  }

  getBookingData() {
    return {
      bookingType: this.bookingType,
      selectedTable: this.selectedTable,
      selectedDate: this.selectedDate,
      selectedTime: this.selectedTime,
      guests: this.guests,
      orderItems: this.orderItems,
      totalPrice: this.calculateTotal()
    };
  }
}

// Menu filtering
function filterMenu(category) {
  const items = document.querySelectorAll('.menu-item-card');

  document.querySelectorAll('.menu-category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  items.forEach(item => {
    if (category === 'all' || item.dataset.category === category) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Detailed ratings display
function displayDetailedRatings(ratings) {
  const categories = ['foodTaste', 'hygiene', 'service', 'ambience'];
  const labels = {
    foodTaste: 'Food Taste',
    hygiene: 'Hygiene',
    service: 'Service',
    ambience: 'Ambience'
  };

  return categories.map(cat => {
    const rating = ratings[cat] || 0;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

    return `
      <div class="rating-item">
        <div class="rating-label">${labels[cat]}</div>
        <div class="rating-value">
          <span class="rating-stars">${stars}</span>
          <span class="rating-number">${rating.toFixed(1)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Google Maps integration
function initDhabaMap(lat, lng, dhabaName) {
  const mapContainer = document.getElementById('dhaba-map');
  if (!mapContainer) return;

  const map = new google.maps.Map(mapContainer, {
    center: { lat, lng },
    zoom: 15,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    title: dhabaName,
    animation: google.maps.Animation.DROP
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="padding: 10px;"><h6>${dhabaName}</h6><p>Click for directions</p></div>`
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}

// Find nearby dhabas
async function findNearbyDhabas(lat, lng, radius = 5000) {
  try {
    const response = await fetch(`/dhabas/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
      headers: { 'Accept': 'application/json' }
    });
    // Guard: if server returned HTML (e.g. login redirect), don't try to parse as JSON
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }
    const data = await response.json();
    return data.dhabas;
  } catch (error) {
    console.error('Error finding nearby dhabas:', error);
    return [];
  }
}

// Stripe payment integration
async function processDhabaBooking(dhabaId, bookingData) {
  try {
    // First create the booking
    const bookingResponse = await fetch(`/bookings/dhabas/${dhabaId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    // Guard: check content type before parsing as JSON
    const bookingContentType = bookingResponse.headers.get('content-type') || '';
    if (!bookingContentType.includes('application/json')) {
      throw new Error('Server returned HTML instead of JSON — you may need to log in.');
    }
    const bookingResult = await bookingResponse.json();

    if (!bookingResponse.ok) {
      throw new Error(bookingResult.error || 'Failed to create booking');
    }

    // Then create Stripe checkout session using the booking ID
    const checkoutResponse = await fetch('/bookings/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        bookingId: bookingResult.bookingId
      })
    });

    // Guard: check content type before parsing as JSON
    const checkoutContentType = checkoutResponse.headers.get('content-type') || '';
    if (!checkoutContentType.includes('application/json')) {
      throw new Error('Checkout server returned HTML instead of JSON.');
    }
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
    showNotification(error.message || 'An error occurred while processing your booking.', 'error');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
  window.dhabaBookingSystem = new DhabaBookingSystem();

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async function () {
      const validation = window.dhabaBookingSystem.validateBooking();
      if (!validation.valid) {
        showNotification(validation.message, 'error');
        return;
      }

      const bookingData = window.dhabaBookingSystem.getBookingData();
      console.log('Booking Data:', bookingData);

      const dhabaId = document.getElementById('dhaba-id')?.value;
      if (!dhabaId) {
        showNotification('Dhaba ID not found', 'error');
        return;
      }

      checkoutBtn.disabled = true;
      try {
        await processDhabaBooking(dhabaId, bookingData);
      } finally {
        checkoutBtn.disabled = false;
      }
    });
  }

  const closeCartBtn = document.getElementById('close-cart-btn');
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', function () {
      document.getElementById('order-cart').classList.remove('active');
    });
  }

  const cards = document.querySelectorAll('.dhaba-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
});

function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast show align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>${message}
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DhabaBookingSystem, filterMenu, initDhabaMap, findNearbyDhabas, processPayment };
}
