const PDFDocument = require('pdfkit');

/**
 * Generate a professional booking invoice PDF
 * @param {Object} booking - The booking object populated with listing/vehicle/dhaba and user
 * @returns {Promise<Buffer>} - Resovles with the PDF buffer
 */
async function generateBookingInvoice(booking) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- Header Section ---
            doc.fillColor('#0FAA5B')
                .fontSize(25)
                .text('WanderLust', 50, 50, { bold: true });

            doc.fillColor('#444444')
                .fontSize(10)
                .text('Travel & Experiences Co.', 50, 80)
                .text('123 Adventure Way, WanderState', 50, 95)
                .text('support@wanderlust.com', 50, 110);

            doc.fillColor('#111111')
                .fontSize(18)
                .text('INVOICE / RECEIPT', 400, 50, { align: 'right' });

            doc.fontSize(10)
                .text(`Date: ${new Date().toLocaleDateString()}`, 400, 80, { align: 'right' })
                .text(`Order ID: #${booking._id.toString().slice(-8).toUpperCase()}`, 400, 95, { align: 'right' })
                .text(`Status: PAID`, 400, 110, { align: 'right', color: '#0FAA5B' });

            doc.moveDown(2);
            doc.moveTo(50, 140).lineTo(550, 140).stroke('#EEEEEE');

            // --- Billing Details ---
            doc.moveDown(2);
            doc.fillColor('#111111')
                .fontSize(12)
                .text('BILL TO:', 50, 160, { bold: true });

            doc.fontSize(10)
                .text(booking.user ? (booking.user.username || 'Valued Guest') : 'Valued Guest', 50, 180)
                .text(booking.user ? (booking.user.email || 'N/A') : 'N/A', 50, 195);

            const itemTitle = booking.listing?.title || booking.vehicle?.title || booking.dhaba?.name || 'Booking Services';
            const itemType = booking.type.charAt(0).toUpperCase() + booking.type.slice(1);

            doc.text('BOOKING FOR:', 300, 160, { bold: true });
            doc.text(itemTitle, 300, 180);
            doc.text(`${itemType} Reservation`, 300, 195);

            // --- Table Header ---
            const tableTop = 240;
            doc.moveDown(3);
            doc.fillColor('#F9F9F9')
                .rect(50, tableTop, 500, 20).fill();

            doc.fillColor('#111111')
                .fontSize(10)
                .text('DESCRIPTION', 60, tableTop + 5, { bold: true })
                .text('DETAILS', 200, tableTop + 5, { bold: true })
                .text('AMOUNT', 480, tableTop + 5, { bold: true });

            // --- Table Content ---
            doc.fillColor('#444444');
            const row1 = tableTop + 35;
            doc.text(`${itemType} Stay`, 60, row1)
                .text(`${booking.guests} Guests | ${booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'}`, 200, row1)
                .text(`INR ${booking.totalPrice.toFixed(2)}`, 450, row1, { align: 'right' });

            doc.moveTo(50, row1 + 20).lineTo(550, row1 + 20).stroke('#F9F9F9');

            // --- Totals Section ---
            const totalsTop = row1 + 50;
            doc.fillColor('#111111')
                .fontSize(10)
                .text('Subtotal:', 380, totalsTop)
                .text(`INR ${booking.totalPrice.toFixed(2)}`, 450, totalsTop, { align: 'right' });

            doc.text('Taxes & Fees:', 380, totalsTop + 20)
                .text('Included', 450, totalsTop + 20, { align: 'right' });

            doc.fontSize(14)
                .fillColor('#0FAA5B')
                .text('TOTAL PAID:', 380, totalsTop + 50, { bold: true })
                .text(`INR ${booking.totalPrice.toFixed(2)}`, 450, totalsTop + 50, { align: 'right', bold: true });

            // --- Footer Section ---
            const footerTop = 700;
            doc.moveTo(50, footerTop).lineTo(550, footerTop).stroke('#EEEEEE');

            doc.fillColor('#888888')
                .fontSize(9)
                .text('Thank you for choosing WanderLust! Your payment has been successfully processed.', 50, footerTop + 20, { align: 'center' })
                .text('This is a computer-generated document and does not require a physical signature.', 50, footerTop + 35, { align: 'center' });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateBookingInvoice
};
