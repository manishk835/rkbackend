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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);


// // src/models/Order.js
// const mongoose = require("mongoose");

// const OrderSchema = new mongoose.Schema(
//   {
//     customer: {
//       name: String,
//       phone: String,
//       address: String,
//       city: String,
//       pincode: String,
//     },
//     items: [
//       {
//         productId: String,
//         title: String,
//         price: Number,
//         quantity: Number,
//       },
//     ],
//     totalAmount: Number,
//     paymentMethod: {
//       type: String,
//       default: "COD",
//     },
//     status: {
//       type: String,
//       default: "Pending",
//     },
//     isPaid: {
//       type: Boolean,
//       default: false,
//     },
//     paymentMethod: String,
//     razorpay: {
//       orderId: String,
//       paymentId: String,
//       signature: String,
//     },
    
//   },
//   { timestamps: true }
  
// );

// module.exports = mongoose.model("Order", OrderSchema);
