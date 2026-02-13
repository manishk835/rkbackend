const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");

/* USER ROUTES */

router.get("/", protect, getWishlist);
router.post("/", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;
