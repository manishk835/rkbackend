// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { adminLogin } = require("../controllers/auth.controller");

router.post("/login", adminLogin);

module.exports = router;
