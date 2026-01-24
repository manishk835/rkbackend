const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const { uploadImage } = require("../controllers/upload.controller");

router.post("/", upload.single("image"), uploadImage);

module.exports = router;
