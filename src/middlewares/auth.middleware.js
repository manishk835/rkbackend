// // middlewares/auth.middleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ======================================================
   PROTECT (AUTHENTICATED USERS)
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

      decoded = jwt.verify(token, process.env.JWT_SECRET);

    } catch (err) {

      return res.status(401).json({
        message: "Invalid or expired token",
      });

    }

    const user = await User.findById(decoded.id)
      .select("_id name email phone role tokenVersion isBlocked sellerStatus");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked",
      });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Session expired. Please login again",
      });
    }

    req.user = user;

    next();

  } catch (error) {

    console.error("Auth Middleware Error:", error);

    res.status(500).json({
      message: "Authentication failed",
    });

  }

};

/* ======================================================
   ROLE CHECK
====================================================== */

exports.requireRole = (...roles) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();

  };

};

/* ======================================================
   ADMIN ONLY
====================================================== */

exports.adminOnly = [
  exports.protect,
  exports.requireRole("admin"),
];

/* ======================================================
   SELLER ONLY
====================================================== */

exports.sellerOnly = [
  exports.protect,
  exports.requireRole("seller"),
];

/* ======================================================
   APPROVED SELLER
====================================================== */

exports.approvedSeller = [
  exports.protect,
  exports.requireRole("seller"),

  (req, res, next) => {

    if (req.user.sellerStatus !== "approved") {
      return res.status(403).json({
        message: "Seller account not approved yet",
      });
    }

    next();

  },
];
// // middlewares/auth.middleware.js
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// /* ======================================================
//    VERIFY TOKEN
// ====================================================== */

// const verifyToken = (token) => {
//   return jwt.verify(token, process.env.JWT_SECRET);
// };

// /* ======================================================
//    PROTECT (ANY LOGGED USER)
// ====================================================== */

// exports.protect = async (req, res, next) => {
//   try {

//     const token = req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     let decoded;

//     try {
//       decoded = verifyToken(token);
//     } catch (err) {
//       return res.status(401).json({
//         message: "Invalid or expired token",
//       });
//     }

//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(401).json({
//         message: "User not found",
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         message: "Account blocked",
//       });
//     }

//     if (decoded.tokenVersion !== user.tokenVersion) {
//       return res.status(401).json({
//         message: "Session invalidated",
//       });
//     }

//     req.user = user;

//     next();

//   } catch (error) {

//     console.error("Auth Middleware Error:", error);

//     return res.status(500).json({
//       message: "Authentication failed",
//     });

//   }
// };

// /* ======================================================
//    ROLE CHECK (GENERIC)
// ====================================================== */

// exports.requireRole = (role) => {

//   return (req, res, next) => {

//     if (!req.user) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     if (req.user.role !== role) {
//       return res.status(403).json({
//         message: `${role} access required`,
//       });
//     }

//     next();

//   };

// };

// /* ======================================================
//    ADMIN ONLY
// ====================================================== */

// exports.adminOnly = [
//   exports.protect,
//   exports.requireRole("admin"),
// ];

// /* ======================================================
//    SELLER ONLY
// ====================================================== */

// exports.sellerOnly = [
//   exports.protect,
//   exports.requireRole("seller"),
// ];

// /* ======================================================
//    APPROVED SELLER
// ====================================================== */

// exports.approvedSeller = async (req, res, next) => {

//   try {

//     if (!req.user) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     if (req.user.role !== "seller") {
//       return res.status(403).json({
//         message: "Seller access required",
//       });
//     }

//     if (req.user.sellerStatus !== "approved") {
//       return res.status(403).json({
//         message: "Seller account not approved yet",
//       });
//     }

//     next();

//   } catch (error) {

//     return res.status(500).json({
//       message: "Authorization failed",
//     });

//   }

// };