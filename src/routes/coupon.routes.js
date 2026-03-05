// src/routes/coupon.routes.js
const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
} = require("../controllers/coupon.controller");

const { adminAuth } = require("../middlewares/admin.middleware");

/* ADMIN */
router.post("/", adminAuth, createCoupon);
router.get("/", adminAuth, getCoupons);
router.delete("/:id", adminAuth, deleteCoupon);
router.patch("/:id/toggle", adminAuth, toggleCoupon);

/* PUBLIC */
router.post("/validate", validateCoupon);

module.exports = router;