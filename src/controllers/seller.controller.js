// src/controllers/seller.controller.js

const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

/* ======================================================
   SELLER PRODUCTS
====================================================== */

exports.getSellerProducts = async (req, res) => {
  try {

    const sellerId = req.user._id;

    const products = await Product.find({
      seller: sellerId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(products);

  } catch (err) {

    console.error(
      "Seller Products Error:",
      err
    );

    return res.status(500).json({
      message: "Failed to load products",
    });
  }
};

/* ======================================================
   SINGLE SELLER PRODUCT
====================================================== */

exports.getSingleSellerProduct =
  async (req, res) => {
    try {

      const product =
        await Product.findOne({
          _id: req.params.id,
          seller: req.user._id,
          isDeleted: false,
        }).lean();

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      return res.json(product);

    } catch (err) {

      return res.status(500).json({
        message: "Failed to load product",
      });
    }
  };

/* ======================================================
   SELLER ORDERS
====================================================== */

exports.getSellerOrders = async (
  req,
  res
) => {
  try {

    const sellerId = req.user._id;

    const orders = await Order.find({
      "items.seller": sellerId,
    })
      .select(
        "_id status paymentStatus createdAt customer items totalAmount"
      )
      .sort({ createdAt: -1 })
      .lean();

    const filteredOrders =
      orders.map((order) => {

        const sellerItems =
          order.items.filter(
            (item) =>
              item.seller.toString() ===
              sellerId.toString()
          );

        const sellerTotal =
          sellerItems.reduce(
            (sum, item) =>
              sum +
              (item.sellerEarning || 0),
            0
          );

        return {
          _id: order._id,
          status: order.status,
          paymentStatus:
            order.paymentStatus,
          createdAt:
            order.createdAt,
          customer:
            order.customer,
          items: sellerItems,
          sellerTotal,
        };
      });

    return res.json(filteredOrders);

  } catch (err) {

    console.error(
      "Seller Orders Error:",
      err
    );

    return res.status(500).json({
      message: "Failed to load orders",
    });
  }
};

/* ======================================================
   SELLER DASHBOARD
====================================================== */

exports.getSellerDashboard =
  async (req, res) => {
    try {

      const sellerId = req.user._id;

      /* ================= PRODUCTS ================= */

      const totalProducts =
        await Product.countDocuments({
          seller: sellerId,
          isDeleted: false,
        });

      const activeProducts =
        await Product.countDocuments({
          seller: sellerId,
          isDeleted: false,
          isActive: true,
        });

      const pendingProducts =
        await Product.countDocuments({
          seller: sellerId,
          status: "pending",
          isDeleted: false,
        });

      const lowStockProducts =
        await Product.countDocuments({
          seller: sellerId,
          isDeleted: false,

          $expr: {
            $lte: [
              "$totalStock",
              "$lowStockThreshold",
            ],
          },
        });

      /* ================= ORDERS ================= */

      const totalOrders =
        await Order.countDocuments({
          "items.seller": sellerId,
        });

      const pendingOrders =
        await Order.countDocuments({
          "items.seller": sellerId,

          status: {
            $in: [
              "Pending",
              "Confirmed",
              "Packed",
            ],
          },
        });

      /* ================= REVENUE ================= */

      const totalRevenueAgg =
        await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },

          {
            $unwind: "$items",
          },

          {
            $match: {
              "items.seller":
                sellerId,
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum:
                  "$items.sellerEarning",
              },
            },
          },
        ]);

      const totalRevenue =
        totalRevenueAgg[0]
          ?.total || 0;

      /* ================= MONTHLY REVENUE ================= */

      const startOfMonth =
        new Date();

      startOfMonth.setDate(1);

      startOfMonth.setHours(
        0,
        0,
        0,
        0
      );

      const monthlyRevenueAgg =
        await Order.aggregate([
          {
            $match: {
              status: "Delivered",

              createdAt: {
                $gte:
                  startOfMonth,
              },
            },
          },

          {
            $unwind: "$items",
          },

          {
            $match: {
              "items.seller":
                sellerId,
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum:
                  "$items.sellerEarning",
              },
            },
          },
        ]);

      const monthlyRevenue =
        monthlyRevenueAgg[0]
          ?.total || 0;

      return res.json({
        totalProducts,
        activeProducts,
        pendingProducts,

        totalOrders,
        pendingOrders,

        lowStockProducts,

        totalRevenue,
        monthlyRevenue,

        walletBalance:
          req.user.walletBalance || 0,
      });

    } catch (err) {

      console.error(
        "Seller Dashboard Error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load dashboard",
      });
    }
  };

/* ======================================================
   SELLER ANALYTICS
====================================================== */

exports.getSellerAnalytics =
  async (req, res) => {
    try {

      const sellerId = req.user._id;

      const monthlySales =
        await Order.aggregate([
          {
            $match: {
              status: "Delivered",
            },
          },

          {
            $unwind: "$items",
          },

          {
            $match: {
              "items.seller":
                sellerId,
            },
          },

          {
            $group: {
              _id: {
                month: {
                  $month:
                    "$createdAt",
                },
              },

              revenue: {
                $sum:
                  "$items.sellerEarning",
              },

              orders: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              "_id.month": 1,
            },
          },
        ]);

      return res.json({
        monthlySales,
      });

    } catch (err) {

      console.error(
        "Analytics Error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load analytics",
      });
    }
  };

/* ======================================================
   LOW STOCK PRODUCTS
====================================================== */

exports.getLowStockProducts =
  async (req, res) => {
    try {

      const products =
        await Product.find({
          seller: req.user._id,

          isDeleted: false,

          $expr: {
            $lte: [
              "$totalStock",
              "$lowStockThreshold",
            ],
          },
        })
          .select(
            "title name totalStock lowStockThreshold thumbnail"
          )
          .sort({
            totalStock: 1,
          });

      return res.json(products);

    } catch (err) {

      return res.status(500).json({
        message:
          "Failed to load low stock products",
      });
    }
  };

/* ======================================================
   UPDATE SELLER PRODUCT
====================================================== */

exports.updateSellerProduct =
  async (req, res) => {
    try {

      const sellerId =
        req.user._id;

      const product =
        await Product.findOne({
          _id: req.params.id,
          seller: sellerId,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      const allowedFields = [
        "title",
        "name",
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
        "attributes",
        "tags",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            product[field] =
              req.body[field];
          }
        }
      );

      /* ================= RECALCULATE STOCK ================= */

      if (
        product.variants?.length
      ) {
        product.totalStock =
          product.variants.reduce(
            (sum, variant) =>
              sum +
              (Number(
                variant.stock
              ) || 0),
            0
          );

        product.inStock =
          product.totalStock > 0;
      }

      /* ================= RE-APPROVAL FLOW ================= */

      product.status =
        "pending";

      product.isApproved =
        false;

      await product.save();

      return res.json({
        message:
          "Product updated and sent for approval",

        product,
      });

    } catch (err) {

      console.error(
        "Update Product Error:",
        err
      );

      return res.status(500).json({
        message:
          "Product update failed",
      });
    }
  };

/* ======================================================
   TOGGLE PRODUCT ACTIVE
====================================================== */

exports.toggleSellerProductStatus =
  async (req, res) => {
    try {

      const product =
        await Product.findOne({
          _id: req.params.id,
          seller: req.user._id,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      product.isActive =
        !product.isActive;

      await product.save();

      return res.json({
        message:
          product.isActive
            ? "Product activated"
            : "Product deactivated",

        isActive:
          product.isActive,
      });

    } catch (err) {

      return res.status(500).json({
        message:
          "Status update failed",
      });
    }
  };

/* ======================================================
   DELETE SELLER PRODUCT
====================================================== */

exports.deleteSellerProduct =
  async (req, res) => {
    try {

      const sellerId =
        req.user._id;

      const product =
        await Product.findOne({
          _id: req.params.id,
          seller: sellerId,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      /* ================= SOFT DELETE ================= */

      product.isDeleted = true;

      product.isActive = false;

      await product.save();

      return res.json({
        message:
          "Product deleted successfully",
      });

    } catch (err) {

      console.error(
        "Delete Product Error:",
        err
      );

      return res.status(500).json({
        message:
          "Product delete failed",
      });
    }
  };

/* ======================================================
   GET WALLET TRANSACTIONS
====================================================== */

exports.getWalletTransactions =
  async (req, res) => {
    try {

      const transactions =
        await WalletTransaction.find({
          user: req.user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        balance:
          req.user.walletBalance || 0,

        transactions,
      });

    } catch (err) {

      console.error(
        "Wallet Fetch Error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load wallet",
      });
    }
  };

/* ======================================================
   WITHDRAW FROM WALLET
====================================================== */

exports.withdrawFromWallet =
  async (req, res) => {
    try {

      const amount =
        Number(req.body.amount);

      if (
        !amount ||
        amount <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid amount",
        });
      }

      if (amount < 100) {
        return res.status(400).json({
          message:
            "Minimum withdrawal is ₹100",
        });
      }

      const seller =
        await User.findById(
          req.user._id
        );

      if (!seller) {
        return res.status(404).json({
          message:
            "Seller not found",
        });
      }

      if (
        seller.walletBalance <
        amount
      ) {
        return res.status(400).json({
          message:
            "Insufficient balance",
        });
      }

      /* ================= CREATE TRANSACTION ================= */

      await WalletTransaction.create({
        user: seller._id,

        type: "DEBIT",

        amount,

        source:
          "withdrawal",

        status:
          "PENDING",

        note:
          "Seller withdrawal request",
      });

      return res.json({
        message:
          "Withdrawal request submitted",
      });

    } catch (err) {

      console.error(
        "Withdraw Error:",
        err
      );

      return res.status(500).json({
        message:
          "Withdrawal failed",
      });
    }
  };