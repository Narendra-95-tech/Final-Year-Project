# Dhaba Seeding Guide

## Overview
This guide explains how to add demo dhabas to the WanderLust platform using the demo account.

## Demo Account Credentials
- **Username:** demo
- **Password:** demo

## Method 1: Using the Seeding Script (Recommended)

### Step 1: Ensure MongoDB is Running
Make sure your MongoDB server is running on `localhost:27017`

### Step 2: Run the Seeding Script
```bash
node scripts/seedDemoDhabas.js
```

### Expected Output
```
✓ MongoDB Connected
✓ Demo user already exists
✓ Demo user already has X dhabas

✓ Successfully added 8 new dhabas!
✓ Total dhabas for demo user: X

📋 Added Dhabas:
   1. Spice Route Dhaba - ₹500 (North Indian)
   2. Royal Dhaba - ₹450 (Mughlai)
   3. Green Leaf Dhaba - ₹400 (Multi-Cuisine)
   4. Punjabi Tadka - ₹350 (Punjabi)
   5. Street Food Paradise - ₹250 (Street Food)
   6. Continental Cafe - ₹550 (Continental)
   7. Rajasthani Flavors - ₹400 (Rajasthani)
   8. South Indian Spice - ₹350 (South Indian)

✓ Demo dhabas seeded successfully!

🔐 Login Credentials:
   Username: demo
   Password: demo
```

## Method 2: Manual Addition via Web Interface

### Step 1: Login to the Application
1. Go to `http://localhost:3000` (or your app URL)
2. Click "Login" or "Sign In"
3. Enter credentials:
   - Username: `demo`
   - Password: `demo`

### Step 2: Add New Dhaba
1. Click "Add Dhaba" or navigate to `/dhabas/new`
2. Fill in the form with the following details:

#### Dhaba 1: Spice Route Dhaba
- **Dhaba Name:** Spice Route Dhaba
- **Description:** Authentic North Indian cuisine with a modern twist. Famous for our signature butter chicken and freshly baked tandoori naan.
- **Cuisine Type:** North Indian
- **Category:** Fine Dining
- **Average Price:** 500
- **Rating:** 4.7
- **Location:** Connaught Place, New Delhi
- **Country:** India
- **Phone:** +91 98765 12345
- **Email:** spiceroute@example.com
- **Website:** https://spiceroute.example.com
- **Established Year:** 2015
- **Opening Time:** 11:00
- **Closing Time:** 23:30
- **Specialties:** Butter Chicken, Dal Makhani, Paneer Tikka, Tandoori Naan
- **Facilities:** AC, Parking, WiFi, Card Payment, Live Music, Family Section
- **Image URL:** https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 2: Royal Dhaba
- **Dhaba Name:** Royal Dhaba
- **Description:** Premium Mughlai cuisine in an elegant setting. Experience the royal flavors of Mughal era with our signature biryani and kebabs.
- **Cuisine Type:** Mughlai
- **Category:** Fine Dining
- **Average Price:** 450
- **Rating:** 4.5
- **Location:** MG Road, Gurugram
- **Country:** India
- **Phone:** +91 98765 67890
- **Email:** royaldhaba@example.com
- **Website:** https://royaldhaba.example.com
- **Established Year:** 2018
- **Opening Time:** 12:00
- **Closing Time:** 23:00
- **Specialties:** Biryani, Seekh Kebab, Butter Naan, Shahi Paneer
- **Facilities:** AC, Valet Parking, WiFi, Card Payment, Family Section, Home Delivery
- **Image URL:** https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 3: Green Leaf Dhaba
- **Dhaba Name:** Green Leaf Dhaba
- **Description:** 100% vegetarian and vegan restaurant. Healthy, organic, and delicious multi-cuisine options for health-conscious food lovers.
- **Cuisine Type:** Multi-Cuisine
- **Category:** Family Restaurant
- **Average Price:** 400
- **Rating:** 4.3
- **Location:** Sector 29, Noida
- **Country:** India
- **Phone:** +91 98765 34567
- **Email:** greenleaf@example.com
- **Website:** https://greenleafdhaba.example.com
- **Established Year:** 2020
- **Opening Time:** 10:00
- **Closing Time:** 23:00
- **Specialties:** Paneer Tikka Masala, Dal Tadka, Whole Wheat Naan, Lassi
- **Facilities:** AC, Parking, WiFi, Card Payment, Outdoor Seating, Home Delivery
- **Vegetarian:** ✓
- **Vegan:** ✓
- **Image URL:** https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 4: Punjabi Tadka
- **Dhaba Name:** Punjabi Tadka
- **Description:** Authentic Punjabi flavors served with warmth and hospitality. A family-run dhaba serving traditional recipes passed down for generations.
- **Cuisine Type:** Punjabi
- **Category:** Casual Dining
- **Average Price:** 350
- **Rating:** 4.6
- **Location:** Sector 18, Chandigarh
- **Country:** India
- **Phone:** +91 98765 45678
- **Email:** punjabi.tadka@example.com
- **Website:** https://punjabi-tadka.example.com
- **Established Year:** 1995
- **Opening Time:** 09:00
- **Closing Time:** 22:30
- **Specialties:** Chole Bhature, Makki Di Roti, Sarson Da Saag, Lassi
- **Facilities:** AC, Parking, WiFi, Card Payment, Family Section
- **Vegetarian:** ✓
- **Image URL:** https://images.unsplash.com/photo-1555939594-58d7cb561341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 5: Street Food Paradise
- **Dhaba Name:** Street Food Paradise
- **Description:** Best street food experience in the city. From chaat to kebabs, we serve authentic street food with modern hygiene standards.
- **Cuisine Type:** Street Food
- **Category:** Fast Food
- **Average Price:** 250
- **Rating:** 4.4
- **Location:** Lajpat Nagar, New Delhi
- **Country:** India
- **Phone:** +91 98765 56789
- **Email:** streetfood@example.com
- **Established Year:** 2010
- **Opening Time:** 10:00
- **Closing Time:** 23:00
- **Specialties:** Gol Gappa, Aloo Tikki, Samosa, Chole Kulche
- **Facilities:** Outdoor Seating, Card Payment, Home Delivery
- **Vegetarian:** ✓
- **Image URL:** https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 6: Continental Cafe
- **Dhaba Name:** Continental Cafe
- **Description:** Modern continental cuisine with a cozy ambiance. Perfect for breakfast, lunch, or dinner with friends and family.
- **Cuisine Type:** Continental
- **Category:** Cafe
- **Average Price:** 550
- **Rating:** 4.5
- **Location:** Bandra, Mumbai
- **Country:** India
- **Phone:** +91 98765 78901
- **Email:** continental@example.com
- **Website:** https://continental-cafe.example.com
- **Established Year:** 2019
- **Opening Time:** 08:00
- **Closing Time:** 22:00
- **Specialties:** Pasta, Grilled Fish, Caesar Salad, Cappuccino
- **Facilities:** AC, WiFi, Card Payment, Outdoor Seating, Live Music
- **Vegetarian:** ✓
- **Image URL:** https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 7: Rajasthani Flavors
- **Dhaba Name:** Rajasthani Flavors
- **Description:** Authentic Rajasthani cuisine with traditional recipes. Experience the royal taste of Rajasthan in every bite.
- **Cuisine Type:** Rajasthani
- **Category:** Family Restaurant
- **Average Price:** 400
- **Rating:** 4.2
- **Location:** Jaipur, Rajasthan
- **Country:** India
- **Phone:** +91 98765 89012
- **Email:** rajasthani@example.com
- **Established Year:** 2012
- **Opening Time:** 11:00
- **Closing Time:** 23:00
- **Specialties:** Laal Maas, Gatte Ki Sabzi, Bajra Roti, Ker Sangri
- **Facilities:** AC, Parking, WiFi, Card Payment, Family Section
- **Vegetarian:** ✓
- **Image URL:** https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

#### Dhaba 8: South Indian Spice
- **Dhaba Name:** South Indian Spice
- **Description:** Authentic South Indian cuisine with traditional recipes. Enjoy crispy dosas, fluffy idlis, and aromatic sambar.
- **Cuisine Type:** South Indian
- **Category:** Casual Dining
- **Average Price:** 350
- **Rating:** 4.4
- **Location:** Whitefield, Bangalore
- **Country:** India
- **Phone:** +91 98765 90123
- **Email:** southindian@example.com
- **Established Year:** 2008
- **Opening Time:** 07:00
- **Closing Time:** 22:00
- **Specialties:** Masala Dosa, Idli Sambar, Uttapam, Filter Coffee
- **Facilities:** AC, Parking, WiFi, Card Payment, Family Section
- **Vegetarian:** ✓
- **Image URL:** https://images.unsplash.com/photo-1585238341710-4913dfb3d31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

## Image URLs Used

All images are from Unsplash (free, high-quality stock photos):

1. **Spice Route Dhaba** - Indian Restaurant
   https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

2. **Royal Dhaba** - Fine Dining
   https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

3. **Green Leaf Dhaba** - Vegetarian Restaurant
   https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

4. **Punjabi Tadka** - Indian Cuisine
   https://images.unsplash.com/photo-1555939594-58d7cb561341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

5. **Street Food Paradise** - Street Food
   https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

6. **Continental Cafe** - Cafe
   https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

7. **Rajasthani Flavors** - Indian Cuisine
   https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

8. **South Indian Spice** - Indian Restaurant
   https://images.unsplash.com/photo-1585238341710-4913dfb3d31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in the script

### Duplicate Key Error
- Dhabas may already exist in the database
- You can safely run the script again; it will add new dhabas

### Image Not Loading
- Check internet connection (images are loaded from Unsplash)
- Verify image URLs are correct
- Images will load when you access the dhabas page

## Verification

After running the script or adding dhabas manually:

1. Go to `http://localhost:3000/dhabas`
2. You should see all the newly added dhabas
3. Filter by cuisine type to verify they're properly categorized
4. Click on individual dhabas to view full details

## Next Steps

- Add reviews to dhabas
- Upload local images instead of using URLs
- Create bookings for dhabas
- Add more dhabas as needed

---

**Note:** All demo dhabas are owned by the demo user account and can only be edited/deleted by logging in with demo credentials.
