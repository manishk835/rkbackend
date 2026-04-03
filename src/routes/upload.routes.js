// src/routes/upload.routes.js

const express = require("express");
const router = express.Router();

const { uploadImage } = require("../controllers/upload.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.post(
  "/image",
  protect,           // optional
  upload.single("image"),
  uploadImage
);

module.exports = router;

// const express = require("express");
// const router = express.Router();

// const { uploadImage } = require("../controllers/upload.controller");
// const upload = require("../middlewares/upload.middleware");

// // 🔥 IMPORTANT
// router.post("/", upload.single("image"), uploadImage);

// module.exports = router;