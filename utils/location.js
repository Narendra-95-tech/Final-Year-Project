/**
 * Location utility functions for WanderLust
 * Handles distance calculations, geocoding, and location-based operations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate { lat, lng }
 * @param {Object} coord2 - Second coordinate { lat, lng }
 * @returns {number} Distance in kilometers
 */
function getDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for a location using the Mapbox Geocoding API
 * @param {string} location - Location name (e.g., "Manali, India")
 * @returns {Promise<Object>} Coordinates { lat, lng }
 */
async function geocodeLocation(location) {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
        );
        
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            throw new Error('Location not found');
        }
        
        // Return the first result's coordinates [longitude, latitude]
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
    } catch (error) {
        console.error('Error geocoding location:', error);
        // Return a default location (e.g., center of India) if geocoding fails
        return { lat: 20.5937, lng: 78.9629 };
    }
}

/**
 * Get nearby places within a certain radius
 * @param {Object} center - Center coordinates { lat, lng }
 * @param {Array} places - Array of places with coordinates
 * @param {number} radius - Radius in kilometers
 * @returns {Array} Filtered array of places within the radius
 */
function getNearbyPlaces(center, places, radius = 10) {
    return places.filter(place => {
        if (!place.location || !place.location.coordinates) return false;
        
        const placeCoords = {
            lat: place.location.coordinates[1],
            lng: place.location.coordinates[0]
        };
        
        const distance = getDistance(center, placeCoords);
        return distance <= radius;
    });
}

/**
 * Format distance with appropriate units
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance (e.g., "5.2 km" or "1,200 m")
 */
function formatDistance(distance) {
    if (distance < 1) {
        return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
}

/**
 * Get travel time between two points
 * @param {Object} origin - Origin coordinates { lat, lng }
 * @param {Object} destination - Destination coordinates { lat, lng }
 * @param {string} mode - Travel mode (driving, walking, cycling)
 * @returns {Promise<Object>} Travel time and distance
 */
async function getTravelTime(origin, destination, mode = 'driving') {
    try {
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/${mode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&geometries=geojson`
        );
        
        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No route found');
        }
        
        const route = data.routes[0];
        
        // Convert duration from seconds to minutes
        const durationMinutes = Math.round(route.duration / 60);
        
        // Convert distance from meters to kilometers
        const distanceKm = route.distance / 1000;
        
        return {
            duration: durationMinutes,
            distance: distanceKm,
            geometry: route.geometry
        };
    } catch (error) {
        console.error('Error getting travel time:', error);
        return {
            duration: 0,
            distance: 0,
            geometry: null,
            error: error.message
        };
    }
}

module.exports = {
    getDistance,
    geocodeLocation,
    getNearbyPlaces,
    formatDistance,
    getTravelTime
};
