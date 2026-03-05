const express = require("express");
const router = express.Router();

const {
  getSellerProducts,
  getSellerOrders,
  getSellerDashboard,
  updateSellerProduct,
  deleteSellerProduct,
} = require("../controllers/seller.controller");

const { sellerAuth } = require("../middlewares/auth.middleware");
const { sellerOnly } = require("../middlewares/seller.middleware");

/* ================= SELLER DASHBOARD ================= */

router.get(
  "/dashboard",
  sellerAuth,
  sellerOnly,
  getSellerDashboard
);

/* ================= SELLER PRODUCTS ================= */

router.get(
  "/products",
  sellerAuth,
  sellerOnly,
  getSellerProducts
);

router.put(
  "/products/:id",
  sellerAuth,
  sellerOnly,
  updateSellerProduct
);

router.delete(
  "/products/:id",
  sellerAuth,
  sellerOnly,
  deleteSellerProduct
);

/* ================= SELLER ORDERS ================= */

router.get(
  "/orders",
  sellerAuth,
  sellerOnly,
  getSellerOrders
);

module.exports = router;