const OTP = require('../models/otp');
const { transporter } = require('./emailService');

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to an email address
 */
async function sendOTP(email, purpose = 'booking-verification') {
    try {
        const otpCode = generateOTP();

        // 1. Save OTP to database
        const otpEntry = new OTP({
            email,
            otp: otpCode,
            purpose,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });
        await otpEntry.save();

        // 2. Prepare Email
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: `🔐 Your WanderLust Verification Code: ${otpCode}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .content { padding: 30px 20px; text-align: center; }
            .otp-box { background: #f0fdf4; border: 2px dashed #0FAA5B; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 36px; font-weight: bold; color: #0FAA5B; letter-spacing: 5px; }
            .footer { text-align: center; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
            .warning { color: #dc2626; font-size: 13px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="color: #0FAA5B; margin: 0;">WanderLust Security</h2>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>You requested a verification code for <strong>${purpose.replace('-', ' ')}</strong>.</p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
              </div>
              
              <p>This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
              
              <p class="warning">
                ⚠️ If you didn't request this, please ignore this email or change your password.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 WanderLust Travel & Experiences Co.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent to ${email}. MessageId: ${info.messageId}`);
        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        console.error('❌ OTP Send Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Verify an OTP
 */
async function verifyOTP(email, otpCode, purpose = 'booking-verification') {
    try {
        const otpRecord = await OTP.findOne({
            email,
            otp: otpCode,
            purpose,
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return { success: false, message: 'Invalid or expired OTP' };
        }

        // Mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
        console.error('❌ OTP Verify Error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendOTP,
    verifyOTP
};
