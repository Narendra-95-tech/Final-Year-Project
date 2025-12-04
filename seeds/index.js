const mongoose = require("mongoose");
require("dotenv").config();

const seedDhabas = require("./dhabas");

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Run seeds
async function runSeeds() {
  try {
    console.log("🌱 Starting dhaba seeding...");
    await seedDhabas();
    console.log("🎉 All seeds completed successfully!");
  } catch (err) {
    console.error("❌ Error running seeds:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the seeding
connectDB().then(runSeeds);
