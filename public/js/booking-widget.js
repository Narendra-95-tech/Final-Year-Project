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
        this.adults = options.defaultAdults || 1;
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
        this.updateButtonStates();
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
            guestsSelector.addEventListener('click', (e) => {
                this.toggleGuestsDropdown(e);
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

        // Skip fees for ₹1 test listings
        let cleaningFee = 0;
        let serviceFee = 0;
        let extraGuestFee = 0;

        if (this.basePrice > 1) {
            cleaningFee = Math.max(Math.round(this.basePrice * this.cleaningFeePercent), this.minCleaningFee);
            extraGuestFee = (this.adults + this.children) > 2 ? ((this.adults + this.children) - 2) * 200 * nights : 0;
            const totalBeforeFee = subtotal + cleaningFee + extraGuestFee;
            serviceFee = Math.round(totalBeforeFee * this.serviceFeePercent);
        }

        const total = subtotal + cleaningFee + extraGuestFee + serviceFee;

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

        // Helper for animated number update
        const animateValue = (id, start, end, duration, isCurrency = true) => {
            const obj = document.getElementById(id);
            if (!obj) return;

            // Add pop animation class
            obj.parentElement.classList.add('price-updating');
            setTimeout(() => obj.parentElement.classList.remove('price-updating'), 300);

            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const current = Math.floor(progress * (end - start) + start);
                obj.textContent = isCurrency ? `₹${current.toLocaleString('en-IN')}` : current;
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        // Get current values from DOM for animation start points
        const parseContent = (id) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            return parseInt(el.textContent.replace(/[₹,]/g, '')) || 0;
        };

        if (pricing.nights > 0) {
            animateValue('subtotal-display', parseContent('subtotal-display'), pricing.subtotal, 400);
            animateValue('total-display', parseContent('total-display'), pricing.total, 500);

            const nightsDisplay = document.getElementById('nights-display');
            if (nightsDisplay) {
                nightsDisplay.textContent = `₹${this.basePrice.toLocaleString('en-IN')} × ${pricing.nights} ${pricing.nights === 1 ? 'night' : 'nights'}`;
            }
        }
    }

    changeGuests(type, delta) {
        const currentTotal = this.adults + this.children;
        const newTotal = currentTotal + delta;

        if (type === 'adults') {
            const newValue = this.adults + delta;
            // Adults must be at least 1 and new total must be <= maxGuests
            if (newValue >= 1 && newTotal <= this.maxGuests) {
                this.adults = newValue;
            } else if (newTotal > this.maxGuests) {
                this.showError(`Maximum ${this.maxGuests} guests allowed`);
                return;
            }
        } else if (type === 'children') {
            const newValue = this.children + delta;
            // Children can be 0 and new total must be <= maxGuests
            if (newValue >= 0 && newTotal <= this.maxGuests) {
                this.children = newValue;
            } else if (newTotal > this.maxGuests) {
                this.showError(`Maximum ${this.maxGuests} guests allowed`);
                return;
            }
        }

        this.updateGuestsDisplay();
        this.updatePriceDisplay();
        this.updateButtonStates();
    }

    updateButtonStates() {
        const adultsPlus = document.getElementById('adults-plus');
        const adultsMinus = document.getElementById('adults-minus');
        const childrenPlus = document.getElementById('children-plus');
        const childrenMinus = document.getElementById('children-minus');

        const total = this.adults + this.children;

        // Adults buttons
        if (adultsMinus) adultsMinus.disabled = (this.adults <= 1);
        if (adultsPlus) adultsPlus.disabled = (total >= this.maxGuests);

        // Children buttons
        if (childrenMinus) childrenMinus.disabled = (this.children <= 0);
        if (childrenPlus) childrenPlus.disabled = (total >= this.maxGuests);
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

    toggleGuestsDropdown(e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById('guests-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');

            if (dropdown.classList.contains('active')) {
                const closeHandler = (event) => {
                    if (!dropdown.contains(event.target) && !document.getElementById('guests-selector').contains(event.target)) {
                        dropdown.classList.remove('active');
                        document.removeEventListener('click', closeHandler);
                    }
                };
                document.addEventListener('click', closeHandler);
            }
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
            // Initiate booking first (Confirm and Pay flow)
            const response = await fetch('/bookings/initiate', {
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
                    nights: pricing.nights,
                    message: '' // Optional message
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error(data.message || data.error || 'Failed to initiate booking');
            }

            if (!data.redirectUrl) {
                throw new Error('No confirmation URL received');
            }

            // Redirect to Confirmation Page
            window.location.href = data.redirectUrl;

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
