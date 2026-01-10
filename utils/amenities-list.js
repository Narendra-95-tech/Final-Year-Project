/**
 * Comprehensive Amenities List with Categories and Icons
 * For Wanderlust Property Listings
 */

const amenitiesList = {
    essentials: [
        { name: 'WiFi', icon: 'fas fa-wifi' },
        { name: 'Kitchen', icon: 'fas fa-utensils' },
        { name: 'Washer', icon: 'fas fa-tshirt' },
        { name: 'Dryer', icon: 'fas fa-wind' },
        { name: 'Air conditioning', icon: 'fas fa-snowflake' },
        { name: 'Heating', icon: 'fas fa-fire' },
        { name: 'Dedicated workspace', icon: 'fas fa-laptop' },
        { name: 'TV', icon: 'fas fa-tv' },
        { name: 'Hair dryer', icon: 'fas fa-wind' },
        { name: 'Iron', icon: 'fas fa-tshirt' }
    ],

    safety: [
        { name: 'Smoke alarm', icon: 'fas fa-bell' },
        { name: 'Carbon monoxide alarm', icon: 'fas fa-exclamation-triangle' },
        { name: 'First aid kit', icon: 'fas fa-first-aid' },
        { name: 'Fire extinguisher', icon: 'fas fa-fire-extinguisher' },
        { name: 'Security cameras', icon: 'fas fa-video' },
        { name: 'Lock on bedroom door', icon: 'fas fa-lock' }
    ],

    kitchen: [
        { name: 'Refrigerator', icon: 'fas fa-temperature-low' },
        { name: 'Microwave', icon: 'fas fa-microwave' },
        { name: 'Coffee maker', icon: 'fas fa-coffee' },
        { name: 'Dishes and silverware', icon: 'fas fa-utensils' },
        { name: 'Dishwasher', icon: 'fas fa-sink' },
        { name: 'Stove', icon: 'fas fa-fire-burner' },
        { name: 'Oven', icon: 'fas fa-oven' },
        { name: 'Cooking basics', icon: 'fas fa-pepper-hot' }
    ],

    entertainment: [
        { name: 'TV with cable', icon: 'fas fa-tv' },
        { name: 'Netflix', icon: 'fab fa-netflix' },
        { name: 'Amazon Prime', icon: 'fab fa-amazon' },
        { name: 'Board games', icon: 'fas fa-chess' },
        { name: 'Books and reading material', icon: 'fas fa-book' },
        { name: 'Sound system', icon: 'fas fa-volume-up' },
        { name: 'Piano', icon: 'fas fa-music' },
        { name: 'Exercise equipment', icon: 'fas fa-dumbbell' }
    ],

    outdoor: [
        { name: 'Balcony', icon: 'fas fa-building' },
        { name: 'Garden', icon: 'fas fa-leaf' },
        { name: 'BBQ grill', icon: 'fas fa-fire' },
        { name: 'Outdoor furniture', icon: 'fas fa-chair' },
        { name: 'Patio', icon: 'fas fa-home' },
        { name: 'Pool', icon: 'fas fa-swimming-pool' },
        { name: 'Hot tub', icon: 'fas fa-hot-tub' },
        { name: 'Beach access', icon: 'fas fa-umbrella-beach' }
    ],

    bathroom: [
        { name: 'Shampoo', icon: 'fas fa-pump-soap' },
        { name: 'Conditioner', icon: 'fas fa-pump-soap' },
        { name: 'Body soap', icon: 'fas fa-soap' },
        { name: 'Hot water', icon: 'fas fa-temperature-high' },
        { name: 'Bathtub', icon: 'fas fa-bath' },
        { name: 'Shower gel', icon: 'fas fa-shower' },
        { name: 'Towels', icon: 'fas fa-toilet-paper' }
    ],

    parking: [
        { name: 'Free parking on premises', icon: 'fas fa-parking' },
        { name: 'Free street parking', icon: 'fas fa-road' },
        { name: 'Paid parking on premises', icon: 'fas fa-parking' },
        { name: 'Garage', icon: 'fas fa-warehouse' },
        { name: 'EV charger', icon: 'fas fa-charging-station' }
    ],

    services: [
        { name: 'Breakfast', icon: 'fas fa-coffee' },
        { name: 'Cleaning before checkout', icon: 'fas fa-broom' },
        { name: 'Long term stays allowed', icon: 'fas fa-calendar-alt' },
        { name: 'Luggage dropoff allowed', icon: 'fas fa-suitcase' },
        { name: 'Self check-in', icon: 'fas fa-key' },
        { name: '24-hour check-in', icon: 'fas fa-clock' }
    ]
};

/**
 * Get icon for a specific amenity name
 * @param {string} amenityName - Name of the amenity
 * @returns {string} Font Awesome icon class
 */
function getAmenityIcon(amenityName) {
    const normalizedName = amenityName.toLowerCase().trim();

    for (const category in amenitiesList) {
        const amenity = amenitiesList[category].find(
            a => a.name.toLowerCase() === normalizedName
        );
        if (amenity) return amenity.icon;
    }

    // Default icon if not found
    return 'fas fa-check-circle';
}

/**
 * Get all amenities as a flat array
 * @returns {Array} All amenities with icons
 */
function getAllAmenities() {
    const all = [];
    for (const category in amenitiesList) {
        all.push(...amenitiesList[category]);
    }
    return all;
}

/**
 * Get amenities by category
 * @param {string} category - Category name
 * @returns {Array} Amenities in that category
 */
function getAmenitiesByCategory(category) {
    return amenitiesList[category] || [];
}

module.exports = {
    amenitiesList,
    getAmenityIcon,
    getAllAmenities,
    getAmenitiesByCategory
};
