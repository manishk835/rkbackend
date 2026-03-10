// routes/vendor.routes.js

const express = require("express");
const router = express.Router();

const {
  applyVendor,
  getAllApplications,
  updateApplicationStatus,
} = require("../controllers/vendor.controller");

const { adminAuth } = require("../middlewares/admin.middleware");

/* ======================================================
   PUBLIC ROUTES
====================================================== */

/*
POST
/api/vendors/apply

Vendor application submit
*/
router.post("/apply", applyVendor);


/* ======================================================
   ADMIN ROUTES
====================================================== */

/*
GET
/api/vendors

Get all vendor applications
*/
router.get("/", adminAuth, getAllApplications);


/*
PATCH
/api/vendors/:id/status

Approve / Reject vendor application
*/
router.patch(
  "/:id/status",
  adminAuth,
  updateApplicationStatus
);

module.exports = router;