const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");

const {
  getSellerProducts,
  getSellerOrders,
  getSellerDashboard,
  applyForSeller,
} = require("../controllers/seller.controller");

/* APPLY FOR SELLER */
router.post("/apply", protect, applyForSeller);

/* SELLER DASHBOARD ROUTES */
router.get("/products", protect, getSellerProducts);
router.get("/orders", protect, getSellerOrders);
router.get("/dashboard", protect, getSellerDashboard);

module.exports = router;
