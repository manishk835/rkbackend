const User = require("../models/User");

/* ======================================================
   SELLER ONLY MIDDLEWARE
====================================================== */

exports.sellerOnly = async (req, res, next) => {

  try {

    /* ================= AUTH CHECK ================= */

    if (!req.user) {

      return res.status(401).json({
        message: "Unauthorized",
      });

    }

    /* ================= LOAD USER ================= */

    const user = await User.findById(req.user.id);

    if (!user) {

      return res.status(401).json({
        message: "User not found",
      });

    }

    /* ================= ROLE CHECK ================= */

    if (user.role !== "seller") {

      return res.status(403).json({
        message: "Access denied. Seller account required.",
      });

    }

    /* ================= SELLER APPROVAL ================= */

    if (!user.isSellerApproved) {

      return res.status(403).json({
        message: "Seller account not approved yet",
      });

    }

    /* ================= BLOCK CHECK ================= */

    if (user.isBlocked) {

      return res.status(403).json({
        message: "Account blocked",
      });

    }

    /* ================= ATTACH SELLER ================= */

    req.seller = user;

    next();

  }

  catch (error) {

    console.error("Seller middleware error:", error);

    return res.status(500).json({
      message: "Server error",
    });

  }

};

// // seller.middleware.js

// const User = require("../models/User");

// exports.sellerOnly = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const user = await User.findById(req.user._id);

//     if (!user || user.role !== "seller") {
//       return res.status(403).json({
//         message: "Access denied. Seller only.",
//       });
//     }

//     if (user.sellerStatus !== "approved") {
//       return res.status(403).json({
//         message: "Seller not approved yet",
//       });
//     }

//     req.seller = user; // 👈 attach seller cleanly
//     next();

//   } catch (error) {
//     return res.status(500).json({
//       message: "Seller middleware error",
//     });
//   }
// };