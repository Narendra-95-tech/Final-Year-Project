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

// Comprehensive dhaba data with high-quality images
const demoDhabas = [
    {
        title: "Spice Route Dhaba",
        description: "Authentic North Indian cuisine with a modern twist. Famous for our signature butter chicken and freshly baked tandoori naan.",
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
        specialties: ["Butter Chicken", "Dal Makhani", "Paneer Tikka", "Tandoori Naan"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Live Music", "Family Section"],
        phone: "+91 98765 12345",
        email: "spiceroute@example.com",
        website: "https://spiceroute.example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.7,
        geometry: {
            type: "Point",
            coordinates: [77.2066, 28.6280]
        }
    },
    {
        title: "Royal Dhaba",
        description: "Premium North Indian cuisine in an elegant setting. Experience the royal flavors with our signature biryani and kebabs.",
        image: {
            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "royal-dhaba"
        },
        price: 450,
        location: "MG Road, Gurugram",
        country: "India",
        cuisine: "North Indian",
        category: "Fine Dining",
        establishedYear: 2018,
        operatingHours: {
            opens: "12:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Biryani", "Seekh Kebab", "Butter Naan", "Shahi Paneer"],
        facilities: ["AC", "Valet Parking", "WiFi", "Card Payment", "Family Section", "Home Delivery"],
        phone: "+91 98765 67890",
        email: "royaldhaba@example.com",
        website: "https://royaldhaba.example.com",
        isVegetarian: false,
        isVegan: false,
        rating: 4.5,
        geometry: {
            type: "Point",
            coordinates: [77.1025, 28.4595]
        }
    },
    {
        title: "Green Leaf Dhaba",
        description: "100% vegetarian and vegan restaurant. Healthy, organic, and delicious multi-cuisine options for health-conscious food lovers.",
        image: {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
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
        specialties: ["Paneer Tikka Masala", "Dal Tadka", "Whole Wheat Naan", "Lassi"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Outdoor Seating", "Home Delivery"],
        phone: "+91 98765 34567",
        email: "greenleaf@example.com",
        website: "https://greenleafdhaba.example.com",
        isVegetarian: true,
        isVegan: true,
        rating: 4.3,
        geometry: {
            type: "Point",
            coordinates: [77.3277, 28.5744]
        }
    },
    {
        title: "Punjabi Tadka",
        description: "Authentic Punjabi flavors served with warmth and hospitality. A family-run dhaba serving traditional recipes passed down for generations.",
        image: {
            url: "https://images.unsplash.com/photo-1555939594-58d7cb561341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "punjabi-tadka"
        },
        price: 350,
        location: "Sector 18, Chandigarh",
        country: "India",
        cuisine: "Punjabi",
        category: "Casual Dining",
        establishedYear: 1995,
        operatingHours: {
            opens: "09:00",
            closes: "22:30",
            isOpen24Hours: false
        },
        specialties: ["Chole Bhature", "Makki Di Roti", "Sarson Da Saag", "Lassi"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 45678",
        email: "punjabi.tadka@example.com",
        website: "https://punjabi-tadka.example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.6,
        geometry: {
            type: "Point",
            coordinates: [76.7794, 30.7333]
        }
    },
    {
        title: "Street Food Paradise",
        description: "Best street food experience in the city. From chaat to kebabs, we serve authentic street food with modern hygiene standards.",
        image: {
            url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "street-food-paradise"
        },
        price: 250,
        location: "Lajpat Nagar, New Delhi",
        country: "India",
        cuisine: "Street Food",
        category: "Fast Food",
        establishedYear: 2010,
        operatingHours: {
            opens: "10:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Gol Gappa", "Aloo Tikki", "Samosa", "Chole Kulche"],
        facilities: ["Outdoor Seating", "Card Payment", "Home Delivery"],
        phone: "+91 98765 56789",
        email: "streetfood@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.4,
        geometry: {
            type: "Point",
            coordinates: [77.2500, 28.5621]
        }
    },
    {
        title: "Continental Cafe",
        description: "Modern continental cuisine with a cozy ambiance. Perfect for breakfast, lunch, or dinner with friends and family.",
        image: {
            url: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "continental-cafe"
        },
        price: 550,
        location: "Bandra, Mumbai",
        country: "India",
        cuisine: "Continental",
        category: "Cafe",
        establishedYear: 2019,
        operatingHours: {
            opens: "08:00",
            closes: "22:00",
            isOpen24Hours: false
        },
        specialties: ["Pasta", "Grilled Fish", "Caesar Salad", "Cappuccino"],
        facilities: ["AC", "WiFi", "Card Payment", "Outdoor Seating", "Live Music"],
        phone: "+91 98765 78901",
        email: "continental@example.com",
        website: "https://continental-cafe.example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.5,
        geometry: {
            type: "Point",
            coordinates: [72.8326, 19.0596]
        }
    },
    {
        title: "Rajasthani Flavors",
        description: "Authentic Rajasthani cuisine with traditional recipes. Experience the royal taste of Rajasthan in every bite.",
        image: {
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "rajasthani-flavors"
        },
        price: 400,
        location: "Jaipur, Rajasthan",
        country: "India",
        cuisine: "Rajasthani",
        category: "Family Restaurant",
        establishedYear: 2012,
        operatingHours: {
            opens: "11:00",
            closes: "23:00",
            isOpen24Hours: false
        },
        specialties: ["Laal Maas", "Gatte Ki Sabzi", "Bajra Roti", "Ker Sangri"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 89012",
        email: "rajasthani@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.2,
        geometry: {
            type: "Point",
            coordinates: [75.7873, 26.9124]
        }
    },
    {
        title: "South Indian Spice",
        description: "Authentic South Indian cuisine with traditional recipes. Enjoy crispy dosas, fluffy idlis, and aromatic sambar.",
        image: {
            url: "https://images.unsplash.com/photo-1585238341710-4913dfb3d31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            filename: "south-indian-spice"
        },
        price: 350,
        location: "Whitefield, Bangalore",
        country: "India",
        cuisine: "South Indian",
        category: "Casual Dining",
        establishedYear: 2008,
        operatingHours: {
            opens: "07:00",
            closes: "22:00",
            isOpen24Hours: false
        },
        specialties: ["Masala Dosa", "Idli Sambar", "Uttapam", "Filter Coffee"],
        facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
        phone: "+91 98765 90123",
        email: "southindian@example.com",
        isVegetarian: true,
        isVegan: false,
        rating: 4.4,
        geometry: {
            type: "Point",
            coordinates: [77.7499, 13.0827]
        }
    }
];

// Function to add dhabas
const seedDemoDhabas = async () => {
    try {
        // Find or create demo user
        let demoUser = await User.findOne({ username: 'demo' });
        
        if (!demoUser) {
            console.log('Creating demo user...');
            demoUser = new User({
                username: 'demo',
                email: 'demo@wanderlust.com',
                role: 'owner'
            });
            
            // Set password
            await demoUser.setPassword('demo');
            await demoUser.save();
            console.log('✓ Demo user created successfully');
        } else {
            console.log('✓ Demo user already exists');
        }

        // Check if dhabas already exist
        const existingCount = await Dhaba.countDocuments({ owner: demoUser._id });
        console.log(`\n✓ Demo user already has ${existingCount} dhabas`);

        // Add demo user's ID to each dhaba
        const dhabasWithOwner = demoDhabas.map(dhaba => ({
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
        console.log('\n📋 Added Dhabas:');
        createdDhabas.forEach((dhaba, index) => {
            console.log(`   ${index + 1}. ${dhaba.title} - ₹${dhaba.price} (${dhaba.cuisine})`);
        });
        
        console.log('\n✓ Demo dhabas seeded successfully!');
        console.log('\n🔐 Login Credentials:');
        console.log('   Username: demo');
        console.log('   Password: demo');
        
    } catch (error) {
        console.error('✗ Error adding demo dhabas:', error.message);
        if (error.code === 11000) {
            console.error('Note: Some dhabas may already exist in the database');
        }
    } finally {
        mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
};

// Run the function
seedDemoDhabas();
