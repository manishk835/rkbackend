// src/routes/admin.routes.js

const express = require("express");
const router = express.Router();

const {
  adminLogin,
  adminLogout,
  // getPendingSellers,
  // approveSeller,
  // rejectSeller,
} = require("../controllers/admin.controller");

// 🔥 IMPORTANT — NEW ADMIN MIDDLEWARE
const { adminAuth } = require("../middlewares/admin.middleware");

/* ================= ADMIN AUTH ================= */

// Login (no auth)
router.post("/login", adminLogin);

// Logout (protected)
router.post("/logout", adminAuth, adminLogout);

/* ================= SELLER APPROVAL ================= */

// router.get("/sellers/pending", adminAuth, getPendingSellers);
// router.put("/sellers/:id/approve", adminAuth, approveSeller);
// router.put("/sellers/:id/reject", adminAuth, rejectSeller);

/* ================= ADMIN SESSION CHECK ================= */

router.get("/me", adminAuth, (req, res) => {
  res.json({
    message: "Admin authorized",
    admin: req.user,
  });
});

module.exports = router;