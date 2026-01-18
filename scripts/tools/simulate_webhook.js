const axios = require('axios');
const stripe = require('stripe');
const mongoose = require('mongoose');
const Booking = require('../../models/booking');

const path = require('path');
// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ENDPOINT_URL = 'http://localhost:8080/webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function simulateWebhook() {
    console.log('🚀 Starting Webhook Simulation...');

    if (!WEBHOOK_SECRET) {
        console.error('❌ Error: STRIPE_WEBHOOK_SECRET is missing in .env file.');
        console.log('👉 Please add: STRIPE_WEBHOOK_SECRET=whsec_test_secret to your .env file for this test.');
        process.exit(1);
    }

    // 1. Connect to DB to get a pending booking
    await mongoose.connect(process.env.ATLASDB_URL);

    // Find a pending booking or create one
    let booking = await Booking.findOne({ status: 'Pending', type: 'listing' });

    if (!booking) {
        console.log('⚠️ No pending booking found. Creating a dummy one...');
        // Create dummy if needed (simplified)
        // For now, let's assume one exists or just use a fake ID if the user wants to test just the route
        // But the controller looks up the booking, so we need a real ID.
        // Let's FAIL if no booking, prompting user to make one.
        console.error('❌ Please create a pending booking on the site first (go to checkout but do not pay).');
        process.exit(1);
    }

    console.log(`📝 Using Pending Booking ID: ${booking._id}`);
    await mongoose.disconnect();

    // 2. Create Payload
    const payload = {
        id: 'evt_test_webhook_' + Date.now(),
        object: 'event',
        api_version: '2022-11-15',
        created: Math.floor(Date.now() / 1000),
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'cs_test_' + Date.now(),
                object: 'checkout.session',
                amount_total: booking.totalPrice * 100,
                currency: 'inr',
                payment_status: 'paid',
                status: 'complete',
                metadata: {
                    bookingId: booking._id.toString(),
                    userId: booking.user.toString()
                },
                payment_intent: 'pi_test_' + Date.now()
            }
        }
    };

    const payloadString = JSON.stringify(payload, null, 2);

    // 3. Generate Valid Signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payloadString}`;

    const hmac = require('crypto').createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(signedPayload);
    const signature = hmac.digest('hex');

    const stripeSignature = `t=${timestamp},v1=${signature}`;

    console.log('🔐 Generated Valid Signature using secret:', WEBHOOK_SECRET);

    // 4. Send Request
    try {
        console.log(`📡 Sending POST to ${ENDPOINT_URL}...`);
        const response = await axios.post(ENDPOINT_URL, payloadString, {
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': stripeSignature
            }
        });

        console.log('✅ Webhook Delivered Successfully!');
        console.log('Response:', response.status, response.data);
        console.log('👉 Check your "Verifying Payment" browser tab - it should have flipped to Success!');
        console.log('👉 Check your Database - Booking should be Confirmed/Paid.');

    } catch (error) {
        console.error('❌ Webhook Failed:', error.message);
        if (error.response) {
            console.error('Server responded:', error.response.status, error.response.data);
        }
    }
}

simulateWebhook();
