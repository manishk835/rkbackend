// routes/address.routes.js

const express = require("express");
const router = express.Router();

const {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");

const { protect } = require("../middlewares/auth.middleware");

/* ======================================================
   ALL ROUTES PROTECTED (USER LOGIN REQUIRED)
====================================================== */

// ➕ Create new address
router.post("/", protect, createAddress);

// 📦 Get all user addresses
router.get("/", protect, getUserAddresses);

// ✏️ Update address
router.put("/:id", protect, updateAddress);

// ❌ Delete address
router.delete("/:id", protect, deleteAddress);

// ⭐ Set default address
router.patch("/:id/default", protect, setDefaultAddress);

module.exports = router;
