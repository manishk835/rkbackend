const express = require("express");
const { generateDescription } = require("../controllers/ai.controller");

const router = express.Router();

router.post("/generate-description", generateDescription);

module.exports = router;