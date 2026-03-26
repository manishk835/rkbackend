const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ======================================================
   🔐 GET TOKEN (COOKIE + HEADER SUPPORT)
====================================================== */

const getTokenFromRequest = (req) => {
  // ✅ cookie
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // ✅ header (Bearer token)
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

/* ======================================================
   PROTECT (AUTHENTICATED USERS)
====================================================== */

exports.protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

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

    const user = await User.findById(decoded.id).select(
      "_id name email phone role tokenVersion isBlocked sellerStatus"
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // 🚫 blocked user
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked",
      });
    }

    // 🔒 token invalidation check
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Session expired. Please login again",
      });
    }

    // ✅ attach user
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

/* ======================================================
   OPTIONAL AUTH (guest + user)
====================================================== */

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(); // guest allowed
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id name role"
    );

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    next(); // silently ignore
  }
};

// // // middlewares/auth.middleware.js

// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// /* ======================================================
//    PROTECT (AUTHENTICATED USERS)
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

//       decoded = jwt.verify(token, process.env.JWT_SECRET);

//     } catch (err) {

//       return res.status(401).json({
//         message: "Invalid or expired token",
//       });

//     }

//     const user = await User.findById(decoded.id)
//       .select("_id name email phone role tokenVersion isBlocked sellerStatus");

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
//         message: "Session expired. Please login again",
//       });
//     }

//     req.user = user;

//     next();

//   } catch (error) {

//     console.error("Auth Middleware Error:", error);

//     res.status(500).json({
//       message: "Authentication failed",
//     });

//   }

// };

// /* ======================================================
//    ROLE CHECK
// ====================================================== */

// exports.requireRole = (...roles) => {

//   return (req, res, next) => {

//     if (!req.user) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         message: "Access denied",
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

// exports.approvedSeller = [
//   exports.protect,
//   exports.requireRole("seller"),

//   (req, res, next) => {

//     if (req.user.sellerStatus !== "approved") {
//       return res.status(403).json({
//         message: "Seller account not approved yet",
//       });
//     }

//     next();

//   },
// ];