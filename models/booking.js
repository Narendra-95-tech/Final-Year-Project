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
  paymentId: { type: String }, // Stripe payment ID
  paymentDate: { type: Date }, // Date when payment was successful
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Refund Pending'], default: 'Pending' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  isPaid: { type: Boolean, default: false },
  paidWithWallet: { type: Boolean, default: false },
  paidWithUPI: { type: Boolean, default: false },
  type: { type: String, enum: ['listing', 'vehicle', 'dhaba'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
