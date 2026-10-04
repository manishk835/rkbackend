
// src/routes/webhook.routes.js

const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Order = require("../models/Order");

/* ======================================================
   RAZORPAY WEBHOOK
====================================================== */

// router.post(
//   "/razorpay",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
  router.post(
    "/razorpay",
    async (req, res) => {
    try {
      /* ================= SIGNATURE ================= */

      const signature =
        req.headers["x-razorpay-signature"];

      const webhookSecret =
        process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        return res.status(400).send(
          "Missing signature or webhook secret"
        );
      }

      if (!Buffer.isBuffer(req.body)) {
        return res.status(400).send(
          "Invalid webhook body"
        );
      }

      /* ================= VERIFY SIGNATURE ================= */

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.body)
        .digest("hex");

      const receivedBuffer = Buffer.from(
        signature,
        "hex"
      );

      const expectedBuffer = Buffer.from(
        expectedSignature,
        "hex"
      );

      if (
        receivedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(
          receivedBuffer,
          expectedBuffer
        )
      ) {
        console.error(
          "Invalid Razorpay webhook signature"
        );

        return res.status(400).send(
          "Invalid signature"
        );
      }

      /* ================= PARSE EVENT ================= */

      let event;

      try {
        event = JSON.parse(req.body.toString());
      } catch {
        return res.status(400).send(
          "Invalid webhook JSON"
        );
      }

      const eventType = event.event;

      const payment =
        event.payload?.payment?.entity;

      if (
        !payment ||
        !payment.order_id ||
        !payment.id
      ) {
        // Ignore unrelated or incomplete events safely.
        return res.status(200).json({
          success: true,
          ignored: true,
        });
      }

      /* ================= FIND ORDER ================= */

      const order = await Order.findOne({
        "razorpay.orderId": payment.order_id,
      });

      if (!order) {
        console.error(
          "Order not found for Razorpay order:",
          payment.order_id
        );

        // Acknowledge unknown orders to avoid endless retries.
        return res.status(200).json({
          success: true,
          ignored: true,
        });
      }

      /* ================= AMOUNT CHECK ================= */

      const expectedAmount = Math.round(
        Number(order.totalAmount) * 100
      );

      if (
        !Number.isFinite(expectedAmount) ||
        Number(payment.amount) !== expectedAmount ||
        payment.currency !== "INR"
      ) {
        console.error(
          "Payment amount/currency mismatch:",
          order._id
        );

        order.paymentLogs.push({
          event: "payment.amount_mismatch",
          payload: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
          },
          createdAt: new Date(),
        });

        await order.save();

        return res.status(200).json({
          success: true,
          ignored: true,
        });
      }

      /* ================= PAYMENT CAPTURED ================= */

      if (eventType === "payment.captured") {
        // Never change a cancelled order to Confirmed automatically.
        if (order.status === "Cancelled") {
          order.paymentLogs.push({
            event: "payment.captured.cancelled_order",
            payload: {
              paymentId: payment.id,
              orderId: payment.order_id,
            },
            createdAt: new Date(),
          });

          await order.save();

          console.error(
            "Payment captured for cancelled order:",
            order._id
          );

          return res.status(200).json({
            success: true,
            reviewRequired: true,
          });
        }

        // Idempotency: don't process an already paid order again.
        if (order.paymentStatus === "PAID") {
          return res.status(200).json({
            success: true,
            alreadyProcessed: true,
          });
        }

        order.paymentStatus = "PAID";
        order.status = "Confirmed";


        order.razorpay.orderId = payment.order_id;
        order.razorpay.paymentId = payment.id;

        order.paymentLogs.push({
          event: eventType,
          payload: {
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
          },
          createdAt: new Date(),
        });

        await order.save();

        console.log(
          `Payment captured for order ${order._id}`
        );
      }

      /* ================= PAYMENT FAILED ================= */

      else if (eventType === "payment.failed") {
        // A late failure event must never downgrade a paid order.
        if (order.paymentStatus !== "PAID") {
          order.paymentStatus = "FAILED";

          order.paymentLogs.push({
            event: eventType,
            payload: {
              paymentId: payment.id,
              orderId: payment.order_id,
              amount: payment.amount,
              currency: payment.currency,
              errorCode: payment.error_code,
              errorDescription:
                payment.error_description,
            },
            createdAt: new Date(),
          });

          await order.save();
        }
      } else {
        // Other valid Razorpay events are acknowledged.
        return res.status(200).json({
          success: true,
          ignored: true,
        });
      }

      return res.status(200).json({
        success: true,
        received: true,
      });
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

module.exports = router;




// // src/routes/webhook.routes.js

// const express = require(
//   "express"
// );

// const crypto = require(
//   "crypto"
// );

// const router = express.Router();

// /* ======================================================
//    MODELS
// ====================================================== */

// const Order = require(
//   "../models/Order"
// );

// /* ======================================================
//    RAZORPAY WEBHOOK
// ====================================================== */

// router.post(
//   "/razorpay",
//   async (req, res) => {
//     try {

//       /* ================= SIGNATURE ================= */

//       const signature =
//         req.headers[
//           "x-razorpay-signature"
//         ];

//       if (
//         !signature
//       ) {
//         return res.status(400).send(
//           "Missing signature"
//         );
//       }

//       /* ================= VERIFY ================= */

//       const expectedSignature =
//         crypto
//           .createHmac(
//             "sha256",
//             process.env
//               .RAZORPAY_WEBHOOK_SECRET
//           )
//           .update(
//             req.body
//           )
//           .digest(
//             "hex"
//           );

//       // if (
//       //   signature !==
//       //   expectedSignature
//       // ) {

//       //   console.error(
//       //     "Invalid Razorpay webhook signature"
//       //   );

//       //   return res.status(400).send(
//       //     "Invalid signature"
//       //   );
//       // }
//       const receivedBuffer = Buffer.from(
//         signature,
//         "hex"
//       );
      
//       const expectedBuffer = Buffer.from(
//         expectedSignature,
//         "hex"
//       );
      
//       if (
//         receivedBuffer.length !== expectedBuffer.length ||
//         !crypto.timingSafeEqual(
//           receivedBuffer,
//           expectedBuffer
//         )
//       ) {
//         console.error(
//           "Invalid Razorpay webhook signature"
//         );
      
//         return res.status(400).send(
//           "Invalid signature"
//         );
//       }
//       /* ================= PARSE EVENT ================= */

//       const event =
//         JSON.parse(
//           req.body.toString()
//         );

//       const eventType =
//         event.event;

//       /* ======================================================
//          PAYMENT CAPTURED
//       ====================================================== */

//       if (
//         eventType ===
//         "payment.captured"
//       ) {

//         const payment =
//           event.payload
//             .payment
//             .entity;

//         const order =
//           await Order.findOne(
//             {
//               "razorpay.orderId":
//                 payment.order_id,
//             }
//           );

//         if (!order) {
//           return res.status(404).send(
//             "Order not found"
//           );
//         }

//         /* ================= ALREADY PROCESSED ================= */

//         if (
//           order.paymentStatus ===
//           "PAID"
//         ) {

//           return res.status(200).send(
//             "Already processed"
//           );
//         }

//         /* ================= UPDATE ORDER ================= */

//         order.paymentStatus =
//           "PAID";

//         order.status =
//           "Confirmed";

//         if (
//           order.razorpay
//         ) {

//           order.razorpay.paymentId =
//             payment.id;

//         } else {

//           order.razorpay =
//             {
//               paymentId:
//                 payment.id,

//               orderId:
//                 payment.order_id,
//             };
//         }

//         /* ================= PAYMENT LOG ================= */

//         if (
//           !order.paymentLogs
//         ) {
//           order.paymentLogs =
//             [];
//         }

//         order.paymentLogs.push(
//           {
//             event:
//               "payment.captured",

//             payload:
//               payment,

//             createdAt:
//               new Date(),
//           }
//         );

//         /* ================= STATUS HISTORY ================= */

//         if (
//           !order.statusHistory
//         ) {
//           order.statusHistory =
//             [];
//         }

//         order.statusHistory.push(
//           {
//             status:
//               "Confirmed",

//             updatedAt:
//               new Date(),
//           }
//         );

//         await order.save();

//         console.log(
//           `✅ Payment captured for order ${order._id}`
//         );
//       }

//       /* ======================================================
//          PAYMENT FAILED
//       ====================================================== */

//       if (
//         eventType ===
//         "payment.failed"
//       ) {

//         const payment =
//           event.payload
//             .payment
//             .entity;

//         const order =
//           await Order.findOne(
//             {
//               "razorpay.orderId":
//                 payment.order_id,
//             }
//           );

//         if (order) {

//           order.paymentStatus =
//             "FAILED";

//           if (
//             !order.paymentLogs
//           ) {
//             order.paymentLogs =
//               [];
//           }

//           order.paymentLogs.push(
//             {
//               event:
//                 "payment.failed",

//               payload:
//                 payment,

//               createdAt:
//                 new Date(),
//             }
//           );

//           await order.save();

//           console.log(
//             `❌ Payment failed for order ${order._id}`
//           );
//         }
//       }

//       /* ======================================================
//          RESPONSE
//       ====================================================== */

//       return res.status(200).json(
//         {
//           success: true,

//           received: true,
//         }
//       );

//     } catch (error) {

//       console.error(
//         "RAZORPAY WEBHOOK ERROR:",
//         error
//       );

//       return res.status(500).send(
//         "Webhook failed"
//       );
//     }
//   }
// );

// /* ======================================================
//    EXPORT
// ====================================================== */

// module.exports = router;