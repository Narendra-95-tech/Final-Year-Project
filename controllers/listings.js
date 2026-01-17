const Listing = require('../models/listing');
const Booking = require('../models/booking');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    const { q, minPrice, maxPrice, sort, category, startDate, endDate, guests } = req.query;
    const queryParams = { ...req.query };

    const filter = {};

    if (q && q.trim().length > 0) {
        const terms = q.trim().split(/\s+/);
        filter.$and = terms.map(term => ({
            $or: [
                { title: new RegExp(term, "i") },
                { location: new RegExp(term, "i") },
                { country: new RegExp(term, "i") },
                { description: new RegExp(term, "i") },
                { propertyType: new RegExp(term, "i") }
            ]
        }));
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (guests) {
        // Filter listings that can accommodate at least 'guests' number of people
        filter.guests = { $gte: Number(guests) };
    }

    const sortMap = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        newest: { _id: -1 },
    };

    const sortOption = sortMap[sort] || {};

    // Category filter: rely on tags in description/title/location/country keywords for now
    if (category && category.trim()) {
        const cat = category.trim().toLowerCase();
        const catRegex = new RegExp(cat.replace(/[-_\s]+/g, ".*"), "i");
        filter.$or = (filter.$or || []).concat([
            { title: catRegex },
            { description: catRegex },
            { location: catRegex },
            { country: catRegex }
        ]);
    }

    // Availability filter: exclude listings with overlapping bookings
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start) && !isNaN(end) && end > start) {
            const overlappingBookings = await Booking.find({
                $or: [
                    { startDate: { $lte: end } },
                    { endDate: { $gte: start } }
                ]
            }).select("listing");
            const excludedListingIds = overlappingBookings.map(b => b.listing);
            if (excludedListingIds.length > 0) {
                filter._id = { $nin: excludedListingIds };
            }
        }
    }

    let allListings;
    if (q && q.trim().length > 0 && !sort) {
        // Advanced Relevance Scoring using Aggregation
        allListings = await Listing.aggregate([
            { $match: filter },
            {
                $addFields: {
                    relevance: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: "$title", regex: q.trim(), options: "i" } }, 20, 0] },
                            { $cond: [{ $regexMatch: { input: "$location", regex: q.trim(), options: "i" } }, 10, 0] },
                            { $cond: [{ $regexMatch: { input: "$country", regex: q.trim(), options: "i" } }, 5, 0] },
                            { $cond: [{ $regexMatch: { input: "$description", regex: q.trim(), options: "i" } }, 2, 0] }
                        ]
                    }
                }
            },
            { $sort: { relevance: -1, _id: -1 } }
        ]);
    } else {
        allListings = await Listing.find(filter).sort(sortOption).lean();
    }

    // Compute a simple trending list: highest price items today
    const trendingListings = await Listing.find({})
        .sort({ price: -1 })
        .limit(6)
        .lean();

    // Check for real visual messages
    const existingSuccess = res.locals.success;
    const hasVisualSuccess = existingSuccess && existingSuccess.length > 0 && existingSuccess.some(m => m && m.trim().length > 0);

    if (!hasVisualSuccess && (Object.keys(req.query).length === 0)) {
        res.locals.success = "Welcome to Listings!";
    }

    res.render("listings/index", {
        allListings,
        trendingListings,
        query: q || "",
        sort: sort || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        category: category || "",
        startDate: startDate || "",
        endDate: endDate || "",
        guests: guests || "",
        queryParams
    });
};

module.exports.getMapData = async (req, res) => {
    try {
        // Return only necessary fields for map pins to reduce payload
        const listings = await Listing.find({})
            .select('title price location geometry image rating description')
            .lean();

        res.json(listings);
    } catch (err) {
        console.error('Map data error:', err);
        res.status(500).json({ error: 'Failed to fetch map data' });
    }
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs")
};


module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        req.flash("error", "Invalid listing ID!");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author", }, }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show", { listing, mapToken: process.env.MAP_TOKEN });
};


module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
        .send();


    // let {title, description,image, price, country, location }= req.body;

    // Handle multiple images
    const images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Set the legacy image field to the first image for backward compatibility
    if (images.length > 0) {
        newListing.image = images[0];
        newListing.images = images; // Populate the new images array
    }

    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });

};


module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.files !== "undefined" && req.files.length > 0) {
        const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));

        // Push new images to the array
        listing.images.push(...newImages);

        // Update the legacy image field to the first of the new batch (or keep old if needed, but this ensures a valid legacy image is set)
        listing.image = newImages[0];

        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);

};


module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings")
};

module.exports.getListingBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await Booking.find({
            listing: id,
            status: { $ne: 'Cancelled' },
            startDate: { $exists: true },
            endDate: { $exists: true }
        }).select('startDate endDate status').lean();

        const events = bookings.map(booking => ({
            title: 'Booked',
            start: booking.startDate,
            end: booking.endDate,
            backgroundColor: booking.status === 'Confirmed' ? '#dc3545' : '#ffc107',
            borderColor: booking.status === 'Confirmed' ? '#dc3545' : '#ffc107',
            display: 'block'
        }));

        res.json(events);
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};