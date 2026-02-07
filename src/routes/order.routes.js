// src/routes/order.routes.js
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* ======================================================
   USER ROUTES
   ====================================================== */
router.post("/", createOrder);

// Support both query & param
router.get("/my", getUserOrders);        // /my?phone=XXXXXXXXXX
router.get("/my/:phone", getUserOrders); // /my/XXXXXXXXXX

/* ======================================================
   ADMIN ROUTES
   ====================================================== */
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

// // BOTH supported
// router.get("/my", getUserOrders);            // ?phone=
// router.get("/my/:phone", getUserOrders);     // /my/phone

// // ADMIN
// router.get("/", adminAuth, getAllOrders);
// router.put("/:id", adminAuth, updateOrderStatus);

// module.exports = router;
