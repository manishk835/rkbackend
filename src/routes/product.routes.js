const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getAllProducts,
  getProductBySlug,
  getProductById,
  searchProducts,
  getProductsByCategory,
  updateProduct,
  getLowStockProducts, // ✅ LOW STOCK
} = require("../controllers/product.controller");

const { adminAuth } = require("../middlewares/auth.middleware");

/* ======================================================
   PUBLIC ROUTES
   ====================================================== */

// Get products (homepage / general)
router.get("/", getProducts);

// Get all products (admin / full list if needed)
router.get("/all", getAllProducts);

// Search products
router.get("/search", searchProducts);

// Products by category + filters
router.get("/category/:category", getProductsByCategory);

// Product detail by slug
router.get("/slug/:slug", getProductBySlug);

// Product detail by id
router.get("/id/:id", getProductById);

/* ======================================================
   ADMIN ROUTES
   ====================================================== */

// Create product
router.post("/", adminAuth, createProduct);

// Update product
router.put("/:id", adminAuth, updateProduct);

// Low stock products (ADMIN)
router.get(
  "/admin/low-stock",
  adminAuth,
  getLowStockProducts
);

module.exports = router;
