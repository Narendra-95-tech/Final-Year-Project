const sampleListings = [
  {
    title: "Cozy Beachfront Cottage",
    description:
      "Escape to this charming beachfront cottage for a relaxing getaway. Enjoy stunning ocean views and easy access to the beach.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1500,
    location: "Malibu",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-118.7789, 34.0259]
    },
    guests: 4, bedrooms: 2, beds: 2, bathrooms: 1
  },
  {
    title: "Modern Loft in Downtown",
    description:
      "Stay in the heart of the city in this stylish loft apartment. Perfect for urban explorers!",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1200,
    location: "New York City",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-74.0060, 40.7128]
    },
    guests: 4, bedrooms: 1, beds: 2, bathrooms: 1
  },
  {
    title: "Mountain Retreat",
    description:
      "Unplug and unwind in this peaceful mountain cabin. Surrounded by nature, it's a perfect place to recharge.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 1000,
    location: "Aspen",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-106.8175, 39.1911]
    },
    guests: 6, bedrooms: 3, beds: 4, bathrooms: 2
  },
  {
    title: "Historic Villa in Tuscany",
    description:
      "Experience the charm of Tuscany in this beautifully restored villa. Explore the rolling hills and vineyards.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 2500,
    location: "Florence",
    country: "Italy",
    geometry: {
      type: "Point",
      coordinates: [11.2558, 43.7696]
    }
  },
  {
    title: "Secluded Treehouse Getaway",
    description:
      "Live among the treetops in this unique treehouse retreat. A true nature lover's paradise.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 800,
    location: "Portland",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-122.6765, 45.5236]
    }
  },
  {
    title: "Beachfront Paradise",
    description:
      "Step out of your door onto the sandy beach. This beachfront condo offers the ultimate relaxation.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 2000,
    location: "Cancun",
    country: "Mexico",
    geometry: {
      type: "Point",
      coordinates: [-86.8515, 21.1619]
    }
  },
  {
    title: "Rustic Cabin by the Lake",
    description:
      "Spend your days fishing and kayaking on the serene lake. This cozy cabin is perfect for outdoor enthusiasts.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 900,
    location: "Lake Tahoe",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-120.1208, 39.2399]
    }
  },
  {
    title: "Luxury Penthouse with City Views",
    description:
      "Indulge in luxury living with panoramic city views from this stunning penthouse apartment.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 3500,
    location: "Los Angeles",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-118.2437, 34.0522]
    }
  },
  {
    title: "Ski-In/Ski-Out Chalet",
    description:
      "Hit the slopes right from your doorstep in this ski-in/ski-out chalet in the Swiss Alps.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 3000,
    location: "Verbier",
    country: "Switzerland",
    geometry: {
      type: "Point",
      coordinates: [7.2333, 46.1000]
    }
  },
  {
    title: "Safari Lodge in the Serengeti",
    description:
      "Experience the thrill of the wild in a comfortable safari lodge. Witness the Great Migration up close.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 4000,
    location: "Serengeti National Park",
    country: "Tanzania",
    geometry: {
      type: "Point",
      coordinates: [34.5667, -2.3333]
    }
  },
  {
    title: "Historic Canal House",
    description:
      "Stay in a piece of history in this beautifully preserved canal house in Amsterdam's iconic district.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FtcGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1800,
    location: "Amsterdam",
    country: "Netherlands",
    geometry: {
      type: "Point",
      coordinates: [4.9041, 52.3676]
    }
  },
  {
    title: "Private Island Retreat",
    description:
      "Have an entire island to yourself for a truly exclusive and unforgettable vacation experience.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1618140052121-39fc6db33972?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bG9kZ2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 10000,
    location: "Fiji",
    country: "Fiji",
    geometry: {
      type: "Point",
      coordinates: [178.0650, -17.7134]
    }
  },
  {
    title: "Charming Cottage in the Cotswolds",
    description:
      "Escape to the picturesque Cotswolds in this quaint and charming cottage with a thatched roof.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1602088113235-229c19758e9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmVhY2glMjB2YWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1200,
    location: "Cotswolds",
    country: "United Kingdom",
    geometry: {
      type: "Point",
      coordinates: [-1.7500, 51.8333]
    }
  },
  {
    title: "Historic Brownstone in Boston",
    description:
      "Step back in time in this elegant historic brownstone located in the heart of Boston.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1533619239233-6280475a633a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 2200,
    location: "Boston",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-71.0589, 42.3601]
    }
  },
  {
    title: "Beachfront Bungalow in Bali",
    description:
      "Relax on the sandy shores of Bali in this beautiful beachfront bungalow with a private pool.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1602391833977-358a52198938?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1800,
    location: "Bali",
    country: "Indonesia",
    geometry: {
      type: "Point",
      coordinates: [115.1889, -8.3405]
    }
  },
  {
    title: "Mountain View Cabin in Banff",
    description:
      "Enjoy breathtaking mountain views from this cozy cabin in the Canadian Rockies.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 1500,
    location: "Banff",
    country: "Canada",
    geometry: {
      type: "Point",
      coordinates: [-115.5708, 51.4968]
    }
  },
  {
    title: "Art Deco Apartment in Miami",
    description:
      "Step into the glamour of the 1920s in this stylish Art Deco apartment in South Beach.",
    image: {
      filename: "listingimage",
      url: "https://plus.unsplash.com/premium_photo-1670963964797-942df1804579?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 1600,
    location: "Miami",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-80.1918, 25.7617]
    }
  },
  {
    title: "Tropical Villa in Phuket",
    description:
      "Escape to a tropical paradise in this luxurious villa with a private infinity pool in Phuket.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1470165301023-58dab8118cc9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 3000,
    location: "Phuket",
    country: "Thailand",
    geometry: {
      type: "Point",
      coordinates: [98.3923, 7.8804]
    }
  },
  {
    title: "Historic Castle in Scotland",
    description:
      "Live like royalty in this historic castle in the Scottish Highlands. Explore the rugged beauty of the area.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJlYWNoJTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 4000,
    location: "Scottish Highlands",
    country: "United Kingdom",
    geometry: {
      type: "Point",
      coordinates: [-5.2042, 57.4778]
    }
  },
  {
    title: "Desert Oasis in Dubai",
    description:
      "Experience luxury in the middle of the desert in this opulent oasis in Dubai with a private pool.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZHViYWl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 5000,
    location: "Dubai",
    country: "United Arab Emirates",
    geometry: {
      type: "Point",
      coordinates: [55.2708, 25.2048]
    }
  },
  {
    title: "Rustic Log Cabin in Montana",
    description:
      "Unplug and unwind in this cozy log cabin surrounded by the natural beauty of Montana.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 1100,
    location: "Montana",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-110.3626, 46.8797]
    }
  },
  {
    title: "Beachfront Villa in Greece",
    description:
      "Enjoy the crystal-clear waters of the Mediterranean in this beautiful beachfront villa on a Greek island.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dmlsbGF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 2500,
    location: "Mykonos",
    country: "Greece",
    geometry: {
      type: "Point",
      coordinates: [25.3289, 37.4467]
    }
  },
  {
    title: "Eco-Friendly Treehouse Retreat",
    description:
      "Stay in an eco-friendly treehouse nestled in the forest. It's the perfect escape for nature lovers.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 750,
    location: "Costa Rica",
    country: "Costa Rica",
    geometry: {
      type: "Point",
      coordinates: [-85.1209, 10.2982]
    }
  },
  {
    title: "Historic Cottage in Charleston",
    description:
      "Experience the charm of historic Charleston in this beautifully restored cottage with a private garden.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 1600,
    location: "Charleston",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-79.9311, 32.7767]
    }
  },
  {
    title: "Modern Apartment in Tokyo",
    description:
      "Explore the vibrant city of Tokyo from this modern and centrally located apartment.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHRva3lvfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    price: 2000,
    location: "Tokyo",
    country: "Japan",
    geometry: {
      type: "Point",
      coordinates: [139.6917, 35.6895]
    }
  },
  {
    title: "Lakefront Cabin in New Hampshire",
    description:
      "Spend your days by the lake in this cozy cabin in the scenic White Mountains of New Hampshire.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDF8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1200,
    location: "New Hampshire",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-71.5724, 43.1939]
    }
  },
  {
    title: "Luxury Villa in the Maldives",
    description:
      "Indulge in luxury in this overwater villa in the Maldives with stunning views of the Indian Ocean.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bGFrZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 6000,
    location: "Maldives",
    country: "Maldives",
    geometry: {
      type: "Point",
      coordinates: [73.2207, 3.2028]
    }
  },
  {
    title: "Ski Chalet in Aspen",
    description:
      "Hit the slopes in style with this luxurious ski chalet in the world-famous Aspen ski resort.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGxha2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 4000,
    location: "Aspen",
    country: "United States",
    geometry: {
      type: "Point",
      coordinates: [-106.8175, 39.1911]
    }
  },
  {
    title: "Secluded Beach House in Costa Rica",
    description:
      "Escape to a secluded beach house on the Pacific coast of Costa Rica. Surf, relax, and unwind.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhY2glMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    },
    price: 1800,
    location: "Costa Rica",
    country: "Costa Rica",
    geometry: {
      type: "Point",
      coordinates: [-85.1209, 10.2982]
    }
  },
];

const sampleVehicles = [
  {
    title: "Royal Enfield Classic 350",
    description: "Classic motorcycle perfect for highway cruising and city rides.",
    image: {
      filename: "vehicle1",
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    price: 1200,
    location: "Mumbai",
    country: "India",
    vehicleType: "bike",
    brand: "Royal Enfield",
    model: "Classic 350",
    year: 2023,
    fuelType: "petrol",
    transmission: "manual",
    seats: 2,
    mileage: "35 kmpl",
    features: ["Classic Design", "Comfortable Seating", "Good Mileage"],
    availability: true,
    geometry: {
      type: "Point",
      coordinates: [72.8777, 19.0760]
    }
  },
  {
    title: "Toyota Innova Crysta",
    description: "Spacious MPV perfect for family trips and long drives.",
    image: {
      filename: "vehicle2",
      url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    price: 3000,
    location: "Delhi",
    country: "India",
    vehicleType: "car",
    brand: "Toyota",
    model: "Innova Crysta",
    year: 2022,
    fuelType: "diesel",
    transmission: "manual",
    seats: 7,
    mileage: "15 kmpl",
    features: ["7 Seater", "AC", "Music System", "Spacious"],
    availability: true,
    geometry: {
      type: "Point",
      coordinates: [77.1025, 28.7041]
    }
  },
  {
    title: "Honda Activa 6G",
    description: "Reliable scooter for daily commuting and short trips.",
    image: {
      filename: "vehicle3",
      url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    price: 500,
    location: "Bangalore",
    country: "India",
    vehicleType: "scooter",
    brand: "Honda",
    model: "Activa 6G",
    year: 2023,
    fuelType: "petrol",
    transmission: "automatic",
    seats: 2,
    mileage: "50 kmpl",
    features: ["Easy Handling", "Good Mileage", "Storage Space"],
    availability: true,
    geometry: {
      type: "Point",
      coordinates: [77.5946, 12.9716]
    }
  },
  {
    title: "Mahindra Thar",
    description: "Off-road SUV perfect for adventure trips and rough terrains.",
    image: {
      filename: "vehicle4",
      url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    price: 2500,
    location: "Pune",
    country: "India",
    vehicleType: "car",
    brand: "Mahindra",
    model: "Thar",
    year: 2022,
    fuelType: "diesel",
    transmission: "manual",
    seats: 4,
    mileage: "12 kmpl",
    features: ["4x4", "Off-road", "Adventure Ready", "Convertible"],
    availability: true,
    geometry: {
      type: "Point",
      coordinates: [73.8567, 18.5204]
    }
  },
  {
    title: "Bajaj Pulsar 220",
    description: "Sporty bike for enthusiasts who love speed and performance.",
    image: {
      filename: "vehicle5",
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    price: 900,
    location: "Hyderabad",
    country: "India",
    vehicleType: "bike",
    brand: "Bajaj",
    model: "Pulsar 220",
    year: 2023,
    fuelType: "petrol",
    transmission: "manual",
    seats: 2,
    mileage: "40 kmpl",
    features: ["Sporty Design", "Good Performance", "Digital Display"],
    availability: true,
    geometry: {
      type: "Point",
      coordinates: [78.4867, 17.3850]
    }
  },
  {
    title: "Maruti Swift",
    description: "Compact hatchback perfect for city driving and daily commute.",
    image: {
      filename: "vehicle6",
      url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    price: 1500,
    location: "Chennai",
    country: "India",
    vehicleType: "car",
    brand: "Maruti",
    model: "Swift",
    year: 2023,
    fuelType: "petrol",
    transmission: "manual",
    seats: 5,
    mileage: "20 kmpl",
    features: ["Compact", "Fuel Efficient", "Easy Parking", "AC"],
    availability: true,
    geometry: {
      type: "Point",
      coordinates: [80.2707, 13.0827]
    }
  }
];

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

module.exports = { sampleListings, sampleVehicles, sampleDhabas };