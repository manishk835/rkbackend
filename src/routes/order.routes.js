const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

// USER
router.post("/", createOrder);
router.get("/my", getUserOrders); // ?phone=xxxxxxxxxx

// ADMIN
router.get("/", adminAuth, getAllOrders);
router.put("/:id", adminAuth, updateOrderStatus);

module.exports = router;


// const express = require("express");
// const router = express.Router();

// const {
//   createOrder,
//   getAllOrders,
//   getUserOrders,
//   updateOrderStatus,
// } = require("../controllers/order.controller");

// const { adminAuth } = require("../middlewares/auth.middleware");

// // USER
// router.post("/", createOrder);
// router.get("/my", getUserOrders); // ✅ USER ORDERS

// // ADMIN
// router.get("/", adminAuth, getAllOrders);
// router.put("/:id", adminAuth, updateOrderStatus);

// module.exports = router;