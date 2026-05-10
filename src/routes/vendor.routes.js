// src/routes/vendor.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  applyVendor,

  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} = require("../controllers/vendor.controller");

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
} = require("../middlewares/auth.middleware");

const {
  adminAuth,
} = require("../middlewares/admin.middleware");

/* ======================================================
   PUBLIC / USER ROUTES
====================================================== */

/* APPLY AS SELLER */
router.post(
  "/apply",
  protect,
  applyVendor
);

/* ======================================================
   ADMIN ROUTES
====================================================== */

/* GET ALL APPLICATIONS */
router.get(
  "/",
  adminAuth,
  getAllApplications
);

/* GET SINGLE APPLICATION */
router.get(
  "/:id",
  adminAuth,
  getApplicationById
);

/* UPDATE STATUS */
router.patch(
  "/:id/status",
  adminAuth,
  updateApplicationStatus
);

/* DELETE APPLICATION */
router.delete(
  "/:id",
  adminAuth,
  deleteApplication
);

module.exports = router;