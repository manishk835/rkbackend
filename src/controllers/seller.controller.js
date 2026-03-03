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
    const sellerId = req.seller._id;

    const orders = await Order.find({
      "items.seller": sellerId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const filteredOrders = orders.map(order => {
      const sellerItems = order.items.filter(
        item => item.seller.toString() === sellerId.toString()
      );

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.sellerEarning,
        0
      );

      return {
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        customer: order.customer,
        items: sellerItems,
        sellerTotal,
      };
    });

    res.json(filteredOrders);

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

    const lowStockProducts = await Product.countDocuments({
      seller: sellerId,
      totalStock: { $lt: 5 },
    });

    const totalOrders = await Order.countDocuments({
      "items.seller": sellerId,
    });

    const pendingOrders = await Order.countDocuments({
      "items.seller": sellerId,
      status: { $in: ["Pending", "Confirmed", "Packed"] },
    });

    const revenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$items.sellerEarning" },
        },
      },
    ]);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: {
            $gte: new Date(new Date().setDate(1)),
          },
        },
      },
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
      pendingOrders,
      lowStockProducts,
      totalRevenue: revenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      walletBalance: req.seller.walletBalance || 0,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyVendor = async (req, res) => {
  const { businessName, email, phone, category, message } = req.body;

  const application = await VendorApplication.create({
    businessName,
    email,
    phone,
    category,
    message,
    status: "pending",
  });

  res.status(201).json({
    message: "Application submitted",
  });
};