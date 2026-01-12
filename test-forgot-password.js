require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const OTP = require('./models/otp');
const { sendOTP, verifyOTP } = require('./utils/otpService');

console.log('🧪 Testing Forgot Password OTP Flow...\n');

const testEmail = 'reset_test_' + Date.now() + '@example.com';
const testUsername = 'reset_user_' + Date.now();
const testOldPassword = 'oldPassword123';
const testNewPassword = 'newPassword456';

async function runResetTest() {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✅ Connected to MongoDB');

        // 2. Create a user
        console.log(`\n👤 Step 1: Creating user for reset test: ${testEmail}`);
        const user = new User({
            email: testEmail,
            username: testUsername,
            isVerified: true
        });
        await User.register(user, testOldPassword);
        console.log('✅ User created and registered');

        // 3. Trigger Forgot Password (Send OTP)
        console.log('\n📨 Step 2: Sending OTP for password reset...');
        const sendResult = await sendOTP(testEmail, 'password-reset');

        if (sendResult.success) {
            console.log('✅ OTP Entry created in DB for password-reset');

            // Get OTP from DB
            const otpRecord = await OTP.findOne({ email: testEmail, purpose: 'password-reset' });
            console.log(`🔍 Intercepted Reset OTP: ${otpRecord.otp}`);

            // 4. Verify OTP
            console.log('\n🔐 Step 3: Verifying OTP...');
            const verifyResult = await verifyOTP(testEmail, otpRecord.otp, 'password-reset');

            if (verifyResult.success) {
                console.log('✅ OTP Verified');

                // 5. Simulate Controller Password Reset
                console.log('\n🔄 Step 4: Simulating password reset logic...');
                const userToUpdate = await User.findOne({ email: testEmail });
                if (userToUpdate) {
                    await userToUpdate.setPassword(testNewPassword);
                    await userToUpdate.save();
                    console.log('✅ Password updated in DB using setPassword()');

                    // 6. Verify Login with New Password
                    console.log('\n🔑 Step 5: Verifying login with new password...');
                    const { user: authenticatedUser } = await User.authenticate()(testUsername, testNewPassword);

                    if (authenticatedUser) {
                        console.log('✅ Login successful with NEW password!');
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('🎉 Forgot Password OTP system is perfect!');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    } else {
                        console.log('❌ Login failed with NEW password');
                    }
                }
            }
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await User.deleteOne({ email: testEmail });
        await OTP.deleteOne({ email: testEmail });
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runResetTest();
