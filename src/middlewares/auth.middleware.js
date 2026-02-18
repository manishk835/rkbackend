const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ======================================================
   VERIFY TOKEN
====================================================== */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/* ======================================================
   PROTECT (ANY LOGGED USER)
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
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.id);

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
        message: "Session invalidated",
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

/* ======================================================
   GENERIC ROLE CHECK
====================================================== */
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        message: `${role} access required`,
      });
    }

    next();
  };
};

exports.sellerAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token)
      return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "seller") {
      return res.status(403).json({ message: "Seller access required" });
    }

    if (user.sellerStatus !== "approved") {
      return res.status(403).json({
        message: "Seller account not approved yet",
      });
    }

    req.seller = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};



/* ======================================================
   ADMIN SHORTCUT
====================================================== */
exports.adminAuth = [
  exports.protect,
  exports.requireRole("admin"),
];

/* ======================================================
   SELLER SHORTCUT
====================================================== */
exports.sellerAuth = [
  exports.protect,
  exports.requireRole("seller"),
];
