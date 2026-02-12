
const express = require("express");
const router = express.Router();

const {
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);

module.exports = router;
