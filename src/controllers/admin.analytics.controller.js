// src/controllers/admin.analytics.controller.js

const Order = require("../models/Order");

const Product = require("../models/Product");

const User = require("../models/User");

/* ======================================================
   ADMIN ANALYTICS
====================================================== */

exports.getAdminAnalytics =
  async (req, res) => {
    try {

      /* ================= DAYS FILTER ================= */

      const days =
        parseInt(
          req.query.days
        ) || 30;

      const fromDate =
        new Date();

      fromDate.setDate(
        fromDate.getDate() -
          days
      );

      /* ======================================================
         📈 REVENUE CHART
      ====================================================== */

      const revenueData =
        await Order.aggregate([
          {
            $match: {
              status:
                "Delivered",

              createdAt: {
                $gte:
                  fromDate,
              },
            },
          },

          {
            $group: {
              _id: {
                $dateToString:
                  {
                    format:
                      "%Y-%m-%d",

                    date:
                      "$createdAt",
                  },
              },

              revenue: {
                $sum:
                  "$totalAmount",
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);

      const revenueChart =
        revenueData.map(
          (r) => ({
            date:
              r._id,

            revenue:
              r.revenue,
          })
        );

      /* ======================================================
         📦 ORDERS CHART
      ====================================================== */

      const ordersData =
        await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte:
                  fromDate,
              },
            },
          },

          {
            $group: {
              _id: {
                $dateToString:
                  {
                    format:
                      "%Y-%m-%d",

                    date:
                      "$createdAt",
                  },
              },

              orders: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);

      const ordersChart =
        ordersData.map(
          (o) => ({
            date:
              o._id,

            orders:
              o.orders,
          })
        );

      /* ======================================================
         🛍 TOP PRODUCTS
      ====================================================== */

      const topProductsAgg =
        await Order.aggregate([
          {
            $match: {
              status:
                "Delivered",
            },
          },

          {
            $unwind:
              "$items",
          },

          {
            $group: {
              _id:
                "$items.productId",

              sales: {
                $sum:
                  "$items.quantity",
              },

              revenue: {
                $sum:
                  "$items.totalPrice",
              },
            },
          },

          {
            $sort: {
              sales: -1,
            },
          },

          {
            $limit: 5,
          },
        ]);

      const populatedProducts =
        await Product.populate(
          topProductsAgg,
          {
            path: "_id",

            select:
              "name title category thumbnail",
          }
        );

      const topProducts =
        populatedProducts.map(
          (p) => ({
            id:
              p._id?._id,

            name:
              p._id?.name ||
              p._id
                ?.title ||
              "Unknown",

            category:
              p._id
                ?.category ||
              "",

            thumbnail:
              p._id
                ?.thumbnail ||
              "",

            sales:
              p.sales,

            revenue:
              p.revenue ||
              0,
          })
        );

      /* ======================================================
         👨‍💼 TOP SELLERS
      ====================================================== */

      const sellerAgg =
        await Order.aggregate([
          {
            $match: {
              status:
                "Delivered",
            },
          },

          {
            $unwind:
              "$items",
          },

          {
            $group: {
              _id:
                "$items.seller",

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
              revenue: -1,
            },
          },

          {
            $limit: 5,
          },
        ]);

      const populatedSellers =
        await User.populate(
          sellerAgg,
          {
            path: "_id",

            select:
              "name email profileImage",
          }
        );

      const topSellers =
        populatedSellers.map(
          (s) => ({
            id:
              s._id?._id,

            name:
              s._id?.name ||
              "Unknown",

            email:
              s._id?.email ||
              "",

            profileImage:
              s._id
                ?.profileImage ||
              "",

            revenue:
              s.revenue,

            orders:
              s.orders,
          })
        );

      /* ======================================================
         📂 CATEGORY ANALYTICS
      ====================================================== */

      const categoryAgg =
        await Order.aggregate([
          {
            $match: {
              status:
                "Delivered",
            },
          },

          {
            $unwind:
              "$items",
          },

          {
            $lookup: {
              from:
                "products",

              localField:
                "items.productId",

              foreignField:
                "_id",

              as:
                "product",
            },
          },

          {
            $unwind:
              "$product",
          },

          {
            $group: {
              _id:
                "$product.category",

              sales: {
                $sum:
                  "$items.quantity",
              },

              revenue: {
                $sum:
                  "$items.totalPrice",
              },
            },
          },

          {
            $sort: {
              sales: -1,
            },
          },
        ]);

      const categoryData =
        categoryAgg.map(
          (c) => ({
            category:
              c._id ||
              "Unknown",

            sales:
              c.sales,

            revenue:
              c.revenue ||
              0,
          })
        );

      /* ======================================================
         💰 TOTAL REVENUE + AOV
      ====================================================== */

      const totalsAgg =
        await Order.aggregate([
          {
            $match: {
              status:
                "Delivered",
            },
          },

          {
            $group: {
              _id: null,

              revenue: {
                $sum:
                  "$totalAmount",
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]);

      const totalRevenue =
        totalsAgg[0]
          ?.revenue || 0;

      const totalOrders =
        totalsAgg[0]
          ?.count || 0;

      const avgOrderValue =
        totalOrders > 0
          ? Math.round(
              totalRevenue /
                totalOrders
            )
          : 0;

      /* ======================================================
         📈 GROWTH CALCULATION
      ====================================================== */

      const prevFromDate =
        new Date();

      prevFromDate.setDate(
        prevFromDate.getDate() -
          days * 2
      );

      const prevRevenueAgg =
        await Order.aggregate([
          {
            $match: {
              status:
                "Delivered",

              createdAt: {
                $gte:
                  prevFromDate,

                $lt:
                  fromDate,
              },
            },
          },

          {
            $group: {
              _id: null,

              revenue: {
                $sum:
                  "$totalAmount",
              },
            },
          },
        ]);

      const prevRevenue =
        prevRevenueAgg[0]
          ?.revenue || 0;

      const growth =
        prevRevenue > 0
          ? (
              ((totalRevenue -
                prevRevenue) /
                prevRevenue) *
              100
            ).toFixed(1)
          : 0;

      /* ======================================================
         👥 USER STATS
      ====================================================== */

      const totalUsers =
        await User.countDocuments();

      const totalSellers =
        await User.countDocuments(
          {
            role:
              "seller",
          }
        );

      const approvedSellers =
        await User.countDocuments(
          {
            role:
              "seller",

            sellerStatus:
              "approved",
          }
        );

      const totalProducts =
        await Product.countDocuments();

      /* ======================================================
         📤 RESPONSE
      ====================================================== */

      return res.json({
        success: true,

        filters: {
          days,
        },

        revenueChart,

        ordersChart,

        topProducts,

        topSellers,

        categoryData,

        stats: {
          totalRevenue,

          totalOrders,

          avgOrderValue,

          growth:
            Number(
              growth
            ),

          totalUsers,

          totalSellers,

          approvedSellers,

          totalProducts,
        },
      });

    } catch (err) {

      console.error(
        "ANALYTICS ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load analytics",
      });
    }
  };