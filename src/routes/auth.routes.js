const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  register,
  login,
  verifyOTP,
  resendOtp,
  getMe,
  logout,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/auth.controller");

const { googleCallback } = require("../controllers/google.controller");

const { protect } = require("../middlewares/auth.middleware");


/* ======================================================
   PUBLIC ROUTES
====================================================== */

router.post("/register", register);

router.post("/verify-otp", verifyOTP);

router.post("/resend-otp", resendOtp);

router.post("/login", login);


/* ================= GOOGLE AUTH ================= */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  googleCallback
);


/* ================= PASSWORD RESET ================= */

router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-otp", verifyResetOtp);

router.post("/reset-password", resetPassword);


/* ======================================================
   AUTHENTICATED ROUTES
====================================================== */

router.get("/me", protect, getMe);

router.post("/logout", protect, logout);

router.put("/change-password", protect, changePassword);


module.exports = router;