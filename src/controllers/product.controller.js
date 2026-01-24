const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Product creation failed" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
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

exports.searchProducts = async (req, res) => {
    try {
      const query = req.query.q || "";
  
      const products = await Product.find({
        title: { $regex: query, $options: "i" },
      }).sort({ createdAt: -1 });
  
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Search failed" });
    }
  };
  
  exports.getProductsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const { type, minPrice, maxPrice, inStock } = req.query;
  
      const filter = { category };
  
      // sub-category filter
      if (type) {
        filter.slug = { $regex: type, $options: "i" };
      }
  
      // price filter
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
  
      // stock filter
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
  
  