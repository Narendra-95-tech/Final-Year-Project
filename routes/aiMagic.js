const express = require("express");
const router = express.Router();
const smartChatbot = require("../utils/smartChatbot");
const { isLoggedIn } = require("../middleware");

// ============================
// AI MAGIC: SMART PRICING
// ============================
router.post("/magic-price", isLoggedIn, async (req, res) => {
    try {
        const { title, location, type, currentPrice, description } = req.body;
        const result = await smartChatbot.calculatePrice({ title, location, type, currentPrice, description });
        res.json(result);
    } catch (error) {
        console.error("AI Price Route Error:", error);
        res.status(500).json({ error: "Failed to calculate AI price" });
    }
});

// ============================
// AI MAGIC: VISUAL INTELLIGENCE
// ============================
router.post("/visual-search", isLoggedIn, async (req, res) => {
    try {
        const { imageUrl, title } = req.body;
        const result = await smartChatbot.analyzeImage(imageUrl, { title });
        res.json(result);
    } catch (error) {
        console.error("AI Visual Search Route Error:", error);
        res.status(500).json({ error: "Failed to analyze image" });
    }
});

module.exports = router;
