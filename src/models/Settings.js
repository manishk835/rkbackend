// src/models/Setting.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   SETTINGS SCHEMA
====================================================== */

const settingsSchema =
  new mongoose.Schema(
    {
      /* ================= STORE ================= */

      storeName: {
        type: String,

        trim: true,

        default:
          "RK Fashion",
      },

      storeDescription: {
        type: String,

        trim: true,

        maxlength: 1000,
      },

      logo: {
        type: String,
      },

      favicon: {
        type: String,
      },

      /* ================= SUPPORT ================= */

      supportEmail: {
        type: String,

        trim: true,

        lowercase: true,

        match:
          /^\S+@\S+\.\S+$/,
      },

      supportPhone: {
        type: String,

        trim: true,
      },

      supportWhatsapp: {
        type: String,

        trim: true,
      },

      /* ================= SOCIAL ================= */

      socialLinks: {
        instagram:
          String,

        facebook:
          String,

        twitter:
          String,

        youtube:
          String,

        linkedin:
          String,
      },

      /* ================= SEO ================= */

      seoTitle: {
        type: String,

        trim: true,
      },

      seoDescription: {
        type: String,

        trim: true,
      },

      /* ================= SHIPPING ================= */

      shippingCharge: {
        type: Number,

        default: 0,

        min: 0,
      },

      freeShippingAbove: {
        type: Number,

        default: 0,

        min: 0,
      },

      /* ================= TAX ================= */

      taxPercent: {
        type: Number,

        default: 0,

        min: 0,
      },

      /* ================= FEATURES ================= */

      maintenanceMode: {
        type: Boolean,

        default: false,
      },

      allowSellerRegistration:
        {
          type: Boolean,

          default: true,
        },

      allowCOD: {
        type: Boolean,

        default: true,
      },

      /* ================= META ================= */

      currency: {
        type: String,

        default:
          "INR",
      },

      timezone: {
        type: String,

        default:
          "Asia/Kolkata",
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .Settings ||
  mongoose.model(
    "Settings",
    settingsSchema
  );