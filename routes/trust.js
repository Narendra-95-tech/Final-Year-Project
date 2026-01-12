const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

// Verification Dashboard
router.get("/verify", isLoggedIn, (req, res) => {
    res.render("users/verify.ejs");
});

// Handle Document Upload
router.post("/verify", isLoggedIn, upload.array("documents"), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const docs = req.files.map(f => ({
            url: f.path,
            filename: f.filename,
            type: req.body.docType || 'ID'
        }));

        user.verificationDocuments.push(...docs);
        user.verificationStatus = 'Pending';
        await user.save();

        req.flash("success", "Verification documents uploaded successfully! We will review them shortly. ✨");
        res.redirect("/profile");
    } catch (error) {
        console.error("Verification error:", error);
        req.flash("error", "Could not process verification. Please try again.");
        res.redirect("/trust/verify");
    }
});

// Wallet Dashboard
router.get("/wallet", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("users/wallet.ejs", { user });
});

// Add Simulated Funds
router.post("/wallet/add", isLoggedIn, async (req, res) => {
    try {
        const { amount } = req.body;
        const addAmount = parseFloat(amount);

        if (isNaN(addAmount) || addAmount <= 0) {
            req.flash("error", "Invalid amount");
            return res.redirect("/trust/wallet");
        }

        const user = await User.findById(req.user._id);
        user.walletBalance += addAmount;
        await user.save();

        req.flash("success", `₹${addAmount} added to your WanderLust Wallet! 💳✨`);
        res.redirect("/trust/wallet");
    } catch (error) {
        console.error("Wallet error:", error);
        req.flash("error", "Failed to add funds.");
        res.redirect("/trust/wallet");
    }
});

module.exports = router;
