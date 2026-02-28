const Listing = require("./models/listing");
const Vehicle = require("./models/vehicle");
const Dhaba = require("./models/dhaba");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, vehicleSchema, dhabaSchema, reviewSchema } = require("./schema.js");

// Helper: detect if this request expects JSON (AJAX / fetch / API)
function isApiRequest(req) {
    // If headers explicitly ask for JSON, it's an API request
    if (req.xhr || req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
        return true;
    }

    // Specific URL patterns that are known to be fetch/API calls
    const url = req.originalUrl;
    return (
        url.startsWith('/api/') ||
        url.includes('/razorpay/') ||
        url.includes('/pay-wallet') ||
        url.includes('/pay-upi') ||
        url.includes('/social/journal') ||
        url.includes('/create-checkout-session') ||
        url.includes('/bookings/initiate') ||
        req.method === 'DELETE'
    );
}

module.exports.isLoggedIn = (req, res, next) => {
    // Diagnostic logging for booking/razorpay routes
    if (req.originalUrl.includes('/bookings') || req.originalUrl.includes('/razorpay')) {
        console.log(`[Auth Debug] ${req.method} ${req.originalUrl}`);
        console.log(`[Auth Debug] isAuthenticated: ${req.isAuthenticated()}`);
        console.log(`[Auth Debug] hasUser: ${!!req.user}`);
        console.log(`[Auth Debug] sessionID: ${req.sessionID}`);
        console.log(`[Auth Debug] cookie header present: ${!!req.headers.cookie}`);
        console.log(`[Auth Debug] cookie header: ${req.headers.cookie || 'NONE'}`);
    }

    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;

        // Context-aware flash message
        let message = "You must be logged in to create listing!";
        if (req.originalUrl.includes('/bookings')) {
            message = "You must be logged in to book!";
        } else if (req.originalUrl.includes('/reviews')) {
            message = "You must be logged in to leave a review!";
        } else if (req.originalUrl.includes('/wishlist')) {
            message = "You must be logged in to manage your wishlist!";
        }

        req.flash("error", message);

        // Handle AJAX/JSON requests — return JSON, not HTML redirect
        if (isApiRequest(req)) {
            return res.status(401).json({
                success: false,
                message: message,
                redirectUrl: "/login",
                error: "UNAUTHORIZED"
            });
        }

        return res.redirect("/login");
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "narendrabhute922@gmail.com";
    if (!req.isAuthenticated() || !req.user || req.user.role !== "admin" || req.user.email !== SUPER_ADMIN_EMAIL) {
        req.flash("error", "Access restricted to Master Admin only.");
        return res.redirect("/");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isEmailVerified = (req, res, next) => {
    if (req.user && !req.user.isVerified) {
        // Handle AJAX/JSON requests
        if (isApiRequest(req)) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email to continue.",
                redirectUrl: "/verify-otp",
                error: "EMAIL_NOT_VERIFIED"
            });
        }

        req.flash("error", "Please verify your email to continue.");
        return res.redirect("/verify-otp");
    }
    next();
};


module.exports.validateListing = (req, res, next) => {

    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }

};


module.exports.validateVehicle = (req, res, next) => {

    let { error } = vehicleSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }

};


module.exports.validateDhaba = (req, res, next) => {

    let { error } = dhabaSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }

};


module.exports.validateReview = (req, res, next) => {

    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }

};


module.exports.normalizeVehicleForm = (req, res, next) => {
    if (!req.body || !req.body.vehicle) {
        return next();
    }

    const vehicle = req.body.vehicle;

    if (typeof vehicle.features === "string") {
        vehicle.features = vehicle.features
            .split(",")
            .map((feature) => feature.trim())
            .filter(Boolean);
    } else if (Array.isArray(vehicle.features)) {
        vehicle.features = vehicle.features
            .map((feature) => (typeof feature === "string" ? feature.trim() : feature))
            .filter(Boolean);
    } else if (!vehicle.features) {
        vehicle.features = [];
    } else {
        vehicle.features = [vehicle.features];
    }

    if (typeof vehicle.availability === "string") {
        vehicle.availability = vehicle.availability === "true";
    }

    ["price", "pricePerHour", "securityDeposit", "year", "seats", "mileage"].forEach((key) => {
        if (vehicle[key] === "" || vehicle[key] === null) {
            delete vehicle[key];
        }
    });

    next();
};


module.exports.normalizeListingForm = (req, res, next) => {
    if (!req.body || !req.body.listing) {
        return next();
    }

    const listing = req.body.listing;

    const arrayify = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((item) => (typeof item === "string" ? item.trim() : item))
                .filter(Boolean);
        }
        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    };

    listing.amenities = arrayify(listing.amenities);
    listing.houseRules = arrayify(listing.houseRules);
    listing.safetyGuidelines = arrayify(listing.safetyGuidelines);

    ["price", "guests", "bedrooms", "beds", "bathrooms"].forEach((key) => {
        if (listing[key] === "" || listing[key] === null) {
            delete listing[key];
        } else if (typeof listing[key] === "string") {
            listing[key] = Number(listing[key]);
        }
    });

    next();
};


module.exports.normalizeDhabaForm = (req, res, next) => {
    if (!req.body || !req.body.dhaba) {
        return next();
    }

    const dhaba = req.body.dhaba;

    const arrayify = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((item) => (typeof item === "string" ? item.trim() : item))
                .filter(Boolean);
        }
        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    };

    dhaba.specialties = arrayify(dhaba.specialties);

    if (Array.isArray(dhaba.facilities)) {
        dhaba.facilities = dhaba.facilities
            .map((item) => (typeof item === "string" ? item.trim() : item))
            .filter(Boolean);
    } else if (typeof dhaba.facilities === "string") {
        dhaba.facilities = [dhaba.facilities.trim()].filter(Boolean);
    } else {
        dhaba.facilities = [];
    }

    if (typeof dhaba.isVegetarian === "string") {
        dhaba.isVegetarian = dhaba.isVegetarian === "true";
    }
    if (typeof dhaba.isVegan === "string") {
        dhaba.isVegan = dhaba.isVegan === "true";
    }

    if (dhaba.operatingHours) {
        if (typeof dhaba.operatingHours.isOpen24Hours === "string") {
            dhaba.operatingHours.isOpen24Hours = dhaba.operatingHours.isOpen24Hours === "true";
        }
    }

    ["rating", "price", "establishedYear"].forEach((key) => {
        if (dhaba[key] === "" || dhaba[key] === null) {
            delete dhaba[key];
        }
    });

    next();
};


module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    if (!res.locals.currUser._id.equals(review.author) && req.user.role !== 'admin') {
        req.flash("error", "You are not the author of this review");
        // Redirect to the appropriate path based on route
        if (req.originalUrl.includes('/listings/')) {
            return res.redirect(`/listings/${id}`);
        } else if (req.originalUrl.includes('/vehicles/')) {
            return res.redirect(`/vehicles/${id}`);
        } else if (req.originalUrl.includes('/dhabas/')) {
            return res.redirect(`/dhabas/${id}`);
        }
        return res.redirect('/');
    }
    next();
};

// Generic isOwner middleware that works with any model
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let model;

    // Determine which model to use based on the route
    if (req.originalUrl.includes('/listings/')) {
        model = Listing;
    } else if (req.originalUrl.includes('/vehicles/')) {
        model = Vehicle;
    } else if (req.originalUrl.includes('/dhabas/')) {
        model = Dhaba;
    } else {
        return next(new ExpressError(400, "Invalid route"));
    }

    let item = await model.findById(id);
    if (!item) {
        req.flash("error", "The item you are looking for does not exist");
        return res.redirect("/");
    }
    if (!item.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of this item");
        return res.redirect(req.originalUrl);
    }
    next();
};
