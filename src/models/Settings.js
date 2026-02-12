const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    storeName: String,
    supportEmail: String,
    supportPhone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
