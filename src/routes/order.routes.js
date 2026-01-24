const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

// Public (User checkout)
router.post("/", createOrder);

// Admin protected
router.get("/", adminAuth, getOrders);
router.put("/:id", adminAuth, updateOrderStatus);

module.exports = router;
