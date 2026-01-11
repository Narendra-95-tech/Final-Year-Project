const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function verify() {
    await mongoose.connect(MONGO_URL);

    console.log("Connected. Verifying...");

    const demoUser = await User.findOne({ username: "demo" });
    if (!demoUser) {
        console.error("❌ DEMO USER NOT FOUND!");
        return;
    }
    console.log(`✅ Found User: ${demoUser.username}`);

    const listingCount = await Listing.countDocuments({ owner: demoUser._id });
    console.log(`✅ Listings owned by demo: ${listingCount}`);

    if (listingCount > 0) {
        console.log("SUCCESS");
    } else {
        console.log("FAILURE: No listings found for demo user.");
    }

    mongoose.connection.close();
}

verify().catch(err => console.error(err));
