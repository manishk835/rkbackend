// src/routes/webhook.routes.js

const express = require(
  "express"
);

const crypto = require(
  "crypto"
);

const router = express.Router();

/* ======================================================
   MODELS
====================================================== */

const Order = require(
  "../models/Order"
);

/* ======================================================
   RAZORPAY WEBHOOK
====================================================== */

router.post(
  "/razorpay",

  express.raw({
    type:
      "application/json",
  }),

  async (
    req,
    res
  ) => {
    try {

      /* ================= SIGNATURE ================= */

      const signature =
        req.headers[
          "x-razorpay-signature"
        ];

      if (
        !signature
      ) {
        return res.status(400).send(
          "Missing signature"
        );
      }

      /* ================= VERIFY ================= */

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_WEBHOOK_SECRET
          )
          .update(
            req.body
          )
          .digest(
            "hex"
          );

      if (
        signature !==
        expectedSignature
      ) {

        console.error(
          "Invalid Razorpay webhook signature"
        );

        return res.status(400).send(
          "Invalid signature"
        );
      }

      /* ================= PARSE EVENT ================= */

      const event =
        JSON.parse(
          req.body.toString()
        );

      const eventType =
        event.event;

      /* ======================================================
         PAYMENT CAPTURED
      ====================================================== */

      if (
        eventType ===
        "payment.captured"
      ) {

        const payment =
          event.payload
            .payment
            .entity;

        const order =
          await Order.findOne(
            {
              "razorpay.orderId":
                payment.order_id,
            }
          );

        if (!order) {
          return res.status(404).send(
            "Order not found"
          );
        }

        /* ================= ALREADY PROCESSED ================= */

        if (
          order.paymentStatus ===
          "PAID"
        ) {

          return res.status(200).send(
            "Already processed"
          );
        }

        /* ================= UPDATE ORDER ================= */

        order.paymentStatus =
          "PAID";

        order.status =
          "Confirmed";

        if (
          order.razorpay
        ) {

          order.razorpay.paymentId =
            payment.id;

        } else {

          order.razorpay =
            {
              paymentId:
                payment.id,

              orderId:
                payment.order_id,
            };
        }

        /* ================= PAYMENT LOG ================= */

        if (
          !order.paymentLogs
        ) {
          order.paymentLogs =
            [];
        }

        order.paymentLogs.push(
          {
            event:
              "payment.captured",

            payload:
              payment,

            createdAt:
              new Date(),
          }
        );

        /* ================= STATUS HISTORY ================= */

        if (
          !order.statusHistory
        ) {
          order.statusHistory =
            [];
        }

        order.statusHistory.push(
          {
            status:
              "Confirmed",

            updatedAt:
              new Date(),
          }
        );

        await order.save();

        console.log(
          `✅ Payment captured for order ${order._id}`
        );
      }

      /* ======================================================
         PAYMENT FAILED
      ====================================================== */

      if (
        eventType ===
        "payment.failed"
      ) {

        const payment =
          event.payload
            .payment
            .entity;

        const order =
          await Order.findOne(
            {
              "razorpay.orderId":
                payment.order_id,
            }
          );

        if (order) {

          order.paymentStatus =
            "FAILED";

          if (
            !order.paymentLogs
          ) {
            order.paymentLogs =
              [];
          }

          order.paymentLogs.push(
            {
              event:
                "payment.failed",

              payload:
                payment,

              createdAt:
                new Date(),
            }
          );

          await order.save();

          console.log(
            `❌ Payment failed for order ${order._id}`
          );
        }
      }

      /* ======================================================
         RESPONSE
      ====================================================== */

      return res.status(200).json(
        {
          success: true,

          received: true,
        }
      );

    } catch (error) {

      console.error(
        "RAZORPAY WEBHOOK ERROR:",
        error
      );

      return res.status(500).send(
        "Webhook failed"
      );
    }
  }
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;