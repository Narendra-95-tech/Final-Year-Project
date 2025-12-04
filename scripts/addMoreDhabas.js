const mongoose = require('mongoose');
const Dhaba = require('../models/dhaba');
const User = require('../models/user');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/wanderlust')
    .then(() => console.log('✓ MongoDB Connected'))
    .catch(err => {
        console.error('✗ MongoDB Connection Error:', err);
        process.exit(1);
    });

// Additional dhabas with high-quality images
const additionalDhabas = [
    {
        title: "Taj Mahal Express",
        description: "Authentic Mughlai-inspired North Indian cuisine with aromatic spices and traditional cooking methods. Experience the taste of royal kitchens.",
        image: {
            url: "https://images.unsplash.com/photo-1585238341710-4913dfb3d31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "taj-mahal-express"
        },
        price: 480,
        location: "Agra, Uttar Pradesh",
        country: "India",
        cuisine: "North Indian",
        category: "Fine Dining",
        establishedYear: 2016,
        operatingHours: {
            opens: "11:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Nihari", "Shami Kebab", "Biryani", "Korma"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section", "Live Music"],
        phone: "+91 98765 11111",
        email: "tajmahal@example.com",
        website: "https://tajmahalexpress.example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.6,
        geometry: {
            type: "Point",
            coordinates: [78.0421, 27.1767]
        }
    },
    {
        title: "Spice Garden",
        description: "Vegetarian paradise with organic ingredients and traditional recipes. Perfect for health-conscious diners seeking authentic Indian flavors.",
        image: {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "spice-garden"
        },
        price: 380,
        location: "Sector 7, Chandigarh",
        country: "India",
        cuisine: "Multi-Cuisine",
        category: "Family Restaurant",
        establishedYear: 2017,
        operatingHours: {
            opens: "09:00",
            closes: "22:00",
            isOpen24Hours: false
        },
        specialties: ["Vegetable Biryani", "Paneer Butter Masala", "Chikhalwali", "Organic Salads"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Outdoor Seating", "Home Delivery"],
        phone: "+91 98765 22222",
        email: "spicegarden@example.com",
        isVegetarian: true,
        isVegan: true,
        rating: 4.5,
        geometry: {
            type: "Point",
            coordinates: [76.7794, 30.7333]
        }
    },
    {
        title: "Coastal Flavors",
        description: "Seafood specialties with coastal Indian cuisine. Fresh catch prepared with traditional spices and modern cooking techniques.",
        image: {
            url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "coastal-flavors"
        },
        price: 520,
        location: "Marine Drive, Mumbai",
        country: "India",
        cuisine: "South Indian",
        category: "Fine Dining",
        establishedYear: 2019,
        operatingHours: {
            opens: "12:00",
            closes: "23:30",
            isOpen24Hours: false
        },
        specialties: ["Tandoori Fish", "Prawn Curry", "Fish Biryani", "Crab Masala"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Sea View", "Live Music"],
        phone: "+91 98765 33333",
        email: "coastalflavors@example.com",
        website: "https://coastalflavors.example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.7,
        geometry: {
            type: "Point",
            coordinates: [72.8326, 19.0596]
        }
    },
    {
        title: "Himalayan Kitchen",
        description: "Authentic Himalayan cuisine featuring dishes from Himachal Pradesh and Uttarakhand. Rustic flavors with modern presentation.",
        image: {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "himalayan-kitchen"
        },
        price: 420,
        location: "Shimla, Himachal Pradesh",
        country: "India",
        cuisine: "North Indian",
        category: "Casual Dining",
        establishedYear: 2014,
        operatingHours: {
            opens: "10:00",
            closes: "22:00",
            isOpen24Hours: false
        },
        specialties: ["Dham", "Siddu", "Chikhalwali", "Madra"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Mountain View"],
        phone: "+91 98765 44444",
        email: "himalayan@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.4,
        geometry: {
            type: "Point",
            coordinates: [77.1734, 31.7724]
        }
    },
    {
        title: "Spicy Dragon",
        description: "Indo-Chinese fusion cuisine with authentic Chinese techniques and Indian spices. A perfect blend of two great culinary traditions.",
        image: {
            url: "https://images.unsplash.com/photo-1585238341710-4913dfb3d31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "spicy-dragon"
        },
        price: 390,
        location: "Sector 15, Gurgaon",
        country: "India",
        cuisine: "Chinese",
        category: "Casual Dining",
        establishedYear: 2018,
        operatingHours: {
            opens: "11:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Chilli Garlic Noodles", "Manchurian", "Fried Rice", "Spring Rolls"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Home Delivery"],
        phone: "+91 98765 55555",
        email: "spicydragon@example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.3,
        geometry: {
            type: "Point",
            coordinates: [77.0845, 28.4595]
        }
    },
    {
        title: "Gujarati Rasoi",
        description: "Traditional Gujarati home-style cooking with authentic recipes. Experience the warmth and flavors of Gujarati cuisine.",
        image: {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "gujarati-rasoi"
        },
        price: 350,
        location: "Ahmedabad, Gujarat",
        country: "India",
        cuisine: "Gujarati",
        category: "Family Restaurant",
        establishedYear: 2013,
        operatingHours: {
            opens: "09:00",
            closes: "22:00",
            isOpen24Hours: false
        },
        specialties: ["Dhokla", "Fafda Jalebi", "Khichdi", "Undhiyu"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 66666",
        email: "gujaratirasoi@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.5,
        geometry: {
            type: "Point",
            coordinates: [72.5479, 23.0225]
        }
    },
    {
        title: "Bengal Bites",
        description: "Authentic Bengali cuisine with traditional recipes and cooking methods. Savor the flavors of West Bengal.",
        image: {
            url: "https://images.unsplash.com/photo-1585238341710-4913dfb3d31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "bengal-bites"
        },
        price: 380,
        location: "Kolkata, West Bengal",
        country: "India",
        cuisine: "Bengali",
        category: "Casual Dining",
        establishedYear: 2015,
        operatingHours: {
            opens: "10:00",
            closes: "22:00",
            isOpen24Hours: false
        },
        specialties: ["Fish Curry", "Luchi", "Aloo Dum", "Rasgulla"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 77777",
        email: "bengalbites@example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.4,
        geometry: {
            type: "Point",
            coordinates: [88.3639, 22.5726]
        }
    },
    {
        title: "Chaat House",
        description: "Legendary street food destination serving authentic Indian chaat and snacks. Quick service with amazing flavors.",
        image: {
            url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "chaat-house"
        },
        price: 200,
        location: "Chandni Chowk, Delhi",
        country: "India",
        cuisine: "Street Food",
        category: "Fast Food",
        establishedYear: 2005,
        operatingHours: {
            opens: "10:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Pani Puri", "Bhel Puri", "Sev Puri", "Dahi Bhalle"],
        facilities: ["Outdoor Seating", "Card Payment", "Home Delivery"],
        phone: "+91 98765 88888",
        email: "chaathaus@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.6,
        geometry: {
            type: "Point",
            coordinates: [77.2300, 28.6505]
        }
    },
    {
        title: "Artisan Coffee & Bistro",
        description: "Modern cafe with specialty coffee and continental cuisine. Perfect for breakfast, brunch, and casual dining.",
        image: {
            url: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "artisan-coffee"
        },
        price: 450,
        location: "Indiranagar, Bangalore",
        country: "India",
        cuisine: "Continental",
        category: "Cafe",
        establishedYear: 2020,
        operatingHours: {
            opens: "07:00",
            closes: "21:00",
            isOpen24Hours: false
        },
        specialties: ["Espresso", "Croissants", "Avocado Toast", "Salads"],
        facilities: ["AC", "WiFi", "Card Payment", "Outdoor Seating", "Free WiFi"],
        phone: "+91 98765 99999",
        email: "artisancoffee@example.com",
        website: "https://artisancoffee.example.com",
        isVegetarian: true,
        isVegan: true,
        rating: 4.5,
        geometry: {
            type: "Point",
            coordinates: [77.6412, 13.0827]
        }
    },
    {
        title: "Royal Feast Buffet",
        description: "All-you-can-eat buffet with diverse Indian cuisine. Unlimited servings of authentic dishes at affordable prices.",
        image: {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "royal-feast"
        },
        price: 399,
        location: "Sector 18, Noida",
        country: "India",
        cuisine: "Multi-Cuisine",
        category: "Buffet",
        establishedYear: 2017,
        operatingHours: {
            opens: "11:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Unlimited Curries", "Breads", "Rice Dishes", "Desserts"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 00000",
        email: "royalfeast@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.4,
        geometry: {
            type: "Point",
            coordinates: [77.3277, 28.5744]
        }
    }
];

// Function to add more dhabas
const addMoreDhabas = async () => {
    try {
        // Find demo user
        let demoUser = await User.findOne({ username: 'demo' });
        
        if (!demoUser) {
            console.log('✗ Demo user not found. Please run seedDemoDhabas.js first.');
            process.exit(1);
        }

        console.log('✓ Demo user found');

        // Add demo user's ID to each dhaba
        const dhabasWithOwner = additionalDhabas.map(dhaba => ({
            ...dhaba,
            owner: demoUser._id
        }));

        // Insert dhabas
        const createdDhabas = await Dhaba.insertMany(dhabasWithOwner);
        console.log(`\n✓ Successfully added ${createdDhabas.length} new dhabas!`);
        
        // Update user's listings
        demoUser.listings = demoUser.listings || [];
        demoUser.listings.push(...createdDhabas.map(d => d._id));
        await demoUser.save();
        
        console.log(`\n✓ Total dhabas for demo user: ${demoUser.listings.length}`);
        console.log('\n📋 Newly Added Dhabas:');
        createdDhabas.forEach((dhaba, index) => {
            console.log(`   ${index + 1}. ${dhaba.title} - ₹${dhaba.price} (${dhaba.cuisine})`);
        });
        
        console.log('\n✓ More dhabas added successfully!');
        
    } catch (error) {
        console.error('✗ Error adding dhabas:', error.message);
        if (error.code === 11000) {
            console.error('Note: Some dhabas may already exist in the database');
        }
    } finally {
        mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
};

// Run the function
addMoreDhabas();
