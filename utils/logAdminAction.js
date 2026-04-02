const AdminLog = require("../models/AdminLog");

module.exports = async (req, action) => {
  try {
    await AdminLog.create({
      admin: req.user._id,
      action,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Log error", err);
  }
};