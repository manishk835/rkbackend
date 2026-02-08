// src/models/Order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    /* ================= CUSTOMER ================= */
    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: String,
      pincode: String,
    },

    /* ================= ITEMS ================= */
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        title: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],

    /* ================= AMOUNT ================= */
    totalAmount: {
      type: Number,
      required: true,
    },

    /* ================= PAYMENT ================= */
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
          ],
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);