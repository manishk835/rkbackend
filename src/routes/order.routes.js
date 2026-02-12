// src/routes/order.routes.js
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  getOrderByIdAdmin,
  exportOrdersCSV, // ✅ CSV EXPORT
} = require("../controllers/order.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* ======================================================
   USER ROUTES
   ====================================================== */

   const { protect } = require("../middlewares/auth.middleware");

   // Create order (USER)
   router.post("/", protect, createOrder);
   
   // Get logged in user orders
   router.get("/my", protect, getUserOrders);
   


/* ======================================================
   ADMIN ROUTES
   ====================================================== */
// ⚠️ IMPORTANT: admin specific routes FIRST

// Export orders CSV (ADMIN)
router.get(
  "/export/csv",
  adminAuth,
  exportOrdersCSV
);

// Get single order (ADMIN)
router.get(
  "/admin/:id",
  adminAuth,
  getOrderByIdAdmin
);

// Get all orders (ADMIN) + pagination + filter + search
router.get(
  "/",
  adminAuth,
  getAllOrders
);

// Update order status (ADMIN)
router.put(
  "/:id/status",
  adminAuth,
  updateOrderStatus
);

// (optional backward compatibility)
router.put(
  "/:id",
  adminAuth,
  updateOrderStatus
);

module.exports = router;
