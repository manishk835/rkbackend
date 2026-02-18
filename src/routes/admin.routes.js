// src/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const {
  adminLogin,
  adminLogout,
  getPendingSellers,
  approveSeller,
  rejectSeller,
} = require("../controllers/admin.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* ================= ADMIN AUTH ================= */
router.post("/login", adminLogin);
router.post("/logout", adminAuth, adminLogout);

router.get("/sellers/pending", adminAuth, getPendingSellers);
router.put("/sellers/:id/approve", adminAuth, approveSeller);
router.put("/sellers/:id/reject", adminAuth, rejectSeller);

/* ================= TEST PROTECTED ================= */
router.get("/me", adminAuth, (req, res) => {
  res.json({
    message: "Admin authorized",
    admin: req.user,
  });
});

module.exports = router;
