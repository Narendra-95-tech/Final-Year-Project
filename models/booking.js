const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: "Listing" },
  dhaba: { type: Schema.Types.ObjectId, ref: "Dhaba" },
  vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle" },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  date: { type: Date },
  time: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  pickupLocation: { type: String },
  guests: { type: Number, required: true },
  totalPrice: { type: Number },
  amount: { type: Number },
  message: { type: String },
  paymentIntentId: { type: String },
  stripeSessionId: { type: String },
  razorpayOrderId: { type: String },     // Razorpay Order ID
  paymentId: { type: String },           // Stripe / Razorpay payment ID
  paymentMethod: { type: String },       // 'Razorpay', 'Stripe', 'Wallet', 'UPI'
  paymentDate: { type: Date }, // Date when payment was successful
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Refund Pending'], default: 'Pending' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  isPaid: { type: Boolean, default: false },
  paidWithWallet: { type: Boolean, default: false },
  paidWithUPI: { type: Boolean, default: false },
  type: { type: String, enum: ['listing', 'vehicle', 'dhaba'], required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Performance Indexes for faster queries
bookingSchema.index({ user: 1, createdAt: -1 }); // User's booking history (most recent first)
bookingSchema.index({ status: 1 }); // Filter by booking status
bookingSchema.index({ paymentStatus: 1 }); // Filter by payment status
bookingSchema.index({ type: 1 }); // Filter by booking type (listing/vehicle/dhaba)
bookingSchema.index({ listing: 1 }); // Lookup bookings for a listing
bookingSchema.index({ vehicle: 1 }); // Lookup bookings for a vehicle
bookingSchema.index({ dhaba: 1 }); // Lookup bookings for a dhaba
bookingSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
bookingSchema.index({ createdAt: -1 }); // Recent bookings

module.exports = mongoose.model("Booking", bookingSchema);
