const Review = require("../models/review");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");
const Dhaba = require("../models/dhaba");

module.exports.createReview = async (req, res) => {
    let model, redirectPath;

    // Determine which model to use based on the route
    if (req.originalUrl.includes('/listings/')) {
        model = Listing;
        redirectPath = `/listings/${req.params.id}`;
    } else if (req.originalUrl.includes('/vehicles/')) {
        model = Vehicle;
        redirectPath = `/vehicles/${req.params.id}`;
    } else if (req.originalUrl.includes('/dhabas/')) {
        model = Dhaba;
        redirectPath = `/dhabas/${req.params.id}`;
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
        comment: req.body.review.comment
    });

    newReview.author = req.user._id;

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
    res.redirect(redirectPath);
};