const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking");
const wrapAsync = require("../utils/wrapAsync");

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// 1. CREATE RAZORPAY ORDER
//    POST /bookings/razorpay/create-order
//    Body: { bookingId }
// ─────────────────────────────────────────────────────────────
exports.createOrder = wrapAsync(async (req, res) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId).populate("user");

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (!booking.user.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.isPaid) {
        return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    // Amount in paise (INR × 100)
    const amountInPaise = Math.round(booking.totalPrice * 100);

    const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${booking._id.toString().slice(-8)}`,
        notes: {
            bookingId: booking._id.toString(),
            type: booking.type,
            userId: req.user._id.toString(),
        },
    };

    const order = await razorpay.orders.create(options);

    // Save order ID to booking for later verification
    booking.razorpayOrderId = order.id;
    await booking.save();

    console.log(`✅ Razorpay Order Created: ${order.id} for Booking: ${booking._id}`);

    res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
        prefill: {
            name: req.user.username || req.user.name || "",
            email: req.user.email || "",
            contact: req.user.phone || "",
        },
    });
});

// ─────────────────────────────────────────────────────────────
// 2. VERIFY RAZORPAY PAYMENT
//    POST /bookings/razorpay/verify-payment
//    Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
// ─────────────────────────────────────────────────────────────
exports.verifyPayment = wrapAsync(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
        return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    // ── Signature Verification ──────────────────────────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        console.error("❌ Razorpay Signature Mismatch!");
        return res.status(400).json({ success: false, message: "Payment verification failed – signature mismatch" });
    }

    // ── Update Booking ──────────────────────────────────────────
    const booking = await Booking.findById(bookingId)
        .populate({ path: "listing", populate: { path: "owner" } })
        .populate({ path: "vehicle", populate: { path: "owner" } })
        .populate({ path: "dhaba", populate: { path: "owner" } })
        .populate("user");

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.paymentStatus = "Paid";
    booking.isPaid = true;
    booking.status = "Confirmed";
    booking.paymentMethod = "Razorpay";
    booking.paymentId = razorpay_payment_id;
    booking.razorpayOrderId = razorpay_order_id;
    booking.paymentDate = new Date();
    await booking.save();

    console.log(`✅ Razorpay Payment Verified & Booking Confirmed: ${booking._id}`);

    // ── Send Notifications ───────────────────────────────────────
    try {
        const { sendBookingConfirmation, sendPaymentReceipt, sendOwnerBookingAlert } = require("../utils/emailService");
        const Notification = require("../models/notification");

        if (booking.user && booking.user.email) {
            sendBookingConfirmation(booking, booking.user).catch((e) =>
                console.error("Email failed:", e.message)
            );
            sendPaymentReceipt(booking, booking.user).catch((e) =>
                console.error("Receipt failed:", e.message)
            );
        }

        const item = booking.listing || booking.vehicle || booking.dhaba;
        if (item && item.owner) {
            if (item.owner.email) {
                sendOwnerBookingAlert(booking, item.owner, booking.user).catch((e) =>
                    console.error("Owner alert failed:", e.message)
                );
            }
            Notification.createNotification(
                item.owner._id,
                booking.user._id,
                "booking",
                {
                    content: `received a new Razorpay payment for ${item.title || item.brand + " " + item.model}`,
                    link: `/bookings/${booking._id}`,
                    metadata: { bookingId: booking._id },
                }
            ).catch((e) => console.error("Notification failed:", e.message));
        }
    } catch (err) {
        console.error("Notification error:", err.message);
    }

    res.json({
        success: true,
        message: "Payment verified and booking confirmed!",
        redirectUrl: `/bookings/success?bookingId=${booking._id}`,
    });
});
