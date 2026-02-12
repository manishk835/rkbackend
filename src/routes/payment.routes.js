const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { protect } = require("../middlewares/auth.middleware");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

/* ======================================================
   CREATE RAZORPAY ORDER (SECURE)
====================================================== */
router.post("/razorpay", protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100, // 🔥 NEVER trust frontend
      currency: "INR",
      receipt: `rk_${order._id}`,
    });

    res.json(razorpayOrder);

  } catch (err) {
    console.error("🔥 Razorpay Create Error:", err);
    res.status(500).json({ message: "Razorpay order failed" });
  }
});

/* ======================================================
   VERIFY PAYMENT (SECURE + IDEMPOTENT)
====================================================== */
router.post("/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 🔐 Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // 🔁 Prevent double payment
    if (order.paymentStatus === "PAID") {
      return res.json({ message: "Already verified" });
    }

    // ✅ Mark as paid
    order.paymentStatus = "PAID";
    order.isPaid = true;
    order.status = "Confirmed";

    order.razorpay = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    };

    order.statusHistory.push({
      status: "Confirmed",
      updatedAt: new Date(),
    });

    await order.save();

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 Payment Verify Error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;
