const mongoose = require("mongoose");
const Dhaba = require("../models/dhaba");

// Sample dhaba data matching the simple model
const sampleDhabas = [
  {
    title: "Baba Da Dhaba",
    image: {
      url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      filename: "dhaba1"
    },
    price: 400,
    location: "Karol Bagh, Delhi",
    country: "India",
    cuisine: "North Indian",
    category: "Casual Dining",
    establishedYear: 1985,
    operatingHours: {
      opens: "08:00",
      closes: "23:00",
      isOpen24Hours: false
    },
    specialties: ["Dal Makhani", "Butter Chicken", "Tandoori Roti", "Lassi"],
    facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section"],
    phone: "+91 98765 43210",
    email: "info@babadhaba.com",
    website: "https://babadhaba.com",
    isVegetarian: true,
    isVegan: false,
    rating: 4.5,
    geometry: {
      type: "Point",
      coordinates: [77.2090, 28.6517]
    }
  },
  {
    title: "Punjabi Tadka",
    image: {
      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      filename: "dhaba2"
    },
    price: 450,
    location: "Sector 18, Chandigarh",
    country: "India",
    cuisine: "Punjabi",
    category: "Family Restaurant",
    establishedYear: 1990,
    operatingHours: {
      opens: "11:00",
      closes: "22:30",
      isOpen24Hours: false
    },
    specialties: ["Chole Bhature", "Amritsari Fish", "Lassi", "Kulcha"],
    facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section", "Live Music"],
    phone: "+91 98765 43211",
    email: "contact@punjabitadka.com",
    website: "https://punjabitadka.com",
    isVegetarian: true,
    isVegan: false,
    rating: 4.3,
    geometry: {
      type: "Point",
      coordinates: [76.7794, 30.7333]
    }
  },
  {
    title: "Highway Spice",
    image: {
      url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      filename: "dhaba3"
    },
    price: 350,
    location: "NH-44, Haryana",
    country: "India",
    cuisine: "Multi-Cuisine",
    category: "Casual Dining",
    establishedYear: 2005,
    operatingHours: {
      opens: "06:00",
      closes: "00:00",
      isOpen24Hours: false
    },
    specialties: ["Highway Special Thali", "Tea", "Snacks", "Fresh Juices"],
    facilities: ["Parking", "WiFi", "Card Payment", "Home Delivery"],
    phone: "+91 98765 43212",
    isVegetarian: true,
    isVegan: true,
    rating: 4.2,
    geometry: {
      type: "Point",
      coordinates: [77.1025, 28.7041]
    }
  },
  {
    title: "South Indian Express",
    image: {
      url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      filename: "dhaba4"
    },
    price: 200,
    location: "Rajouri Garden, Delhi",
    country: "India",
    cuisine: "South Indian",
    category: "Fast Food",
    establishedYear: 2010,
    operatingHours: {
      opens: "07:00",
      closes: "22:00",
      isOpen24Hours: false
    },
    specialties: ["Idli", "Dosa", "Vada", "Filter Coffee", "Uttapam"],
    facilities: ["AC", "WiFi", "Card Payment", "Home Delivery"],
    phone: "+91 98765 43213",
    email: "info@southindianexpress.com",
    isVegetarian: true,
    isVegan: true,
    rating: 4.1,
    geometry: {
      type: "Point",
      coordinates: [77.1176, 28.6424]
    }
  },
  {
    title: "Mumbai Street Food",
    image: {
      url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      filename: "dhaba5"
    },
    price: 150,
    location: "Bandra West, Mumbai",
    country: "India",
    cuisine: "Street Food",
    category: "Food Truck",
    establishedYear: 2015,
    operatingHours: {
      opens: "18:00",
      closes: "02:00",
      isOpen24Hours: false
    },
    specialties: ["Vada Pav", "Pav Bhaji", "Bhel Puri", "Sev Puri", "Panipuri"],
    facilities: ["Card Payment", "Home Delivery"],
    phone: "+91 98765 43214",
    isVegetarian: true,
    isVegan: true,
    rating: 4.4,
    geometry: {
      type: "Point",
      coordinates: [72.8366, 19.0596]
    }
  },
  {
    title: "Royal Rajasthan",
    image: {
      url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      filename: "dhaba6"
    },
    price: 600,
    location: "Jaipur, Rajasthan",
    country: "India",
    cuisine: "Rajasthani",
    category: "Fine Dining",
    establishedYear: 1975,
    operatingHours: {
      opens: "12:00",
      closes: "23:00",
      isOpen24Hours: false
    },
    specialties: ["Dal Baati Churma", "Laal Maas", "Gatte ki Sabzi", "Ker Sangri", "Rajasthani Thali"],
    facilities: ["AC", "Parking", "WiFi", "Card Payment", "Family Section", "Live Music"],
    phone: "+91 98765 43215",
    email: "info@royalrajasthan.com",
    website: "https://royalrajasthan.com",
    isVegetarian: true,
    isVegan: false,
    rating: 4.6,
    geometry: {
      type: "Point",
      coordinates: [75.7873, 26.9124]
    }
  }
];

async function seedDhabas() {
  try {
    // Clear existing dhabas
    await Dhaba.deleteMany({});
    console.log("Cleared existing dhabas");

    // Insert sample dhabas
    for (let dhabaData of sampleDhabas) {
      const dhaba = new Dhaba(dhabaData);

      // Add geometry for map display (approximate coordinates)
      const locations = {
        "Karol Bagh, Delhi": [77.2090, 28.6517],
        "Sector 18, Chandigarh": [76.7794, 30.7333],
        "NH-44, Haryana": [77.1025, 28.7041],
        "Rajouri Garden, Delhi": [77.1176, 28.6424],
        "Bandra West, Mumbai": [72.8366, 19.0596],
        "Jaipur, Rajasthan": [75.7873, 26.9124]
      };

      const coords = locations[dhabaData.location];
      if (coords) {
        dhaba.geometry = {
          type: "Point",
          coordinates: coords
        };
      }

      await dhaba.save();
    }

    console.log(`✅ Seeded ${sampleDhabas.length} dhabas successfully!`);
  } catch (err) {
    console.error("❌ Error seeding dhabas:", err);
  }
}

module.exports = seedDhabas;
