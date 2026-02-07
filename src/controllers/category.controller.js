// src/controllers/Category.controller.js

const Category = require("../models/Category");

/* ================= CREATE ================= */
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({
      message: err.message || "Create failed",
    });
  }
};

/* ================= GET ALL (PUBLIC + ADMIN) ================= */
exports.getCategories = async (req, res) => {
  const categories = await Category.find()
    .sort({ order: 1, createdAt: 1 })
    .lean();

  res.json(categories);
};

/* ================= UPDATE ================= */
exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!category) {
    return res.status(404).json({
      message: "Not found",
    });
  }

  res.json(category);
};
