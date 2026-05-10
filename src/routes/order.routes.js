// src/routes/order.routes.js

const express = require("express");

const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getOrderByIdAdmin,
  exportOrdersCSV,
  cancelOrder,
  requestReturn,
  downloadInvoice,
  createRazorpayOrder,
  verifyRazorpayPayment,
  refundPayment,
  getPaymentAnalytics,
} = require("../controllers/order.controller");

const {
  protect,
} = require("../middlewares/auth.middleware");

const {
  adminAuth,
} = require("../middlewares/admin.middleware");

/* ======================================================
   USER ROUTES
====================================================== */

/* CREATE ORDER */
router.post(
  "/",
  protect,
  createOrder
);

/* MY ORDERS */
router.get(
  "/my",
  protect,
  getUserOrders
);

/* SINGLE ORDER */
router.get(
  "/:id",
  protect,
  getOrderById
);

/* CANCEL ORDER */
router.put(
  "/:id/cancel",
  protect,
  cancelOrder
);

/* RETURN ORDER */
router.put(
  "/:id/return",
  protect,
  requestReturn
);

/* DOWNLOAD INVOICE */
router.get(
  "/:id/invoice",
  protect,
  downloadInvoice
);

/* ======================================================
   RAZORPAY
====================================================== */

/* CREATE PAYMENT ORDER */
router.post(
  "/razorpay/create",
  protect,
  createRazorpayOrder
);

/* VERIFY PAYMENT */
router.post(
  "/razorpay/verify",
  protect,
  verifyRazorpayPayment
);

/* ======================================================
   ADMIN ROUTES
====================================================== */

/* EXPORT CSV */
router.get(
  "/export/csv",
  adminAuth,
  exportOrdersCSV
);

/* PAYMENT ANALYTICS */
router.get(
  "/analytics/payments",
  adminAuth,
  getPaymentAnalytics
);

/* SINGLE ORDER */
router.get(
  "/admin/:id",
  adminAuth,
  getOrderByIdAdmin
);

/* ALL ORDERS */
router.get(
  "/",
  adminAuth,
  getAllOrders
);

/* UPDATE STATUS */
router.put(
  "/:id/status",
  adminAuth,
  updateOrderStatus
);

/* BACKWARD SUPPORT */
router.put(
  "/:id",
  adminAuth,
  updateOrderStatus
);

/* MANUAL REFUND */
router.post(
  "/refund",
  adminAuth,
  refundPayment
);

module.exports = router;