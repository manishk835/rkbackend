// src/models/VendorApplication.js

const mongoose = require("mongoose");

/* ======================================================
   VENDOR APPLICATION SCHEMA
====================================================== */

const vendorApplicationSchema =
  new mongoose.Schema(
    {
      /* ================= USER ================= */

      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* ================= BUSINESS INFO ================= */

      businessName: {
        type: String,

        required: true,

        trim: true,

        minlength: 2,

        maxlength: 150,
      },

      businessType: {
        type: String,

        required: true,

        trim: true,

        lowercase: true,

        index: true,
      },

      category: {
        type: String,

        required: true,

        trim: true,

        lowercase: true,

        index: true,
      },

      message: {
        type: String,

        trim: true,

        maxlength: 1000,
      },

      description: {
        type: String,

        trim: true,

        maxlength: 2000,
      },

      /* ================= CONTACT INFO ================= */

      email: {
        type: String,

        required: true,

        lowercase: true,

        trim: true,

        match:
          /^\S+@\S+\.\S+$/,

        index: true,
      },

      phone: {
        type: String,

        required: true,

        trim: true,

        match:
          /^[6-9]\d{9}$/,

        index: true,
      },

      website: {
        type: String,

        trim: true,
      },

      instagram: {
        type: String,

        trim: true,
      },

      /* ================= STATUS ================= */

      status: {
        type: String,

        enum: [
          "pending",
          "approved",
          "rejected",
        ],

        default: "pending",

        index: true,
      },

      /* ================= ADMIN REVIEW ================= */

      reviewedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      reviewedAt: {
        type: Date,
      },

      reviewNote: {
        type: String,

        trim: true,

        maxlength: 1000,
      },

      /* ================= DOCUMENTS ================= */

      documents: {
        gstNumber: {
          type: String,
          trim: true,
        },

        panNumber: {
          type: String,
          trim: true,
        },

        aadhaarNumber: {
          type: String,
          trim: true,
        },

        businessLicense: {
          type: String,
          trim: true,
        },

        storeLogo: {
          type: String,
          trim: true,
        },
      },

      /* ================= STORE SETTINGS ================= */

      storeSettings: {
        storeSlug: {
          type: String,
          lowercase: true,
          trim: true,
        },

        commissionRate: {
          type: Number,
          default: 10,
        },
      },

      /* ================= META ================= */

      source: {
        type: String,

        default: "website",
      },

      ipAddress: {
        type: String,
      },

      deviceInfo: {
        type: String,
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

/* PREVENT MULTIPLE PENDING APPLICATIONS */
vendorApplicationSchema.index(
  {
    user: 1,
    status: 1,
  },

  {
    unique: true,

    partialFilterExpression: {
      status: "pending",
    },
  }
);

/* SEARCH */
vendorApplicationSchema.index({
  businessName: "text",
  email: "text",
  phone: "text",
  businessType: "text",
});

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .VendorApplication ||
  mongoose.model(
    "VendorApplication",
    vendorApplicationSchema
  );