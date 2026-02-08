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

// Create order
router.post("/", createOrder);

// Get user orders (by phone)
router.get("/my", getUserOrders);        // /my?phone=XXXXXXXXXX
router.get("/my/:phone", getUserOrders); // /my/XXXXXXXXXX


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
