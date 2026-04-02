const express = require("express");
const router = express.Router();

const {
  createWithdrawal,
  getSellerWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllWithdrawals,
} = require("../controllers/withdrawal.controller");

const { sellerOnly } = require("../middlewares/auth.middleware");
const { adminAuth } = require("../middlewares/admin.middleware");

/* ======================================================
   🧑 SELLER ROUTES
====================================================== */

// ➤ request withdrawal
router.post("/", sellerOnly, createWithdrawal);

// ➤ seller withdrawal history
router.get("/my", sellerOnly, getSellerWithdrawals);

/* ======================================================
   🛠 ADMIN ROUTES
====================================================== */

// ➤ get all pending withdrawals
router.get("/", adminAuth, getAllWithdrawals);

// ➤ approve withdrawal
router.patch("/:id/approve", adminAuth, approveWithdrawal);

// ➤ reject withdrawal
router.patch("/:id/reject", adminAuth, rejectWithdrawal);

module.exports = router;