// src/routes/upload.routes.js

const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const { adminAuth } = require("../middlewares/admin.middleware");

router.post(
  "/image",
  adminAuth,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    res.json({
      url: req.file.path,          // Cloudinary URL
      publicId: req.file.filename, // Cloudinary public_id
    });
  }
);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const { uploadImage } = require("../controllers/upload.controller");
// const { adminAuth } = require("../middlewares/admin.middleware")

// const upload = multer({ dest: "uploads/" });

// router.post(
//   "/image",
//   adminAuth,
//   upload.single("image"),
//   uploadImage
// );

// module.exports = router;
