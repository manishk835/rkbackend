const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

/* ---------------- CREATE RAZORPAY ORDER ---------------- */
router.post("/razorpay", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: "rk_order_" + Date.now(),
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Razorpay order failed" });
  }
});

/* ---------------- VERIFY PAYMENT ---------------- */
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // DB order id
    } = req.body;

    // 🔐 signature verify
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // ✅ mark order as PAID
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "PAID",
      razorpay: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;


// const crypto = require("crypto");

// router.post("/verify", async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderId, // your DB order id
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Invalid payment signature" });
//     }

//     // ✅ payment verified
//     await Order.findByIdAndUpdate(orderId, {
//       isPaid: true,
//       paymentMethod: "Razorpay",
//       razorpay: {
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//         signature: razorpay_signature,
//       },
//     });

//     res.json({ success: true, message: "Payment verified successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Payment verification failed" });
//   }
// });
