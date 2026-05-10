// src/routes/auth.routes.js

const express = require("express");

const router = express.Router();

const passport = require("passport");

const rateLimit = require(
  "express-rate-limit"
);

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  register,
  login,

  verifyOTP,
  resendOtp,

  getMe,
  logout,

  forgotPassword,
  verifyResetOtp,
  resetPassword,

  changePassword,
  updateProfile,
} = require(
  "../controllers/auth.controller"
);

const {
  googleCallback,
} = require(
  "../controllers/google.controller"
);

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
} = require(
  "../middlewares/auth.middleware"
);

/* ======================================================
   🔐 RATE LIMITERS
====================================================== */

const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 20,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many requests, try again later",
    },
  });

const otpLimiter =
  rateLimit({
    windowMs:
      5 * 60 * 1000,

    max: 5,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many OTP requests, please wait",
    },
  });

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many login attempts, try later",
    },
  });

/* ======================================================
   🌐 PUBLIC ROUTES
====================================================== */

/* ================= REGISTER ================= */

router.post(
  "/register",

  authLimiter,

  register
);

/* ================= OTP ================= */

router.post(
  "/verify-otp",

  otpLimiter,

  verifyOTP
);

router.post(
  "/resend-otp",

  otpLimiter,

  resendOtp
);

/* ================= LOGIN ================= */

router.post(
  "/login",

  loginLimiter,

  login
);

/* ======================================================
   🌐 GOOGLE AUTH
====================================================== */

router.get(
  "/google",

  passport.authenticate(
    "google",
    {
      scope: [
        "profile",
        "email",
      ],
    }
  )
);

router.get(
  "/google/callback",

  passport.authenticate(
    "google",
    {
      session: false,
    }
  ),

  googleCallback
);

/* ======================================================
   🔐 PASSWORD RESET
====================================================== */

router.post(
  "/forgot-password",

  otpLimiter,

  forgotPassword
);

router.post(
  "/verify-reset-otp",

  otpLimiter,

  verifyResetOtp
);

router.post(
  "/reset-password",

  authLimiter,

  resetPassword
);

/* ======================================================
   🔒 AUTH REQUIRED
====================================================== */

router.use(protect);

/* ================= CURRENT USER ================= */

router.get(
  "/me",

  getMe
);

/* ================= LOGOUT ================= */

router.post(
  "/logout",

  logout
);

/* ================= CHANGE PASSWORD ================= */

router.put(
  "/change-password",

  changePassword
);

/* ================= UPDATE PROFILE ================= */

router.put(
  "/update",

  updateProfile
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;