const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");
const wrapAsync = require("../utils/wrapAsync");

// Helper to convert to GeoJSON Feature
const toGeoJSON = (item, type) => {
    // Determine icon and color based on type
    let icon = "marker";
    let color = "#E63946"; // Default User/Other
    let price = item.price || 0;

    if (type === "listing") {
        icon = "home";
        color = "#F4A261"; // Orange for Stays
    } else if (type === "vehicle") {
        icon = "car";
        color = "#2A9D8F"; // Teal for Vehicles
    } else if (type === "dhaba") {
        icon = "restaurant";
        color = "#E76F51"; // Red-Orange for Food
    }

    return {
        type: "Feature",
        geometry: item.geometry,
        properties: {
            id: item._id,
            title: item.title,
            description: item.description ? item.description.substring(0, 100) + "..." : "",
            price: price,
            location: item.location,
            country: item.country,
            image: item.image && item.image.url ? item.image.url : (item.image && item.image[0] && item.image[0].url ? item.image[0].url : ""),
            rating: item.rating || 0,
            type: type,
            icon: icon,
            color: color,
            category: item.category || item.vehicleType || item.propertyType || "General"
        }
    };
};

// GET /api/map/data - Fetch all map data
router.get("/data", wrapAsync(async (req, res) => {
    const {
        minPrice,
        maxPrice,
        type, // 'all', 'listings', 'vehicles', 'dhabas'
        neLat, neLng, swLat, swLng // Bounds for future optimization
    } = req.query;

    let features = [];

    // Filter Logic
    const priceQuery = {};
    if (minPrice) priceQuery.$gte = parseInt(minPrice);
    if (maxPrice) priceQuery.$lte = parseInt(maxPrice);

    const filter = {};
    if (minPrice || maxPrice) filter.price = priceQuery;

    // Bounds filter (optional optimization for huge datasets)
    if (neLat && neLng && swLat && swLng) {
        filter.geometry = {
            $geoWithin: {
                $box: [
                    [parseFloat(swLng), parseFloat(swLat)],
                    [parseFloat(neLng), parseFloat(neLat)]
                ]
            }
        };
    }

    // Fetch Listings
    if (!type || type === 'all' || type === 'listings') {
        const listings = await Listing.find(filter).select('title description price location country geometry image rating propertyType');
        features.push(...listings.filter(l => l.geometry && l.geometry.coordinates && l.geometry.coordinates.length === 2).map(l => toGeoJSON(l, "listing")));
    }

    // Fetch Vehicles
    if (!type || type === 'all' || type === 'vehicles') {
        const vehicles = await Vehicle.find(filter).select('title description price location country geometry image rating vehicleType');
        features.push(...vehicles.filter(v => v.geometry && v.geometry.coordinates && v.geometry.coordinates.length === 2).map(v => toGeoJSON(v, "vehicle")));
    }

    // Fetch Dhabas
    if (!type || type === 'all' || type === 'dhabas') {
        const dhabas = await Dhaba.find(filter).select('title description price location country geometry image rating category cuisine');
        features.push(...dhabas.filter(d => d.geometry && d.geometry.coordinates && d.geometry.coordinates.length === 2).map(d => toGeoJSON(d, "dhaba")));
    }

    res.json({
        type: "FeatureCollection",
        features: features
    });
}));

module.exports = router;
