// src/models/WalletTransaction.js

const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    /* ================= USER ================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= TYPE ================= */

    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    /* ================= AMOUNT ================= */

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ================= SOURCE ================= */

    source: {
      type: String,
      enum: [
        "order",
        "refund",
        "withdrawal",
        "manual",
      ],
      default: "order",
    },

    /* ================= ORDER ================= */

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    /* ================= NOTE ================= */

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: [
        "SUCCESS",
        "PENDING",
        "FAILED",
      ],
      default: "SUCCESS",
    },

    /* ================= META ================= */

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */

walletTransactionSchema.index({
  user: 1,
  createdAt: -1,
});

walletTransactionSchema.index({
  orderId: 1,
});

/* ================= EXPORT ================= */

module.exports = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);