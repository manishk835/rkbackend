// src/models/Notification.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   NOTIFICATION SCHEMA
====================================================== */

const notificationSchema =
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

      /* ================= CONTENT ================= */

      title: {
        type: String,

        required: true,

        trim: true,

        maxlength: 150,
      },

      message: {
        type: String,

        required: true,

        trim: true,

        maxlength: 1000,
      },

      /* ================= TYPE ================= */

      type: {
        type: String,

        enum: [
          "order",
          "payment",
          "seller",
          "product",
          "system",
          "promotion",
          "security",
        ],

        default:
          "system",

        index: true,
      },

      /* ================= STATUS ================= */

      isRead: {
        type: Boolean,

        default: false,

        index: true,
      },

      readAt: {
        type: Date,
      },

      /* ================= OPTIONAL LINK ================= */

      link: {
        type: String,

        trim: true,
      },

      /* ================= OPTIONAL DATA ================= */

      data: {
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

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

notificationSchema.index({
  user: 1,
  isRead: 1,
});

/* ======================================================
   AUTO READ DATE
====================================================== */

notificationSchema.pre(
  "save",

  function (next) {

    if (
      this.isModified(
        "isRead"
      ) &&
      this.isRead &&
      !this.readAt
    ) {

      this.readAt =
        new Date();
    }

    next();
  }
);

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .Notification ||
  mongoose.model(
    "Notification",
    notificationSchema
  );