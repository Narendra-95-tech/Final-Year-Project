/**
 * Database Index Creation Script
 * Run this script to add performance-optimized indexes
 * Usage: node scripts/add-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Listing = require('../models/listing');
const Vehicle = require('../models/vehicle');
const Dhaba = require('../models/dhaba');
const User = require('../models/user');
const Booking = require('../models/booking');

const dbUrl = process.env.ATLASDB_URL;

async function addIndexes() {
    try {
        console.log('🔗 Connecting to database...');
        await mongoose.connect(dbUrl);
        console.log('✅ Connected to database\n');

        console.log('📊 Creating indexes...\n');

        // Listing Indexes
        console.log('Creating Listing indexes...');
        await Listing.collection.createIndex({ isTrending: 1, createdAt: -1 }, { background: true });
        await Listing.collection.createIndex({ 'availabilitySettings.minStay': 1, price: 1 }, { background: true });
        await Listing.collection.createIndex({ location: 1, country: 1 }, { background: true });
        console.log('✅ Listing indexes created\n');

        // Vehicle Indexes
        console.log('Creating Vehicle indexes...');
        await Vehicle.collection.createIndex({ title: 'text', location: 'text', brand: 'text', model: 'text' }, { background: true });
        await Vehicle.collection.createIndex({ vehicleType: 1, price: 1 }, { background: true });
        await Vehicle.collection.createIndex({ brand: 1, model: 1 }, { background: true });
        await Vehicle.collection.createIndex({ owner: 1 }, { background: true });
        await Vehicle.collection.createIndex({ createdAt: -1 }, { background: true });
        await Vehicle.collection.createIndex({ location: 1, price: 1 }, { background: true });
        console.log('✅ Vehicle indexes created\n');

        // Dhaba Indexes
        console.log('Creating Dhaba indexes...');
        await Dhaba.collection.createIndex({ title: 'text', location: 'text', cuisine: 'text' }, { background: true });
        await Dhaba.collection.createIndex({ cuisine: 1, price: 1 }, { background: true });
        await Dhaba.collection.createIndex({ category: 1 }, { background: true });
        await Dhaba.collection.createIndex({ owner: 1 }, { background: true });
        await Dhaba.collection.createIndex({ createdAt: -1 }, { background: true });
        await Dhaba.collection.createIndex({ location: 1, price: 1 }, { background: true });
        console.log('✅ Dhaba indexes created\n');

        // User Indexes
        console.log('Creating User indexes...');
        await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
        await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true, background: true });
        await User.collection.createIndex({ role: 1 }, { background: true });
        await User.collection.createIndex({ createdAt: -1 }, { background: true });
        console.log('✅ User indexes created\n');

        // Booking Indexes
        console.log('Creating Booking indexes...');
        await Booking.collection.createIndex({ user: 1, createdAt: -1 }, { background: true });
        await Booking.collection.createIndex({ listing: 1, startDate: 1, endDate: 1 }, { background: true });
        await Booking.collection.createIndex({ vehicle: 1, startDate: 1, endDate: 1 }, { background: true });
        await Booking.collection.createIndex({ dhaba: 1, bookingDate: 1 }, { background: true });
        await Booking.collection.createIndex({ status: 1 }, { background: true });
        await Booking.collection.createIndex({ paymentStatus: 1 }, { background: true });
        console.log('✅ Booking indexes created\n');

        // List all indexes
        console.log('📋 Verifying indexes...\n');

        const listingIndexes = await Listing.collection.indexes();
        console.log(`Listing indexes (${listingIndexes.length}):`, listingIndexes.map(i => i.name).join(', '));

        const vehicleIndexes = await Vehicle.collection.indexes();
        console.log(`Vehicle indexes (${vehicleIndexes.length}):`, vehicleIndexes.map(i => i.name).join(', '));

        const dhabaIndexes = await Dhaba.collection.indexes();
        console.log(`Dhaba indexes (${dhabaIndexes.length}):`, dhabaIndexes.map(i => i.name).join(', '));

        const userIndexes = await User.collection.indexes();
        console.log(`User indexes (${userIndexes.length}):`, userIndexes.map(i => i.name).join(', '));

        const bookingIndexes = await Booking.collection.indexes();
        console.log(`Booking indexes (${bookingIndexes.length}):`, bookingIndexes.map(i => i.name).join(', '));

        console.log('\n✨ All indexes created successfully!');
        console.log('💡 Indexes were created in the background to avoid blocking operations.');

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    addIndexes();
}

module.exports = { addIndexes };
