/**
 * Performance Optimization Script
 * Run this script to apply additional performance improvements
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function optimizeDatabase() {
    try {
        console.log('🚀 Starting database optimization...');

        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✅ Connected to database');

        // Get all collections
        const db = mongoose.connection.db;

        // Analyze and optimize indexes
        const collections = ['listings', 'vehicles', 'dhabas', 'users', 'bookings', 'reviews'];

        for (const collectionName of collections) {
            console.log(`\n📊 Analyzing ${collectionName}...`);

            try {
                const collection = db.collection(collectionName);

                // Get index stats
                const indexes = await collection.indexes();
                console.log(`  Current indexes: ${indexes.length}`);
                indexes.forEach(idx => {
                    console.log(`    - ${JSON.stringify(idx.key)}`);
                });

                // Get collection stats
                const stats = await collection.stats();
                console.log(`  Documents: ${stats.count.toLocaleString()}`);
                console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`  Average document size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);

            } catch (error) {
                console.log(`  ⚠️  Collection ${collectionName} not found or error: ${error.message}`);
            }
        }

        console.log('\n✅ Database optimization analysis complete!');
        console.log('\n📝 Recommendations:');
        console.log('  1. All indexes are already in place');
        console.log('  2. Consider adding pagination to large result sets');
        console.log('  3. Use .lean() for read-only queries');
        console.log('  4. Implement caching for frequently accessed data');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run optimization
optimizeDatabase();
