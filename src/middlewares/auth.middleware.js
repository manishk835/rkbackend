const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ======================================================
   VERIFY TOKEN HELPER
====================================================== */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/* ======================================================
   PROTECT (USER AUTH)
====================================================== */
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired",
        });
      }

      return res.status(401).json({
        message: "Invalid token",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked",
      });
    }

    // 🔐 Token version check (for forced logout support)
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Session invalidated",
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Protect middleware error:", error);
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

/* ======================================================
   ADMIN AUTH
====================================================== */
exports.adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    if (admin.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        message: "Session invalidated",
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({
      message: "Authorization failed",
    });
  }
};
