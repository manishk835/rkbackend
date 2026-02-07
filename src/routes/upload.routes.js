const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadImage } = require("../controllers/upload.controller");
const { adminAuth } = require("../middlewares/auth.middleware");

const upload = multer({ dest: "uploads/" });

router.post(
  "/image",
  adminAuth,
  upload.single("image"),
  uploadImage
);

module.exports = router;
