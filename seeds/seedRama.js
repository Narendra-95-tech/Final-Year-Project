const mongoose = require("mongoose");
const Listing = require("../models/listing");
const User = require("../models/user");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function seedRamaResort() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");

        // 1. Find the user 'demo'
        const user = await User.findOne({ username: "demo" });
        if (!user) {
            console.error("❌ User 'demo' not found. Please create the user first or check the username.");
            process.exit(1);
        }

        // 2. Prepare the listing data for Rama Resort
        // Using high-quality unsplash images for a luxury resort feel
        const ramaResortData = {
            title: "Rama Resort Chikhli",
            description: "Experience luxury in the heart of Chikhli. Rama Resort offers premium rooms, a lush green lawn for events, and top-notch hospitality. Perfect for family stays, weddings, and business trips.",
            image: {
                url: "https://r1imghtlak.mmtcdn.com/c9b273c1-4e3b-434d-ad4f-4dd43a193ba1.jpg",
                filename: "rama_resort_main"
            },
            images: [
                {
                    url: "https://r1imghtlak.mmtcdn.com/c9b273c1-4e3b-434d-ad4f-4dd43a193ba1.jpg",
                    filename: "rama_resort_1",
                    caption: "Main Building Exterior",
                    isPrimary: true
                },
                {
                    url: "https://r1imghtlak.mmtcdn.com/ac27f625-a81f-463f-bad9-f2f367b1f0c3.JPG",
                    filename: "rama_resort_2",
                    caption: "Lawn and Entrance Decoration"
                },
                {
                    url: "https://r1imghtlak.mmtcdn.com/1dc4f70610f611ea927c0242ac110002.jpg",
                    filename: "rama_resort_3",
                    caption: "Deluxe Room Interior"
                },
                {
                    url: "https://r2imghtlak.mmtcdn.com/r2-mmt-htl-image/flyfish/raw/NH95128342370130/QS1042/QS1042-Q1/WhatsApp-Image-2024-07-13-at-2-56-12-PM.jpeg",
                    filename: "rama_resort_4",
                    caption: "Resort Grounds"
                },
                {
                    url: "https://content.jdmagicbox.com/v2/comp/buldhana/n1/9999p7262.7262.230913171443.b5n1/catalogue/rama-resort-and-lawns-buldhana-resorts-hyifoo60sr.jpg",
                    filename: "rama_resort_5",
                    caption: "Aerial View of the Resort & Lawns"
                }
            ],
            price: 2500, // Premium pricing
            location: "Chikhli, Buldhana",
            country: "India",
            propertyType: "Resort",
            guests: 2,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            amenities: ["AC", "Parking", "WiFi", "Pool", "Garden", "Room Service"],
            houseRules: ["No smoking", "Check-in after 12:00 PM"],
            owner: user._id,
            geometry: {
                type: "Point",
                coordinates: [76.2559, 20.3541] // Coordinates for Chikhli
            }
        };

        // 3. Create and save the listing
        const newListing = new Listing(ramaResortData);
        await newListing.save();

        console.log("🎉 Rama Resort added successfully with 'demo' as owner!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding Rama Resort:", err);
        process.exit(1);
    }
}

seedRamaResort();
