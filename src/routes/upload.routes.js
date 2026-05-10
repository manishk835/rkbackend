// src/routes/upload.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} = require("../controllers/upload.controller");

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
} = require("../middlewares/auth.middleware");

const upload = require(
  "../middlewares/upload.middleware"
);

/* ======================================================
   SINGLE IMAGE
====================================================== */

router.post(
  "/image",
  protect,
  upload.single("image"),
  uploadImage
);

/* ======================================================
   MULTIPLE IMAGES
====================================================== */

router.post(
  "/",
  protect,
  upload.array("images", 6),
  uploadMultipleImages
);

/* ======================================================
   DELETE IMAGE
====================================================== */

router.delete(
  "/",
  protect,
  deleteImage
);

module.exports = router;