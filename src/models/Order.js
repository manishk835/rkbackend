// models/Order.js

const mongoose = require("mongoose");

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const OrderSchema = new mongoose.Schema(
  {
    /* ================= USER ================= */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= CUSTOMER SNAPSHOT ================= */
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    /* ================= ITEMS ================= */
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],

    /* ================= PRICING ================= */
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    /* ================= PAYMENT ================= */
    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "INITIATED", "PAID", "FAILED"],
      default: "PENDING",
    },

    /* ================= ORDER STATUS ================= */
    status: {
      type: String,
      enum: allowedStatuses,
      default: "Pending",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: allowedStatuses,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ================= DELIVERY ================= */
    estimatedDelivery: {
      type: Date,
    },

    /* ================= CANCEL ================= */
    cancelledAt: Date,

    /* ================= RETURN ================= */
    isReturnRequested: {
      type: Boolean,
      default: false,
    },

    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    

    returnRequestedAt: Date,
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", OrderSchema);


// // models/Order.js

// const mongoose = require("mongoose");

// const OrderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     customer: {
//       name: { type: String, required: true },
//       phone: { type: String, required: true },
//       address: { type: String, required: true },
//       city: { type: String, required: true },
//       pincode: { type: String, required: true },
//     },

//     items: [
//       {
//         productId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         title: { type: String, required: true },
//         price: { type: Number, required: true },
//         quantity: { type: Number, required: true },
//       },
//     ],

//     subtotal: { type: Number, required: true },
//     discount: { type: Number, default: 0 },
//     totalAmount: { type: Number, required: true },

//     paymentMethod: {
//       type: String,
//       enum: ["COD", "RAZORPAY"],
//       required: true,
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["PENDING", "INITIATED", "PAID", "FAILED"],
//       default: "PENDING",
//     },

//     status: {
//       type: String,
//       enum: [
//         "Pending",
//         "Confirmed",
//         "Packed",
//         "Shipped",
//         "Delivered",
//         "Cancelled",
//       ],
//       default: "Pending",
//     },

//     statusHistory: [
//       {
//         status: {
//           type: String,
//         },
//         updatedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],

//     /* NEW FIELDS */
//     estimatedDelivery: Date,

//     cancelledAt: Date,

//     isReturnRequested: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", OrderSchema);