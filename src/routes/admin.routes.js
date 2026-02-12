// src/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const {
  adminLogin,
  adminLogout,
} = require("../controllers/admin.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* ================= ADMIN AUTH ================= */
router.post("/login", adminLogin);
router.post("/logout", adminAuth, adminLogout);

/* ================= TEST PROTECTED ================= */
router.get("/me", adminAuth, (req, res) => {
  res.json({
    message: "Admin authorized",
    admin: req.user,
  });
});

module.exports = router;
