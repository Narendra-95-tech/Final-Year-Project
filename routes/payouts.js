const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const payoutsController = require("../controllers/payouts");

// Dashboard
router.get("/dashboard", isLoggedIn, payoutsController.renderDashboard);

// Onboarding Start (Redirects to Stripe)
router.post("/onboarding", isLoggedIn, payoutsController.createConnectAccount);

// Onboarding Return (Callback from Stripe)
// We treat this same as "createConnectAccount" or "renderDashboard" really, 
// as createConnectAccount handles the link generation if it's missing or re-calls it.
// Simpler: Just redirect back to dashboard which checks status.
router.get("/onboarding", isLoggedIn, (req, res) => {
    res.redirect("/payouts/dashboard");
});

module.exports = router;
