// src/models/AdminLog.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   ADMIN LOG SCHEMA
====================================================== */

const adminLogSchema =
  new mongoose.Schema(
    {
      /* ================= ADMIN ================= */

      admin: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* ================= ACTION ================= */

      action: {
        type: String,

        required: true,

        trim: true,

        maxlength: 500,

        index: true,
      },

      /* ================= META ================= */

      ip: {
        type: String,

        trim: true,
      },

      userAgent: {
        type: String,

        trim: true,
      },

      method: {
        type: String,

        uppercase: true,
      },

      endpoint: {
        type: String,
      },

      statusCode: {
        type: Number,
      },

      /* ================= OPTIONAL ================= */

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

adminLogSchema.index({
  createdAt: -1,
});

adminLogSchema.index({
  admin: 1,
  createdAt: -1,
});

adminLogSchema.index({
  action: "text",
});

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .AdminLog ||
  mongoose.model(
    "AdminLog",
    adminLogSchema
  );