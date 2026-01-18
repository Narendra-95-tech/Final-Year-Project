if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const mongoose = require('mongoose');
const Listing = require('../../models/listing');

const ATLAS_URL = process.env.ATLASDB_URL;

console.log("Connecting to Atlas...");
mongoose.connect(ATLAS_URL)
    .then(async () => {
        console.log("Connected.");
        const listings = await Listing.find({}).sort({ _id: -1 }).limit(5);
        console.log('--- NEWEST 5 LISTINGS IN ATLAS ---');
        listings.forEach(l => console.log(`- ${l.title} (Location: ${l.location})`));
        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Connection Error:", err);
        process.exit(1);
    });
