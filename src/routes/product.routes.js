const express = require("express");
const router = express.Router();
const {
    createProduct,
    getProducts,
    deleteProduct,
    searchProducts,
    getProductsByCategory,
  } = require("../controllers/product.controller");
  
  

const { adminAuth } = require("../middlewares/auth.middleware");


// PUBLIC
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/", getProducts);

// ADMIN
router.post("/", adminAuth, createProduct);
router.delete("/:id", adminAuth, deleteProduct);



module.exports = router;
