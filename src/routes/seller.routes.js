const express = require("express");
const router = express.Router();

const {
  getSellerProducts,
  getSellerOrders,
  getSellerDashboard,
  updateSellerProduct,
  deleteSellerProduct,
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

router.get(
  "/dashboard",
  sellerAccess,
  getSellerDashboard
);

/* ================= SELLER PRODUCTS ================= */

router.get(
  "/products",
  sellerAccess,
  getSellerProducts
);

router.put(
  "/products/:id",
  sellerAccess,
  updateSellerProduct
);

router.delete(
  "/products/:id",
  sellerAccess,
  deleteSellerProduct
);

/* ================= SELLER ORDERS ================= */

router.get(
  "/orders",
  sellerAccess,
  getSellerOrders
);

module.exports = router;

// // src/routes/seller.routes.js

// const express = require("express");
// const router = express.Router();

// const {
//   getSellerProducts,
//   getSellerOrders,
//   getSellerDashboard,
//   updateSellerProduct,
//   deleteSellerProduct,
// } = require("../controllers/seller.controller");

// const { sellerAuth } = require("../middlewares/auth.middleware");
// const { sellerOnly } = require("../middlewares/seller.middleware");

// /* ================= SELLER DASHBOARD ================= */

// router.get(
//   "/dashboard",
//   sellerAuth,
//   sellerOnly,
//   getSellerDashboard
// );

// /* ================= SELLER PRODUCTS ================= */

// router.get(
//   "/products",
//   sellerAuth,
//   sellerOnly,
//   getSellerProducts
// );

// router.put(
//   "/products/:id",
//   sellerAuth,
//   sellerOnly,
//   updateSellerProduct
// );

// router.delete(
//   "/products/:id",
//   sellerAuth,
//   sellerOnly,
//   deleteSellerProduct
// );

// /* ================= SELLER ORDERS ================= */

// router.get(
//   "/orders",
//   sellerAuth,
//   sellerOnly,
//   getSellerOrders
// );

// module.exports = router;