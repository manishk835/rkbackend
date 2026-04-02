// models/AdminLog.js
const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  action: String,
  ip: String,
  userAgent: String,
}, { timestamps: true });

module.exports = mongoose.model("AdminLog", adminLogSchema);