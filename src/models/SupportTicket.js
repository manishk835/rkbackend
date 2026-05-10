const mongoose = require("mongoose");

/* ======================================================
   MESSAGE SCHEMA
====================================================== */

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

/* ======================================================
   SUPPORT TICKET SCHEMA
====================================================== */

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Order",
        "Payment",
        "Refund",
        "Account",
        "Delivery",
        "Other",
      ],
      default: "Other",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "Open",
    },

    messages: {
      type: [messageSchema],
      default: [],
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
  mongoose.models.SupportTicket ||
  mongoose.model(
    "SupportTicket",
    supportTicketSchema
  );