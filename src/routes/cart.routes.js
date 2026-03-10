const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeItem,
  clearCart,
} = require("../controllers/cart.controller");

const { protect } = require("../middlewares/auth.middleware");

/* ================= CART ================= */

router.get("/", protect, getCart);

router.post("/add", protect, addToCart);

router.put("/update", protect, updateCartItem);

router.delete("/remove", protect, removeItem);

router.delete("/clear", protect, clearCart);

module.exports = router;