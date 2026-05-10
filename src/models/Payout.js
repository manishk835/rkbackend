// src/models/Payout.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   PAYOUT SCHEMA
====================================================== */

const payoutSchema =
  new mongoose.Schema(
    {
      /* ================= SELLER ================= */

      seller: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* ================= AMOUNT ================= */

      amount: {
        type: Number,

        required: true,

        min: 1,
      },

      /* ================= STATUS ================= */

      status: {
        type: String,

        enum: [
          "pending",
          "approved",
          "rejected",
          "paid",
        ],

        default:
          "pending",

        index: true,
      },

      /* ================= DATES ================= */

      requestedAt: {
        type: Date,

        default:
          Date.now,
      },

      processedAt: {
        type: Date,
      },

      paidAt: {
        type: Date,
      },

      /* ================= ADMIN ACTION ================= */

      adminNote: {
        type: String,

        trim: true,

        maxlength: 500,
      },

      transactionId: {
        type: String,

        trim: true,

        index: true,
      },

      processedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      /* ================= BANK DETAILS SNAPSHOT ================= */

      bankDetails: {
        accountHolder:
          String,

        accountNumber:
          String,

        ifscCode:
          String,

        bankName:
          String,

        upiId:
          String,
      },

      /* ================= PAYMENT METHOD ================= */

      paymentMethod: {
        type: String,

        enum: [
          "bank",
          "upi",
          "manual",
        ],

        default:
          "bank",
      },

      /* ================= SECURITY / META ================= */

      rejectionReason: {
        type: String,

        trim: true,

        maxlength: 500,
      },

      metadata: {
        type:
          mongoose.Schema.Types.Mixed,

        default: {},
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

payoutSchema.index({
  seller: 1,
  status: 1,
});

payoutSchema.index({
  createdAt: -1,
});

payoutSchema.index({
  transactionId: 1,
});

/* ======================================================
   AUTO DATES
====================================================== */

payoutSchema.pre(
  "save",

  function (next) {

    /* ================= PROCESSED ================= */

    if (
      this.isModified(
        "status"
      )
    ) {

      if (
        [
          "approved",
          "rejected",
          "paid",
        ].includes(
          this.status
        ) &&
        !this.processedAt
      ) {

        this.processedAt =
          new Date();
      }

      /* ================= PAID ================= */

      if (
        this.status ===
          "paid" &&
        !this.paidAt
      ) {

        this.paidAt =
          new Date();
      }
    }

    next();
  }
);

/* ======================================================
   VIRTUALS
====================================================== */

payoutSchema.virtual(
  "isCompleted"
).get(function () {

  return (
    this.status ===
    "paid"
  );
});

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .Payout ||
  mongoose.model(
    "Payout",
    payoutSchema
  );