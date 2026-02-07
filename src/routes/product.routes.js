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
  updateProduct, // ✅ IMPORT ADDED
} = require("../controllers/product.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* ======================================================
   PUBLIC ROUTES
   ====================================================== */
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/slug/:slug", getProductBySlug);
router.get("/id/:id", getProductById);

/* ======================================================
   ADMIN ROUTES
   ====================================================== */
router.post("/", adminAuth, createProduct);
router.put("/:id", adminAuth, updateProduct);

module.exports = router;
