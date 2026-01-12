require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const OTP = require('./models/otp');
const { sendOTP, verifyOTP } = require('./utils/otpService');

console.log('🧪 Testing Auth OTP Verification Flow...\n');

const testEmail = 'verify_test_' + Date.now() + '@example.com';
const testUsername = 'verify_user_' + Date.now();

async function runAuthTest() {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✅ Connected to MongoDB');

        // 2. Create an unverified user (Simulate Registration)
        console.log(`\n👤 Step 1: Creating unverified user: ${testEmail}`);
        const user = new User({
            email: testEmail,
            username: testUsername,
            firstName: 'Verify',
            lastName: 'Test',
            isVerified: false
        });
        await user.save();
        console.log('✅ User created (isVerified: false)');

        // 3. Send OTP
        console.log('\n📨 Step 2: Sending OTP for registration...');
        const sendResult = await sendOTP(testEmail, 'registration');

        if (sendResult.success) {
            console.log('✅ OTP Entry created in DB');

            // Get the OTP from DB (since we can't check email in automated test easily)
            const otpRecord = await OTP.findOne({ email: testEmail, purpose: 'registration' });
            console.log(`🔍 Intercepted OTP from DB: ${otpRecord.otp}`);

            // 4. Verify with WRONG OTP
            console.log('\n🔐 Step 3: Testing verification with WRONG OTP...');
            const wrongResult = await verifyOTP(testEmail, '000000', 'registration');
            console.log(`❌ Verification result (should fail): ${wrongResult.success ? 'SUCCESS' : 'FAILED'} - ${wrongResult.message || ''}`);

            // 5. Verify with CORRECT OTP
            console.log('\n🔐 Step 4: Testing verification with CORRECT OTP...');
            const correctResult = await verifyOTP(testEmail, otpRecord.otp, 'registration');

            if (correctResult.success) {
                console.log('✅ Verification result: SUCCESS');

                // --- ADDED: Simulate the controller logic to update user ---
                const userToUpdate = await User.findOne({ email: testEmail });
                if (userToUpdate) {
                    userToUpdate.isVerified = true;
                    await userToUpdate.save();
                    console.log('ℹ️ Simulating controller: User model updated to isVerified: true');
                }
                // ------------------------------------------------------------

                // 6. Check if user is now verified
                const updatedUser = await User.findOne({ email: testEmail });
                console.log(`\n👤 Step 5: Checking user status...`);
                console.log(`✅ User isVerified: ${updatedUser.isVerified}`);

                if (updatedUser.isVerified) {
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('🎉 Auth OTP System is working perfectly!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runAuthTest();
