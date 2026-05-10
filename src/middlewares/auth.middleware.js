// src/middlewares/auth.middleware.js

const jwt = require("jsonwebtoken");

const User = require("../models/User");

/* ======================================================
   ENV CHECK
====================================================== */

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}

/* ======================================================
   🔐 GET TOKEN
====================================================== */

const getTokenFromRequest =
  (req) => {

    /* ================= COOKIE ================= */

    if (
      req.cookies?.token
    ) {
      return req.cookies.token;
    }

    /* ================= HEADER ================= */

    const authHeader =
      req.headers.authorization;

    if (
      authHeader &&
      authHeader.startsWith(
        "Bearer "
      )
    ) {
      return authHeader.split(
        " "
      )[1];
    }

    return null;
  };

/* ======================================================
   🔐 VERIFY TOKEN
====================================================== */

const verifyToken =
  (token) => {

    return jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  };

/* ======================================================
   🔐 PROTECT
====================================================== */

exports.protect =
  async (
    req,
    res,
    next
  ) => {
    try {

      /* ================= TOKEN ================= */

      const token =
        getTokenFromRequest(
          req
        );

      if (!token) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      /* ================= VERIFY ================= */

      let decoded;

      try {

        decoded =
          verifyToken(
            token
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
        ).select(
          "_id name email phone role tokenVersion isBlocked sellerStatus profileImage"
        );

      if (!user) {
        return res.status(401).json({
          message:
            "User not found",
        });
      }

      /* ================= BLOCK CHECK ================= */

      if (
        user.isBlocked
      ) {
        return res.status(403).json({
          message:
            "Account blocked",
        });
      }

      /* ================= TOKEN VERSION ================= */

      if (
        decoded.tokenVersion !==
        user.tokenVersion
      ) {
        return res.status(401).json({
          message:
            "Session expired. Please login again",
        });
      }

      /* ================= ATTACH USER ================= */

      req.user = user;

      next();

    } catch (error) {

      console.error(
        "Auth Middleware Error:",
        error
      );

      return res.status(500).json({
        message:
          "Authentication failed",
      });
    }
  };

/* ======================================================
   🔐 ROLE CHECK
====================================================== */

exports.requireRole =
  (...roles) => {

    return (
      req,
      res,
      next
    ) => {

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      if (
        !roles.includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      next();
    };
  };

/* ======================================================
   🔐 ADMIN ONLY
====================================================== */

exports.adminOnly = [
  exports.protect,

  exports.requireRole(
    "admin"
  ),
];

/* ======================================================
   🔐 SELLER ONLY
====================================================== */

exports.sellerOnly = [
  exports.protect,

  exports.requireRole(
    "seller"
  ),
];

/* ======================================================
   🔐 APPROVED SELLER
====================================================== */

exports.approvedSeller =
  (
    req,
    res,
    next
  ) => {

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (
      req.user.role !==
      "seller"
    ) {
      return res.status(403).json({
        message:
          "Seller access required",
      });
    }

    if (
      req.user
        .sellerStatus !==
      "approved"
    ) {
      return res.status(403).json({
        message:
          "Seller account not approved yet",
      });
    }

    next();
  };

/* ======================================================
   🔐 OPTIONAL AUTH
====================================================== */

exports.optionalAuth =
  async (
    req,
    res,
    next
  ) => {
    try {

      const token =
        getTokenFromRequest(
          req
        );

      if (!token) {
        return next();
      }

      const decoded =
        verifyToken(
          token
        );

      const user =
        await User.findById(
          decoded.id
        ).select(
          "_id name email role profileImage sellerStatus"
        );

      if (
        user &&
        !user.isBlocked
      ) {
        req.user = user;
      }

      next();

    } catch {

      /* silently ignore invalid token */

      next();
    }
  };