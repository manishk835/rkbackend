const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    message: String,
    type: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Notification",
  NotificationSchema
);
