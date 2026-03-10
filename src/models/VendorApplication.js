// models/VendorApplication.js

const mongoose = require("mongoose");

const vendorApplicationSchema = new mongoose.Schema(
  {
    /* ================= BUSINESS INFO ================= */

    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    /* ================= CONTACT INFO ================= */

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[6-9]\d{9}$/,
      index: true,
    },

    /* ================= APPLICATION STATUS ================= */

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    /* ================= ADMIN REVIEW ================= */

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    reviewNote: {
      type: String,
      trim: true,
    },

    /* ================= FUTURE MARKETPLACE FEATURES ================= */

    documents: {
      gstNumber: {
        type: String,
        trim: true,
      },

      panNumber: {
        type: String,
        trim: true,
      },

      storeLogo: {
        type: String,
      },
    },

    /* ================= META ================= */

    source: {
      type: String,
      default: "website",
    },
  },

  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */

vendorApplicationSchema.index({ email: 1 });
vendorApplicationSchema.index({ status: 1 });
vendorApplicationSchema.index({ createdAt: -1 });

/* ================= PREVENT DUPLICATE APPLICATION ================= */

vendorApplicationSchema.index(
  { email: 1, status: 1 },
  {
    unique: false,
  }
);

module.exports = mongoose.model(
  "VendorApplication",
  vendorApplicationSchema
);