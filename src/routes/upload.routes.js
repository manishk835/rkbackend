const express = require("express");
const router = express.Router();

const { uploadImage } = require("../controllers/upload.controller");
const upload = require("../middlewares/upload.middleware");

// 🔥 IMPORTANT
router.post("/", upload.single("image"), uploadImage);

module.exports = router;