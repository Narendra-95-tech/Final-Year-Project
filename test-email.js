require('dotenv').config();
const { sendBookingConfirmation, sendPaymentReceipt } = require('./utils/emailService');

console.log('🧪 Testing Email Notification System...\n');

// Check if email credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Error: EMAIL_USER and EMAIL_PASSWORD not found in .env file');
    console.log('Please add these to your .env file:');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASSWORD=your-16-char-app-password');
    process.exit(1);
}

console.log('✅ Email credentials found in .env');
console.log('📧 Sending test emails to:', process.env.EMAIL_USER);
console.log('');

// Mock booking data
const mockBooking = {
    _id: {
        toString: () => '123456789abcdef',
        slice: (start, end) => '123456789abcdef'.slice(start, end)
    },
    type: 'listing',
    listing: {
        title: 'Luxury Beach Villa in Goa',
        location: 'Goa',
        country: 'India'
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
    guests: 4,
    totalPrice: 15000,
    isPaid: true,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    status: 'Confirmed'
};

// Test user (sends to your email)
const testUser = {
    email: process.env.EMAIL_USER,
    fullName: 'Test User',
    username: 'testuser'
};

async function runTests() {
    console.log('📨 Test 1: Sending Booking Confirmation Email...');

    try {
        const result1 = await sendBookingConfirmation(mockBooking, testUser);

        if (result1.success) {
            console.log('✅ Booking confirmation email sent successfully!');
            console.log('   Message ID:', result1.messageId);
        } else {
            console.log('❌ Failed to send booking confirmation:', result1.error);
        }
    } catch (error) {
        console.error('❌ Error sending booking confirmation:', error.message);
    }

    console.log('');
    console.log('📨 Test 2: Sending Payment Receipt Email...');

    try {
        const result2 = await sendPaymentReceipt(mockBooking, testUser);

        if (result2.success) {
            console.log('✅ Payment receipt email sent successfully!');
            console.log('   Message ID:', result2.messageId);
        } else {
            console.log('❌ Failed to send payment receipt:', result2.error);
        }
    } catch (error) {
        console.error('❌ Error sending payment receipt:', error.message);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📬 Check your email inbox:', testUser.email);
    console.log('   You should receive 2 emails:');
    console.log('   1. 🎉 Booking Confirmation');
    console.log('   2. 💳 Payment Receipt');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Check spam/junk folder if not in inbox');
    console.log('   - Emails may take 1-2 minutes to arrive');
    console.log('   - Check Gmail "Sent" folder to verify they were sent');
    console.log('');

    process.exit(0);
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test failed with error:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('1. Make sure nodemailer is installed: npm install nodemailer');
    console.log('2. Check your .env file has correct EMAIL_USER and EMAIL_PASSWORD');
    console.log('3. Verify EMAIL_PASSWORD is the 16-char app password (not regular password)');
    process.exit(1);
});
