const mongoose = require("mongoose");
const Listing = require("../models/listing");
const User = require("../models/user");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function seedPuneListings() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");

        let user = await User.findOne({ username: "demo" });
        if (!user) {
            console.log("❌ User 'demo' not found. Please create it first.");
            process.exit(1);
        }
        const ownerId = user._id;

        const getLocalImg = (filename) => {
            return {
                url: `/images/pune/${filename}.jpg`,
                filename: `listingimage/${filename}`
            };
        };

        const puneListings = [
            {
                title: "The Ritz-Carlton, Pune",
                description: "Experience luxury at its finest at The Ritz-Carlton, Pune. Located near the airport and key business districts, this hotel features opulent rooms, a world-class spa, and championship golf access.",
                image: getLocalImg('ritz_main'),
                images: [
                    { ...getLocalImg('ritz1'), caption: "Grand Lobby Entry", isPrimary: true },
                    { ...getLocalImg('ritz2'), caption: "Deluxe Guest Room" },
                    { ...getLocalImg('ritz3'), caption: "Fine Dining Restaurant" },
                    { ...getLocalImg('ritz4'), caption: "Luxury Spa" },
                    { ...getLocalImg('ritz5'), caption: "Outdoor Pool" },
                    { ...getLocalImg('ritz6'), caption: "Presidential Suite" },
                    { ...getLocalImg('ritz7'), caption: "Golf Course View" }
                ],
                price: 31500,
                location: "Yerawada, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Spa", "Golf Course", "Gym"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.8900, 18.5500] },
                isTrending: true
            },
            {
                title: "Conrad Pune",
                description: "A striking Art Deco-inspired hotel in the heart of Pune's central business district. Providing intuitive service, smart luxury, and a variety of dining options.",
                image: getLocalImg('conrad_main'),
                images: [
                    { ...getLocalImg('conrad1'), caption: "Lobby Lounge", isPrimary: true },
                    { ...getLocalImg('conrad2'), caption: "King Deluxe Room" },
                    { ...getLocalImg('conrad3'), caption: "Poolside View" },
                    { ...getLocalImg('conrad4'), caption: "Coriander Kitchen" },
                    { ...getLocalImg('conrad5'), caption: "Executive Suite" },
                    { ...getLocalImg('conrad6'), caption: "Spa & Wellness" },
                    { ...getLocalImg('conrad7'), caption: "Ballroom" }
                ],
                price: 14200,
                location: "Mangaldas Road, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Executive Lounge", "Gym"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.8800, 18.5300] },
                isTrending: true
            },
            {
                title: "JW Marriott Hotel Pune",
                description: "An iconic landmark in Shivajinagar, offering multiple fine dining restaurants, a rooftop lounge, and spacious rooms with city views.",
                image: getLocalImg('jw_main'),
                images: [
                    { ...getLocalImg('jw1'), caption: "Hotel Lobby", isPrimary: true },
                    { ...getLocalImg('jw2'), caption: "Guest Room" },
                    { ...getLocalImg('jw3'), caption: "Outdoor Pool" },
                    { ...getLocalImg('jw4'), caption: "Alto Vino Italian Restaurant" },
                    { ...getLocalImg('jw5'), caption: "Ballroom" },
                    { ...getLocalImg('jw6'), caption: "Rooftop Lounge" },
                    { ...getLocalImg('jw7'), caption: "Executive Lounge" }
                ],
                price: 14500,
                location: "Shivajinagar, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Rooftop Bar", "Spa"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.8300, 18.5300] },
                isTrending: true
            },
            {
                title: "Sheraton Grand Pune",
                description: "A heritage hotel blending old-world charm with modern amenities. Located near the railway station and offering excellent connectivity.",
                image: getLocalImg('sheraton_main'),
                images: [
                    { ...getLocalImg('sheraton1'), caption: "Grand Lobby", isPrimary: true },
                    { ...getLocalImg('sheraton2'), caption: "Classic Room" },
                    { ...getLocalImg('sheraton3'), caption: "Swimming Pool" },
                    { ...getLocalImg('sheraton4'), caption: "Feast Restaurant" },
                    { ...getLocalImg('sheraton5'), caption: "Deluxe Suite" },
                    { ...getLocalImg('sheraton6'), caption: "Fitness Center" },
                    { ...getLocalImg('sheraton7'), caption: "Heritage Exterior" }
                ],
                price: 10000,
                location: "Bund Garden, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Historic Building", "Gym"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.8700, 18.5300] },
                isTrending: true
            },
            {
                title: "The Corinthians Resort",
                description: "A Greco-Egyptian style resort located in the serene hills of South Pune. Perfect for family getaways with extensive indoor and outdoor activities.",
                image: getLocalImg('corinthians_main'),
                images: [
                    { ...getLocalImg('corinthians1'), caption: "Resort Pool", isPrimary: true },
                    { ...getLocalImg('corinthians2'), caption: "Deluxe Room" },
                    { ...getLocalImg('corinthians3'), caption: "Pyramisa Restaurant" },
                    { ...getLocalImg('corinthians4'), caption: "Grand Entrance" },
                    { ...getLocalImg('corinthians5'), caption: "Garden View" },
                    { ...getLocalImg('corinthians6'), caption: "Recreation Area" },
                    { ...getLocalImg('corinthians7'), caption: "Greco-Egyptian Architecture" }
                ],
                price: 9000,
                location: "Mohammedwadi, Pune",
                country: "India",
                propertyType: "Resort",
                guests: 3,
                bedrooms: 1,
                beds: 2,
                bathrooms: 1,
                amenities: ["AC", "Pool", "Activities", "Brewery", "Spa"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.9100, 18.4700] },
                isTrending: true
            },
            {
                title: "Blue Diamond Pune IHCL SeleQtions",
                description: "Pune's first 5-star hotel, located in the lush Koregaon Park. Known for its lush greenery, excellent service, and award-winning restaurants.",
                image: getLocalImg('blue_main'),
                images: [
                    { ...getLocalImg('blue1'), caption: "Hotel Lobby", isPrimary: true },
                    { ...getLocalImg('blue2'), caption: "Superior Room" },
                    { ...getLocalImg('blue3'), caption: "Pool Area" },
                    { ...getLocalImg('blue4'), caption: "Whispering Bamboo" },
                    { ...getLocalImg('blue5'), caption: "Executive Lounge" },
                    { ...getLocalImg('blue6'), caption: "Garden Terrace" },
                    { ...getLocalImg('blue7'), caption: "Lush Greenery" }
                ],
                price: 8000,
                location: "Koregaon Park, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Pet Friendly", "Salon"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.8800, 18.5400] },
                isTrending: true
            },
            {
                title: "Novotel Pune Nagar Road",
                description: "Strategically located in Viman Nagar, offering modern rooms and easy access to the airport and IT parks. Features an open-air swimming pool.",
                image: getLocalImg('novotel_main'),
                images: [
                    { ...getLocalImg('novotel1'), caption: "Modern Room", isPrimary: true },
                    { ...getLocalImg('novotel2'), caption: "Lobby" },
                    { ...getLocalImg('novotel3'), caption: "Pool" },
                    { ...getLocalImg('novotel4'), caption: "Restaurant" },
                    { ...getLocalImg('novotel5'), caption: "Conference Room" },
                    { ...getLocalImg('novotel6'), caption: "Bar Lounge" },
                    { ...getLocalImg('novotel7'), caption: "Kids Corner" }
                ],
                price: 10200,
                location: "Viman Nagar, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Kids Corner", "Gym"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.9100, 18.5600] },
                isTrending: true
            },
            {
                title: "Hyatt Pune",
                description: "An elegant hotel on Nagar Road with lush green surroundings. Offers spacious rooms and close proximity to the Aga Khan Palace.",
                image: getLocalImg('hyatt_main'),
                images: [
                    { ...getLocalImg('hyatt1'), caption: "Dining Area", isPrimary: true },
                    { ...getLocalImg('hyatt2'), caption: "Restaurant" },
                    { ...getLocalImg('hyatt3'), caption: "Swimming Pool" },
                    { ...getLocalImg('hyatt4'), caption: "Poolside View" },
                    { ...getLocalImg('hyatt5'), caption: "Lobby Interior" },
                    { ...getLocalImg('hyatt6'), caption: "Luxury Suite" },
                    { ...getLocalImg('hyatt7'), caption: "Garden Landscape" }
                ],
                price: 10000,
                location: "Kalyani Nagar, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Spa", "Garden"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.9000, 18.5500] },
                isTrending: true
            },
            {
                title: "The Westin Pune Koregaon Park",
                description: "A wellness-focused hotel in the vibrant Koregaon Park. Features the signature Heavenly Bed and a beautiful outdoor infinity pool.",
                image: getLocalImg('westin_main'),
                images: [
                    { ...getLocalImg('westin1'), caption: "Lobby", isPrimary: true },
                    { ...getLocalImg('westin2'), caption: "Westin Room" },
                    { ...getLocalImg('westin3'), caption: "Infinity Pool" },
                    { ...getLocalImg('westin4'), caption: "Mix Lounge" },
                    { ...getLocalImg('westin5'), caption: "Spa Facilities" },
                    { ...getLocalImg('westin6'), caption: "Banquet Hall" },
                    { ...getLocalImg('westin7'), caption: "Heavenly Bed" }
                ],
                price: 13000,
                location: "Koregaon Park, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Infinity Pool", "Spa", "Nightclub"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.9050, 18.5400] },
                isTrending: true
            },
            {
                title: "O Hotel Pune",
                description: "A chic, cosmopolitan hotel in Koregaon Park. Known for its stylish design, O Spa, and japanese dining options.",
                image: getLocalImg('ohotel_main'),
                images: [
                    { ...getLocalImg('ohotel1'), caption: "Stylish Lobby", isPrimary: true },
                    { ...getLocalImg('ohotel2'), caption: "Deluxe Room" },
                    { ...getLocalImg('ohotel3'), caption: "Pool Area" },
                    { ...getLocalImg('ohotel4'), caption: "Harajuku Restaurant" },
                    { ...getLocalImg('ohotel5'), caption: "O Spa" },
                    { ...getLocalImg('ohotel6'), caption: "Rooftop Bar" },
                    { ...getLocalImg('ohotel7'), caption: "Chic Design" }
                ],
                price: 8500,
                location: "Koregaon Park, Pune",
                country: "India",
                propertyType: "Hotel",
                guests: 2,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                amenities: ["AC", "WiFi", "Pool", "Spa", "Salon"],
                owner: ownerId,
                geometry: { type: "Point", coordinates: [73.8900, 18.5350] },
                isTrending: true
            }
        ];

        console.log("🌱 Seeding 10 Pune Listings (Local Images)...");
        for (let l of puneListings) {
            await Listing.findOneAndUpdate({ title: l.title }, l, { upsert: true, new: true });
        }

        console.log("🎉 All 10 Pune listings seeded with REAL-WORLD, locally hosted images!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding Pune listings:", err);
        process.exit(1);
    }
}

seedPuneListings();
