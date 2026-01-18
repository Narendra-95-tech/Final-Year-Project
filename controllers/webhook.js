const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/booking");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");

// Helper to get socket instance
const getIo = (req) => req.app.get('io');

exports.handleWebhook = wrapAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify signature using the raw body
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const io = getIo(req);

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object, io);
            break;

        case 'charge.refunded':
            await handleChargeRefunded(event.data.object, io);
            break;

        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object, io);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
});

async function handleCheckoutSessionCompleted(session, io) {
    const bookingId = session.metadata.bookingId;
    console.log(`💰 Payment succeeded for booking: ${bookingId}`);

    if (bookingId) {
        const booking = await Booking.findById(bookingId)
            .populate('listing')
            .populate('vehicle')
            .populate('dhaba')
            .populate('user');

        if (booking) {
            // Idempotency check: If already paid, stop processing
            if (booking.isPaid) {
                console.log(`Booking ${bookingId} already paid. Skipping webhook processing.`);
                return;
            }

            booking.paymentStatus = 'Paid';
            booking.isPaid = true;
            booking.status = 'Confirmed';
            booking.paymentIntentId = session.payment_intent;
            booking.stripeSessionId = session.id;
            booking.paymentDate = new Date();
            await booking.save();

            // Emit Real-time Success Event
            if (io && booking.user) {
                // Emit to specific user room or socket
                // Assuming we join users to room 'user_<userId>' on connection, or iterate connected sockets
                // For simplicity, we can broadcast or look up socket if available in app.js map
                // But typically, emitting to a room named by userID is best practice.
                // In app.js, we have 'connectedUsers' map. We need a way to access it or just use io.emit for now if low scale.
                // Better: We see app.js sets connectedUsers. We can try to access it if exposed? 
                // Alternatively, client side listens for 'payment_confirmed_<bookingId>'
                io.emit(`payment_confirmed_${bookingId}`, {
                    status: 'Confirmed',
                    bookingId: booking._id
                });
            }

            // Trigger Notifications (Email/In-app) - Reusing logic from controllers would be DRY, 
            // but for now let's ensure core data is updated.
            // Sending emails here is good practice to ensure they go out even if user closed browser.
            try {
                const { sendBookingConfirmation, sendPaymentReceipt, sendOwnerBookingAlert } = require('../utils/emailService');
                const Notification = require('../models/notification');

                // Notify Guest
                if (booking.user && booking.user.email) {
                    sendBookingConfirmation(booking, booking.user).catch(console.error);
                    sendPaymentReceipt(booking, booking.user).catch(console.error);
                }

                // Notify Owner
                const item = booking.listing || booking.dhaba || booking.vehicle;
                if (item && item.owner) {
                    if (item.owner.email) sendOwnerBookingAlert(booking, item.owner, booking.user).catch(console.error);
                    Notification.createNotification(
                        item.owner._id,
                        booking.user._id,
                        'booking',
                        { content: `New confirmed booking for ${item.title}`, link: `/bookings/${booking._id}` }
                    ).catch(console.error);
                }
            } catch (e) {
                console.error("Webhook notification error:", e);
            }
        }
    }
}

async function handleChargeRefunded(charge, io) {
    // Need to find booking by payment_intent
    const paymentIntentId = charge.payment_intent;
    const booking = await Booking.findOne({ paymentIntentId: paymentIntentId });

    if (booking) {
        console.log(`💸 Refund processed for booking: ${booking._id}`);
        booking.paymentStatus = 'Refunded';
        booking.status = 'Cancelled'; // Ensure it is cancelled if refunded
        await booking.save();

        if (io) {
            io.emit(`booking_updated_${booking._id}`, { status: 'Cancelled', paymentStatus: 'Refunded' });
        }
    }
}

async function handlePaymentFailed(paymentIntent, io) {
    // Find booking and mark as failed?
    // Typically we might not have the booking ID easily on payment_intent unless we put it in metadata there too.
    // session.metadata puts it on the *session*. payment_intent also has metadata if we pass it during creation.
    // For now, checkout.session.completed is the happy path we care most about.
}
