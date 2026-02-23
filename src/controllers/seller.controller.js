// seller.controller.js
const Product = require("../models/Product");
const Order = require("../models/Order");

/* ================= SELLER PRODUCTS ================= */
exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.seller._id,
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= SELLER ORDERS ================= */
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "items.seller": req.seller._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= SELLER DASHBOARD ================= */
exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.seller._id;

    const totalProducts = await Product.countDocuments({
      seller: sellerId,
    });

    const totalOrders = await Order.countDocuments({
      "items.seller": sellerId,
    });

    const revenue = await Order.aggregate([
      { $match: { "items.seller": sellerId, status: "Delivered" } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$items.sellerEarning" },
        },
      },
    ]);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      walletBalance: req.seller.walletBalance || 0,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};