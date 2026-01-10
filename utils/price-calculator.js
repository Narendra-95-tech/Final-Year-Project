/**
 * Price Calculator Utility
 * Calculates total booking price with fees and taxes
 */

/**
 * Calculate total booking price
 * @param {number} basePrice - Price per night
 * @param {number} nights - Number of nights
 * @param {number} guests - Number of guests
 * @returns {Object} Price breakdown
 */
function calculateBookingPrice(basePrice, nights, guests = 1) {
    // Base calculation
    const subtotal = basePrice * nights;

    // Cleaning fee (10% of base price, minimum ₹500)
    const cleaningFee = Math.max(Math.round(basePrice * 0.1), 500);

    // Service fee (5% of subtotal)
    const serviceFee = Math.round(subtotal * 0.05);

    // Additional guest fee (if more than 2 guests, ₹200 per extra guest per night)
    const extraGuestFee = guests > 2 ? (guests - 2) * 200 * nights : 0;

    // Total before tax
    const totalBeforeTax = subtotal + cleaningFee + serviceFee + extraGuestFee;

    // Tax (12% GST)
    const tax = Math.round(totalBeforeTax * 0.12);

    // Final total
    const total = totalBeforeTax + tax;

    return {
        basePrice,
        nights,
        guests,
        subtotal,
        cleaningFee,
        serviceFee,
        extraGuestFee,
        totalBeforeTax,
        tax,
        total,
        pricePerNight: basePrice
    };
}

/**
 * Format price in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted price
 */
function formatPrice(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Calculate number of nights between two dates
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @returns {number} Number of nights
 */
function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

module.exports = {
    calculateBookingPrice,
    formatPrice,
    calculateNights
};
