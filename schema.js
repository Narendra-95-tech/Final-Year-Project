const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().required(),
        description : Joi.string().required(),
        location : Joi.string().required(),
        country : Joi.string().required(),
        price : Joi.number().required().min(0),
        image : Joi.string().allow("", null),
        geometry: Joi.object({
            type: Joi.string().required(),
            coordinates: Joi.array().items(Joi.number()).required()
        }).optional()
    }).required()
});

module.exports.vehicleSchema = Joi.object({
    vehicle: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        vehicleType: Joi.string().valid('car', 'bike', 'van', 'truck', 'scooter').required(),
        brand: Joi.string().required(),
        model: Joi.string().required(),
        year: Joi.number().required().min(1900).max(new Date().getFullYear() + 1),
        fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid').required(),
        transmission: Joi.string().valid('manual', 'automatic').required(),
        seats: Joi.number().required().min(1).max(20),
        mileage: Joi.number().min(0),
        features: Joi.array().items(Joi.string()),
        availability: Joi.boolean(),
        image: Joi.string().allow('', null),
        geometry: Joi.object({
            type: Joi.string().required(),
            coordinates: Joi.array().items(Joi.number()).required()
        }).optional()
    }).required()
});

module.exports.dhabaSchema = Joi.object({
    dhaba: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().allow('', null),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        country: Joi.string().required(),
        cuisine: Joi.string().valid('North Indian', 'South Indian', 'Punjabi', 'Chinese', 'Multi-Cuisine', 'Street Food', 'Rajasthani', 'Gujarati', 'Bengali', 'Continental').required(),
        category: Joi.string().valid('Fine Dining', 'Casual Dining', 'Fast Food', 'Cafe', 'Food Truck', 'Buffet', 'Family Restaurant').required(),
        establishedYear: Joi.number().min(1900).max(new Date().getFullYear()),
        operatingHours: Joi.object({
            opens: Joi.string().required(),
            closes: Joi.string().required(),
            isOpen24Hours: Joi.boolean()
        }),
        specialties: Joi.array().items(Joi.string()),
        facilities: Joi.array().items(Joi.string()),
        phone: Joi.string().required(),
        email: Joi.string().email().allow('', null),
        website: Joi.string().uri().allow('', null),
        isVegetarian: Joi.boolean(),
        isVegan: Joi.boolean(),
        rating: Joi.number().min(1).max(5),
        image: Joi.string().allow('', null),
        geometry: Joi.object({
            type: Joi.string().required(),
            coordinates: Joi.array().items(Joi.number()).required()
        }).allow(null)
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),

    }).required(),

});