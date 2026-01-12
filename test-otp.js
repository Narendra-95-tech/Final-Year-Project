require('dotenv').config();
const { sendOTP, verifyOTP } = require('./utils/otpService');

console.log('🧪 Testing OTP Verification System...\n');

// Check if email credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Error: EMAIL_USER and EMAIL_PASSWORD not found in .env file');
    process.exit(1);
}

const testEmail = process.env.EMAIL_USER;

async function runOTPTest() {
    console.log(`📨 Test 1: Sending OTP to ${testEmail}...`);

    try {
        const sendResult = await sendOTP(testEmail, 'booking-verification');

        if (sendResult.success) {
            console.log('✅ OTP sent successfully! Please check your email inbox.');

            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('\n🔑 Enter the 6-digit OTP you received: ', async (enteredOTP) => {
                console.log('\n📨 Test 2: Verifying OTP...');

                try {
                    const verifyResult = await verifyOTP(testEmail, enteredOTP, 'booking-verification');

                    if (verifyResult.success) {
                        console.log('✅ OTP Verified Successfully!');
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('🎉 OTP System is working perfectly!');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    } else {
                        console.log('❌ OTP Verification Failed:', verifyResult.message);
                    }
                } catch (error) {
                    console.error('❌ Error verifying OTP:', error.message);
                }

                readline.close();
                process.exit(0);
            });

        } else {
            console.log('❌ Failed to send OTP:', sendResult.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error sending OTP:', error.message);
        process.exit(1);
    }
}

// Ensure database connection (optional if running standalone, but good for real tests)
const mongoose = require('mongoose');
mongoose.connect(process.env.ATLASDB_URL)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        runOTPTest();
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });
