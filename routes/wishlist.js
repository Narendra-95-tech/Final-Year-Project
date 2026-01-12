/**
 * Wishlist Routes
 * Add/remove listings from user wishlist
 */

const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware');
const User = require('../models/user');

// Helper to get target field
const getTargetField = (type) => {
    switch (type) {
        case 'vehicle': return 'wishlistVehicles';
        case 'dhaba': return 'wishlistDhabas';
        default: return 'wishlist'; // default to listing
    }
};

// Add to wishlist
router.post('/:type/:id', isLoggedIn, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user._id;
        const targetField = getTargetField(type);

        const update = {};
        update[targetField] = id;

        await User.findByIdAndUpdate(userId, {
            $addToSet: update
        });

        res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to add to wishlist' });
    }
});

// Remove from wishlist
router.delete('/:type/:id', isLoggedIn, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user._id;
        const targetField = getTargetField(type);

        const update = {};
        update[targetField] = id;

        await User.findByIdAndUpdate(userId, {
            $pull: update
        });

        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
    }
});

// Bulk remove from wishlist
router.delete('/bulk', isLoggedIn, async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, type }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'No items provided' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        for (const item of items) {
            const { id, type } = item;
            const targetField = getTargetField(type);

            // Pull the ID from the corresponding wishlist array
            user[targetField] = user[targetField].filter(itemId => itemId.toString() !== id);
        }

        await user.save();
        res.json({ success: true, message: 'Wishlist updated successfully' });
    } catch (error) {
        console.error('Error bulk removing from wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to update wishlist' });
    }
});

// Get user's wishlist IDs for syncing
router.get('/all', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const wishlist = {
            listing: user.wishlist || [],
            vehicle: user.wishlistVehicles || [],
            dhaba: user.wishlistDhabas || []
        };
        res.json({ success: true, wishlist });
    } catch (error) {
        console.error('Error getting wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to get wishlist' });
    }
});

module.exports = router;
