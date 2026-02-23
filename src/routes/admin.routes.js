// src/routes/admin.routes.js

const express = require("express");
const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  adminLogin,
  adminLogout,
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
   ADMIN AUTH
====================================================== */

// Login (public)
router.post("/login", adminLogin);

// Logout (protected)
router.post("/logout", adminAuth, adminLogout);

/* ======================================================
   ADMIN SESSION CHECK
====================================================== */

router.get("/me", adminAuth, (req, res) => {
  res.json({
    message: "Admin authorized",
    admin: req.user,
  });
});

/* ======================================================
   DASHBOARD ROUTES
====================================================== */

// All Orders (dashboard stats + list)
router.get("/orders", adminAuth, getAllOrders);

// Low Stock Products
router.get(
  "/products/admin/low-stock",
  adminAuth,
  getLowStockProducts
);

/* ======================================================
   PRODUCT APPROVAL SYSTEM
====================================================== */

// Get all pending products
router.get(
  "/products/pending",
  adminAuth,
  getPendingProducts
);

// Approve product
router.put(
  "/products/:id/approve",
  adminAuth,
  approveProduct
);
router.get("/products", adminAuth, getAllProductsAdmin);
router.delete("/products/:id", adminAuth, deleteProduct);
router.put("/products/:id/toggle-active", adminAuth, toggleProductActive);

module.exports = router;

// // src/routes/admin.routes.js

// const express = require("express");
// const router = express.Router();

// const {
//   adminLogin,
//   adminLogout,
//   // getPendingSellers,
//   // approveSeller,
//   // rejectSeller,
// } = require("../controllers/admin.controller");

// // 🔥 IMPORTANT — NEW ADMIN MIDDLEWARE
// const { adminAuth } = require("../middlewares/admin.middleware");

// /* ================= ADMIN AUTH ================= */

// // Login (no auth)
// router.post("/login", adminLogin);

// // Logout (protected)
// router.post("/logout", adminAuth, adminLogout);

// /* ================= SELLER APPROVAL ================= */

// // router.get("/sellers/pending", adminAuth, getPendingSellers);
// // router.put("/sellers/:id/approve", adminAuth, approveSeller);
// // router.put("/sellers/:id/reject", adminAuth, rejectSeller);

// /* ================= ADMIN SESSION CHECK ================= */

// router.get("/me", adminAuth, (req, res) => {
//   res.json({
//     message: "Admin authorized",
//     admin: req.user,
//   });
// });

// module.exports = router;