const nodemailer = require('nodemailer');

// Check for required environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(`⚠️  WARNING: Missing Email Environment Variables: ${missingVars.join(', ')}`);
  console.warn('   Email features (OTP, Confirmations) will NOT work.');
}

// Create transporter
// Robustly handle whitespace/newlines from copy-paste errors
let rawUser = (process.env.EMAIL_USER || '').trim();

// Extract email from "Name <email@gmail.com>" or "email@gmail.com"
// Improved regex to be more forgiving
const emailMatch = rawUser.match(/<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/);
if (emailMatch) {
  rawUser = emailMatch[1];
}
const emailUser = rawUser;
const emailPass = (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  authMethod: 'PLAIN',
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  family: 4,
  logger: true, // This will print details to Render Logs
  debug: true
});

// Export the "Cleaned" values for debugging
transporter.debugInfo = {
  extractedEmail: emailUser ? emailUser.slice(0, 3) + '...' + emailUser.slice(-7) : 'MISSING',
  passLength: emailPass.length
};

// Verify connection on startup - DISABLED to prevent startup delays/crashes
// We will verify on-demand via the /debug/email route instead.
/*
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});
*/

// Helper function to get item title
function getItemTitle(booking) {
  if (booking.type === 'listing' && booking.listing) {
    return booking.listing.title;
  } else if (booking.type === 'vehicle' && booking.vehicle) {
    return `${booking.vehicle.brand} ${booking.vehicle.model}`;
  } else if (booking.type === 'dhaba' && booking.dhaba) {
    return booking.dhaba.title;
  }
  return 'WanderLust Booking';
}

const { generateBookingInvoice } = require('./pdfService');

// Send booking confirmation email
async function sendBookingConfirmation(booking, user) {
  const itemTitle = getItemTitle(booking);
  const confirmationNumber = booking._id.toString().slice(-8).toUpperCase();

  // Generate PDF Invoice for attachment
  let pdfAttachment;
  try {
    pdfAttachment = await generateBookingInvoice(booking);
  } catch (pdfErr) {
    console.error('❌ PDF generation failed for email:', pdfErr.message);
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email,
    subject: `✅ Booking Confirmed - ${itemTitle}`,
    attachments: pdfAttachment ? [
      {
        filename: `WanderLust-Invoice-${confirmationNumber}.pdf`,
        content: pdfAttachment,
        contentType: 'application/pdf'
      }
    ] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #0FAA5B; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px 20px; }
          .booking-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .confirmation-number { font-size: 24px; font-weight: bold; color: #0FAA5B; text-align: center; margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 8px; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; }
          .button { display: inline-block; background: #0FAA5B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .success-badge { background: #0FAA5B; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing WanderLust</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hi <strong>${user.fullName || user.username}</strong>,</p>
            <p>Great news! Your booking has been confirmed. We've attached your **official PDF receipt** to this email. Here are your booking details:</p>
            
            <div class="confirmation-number">
              Confirmation #${confirmationNumber}
            </div>
            
            <div class="booking-card">
              <h3 style="margin-top: 0; color: #0FAA5B;">Booking Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Booking Type:</span>
                <span class="detail-value">${booking.type.toUpperCase()}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Item:</span>
                <span class="detail-value">${itemTitle}</span>
              </div>
              
              ${booking.startDate ? `
              <div class="detail-row">
                <span class="detail-label">Check-in:</span>
                <span class="detail-value">${new Date(booking.startDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Check-out:</span>
                <span class="detail-value">${new Date(booking.endDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              ` : booking.date ? `
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              ${booking.time ? `
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${booking.time}</span>
              </div>
              ` : ''}
              ` : ''}
              
              <div class="detail-row">
                <span class="detail-label">Number of Guests:</span>
                <span class="detail-value">${booking.guests}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value"><strong>₹${booking.totalPrice.toLocaleString('en-IN')}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Payment Status:</span>
                <span class="detail-value"><span class="success-badge">✓ PAID</span></span>
              </div>
            </div>
            
            <center>
              <a href="${process.env.BASE_URL || 'http://localhost:8080'}/bookings/${booking._id}" class="button">
                View Booking Details
              </a>
            </center>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #0FAA5B;">
              <h4 style="margin-top: 0; color: #0FAA5B;">📋 What's Next?</h4>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Save this confirmation email and the <strong>attached PDF</strong> for your records</li>
                <li>Prepare for your upcoming ${booking.type}</li>
                <li>Contact us if you have any questions</li>
              </ol>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions, feel free to contact us at 
              <a href="mailto:help@wanderlust.com" style="color: #0FAA5B;">help@wanderlust.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;"><strong>WanderLust</strong> - Your Travel Companion</p>
            <p style="margin: 5px 0;">📧 help@wanderlust.com | 📱 +91 98765 43210</p>
            <p style="margin: 15px 0 5px 0; color: #999;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent with invoice to:', user.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

// Send payment receipt
async function sendPaymentReceipt(booking, user) {
  const itemTitle = getItemTitle(booking);
  const confirmationNumber = booking._id.toString().slice(-8).toUpperCase();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email,
    subject: `💳 Payment Receipt - WanderLust`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #1e40af; color: white; padding: 30px 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; }
          .receipt-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .amount { font-size: 32px; font-weight: bold; color: #1e40af; text-align: center; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Receipt</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Transaction Successful</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${user.fullName || user.username}</strong>,</p>
            <p>Thank you for your payment. Here's your receipt:</p>
            
            <div class="amount">
              ₹${booking.totalPrice.toLocaleString('en-IN')}
            </div>
            
            <div class="receipt-card">
              <div class="detail-row">
                <span>Transaction ID:</span>
                <span><strong>#${confirmationNumber}</strong></span>
              </div>
              <div class="detail-row">
                <span>Date:</span>
                <span>${new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div class="detail-row">
                <span>Payment Method:</span>
                <span>${booking.paymentMethod || 'Card'}</span>
              </div>
              <div class="detail-row">
                <span>Description:</span>
                <span>${itemTitle}</span>
              </div>
              <div class="detail-row">
                <span>Status:</span>
                <span style="color: #0FAA5B; font-weight: bold;">✓ Paid</span>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Keep this receipt for your records. If you have any questions about this transaction, 
              please contact us at help@wanderlust.com
            </p>
          </div>
          
          <div class="footer">
            <p><strong>WanderLust</strong> - Your Travel Companion</p>
            <p style="margin: 15px 0 5px 0; color: #999;">This is an automated receipt.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment receipt sent to:', user.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  transporter,
  sendBookingConfirmation,
  sendPaymentReceipt
};
