const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const Vehicle = require("../models/vehicle.js");
const Dhaba = require("../models/dhaba.js");
const User = require("../models/user.js");

// Force load env vars
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: "../.env" });
    require("dotenv").config();
}

const ATLAS_URL = process.env.ATLASDB_URL;

if (!ATLAS_URL) {
    console.error("❌ Error: ATLASDB_URL is not defined in .env file!");
    process.exit(1);
}

console.log("🚀 Initializing Atlas Seeding...");
console.log(`Target Database: MongoDB Atlas`);

async function main() {
    try {
        await mongoose.connect(ATLAS_URL);
        console.log("✅ Connected to Atlas");
        await seedDemo();
    } catch (err) {
        console.error("❌ Connection Failed:", err);
    } finally {
        mongoose.connection.close();
    }
}

const seedDemo = async () => {
    try {
        console.log("Cleaning up Atlas database...");
        await Listing.deleteMany({});
        await Vehicle.deleteMany({});
        await Dhaba.deleteMany({});

        // Create or Find Demo User
        const demoUsername = "demo";
        const demoEmail = "demo@demo.com";
        const demoPassword = "demo";

        let demoUser = await User.findOne({ username: demoUsername });

        if (!demoUser) {
            console.log("Creating new demo user...");
            const newUser = new User({
                email: demoEmail,
                username: demoUsername,
                firstName: "Demo",
                lastName: "User"
            });
            demoUser = await User.register(newUser, demoPassword);
            console.log(`User ${demoUsername} created with ID: ${demoUser._id}`);
        } else {
            console.log(`User ${demoUsername} already exists.`);
            await demoUser.setPassword(demoPassword);
            await demoUser.save();
            console.log(`Password reset for 'demo'.`);
        }

        const ownerId = demoUser._id;

        // Prepare Bulk Data
        const createWithRandomPrice = (item) => ({
            ...item,
            owner: ownerId,
            price: item.price + Math.floor(Math.random() * 500)
        });

        const listingsWithOwner = [
            ...initData.sampleListings.map(obj => ({ ...obj, owner: ownerId })),
            ...initData.sampleListings.map(createWithRandomPrice)
        ];

        const vehiclesWithOwner = [
            ...initData.sampleVehicles.map(obj => ({ ...obj, owner: ownerId })),
            ...initData.sampleVehicles.map(createWithRandomPrice)

        ];

        const dhabasWithOwner = [
            ...initData.sampleDhabas.map(obj => ({ ...obj, owner: ownerId })),
            ...initData.sampleDhabas.map(createWithRandomPrice)
        ];

        // Insert Bulk Data
        console.log("Inserting bulk data...");
        await Listing.insertMany(listingsWithOwner);
        await Vehicle.insertMany(vehiclesWithOwner);
        await Dhaba.insertMany(dhabasWithOwner);

        // Insert Real Maharashtra Listings
        console.log("Inserting premium Maharashtra listings...");
        const maharashtraListings = [
            {
                title: "Lonavala Luxury Villa with Infinity Pool",
                description: "Experience the ultimate luxury in this stunning 5-bedroom villa nestled in the hills of Lonavala. Features an infinity pool with breathtaking views of the Sahyadri mountains, a private home theater, spacious gardens, and modern amenities. Perfect for family getaways and corporate retreats.",
                image: {
                    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
                    filename: "lonavala_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop", filename: "lonavala_main", caption: "Exterior view", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2070&auto=format&fit=crop", filename: "lonavala_living", caption: "Living Room" },
                    { url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop", filename: "lonavala_bedroom", caption: "Master Bedroom" },
                    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", filename: "lonavala_bath", caption: "Bathroom" },
                    { url: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=2070&auto=format&fit=crop", filename: "lonavala_garden", caption: "Garden" }
                ],
                price: 25000,
                location: "Lonavala, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.4072, 18.7557] },
                owner: ownerId,
                amenities: ["Pool", "WiFi", "AC", "Kitchen", "Parking", "TV", "Hot tub", "BBQ grill"],
                guests: 10, bedrooms: 5, beds: 6, bathrooms: 4
            },
            {
                title: "Alibaug Beachfront Coconut Grove Villa",
                description: "Wake up to the sound of waves in this serene beachfront villa in Alibaug. Surrounded by a dense coconut grove, this property offers direct beach access, a private swimming pool, and a large patio for evening sunsets. A quick ferry ride from Mumbai makes it the perfect weekend escape.",
                image: {
                    url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop",
                    filename: "alibaug_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop", filename: "alibaug_main", caption: "Beachfront view", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop", filename: "alibaug_pool", caption: "Private Pool" },
                    { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop", filename: "alibaug_patio", caption: "Relaxing Patio" }
                ],
                price: 18000,
                location: "Alibaug, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [72.8722, 18.6414] },
                owner: ownerId,
                amenities: ["Beach Access", "Pool", "WiFi", "Kitchen", "Parking", "Caretaker"],
                guests: 8, bedrooms: 4, beds: 4, bathrooms: 3
            },
            {
                title: "Mahabaleshwar Strawberry Hill Cottage",
                description: "A cozy heritage cottage situated amidst the strawberry farms of Mahabaleshwar. Enjoy the misty mornings, valley views, and fresh strawberries right from the garden. Features a fireplace, vintage interiors, and a sprawling lawn.",
                image: {
                    url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?q=80&w=2070&auto=format&fit=crop",
                    filename: "mahabaleshwar_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?q=80&w=2070&auto=format&fit=crop", filename: "mahabaleshwar_main", caption: "Cottage Exterior", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2070&auto=format&fit=crop", filename: "mahabaleshwar_view", caption: "Valley View" },
                    { url: "https://images.unsplash.com/photo-1505691938895-1758d7bab58d?q=80&w=2070&auto=format&fit=crop", filename: "mahabaleshwar_interior", caption: "Vintage Interior" }
                ],
                price: 12000,
                location: "Mahabaleshwar, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.6586, 17.9237] },
                owner: ownerId,
                amenities: ["Garden", "Fireplace", "Breakfast", "Parking", "Pet Friendly"],
                guests: 6, bedrooms: 3, beds: 3, bathrooms: 2
            },
            {
                title: "Nashik Vineyard Luxury Resort",
                description: "Stay in the heart of India's wine country. This luxury resort overlooks acres of lush vineyards. Includes a complimentary wine tasting tour, grape stomping events, and ultra-modern rooms with vineyard views.",
                image: {
                    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop",
                    filename: "nashik_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop", filename: "nashik_main", caption: "Vineyard view", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=2070&auto=format&fit=crop", filename: "nashik_wine", caption: "Wine Tasting" },
                    { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop", filename: "nashik_pool", caption: "Infinity Pool" }
                ],
                price: 22000,
                location: "Nashik, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.7540, 20.0059] },
                owner: ownerId,
                amenities: ["Pool", "WiFi", "Bar", "Restaurant", "AC", "Gym"],
                guests: 2, bedrooms: 1, beds: 1, bathrooms: 1
            },
            {
                title: "South Mumbai Sea-Facing Penthouse",
                description: "A rare find in South Mumbai! This penthouse offers panoramic views of the Arabian Sea and the Queen's Necklace. Located in a heritage building in Colaba, walking distance from Gateway of India. Modern amenities with old-world charm.",
                image: {
                    url: "https://images.unsplash.com/photo-1512918760383-5658fa63a363?q=80&w=2070&auto=format&fit=crop",
                    filename: "mumbai_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1512918760383-5658fa63a363?q=80&w=2070&auto=format&fit=crop", filename: "mumbai_main", caption: "Sea View", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop", filename: "mumbai_living", caption: "Modern Living Area" },
                    { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2070&auto=format&fit=crop", filename: "mumbai_balcony", caption: "Balcony" }
                ],
                price: 35000,
                location: "Mumbai, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [72.8231, 18.9431] },
                owner: ownerId,
                amenities: ["Sea View", "WiFi", "AC", "Lift", "Workspace", "Kitchen"],
                guests: 4, bedrooms: 2, beds: 2, bathrooms: 2
            }
        ];

        for (const data of maharashtraListings) {
            const listing = new Listing(data);
            await listing.save();
        }

        console.log("✅ Data initialized successfully in ATLAS!");
        console.log(`   - ${listingsWithOwner.length} sample listings`);
        console.log(`   - ${maharashtraListings.length} premium listings`);
        console.log(`   - Owner: ${demoUser.username}`);

    } catch (err) {
        console.error("Error seeding data:", err);
    }
};

main();
