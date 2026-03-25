// src/routes/admin.routes.js

const express = require("express");
const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  adminLogin,
  adminLogout,
  getAdminDashboard, // 🔥 NEW
  getPendingSellers, // 🔥 NEXT STEP READY
  approveSeller,
  rejectSeller,
  getWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
} = require("../controllers/admin.controller");

const {
  getLowStockProducts,
  getPendingProducts,
  approveProduct,
  getAllProductsAdmin,
  deleteProduct,
  toggleProductActive,
} = require("../controllers/product.controller");

const {
  getAllOrders,
} = require("../controllers/order.controller");

/* ======================================================
   MIDDLEWARE
====================================================== */

const { adminAuth } = require("../middlewares/admin.middleware");

/* ======================================================
   AUTH
====================================================== */

// Login (public)
router.post("/login", adminLogin);

// Logout
router.post("/logout", adminAuth, adminLogout);

// Session check
router.get("/me", adminAuth, (req, res) => {
  res.json({
    message: "Admin authorized",
    admin: req.user,
  });
});

/* ======================================================
   DASHBOARD
====================================================== */

router.get("/dashboard", adminAuth, getAdminDashboard);

/* ======================================================
   ORDERS
====================================================== */

router.get("/orders", adminAuth, getAllOrders);

/* ======================================================
   PRODUCTS MANAGEMENT
====================================================== */

// All products
router.get("/products", adminAuth, getAllProductsAdmin);

// Low stock
router.get("/products/low-stock", adminAuth, getLowStockProducts);

// Pending approval
router.get("/products/pending", adminAuth, getPendingProducts);

// Approve product
router.put("/products/:id/approve", adminAuth, approveProduct);

// Toggle active
router.put("/products/:id/toggle-active", adminAuth, toggleProductActive);

// Delete
router.delete("/products/:id", adminAuth, deleteProduct);

/* ======================================================
   SELLER APPROVAL (🔥 IMPORTANT)
====================================================== */

// Pending sellers
router.get("/sellers/pending", adminAuth, getPendingSellers);

// Approve seller
router.put("/sellers/:id/approve", adminAuth, approveSeller);

// Reject seller
router.put("/sellers/:id/reject", adminAuth, rejectSeller);

router.get("/withdraw-requests", adminAuth, getWithdrawRequests);

router.post("/withdraw/approve", adminAuth, approveWithdraw);

router.post("/withdraw/reject", adminAuth, rejectWithdraw);

module.exports = router;

// // src/routes/admin.routes.js

// const express = require("express");
// const router = express.Router();

// /* ======================================================
//    CONTROLLERS
// ====================================================== */

// const {
//   adminLogin,
//   adminLogout,
// } = require("../controllers/admin.controller");

// const {
//   getLowStockProducts,
//   getPendingProducts,
//   approveProduct,
//   getAllProductsAdmin,
//   deleteProduct,
//   toggleProductActive,
// } = require("../controllers/product.controller");

// const {
//   getAllOrders,
// } = require("../controllers/order.controller");

// /* ======================================================
//    MIDDLEWARE
// ====================================================== */

// const { adminAuth } = require("../middlewares/admin.middleware");

// /* ======================================================
//    ADMIN AUTH
// ====================================================== */

// // Login (public)
// router.post("/login", adminLogin);

// // Logout (protected)
// router.post("/logout", adminAuth, adminLogout);

// /* ======================================================
//    ADMIN SESSION CHECK
// ====================================================== */

// router.get("/me", adminAuth, (req, res) => {
//   res.json({
//     message: "Admin authorized",
//     admin: req.user,
//   });
// });


// /* ======================================================
//    DASHBOARD ROUTES
// ====================================================== */

// // All Orders (dashboard stats + list)
// router.get("/orders", adminAuth, getAllOrders);

// // Low Stock Products
// router.get(
//   "/products/admin/low-stock",
//   adminAuth,
//   getLowStockProducts
// );

// /* ======================================================
//    PRODUCT APPROVAL SYSTEM
// ====================================================== */

// // Get all pending products
// router.get(
//   "/products/pending",
//   adminAuth,
//   getPendingProducts
// );

// // Approve product
// router.put(
//   "/products/:id/approve",
//   adminAuth,
//   approveProduct
// );
// router.get("/products", adminAuth, getAllProductsAdmin);
// router.delete("/products/:id", adminAuth, deleteProduct);
// router.put("/products/:id/toggle-active", adminAuth, toggleProductActive);

// module.exports = router;