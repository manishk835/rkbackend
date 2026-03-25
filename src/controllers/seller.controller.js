// src/controllers/seller.controller.js

const Product = require("../models/Product");
const Order = require("../models/Order");

/* ================= SELLER PRODUCTS ================= */

exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const products = await Product.find({
      seller: sellerId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(products);

  } catch (err) {
    console.error("Seller Products Error:", err);
    res.status(500).json({ message: "Failed to load products" });
  }
};

/* ================= SELLER ORDERS ================= */

exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const orders = await Order.find({
      "items.seller": sellerId,
    })
      .select("_id status paymentStatus createdAt customer items")
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
    console.error("Seller Orders Error:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
};

/* ================= SELLER DASHBOARD ================= */

exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    /* ===== PRODUCTS ===== */

    const totalProducts = await Product.countDocuments({
      seller: sellerId,
      isDeleted: false,
    });

    const lowStockProducts = await Product.countDocuments({
      seller: sellerId,
      isDeleted: false,
      $expr: { $lt: ["$totalStock", "$lowStockThreshold"] },
    });

    /* ===== ORDERS ===== */

    const totalOrders = await Order.countDocuments({
      "items.seller": sellerId,
    });

    const pendingOrders = await Order.countDocuments({
      "items.seller": sellerId,
      status: { $in: ["Pending", "Confirmed", "Packed"] },
    });

    /* ===== TOTAL REVENUE ===== */

    const totalRevenueAgg = await Order.aggregate([
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

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    /* ===== MONTHLY REVENUE (FIXED 🔥) ===== */

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: startOfMonth },
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

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    /* ===== RESPONSE ===== */

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      totalRevenue,
      monthlyRevenue, // 🔥 FIXED
      walletBalance: req.user.walletBalance || 0,
    });

  } catch (err) {
    console.error("Seller Dashboard Error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/* ================= UPDATE SELLER PRODUCT ================= */

exports.updateSellerProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const product = await Product.findOne({
      _id: req.params.id,
      seller: sellerId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "shortDescription",
      "price",
      "originalPrice",
      "category",
      "subCategory",
      "brand",
      "images",
      "thumbnail",
      "variants",
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // 🔥 Re-approval flow
    product.status = "pending";
    product.isApproved = false;

    await product.save();

    res.json({
      message: "Product updated, waiting for approval",
      product,
    });

  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Product update failed" });
  }
};

/* ================= DELETE SELLER PRODUCT ================= */

exports.deleteSellerProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const product = await Product.findOne({
      _id: req.params.id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 🔥 SOFT DELETE
    product.isDeleted = true;
    await product.save();

    res.json({
      message: "Product deleted (soft delete)",
    });

  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ message: "Product delete failed" });
  }
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id)
      .select("walletBalance walletTransactions")
      .lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    res.json({
      balance: seller.walletBalance || 0,
      transactions: seller.walletTransactions || [],
    });

  } catch (err) {
    console.error("Wallet Fetch Error:", err);
    res.status(500).json({
      message: "Failed to load wallet",
    });
  }
};

// exports.withdrawFromWallet = async (req, res) => {
//   try {
//     const { amount } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         message: "Invalid amount",
//       });
//     }

//     if (amount < 100) {
//       return res.status(400).json({
//         message: "Minimum withdrawal is ₹100",
//       });
//     }

//     const seller = await User.findById(req.user._id);

//     if (!seller) {
//       return res.status(404).json({
//         message: "Seller not found",
//       });
//     }

//     if (seller.walletBalance < amount) {
//       return res.status(400).json({
//         message: "Insufficient balance",
//       });
//     }

//     // 🔥 Debit wallet
//     await seller.debitWallet({
//       amount,
//       source: "withdrawal",
//       note: "Seller withdrawal request",
//     });

//     res.json({
//       message: "Withdrawal successful",
//       balance: seller.walletBalance,
//     });

//   } catch (err) {
//     console.error("Withdraw Error:", err);
//     res.status(500).json({
//       message: "Withdrawal failed",
//     });
//   }
// };
// 
exports.withdrawFromWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    const seller = await User.findById(req.user._id);

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    if (seller.walletBalance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // 🔥 CREATE PENDING REQUEST
    seller.walletTransactions.push({
      type: "debit",
      amount,
      source: "withdrawal",
      status: "pending",
      note: "Withdrawal request",
    });

    await seller.save();

    res.json({
      message: "Withdrawal request submitted",
    });

  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({
      message: "Withdrawal failed",
    });
  }
};
// src/controllers/seller.controller.js

// const Product = require("../models/Product");
// const Order = require("../models/Order");

// /* ================= SELLER PRODUCTS ================= */

// exports.getSellerProducts = async (req, res) => {

//   try {

//     const sellerId = req.user._id;

//     const products = await Product
//       .find({ seller: sellerId })
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json(products);

//   } catch (err) {

//     console.error("Seller Products Error:", err);

//     res.status(500).json({
//       message: "Failed to load products",
//     });

//   }

// };

// /* ================= SELLER ORDERS ================= */

// exports.getSellerOrders = async (req, res) => {

//   try {

//     const sellerId = req.user._id;

//     const orders = await Order.find({
//       "items.seller": sellerId,
//     })
//       .select("_id status paymentStatus createdAt customer items")
//       .sort({ createdAt: -1 })
//       .lean();

//     const filteredOrders = orders.map(order => {

//       const sellerItems = order.items.filter(
//         item =>
//           item.seller.toString() ===
//           sellerId.toString()
//       );

//       const sellerTotal = sellerItems.reduce(
//         (sum, item) =>
//           sum + item.sellerEarning,
//         0
//       );

//       return {
//         _id: order._id,
//         status: order.status,
//         paymentStatus: order.paymentStatus,
//         createdAt: order.createdAt,
//         customer: order.customer,
//         items: sellerItems,
//         sellerTotal,
//       };

//     });

//     res.json(filteredOrders);

//   } catch (err) {

//     console.error("Seller Orders Error:", err);

//     res.status(500).json({
//       message: "Failed to load orders",
//     });

//   }

// };

// /* ================= SELLER DASHBOARD ================= */

// exports.getSellerDashboard = async (req, res) => {

//   try {

//     const sellerId = req.user._id;

//     const totalProducts =
//       await Product.countDocuments({
//         seller: sellerId,
//       });

//     const lowStockProducts =
//       await Product.countDocuments({
//         seller: sellerId,
//         totalStock: { $lt: 5 },
//       });

//     const totalOrders =
//       await Order.countDocuments({
//         "items.seller": sellerId,
//       });

//     const pendingOrders =
//       await Order.countDocuments({
//         "items.seller": sellerId,
//         status: {
//           $in: [
//             "Pending",
//             "Confirmed",
//             "Packed",
//           ],
//         },
//       });

//     const revenue = await Order.aggregate([

//       {
//         $match: {
//           status: "Delivered",
//         },
//       },

//       { $unwind: "$items" },

//       {
//         $match: {
//           "items.seller": sellerId,
//         },
//       },

//       {
//         $group: {
//           _id: null,
//           total: {
//             $sum: "$items.sellerEarning",
//           },
//         },
//       },

//     ]);

//     res.json({

//       totalProducts,
//       totalOrders,
//       pendingOrders,
//       lowStockProducts,
//       totalRevenue: revenue[0]?.total || 0,
//       walletBalance: req.user.walletBalance || 0,

//     });

//   } catch (err) {

//     console.error("Seller Dashboard Error:", err);

//     res.status(500).json({
//       message: "Failed to load dashboard",
//     });

//   }

// };

// /* ================= UPDATE SELLER PRODUCT ================= */

// exports.updateSellerProduct = async (req, res) => {

//   try {

//     const sellerId = req.user._id;

//     const product = await Product.findOne({
//       _id: req.params.id,
//       seller: sellerId,
//     });

//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found",
//       });
//     }

//     const allowedFields = [
//       "name",
//       "description",
//       "price",
//       "discountPrice",
//       "category",
//       "brand",
//       "images",
//       "sizes",
//       "colors",
//       "totalStock",
//     ];

//     allowedFields.forEach(field => {

//       if (req.body[field] !== undefined) {
//         product[field] = req.body[field];
//       }

//     });

//     product.isApproved = false;

//     await product.save();

//     res.json({
//       message:
//         "Product updated. Waiting for admin approval.",
//       product,
//     });

//   } catch (err) {

//     console.error("Update Product Error:", err);

//     res.status(500).json({
//       message: "Product update failed",
//     });

//   }

// };

// /* ================= DELETE SELLER PRODUCT ================= */

// exports.deleteSellerProduct = async (req, res) => {

//   try {

//     const sellerId = req.user._id;

//     const product = await Product.findOne({
//       _id: req.params.id,
//       seller: sellerId,
//     });

//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found",
//       });
//     }

//     await product.deleteOne();

//     res.json({
//       message: "Product deleted successfully",
//     });

//   } catch (err) {

//     console.error("Delete Product Error:", err);

//     res.status(500).json({
//       message: "Product delete failed",
//     });

//   }

// };