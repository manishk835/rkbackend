// src/controllers/product.controller.js

const Product = require("../models/Product");
const Category = require("../models/Category");
const slugify = require("slugify");

/* ======================================================
   CREATE PRODUCT
====================================================== */

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      title,
      price,
      category,
      subCategory,
      description,
      shortDescription,
      variants = [],
      attributes = {},
      images = [],
      thumbnail,
      brand,
    } = req.body;

    /* ================= NORMALIZE ================= */

    const productTitle = (title || name || "").trim();

    /* ================= VALIDATION ================= */

    if (!productTitle || !price || !category) {
      return res.status(400).json({
        message: "Title, price, category required",
      });
    }

    if (!variants.length) {
      return res.status(400).json({
        message: "At least one variant required",
      });
    }

    if (!images.length) {
      return res.status(400).json({
        message: "Images required",
      });
    }

    /* ================= CATEGORY ================= */

    const categoryDoc = await Category.findOne({
      slug: category.toLowerCase(),
    });

    if (!categoryDoc) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    /* ================= SKU VALIDATION ================= */

    const skus = variants
      .map((v) => v.sku)
      .filter(Boolean);

    const duplicate = skus.filter(
      (s, i) => skus.indexOf(s) !== i
    );

    if (duplicate.length) {
      return res.status(400).json({
        message: `Duplicate SKU: ${[
          ...new Set(duplicate),
        ].join(", ")}`,
      });
    }

    const existingSku = await Product.findOne({
      "variants.sku": { $in: skus },
    });

    if (existingSku) {
      return res.status(400).json({
        message: "SKU already exists",
      });
    }

    /* ================= STOCK ================= */

    const totalStock = variants.reduce(
      (acc, v) => acc + (Number(v.stock) || 0),
      0
    );

    /* ================= SLUG ================= */

    const baseSlug = slugify(productTitle, {
      lower: true,
      strict: true,
      trim: true,
    });

    const slug = `${baseSlug}-${Date.now()}`;

    /* ================= CREATE ================= */

    const product = await Product.create({
      title: productTitle,
      name: productTitle,

      slug,

      description,
      shortDescription,

      price: Number(price),

      category: category.toLowerCase(),
      subCategory: subCategory?.toLowerCase(),

      brand,

      attributes,
      variants,

      totalStock,

      thumbnail:
        thumbnail ||
        images?.[0]?.url ||
        images?.[0],

      images,

      seller: req.user._id,
    });

    return res.status(201).json({
      message: "Product created",
      product,
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);

    return res.status(500).json({
      message: err.message || "Create failed",
    });
  }
};

/* ======================================================
   UPDATE PRODUCT
====================================================== */

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { variants = [] } = req.body;

    /* ================= SKU VALIDATION ================= */

    if (variants.length) {

      const skus = variants
        .map((v) => v.sku)
        .filter(Boolean);

      const duplicate = skus.filter(
        (s, i) => skus.indexOf(s) !== i
      );

      if (duplicate.length) {
        return res.status(400).json({
          message: `Duplicate SKU: ${[
            ...new Set(duplicate),
          ].join(", ")}`,
        });
      }

      const existing = await Product.findOne({
        _id: { $ne: id },
        "variants.sku": { $in: skus },
      });

      if (existing) {
        return res.status(400).json({
          message: "SKU already exists",
        });
      }
    }

    /* ================= STOCK ================= */

    const totalStock = variants.reduce(
      (acc, v) => acc + (Number(v.stock) || 0),
      0
    );

    /* ================= UPDATE ================= */

    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        seller: req.user._id,
      },
      {
        ...req.body,

        category: req.body.category?.toLowerCase(),
        subCategory:
          req.body.subCategory?.toLowerCase(),

        totalStock,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found or unauthorized",
      });
    }

    return res.json({
      message: "Product updated",
      product,
    });

  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);

    return res.status(500).json({
      message: err.message || "Update failed",
    });
  }
};

/* ======================================================
   GET PRODUCTS
====================================================== */

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort,
      category,
      filter,
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const skip =
      (pageNum - 1) * limitNum;

    /* ================= QUERY ================= */

    const query = {
      isActive: true,
      isApproved: true,
      isDeleted: false,
    };

    const isCategorySelected =
      category && category !== "all";

    if (isCategorySelected) {
      query.category = {
        $regex: new RegExp(
          `^${category}$`,
          "i"
        ),
      };
    }

    if (!isCategorySelected) {
      if (filter === "featured") {
        query.isFeatured = true;
      }

      if (filter === "new") {
        query.isNewArrival = true;
      }

      if (filter === "best") {
        query.isBestSeller = true;
      }
    }

    /* ================= SORT ================= */

    let sortQuery = {
      createdAt: -1,
    };

    if (sort === "price-low") {
      sortQuery = { price: 1 };
    }

    if (sort === "price-high") {
      sortQuery = { price: -1 };
    }

    if (sort === "az") {
      sortQuery = {
        title: 1,
        name: 1,
      };
    }

    /* ================= FETCH ================= */

    const [products, total] =
      await Promise.all([
        Product.find(query)
          .select(
            "-variants.sku -__v"
          )
          .sort(sortQuery)
          .skip(skip)
          .limit(limitNum)
          .lean(),

        Product.countDocuments(query),
      ]);

    return res.json({
      success: true,

      products,

      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(
          total / limitNum
        ),
      },
    });

  } catch (error) {
    console.error(
      "Get Products Error:",
      error
    );

    return res.status(500).json({
      success: false,
      products: [],
    });
  }
};

/* ======================================================
   GET PRODUCT BY SLUG
====================================================== */

exports.getProductBySlug = async (
  req,
  res
) => {
  try {

    const product =
      await Product.findOne({
        slug: req.params.slug,
        isDeleted: false,
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json(product);

  } catch (error) {

    console.error(
      "Get Product By Slug Error:",
      error
    );

    return res.status(500).json({
      message: "Fetch failed",
    });
  }
};

/* ======================================================
   GET PRODUCT BY ID
====================================================== */

exports.getProductById = async (
  req,
  res
) => {
  try {

    const product =
      await Product.findById(
        req.params.id
      ).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json({
      product,
    });

  } catch (err) {

    return res.status(500).json({
      message: "Fetch failed",
    });
  }
};

/* ======================================================
   GET PRODUCTS BY CATEGORY
====================================================== */

exports.getProductsByCategory =
  async (req, res) => {
    try {

      const { category } = req.params;

      const {
        type,
        sort,
        brand,
        minPrice,
        maxPrice,
        rating,
      } = req.query;

      /* ================= FILTER ================= */

      const filter = {
        category: category.toLowerCase(),

        isActive: true,
        isApproved: true,
        isDeleted: false,
      };

      if (type) {
        filter.subCategory = {
          $in: type.split(","),
        };
      }

      if (brand) {
        filter.brand = {
          $in: brand.split(","),
        };
      }

      if (req.query.attributes) {

        const attrs = JSON.parse(
          req.query.attributes
        );

        Object.keys(attrs).forEach(
          (key) => {
            filter[
              `variants.attributes.${key}`
            ] = {
              $in: attrs[key],
            };
          }
        );
      }

      if (minPrice || maxPrice) {

        filter.price = {};

        if (minPrice) {
          filter.price.$gte =
            Number(minPrice);
        }

        if (maxPrice) {
          filter.price.$lte =
            Number(maxPrice);
        }
      }

      if (rating) {
        filter.rating = {
          $gte: Number(rating),
        };
      }

      /* ================= SORT ================= */

      let sortQuery = {
        createdAt: -1,
      };

      if (sort === "az") {
        sortQuery = {
          title: 1,
          name: 1,
        };
      }

      if (sort === "price-low") {
        sortQuery = { price: 1 };
      }

      if (sort === "price-high") {
        sortQuery = { price: -1 };
      }

      if (sort === "rating") {
        sortQuery = { rating: -1 };
      }

      /* ================= PRODUCTS ================= */

      const products =
        await Product.find(filter)
          .select(
            "-variants.sku -__v"
          )
          .sort(sortQuery);

      /* ================= FILTER DATA ================= */

      const baseMatch = {
        category:
          category.toLowerCase(),

        isActive: true,
        isApproved: true,
        isDeleted: false,
      };

      const brands =
        await Product.aggregate([
          { $match: baseMatch },

          {
            $group: {
              _id: "$brand",
              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: { _id: 1 },
          },
        ]);

      const subCategories =
        await Product.aggregate([
          { $match: baseMatch },

          {
            $group: {
              _id: "$subCategory",
              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: { _id: 1 },
          },
        ]);

      const priceAgg =
        await Product.aggregate([
          { $match: baseMatch },

          {
            $group: {
              _id: null,

              minPrice: {
                $min: "$price",
              },

              maxPrice: {
                $max: "$price",
              },
            },
          },
        ]);

      return res.json({
        products,

        filters: {
          brands,
          subCategories,

          ratings: [
            5,
            4,
            3,
            2,
            1,
          ],

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
        filters: {},
      });
    }
  };

/* ======================================================
   SEARCH PRODUCTS
====================================================== */

exports.searchProducts = async (
  req,
  res
) => {
  try {

    const q = (
      req.query.q || ""
    ).trim();

    if (!q) {
      return res.json([]);
    }

    const regex = new RegExp(q, "i");

    const products =
      await Product.find({
        isActive: true,
        isApproved: true,
        isDeleted: false,

        $or: [
          { title: regex },
          { name: regex },
          { category: regex },
          { subCategory: regex },
          { brand: regex },
        ],
      })
        .select(
          "title name slug price thumbnail rating images"
        )
        .limit(20)
        .lean();

    return res.json(products);

  } catch (error) {

    console.error(
      "Search Products Error:",
      error
    );

    return res.status(500).json([]);
  }
};

/* ======================================================
   GET ALL PRODUCTS
====================================================== */

exports.getAllProducts = async (
  req,
  res
) => {
  try {

    let {
      sort,
      brand,
      rating,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      filter,
      category,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 12;

    const skip =
      (page - 1) * limit;

    /* ================= QUERY ================= */

    const query = {
      isActive: true,
      isApproved: true,
      isDeleted: false,
    };

    if (
      category &&
      category !== "all"
    ) {
      query.category = {
        $regex: new RegExp(
          `^${category}$`,
          "i"
        ),
      };
    }

    if (
      !category ||
      category === "all"
    ) {
      if (filter === "featured") {
        query.isFeatured = true;
      }

      if (filter === "new") {
        query.isNewArrival = true;
      }

      if (filter === "best") {
        query.isBestSeller = true;
      }
    }

    if (brand) {
      query.brand = {
        $in: brand.split(","),
      };
    }

    if (rating) {
      query.rating = {
        $gte: Number(rating),
      };
    }

    if (minPrice || maxPrice) {

      query.price = {};

      if (minPrice) {
        query.price.$gte =
          Number(minPrice);
      }

      if (maxPrice) {
        query.price.$lte =
          Number(maxPrice);
      }
    }

    /* ================= SORT ================= */

    let sortQuery = {
      createdAt: -1,
    };

    if (sort === "az") {
      sortQuery = {
        title: 1,
        name: 1,
      };
    }

    if (sort === "price-low") {
      sortQuery = { price: 1 };
    }

    if (sort === "price-high") {
      sortQuery = { price: -1 };
    }

    if (sort === "rating") {
      sortQuery = { rating: -1 };
    }

    /* ================= FETCH ================= */

    const [products, total] =
      await Promise.all([
        Product.find(query)
          .select(
            "-variants.sku -__v"
          )
          .sort(sortQuery)
          .skip(skip)
          .limit(limit)
          .lean(),

        Product.countDocuments(query),
      ]);

    /* ================= FILTERS ================= */

    const baseMatch = {
      isActive: true,
      isApproved: true,
      isDeleted: false,
    };

    if (
      category &&
      category !== "all"
    ) {
      baseMatch.category =
        category.toLowerCase();
    }

    const brands =
      await Product.aggregate([
        { $match: baseMatch },

        {
          $group: {
            _id: "$brand",
            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: { _id: 1 },
        },
      ]);

    const priceAgg =
      await Product.aggregate([
        { $match: baseMatch },

        {
          $group: {
            _id: null,

            minPrice: {
              $min: "$price",
            },

            maxPrice: {
              $max: "$price",
            },
          },
        },
      ]);

    return res.json({
      products,
      total,
      page,

      totalPages: Math.ceil(
        total / limit
      ),

      filters: {
        brands,

        ratings: [
          5,
          4,
          3,
          2,
          1,
        ],

        priceRange:
          priceAgg[0] || {
            minPrice: 0,
            maxPrice: 0,
          },
      },
    });

  } catch (error) {

    console.error(
      "Get All Products Error:",
      error
    );

    return res.status(500).json({
      products: [],
      total: 0,
      filters: {},
    });
  }
};

/* ======================================================
   LOW STOCK
====================================================== */

exports.getLowStockProducts =
  async (req, res) => {
    try {

      const products =
        await Product.find({
          totalStock: {
            $lte: 5,
          },

          isActive: true,
          isDeleted: false,
        }).select(
          "title totalStock"
        );

      return res.json(products);

    } catch (err) {

      console.error(
        "Low stock error",
        err
      );

      return res.status(500).json([]);
    }
  };

/* ======================================================
   APPROVE PRODUCT
====================================================== */

exports.approveProduct = async (
  req,
  res
) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin only",
      });
    }

    const product =
      await Product.findByIdAndUpdate(
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

    return res.json({
      message: "Product approved",
      product,
    });

  } catch (err) {

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   GET MY PRODUCTS
====================================================== */

exports.getMyProducts = async (
  req,
  res
) => {
  try {

    const products =
      await Product.find({
        seller: req.user._id,
        isDeleted: false,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.json({
      products,
    });

  } catch (err) {

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   GET PENDING PRODUCTS
====================================================== */

exports.getPendingProducts =
  async (req, res) => {
    try {

      const products =
        await Product.find({
          isApproved: false,
          isDeleted: false,
        }).populate(
          "seller",
          "name email"
        );

      return res.json(products);

    } catch (err) {

      return res.status(500).json({
        message: err.message,
      });
    }
  };

/* ======================================================
   GET ALL PRODUCTS ADMIN
====================================================== */

exports.getAllProductsAdmin =
  async (req, res) => {
    try {

      const products =
        await Product.find()
          .populate(
            "seller",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(products);

    } catch (err) {

      return res.status(500).json({
        message:
          "Failed to fetch products",
      });
    }
  };

/* ======================================================
   DELETE PRODUCT
====================================================== */

exports.deleteProduct = async (
  req,
  res
) => {
  try {

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        {
          isDeleted: true,
          isActive: false,
        },
        { new: true }
      );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.json({
      message: "Product deleted",
    });

  } catch (err) {

    return res.status(500).json({
      message: "Delete failed",
    });
  }
};

/* ======================================================
   TOGGLE PRODUCT ACTIVE
====================================================== */

exports.toggleProductActive =
  async (req, res) => {
    try {

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message: "Not found",
        });
      }

      product.isActive =
        !product.isActive;

      await product.save();

      return res.json(product);

    } catch (err) {

      return res.status(500).json({
        message: "Update failed",
      });
    }
  };