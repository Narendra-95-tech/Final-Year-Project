require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');

const dbUrl = process.env.ATLASDB_URL;

async function seedCheapListing() {
    try {
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to database');

        const cheapListing = new Listing({
            title: "Cozy Budget Studio in Mumbai",
            description: "Perfect for backpackers! Small but clean studio near the station.",
            image: {
                url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3",
                filename: "listingimage"
            },
            price: 2500,
            location: "Andheri West, Mumbai",
            country: "India",
            propertyType: "Apartment",
            geometry: {
                type: 'Point',
                coordinates: [72.8311, 19.1136]
            },
            owner: '507f1f77bcf86cd799439011' // Using a dummy ID or existing user ID if known
        });

        await cheapListing.save();
        console.log('✅ Added "Cozy Budget Studio in Mumbai" for ₹2500');

    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await mongoose.connection.close();
    }
}

seedCheapListing();
