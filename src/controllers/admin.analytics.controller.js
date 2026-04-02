const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

/* ================= ANALYTICS ================= */

exports.getAdminAnalytics = async (req, res) => {
  try {

    const days = parseInt(req.query.days) || 30;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    /* ================= REVENUE ================= */

    const revenueData = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueChart = revenueData.map((r) => ({
      date: r._id,
      revenue: r.revenue,
    }));

    /* ================= ORDERS ================= */

    const ordersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const ordersChart = ordersData.map((o) => ({
      date: o._id,
      orders: o.orders,
    }));

    /* ================= TOP PRODUCTS ================= */

    const topProductsAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          sales: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
    ]);

    const populatedProducts = await Product.populate(topProductsAgg, {
      path: "_id",
      select: "name",
    });

    const topProducts = populatedProducts.map((p) => ({
      name: p._id?.name || "Unknown",
      sales: p.sales,
    }));

    /* ================= SELLER REVENUE ================= */

    const sellerAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.seller",
          revenue: { $sum: "$items.sellerEarning" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const populatedSellers = await User.populate(sellerAgg, {
      path: "_id",
      select: "name email",
    });

    const topSellers = populatedSellers.map((s) => ({
      name: s._id?.name || "Unknown",
      revenue: s.revenue,
    }));

    /* ================= CATEGORY ANALYTICS ================= */

    const categoryAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          sales: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sales: -1 } },
    ]);

    const categoryData = categoryAgg.map((c) => ({
      category: c._id || "Unknown",
      sales: c.sales,
    }));

    /* ================= AOV ================= */

    const totalRevenueAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = totalRevenueAgg[0]?.revenue || 0;
    const totalOrders = totalRevenueAgg[0]?.count || 0;

    const avgOrderValue = totalOrders
      ? Math.round(totalRevenue / totalOrders)
      : 0;

    /* ================= GROWTH ================= */

    const prevFromDate = new Date();
    prevFromDate.setDate(prevFromDate.getDate() - days * 2);

    const prevRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: prevFromDate, $lt: fromDate },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const prevRevenue = prevRevenueAgg[0]?.revenue || 0;

    const growth = prevRevenue
      ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
      : 0;

    /* ================= RESPONSE ================= */

    res.json({
      revenueChart,
      ordersChart,
      topProducts,
      topSellers,
      categoryData,

      stats: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        growth: Number(growth),
      },
    });

  } catch (err) {
    console.error("Analytics Error:", err);

    res.status(500).json({
      message: "Failed to load analytics",
    });
  }
};