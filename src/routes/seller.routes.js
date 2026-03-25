// src/routes/seller.routes.js

const express = require("express");
const router = express.Router();

const {
  getSellerProducts,
  getSellerOrders,
  getSellerDashboard,
  updateSellerProduct,
  deleteSellerProduct,
  getWalletTransactions,   // 🔥 NEW
  withdrawFromWallet,      // 🔥 NEW
} = require("../controllers/seller.controller");

const {
  protect,
  requireRole,
  approvedSeller,
} = require("../middlewares/auth.middleware");

/* ======================================================
   SELLER ACCESS MIDDLEWARE
====================================================== */

const sellerAccess = [
  protect,
  requireRole("seller"),
  approvedSeller,
];

/* ================= SELLER DASHBOARD ================= */

router.get("/dashboard", sellerAccess, getSellerDashboard);

/* ================= SELLER PRODUCTS ================= */

router.get("/products", sellerAccess, getSellerProducts);

router.put("/products/:id", sellerAccess, updateSellerProduct);

router.delete("/products/:id", sellerAccess, deleteSellerProduct);

/* ================= SELLER ORDERS ================= */

router.get("/orders", sellerAccess, getSellerOrders);

/* ================= WALLET ================= */

// 🔥 Get wallet transactions
router.get("/wallet", sellerAccess, getWalletTransactions);

// 🔥 Withdraw money
router.post("/wallet/withdraw", sellerAccess, withdrawFromWallet);

module.exports = router;

// // // src/routes/seller.routes.js
// const express = require("express");
// const router = express.Router();

// const {
//   getSellerProducts,
//   getSellerOrders,
//   getSellerDashboard,
//   updateSellerProduct,
//   deleteSellerProduct,
// } = require("../controllers/seller.controller");

// const {
//   protect,
//   requireRole,
//   approvedSeller,
// } = require("../middlewares/auth.middleware");

// /* ======================================================
//    SELLER ACCESS MIDDLEWARE
// ====================================================== */

// const sellerAccess = [
//   protect,
//   requireRole("seller"),
//   approvedSeller,
// ];

// /* ================= SELLER DASHBOARD ================= */

// router.get(
//   "/dashboard",
//   sellerAccess,
//   getSellerDashboard
// );

// /* ================= SELLER PRODUCTS ================= */

// router.get(
//   "/products",
//   sellerAccess,
//   getSellerProducts
// );

// router.put(
//   "/products/:id",
//   sellerAccess,
//   updateSellerProduct
// );

// router.delete(
//   "/products/:id",
//   sellerAccess,
//   deleteSellerProduct
// );

// /* ================= SELLER ORDERS ================= */

// router.get(
//   "/orders",
//   sellerAccess,
//   getSellerOrders
// );

// module.exports = router;

