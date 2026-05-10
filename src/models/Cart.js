// src/models/Cart.js

const mongoose = require("mongoose");

/* ======================================================
   VARIANT SCHEMA
====================================================== */

const variantSchema =
  new mongoose.Schema(
    {
      size: {
        type: String,
        trim: true,
      },

      color: {
        type: String,
        trim: true,
      },

      sku: {
        type: String,
        trim: true,
        uppercase: true,
      },

      name: {
        type: String,
        trim: true,
      },

      stock: {
        type: Number,
        default: 0,
        min: 0,
      },

      priceOverride: {
        type: Number,
        min: 0,
      },

      attributes: {
        type: Object,
        default: {},
      },
    },

    {
      _id: false,
    }
  );

/* ======================================================
   CART ITEM
====================================================== */

const cartItemSchema =
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

      /* ================= PRICE ================= */

      price: {
        type: Number,

        required: true,

        min: 0,
      },

      quantity: {
        type: Number,

        required: true,

        min: 1,

        default: 1,
      },

      /* ================= VARIANT ================= */

      variant: {
        type:
          variantSchema,

        default: {
          sku:
            "DEFAULT",

          name:
            "Default",
        },
      },

      /* ================= STATUS ================= */

      isAvailable: {
        type: Boolean,

        default: true,
      },

      addedAt: {
        type: Date,

        default:
          Date.now,
      },
    },

    {
      _id: false,
    }
  );

/* ======================================================
   CART
====================================================== */

const cartSchema =
  new mongoose.Schema(
    {
      /* ================= USER ================= */

      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        unique: true,

        index: true,
      },

      /* ================= ITEMS ================= */

      items: {
        type: [
          cartItemSchema,
        ],

        default: [],
      },

      /* ================= SUMMARY ================= */

      totalItems: {
        type: Number,

        default: 0,

        min: 0,
      },

      subtotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      estimatedDeliveryFee: {
        type: Number,

        default: 49,
      },

      totalAmount: {
        type: Number,

        default: 0,
      },

      /* ================= COUPON ================= */

      appliedCoupon: {
        code: String,

        discount: {
          type: Number,
          default: 0,
        },
      },

      discountAmount: {
        type: Number,

        default: 0,
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   AUTO CALCULATIONS
====================================================== */

cartSchema.pre(
  "save",
  function (next) {

    let itemsCount = 0;

    let subtotalAmount = 0;

    if (
      this.items &&
      this.items.length > 0
    ) {

      this.items.forEach(
        (item) => {

          itemsCount +=
            item.quantity;

          subtotalAmount +=
            item.price *
            item.quantity;
        }
      );
    }

    this.totalItems =
      itemsCount;

    this.subtotal =
      subtotalAmount;

    const delivery =
      subtotalAmount > 0
        ? this.estimatedDeliveryFee
        : 0;

    this.totalAmount =
      subtotalAmount +
      delivery -
      (
        this.discountAmount ||
        0
      );

    next();
  }
);

/* ======================================================
   INDEXES
====================================================== */

cartSchema.index({
  user: 1,
});

cartSchema.index({
  updatedAt: -1,
});

cartSchema.index({
  "items.productId": 1,
});

/* ======================================================
   JSON TRANSFORM
====================================================== */

cartSchema.set(
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
  mongoose.models.Cart ||
  mongoose.model(
    "Cart",
    cartSchema
  );