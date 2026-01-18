const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");

// 1. Create a Connect Account (Express)
module.exports.createConnectAccount = wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);

    // If already exists, skip creation
    if (!user.stripeAccountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'US', // Reverted to US for testing compatibility
            email: user.email,
            capabilities: {
                transfers: { requested: true },
            },
            business_type: 'individual',
            business_profile: {
                url: `https://wanderlust.com/users/${user._id}`, // Mock URL
            },
        });

        user.stripeAccountId = account.id;
        await user.save();
    }

    // 2. Create Account Link (for onboarding flow)
    const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${req.protocol}://${req.get("host")}/payouts/onboarding`,
        return_url: `${req.protocol}://${req.get("host")}/payouts/dashboard`,
        type: 'account_onboarding',
    });

    res.redirect(accountLink.url);
});

// 2. Render Payout Dashboard
module.exports.renderDashboard = wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    let balance = null;
    let loginLink = null;

    if (user.stripeAccountId) {
        // Check if fully onboarded
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        user.payoutsEnabled = account.payouts_enabled;
        await user.save();

        if (user.payoutsEnabled) {
            // Create a Login Link for them to view their Stripe Express Dashboard
            loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

            // Optional: Fetch balance (though Express dashboard is better for this)
            // balance = await stripe.balance.retrieve({ stripeAccount: user.stripeAccountId });
        }
    }

    res.render("users/payouts", { user, loginLink });
});
