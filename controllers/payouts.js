const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");

// 1. Create a Connect Account (Express)
// 1. Create a Connect Account (Express)
module.exports.createConnectAccount = wrapAsync(async (req, res) => {
    console.log("-> Starting Payout Onboarding for User:", req.user._id);
    const user = await User.findById(req.user._id);

    try {
        // Function to create a new account
        const createAccount = async () => {
            return await stripe.accounts.create({
                type: 'express',
                country: 'IN', // Set to India for this user base
                email: user.email,
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
                business_profile: {
                    url: `https://wanderlust.com/users/${user._id}`, // Mock URL
                },
            });
        };

        // If no account ID, create one
        if (!user.stripeAccountId) {
            const account = await createAccount();
            user.stripeAccountId = account.id;
            await user.save();
        }

        // Try creating the link
        let accountLink;
        try {
            accountLink = await stripe.accountLinks.create({
                account: user.stripeAccountId,
                refresh_url: `${req.protocol}://${req.get("host")}/payouts/onboarding`,
                return_url: `${req.protocol}://${req.get("host")}/payouts/dashboard`,
                type: 'account_onboarding',
            });
        } catch (linkError) {
            // If account not found (e.g. deleted on Stripe dashboard), create a new one
            if (linkError.code === 'account_invalid') {
                console.log("Stripe Account Invalid! Creating a new one...");
                const account = await createAccount();
                user.stripeAccountId = account.id;
                await user.save();

                // Retry link creation
                accountLink = await stripe.accountLinks.create({
                    account: user.stripeAccountId,
                    refresh_url: `${req.protocol}://${req.get("host")}/payouts/onboarding`,
                    return_url: `${req.protocol}://${req.get("host")}/payouts/dashboard`,
                    type: 'account_onboarding',
                });
            } else {
                throw linkError;
            }
        }

        res.redirect(accountLink.url);

    } catch (err) {
        console.error("Stripe Onboarding Error:", err);
        req.flash("error", "Failed to initialize payout setup: " + err.message);
        res.redirect("/payouts/dashboard");
    }
});

// 2. Render Payout Dashboard
module.exports.renderDashboard = wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    let balance = null;
    let payouts = [];
    let loginLink = null;
    let externalAccount = null;

    if (user.stripeAccountId) {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        user.payoutsEnabled = account.payouts_enabled;
        await user.save();

        if (user.payoutsEnabled) {
            try {
                // 1. Create Login Link
                loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

                // 2. Fetch Balance
                const balanceObj = await stripe.balance.retrieve({
                    stripeAccount: user.stripeAccountId
                });
                // Simplify balance structure for the view
                balance = {
                    available: balanceObj.available[0].amount / 100, // Assuming USD/INR base currency matches
                    pending: balanceObj.pending[0].amount / 100,
                    currency: balanceObj.available[0].currency.toUpperCase()
                };

                // 3. Fetch Recent Payouts
                const payoutsObj = await stripe.payouts.list({
                    limit: 5
                }, {
                    stripeAccount: user.stripeAccountId
                });
                payouts = payoutsObj.data;

                // 4. Get External Account (Bank/Card) info if available
                if (account.external_accounts && account.external_accounts.data.length > 0) {
                    const ext = account.external_accounts.data[0];
                    externalAccount = {
                        brand: ext.bank_name || ext.brand || 'Bank Account',
                        last4: ext.last4,
                        is_bank: ext.object === 'bank_account'
                    };
                }

            } catch (err) {
                console.error("Stripe Dashboard Error:", err);
                // Don't crash the page if Stripe API fails, just show what we can
            }
        }
    }

    res.render("users/payouts", { user, loginLink, balance, payouts, externalAccount });
});
