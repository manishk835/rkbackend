// src/routes/bulk.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   MIDDLEWARES
====================================================== */

const upload = require(
  "../middlewares/csvUpload"
);

const {
  protect,
  requireRole,
  approvedSeller,
} = require(
  "../middlewares/auth.middleware"
);

/* ======================================================
   CONTROLLER
====================================================== */

const {
  bulkUpload,
} = require(
  "../controllers/bulk.controller"
);

/* ======================================================
   SELLER ACCESS
====================================================== */

const sellerAccess = [
  protect,
  requireRole("seller"),
  approvedSeller,
];

/* ======================================================
   ROUTES
====================================================== */

/*
POST
/api/bulk/products
*/

router.post(
  "/products",

  sellerAccess,

  upload.single("file"),

  bulkUpload
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;