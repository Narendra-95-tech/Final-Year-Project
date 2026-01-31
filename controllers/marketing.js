const Subscriber = require("../models/subscriber");
const User = require("../models/user");
const { sendNewsletterWelcome } = require("../utils/emailService");

module.exports.subscribe = async (req, res) => {
    try {
        const { email, preferences = [] } = req.body;
        console.log("🔔 Subscribe Attempt:", email, "Prefs:", preferences);

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // 1. Strict Check: Must be Logged In
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Please log in to your account first." });
        }

        // 2. Strict Check: Must use THEIR own email
        if (req.user.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ success: false, message: "Please use your registered email address." });
        }

        // 3. Strict Check: Must be verified
        if (!req.user.isVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email address first." });
        }

        // 2. Check if already subscribed
        const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });

        if (existingSubscriber) {
            // Update preferences if they changed
            if (preferences.length > 0) {
                existingSubscriber.preferences = preferences;
                await existingSubscriber.save();
                return res.json({ success: true, message: "Preferences updated!" });
            }
            return res.json({ success: true, message: "You are already subscribed!" });
        }

        const newSubscriber = new Subscriber({
            email: email.toLowerCase(),
            preferences: preferences.length > 0 ? preferences : ['all']
        });
        await newSubscriber.save();

        // GENERATE PROMO CODE
        const promoCode = 'WL-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Save to User
        req.user.coupons.push({
            code: promoCode,
            discountPercent: 10,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
        await req.user.save();

        // Send Welcome Email with Code
        sendNewsletterWelcome(email, promoCode).catch(e => console.error("Email Error:", e));

        return res.json({
            success: true,
            message: "Subscribed! Your 10% OFF Code: " + promoCode,
            code: promoCode
        });

    } catch (e) {
        console.error("❌ SUBSCRIPTION ERROR:", e);
        return res.status(500).json({ success: false, message: "Server Error: " + e.message });
    }
};

// Render Admin Newsletter Page
module.exports.renderAdminNewsletter = async (req, res) => {
    const totalSubscribers = await Subscriber.countDocuments();
    const segmentStats = {
        all: totalSubscribers,
        listings: await Subscriber.countDocuments({ preferences: { $in: ['listings', 'all'] } }),
        dhabas: await Subscriber.countDocuments({ preferences: { $in: ['dhabas', 'all'] } }),
        vehicles: await Subscriber.countDocuments({ preferences: { $in: ['vehicles', 'all'] } })
    };
    res.render("admin/newsletter", { totalSubscribers, segmentStats });
};

// Send Test Email
module.exports.sendTestEmail = async (req, res) => {
    const { subject, message } = req.body;
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: req.user.email,
            subject: "[TEST] " + subject,
            html: message
        };
        const { transporter, sendEmailViaBrevo } = require("../utils/emailService");

        if (process.env.BREVO_API_KEY) {
            await sendEmailViaBrevo({ ...mailOptions, text: message.replace(/<[^>]*>?/gm, '') });
        } else {
            await transporter.sendMail(mailOptions);
        }
        return res.json({ success: true, message: "Test email sent to " + req.user.email });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

// Broadcast Email
module.exports.broadcastEmail = async (req, res) => {
    const { subject, message, segment } = req.body;

    try {
        let query = {};
        if (segment === 'dhabas') query = { preferences: { $in: ['dhabas', 'all'] } };
        if (segment === 'listings') query = { preferences: { $in: ['listings', 'all'] } };
        if (segment === 'vehicles') query = { preferences: { $in: ['vehicles', 'all'] } };

        const subscribers = await Subscriber.find(query);
        const emails = subscribers.map(s => s.email);

        if (emails.length === 0) {
            req.flash("error", "No subscribers found for this segment.");
            return res.redirect("/admin/newsletter");
        }

        console.log(`📢 Broadcasting to ${emails.length} subscribers...`);

        emails.forEach(email => {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: subject,
                html: message
            };
            const { transporter, sendEmailViaBrevo } = require("../utils/emailService");

            if (process.env.BREVO_API_KEY) {
                sendEmailViaBrevo({ ...mailOptions, html: message, text: message.replace(/<[^>]*>?/gm, '') }).catch(e => console.error("Broadcast Fail:", email, e.message));
            } else {
                transporter.sendMail(mailOptions).catch(e => console.error("Broadcast Fail:", email, e.message));
            }
        });

        req.flash("success", `Broadcast queued for ${emails.length} subscribers!`);
        res.redirect("/admin/newsletter");

    } catch (e) {
        console.error(e);
        req.flash("error", "Failed to broadcast.");
        res.redirect("/admin/newsletter");
    }
};
