const express = require("express");
const router = express.Router();

/* ======================================================
   MIDDLEWARE (🔥 SABSE UPAR)
====================================================== */

const { adminAuth } = require("../middlewares/admin.middleware");
const rateLimit = require("express-rate-limit");

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
  getAllUsers,
  toggleBlockUser,
  enable2FA,
  verify2FA,
  getAdminLogs,
} = require("../controllers/admin.controller");

const {
  getLowStockProducts,
  getPendingProducts,
  approveProduct,
  getAllProductsAdmin,
  deleteProduct,
  toggleProductActive,
} = require("../controllers/product.controller");

const { getAllOrders } = require("../controllers/order.controller");
const { getAdminAnalytics } = require("../controllers/admin.analytics.controller");

/* ======================================================
   🔐 RATE LIMITERS
====================================================== */

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts. Try again later.",
  },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    message: "Too many requests",
  },
});

/* ======================================================
   🔐 IP WHITELIST
====================================================== */

const allowedIPs = ["127.0.0.1", "::1"];

const ipWhitelist = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!allowedIPs.includes(ip)) {
    return res.status(403).json({
      message: "Access denied from this IP",
    });
  }

  next();
};

/* ======================================================
   🔐 PUBLIC ROUTES
====================================================== */

router.post("/login", loginLimiter, adminLogin);

router.post("/logout", adminAuth, adminLogout);

router.get("/me", adminAuth, (req, res) => {
  res.json({
    message: "Admin authorized",
    admin: req.user,
  });
});

/* ======================================================
   🔐 PROTECTED ROUTES
====================================================== */

router.use(adminAuth, adminLimiter, ipWhitelist);

/* ======================================================
   📊 ANALYTICS
====================================================== */

router.get("/analytics", getAdminAnalytics);

/* ======================================================
   🔐 2FA
====================================================== */

router.post("/2fa/enable", enable2FA);
router.post("/2fa/verify", verify2FA);

/* ======================================================
   📊 LOGS
====================================================== */

router.get("/logs", getAdminLogs);

/* ======================================================
   📊 DASHBOARD
====================================================== */

router.get("/dashboard", getAdminDashboard);

/* ================= USERS ================= */

router.get("/users", getAllUsers);
router.patch("/users/:id/toggle-block", toggleBlockUser);

/* ======================================================
   📦 ORDERS
====================================================== */

router.get("/orders", getAllOrders);

/* ======================================================
   🛍 PRODUCTS
====================================================== */

router.get("/products", getAllProductsAdmin);
router.get("/products/low-stock", getLowStockProducts);
router.get("/products/pending", getPendingProducts);
router.put("/products/:id/approve", approveProduct);
router.put("/products/:id/toggle-active", toggleProductActive);
router.delete("/products/:id", deleteProduct);

/* ======================================================
   🧑‍💼 SELLERS (OLD SYSTEM - OPTIONAL)
====================================================== */

router.get("/sellers/pending", getPendingSellers);
router.put("/sellers/:id/approve", approveSeller);
router.put("/sellers/:id/reject", rejectSeller);

/* ======================================================
   💰 WITHDRAWALS
====================================================== */

router.get("/withdraw-requests", getWithdrawRequests);
router.post("/withdraw/approve", approveWithdraw);
router.post("/withdraw/reject", rejectWithdraw);

module.exports = router;