const mongoose = require('mongoose');
const Conversation = require('../models/conversation');
require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL;

async function checkConversations() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");

        const conversations = await Conversation.find({}).sort({ updatedAt: -1 });

        console.log(`Found ${conversations.length} conversations.`);

        conversations.forEach((conv, i) => {
            console.log(`\n--- Conversation ${i + 1} (User: ${conv.user}) ---`);
            console.log("Last messages:");
            conv.messages.slice(-3).forEach(m => {
                console.log(`[${m.role}]: ${m.content ? m.content.substring(0, 100) : 'FUNCTION_CALL'}`);
            });
        });

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkConversations();
