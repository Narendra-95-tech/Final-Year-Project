/**
 * Wishlist Routes
 * Add/remove listings from user wishlist
 */

const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware');
const User = require('../models/user');

// Add to wishlist
router.post('/:listingId', isLoggedIn, async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $addToSet: { wishlist: listingId }
        });

        res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to add to wishlist' });
    }
});

// Remove from wishlist
router.delete('/:listingId', isLoggedIn, async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: listingId }
        });

        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
    }
});

// Get user's wishlist
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json({ success: true, wishlist: user.wishlist || [] });
    } catch (error) {
        console.error('Error getting wishlist:', error);
        res.status(500).json({ success: false, error: 'Failed to get wishlist' });
    }
});

module.exports = router;
