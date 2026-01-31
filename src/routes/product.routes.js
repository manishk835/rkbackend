// src/routes/product.routes.js
const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductById,
  searchProducts,
  getProductsByCategory,
} = require("../controllers/product.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

// PUBLIC
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/id/:id", getProductById);
router.get("/category/:category", getProductsByCategory);

// ADMIN
router.post("/", adminAuth, createProduct);

module.exports = router;
