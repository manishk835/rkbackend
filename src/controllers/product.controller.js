const Product = require("../models/Product");

/**
 * CREATE PRODUCT (ADMIN)
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      price,
      originalPrice,
      image,
      category,
      inStock,
    } = req.body;

    if (!title || !slug || !price || !image || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Product.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const product = await Product.create({
      title,
      slug,
      price,
      originalPrice,
      image,
      category,
      inStock,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Product create failed" });
  }
};

/**
 * GET ALL PRODUCTS (PUBLIC)
 */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/**
 * DELETE PRODUCT (ADMIN)
 */
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

/**
 * SEARCH PRODUCTS
 */
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q || "";

    const products = await Product.find({
      title: { $regex: q, $options: "i" },
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * CATEGORY + FILTER
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { minPrice, maxPrice, inStock } = req.query;

    const filter = { category };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") {
      filter.inStock = true;
    }

    const products = await Product.find(filter).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Filter fetch failed" });
  }
};
