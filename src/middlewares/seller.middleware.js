// seller.middleware.js

const User = require("../models/User");

exports.sellerOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || user.role !== "seller") {
      return res.status(403).json({
        message: "Access denied. Seller only.",
      });
    }

    if (user.sellerStatus !== "approved") {
      return res.status(403).json({
        message: "Seller not approved yet",
      });
    }

    req.seller = user; // 👈 attach seller cleanly
    next();

  } catch (error) {
    return res.status(500).json({
      message: "Seller middleware error",
    });
  }
};