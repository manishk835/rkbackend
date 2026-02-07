// src/controllers/product.controller.js
const Product = require("../models/Product");

/* ======================================================
   CREATE PRODUCT (ADMIN)
   ====================================================== */
   exports.createProduct = async (req, res) => {
    try {
      const { variants } = req.body;
  
      /* ================= SKU VALIDATION ================= */
      if (variants && variants.length > 0) {
        const skus = variants.map((v) => v.sku);
  
        const duplicateSkus =
          skus.filter(
            (sku, i) => skus.indexOf(sku) !== i
          );
  
        if (duplicateSkus.length > 0) {
          return res.status(400).json({
            message: `Duplicate SKU found: ${[
              ...new Set(duplicateSkus),
            ].join(", ")}`,
          });
        }
  
        // 🔒 check SKU already exists in DB
        const existing = await Product.findOne({
          "variants.sku": { $in: skus },
        });
  
        if (existing) {
          return res.status(400).json({
            message:
              "One or more SKUs already exist in another product",
          });
        }
      }
  
      const product = await Product.create({
        ...req.body,
        category: req.body.category?.toLowerCase(),
        subCategory:
          req.body.subCategory?.toLowerCase(),
      });
  
      res.status(201).json(product);
    } catch (err) {
      console.error("CREATE PRODUCT ERROR:", err);
      res.status(500).json({
        message: err.message || "Product create failed",
      });
    }
  };

  /* ======================================================
   UPDATE PRODUCT (ADMIN)
   ====================================================== */
  exports.updateProduct = async (req, res) => {
    try {
      const { variants } = req.body;
  
      // SKU validation (same as create, but ignore current product)
      if (variants && variants.length > 0) {
        const skus = variants.map((v) => v.sku);
  
        const dup = skus.filter((s, i) => skus.indexOf(s) !== i);
        if (dup.length) {
          return res.status(400).json({
            message: `Duplicate SKU found: ${[
              ...new Set(dup),
            ].join(", ")}`,
          });
        }
  
        const existing = await Product.findOne({
          _id: { $ne: req.params.id },
          "variants.sku": { $in: skus },
        });
  
        if (existing) {
          return res.status(400).json({
            message:
              "One or more SKUs already exist in another product",
          });
        }
      }
  
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          category: req.body.category?.toLowerCase(),
          subCategory: req.body.subCategory?.toLowerCase(),
        },
        { new: true, runValidators: true }
      );
  
      if (!product) {
        return res.status(404).json({ message: "Not found" });
      }
  
      res.json(product);
    } catch (err) {
      console.error("UPDATE PRODUCT ERROR:", err);
      res.status(500).json({
        message: err.message || "Update failed",
      });
    }
  };
  
  
/* ======================================================
   GET ALL PRODUCTS (PUBLIC)
   ====================================================== */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json([]);
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

    return res.json(product);
  } catch (error) {
    console.error("Get Product By Slug Error:", error);
    return res.status(500).json({
      message: "Fetch failed",
    });
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

    return res.json(product);
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({
      message: "Fetch failed",
    });
  }
};

/* ======================================================
   GET PRODUCTS BY CATEGORY + SORTING
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
    let sortQuery = { createdAt: -1 };

    if (sort === "az") sortQuery = { title: 1 };
    if (sort === "price-low") sortQuery = { price: 1 };
    if (sort === "price-high") sortQuery = { price: -1 };
    if (sort === "newest") sortQuery = { createdAt: -1 };

    const products = await Product.find(filter).sort(sortQuery);

    return res.json(products);
  } catch (error) {
    console.error("Get Products By Category Error:", error);
    return res.status(500).json([]);
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

    return res.json(products);
  } catch (error) {
    console.error("Search Products Error:", error);
    return res.status(500).json([]);
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
//    GET PRODUCTS BY CATEGORY + SORTING
//    URL:
//    /api/products/category/men
//    /api/products/category/men?type=shirt
//    /api/products/category/men?sort=price-low
//    ====================================================== */
// exports.getProductsByCategory = async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { type, sort } = req.query;

//     /* ================= FILTER ================= */
//     const filter = {
//       category: category.toLowerCase(),
//     };

//     if (type) {
//       filter.subCategory = type.toLowerCase();
//     }

//     /* ================= SORT ================= */
//     let sortQuery = { createdAt: -1 }; // default

//     switch (sort) {
//       case "az":
//         sortQuery = { title: 1 };
//         break;

//       case "price-low":
//         sortQuery = { price: 1 };
//         break;

//       case "price-high":
//         sortQuery = { price: -1 };
//         break;

//       case "newest":
//         sortQuery = { createdAt: -1 };
//         break;

//       default:
//         sortQuery = { createdAt: -1 };
//     }

//     const products = await Product.find(filter).sort(sortQuery);

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

