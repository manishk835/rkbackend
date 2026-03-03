const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
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
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
      index: true,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: Date,

    adminNote: {
      type: String,
    },

    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

payoutSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Payout ||
  mongoose.model("Payout", payoutSchema);