// src/routes/seller.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  getSellerProducts,
  getSingleSellerProduct,
  getSellerOrders,
  getSellerDashboard,
  getSellerAnalytics,
  getLowStockProducts,

  updateSellerProduct,
  deleteSellerProduct,
  toggleSellerProductStatus,

  getWalletTransactions,
  withdrawFromWallet,
} = require("../controllers/seller.controller");

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
  requireRole,
  approvedSeller,
} = require("../middlewares/auth.middleware");

/* ======================================================
   SELLER ACCESS
====================================================== */

const sellerAccess = [
  protect,
  requireRole("seller"),
  approvedSeller,
];

/* ======================================================
   DASHBOARD
====================================================== */

router.get(
  "/dashboard",
  sellerAccess,
  getSellerDashboard
);

/* ======================================================
   ANALYTICS
====================================================== */

router.get(
  "/analytics",
  sellerAccess,
  getSellerAnalytics
);

/* ======================================================
   PRODUCTS
====================================================== */

/* ALL PRODUCTS */
router.get(
  "/products",
  sellerAccess,
  getSellerProducts
);

/* LOW STOCK */
router.get(
  "/products/low-stock",
  sellerAccess,
  getLowStockProducts
);

/* SINGLE PRODUCT */
router.get(
  "/products/:id",
  sellerAccess,
  getSingleSellerProduct
);

/* UPDATE PRODUCT */
router.put(
  "/products/:id",
  sellerAccess,
  updateSellerProduct
);

/* TOGGLE ACTIVE STATUS */
router.patch(
  "/products/:id/toggle",
  sellerAccess,
  toggleSellerProductStatus
);

/* DELETE PRODUCT */
router.delete(
  "/products/:id",
  sellerAccess,
  deleteSellerProduct
);

/* ======================================================
   ORDERS
====================================================== */

router.get(
  "/orders",
  sellerAccess,
  getSellerOrders
);

/* ======================================================
   WALLET
====================================================== */

/* GET WALLET */
router.get(
  "/wallet",
  sellerAccess,
  getWalletTransactions
);

/* WITHDRAW */
router.post(
  "/wallet/withdraw",
  sellerAccess,
  withdrawFromWallet
);

module.exports = router;