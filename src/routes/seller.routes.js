const express = require("express");
const router = express.Router();
const { sellerAuth } = require("../middlewares/auth.middleware");
const {
  getSellerProducts,
  getSellerOrders,
  getSellerDashboard,
} = require("../controllers/seller.controller");

router.get("/products", sellerAuth, getSellerProducts);
router.get("/orders", sellerAuth, getSellerOrders);
router.get("/dashboard", sellerAuth, getSellerDashboard);

module.exports = router;
