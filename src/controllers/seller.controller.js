// src/controllers/seller.controller.js
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/* ================= SELLER PRODUCTS ================= */
exports.getSellerProducts = async (req, res) => {
  const products = await Product.find({
    seller: req.user._id,
    }).sort({ createdAt: -1 });

  res.json(products);
};

/* ================= SELLER ORDERS ================= */
exports.getSellerOrders = async (req, res) => {
  const orders = await Order.find({
    "items.seller": req.seller._id,
  }).sort({ createdAt: -1 });

  res.json(orders);
};

/* ================= SELLER DASHBOARD ================= */
exports.getSellerDashboard = async (req, res) => {
  const sellerId = req.seller._id;

  const totalProducts = await Product.countDocuments({
    seller: req.user._id,
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
    walletBalance: req.seller.walletBalance,
  });
};


/* ================= APPLY FOR SELLER ================= */
exports.applyForSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.sellerStatus === "pending") {
      return res.status(400).json({
        message: "Seller request already pending",
      });
    }

    if (user.sellerStatus === "approved") {
      return res.status(400).json({
        message: "Already approved seller",
      });
    }

    const { storeName, storeDescription, gstNumber, panNumber } = req.body;

    user.role = "seller";
    user.sellerStatus = "pending";
    user.sellerRequestedAt = new Date();
    user.sellerInfo = {
      storeName,
      storeDescription,
      gstNumber,
      panNumber,
    };

    await user.save();

    res.json({
      message: "Seller application submitted",
    });

  } catch (error) {
    res.status(500).json({ message: "Application failed" });
  }
};
