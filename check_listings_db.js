require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/listing');

const dbUrl = process.env.ATLASDB_URL;

async function checkListings() {
    try {
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to database');

        console.log('\n🔍 Check 1: All Mumbai Listings');
        const mumbaiListings = await Listing.find({
            $or: [
                { location: /mumbai/i },
                { title: /mumbai/i }
            ]
        }).select('title price location');

        console.log(`Found ${mumbaiListings.length} listings in Mumbai:`);
        mumbaiListings.forEach(l => console.log(`- ${l.title}: ₹${l.price}`));

        console.log('\n🔍 Check 2: Listings under 3000');
        const cheapListings = await Listing.find({ price: { $lte: 3000 } }).select('title price location');
        console.log(`Found ${cheapListings.length} listings under 3000 total:`);
        cheapListings.forEach(l => console.log(`- ${l.title} (${l.location}): ₹${l.price}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkListings();
