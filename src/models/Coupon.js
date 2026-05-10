// src/models/Coupon.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   COUPON SCHEMA
====================================================== */

const couponSchema =
  new mongoose.Schema(
    {
      /* ================= BASIC ================= */

      code: {
        type: String,

        required: true,

        uppercase: true,

        unique: true,

        trim: true,

        minlength: 3,

        maxlength: 30,

        index: true,
      },

      description: {
        type: String,

        trim: true,

        maxlength: 500,
      },

      /* ================= DISCOUNT ================= */

      discountType: {
        type: String,

        enum: [
          "percentage",
          "fixed",
        ],

        default:
          "percentage",
      },

      discountValue: {
        type: Number,

        required: true,

        min: 1,
      },

      /* ================= ORDER LIMITS ================= */

      minOrderAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      maxDiscountAmount: {
        type: Number,

        min: 0,
      },

      /* ================= EXPIRY ================= */

      expiresAt: {
        type: Date,

        required: true,

        index: true,
      },

      /* ================= STATUS ================= */

      isActive: {
        type: Boolean,

        default: true,

        index: true,
      },

      /* ================= USAGE ================= */

      usageLimit: {
        type: Number,

        default: null,

        min: 1,
      },

      usedCount: {
        type: Number,

        default: 0,

        min: 0,
      },

      perUserLimit: {
        type: Number,

        default: 1,

        min: 1,
      },

      /* ================= SELLER COUPON ================= */

      seller: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,

        index: true,
      },

      /* ================= SPECIAL FLAGS ================= */

      isNewUserOnly: {
        type: Boolean,

        default: false,
      },

      isMemberOnly: {
        type: Boolean,

        default: false,
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

couponSchema.index({
  code: 1,
});

couponSchema.index({
  expiresAt: 1,
});

couponSchema.index({
  isActive: 1,
});

/* ======================================================
   AUTO CLEAN CODE
====================================================== */

couponSchema.pre(
  "validate",

  function (next) {

    if (this.code) {

      this.code =
        this.code
          .trim()
          .toUpperCase();
    }

    next();
  }
);

/* ======================================================
   VALIDATIONS
====================================================== */

couponSchema.pre(
  "save",

  function (next) {

    /* ================= PERCENTAGE CHECK ================= */

    if (
      this.discountType ===
        "percentage" &&
      this.discountValue >
        100
    ) {
      return next(
        new Error(
          "Percentage discount cannot exceed 100"
        )
      );
    }

    /* ================= EXPIRY CHECK ================= */

    if (
      this.expiresAt &&
      this.isNew
    ) {

      const now =
        new Date();

      if (
        this.expiresAt <=
        now
      ) {
        return next(
          new Error(
            "Expiry date must be in future"
          )
        );
      }
    }

    next();
  }
);

/* ======================================================
   VIRTUALS
====================================================== */

couponSchema.virtual(
  "isExpired"
).get(function () {

  return (
    this.expiresAt <
    new Date()
  );
});

couponSchema.virtual(
  "remainingUsage"
).get(function () {

  if (
    !this.usageLimit
  ) {
    return null;
  }

  return (
    this.usageLimit -
    this.usedCount
  );
});

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models.Coupon ||
  mongoose.model(
    "Coupon",
    couponSchema
  );