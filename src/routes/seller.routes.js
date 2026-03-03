const express = require("express");
const router = express.Router();

const { sellerAuth } = require("../middlewares/auth.middleware");
const { sellerOnly } = require("../middlewares/seller.middleware");

const {
  getSellerProducts,
  getSellerOrders,
  getSellerDashboard,
} = require("../controllers/seller.controller");

/* ================= SELLER ROUTES ================= */

router.get("/products", sellerAuth, sellerOnly, getSellerProducts);
router.get("/orders", sellerAuth, sellerOnly, getSellerOrders);
router.get("/dashboard", sellerAuth, sellerOnly, getSellerDashboard);

module.exports = router;