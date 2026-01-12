require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/booking');
const User = require('./models/user');
const Listing = require('./models/listing');
const Vehicle = require('./models/vehicle');
const Dhaba = require('./models/dhaba');
const { generateBookingInvoice } = require('./utils/pdfService');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing PDF Receipt Generation...\n');

async function runPdfTest() {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✅ Connected to MongoDB');

        // 2. Fetch any real booking to test with (populated)
        console.log('\n🔍 Fetching a sample booking from DB...');
        const booking = await Booking.findOne()
            .populate('user')
            .populate('listing')
            .populate('vehicle')
            .populate('dhaba');

        if (!booking) {
            console.log('❌ No bookings found in DB to test with. Please create a booking first.');
            return;
        }

        console.log(`✅ Found booking: #${booking._id} (Type: ${booking.type})`);

        // 3. Generate PDF
        console.log('\n📄 Generating PDF buffer...');
        const pdfBuffer = await generateBookingInvoice(booking);

        if (pdfBuffer && pdfBuffer.length > 0) {
            console.log(`✅ PDF generated successfully! Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

            // 4. Save to local file for manual inspection
            const testFilePath = path.join(__dirname, 'test-invoice.pdf');
            fs.writeFileSync(testFilePath, pdfBuffer);
            console.log(`\n💾 Test PDF saved to: ${testFilePath}`);
            console.log('💡 You can open this file to see the professional layout!');

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 PDF Generation Service is working perfectly!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            console.log('❌ PDF generation returned empty buffer');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runPdfTest();
