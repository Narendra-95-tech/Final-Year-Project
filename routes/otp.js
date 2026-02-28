const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../utils/otpService');
const { isLoggedIn } = require('../middleware');

/**
 * Route to request an OTP
 * POST /api/otp/send
 */
router.post('/send', isLoggedIn, async (req, res) => {
    // ✅ SECURITY FIX: Always send OTP to the logged-in user's own email only.
    // Never allow sending to an arbitrary email — prevents email bombing.
    const targetEmail = req.user.email;

    if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Email not found on your account' });
    }

    const { purpose } = req.body;
    const result = await sendOTP(targetEmail, purpose);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

/**
 * Route to verify an OTP
 * POST /api/otp/verify
 */
router.post('/verify', isLoggedIn, async (req, res) => {
    const { otp, purpose, email } = req.body;
    const targetEmail = email || req.user.email;

    if (!otp || !targetEmail) {
        return res.status(400).json({ success: false, message: 'OTP and email are required' });
    }

    const result = await verifyOTP(targetEmail, otp, purpose);
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

module.exports = router;
