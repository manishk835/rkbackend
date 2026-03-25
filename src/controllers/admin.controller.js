// src/controllers/admin.controller.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");

/* ================= ADMIN LOGIN ================= */

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const admin = await User.findOne({ email }).select("+password");

    if (!admin || admin.role !== "admin") {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        tokenVersion: admin.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Admin login successful" });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= ADMIN LOGOUT ================= */

const adminLogout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Admin logged out" });
};

/* ================= ADMIN DASHBOARD ================= */

const getAdminDashboard = async (req, res) => {
  try {
    /* ===== USERS ===== */

    const totalUsers = await User.countDocuments({ role: "user" });

    const totalSellers = await User.countDocuments({
      role: "seller",
      sellerStatus: "approved",
    });

    const pendingSellers = await User.countDocuments({
      role: "seller",
      sellerStatus: "pending",
    });

    /* ===== ORDERS ===== */

    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: { $in: ["Pending", "Confirmed", "Packed"] },
    });

    /* ===== REVENUE ===== */

    const revenueAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    /* ===== CHART ===== */

    const chartAgg = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 15 },
    ]);

    const chartData = chartAgg.map((item) => ({
      date: item._id,
      orders: item.orders,
    }));

    res.json({
      totalUsers,
      totalSellers,
      pendingSellers,
      totalOrders,
      pendingOrders,
      totalRevenue,
      chartData,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

/* ================= SELLER APPROVAL ================= */

// 🔥 Get pending sellers
const getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: "seller",
      sellerStatus: "pending",
    })
      .select("name email sellerInfo createdAt")
      .sort({ createdAt: -1 });

    res.json(sellers);
  } catch (error) {
    console.error("Pending Sellers Error:", error);
    res.status(500).json({
      message: "Failed to load sellers",
    });
  }
};

// 🔥 Approve seller
const approveSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    seller.sellerStatus = "approved";
    seller.sellerApprovedAt = new Date();

    await seller.save();

    res.json({
      message: "Seller approved successfully",
    });
  } catch (error) {
    console.error("Approve Seller Error:", error);
    res.status(500).json({
      message: "Approval failed",
    });
  }
};

// 🔥 Reject seller
const rejectSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    seller.sellerStatus = "rejected";
    seller.sellerRejectedAt = new Date();

    await seller.save();

    res.json({
      message: "Seller rejected",
    });
  } catch (error) {
    console.error("Reject Seller Error:", error);
    res.status(500).json({
      message: "Reject failed",
    });
  }
};

/* ================= WITHDRAW REQUESTS ================= */

// 🔥 Get all withdrawal requests
const getWithdrawRequests = async (req, res) => {
  try {
    const users = await User.find({
      "walletTransactions.status": "pending",
    }).select("name email walletTransactions");

    const requests = [];

    users.forEach((user) => {
      user.walletTransactions.forEach((txn, index) => {
        if (txn.source === "withdrawal" && txn.status === "pending") {
          requests.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            txnIndex: index,
            amount: txn.amount,
            createdAt: txn.createdAt,
          });
        }
      });
    });

    res.json(requests);
  } catch (err) {
    console.error("Withdraw Requests Error:", err);
    res.status(500).json({
      message: "Failed to load requests",
    });
  }
};

// 🔥 Approve withdrawal
const approveWithdraw = async (req, res) => {
  try {
    const { userId, txnIndex } = req.body;

    const user = await User.findById(userId);

    const txn = user.walletTransactions[txnIndex];

    if (!txn || txn.status !== "pending") {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    if (user.walletBalance < txn.amount) {
      txn.status = "failed";
      await user.save();
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    user.walletBalance -= txn.amount;
    txn.status = "completed";

    await user.save();

    res.json({ message: "Withdrawal approved" });
  } catch (err) {
    console.error("Approve Withdraw Error:", err);
    res.status(500).json({
      message: "Approval failed",
    });
  }
};

// 🔥 Reject withdrawal
const rejectWithdraw = async (req, res) => {
  try {
    const { userId, txnIndex } = req.body;

    const user = await User.findById(userId);

    const txn = user.walletTransactions[txnIndex];

    if (!txn || txn.status !== "pending") {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    txn.status = "failed";

    await user.save();

    res.json({ message: "Withdrawal rejected" });
  } catch (err) {
    console.error("Reject Withdraw Error:", err);
    res.status(500).json({
      message: "Reject failed",
    });
  }
};

/* ================= EXPORTS ================= */

module.exports = {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
};

// // src/controllers/admin.controller.js

// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// /* ================= ADMIN LOGIN ================= */

// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log("========= ADMIN LOGIN ATTEMPT =========");
//     console.log("Email:", email);
//     console.log("Password (plain):", password);

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password required",
//       });
//     }

//     const admin = await User.findOne({ email }).select("+password");

//     if (!admin) {
//       console.log("No user found");
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     console.log("User role:", admin.role);
//     console.log("Hashed password:", admin.password);

//     if (admin.role !== "admin") {
//       return res.status(401).json({
//         message: "Not authorized as admin",
//       });
//     }

//     const isMatch = await admin.comparePassword(password);

//     console.log("Password match:", isMatch);

//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: admin._id,
//         role: admin.role,
//         tokenVersion: admin.tokenVersion,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: false,
//       sameSite: "lax",
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     console.log("Admin login successful");

//     res.json({ message: "Admin login successful" });

//   } catch (error) {
//     console.error("ADMIN LOGIN ERROR:", error);
//     res.status(500).json({ message: "Login failed" });
//   }
// };

// /* ================= ADMIN LOGOUT ================= */

// const adminLogout = async (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });

//   res.json({ message: "Admin logged out" });
// };

// /* ================= EXPORTS ================= */

// module.exports = {
//   adminLogin,
//   adminLogout,
// };
