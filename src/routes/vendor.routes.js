// routes/vendor.routes.js
const express = require("express");
const router = express.Router();

const {
  applyVendor,
  getAllApplications,
  updateApplicationStatus,
} = require("../controllers/vendor.controller");

const { adminAuth } = require("../middlewares/admin.middleware");
const { protect } = require("../middlewares/auth.middleware"); // ✅ ADD THIS

/* ======================================================
   PUBLIC ROUTES
====================================================== */

/*
POST
/api/vendors/apply
*/
router.post("/apply", protect, applyVendor); // ✅ FIX HERE


/* ======================================================
   ADMIN ROUTES
====================================================== */

router.get("/", adminAuth, getAllApplications);

router.patch(
  "/:id/status",
  adminAuth,
  updateApplicationStatus
);

module.exports = router;