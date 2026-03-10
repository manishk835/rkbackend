const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
{
  /* ================= SELLER ================= */

  seller: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ["pending", "approved", "rejected", "paid"],
    default: "pending",
    index: true,
  },

  /* ================= DATES ================= */

  requestedAt: {
    type: Date,
    default: Date.now,
  },

  processedAt: Date,

  /* ================= ADMIN ACTION ================= */

  adminNote: {
    type: String,
    maxlength: 500,
  },

  transactionId: {
    type: String,
    trim: true,
  },

  /* ================= SECURITY ================= */

  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

},
{ timestamps: true }
);

/* ================= INDEXES ================= */

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Payout ||
  mongoose.model("Payout", payoutSchema);
