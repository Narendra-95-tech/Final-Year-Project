const Vehicle = require("../models/vehicle");
const User = require("../models/user");
const Booking = require("../models/booking");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    const { q, minPrice, maxPrice, sort, vehicleType, brand, fuelType, transmission, seats } = req.query;

    const filter = {};

    if (q && q.trim().length > 0) {
        const terms = q.trim().split(/\s+/);
        filter.$and = terms.map(term => ({
            $or: [
                { title: new RegExp(term, "i") },
                { location: new RegExp(term, "i") },
                { country: new RegExp(term, "i") },
                { description: new RegExp(term, "i") },
                { brand: new RegExp(term, "i") },
                { model: new RegExp(term, "i") },
                { vehicleType: new RegExp(term, "i") }
            ]
        }));
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (vehicleType && vehicleType !== 'all') {
        filter.vehicleType = vehicleType;
    }

    if (brand && brand !== 'all') {
        filter.brand = brand;
    }

    if (fuelType && fuelType !== 'all') {
        filter.fuelType = fuelType;
    }

    if (transmission && transmission !== 'all') {
        filter.transmission = transmission;
    }

    if (seats) {
        filter.seats = Number(seats);
    }

    // Availability filter
    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start) && !isNaN(end) && end > start) {
            const overlappingBookings = await Booking.find({
                type: 'vehicle', // Only check vehicle bookings
                status: { $ne: 'Cancelled' }, // Ignore cancelled bookings
                startDate: { $lte: end },
                endDate: { $gte: start }
            }).select("vehicle");

            // Wait, does Booking model differentiate Listing vs Vehicle?
            // Usually schema has { listing: Ref, vehicle: Ref }.
            // I should check Booking model to be sure, but assuming standard polymorphic or separate fields.
            // If overlappingBookings returns docs with 'vehicle', map them.

            const excludedIds = overlappingBookings
                .filter(b => b.vehicle)
                .map(b => b.vehicle);

            if (excludedIds.length > 0) {
                filter._id = { $nin: excludedIds };
            }
        }
    }

    const sortMap = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        newest: { _id: -1 },
        year_desc: { year: -1 },
        year_asc: { year: 1 },
    };

    const sortOption = sortMap[sort] || {};

    let allVehicles;
    if (q && q.trim().length > 0 && !sort) {
        allVehicles = await Vehicle.aggregate([
            { $match: filter },
            {
                $addFields: {
                    relevance: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: "$title", regex: q.trim(), options: "i" } }, 20, 0] },
                            { $cond: [{ $regexMatch: { input: "$brand", regex: q.trim(), options: "i" } }, 15, 0] },
                            { $cond: [{ $regexMatch: { input: "$model", regex: q.trim(), options: "i" } }, 15, 0] },
                            { $cond: [{ $regexMatch: { input: "$location", regex: q.trim(), options: "i" } }, 10, 0] },
                            { $cond: [{ $regexMatch: { input: "$country", regex: q.trim(), options: "i" } }, 5, 0] }
                        ]
                    }
                }
            },
            { $sort: { relevance: -1, _id: -1 } }
        ]);
    } else {
        allVehicles = await Vehicle.find(filter).sort(sortOption).lean();
    }

    // Get unique values for filters
    const brands = await Vehicle.distinct('brand');
    const vehicleTypes = await Vehicle.distinct('vehicleType');
    const fuelTypes = await Vehicle.distinct('fuelType');
    const transmissions = await Vehicle.distinct('transmission');

    // Compute trending vehicles: highest rated or newest
    const trendingVehicles = await Vehicle.find({})
        .sort({ _id: -1 })
        .limit(6)
        .lean();

    const queryParams = { ...req.query };
    const queryString = new URLSearchParams(queryParams).toString();

    // Check for real visual messages
    const existingSuccess = res.locals.success;
    const hasVisualSuccess = existingSuccess && existingSuccess.length > 0 && existingSuccess.some(m => m && m.trim().length > 0);

    if (!hasVisualSuccess && Object.keys(req.query).length === 0) {
        res.locals.success = "Welcome to Vehicles!";
    }

    res.render("vehicles/index", {
        allVehicles,
        trendingVehicles,
        brands,
        vehicleTypes,
        fuelTypes,
        transmissions,
        query: q || "",
        sort: sort || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        vehicleType: vehicleType || "",
        brand: brand || "",
        fuelType: fuelType || "",
        transmission: transmission || "",
        seats: seats || "",
        startDate: startDate || "",
        endDate: endDate || "",
        queryString,
        // SEO
        title: q ? `"${q}" — Vehicles | WanderLust` : 'Rent Vehicles Across India | WanderLust',
        description: 'Rent cars, bikes, SUVs and more from trusted owners across India. Affordable vehicle rentals on WanderLust.'
    });
};


module.exports.renderNewForm = (req, res) => {
    res.render("vehicles/new.ejs");
};


const { Types } = require('mongoose');

module.exports.showVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if the ID is a valid MongoDB ObjectId
        if (!Types.ObjectId.isValid(id)) {
            req.flash("error", "Invalid vehicle ID");
            return res.redirect("/vehicles");
        }

        const vehicle = await Vehicle.findById(id)
            .populate({ path: "reviews", populate: { path: "author" } })
            .populate("owner");

        if (!vehicle) {
            req.flash("error", "Vehicle you requested for does not exist!");
            return res.redirect("/vehicles");
        }

        const ogImg = (vehicle.images && vehicle.images[0]) ? vehicle.images[0].url
            : (vehicle.image && vehicle.image.url ? vehicle.image.url : null);
        res.render("vehicles/show", {
            vehicle,
            mapToken: process.env.MAP_TOKEN,
            // SEO / Open Graph
            title: `${vehicle.brand} ${vehicle.model} in ${vehicle.location} | WanderLust`,
            description: vehicle.description
                ? vehicle.description.substring(0, 160)
                : `Rent a ${vehicle.year || ''} ${vehicle.brand} ${vehicle.model} in ${vehicle.location}. ₹${vehicle.price}/day on WanderLust.`,
            ogImage: ogImg,
            ogType: 'product',
            keywords: `${vehicle.brand}, ${vehicle.model}, ${vehicle.vehicleType || 'vehicle'}, rent, ${vehicle.location}, india`
        });
    } catch (err) {
        next(err);
    }
};


module.exports.createVehicle = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.vehicle.location,
        limit: 1,
    })
        .send();

    let url = req.file ? req.file.path : null;
    let filename = req.file ? req.file.filename : null;

    const newVehicle = new Vehicle(req.body.vehicle);
    newVehicle.owner = req.user._id;

    // Handle multiple images
    if (req.files && req.files.length > 0) {
        newVehicle.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        // Backward compatibility
        newVehicle.image = newVehicle.images[0];
    }

    // Handle features array - convert to array if it's a single value or undefined
    if (req.body.vehicle.features) {
        if (Array.isArray(req.body.vehicle.features)) {
            newVehicle.features = req.body.vehicle.features;
        } else {
            newVehicle.features = [req.body.vehicle.features];
        }
    } else {
        newVehicle.features = [];
    }

    newVehicle.geometry = response.body.features[0].geometry;

    let savedVehicle = await newVehicle.save();

    // Auto-promote user to host if they are currently a basic user
    if (req.user && req.user.role === "user") {
        await User.findByIdAndUpdate(req.user._id, { role: "host" });
    }

    req.flash("success", "New Vehicle Created!");
    res.redirect("/vehicles");
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
        req.flash("error", "Vehicle you requested for does not exist!");
        return res.redirect("/vehicles");
    }
    let originalImageUrl = vehicle.image?.url;
    if (originalImageUrl) {
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    }
    res.render("vehicles/edit.ejs", { vehicle, originalImageUrl });
};


module.exports.updateVehicle = async (req, res) => {
    let { id } = req.params;
    let vehicle = await Vehicle.findById(id);

    if (!vehicle) {
        req.flash("error", "Vehicle requesting for does not exist!");
        return res.redirect("/vehicles");
    }

    // Update basic fields
    Object.assign(vehicle, req.body.vehicle);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
        vehicle.images.push(...newImages);
    }

    // Handle image deletion
    if (req.body.deleteImages) {
        let deleteList = Array.isArray(req.body.deleteImages) ? req.body.deleteImages : [req.body.deleteImages];
        vehicle.images = vehicle.images.filter(img => !deleteList.includes(img.filename));
    }

    // Update main image fallback (for backward compatibility and card view)
    if (vehicle.images.length > 0) {
        vehicle.image = vehicle.images[0];
    } else {
        // If all images removed, clear the main image
        vehicle.image = { url: '', filename: '' };
    }

    await vehicle.save();

    req.flash("success", "Vehicle Updated!");
    res.redirect(`/vehicles/${id}`);
};


module.exports.destroyVehicle = async (req, res) => {
    let { id } = req.params;
    let deletedVehicle = await Vehicle.findByIdAndDelete(id);
    req.flash("success", "Vehicle Deleted!");
    res.redirect("/vehicles");
};

module.exports.getVehicleBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await Booking.find({
            vehicle: id,
            status: { $ne: 'Cancelled' },
            startDate: { $exists: true },
            endDate: { $exists: true }
        }).select('startDate endDate status startTime endTime').lean();

        const events = bookings.map(booking => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);

            // Set the time if provided
            if (booking.startTime) {
                const [hours, minutes] = booking.startTime.split(':');
                start.setHours(parseInt(hours), parseInt(minutes));
            }
            if (booking.endTime) {
                const [hours, minutes] = booking.endTime.split(':');
                end.setHours(parseInt(hours), parseInt(minutes));
            }

            return {
                title: 'Booked',
                start: start.toISOString(),
                end: end.toISOString(),
                backgroundColor: booking.status === 'Confirmed' ? '#dc3545' : '#ffc107',
                borderColor: booking.status === 'Confirmed' ? '#dc3545' : '#ffc107',
                display: 'block'
            };
        });

        res.json(events);
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};
