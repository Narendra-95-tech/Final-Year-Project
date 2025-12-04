const mongoose = require("mongoose");
const { sampleListings, sampleVehicles, sampleDhabas } = require("./data.js");
const Listing = require("../models/listing.js");
const Vehicle = require("../models/vehicle.js");
const Dhaba = require("../models/dhaba.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("connected to DB")
})
.catch((err) => {
    console.log(err);
});

async function main() { 
    await mongoose.connect(MONGO_URL);
    
}

const initDB = async () => {
    // Clear existing data
    await Listing.deleteMany({});
    await Vehicle.deleteMany({});
    await Dhaba.deleteMany({});

    // Add owner to all data
    const ownerId = "68d17d6ebd2bdc4e98ebf232";

    const listingsWithOwner = sampleListings.map((obj) => ({...obj, owner: ownerId}));
    const vehiclesWithOwner = sampleVehicles.map((obj) => ({...obj, owner: ownerId}));
    const dhabasWithOwner = sampleDhabas.map((obj) => ({...obj, owner: ownerId}));

    // Insert sample data
    await Listing.insertMany(listingsWithOwner);
    await Vehicle.insertMany(vehiclesWithOwner);
    await Dhaba.insertMany(dhabasWithOwner);

    console.log("✅ Data initialized successfully!");
    console.log(`   - ${sampleListings.length} listings`);
    console.log(`   - ${sampleVehicles.length} vehicles`);
    console.log(`   - ${sampleDhabas.length} dhabas`);
};

initDB();