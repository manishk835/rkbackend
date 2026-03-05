// routes/vendor.routes.js
const express = require("express");
const router = express.Router();

const {
  applyVendor,
  getAllApplications,
  updateApplicationStatus,
} = require("../controllers/vendor.controller");

const { adminAuth } = require("../middlewares/admin.middleware");

/* PUBLIC */
router.post("/apply", applyVendor);

/* ADMIN */
router.get("/", adminAuth, getAllApplications);

router.patch(
  "/:id/status",
  adminAuth,
  updateApplicationStatus
);

module.exports = router;