const express = require("express");
const router = express.Router();
const passport = require("passport");

const rateLimit = require("express-rate-limit");

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
   🔐 RATE LIMITERS (ANTI-HACK)
====================================================== */

// 🔥 auth लिमिटर (login/register brute force रोकने के लिए)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: "Too many requests, try again later",
});

// 🔥 OTP लिमिटर
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 5,
  message: "Too many OTP requests, please wait",
});

// 🔥 login strict limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, try later",
});

/* ======================================================
   PUBLIC ROUTES
====================================================== */

router.post("/register", authLimiter, register);

router.post("/verify-otp", otpLimiter, verifyOTP);

router.post("/resend-otp", otpLimiter, resendOtp);

router.post("/login", loginLimiter, login);

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

router.post("/forgot-password", otpLimiter, forgotPassword);

router.post("/verify-reset-otp", otpLimiter, verifyResetOtp);

router.post("/reset-password", authLimiter, resetPassword);

/* ======================================================
   AUTHENTICATED ROUTES
====================================================== */

router.get("/me", protect, getMe);

router.post("/logout", protect, logout);

router.put("/change-password", protect, changePassword);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const passport = require("passport");

// const {
//   register,
//   login,
//   verifyOTP,
//   resendOtp,
//   getMe,
//   logout,
//   changePassword,
//   forgotPassword,
//   verifyResetOtp,
//   resetPassword,
// } = require("../controllers/auth.controller");

// const { googleCallback } = require("../controllers/google.controller");

// const { protect } = require("../middlewares/auth.middleware");


// /* ======================================================
//    PUBLIC ROUTES
// ====================================================== */

// router.post("/register", register);

// router.post("/verify-otp", verifyOTP);

// router.post("/resend-otp", resendOtp);

// router.post("/login", login);


// /* ================= GOOGLE AUTH ================= */

// router.get(
//   "/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   })
// );

// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     session: false,
//   }),
//   googleCallback
// );


// /* ================= PASSWORD RESET ================= */

// router.post("/forgot-password", forgotPassword);

// router.post("/verify-reset-otp", verifyResetOtp);

// router.post("/reset-password", resetPassword);


// /* ======================================================
//    AUTHENTICATED ROUTES
// ====================================================== */

// router.get("/me", protect, getMe);

// router.post("/logout", protect, logout);

// router.put("/change-password", protect, changePassword);


// module.exports = router;