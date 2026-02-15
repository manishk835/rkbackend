const express = require("express");
const router = express.Router();

const {
  register,
  login,
  verifyOTP,
  resendOtp,
  getMe,
  logout,
  changePassword
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

router.get("/me", protect, getMe);
router.post("/logout", logout);
router.put("/change-password", protect, changePassword);

module.exports = router;


// // routes/auth.routes.js
// const express = require("express");
// const router = express.Router();

// const {
//   register,
//   login,
//   getMe,
//   logout,
//   changePassword
// } = require("../controllers/auth.controller");

// const { protect } = require("../middlewares/auth.middleware");

// /* ================= AUTH ROUTES ================= */

// router.post("/register", register);
// router.post("/login", login);
// router.get("/me", protect, getMe);
// router.post("/logout", logout);
// router.put("/change-password", protect, changePassword);

// module.exports = router;
