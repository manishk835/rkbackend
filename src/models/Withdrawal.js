const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    method: {
      type: String,
      enum: ["Bank", "UPI"],
      default: "UPI",
    },

    accountDetails: {
      type: Object,
      default: {},
    },

    processedAt: Date,

    adminNote: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", WithdrawalSchema);