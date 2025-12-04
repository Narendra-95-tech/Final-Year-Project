const mongoose = require('mongoose');
const User = require('../models/user');

// Database connection
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

mongoose.connect(dbUrl)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to make a user admin
async function makeAdmin(email) {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    if (user.role === 'admin') {
      console.log(`User ${email} is already an admin`);
      process.exit(0);
    }
    
    user.role = 'admin';
    await user.save();
    
    console.log(`Successfully made ${email} an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node scripts/makeAdmin.js user@example.com');
  process.exit(1);
}

// Run the function
makeAdmin(email);
