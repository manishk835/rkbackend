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
      index: true,
    },

    method: {
      type: String,
      enum: ["Bank", "UPI"],
      required: true,
    },

    accountDetails: {
      // 🔥 structured instead of loose object
      upiId: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      accountHolderName: String,
    },

    // 🔥 unique tracking id (important)
    requestId: {
      type: String,
      unique: true,
    },

    processedAt: Date,

    adminNote: String,
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

// fast admin queries
WithdrawalSchema.index({ status: 1, createdAt: -1 });

// seller history fast
WithdrawalSchema.index({ seller: 1, createdAt: -1 });

/* ================= AUTO REQUEST ID ================= */

WithdrawalSchema.pre("save", function (next) {
  if (!this.requestId) {
    this.requestId =
      "WD-" +
      Date.now() +
      "-" +
      Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", WithdrawalSchema);