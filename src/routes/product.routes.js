// src/routes/product.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  /* PUBLIC */
  getProducts,
  getAllProducts,
  getProductBySlug,
  getProductById,
  searchProducts,
  getProductsByCategory,

  /* SELLER */
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  toggleProductActive,

  /* ADMIN */
  approveProduct,
  getPendingProducts,
  getLowStockProducts,
  getAllProductsAdmin,
} = require("../controllers/product.controller");

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
  requireRole,
  approvedSeller,
} = require("../middlewares/auth.middleware");

const {
  adminAuth,
} = require("../middlewares/admin.middleware");

const upload = require("../middlewares/upload.middleware");

/* ======================================================
   SELLER ACCESS
====================================================== */

const sellerAccess = [
  protect,
  requireRole("seller"),
  approvedSeller,
];

/* ======================================================
   PUBLIC ROUTES
====================================================== */

/* PRODUCTS */
router.get(
  "/",
  getProducts
);

/* ALL PRODUCTS */
router.get(
  "/all",
  getAllProducts
);

/* SEARCH */
router.get(
  "/search",
  searchProducts
);

/* CATEGORY PRODUCTS */
router.get(
  "/category/:category",
  getProductsByCategory
);

/* PRODUCT BY SLUG */
router.get(
  "/slug/:slug",
  getProductBySlug
);

/* PRODUCT BY ID */
router.get(
  "/id/:id",
  getProductById
);

/* ======================================================
   SELLER ROUTES
====================================================== */

/* CREATE PRODUCT */
router.post(
  "/seller/create",
  sellerAccess,
  upload.array("images", 6),
  createProduct
);

/* MY PRODUCTS */
router.get(
  "/seller/my-products",
  sellerAccess,
  getMyProducts
);

/* UPDATE PRODUCT */
router.put(
  "/seller/update/:id",
  sellerAccess,
  upload.array("images", 6),
  updateProduct
);

/* TOGGLE ACTIVE */
router.patch(
  "/seller/toggle/:id",
  sellerAccess,
  toggleProductActive
);

/* DELETE PRODUCT */
router.delete(
  "/seller/delete/:id",
  sellerAccess,
  deleteProduct
);

/* ======================================================
   ADMIN ROUTES
====================================================== */

/* GET ALL PRODUCTS ADMIN */
router.get(
  "/admin/all",
  adminAuth,
  getAllProductsAdmin
);

/* APPROVE PRODUCT */
router.put(
  "/admin/approve/:id",
  adminAuth,
  approveProduct
);

/* PENDING PRODUCTS */
router.get(
  "/admin/pending",
  adminAuth,
  getPendingProducts
);

/* LOW STOCK */
router.get(
  "/admin/low-stock",
  adminAuth,
  getLowStockProducts
);

/* ADMIN UPDATE PRODUCT */
router.put(
  "/admin/update/:id",
  adminAuth,
  upload.array("images", 6),
  updateProduct
);

module.exports = router;