const mongoose = require('mongoose');
const User = require('../models/user');
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const dbUrl = process.env.ATLASDB_URL;

async function checkDuplicates() {
    await mongoose.connect(dbUrl);
    console.log("Connected to DB");

    const users = await User.find({ stripeAccountId: { $exists: true, $ne: null } });
    console.log(`Found ${users.length} users with Stripe Account IDs.`);

    const map = new Map();
    const duplicates = [];

    users.forEach(user => {
        if (map.has(user.stripeAccountId)) {
            duplicates.push({
                stripeId: user.stripeAccountId,
                users: [map.get(user.stripeAccountId), user.username]
            });
        } else {
            map.set(user.stripeAccountId, user.username);
        }
    });

    if (duplicates.length > 0) {
        console.log("Found duplicates! This is likely the cause of the issue.");
        console.log(JSON.stringify(duplicates, null, 2));
    } else {
        console.log("No duplicate Stripe Account IDs found.");
    }

    mongoose.connection.close();
}

checkDuplicates();
