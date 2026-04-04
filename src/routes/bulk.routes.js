const express = require("express");
const upload = require("../middlewares/csvUpload"); // ✅ CHANGE
const { bulkUpload } = require("../controllers/bulk.controller");

const router = express.Router();

router.post("/products", upload.single("file"), bulkUpload);

module.exports = router;