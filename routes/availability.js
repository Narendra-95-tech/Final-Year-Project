const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, isOwner } = require('../middleware');
const availabilityController = require('../controllers/availability');

// Analytics
router.get(
    '/analytics',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.getAvailabilityAnalytics)
);

// Bulk Operations
router.post(
    '/bulk',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.bulkUpdateAvailability)
);

// Recurring Patterns
router.post(
    '/recurring-blocks',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.applyRecurringPattern)
);

router.delete(
    '/recurring-blocks/:blockId',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.removeRecurringPattern)
);

// Pricing Variations
router.get(
    '/pricing-variations',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.getPricingVariations)
);

router.post(
    '/pricing-variations',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.addPricingVariation)
);

router.delete(
    '/pricing-variations/:variationId',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.removePricingVariation)
);

// Export
router.get(
    '/export',
    isLoggedIn,
    isOwner,
    wrapAsync(availabilityController.exportAvailability)
);

module.exports = router;
