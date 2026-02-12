// src/controllers/product.controller.js
const Product = require("../models/Product");

/* ======================================================
   CREATE PRODUCT (ADMIN)
   ====================================================== */
 /* ======================================================
   CREATE PRODUCT (ADMIN - PRODUCTION READY)
====================================================== */
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      price,
      category,
      subCategory,
      brand,
      description,
      variants = [],
      thumbnail,
      images = [],
      tags = [],
      isActive = true,
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (!title || !price || !category || !thumbnail) {
      return res.status(400).json({
        message: "Title, price, category and thumbnail are required",
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        message: "At least one variant is required",
      });
    }

    /* ================= SANITIZE INPUT ================= */

    const cleanTitle = title.trim();
    const cleanCategory = category.trim().toLowerCase();
    const cleanSubCategory = subCategory?.trim().toLowerCase();
    const cleanBrand = brand?.trim().toLowerCase();

    /* ================= SLUG GENERATION ================= */

    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const slugExists = await Product.findOne({ slug });

    if (slugExists) {
      return res.status(400).json({
        message: "Product with similar title already exists",
      });
    }

    /* ================= SKU VALIDATION ================= */

    const skus = variants.map((v) => v.sku);

    const duplicateSkus = skus.filter(
      (sku, i) => skus.indexOf(sku) !== i
    );

    if (duplicateSkus.length > 0) {
      return res.status(400).json({
        message: `Duplicate SKU found: ${[
          ...new Set(duplicateSkus),
        ].join(", ")}`,
      });
    }

    const existingSku = await Product.findOne({
      "variants.sku": { $in: skus },
    });

    if (existingSku) {
      return res.status(400).json({
        message: "One or more SKUs already exist in another product",
      });
    }

    /* ================= VARIANT VALIDATION ================= */

    let totalStock = 0;

    const cleanVariants = variants.map((variant) => {
      if (!variant.size || !variant.color || !variant.sku) {
        throw new Error("Variant size, color and sku are required");
      }

      if (variant.stock < 0) {
        throw new Error("Stock cannot be negative");
      }

      totalStock += variant.stock || 0;

      return {
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        stock: variant.stock || 0,
      };
    });

    /* ================= CREATE PRODUCT ================= */

    const product = await Product.create({
      title: cleanTitle,
      slug,
      price,
      category: cleanCategory,
      subCategory: cleanSubCategory,
      brand: cleanBrand,
      description,
      variants: cleanVariants,
      totalStock,
      thumbnail,
      images,
      tags,
      isActive,
    });

    /* ================= SAFE RESPONSE ================= */

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);

    if (err.message) {
      return res.status(400).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Product creation failed",
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
      const { page = 1, limit = 12, sort } = req.query;
  
      const skip = (Number(page) - 1) * Number(limit);
  
      let sortQuery = { createdAt: -1 };
      if (sort === "price-low") sortQuery = { price: 1 };
      if (sort === "price-high") sortQuery = { price: -1 };
      if (sort === "az") sortQuery = { title: 1 };
  
      const [products, total] = await Promise.all([
        Product.find({ isActive: true })
          .select("-variants.sku") // hide internal SKU
          .sort(sortQuery)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Product.countDocuments({ isActive: true }),
      ]);
  
      return res.json({
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
  
    } catch (error) {
      console.error("Get Products Error:", error);
      return res.status(500).json({ products: [] });
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
   GET PRODUCTS BY CATEGORY + FILTERS 
   ====================================================== */
   exports.getProductsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const {
        type,
        sort,
        brand,
        size,
        color,
        minPrice,
        maxPrice,
        rating,
      } = req.query;
  
      /* ================= BASE FILTER ================= */
      const filter = {
        category: category.toLowerCase(),
        isActive: true,
      };
  
      /* ================= SUB CATEGORY ================= */
      if (type) {
        const typesArray = type.split(",");
        filter.subCategory = { $in: typesArray };
      }
  
      /* ================= BRAND ================= */
      if (brand) {
        const brandsArray = brand.split(",");
        filter.brand = { $in: brandsArray };
      }
  
      /* ================= SIZE ================= */
      if (size) {
        const sizeArray = size.split(",");
        filter["variants.size"] = { $in: sizeArray };
      }
  
      /* ================= COLOR ================= */
      if (color) {
        const colorArray = color.split(",");
        filter["variants.color"] = { $in: colorArray };
      }
  
      /* ================= PRICE ================= */
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice)
          filter.price.$gte = Number(minPrice);
        if (maxPrice)
          filter.price.$lte = Number(maxPrice);
      }
  
      /* ================= RATING ================= */
      if (rating) {
        filter.rating = { $gte: Number(rating) };
      }
  
      /* ================= SORT ================= */
      let sortQuery = { createdAt: -1 };
  
      if (sort === "az") sortQuery = { title: 1 };
      if (sort === "price-low") sortQuery = { price: 1 };
      if (sort === "price-high") sortQuery = { price: -1 };
      if (sort === "newest") sortQuery = { createdAt: -1 };
      if (sort === "rating") sortQuery = { rating: -1 };
  
      /* ================= PRODUCTS ================= */
      const products = await Product.find(filter).sort(
        sortQuery
      );
  
      /* =================================================
         FILTER DATA (WITH COUNTS)
         ================================================= */
  
      const baseMatch = {
        category: category.toLowerCase(),
        isActive: true,
      };
  
      const brands = await Product.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$brand",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
  
      const subCategories = await Product.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$subCategory",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
  
      const sizes = await Product.aggregate([
        { $match: baseMatch },
        { $unwind: "$variants" },
        {
          $group: {
            _id: "$variants.size",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
  
      const colors = await Product.aggregate([
        { $match: baseMatch },
        { $unwind: "$variants" },
        {
          $group: {
            _id: "$variants.color",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
  
      const priceAgg = await Product.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]);
  
      return res.json({
        products,
        filters: {
          brands,        // [{ _id: "rk fashion", count: 12 }]
          subCategories, // [{ _id: "kurta", count: 8 }]
          sizes,         // [{ _id: "M", count: 15 }]
          colors,        // [{ _id: "black", count: 10 }]
          ratings: [4, 3, 2, 1], // frontend use kare
          priceRange:
            priceAgg[0] || {
              minPrice: 0,
              maxPrice: 0,
            },
        },
      });
    } catch (error) {
      console.error(
        "Get Products By Category Error:",
        error
      );
      return res.status(500).json({
        products: [],
        filters: {
          brands: [],
          subCategories: [],
          sizes: [],
          colors: [],
          ratings: [],
          priceRange: {
            minPrice: 0,
            maxPrice: 0,
          },
        },
      });
    }
  };
  
  
  

/* ======================================================
   SEARCH PRODUCTS (PUBLIC)
   ====================================================== */
   exports.searchProducts = async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
  
      if (!q) return res.json([]);
  
      const products = await Product.find({
        isActive: true,
        $text: { $search: q },
      })
        .select("title slug price thumbnail rating")
        .limit(20)
        .lean();
  
      return res.json(products);
  
    } catch (error) {
      console.error("Search Products Error:", error);
      return res.status(500).json([]);
    }
  };
  

/* ======================================================
   GET ALL PRODUCTS (WITH FILTERS)
   ====================================================== */
exports.getAllProducts = async (req, res) => {
  try {
    const {
      sort,
      brand,
      size,
      color,
      rating,
      minPrice,
      maxPrice,
    } = req.query;

    /* ================= BASE FILTER ================= */
    const filter = {
      isActive: true,
    };

    if (brand) {
      filter.brand = { $in: brand.split(",") };
    }

    if (size) {
      filter["variants.size"] = {
        $in: size.split(","),
      };
    }

    if (color) {
      filter["variants.color"] = {
        $in: color.split(","),
      };
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice)
        filter.price.$gte = Number(minPrice);
      if (maxPrice)
        filter.price.$lte = Number(maxPrice);
    }

    /* ================= SORT ================= */
    let sortQuery = { createdAt: -1 };

    if (sort === "az") sortQuery = { title: 1 };
    if (sort === "price-low")
      sortQuery = { price: 1 };
    if (sort === "price-high")
      sortQuery = { price: -1 };
    if (sort === "newest")
      sortQuery = { createdAt: -1 };

    /* ================= PRODUCTS ================= */
    const products = await Product.find(filter).sort(
      sortQuery
    );

    /* ================= FILTER DATA ================= */

    const brands = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const subCategories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$subCategory",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const sizes = await Product.aggregate([
      { $unwind: "$variants" },
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$variants.size",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const colors = await Product.aggregate([
      { $unwind: "$variants" },
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$variants.color",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const ratings = [5, 4, 3, 2, 1];

    const priceAgg = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    return res.json({
      products,
      filters: {
        brands,
        subCategories,
        sizes,
        colors,
        ratings,
        priceRange:
          priceAgg[0] || {
            minPrice: 0,
            maxPrice: 0,
          },
      },
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    return res.status(500).json({
      products: [],
      filters: {
        brands: [],
        subCategories: [],
        sizes: [],
        colors: [],
        ratings: [],
        priceRange: { minPrice: 0, maxPrice: 0 },
      },
    });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      totalStock: { $lte: 5 },
      isActive: true,
    }).select("title totalStock");

    res.json(products);
  } catch (err) {
    console.error("Low stock error", err);
    res.status(500).json([]);
  }
};
