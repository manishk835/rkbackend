const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Order = require("../models/Order");

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(400).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString());

      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        const order = await Order.findOne({
          "razorpay.orderId": payment.order_id,
        });

        if (!order) return res.status(404).send("Order not found");

        if (order.paymentStatus === "PAID") {
          return res.status(200).send("Already processed");
        }
        if (event.event === "payment.failed") {
            const payment = event.payload.payment.entity;
          
            const order = await Order.findOne({
              "razorpay.orderId": payment.order_id,
            });
          
            if (order) {
              order.paymentStatus = "FAILED";
          
              order.paymentLogs.push({
                event: "payment.failed",
                payload: payment,
              });
          
              await order.save();
            }
          }
          

        order.paymentStatus = "PAID";
        order.status = "Confirmed";

        order.razorpay.paymentId = payment.id;

        order.paymentLogs.push({
          event: "payment.captured",
          payload: payment,
        });

        order.statusHistory.push({
          status: "Confirmed",
          updatedAt: new Date(),
        });

        await order.save();
      }

      res.status(200).json({ status: "ok" });

    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).send("Webhook failed");
    }
  }
);

module.exports = router;
