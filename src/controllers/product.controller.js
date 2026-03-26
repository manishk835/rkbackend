
// src/controllers/product.controller.js
const Product = require("../models/Product");
const Category = require("../models/Category");
/* ======================================================
   CREATE PRODUCT (SELLER)
====================================================== */

exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      price,
      subCategory,
      brand,
      description,
      variants,
      attributes,
      tags,
      images,
      thumbnail,
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (!title || !price || !description) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    if (!variants || variants.length === 0) {
      return res.status(400).json({
        message: "Variants required",
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "At least one image required",
      });
    }

    /* ================= USER BUSINESS TYPE ================= */

    const user = req.user;

    if (!user?.businessType) {
      return res.status(400).json({
        message: "Seller business type not set",
      });
    }

    const categoryDoc = await Category.findOne({
      slug: user.businessType,
    });

    if (!categoryDoc) {
      return res.status(400).json({
        message: "Invalid seller category",
      });
    }

    /* ================= ATTRIBUTE VALIDATION ================= */

    const categoryAttributes = categoryDoc.attributes || [];

    const productAttributes = {};
    const variantAttributesList = [];

    categoryAttributes.forEach((attr) => {
      if (attr.isVariant) {
        variantAttributesList.push(attr.name);
      } else {
        if (attr.isRequired && !attributes?.[attr.name]) {
          throw new Error(`${attr.displayName} is required`);
        }

        if (attributes?.[attr.name]) {
          productAttributes[attr.name] = attributes[attr.name];
        }
      }
    });

    /* ================= VARIANT VALIDATION ================= */

    variants.forEach((v) => {
      if (!v.sku) throw new Error("SKU required");

      variantAttributesList.forEach((attrName) => {
        if (!v.attributes || !v.attributes[attrName]) {
          throw new Error(`Variant missing ${attrName}`);
        }
      });
    });

    /* ================= SLUG ================= */

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");

    const slug = `${baseSlug}-${Date.now()}`;

    /* ================= STOCK ================= */

    let totalStock = 0;
    variants.forEach((v) => {
      totalStock += Number(v.stock) || 0;
    });

    /* ================= SKU CHECK ================= */

    const skus = variants.map((v) => v.sku);

    const existing = await Product.findOne({
      "variants.sku": { $in: skus },
    });

    if (existing) {
      return res.status(400).json({
        message: "SKU already exists",
      });
    }

    /* ================= CREATE ================= */

    const product = await Product.create({
      title,
      slug,
      price,

      category: user.businessType, // ✅ FINAL FIX

      subCategory: subCategory?.toLowerCase(),
      brand: brand?.toLowerCase(),
      description,

      attributes: productAttributes,
      variants,

      totalStock,
      thumbnail: thumbnail || images[0]?.url,
      images,
      tags,
      seller: req.user._id,
    });

    res.status(201).json({
      message: "Product created",
      product,
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    res.status(500).json({
      message: err.message,
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
   GET ALL PRODUCTS (PUBLIC) — FINAL PRODUCTION VERSION
   ====================================================== */
   exports.getProducts = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        sort,
        category,
        filter, // featured | new | best
      } = req.query;
  
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;
  
      /* ================= BASE QUERY ================= */
  
      const query = {
        isActive: true,
        isApproved: true,
      };
  
      /* ================= CATEGORY ================= */
  
      const isCategorySelected =
        category && category !== "all";
  
      if (isCategorySelected) {
        // strict + case insensitive match
        query.category = {
          $regex: new RegExp(`^${category}$`, "i"),
        };
      }
  
      /* ================= FILTER ================= */
  
      // 🔥 IMPORTANT: filter ONLY when NO category selected
      if (!isCategorySelected) {
        if (filter === "featured") query.isFeatured = true;
        if (filter === "new") query.isNewArrival = true;
        if (filter === "best") query.isBestSeller = true;
      }
  
      /* ================= SORT ================= */
  
      let sortQuery = { createdAt: -1 };
  
      if (sort === "price-low") sortQuery = { price: 1 };
      if (sort === "price-high") sortQuery = { price: -1 };
      if (sort === "az") sortQuery = { title: 1 };
  
      /* ================= FETCH ================= */
  
      const [products, total] = await Promise.all([
        Product.find(query)
          .select("-variants.sku")
          .sort(sortQuery)
          .skip(skip)
          .limit(limitNum)
          .lean(),
  
        Product.countDocuments(query),
      ]);
  
      /* ================= RESPONSE ================= */
  
      return res.json({
        success: true,
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
  
    } catch (error) {
      console.error("Get Products Error:", error);
  
      return res.status(500).json({
        success: false,
        products: [],
      });
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
        isApproved: true,
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
  
      // /* ================= SIZE ================= */
      // if (size) {
      //   const sizeArray = size.split(",");
      //   filter["variants.size"] = { $in: sizeArray };
      // }
  
      // /* ================= COLOR ================= */
      // if (color) {
      //   const colorArray = color.split(",");
      //   filter["variants.color"] = { $in: colorArray };
      // }
      if (req.query.attributes) {
        const attrs = JSON.parse(req.query.attributes);
      
        Object.keys(attrs).forEach((key) => {
          filter[`variants.attributes.${key}`] = {
            $in: attrs[key],
          };
        });
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
  
exports.getAllProducts = async (req, res) => {
  try {
    let {
      sort,
      brand,
      size,
      color,
      rating,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      filter, // featured | new | best
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 12;
    const skip = (page - 1) * limit;

    /* ================= BASE FILTER ================= */

    const query = {
      isActive: true,
      isApproved: true,
    };

    /* ================= FEATURE FILTER ================= */

    if (filter === "featured") query.isFeatured = true;
    if (filter === "new") query.isNewArrival = true;
    if (filter === "best") query.isBestSeller = true;

    /* ================= BRAND ================= */

    if (brand) {
      query.brand = { $in: brand.split(",") };
    }

    /* ================= SIZE ================= */

    if (size) {
      query["variants.size"] = { $in: size.split(",") };
    }

    /* ================= COLOR ================= */

    if (color) {
      query["variants.color"] = { $in: color.split(",") };
    }

    /* ================= RATING ================= */

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    /* ================= PRICE ================= */

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    /* ================= SORT ================= */

    let sortQuery = { createdAt: -1 };

    if (sort === "az") sortQuery = { title: 1 };
    if (sort === "price-low") sortQuery = { price: 1 };
    if (sort === "price-high") sortQuery = { price: -1 };
    if (sort === "rating") sortQuery = { rating: -1 };

    /* ================= FETCH ================= */

    const [products, total] = await Promise.all([
      Product.find(query)
        .select("-variants.sku")
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(query),
    ]);

    /* ================= FILTER DATA ================= */

    const baseMatch = {
      isActive: true,
      isApproved: true,
    };

    const brands = await Product.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const sizes = await Product.aggregate([
      { $match: baseMatch },
      { $unwind: "$variants" },
      { $group: { _id: "$variants.size", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const colors = await Product.aggregate([
      { $match: baseMatch },
      { $unwind: "$variants" },
      { $group: { _id: "$variants.color", count: { $sum: 1 } } },
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
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        brands,
        sizes,
        colors,
        ratings: [5, 4, 3, 2, 1],
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
      total: 0,
      filters: {},
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

/* ======================================================
   APPROVE PRODUCT (ADMIN)
====================================================== */
exports.approveProduct = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin only",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product approved",
      product,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
/* ======================================================
   GET MY PRODUCTS (SELLER)
====================================================== */
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET PENDING PRODUCTS (ADMIN)
====================================================== */
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isApproved: false,
    }).populate("seller", "name email");

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.toggleProductActive = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Not found" });

    product.isActive = !product.isActive;
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};