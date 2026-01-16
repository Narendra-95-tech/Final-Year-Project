const Review = require("../models/review");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

module.exports.createReview = async (req, res) => {
    let model, redirectPath;

    // Determine which model to use based on the route
    let modelTypeStr;
    if (req.originalUrl.includes('/listings/')) {
        model = Listing;
        redirectPath = `/listings/${req.params.id}`;
        modelTypeStr = 'Listing';
    } else if (req.originalUrl.includes('/vehicles/')) {
        model = Vehicle;
        redirectPath = `/vehicles/${req.params.id}`;
        modelTypeStr = 'Vehicle';
    } else if (req.originalUrl.includes('/dhabas/')) {
        model = Dhaba;
        redirectPath = `/dhabas/${req.params.id}`;
        modelTypeStr = 'Dhaba';
    } else {
        return res.status(400).json({ error: "Invalid route" });
    }

    let item = await model.findById(req.params.id);
    if (!item) {
        req.flash("error", "Item not found!");
        return res.redirect("/");
    }

    // Prevent owner from reviewing their own item
    if (item.owner.equals(req.user._id)) {
        req.flash("error", "You cannot review your own listing!");
        return res.redirect(redirectPath);
    }

    let newReview = new Review({
        rating: req.body.review.rating,
        comment: req.body.review.comment,
        modelType: modelTypeStr
    });

    // Set the specific parent reference
    if (modelTypeStr === 'Listing') newReview.listing = item._id;
    if (modelTypeStr === 'Vehicle') newReview.vehicle = item._id;
    if (modelTypeStr === 'Dhaba') newReview.dhaba = item._id;

    // Handle Image Uploads
    if (req.files) {
        newReview.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    }

    newReview.author = req.user._id;

    // "Verified Stay" Logic
    const Booking = require("../models/booking");
    // Find a confirmed booking for this user and this item
    const existingBooking = await Booking.findOne({
        user: req.user._id,
        [req.originalUrl.includes('/listings/') ? 'listing' : req.originalUrl.includes('/vehicles/') ? 'vehicle' : 'dhaba']: item._id,
        status: { $in: ['Confirmed', 'Paid', 'Completed'] } // Check for valid status
    });

    if (existingBooking) {
        newReview.isVerified = true;
    }

    item.reviews.push(newReview);

    await newReview.save();
    await item.save();
    req.flash("success", "New Review Created!");

    res.redirect(redirectPath);
};

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    let model, redirectPath;

    // Determine which model to use based on the route
    if (req.originalUrl.includes('/listings/')) {
        model = Listing;
        redirectPath = `/listings/${id}`;
    } else if (req.originalUrl.includes('/vehicles/')) {
        model = Vehicle;
        redirectPath = `/vehicles/${id}`;
    } else if (req.originalUrl.includes('/dhabas/')) {
        model = Dhaba;
        redirectPath = `/dhabas/${id}`;
    } else {
        return res.status(400).json({ error: "Invalid route" });
    }

    await model.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");

    if (req.query.origin === 'profile') {
        return res.redirect('/profile');
    }
    if (req.query.origin === 'reviews_page') {
        return res.redirect('/profile/reviews');
    }
    res.redirect(redirectPath);
};