// src/models/Order.js

const mongoose = require("mongoose");

/* ======================================================
   ORDER STATUS
====================================================== */

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];

/* ======================================================
   ORDER ITEM SCHEMA
====================================================== */

const OrderItemSchema =
  new mongoose.Schema(
    {
      /* ================= PRODUCT ================= */

      productId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Product",

        required: true,

        index: true,
      },

      seller: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      variantSku: {
        type: String,

        required: true,

        uppercase: true,

        trim: true,
      },

      /* ================= PRODUCT INFO ================= */

      title: {
        type: String,

        required: true,

        trim: true,
      },

      thumbnail: {
        type: String,

        default:
          "/placeholder.png",
      },

      /* ================= PRICING ================= */

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

      /* ================= COMMISSION ================= */

      commission: {
        type: Number,

        default: 10,

        min: 0,

        max: 100,
      },

      commissionAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      sellerEarning: {
        type: Number,

        default: 0,

        min: 0,
      },
    },

    {
      _id: false,
    }
  );

/* ======================================================
   MAIN ORDER SCHEMA
====================================================== */

const OrderSchema =
  new mongoose.Schema(
    {
      /* ================= ORDER NUMBER ================= */

      orderNumber: {
        type: String,

        unique: true,

        index: true,
      },

      /* ================= USER ================= */

      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* ================= ITEMS ================= */

      items: {
        type: [
          OrderItemSchema,
        ],

        required: true,

        validate: [
          (v) => v.length > 0,
          "Order must have items",
        ],
      },

      /* ================= CUSTOMER ================= */

      customer: {
        name: {
          type: String,

          required: true,

          trim: true,
        },

        phone: {
          type: String,

          required: true,

          trim: true,
        },

        address: {
          type: String,

          required: true,

          trim: true,
        },

        city: {
          type: String,

          required: true,

          trim: true,
        },

        state: {
          type: String,

          trim: true,

          default: "",
        },

        country: {
          type: String,

          trim: true,

          default: "India",
        },

        pincode: {
          type: String,

          required: true,

          trim: true,
        },
      },

      /* ================= PRICING ================= */

      subtotal: {
        type: Number,

        required: true,

        min: 0,
      },

      shippingFee: {
        type: Number,

        default: 0,

        min: 0,
      },

      taxAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      discount: {
        type: Number,

        default: 0,

        min: 0,
      },

      couponCode: {
        type: String,

        trim: true,
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

        enum: [
          "COD",
          "RAZORPAY",
        ],

        required: true,
      },

      paymentStatus: {
        type: String,

        enum: [
          "PENDING",
          "INITIATED",
          "PAID",
          "FAILED",
          "REFUNDED",
        ],

        default: "PENDING",

        index: true,
      },

      /* ================= ORDER STATUS ================= */

      status: {
        type: String,

        enum:
          allowedStatuses,

        default: "Pending",

        index: true,
      },

      statusHistory: [
        {
          status: {
            type: String,

            enum:
              allowedStatuses,
          },

          note: String,

          updatedAt: {
            type: Date,

            default:
              Date.now,
          },
        },
      ],

      estimatedDelivery: {
        type: Date,
      },

      deliveredAt: {
        type: Date,
      },

      cancelledAt: {
        type: Date,
      },

      /* ================= RETURN ================= */

      isReturnRequested: {
        type: Boolean,

        default: false,
      },

      returnReason: {
        type: String,

        trim: true,
      },

      returnApproved: {
        type: Boolean,

        default: false,
      },

      /* ================= RAZORPAY ================= */

      razorpay: {
        orderId: String,

        paymentId: String,

        signature: String,
      },

      /* ================= PAYMENT LOGS ================= */

      paymentLogs: [
        {
          event: String,

          payload: Object,

          createdAt: {
            type: Date,

            default:
              Date.now,
          },
        },
      ],

      /* ================= NOTES ================= */

      notes: {
        type: String,

        trim: true,
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

OrderSchema.index({
  "items.seller": 1,
});

OrderSchema.index({
  createdAt: -1,
});

OrderSchema.index({
  status: 1,
});

OrderSchema.index({
  paymentStatus: 1,
});

OrderSchema.index({
  orderNumber: 1,
});

/* ======================================================
   ORDER NUMBER GENERATOR
====================================================== */

OrderSchema.pre(
  "save",
  function () {

    if (
      !this.orderNumber
    ) {

      const timestamp =
        Date.now()
          .toString()
          .slice(-6);

      const random =
        Math.floor(
          100 +
            Math.random() *
              900
        );

      this.orderNumber =
        `RK${timestamp}${random}`;
    }

  }
);

/* ======================================================
   AUTO CALCULATIONS
====================================================== */

OrderSchema.pre(
  "save",
  function () {

    let totalCommission =
      0;

    if (
      !this.items ||
      this.items.length === 0
    ) {
      return next();
    }

    this.items.forEach(
      (item) => {

        const itemTotal =
          item.price *
          item.quantity;

        const commissionAmount =
          (itemTotal *
            item.commission) /
          100;

        item.commissionAmount =
          commissionAmount;

        item.sellerEarning =
          itemTotal -
          commissionAmount;

        totalCommission +=
          commissionAmount;
      }
    );

    this.platformCommission =
      totalCommission;

  }
);

/* ======================================================
   STATUS HISTORY
====================================================== */

OrderSchema.pre(
  "save",
  function () {

    if (
      this.isModified(
        "status"
      )
    ) {

      this.statusHistory.push(
        {
          status:
            this.status,

          updatedAt:
            new Date(),
        }
      );

      /* ================= AUTO DATES ================= */

      if (
        this.status ===
        "Delivered"
      ) {
        this.deliveredAt =
          new Date();
      }

      if (
        this.status ===
        "Cancelled"
      ) {
        this.cancelledAt =
          new Date();
      }
    }

  }
);

/* ======================================================
   JSON TRANSFORM
====================================================== */

OrderSchema.set(
  "toJSON",
  {
    transform:
      function (_, ret) {

        delete ret.__v;

        return ret;
      },
  }
);

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models.Order ||
  mongoose.model(
    "Order",
    OrderSchema
  );