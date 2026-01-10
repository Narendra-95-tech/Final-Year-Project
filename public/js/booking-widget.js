/**
 * Booking Widget Component
 * Enhanced booking system with price calculation and validation
 */

class BookingWidget {
    constructor(listingId, basePrice, options = {}) {
        this.listingId = listingId;
        this.basePrice = basePrice;
        this.checkInDate = null;
        this.checkOutDate = null;
        this.adults = options.defaultAdults || 2;
        this.children = options.defaultChildren || 0;
        this.maxGuests = options.maxGuests || 10;
        this.cleaningFeePercent = options.cleaningFeePercent || 0.10;
        this.serviceFeePercent = options.serviceFeePercent || 0.05;
        this.minCleaningFee = options.minCleaningFee || 500;

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.updatePriceDisplay();
        this.setupStickyBehavior();
    }

    attachEventListeners() {
        // Date inputs
        const checkInInput = document.getElementById('check-in-date');
        const checkOutInput = document.getElementById('check-out-date');

        if (checkInInput) {
            checkInInput.addEventListener('change', (e) => {
                this.checkInDate = e.target.value;
                this.validateDates();
                this.updatePriceDisplay();
            });
        }

        if (checkOutInput) {
            checkOutInput.addEventListener('change', (e) => {
                this.checkOutDate = e.target.value;
                this.validateDates();
                this.updatePriceDisplay();
            });
        }

        // Guest selector
        const guestsSelector = document.getElementById('guests-selector');
        if (guestsSelector) {
            guestsSelector.addEventListener('click', () => {
                this.toggleGuestsDropdown();
            });
        }

        // Guest increment/decrement buttons
        const adultsPlus = document.getElementById('adults-plus');
        const adultsMinus = document.getElementById('adults-minus');
        const childrenPlus = document.getElementById('children-plus');
        const childrenMinus = document.getElementById('children-minus');

        if (adultsPlus) adultsPlus.addEventListener('click', () => this.changeGuests('adults', 1));
        if (adultsMinus) adultsMinus.addEventListener('click', () => this.changeGuests('adults', -1));
        if (childrenPlus) childrenPlus.addEventListener('click', () => this.changeGuests('children', 1));
        if (childrenMinus) childrenMinus.addEventListener('click', () => this.changeGuests('children', -1));

        // Reserve button
        const reserveBtn = document.getElementById('reserve-btn');
        if (reserveBtn) {
            reserveBtn.addEventListener('click', () => this.handleReservation());
        }

        // Mobile reserve button
        const mobileReserveBtn = document.getElementById('mobile-reserve-btn');
        if (mobileReserveBtn) {
            mobileReserveBtn.addEventListener('click', () => this.handleReservation());
        }
    }

    validateDates() {
        if (!this.checkInDate || !this.checkOutDate) return false;

        const checkIn = new Date(this.checkInDate);
        const checkOut = new Date(this.checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if check-in is in the past
        if (checkIn < today) {
            this.showError('Check-in date cannot be in the past');
            return false;
        }

        // Check if check-out is before check-in
        if (checkOut <= checkIn) {
            this.showError('Check-out date must be after check-in date');
            return false;
        }

        return true;
    }

    calculateNights() {
        if (!this.checkInDate || !this.checkOutDate) return 0;

        const checkIn = new Date(this.checkInDate);
        const checkOut = new Date(this.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    calculatePrice() {
        const nights = this.calculateNights();
        if (nights === 0) {
            return {
                nights: 0,
                subtotal: 0,
                cleaningFee: 0,
                serviceFee: 0,
                extraGuestFee: 0,
                total: 0
            };
        }

        const subtotal = this.basePrice * nights;
        const cleaningFee = Math.max(Math.round(this.basePrice * this.cleaningFeePercent), this.minCleaningFee);
        const extraGuestFee = (this.adults + this.children) > 2 ? ((this.adults + this.children) - 2) * 200 * nights : 0;
        const totalBeforeFee = subtotal + cleaningFee + extraGuestFee;
        const serviceFee = Math.round(totalBeforeFee * this.serviceFeePercent);
        const total = totalBeforeFee + serviceFee;

        return {
            nights,
            subtotal,
            cleaningFee,
            serviceFee,
            extraGuestFee,
            total
        };
    }

    updatePriceDisplay() {
        const pricing = this.calculatePrice();

        // Update price breakdown
        const nightsDisplay = document.getElementById('nights-display');
        const subtotalDisplay = document.getElementById('subtotal-display');
        const cleaningFeeDisplay = document.getElementById('cleaning-fee-display');
        const serviceFeeDisplay = document.getElementById('service-fee-display');
        const extraGuestFeeDisplay = document.getElementById('extra-guest-fee-display');
        const totalDisplay = document.getElementById('total-display');

        if (nightsDisplay) {
            nightsDisplay.textContent = `₹${this.basePrice.toLocaleString('en-IN')} × ${pricing.nights} ${pricing.nights === 1 ? 'night' : 'nights'}`;
        }

        if (subtotalDisplay) {
            subtotalDisplay.textContent = `₹${pricing.subtotal.toLocaleString('en-IN')}`;
        }

        if (cleaningFeeDisplay) {
            cleaningFeeDisplay.textContent = `₹${pricing.cleaningFee.toLocaleString('en-IN')}`;
        }

        if (serviceFeeDisplay) {
            serviceFeeDisplay.textContent = `₹${pricing.serviceFee.toLocaleString('en-IN')}`;
        }

        if (extraGuestFeeDisplay && pricing.extraGuestFee > 0) {
            extraGuestFeeDisplay.parentElement.style.display = 'flex';
            extraGuestFeeDisplay.textContent = `₹${pricing.extraGuestFee.toLocaleString('en-IN')}`;
        } else if (extraGuestFeeDisplay) {
            extraGuestFeeDisplay.parentElement.style.display = 'none';
        }

        if (totalDisplay) {
            totalDisplay.textContent = `₹${pricing.total.toLocaleString('en-IN')}`;
        }

        // Update mobile booking bar
        const mobilePriceAmount = document.getElementById('mobile-price-amount');
        if (mobilePriceAmount) {
            mobilePriceAmount.textContent = `₹${this.basePrice.toLocaleString('en-IN')}`;
        }
    }

    changeGuests(type, delta) {
        if (type === 'adults') {
            const newValue = this.adults + delta;
            if (newValue >= 1 && newValue <= this.maxGuests) {
                this.adults = newValue;
            }
        } else if (type === 'children') {
            const newValue = this.children + delta;
            if (newValue >= 0 && newValue <= this.maxGuests) {
                this.children = newValue;
            }
        }

        // Check total guests
        if (this.adults + this.children > this.maxGuests) {
            this.showError(`Maximum ${this.maxGuests} guests allowed`);
            return;
        }

        this.updateGuestsDisplay();
        this.updatePriceDisplay();
    }

    updateGuestsDisplay() {
        const adultsCount = document.getElementById('adults-count');
        const childrenCount = document.getElementById('children-count');
        const guestsText = document.getElementById('guests-text');

        if (adultsCount) adultsCount.textContent = this.adults;
        if (childrenCount) childrenCount.textContent = this.children;

        if (guestsText) {
            const total = this.adults + this.children;
            guestsText.textContent = `${total} ${total === 1 ? 'guest' : 'guests'}`;
        }
    }

    toggleGuestsDropdown() {
        const dropdown = document.getElementById('guests-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    setupStickyBehavior() {
        const bookingCard = document.querySelector('.booking-card');
        if (!bookingCard) return;

        let lastScrollTop = 0;
        const mobileBookingBar = document.querySelector('.mobile-booking-bar');

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Show/hide mobile booking bar on scroll
            if (mobileBookingBar) {
                if (scrollTop > lastScrollTop && scrollTop > 300) {
                    mobileBookingBar.style.transform = 'translateY(0)';
                } else {
                    mobileBookingBar.style.transform = 'translateY(100%)';
                }
            }

            lastScrollTop = scrollTop;
        });
    }

    async handleReservation() {
        // Check if user is logged in
        if (!currUserId || currUserId === '') {
            // Redirect to login
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        // Check if user is the owner
        if (typeof isOwner !== 'undefined' && isOwner) {
            this.showError('You cannot book your own listing');
            return;
        }

        // Validate dates
        if (!this.checkInDate || !this.checkOutDate) {
            this.showError('Please select check-in and check-out dates');
            return;
        }

        if (!this.validateDates()) {
            return;
        }

        const pricing = this.calculatePrice();
        if (pricing.nights === 0) {
            this.showError('Please select valid dates');
            return;
        }

        // Show loading state
        const reserveBtn = document.getElementById('reserve-btn');
        const mobileReserveBtn = document.getElementById('mobile-reserve-btn');
        const originalText = reserveBtn ? reserveBtn.innerHTML : '';
        const originalMobileText = mobileReserveBtn ? mobileReserveBtn.innerHTML : '';

        if (reserveBtn) {
            reserveBtn.disabled = true;
            reserveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        }
        if (mobileReserveBtn) {
            mobileReserveBtn.disabled = true;
            mobileReserveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        }

        try {
            // Create Stripe checkout session directly
            const response = await fetch('/bookings/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    type: 'listing',
                    listingId: this.listingId,
                    startDate: this.checkInDate,
                    endDate: this.checkOutDate,
                    guests: this.adults + this.children,
                    totalPrice: pricing.total,
                    nights: pricing.nights
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Payment setup failed');
            }

            if (!data.url) {
                throw new Error('No checkout URL received');
            }

            // Redirect to Stripe Checkout
            window.location.href = data.url;

        } catch (error) {
            console.error('Booking error:', error);
            this.showError(error.message || 'Failed to process booking. Please try again.');

            // Restore button state
            if (reserveBtn) {
                reserveBtn.disabled = false;
                reserveBtn.innerHTML = originalText;
            }
            if (mobileReserveBtn) {
                mobileReserveBtn.disabled = false;
                mobileReserveBtn.innerHTML = originalMobileText;
            }
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.getElementById('booking-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'booking-error';
            errorDiv.className = 'alert alert-danger mt-3';
            const bookingCard = document.querySelector('.booking-card');
            if (bookingCard) {
                bookingCard.appendChild(errorDiv);
            }
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingWidget;
}
