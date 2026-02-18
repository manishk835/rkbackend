// src/routes/product.routes.js

const express = require("express");
const router = express.Router();

const {
  /* SELLER */
  createProduct,
  getMyProducts,

  /* ADMIN */
  approveProduct,
  getPendingProducts,
  updateProduct,
  getLowStockProducts,

  /* PUBLIC */
  getProducts,
  getAllProducts,
  getProductBySlug,
  getProductById,
  searchProducts,
  getProductsByCategory,
} = require("../controllers/product.controller");

const {
  protect,
  adminAuth,
} = require("../middlewares/auth.middleware");

/* ======================================================
   PUBLIC ROUTES (CUSTOMER SIDE)
====================================================== */

// Homepage / general listing
router.get("/", getProducts);

// All products with filters
router.get("/all", getAllProducts);

// Search
router.get("/search", searchProducts);

// Category filter
router.get("/category/:category", getProductsByCategory);

// Product detail
router.get("/slug/:slug", getProductBySlug);
router.get("/id/:id", getProductById);

/* ======================================================
   SELLER ROUTES
====================================================== */

// Create product (seller submits)
router.post("/seller/create", protect, createProduct);

// Seller dashboard → My products
router.get("/seller/my-products", protect, getMyProducts);

/* ======================================================
   ADMIN ROUTES
====================================================== */

// Approve product
router.put(
  "/admin/approve/:id",
  adminAuth,
  approveProduct
);

// Get pending products
router.get(
  "/admin/pending",
  adminAuth,
  getPendingProducts
);

// Update product (admin full control)
router.put(
  "/admin/update/:id",
  adminAuth,
  updateProduct
);

// Low stock alert
router.get(
  "/admin/low-stock",
  adminAuth,
  getLowStockProducts
);

module.exports = router;
