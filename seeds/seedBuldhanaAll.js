const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Dhaba = require("../models/dhaba");
const User = require("../models/user");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function seedBuldhanaAll() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");

        let user = await User.findOne({ username: "demo" });
        if (!user) {
            console.log("❌ User 'demo' not found. Please create it first (or previous script did it).");
            process.exit(1);
        }
        const ownerId = user._id;

        // URL logic: referenced local paths
        const getLocalImg = (filename) => {
            return {
                url: `/images/buldhana/${filename}.jpg`,
                filename: `listingimage/${filename}`
            };
        };

        // 2. Data for Listings (Hotels)
        const moreListings = [
            {
                title: "Hotel Rama Grand",
                description: "Centrally located premium hotel in Buldhana offering luxuriously appointed rooms, a multi-cuisine restaurant, and top-notch banquet facilities. Ideal for both business and leisure travelers.",
                image: getLocalImg('rama_grand_main'),
                images: [
                    { ...getLocalImg('rama1'), caption: "Exterior View", isPrimary: true },
                    { ...getLocalImg('rama2'), caption: "Deluxe Room" },
                    { ...getLocalImg('rama3'), caption: "Restaurant Area" },
                    { ...getLocalImg('rama4'), caption: "Reception Lobby" },
                    { ...getLocalImg('rama5'), caption: "Banquet Hall" }
                ],
                price: 2400,
                location: "Main Road, Buldhana",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Restaurant", "Parking", "Room Service"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.1843, 20.5312] },
                isTrending: true
            },
            {
                title: "Buldana Urban Residency Club",
                description: "A unique 3-star property managed by Buldana Urban, offering a blend of modern lifestyle and comfort. Features a fitness center, lounge, and high-quality dining options.",
                image: getLocalImg('urban_residency_main'),
                images: [
                    { ...getLocalImg('urban1'), caption: "Club Exterior", isPrimary: true },
                    { ...getLocalImg('urban2'), caption: "Swimming Pool" },
                    { ...getLocalImg('urban3'), caption: "Suite Room" },
                    { ...getLocalImg('urban4'), caption: "Gymnasium" },
                    { ...getLocalImg('urban5'), caption: "Club Lounge" }
                ],
                price: 2100,
                location: "Suvarna Nagaar, Buldhana",
                country: "India",
                propertyType: "Resort",
                guests: 3,
                bedrooms: 1,
                beds: 2,
                bathrooms: 1,
                amenities: ["AC", "Pool", "Gym", "WiFi", "Breakfast Included"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.1750, 20.5280] },
                isTrending: true
            },
            {
                title: "Hotel Titus Heights",
                description: "A popular choice for travelers, offering panoramic views of Buldhana. Known for its clean environment, friendly staff, and premium suite rooms.",
                image: getLocalImg('titus_main'),
                images: [
                    { ...getLocalImg('titus1'), caption: "Main Building", isPrimary: true },
                    { ...getLocalImg('titus2'), caption: "Reception" },
                    { ...getLocalImg('titus3'), caption: "Room View" },
                    { ...getLocalImg('titus4'), caption: "Room Interior" },
                    { ...getLocalImg('titus5'), caption: "Exterior" }
                ],
                price: 2700,
                location: "Chikhli Road, Buldhana",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "CCTV", "Parking", "Power Backup"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.1900, 20.5350] },
                isTrending: true
            }
        ];

        // 3. Data for Dhabas
        const moreDhabas = [
            {
                title: "Suryoday Dhaba",
                description: "A multi-cuisine garden restaurant specializing in authentic Mughlai and spicy Maharashtrian dishes. Great for large families and highway travelers.",
                image: [
                    getLocalImg('suryoday1'),
                    getLocalImg('suryoday2'),
                    getLocalImg('suryoday3'),
                    getLocalImg('suryoday4'),
                    getLocalImg('suryoday5')
                ],
                price: 350,
                location: "Sagwan, Buldhana",
                country: "India",
                cuisine: "Multi-Cuisine",
                category: "Family Restaurant",
                operatingHours: {
                    opens: "10:00",
                    closes: "23:00",
                    isOpen24Hours: false
                },
                specialties: ["Butter Chicken", "Shev Bhaji", "Tandoori Roti"],
                facilities: ["Garden Seating", "Parking", "Home Delivery"],
                phone: "+91 98220 00000",
                isVegetarian: false,
                rating: 4.1,
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.1950, 20.5300] },
                isTrending: true
            },
            {
                title: "Rajesthani Dhaba",
                description: "Experience the true taste of Rajasthan in the heart of Maharashtra. Famous for its authentic Dal Baati Churma and warm hospitality.",
                image: [
                    getLocalImg('rajasthani1'),
                    getLocalImg('rajasthani2'),
                    getLocalImg('rajasthani3'),
                    getLocalImg('rajasthani4'),
                    getLocalImg('rajasthani5')
                ],
                price: 400,
                location: "Nandura Road, Buldhana",
                country: "India",
                cuisine: "Rajasthani",
                category: "Casual Dining",
                operatingHours: {
                    opens: "08:00",
                    closes: "23:30",
                    isOpen24Hours: false
                },
                specialties: ["Dal Baati Churma", "Ker Sangri", "Rajasthani Thali"],
                facilities: ["Parking", "Outdoor Seating", "Pure Veg"],
                phone: "+91 98221 00000",
                isVegetarian: true,
                rating: 4.3,
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.1700, 20.5400] },
                isTrending: true
            }
        ];

        console.log("🌱 Seeding Buldhana Listings (Local Images + REAL Photos)...");
        for (let l of moreListings) {
            await Listing.findOneAndUpdate({ title: l.title }, l, { upsert: true, new: true });
        }

        console.log("🌱 Seeding Buldhana Dhabas (Local Images + REAL Photos)...");
        for (let d of moreDhabas) {
            await Dhaba.findOneAndUpdate({ title: d.title }, d, { upsert: true, new: true });
        }

        console.log("🎉 All Buldhana listings seeded with REAL-WORLD, locally hosted images!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding Buldhana listings:", err);
        process.exit(1);
    }
}

seedBuldhanaAll();
