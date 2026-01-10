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
        const regex = new RegExp(q.trim(), "i");
        filter.$or = [
            { title: regex },
            { location: regex },
            { country: regex },
            { description: regex }
        ];
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
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

    const allListings = await Listing.find(filter).sort(sortOption);

    // Compute a simple trending list: highest price items today
    const trendingListings = await Listing.find({})
        .sort({ price: -1 })
        .limit(6);

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
    console.log(listing);
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
    console.log(savedListing);

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
    console.log(deletedListing);
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
        }).select('startDate endDate status');

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