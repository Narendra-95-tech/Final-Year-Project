const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const Listing = require("../models/listing");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Combined AI chat
router.post("/ask", async (req, res) => {
  const { message, listingId } = req.body;

  try {
    let systemMessage = "You are a smart travel assistant for WanderLust users.";

    // If a listing is specified, add its details
    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (listing) {
        systemMessage = `You are a travel assistant for this listing: ${listing.title}, located at ${listing.location}. Answer questions specifically about this listing.`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.json({ reply: "Sorry, something went wrong while processing your question." });
  }
});

module.exports = router;
