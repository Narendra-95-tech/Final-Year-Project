const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Dhaba = require("../models/dhaba");
const User = require("../models/user");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function seedChikhliAll() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");

        // 1. Find the user 'demo'
        const user = await User.findOne({ username: "demo" });
        if (!user) {
            console.error("❌ User 'demo' not found. Please create the user first or check the username.");
            process.exit(1);
        }

        const ownerId = user._id;

        // 2. Data for Listings (Hotels/Resorts)
        const moreListings = [
            {
                title: "Hotel KV Pride",
                description: "A premium lodging experience in Chikhli. Offering clean, modern rooms and excellent service for travelers and business guests.",
                image: {
                    url: "https://content.jdmagicbox.com/comp/buldhana/g3/9999p7262.7262.210215212647.d7g3/catalogue/hotel-k-v-pride-mehkar-buldhana-lodging-services-jjzl5r19fv.jpg",
                    filename: "kv_pride_main"
                },
                images: [
                    { url: "https://content.jdmagicbox.com/comp/buldhana/g3/9999p7262.7262.210215212647.d7g3/catalogue/hotel-k-v-pride-mehkar-buldhana-lodging-services-jjzl5r19fv.jpg", filename: "kv1", caption: "Exterior View", isPrimary: true },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/g3/9999p7262.7262.210215212647.d7g3/catalogue/k-v-pride-lodge-mehkar-buldhana-lodging-services-xo0tkoycml.jpg", filename: "kv2", caption: "Entrance" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/g3/9999p7262.7262.210215212647.d7g3/catalogue/hotel-k-v-pride-mehkar-buldhana-lodging-services-6goleewjzx.jpg", filename: "kv3", caption: "Reception Area" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/g3/9999p7262.7262.210215212647.d7g3/catalogue/hotel-k-v-pride-mehkar-buldhana-lodging-services-nkpymz0r74.jpg", filename: "kv4", caption: "Room Interior" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/g3/9999p7262.7262.210215212647.d7g3/catalogue/hotel-k-v-pride-mehkar-buldhana-lodging-services-bzgk6hbey0.jpg", filename: "kv5", caption: "Building Side View" }
                ],
                price: 1800,
                location: "Chikhli, Buldhana",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "Parking", "WiFi", "Room Service"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.2600, 20.3500] },
                isTrending: true
            },
            {
                title: "Maharaja Agrasen Resort",
                description: "Experience the epitome of luxury and grand hospitality at Maharaja Agrasen Resort. This premier destination in Chikhli features majestic architecture, expansive lush green lawns ideal for weddings and grand celebrations, and elegantly appointed rooms for a comfortable stay. Whether you're planning a destination wedding or a relaxing family getaway, we provide top-tier facilities including a swimming pool, premium banquet halls, and dedicated customer service.",
                image: {
                    url: "https://content.jdmagicbox.com/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-banquet-halls-dqawgjzdl2.jpg?imwidth=1080",
                    filename: "agrasen_main"
                },
                images: [
                    { url: "https://content.jdmagicbox.com/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-banquet-halls-dqawgjzdl2.jpg?imwidth=1080", filename: "mag1", caption: "Resort Exterior & Entrance", isPrimary: true },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-banquet-halls-6ckau3t3ix.jpg?imwidth=1080", filename: "mag2", caption: "Lawn and Event Space" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-banquet-halls-3s903svmuq.jpg?imwidth=1080", filename: "mag3", caption: "Main Building Architecture" },
                    { url: "https://content.jdmagicbox.com/v2/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-resorts-3z164pu9vo.jpg?imwidth=1080", filename: "mag4", caption: "Outdoor Wedding Lawn" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-banquet-halls-nap0vrlsgx.jpg?imwidth=1080", filename: "mag5", caption: "Deluxe Twin Room" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/k2/9999p7262.7262.180712133903.x3k2/catalogue/maharaja-agrasen-resort-chikhli-buldhana-buldhana-banquet-halls-n2krbumlyv.jpg?imwidth=1080", filename: "mag6", caption: "Premium Guest Suite" }
                ],
                price: 3500,
                location: "Chikhli, Buldhana",
                country: "India",
                propertyType: "Resort",
                guests: 4,
                bedrooms: 2,
                beds: 2,
                bathrooms: 2,
                amenities: ["AC", "Parking", "WiFi", "Pool", "Lawn", "Room Service", "Banquet Hall", "CCTV"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.2500, 20.3600] },
                isTrending: true
            }
        ];

        // 3. Data for Dhabas
        const moreDhabas = [
            {
                title: "Hotel Handibaag Family Garden",
                description: "A popular garden restaurant in Chikhli offering authentic Maharashtrian and multi-cuisine dishes in a peaceful garden setting.",
                image: [
                    { url: "https://content.jdmagicbox.com/comp/buldhana/j5/9999p7262.7262.211110134816.u2j5/catalogue/hotel-handibaag-veg-and-non-veg-family-garden-restaurants-chikhli-buldhana-buldhana-restaurants-8lkxsgj63w.jpg", filename: "handibaag_1" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/j5/9999p7262.7262.211110134816.u2j5/catalogue/hotel-handibaag-veg-and-non-veg-family-garden-restaurants-chikhli-buldhana-buldhana-restaurants-6j3goiv3io.jpg", filename: "handibaag_2" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/j5/9999p7262.7262.211110134816.u2j5/catalogue/hotel-handibaag-veg-and-non-veg-family-garden-restaurants-chikhli-buldhana-buldhana-restaurants-a1irtqb90s.jpg", filename: "handibaag_3" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/j5/9999p7262.7262.211110134816.u2j5/catalogue/hotel-handibaag-veg-and-non-veg-family-garden-restaurants-chikhli-buldhana-buldhana-restaurants-s3fpmy6f1a.jpg", filename: "handibaag_4" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/j5/9999p7262.7262.211110134816.u2j5/catalogue/hotel-handibaag-veg-and-non-veg-family-garden-restaurants-chikhli-buldhana-buldhana-restaurants-6yjo6frd1w.jpg", filename: "handibaag_5" }
                ],
                price: 400,
                location: "Mehkar Phatta, Chikhli",
                country: "India",
                cuisine: "Multi-Cuisine",
                category: "Family Restaurant",
                operatingHours: {
                    opens: "11:00",
                    closes: "23:00",
                    isOpen24Hours: false
                },
                specialties: ["Handi Special Veg", "Tandoori Platters", "Authentic Bhakri"],
                facilities: ["Garden Seating", "Parking", "Family Section", "Home Delivery"],
                phone: "+91 00000 00001",
                isVegetarian: true,
                rating: 4.4,
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.2580, 20.3520] },
                isTrending: true
            },
            {
                title: "Shankar Fauji Dhaba",
                description: "Authentic highway dhaba experience with delicious, spicy food. Known for its Fauji style hospitality and rustic atmosphere.",
                image: [
                    { url: "https://content.jdmagicbox.com/comp/buldhana/f3/9999p7262.7262.190401084025.m8f3/catalogue/shankar-fauji-dhaba-chikhli-buldhana-buldhana-restaurants-8mwvg341wa.jpg", filename: "fauji_1" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/f3/9999p7262.7262.190401084025.m8f3/catalogue/shankar-fauji-dhaba-buldhana-04f1h3phge.jpg", filename: "fauji_2" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/f3/9999p7262.7262.190401084025.m8f3/catalogue/shankar-fauji-dhaba-buldhana-1lj9ehprwd.jpg", filename: "fauji_3" },
                    { url: "https://content.jdmagicbox.com/comp/buldhana/f3/9999p7262.7262.190401084025.m8f3/catalogue/shankar-fauji-dhaba-chikhli-buldhana-buldhana-restaurants-gb9aonsvb8.jpg", filename: "fauji_4" },
                    { url: "https://content.jdmagicbox.com/v2/comp/buldhana/f3/9999p7262.7262.190401084025.m8f3/catalogue/shankar-fauji-dhaba-chikhli-buldhana-buldhana-restaurants-gye2xr4wxs.jpg", filename: "fauji_5" }
                ],
                price: 350,
                location: "Mehkar Phata, Chikhli",
                country: "India",
                cuisine: "North Indian",
                category: "Casual Dining",
                operatingHours: {
                    opens: "08:00",
                    closes: "23:30",
                    isOpen24Hours: false
                },
                specialties: ["Sev Bhaji", "Special Fauji Thali", "Masala Taak"],
                facilities: ["Parking", "Outdoor Seating", "Khaat Seating"],
                phone: "+91 00000 00002",
                isVegetarian: false,
                rating: 4.2,
                owner: ownerId,
                geometry: { type: "Point", coordinates: [76.2620, 20.3550] },
                isTrending: true
            }
        ];

        // 4. Insert into Database
        console.log("🌱 Seeding Listings...");
        for (let l of moreListings) {
            await Listing.findOneAndUpdate({ title: l.title }, l, { upsert: true, new: true });
        }

        console.log("🌱 Seeding Dhabas...");
        for (let d of moreDhabas) {
            await Dhaba.findOneAndUpdate({ title: d.title }, d, { upsert: true, new: true });
        }

        console.log("🎉 All Chikhli listings added/updated successfully with real images!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding Chikhli listings:", err);
        process.exit(1);
    }
}

seedChikhliAll();
