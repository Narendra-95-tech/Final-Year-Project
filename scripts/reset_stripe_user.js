const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config(); // Load from CWD (Project Root)

// Hardcode DB URL if .env fails or use the one from the app
const dbUrl = process.env.ATLASDB_URL;

async function fixUser() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");

        const userId = "696b4e26d31460f03e9c8d04";
        const user = await User.findById(userId);

        if (user) {
            console.log(`Found User: ${user.username} (${user.email})`);
            console.log(`Current Stripe Account: ${user.stripeAccountId}`);

            user.stripeAccountId = undefined; // Clear it
            user.payoutsEnabled = false;
            await user.save();

            console.log("✅ CLEARED stripeAccountId. User is ready to re-onboard.");
        } else {
            console.log("❌ User not found!");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        mongoose.connection.close();
    }
}

fixUser();
