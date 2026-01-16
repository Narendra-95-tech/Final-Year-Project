const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const Vehicle = require("../models/vehicle.js");
const Dhaba = require("../models/dhaba.js");
const User = require("../models/user.js");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: "../.env" });
    require("dotenv").config();
}

const isAtlas = process.env.USE_ATLAS === "true";
const MONGO_URL = isAtlas ? process.env.ATLASDB_URL : "mongodb://127.0.0.1:27017/wanderlust";

console.log(`Seeding database: ${isAtlas ? 'Atlas Cloud' : 'Local MongoDB'}`);

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
    await seedDemo();
}

const seedDemo = async () => {
    try {
        console.log("Cleaning up database...");
        await Listing.deleteMany({});
        await Vehicle.deleteMany({});
        await Dhaba.deleteMany({});

        // Create or Find Demo User
        const demoUsername = "demo";
        const demoEmail = "demo@demo.com";
        const demoPassword = "Kalpana";

        let demoUser = await User.findOne({ username: demoUsername });

        if (!demoUser) {
            console.log("Creating new demo user...");
            const newUser = new User({
                email: demoEmail,
                username: demoUsername,
                firstName: "Demo",
                lastName: "User",
                isVerified: true,
                verificationStatus: 'Verified'
            });
            demoUser = await User.register(newUser, demoPassword);
            console.log(`User ${demoUsername} created with ID: ${demoUser._id}`);
        } else {
            console.log(`User ${demoUsername} already exists with ID: ${demoUser._id}`);
            await demoUser.setPassword(demoPassword);
            await demoUser.save();
            console.log(`Password for ${demoUsername} has been reset to 'Kalpana'`);
        }

        // Create Verification Tester User
        const reviewerUsername = "reviewer";
        const reviewerEmail = "reviewer@test.com";
        const reviewerPassword = "ReviewerPassword123";

        let reviewerUser = await User.findOne({ username: reviewerUsername });

        if (!reviewerUser) {
            console.log("Creating reviewer user...");
            const newReviewer = new User({
                email: reviewerEmail,
                username: reviewerUsername,
                firstName: "Review",
                lastName: "Tester",
                isVerified: true,
                verificationStatus: 'Verified'
            });
            reviewerUser = await User.register(newReviewer, reviewerPassword);
            console.log(`User ${reviewerUsername} created with ID: ${reviewerUser._id}`);
        } else {
            console.log(`User ${reviewerUsername} already exists with ID: ${reviewerUser._id}`);
            await reviewerUser.setPassword(reviewerPassword);
            reviewerUser.isVerified = true;
            reviewerUser.verificationStatus = 'Verified';
            await reviewerUser.save();
            console.log(`Password for ${reviewerUsername} has been reset to '${reviewerPassword}'`);
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
        await Listing.insertMany(listingsWithOwner);
        await Vehicle.insertMany(vehiclesWithOwner);
        await Dhaba.insertMany(dhabasWithOwner);

        // Insert Real Maharashtra Listings
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
                guests: 6, bedrooms: 2, beds: 3, bathrooms: 2
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
            },
            {
                title: "The Corinthians Resort & Club, Pune",
                description: "An award-winning luxury resort spread over 25 acres in Pune. Features world-class amenities including an 18-hole golf course, multiple swimming pools, tennis courts, and spa facilities. Perfect for leisure stays and corporate events with stunning landscaped gardens.",
                image: {
                    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
                    filename: "corinthians_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop", filename: "corinthians_main", caption: "Resort Exterior", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop", filename: "corinthians_pool", caption: "Resort Pool" },
                    { url: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=2070&auto=format&fit=crop", filename: "corinthians_golf", caption: "Golf Course" },
                    { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop", filename: "corinthians_room", caption: "Luxury Suite" },
                    { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop", filename: "corinthians_dining", caption: "Fine Dining" }
                ],
                price: 28000,
                location: "Pune, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.9074, 18.4508] },
                owner: ownerId,
                amenities: ["Golf Course", "Pool", "Spa", "WiFi", "AC", "Restaurant", "Gym", "Tennis Court"],
                guests: 4, bedrooms: 2, beds: 2, bathrooms: 2
            },
            {
                title: "Sula Vineyards - Beyond by Sula, Nashik",
                description: "India's first luxury wine resort located in the heart of Sula Vineyards. Each villa features private pools, vineyard views, and wine cellars. Includes complimentary wine tasting sessions, vineyard tours, and grape stomping experiences during harvest season.",
                image: {
                    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
                    filename: "sula_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop", filename: "sula_main", caption: "Vineyard View", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop", filename: "sula_vineyard", caption: "Wine Estate" },
                    { url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?q=80&w=2070&auto=format&fit=crop", filename: "sula_villa", caption: "Private Villa Pool" },
                    { url: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=2070&auto=format&fit=crop", filename: "sula_tasting", caption: "Wine Tasting Room" },
                    { url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop", filename: "sula_cellar", caption: "Wine Cellar" }
                ],
                price: 32000,
                location: "Nashik, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.7124, 19.9615] },
                owner: ownerId,
                amenities: ["Private Pool", "Wine Tasting", "WiFi", "AC", "Restaurant", "Bar", "Vineyard Tours"],
                guests: 4, bedrooms: 2, beds: 2, bathrooms: 2
            },
            {
                title: "Della Resorts, Lonavala",
                description: "India's largest adventure and leisure resort in Lonavala. Features an adventure park with over 50 activities, multiple themed restaurants, luxury rooms, and India's largest man-made beach. Perfect for thrill-seekers and families alike.",
                image: {
                    url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop",
                    filename: "della_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop", filename: "della_main", caption: "Resort Complex", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?q=80&w=2070&auto=format&fit=crop", filename: "della_adventure", caption: "Adventure Park" },
                    { url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070&auto=format&fit=crop", filename: "della_suite", caption: "Luxury Suite" },
                    { url: "https://images.unsplash.com/photo-1623719603159-991a2a095e48?q=80&w=2070&auto=format&fit=crop", filename: "della_pool", caption: "Pool Area" },
                    { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074&auto=format&fit=crop", filename: "della_restaurant", caption: "Fine Dining Restaurant" }
                ],
                price: 26000,
                location: "Lonavala, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.4087, 18.7451] },
                owner: ownerId,
                amenities: ["Adventure Park", "Pool", "Beach", "WiFi", "AC", "Restaurant", "Spa", "Kids Club"],
                guests: 6, bedrooms: 3, beds: 3, bathrooms: 2
            },
            {
                title: "The Gateway Hotel Ambad, Nashik",
                description: "A serene Taj hotel nestled amidst vineyards in Nashik's wine country. Features contemporary rooms, an outdoor pool, multi-cuisine restaurant, and easy access to nearby wineries. The perfect blend of modern luxury and natural beauty.",
                image: {
                    url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop",
                    filename: "gateway_nashik_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop", filename: "gateway_nashik_main", caption: "Hotel Exterior", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop", filename: "gateway_nashik_room", caption: "Deluxe Room" },
                    { url: "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?q=80&w=2070&auto=format&fit=crop", filename: "gateway_nashik_pool", caption: "Swimming Pool" },
                    { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop", filename: "gateway_nashik_dining", caption: "Restaurant" },
                    { url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=2074&auto=format&fit=crop", filename: "gateway_nashik_lounge", caption: "Lounge Bar" }
                ],
                price: 15000,
                location: "Nashik, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.7898, 19.9975] },
                owner: ownerId,
                amenities: ["Pool", "WiFi", "AC", "Restaurant", "Bar", "Gym", "Conference Hall"],
                guests: 3, bedrooms: 1, beds: 2, bathrooms: 1
            },
            {
                title: "Sayaji Hotel, Kolhapur",
                description: "A luxury 5-star hotel in the heart of Kolhapur. Known for its royal Maratha-inspired architecture, spacious rooms, rooftop pool, and award-winning restaurants. Walking distance from historical sites and the famous Mahalaxmi Temple.",
                image: {
                    url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop",
                    filename: "sayaji_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop", filename: "sayaji_main", caption: "Hotel Facade", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop", filename: "sayaji_lobby", caption: "Grand Lobby" },
                    { url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop", filename: "sayaji_room", caption: "Executive Room" },
                    { url: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?q=80&w=2070&auto=format&fit=crop", filename: "sayaji_rooftop", caption: "Rooftop Pool" },
                    { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop", filename: "sayaji_restaurant", caption: "Multi-cuisine Restaurant" }
                ],
                price: 9500,
                location: "Kolhapur, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [74.2433, 16.7050] },
                owner: ownerId,
                amenities: ["Rooftop Pool", "WiFi", "AC", "Restaurant", "Bar", "Spa", "Gym", "Banquet Hall"],
                guests: 3, bedrooms: 1, beds: 2, bathrooms: 1
            },
            {
                title: "WelcomHotel Rama International, Aurangabad",
                description: "An ITC Hotels property near the UNESCO World Heritage Sites of Ajanta and Ellora Caves. Features elegant rooms, lush gardens, outdoor pool, and authentic Mughlai cuisine. Perfect base for exploring historical wonders of Aurangabad.",
                image: {
                    url: "https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=2064&auto=format&fit=crop",
                    filename: "welcomhotel_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=2064&auto=format&fit=crop", filename: "welcomhotel_main", caption: "Hotel Entrance", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop", filename: "welcomhotel_garden", caption: "Garden View" },
                    { url: "https://images.unsplash.com/photo-1595526051245-c1abcbbba056?q=80&w=2070&auto=format&fit=crop", filename: "welcomhotel_room", caption: "Premium Room" },
                    { url: "https://images.unsplash.com/photo-1574643156929-51fa098b0394?q=80&w=2060&auto=format&fit=crop", filename: "welcomhotel_pool", caption: "Outdoor Pool" },
                    { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2074&auto=format&fit=crop", filename: "welcomhotel_restaurant", caption: "Mughlai Restaurant" }
                ],
                price: 11000,
                location: "Aurangabad, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [75.3433, 19.8762] },
                owner: ownerId,
                amenities: ["Pool", "WiFi", "AC", "Restaurant", "Bar", "Gym", "Tour Desk", "Garden"],
                guests: 2, bedrooms: 1, beds: 1, bathrooms: 1
            },
            {
                title: "Radisson Blu Resort & Spa, Alibaug",
                description: "A beachfront luxury resort spread across 8 acres. Features private beach access, multiple swimming pools, water sports facilities, kids club, and rejuvenating spa. Just a ferry ride from Mumbai, perfect for weekend getaways.",
                image: {
                    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop",
                    filename: "radisson_alibaug_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop", filename: "radisson_alibaug_main", caption: "Beach Resort", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?q=80&w=2074&auto=format&fit=crop", filename: "radisson_alibaug_beach", caption: "Private Beach" },
                    { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop", filename: "radisson_alibaug_pool", caption: "Lagoon Pool" },
                    { url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=2071&auto=format&fit=crop", filename: "radisson_alibaug_room", caption: "Sea View Room" },
                    { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop", filename: "radisson_alibaug_spa", caption: "Luxury Spa" }
                ],
                price: 24000,
                location: "Alibaug, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [72.8771, 18.6298] },
                owner: ownerId,
                amenities: ["Beach Access", "Pool", "Spa", "WiFi", "AC", "Restaurant", "Water Sports", "Kids Club"],
                guests: 4, bedrooms: 2, beds: 2, bathrooms: 2
            },
            {
                title: "Atmantan Wellness Resort, Pune",
                description: "Asia's premier wellness destination nestled in the Sahyadri mountains. Offers holistic wellness programs including yoga, meditation, Ayurveda, naturopathy, and personalized fitness. Features organic farm-to-table cuisine and luxurious eco-friendly villas.",
                image: {
                    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop",
                    filename: "atmantan_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop", filename: "atmantan_main", caption: "Mountain Retreat", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=2064&auto=format&fit=crop", filename: "atmantan_yoga", caption: "Yoga Pavilion" },
                    { url: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2070&auto=format&fit=crop", filename: "atmantan_villa", caption: "Eco Villa" },
                    { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop", filename: "atmantan_spa", caption: "Ayurveda Spa" },
                    { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop", filename: "atmantan_organic", caption: "Organic Cuisine" }
                ],
                price: 38000,
                location: "Pune, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.4379, 18.7248] },
                owner: ownerId,
                amenities: ["Spa", "Yoga", "Organic Food", "WiFi", "Meditation", "Ayurveda", "Fitness Center", "Nature Trails"],
                guests: 2, bedrooms: 1, beds: 1, bathrooms: 1
            },
            {
                title: "JW Marriott Hotel, Pune",
                description: "A 5-star luxury hotel in the heart of Pune's business district. Features contemporary rooms with city views, rooftop infinity pool, multiple dining options including Pune's highest restaurant, and state-of-the-art meeting facilities.",
                image: {
                    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
                    filename: "jw_pune_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop", filename: "jw_pune_main", caption: "Hotel Tower", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1631049035634-c04a1a48d538?q=80&w=2070&auto=format&fit=crop", filename: "jw_pune_room", caption: "Executive Suite" },
                    { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop", filename: "jw_pune_infinity", caption: "Rooftop Infinity Pool" },
                    { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop", filename: "jw_pune_restaurant", caption: "Sky High Restaurant" },
                    { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop", filename: "jw_pune_lobby", caption: "Grand Lobby" }
                ],
                price: 18500,
                location: "Pune, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.9225, 18.5596] },
                owner: ownerId,
                amenities: ["Rooftop Pool", "WiFi", "AC", "Restaurant", "Bar", "Spa", "Gym", "Business Center"],
                guests: 3, bedrooms: 1, beds: 2, bathrooms: 1
            },
            {
                title: "Matheran Luxury Eco Resort",
                description: "A heritage eco-resort in Asia's only automobile-free hill station. Features colonial-era cottages, panoramic valley views, nature trails, and horseback riding. Experience the charm of old-world Matheran with modern comforts.",
                image: {
                    url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop",
                    filename: "matheran_main"
                },
                images: [
                    { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2049&auto=format&fit=crop", filename: "matheran_main", caption: "Hill Resort", isPrimary: true },
                    { url: "https://images.unsplash.com/photo-1582610285985-a42d9193f2fd?q=80&w=2070&auto=format&fit=crop", filename: "matheran_cottage", caption: "Heritage Cottage" },
                    { url: "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?q=80&w=2070&auto=format&fit=crop", filename: "matheran_valley", caption: "Valley View" },
                    { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop", filename: "matheran_interior", caption: "Rustic Interior" },
                    { url: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=2070&auto=format&fit=crop", filename: "matheran_garden", caption: "Garden Terrace" }
                ],
                price: 14000,
                location: "Matheran, Maharashtra",
                country: "India",
                geometry: { type: "Point", coordinates: [73.2630, 18.9844] },
                owner: ownerId,
                amenities: ["Valley View", "Nature Trails", "Fireplace", "Organic Food", "Horseback Riding", "Library"],
                guests: 4, bedrooms: 2, beds: 2, bathrooms: 2
            }
        ];

        for (const data of maharashtraListings) {
            const listing = new Listing(data);
            await listing.save();
            console.log(`Saved: ${listing.title}`);
        }

        console.log("✅ Data initialized successfully with Demo User!");
        console.log(`   - ${listingsWithOwner.length} sample listings`);
        console.log(`   - ${maharashtraListings.length} premium Maharashtra listings (newest)`);
        console.log(`   - ${vehiclesWithOwner.length} vehicles`);
        console.log(`   - ${dhabasWithOwner.length} dhabas`);
        console.log(`   - Owner: ${demoUser.username} (${demoUser._id})`);

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
    }
};
