const mongoose = require('mongoose');
const Dhaba = require('../models/dhaba');
const User = require('../models/user');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/wanderlust')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Sample dhabas data
const demoDhabas = [
    {
        title: "Spice Route Dhaba",
        image: {
            url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "spice-route-dhaba"
        },
        price: 500,
        location: "Connaught Place, New Delhi",
        country: "India",
        cuisine: "North Indian",
        category: "Fine Dining",
        establishedYear: 2015,
        operatingHours: {
            opens: "11:00",
            closes: "23:30",
            isOpen24Hours: false
        },
        specialties: ["Butter Chicken", "Dal Makhani", "Paneer Tikka", "Naan"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Live Music"],
        phone: "+91 98765 12345",
        email: "spiceroute@example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.7,
        geometry: {
            type: "Point",
            coordinates: [77.2066, 28.6280]
        },
        owner: null // Will be set to demo user's ID
    },
    {
        title: "Royal Dhaba",
        image: {
            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "royal-dhaba"
        },
        price: 450,
        location: "MG Road, Gurugram",
        country: "India",
        cuisine: "Mughlai",
        category: "Fine Dining",
        establishedYear: 2018,
        operatingHours: {
            opens: "12:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Biryani", "Kebabs", "Butter Naan", "Shahi Paneer"],
        facilities: ["AC", "Valet Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 67890",
        email: "royaldhaba@example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.5,
        geometry: {
            type: "Point",
            coordinates: [77.1025, 28.4595]
        },
        owner: null // Will be set to demo user's ID
    },
    {
        title: "Green Leaf Dhaba",
        image: {
            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
            filename: "green-leaf-dhaba"
        },
        price: 400,
        location: "Sector 29, Noida",
        country: "India",
        cuisine: "Multi-Cuisine",
        category: "Family Restaurant",
        establishedYear: 2020,
        operatingHours: {
            opens: "10:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Paneer Tikka Masala", "Dal Tadka", "Naan", "Lassi"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Outdoor Seating"],
        phone: "+91 98765 34567",
        email: "greenleaf@example.com",
        isVegetarian: true,
        isVegan: true,
        rating: 4.3,
        geometry: {
            type: "Point",
            coordinates: [77.3277, 28.5744]
        },
        owner: null // Will be set to demo user's ID
    }
];

// Find or create demo user and add dhabas
const addDemoDhabas = async () => {
    try {
        // Find demo user
        let demoUser = await User.findOne({ username: 'demo' });
        
        if (!demoUser) {
            // Create demo user if not exists
            demoUser = new User({
                username: 'demo',
                email: 'demo@example.com',
                role: 'owner'
            });
            
            // Set password (you might want to use proper password hashing in production)
            await demoUser.setPassword('demo');
            await demoUser.save();
            console.log('Demo user created successfully');
        }

        // Add demo user's ID to each dhaba
        const dhabasWithOwner = demoDhabas.map(dhaba => ({
            ...dhaba,
            owner: demoUser._id
        }));

        // Insert dhabas
        const createdDhabas = await Dhaba.insertMany(dhabasWithOwner);
        console.log(`${createdDhabas.length} dhabas added successfully!`);
        
        // Add dhabas to user's listings
        demoUser.listings.push(...createdDhabas.map(d => d._id));
        await demoUser.save();
        
    } catch (error) {
        console.error('Error adding demo dhabas:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the function
addDemoDhabas();