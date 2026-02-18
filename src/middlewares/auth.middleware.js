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
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Account blocked" });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session invalidated" });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ======================================================
   REQUIRE ROLE
====================================================== */
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: `${role} access required` });
    }

    next();
  };
};

/* ======================================================
   ADMIN AUTH
====================================================== */
exports.adminAuth = [
  exports.protect,
  exports.requireRole("admin"),
];

/* ======================================================
   SELLER AUTH (APPROVED ONLY)
====================================================== */
exports.sellerAuth = [
  exports.protect,
  exports.requireRole("seller"),
  async (req, res, next) => {
    if (req.user.sellerStatus !== "approved") {
      return res.status(403).json({
        message: "Seller account not approved yet",
      });
    }
    next();
  },
];
