const mongoose = require("mongoose");

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

/* ================= ITEM SUB-SCHEMA ================= */

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    commission: {
      type: Number,
      default: 10, // %
      min: 0,
    },

    sellerEarning: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

/* ================= MAIN ORDER SCHEMA ================= */

const OrderSchema = new mongoose.Schema(
  {
    /* ================= USER ================= */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= ITEMS ================= */
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Order must have items"],
    },

    /* ================= CUSTOMER ================= */
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    /* ================= PRICING ================= */
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformCommission: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

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

    estimatedDelivery: Date,

    isReturnRequested: {
      type: Boolean,
      default: false,
    },

    /* ================= RAZORPAY ================= */

    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },

    paymentLogs: [
      {
        event: String,
        payload: Object,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });
/* ================= AUTO COMMISSION CALC ================= */

OrderSchema.pre("save", function () {
  let totalCommission = 0;

  if (!this.items || this.items.length === 0) {
    return;
  }

  this.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;

    const commissionAmount =
      (itemTotal * item.commission) / 100;

    item.sellerEarning = itemTotal - commissionAmount;

    totalCommission += commissionAmount;
  });

  this.platformCommission = totalCommission;
});

/* ================= SAFE MODEL EXPORT ================= */

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);


// // models/Order.js

// const mongoose = require("mongoose");

// const allowedStatuses = [
//   "Pending",
//   "Confirmed",
//   "Packed",
//   "Shipped",
//   "Delivered",
//   "Cancelled",
// ];

// /* ================= ITEM SCHEMA ================= */
// items: [
//   {
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },

//     seller: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     title: { type: String, required: true },
//     price: { type: Number, required: true },
//     quantity: { type: Number, required: true },

//     commission: {
//       type: Number,
//       default: 10, // 10% default
//     },

//     sellerEarning: {
//       type: Number,
//       default: 0,
//     },
//   },
// ];

// const OrderSchema = new mongoose.Schema(
//   {
//     /* ================= USER ================= */
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     /* ================= CUSTOMER SNAPSHOT ================= */
//     customer: {
//       name: { type: String, required: true, trim: true },
//       phone: { type: String, required: true },
//       address: { type: String, required: true },
//       city: { type: String, required: true },
//       pincode: { type: String, required: true },
//     },

//     /* ================= PRICING ================= */
//     subtotal: { type: Number, required: true },
//     discount: { type: Number, default: 0 },
//     platformCommission: { type: Number, default: 0 },
//     totalAmount: { type: Number, required: true },

//     /* ================= PAYMENT ================= */
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

//     /* ================= ORDER STATUS ================= */
//     status: {
//       type: String,
//       enum: allowedStatuses,
//       default: "Pending",
//     },

//     statusHistory: [
//       {
//         status: {
//           type: String,
//           enum: allowedStatuses,
//         },
//         updatedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],

//     /* ================= DELIVERY ================= */
//     estimatedDelivery: Date,

//     /* ================= RETURN ================= */
//     isReturnRequested: {
//       type: Boolean,
//       default: false,
//     },

//     /* ================= PAYMENT DETAILS ================= */
//     razorpay: {
//       orderId: String,
//       paymentId: String,
//       signature: String,
//     },

//     paymentLogs: [
//       {
//         event: String,
//         payload: Object,
//         createdAt: { type: Date, default: Date.now },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// /* ================= INDEXES ================= */
// OrderSchema.index({ createdAt: -1 });
// OrderSchema.index({ status: 1 });
// OrderSchema.index({ "items.seller": 1 });

// /* ================= AUTO COMMISSION CALC ================= */
// OrderSchema.pre("save", function () {
//   let totalCommission = 0;

//   this.items.forEach((item) => {
//     const itemTotal = item.price * item.quantity;

//     const commission =
//       (itemTotal * item.commissionPercent) / 100;

//     item.sellerEarning = itemTotal - commission;

//     totalCommission += commission;
//   });

//   this.platformCommission = totalCommission;
// });

// module.exports = mongoose.model("Order", OrderSchema);
