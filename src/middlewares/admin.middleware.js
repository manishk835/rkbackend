// src/middlewares/admin.middleware.js

const jwt = require("jsonwebtoken");

const User = require("../models/User");

/* ======================================================
   ADMIN AUTH MIDDLEWARE
====================================================== */

exports.adminAuth = async (
  req,
  res,
  next
) => {
  try {

    /* ================= TOKEN ================= */

    const token =
      req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    /* ================= VERIFY ================= */

    let decoded;

    try {

      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    } catch (err) {

      return res.status(401).json({
        message:
          "Invalid or expired token",
      });
    }

    /* ================= USER ================= */

    const user =
      await User.findById(
        decoded.id
      );

    if (!user) {
      return res.status(401).json({
        message:
          "User not found",
      });
    }

    /* ================= ROLE ================= */

    if (
      user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Admin access required",
      });
    }

    /* ================= BLOCK CHECK ================= */

    if (
      user.isBlocked
    ) {
      return res.status(403).json({
        message:
          "Admin account blocked",
      });
    }

    /* ================= TOKEN VERSION ================= */

    if (
      decoded.tokenVersion !==
      user.tokenVersion
    ) {
      return res.status(401).json({
        message:
          "Session expired",
      });
    }

    /* ================= ATTACH USER ================= */

    req.user = user;

    next();

  } catch (error) {

    console.error(
      "ADMIN AUTH ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Authentication failed",
    });
  }
};