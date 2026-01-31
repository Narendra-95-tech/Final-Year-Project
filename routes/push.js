const express = require('express');
const router = express.Router();
const webpush = require('web-push');

// Store subscriptions in memory (in production, use database)
const subscriptions = new Map();

// VAPID keys for push notifications
// Generate with: npx web-push generate-vapid-keys
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

// Check if VAPID keys are configured
const isPushEnabled = vapidKeys.publicKey && vapidKeys.privateKey;

if (isPushEnabled) {
    try {
        // Configure web-push
        webpush.setVapidDetails(
            'mailto:' + (process.env.EMAIL_USER || 'admin@wanderlust.com'),
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log('✅ Push notifications enabled');
    } catch (error) {
        console.error('❌ Invalid VAPID keys. Push notifications disabled.');
        console.error('Generate keys with: npx web-push generate-vapid-keys');
    }
} else {
    console.log('⚠️  Push notifications disabled (VAPID keys not configured)');
    console.log('To enable: npx web-push generate-vapid-keys');
    console.log('Then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env');
}

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
    if (!isPushEnabled) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }
    res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
    if (!isPushEnabled) {
        return res.status(503).json({ success: false, error: 'Push notifications not configured' });
    }

    try {
        const subscription = req.body;

        // Store subscription (use user ID if logged in)
        const userId = req.user ? req.user._id.toString() : subscription.endpoint;
        subscriptions.set(userId, subscription);

        console.log(`✅ User ${userId} subscribed to push notifications`);

        // Send welcome notification
        const payload = JSON.stringify({
            title: 'Welcome to WanderLust! 🎉',
            body: 'You\'ll now receive updates about your bookings',
            icon: '/images/icon-192.png',
            badge: '/images/icon-72.png',
            data: {
                url: '/'
            }
        });

        await webpush.sendNotification(subscription, payload);

        res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        console.error('❌ Error subscribing:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', (req, res) => {
    try {
        const { endpoint } = req.body;

        // Remove subscription
        for (const [userId, sub] of subscriptions.entries()) {
            if (sub.endpoint === endpoint) {
                subscriptions.delete(userId);
                console.log(`✅ User ${userId} unsubscribed`);
                break;
            }
        }

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('❌ Error unsubscribing:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send notification to specific user
router.post('/send', async (req, res) => {
    try {
        const { userId, title, body, url, icon } = req.body;

        const subscription = subscriptions.get(userId);

        if (!subscription) {
            return res.status(404).json({ success: false, error: 'User not subscribed' });
        }

        const payload = JSON.stringify({
            title: title || 'WanderLust Notification',
            body: body || 'You have a new update',
            icon: icon || '/images/icon-192.png',
            badge: '/images/icon-72.png',
            data: {
                url: url || '/'
            }
        });

        await webpush.sendNotification(subscription, payload);

        console.log(`✅ Notification sent to user ${userId}`);
        res.json({ success: true, message: 'Notification sent' });
    } catch (error) {
        console.error('❌ Error sending notification:', error);

        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
            subscriptions.delete(req.body.userId);
        }

        res.status(500).json({ success: false, error: error.message });
    }
});

// Broadcast notification to all users
router.post('/broadcast', async (req, res) => {
    try {
        const { title, body, url, icon } = req.body;

        const payload = JSON.stringify({
            title: title || 'WanderLust Update',
            body: body || 'Check out what\'s new!',
            icon: icon || '/images/icon-192.png',
            badge: '/images/icon-72.png',
            data: {
                url: url || '/'
            }
        });

        const results = [];

        for (const [userId, subscription] of subscriptions.entries()) {
            try {
                await webpush.sendNotification(subscription, payload);
                results.push({ userId, success: true });
            } catch (error) {
                results.push({ userId, success: false, error: error.message });

                // Remove invalid subscriptions
                if (error.statusCode === 410) {
                    subscriptions.delete(userId);
                }
            }
        }

        console.log(`✅ Broadcast sent to ${results.filter(r => r.success).length} users`);
        res.json({ success: true, results });
    } catch (error) {
        console.error('❌ Error broadcasting:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get subscription count
router.get('/stats', (req, res) => {
    res.json({
        totalSubscriptions: subscriptions.size,
        subscribers: Array.from(subscriptions.keys())
    });
});

// Helper function to send booking confirmation notification
async function sendBookingConfirmation(userId, bookingDetails) {
    const subscription = subscriptions.get(userId);

    if (!subscription) {
        console.log(`User ${userId} not subscribed to notifications`);
        return;
    }

    const payload = JSON.stringify({
        title: '✅ Booking Confirmed!',
        body: `Your booking at ${bookingDetails.listingTitle} is confirmed`,
        icon: '/images/icon-192.png',
        badge: '/images/icon-72.png',
        data: {
            url: `/bookings/${bookingDetails.bookingId}`,
            bookingId: bookingDetails.bookingId
        }
    });

    try {
        await webpush.sendNotification(subscription, payload);
        console.log(`✅ Booking confirmation sent to user ${userId}`);
    } catch (error) {
        console.error('❌ Error sending booking notification:', error);
        if (error.statusCode === 410) {
            subscriptions.delete(userId);
        }
    }
}

// Export helper functions
module.exports = router;
module.exports.sendBookingConfirmation = sendBookingConfirmation;
module.exports.subscriptions = subscriptions;
