// src/routes/category.routes.js

const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  updateCategory,
} = require("../controllers/category.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* PUBLIC */
router.get("/", getCategories);

/* ADMIN */
router.post("/", adminAuth, createCategory);
router.put("/:id", adminAuth, updateCategory);

module.exports = router;
