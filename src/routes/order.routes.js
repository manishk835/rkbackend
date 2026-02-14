// src/routes/order.routes.js
const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  getOrderByIdAdmin,
  exportOrdersCSV,
  cancelOrder,
  requestReturn,
  downloadInvoice
} = require("../controllers/order.controller");

const { protect, adminAuth } = require("../middlewares/auth.middleware");


/* ================= USER ROUTES ================= */

router.post("/", protect, createOrder);
router.get("/my", protect, getUserOrders);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/return", protect, requestReturn);
router.get("/:id/invoice", protect, downloadInvoice);


/* ================= ADMIN ROUTES ================= */

router.get("/export/csv", adminAuth, exportOrdersCSV);
router.get("/admin/:id", adminAuth, getOrderByIdAdmin);
router.get("/", adminAuth, getAllOrders);
router.put("/:id/status", adminAuth, updateOrderStatus);
router.put("/:id", adminAuth, updateOrderStatus);

module.exports = router;
