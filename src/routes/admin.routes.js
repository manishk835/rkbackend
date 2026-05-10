// src/routes/admin.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   MIDDLEWARES
====================================================== */

const rateLimit = require(
  "express-rate-limit"
);

const {
  adminAuth,
} = require(
  "../middlewares/admin.middleware"
);

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  adminLogin,
  adminLogout,

  enable2FA,
  verify2FA,

  getAdminLogs,

  getAdminDashboard,

  getPendingSellers,
  approveSeller,
  rejectSeller,

  getWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,

  getAllUsers,
  toggleBlockUser,
} = require(
  "../controllers/admin.controller"
);

const {
  getLowStockProducts,
  getPendingProducts,
  approveProduct,
  getAllProductsAdmin,
  deleteProduct,
  toggleProductActive,
} = require(
  "../controllers/product.controller"
);

const {
  getAllOrders,
} = require(
  "../controllers/order.controller"
);

const {
  getAdminAnalytics,
} = require(
  "../controllers/admin.analytics.controller"
);

/* ======================================================
   🔐 RATE LIMITERS
====================================================== */

const loginLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max: 5,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many login attempts. Try again later.",
    },
  });

const adminLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 200,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many requests",
    },
  });

/* ======================================================
   🔐 OPTIONAL IP WHITELIST
====================================================== */

const allowedIPs = [
  "127.0.0.1",
  "::1",
];

const ipWhitelist = (
  req,
  res,
  next
) => {

  /* ================= SKIP IN PRODUCTION ================= */

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return next();
  }

  const ip =
    req.ip ||
    req.connection
      .remoteAddress;

  if (
    !allowedIPs.includes(
      ip
    )
  ) {
    return res.status(403).json({
      message:
        "Access denied from this IP",
    });
  }

  next();
};

/* ======================================================
   🌐 PUBLIC ROUTES
====================================================== */

/* LOGIN */
router.post(
  "/login",
  loginLimiter,
  adminLogin
);

/* ======================================================
   🔒 AUTH REQUIRED
====================================================== */

router.use(adminAuth);

/* LOGOUT */
router.post(
  "/logout",
  adminLogout
);

/* CURRENT ADMIN */
router.get(
  "/me",
  (req, res) => {

    return res.json({
      success: true,

      message:
        "Admin authorized",

      admin: req.user,
    });
  }
);

/* ======================================================
   🔐 SECURITY LAYER
====================================================== */

router.use(
  adminLimiter,
  ipWhitelist
);

/* ======================================================
   📊 DASHBOARD
====================================================== */

router.get(
  "/dashboard",
  getAdminDashboard
);

/* ======================================================
   📈 ANALYTICS
====================================================== */

router.get(
  "/analytics",
  getAdminAnalytics
);

/* ======================================================
   🔐 2FA
====================================================== */

router.post(
  "/2fa/enable",
  enable2FA
);

router.post(
  "/2fa/verify",
  verify2FA
);

/* ======================================================
   📊 LOGS
====================================================== */

router.get(
  "/logs",
  getAdminLogs
);

/* ======================================================
   👥 USERS
====================================================== */

router.get(
  "/users",
  getAllUsers
);

router.patch(
  "/users/:id/toggle-block",
  toggleBlockUser
);

/* ======================================================
   📦 ORDERS
====================================================== */

router.get(
  "/orders",
  getAllOrders
);

/* ======================================================
   🛍 PRODUCTS
====================================================== */

router.get(
  "/products",
  getAllProductsAdmin
);

router.get(
  "/products/low-stock",
  getLowStockProducts
);

router.get(
  "/products/pending",
  getPendingProducts
);

router.put(
  "/products/:id/approve",
  approveProduct
);

router.put(
  "/products/:id/toggle-active",
  toggleProductActive
);

router.delete(
  "/products/:id",
  deleteProduct
);

/* ======================================================
   🧑‍💼 SELLERS
====================================================== */

router.get(
  "/sellers/pending",
  getPendingSellers
);

router.put(
  "/sellers/:id/approve",
  approveSeller
);

router.put(
  "/sellers/:id/reject",
  rejectSeller
);

/* ======================================================
   💰 WITHDRAW REQUESTS
====================================================== */

router.get(
  "/withdraw-requests",
  getWithdrawRequests
);

router.post(
  "/withdraw/approve",
  approveWithdraw
);

router.post(
  "/withdraw/reject",
  rejectWithdraw
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;