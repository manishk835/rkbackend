// src/middlewares/seller.middleware.js

const User = require(
  "../models/User"
);

/* ======================================================
   SELLER ONLY MIDDLEWARE
====================================================== */

exports.sellerOnly =
  async (
    req,
    res,
    next
  ) => {
    try {

      /* ================= AUTH CHECK ================= */

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      /* ================= LOAD USER ================= */

      const user =
        await User.findById(
          req.user._id ||
            req.user.id
        ).select(
          "_id name email role sellerStatus isBlocked"
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

      /* ================= ROLE CHECK ================= */

      if (
        user.role !==
        "seller"
      ) {
        return res.status(403).json({
          message:
            "Seller account required",
        });
      }

      /* ================= APPROVAL CHECK ================= */

      if (
        user.sellerStatus !==
        "approved"
      ) {
        return res.status(403).json({
          message:
            "Seller account not approved yet",
        });
      }

      /* ================= ATTACH SELLER ================= */

      req.seller =
        user;

      next();

    } catch (error) {

      console.error(
        "SELLER MIDDLEWARE ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Seller authorization failed",
      });
    }
  };