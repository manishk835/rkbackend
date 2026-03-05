const express = require("express");
const router = express.Router();

const {
  createWithdrawal,
  getSellerWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllWithdrawals,
} = require("../controllers/withdrawal.controller");

const { sellerAuth } = require("../middlewares/auth.middleware");
const { sellerOnly } = require("../middlewares/seller.middleware");
const { adminAuth } = require("../middlewares/admin.middleware");

/* ================= SELLER ================= */

router.post("/", sellerAuth, sellerOnly, createWithdrawal);

router.get("/my", sellerAuth, sellerOnly, getSellerWithdrawals);

/* ================= ADMIN ================= */

router.get("/admin", adminAuth, getAllWithdrawals);

router.patch("/admin/:id/approve", adminAuth, approveWithdrawal);

router.patch("/admin/:id/reject", adminAuth, rejectWithdrawal);

module.exports = router;