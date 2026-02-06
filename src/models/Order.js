// src/models/Order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    customer: {
      name: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
    },
    items: [
      {
        productId: String,
        title: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: Number,
    paymentMethod: {
      type: String,
      default: "COD",
    },
    status: {
      type: String,
      default: "Pending",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentMethod: String,
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
    
  },
  { timestamps: true }
  
);

module.exports = mongoose.model("Order", OrderSchema);
