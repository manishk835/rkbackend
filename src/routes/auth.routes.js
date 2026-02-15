const express = require("express");
const router = express.Router();

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

const { protect } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getMe);
router.post("/logout", logout);
router.put("/change-password", protect, changePassword);


module.exports = router;


// // // routes/auth.routes.js


// const express = require("express");
// const router = express.Router();

// const {
//   register,
//   login,
//   verifyOTP,
//   resendOtp,
//   getMe,
//   logout,
//   changePassword
// } = require("../controllers/auth.controller");

// const { protect } = require("../middlewares/auth.middleware");

// router.post("/register", register);
// router.post("/verify-otp", verifyOTP);
// router.post("/resend-otp", resendOtp);
// router.post("/login", login);

// router.get("/me", protect, getMe);
// router.post("/logout", logout);
// router.put("/change-password", protect, changePassword);

// module.exports = router;