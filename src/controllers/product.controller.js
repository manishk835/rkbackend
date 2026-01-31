// src/controllers/product.controller.js
const Product = require("../models/Product");

/* ======================================================
   CREATE PRODUCT (ADMIN)
   ====================================================== */
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      category: req.body.category?.toLowerCase(),
      subCategory: req.body.subCategory?.toLowerCase(),
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Product create failed" });
  }
};

/* ======================================================
   GET ALL PRODUCTS (PUBLIC)
   ====================================================== */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

/* ======================================================
   GET PRODUCT BY SLUG
   ====================================================== */
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/* ======================================================
   GET PRODUCT BY ID
   ====================================================== */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/* ======================================================
   GET PRODUCTS BY CATEGORY + SORTING
   URL:
   /api/products/category/men
   /api/products/category/men?type=shirt
   /api/products/category/men?sort=price-low
   ====================================================== */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { type, sort } = req.query;

    /* ================= FILTER ================= */
    const filter = {
      category: category.toLowerCase(),
    };

    if (type) {
      filter.subCategory = type.toLowerCase();
    }

    /* ================= SORT ================= */
    let sortQuery = { createdAt: -1 }; // default

    switch (sort) {
      case "az":
        sortQuery = { title: 1 };
        break;

      case "price-low":
        sortQuery = { price: 1 };
        break;

      case "price-high":
        sortQuery = { price: -1 };
        break;

      case "newest":
        sortQuery = { createdAt: -1 };
        break;

      default:
        sortQuery = { createdAt: -1 };
    }

    const products = await Product.find(filter).sort(sortQuery);

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

/* ======================================================
   SEARCH PRODUCTS
   ====================================================== */
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q || "";

    const products = await Product.find({
      title: { $regex: q, $options: "i" },
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json([]);
  }
};


// // src/controllers/product.controller.js
// const Product = require("../models/Product");

// /* ======================================================
//    CREATE PRODUCT (ADMIN)
//    ====================================================== */
// exports.createProduct = async (req, res) => {
//   try {
//     const product = await Product.create({
//       ...req.body,
//       category: req.body.category?.toLowerCase(),
//       subCategory: req.body.subCategory?.toLowerCase(),
//     });

//     res.status(201).json(product);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Product create failed" });
//   }
// };

// /* ======================================================
//    GET ALL PRODUCTS (PUBLIC)
//    ====================================================== */
// exports.getProducts = async (req, res) => {
//   try {
//     const products = await Product.find().sort({ createdAt: -1 });
//     // ✅ always array
//     res.json(products);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json([]);
//   }
// };

// /* ======================================================
//    GET PRODUCT BY SLUG
//    ====================================================== */
// exports.getProductBySlug = async (req, res) => {
//   try {
//     const product = await Product.findOne({
//       slug: req.params.slug,
//     });

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

// /* ======================================================
//    GET PRODUCT BY ID
//    ====================================================== */
// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

// /* ======================================================
//    CATEGORY + SUBCATEGORY
//    URL:
//    /api/products/category/men
//    /api/products/category/men?type=kurta
//    ====================================================== */
// exports.getProductsByCategory = async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { type } = req.query;

//     const filter = {
//       category: category.toLowerCase(),
//     };

//     // ✅ THIS FIXES "Men → Kurta shows Shirts"
//     if (type) {
//       filter.subCategory = type.toLowerCase();
//     }

//     const products = await Product.find(filter).sort({
//       createdAt: -1,
//     });

//     res.json(products);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json([]);
//   }
// };

// /* ======================================================
//    SEARCH PRODUCTS
//    ====================================================== */
// exports.searchProducts = async (req, res) => {
//   try {
//     const q = req.query.q || "";

//     const products = await Product.find({
//       title: { $regex: q, $options: "i" },
//     }).sort({ createdAt: -1 });

//     res.json(products);
//   } catch (err) {
//     res.status(500).json([]);
//   }
// };
