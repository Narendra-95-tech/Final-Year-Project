const mongoose = require('mongoose');
const Conversation = require('../models/conversation');
require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL;

async function checkLearnings() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");

        // Find the most recently updated conversation
        const conversation = await Conversation.findOne({}).sort({ updatedAt: -1 });

        if (conversation) {
            console.log("\n--- Most Recent Conversation ---");
            console.log("User ID:", conversation.user);
            console.log("Learnings:", JSON.stringify(conversation.learnings, null, 2));

            if (conversation.learnings && conversation.learnings.travelStyle === 'budget') {
                console.log("\n✅ SUCCESS: Travel style 'budget' was correctly learned!");
            } else {
                console.log("\n❌ FAILURE: Travel style was NOT learned or incorrect.");
            }
        } else {
            console.log("No conversations found.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkLearnings();
