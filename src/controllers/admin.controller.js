// controllers/admin.controller.js
// 🔥 required imports (top of file)
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AdminLog = require("../models/AdminLog");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

/* ======================================================
   🔐 MAIL TRANSPORT (LOGIN ALERT)
====================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ======================================================
   🔐 TOKEN GENERATOR
====================================================== */

const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      role: admin.role,
      tokenVersion: admin.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

/* ======================================================
   🔐 ADMIN LOGIN (FINAL SECURE)
====================================================== */

const adminLogin = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

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

    if (admin.isBlocked) {
      return res.status(403).json({
        message: "Account blocked",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    /* ================= 2FA CHECK ================= */

    if (admin.twoFactorEnabled) {
      if (!otp) {
        return res.status(200).json({
          require2FA: true,
          message: "OTP required",
        });
      }

      const verified = speakeasy.totp({
        secret: admin.twoFactorSecret,
        encoding: "base32",
        token: otp,
      });

      if (!verified) {
        return res.status(401).json({
          message: "Invalid OTP",
        });
      }
    }

    /* ================= TOKEN ================= */

    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();

    const token = generateToken(admin);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    /* ================= LOGIN ALERT ================= */

    try {
      await transporter.sendMail({
        to: admin.email,
        subject: "Admin Login Alert",
        html: `
          <h3>New Admin Login</h3>
          <p><b>IP:</b> ${req.ip}</p>
          <p><b>Time:</b> ${new Date().toLocaleString()}</p>
        `,
      });
    } catch (err) {
      console.error("Email alert failed", err);
    }

    /* ================= AUDIT LOG ================= */

    await AdminLog.create({
      admin: admin._id,
      action: "Admin Login",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

/* ======================================================
   🔐 ENABLE 2FA
====================================================== */

const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const secret = speakeasy.generateSecret({
      name: `RK Fashion (${user.email})`,
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qr = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      qr,
      secret: secret.base32,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to enable 2FA",
    });
  }
};

/* ======================================================
   🔐 VERIFY 2FA
====================================================== */

const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user._id);

    const verified = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.json({
      message: "2FA enabled successfully",
    });
  } catch {
    return res.status(500).json({
      message: "2FA verification failed",
    });
  }
};

/* ======================================================
   📊 ADMIN LOGS
====================================================== */

const getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate("admin", "email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(logs);
  } catch {
    return res.status(500).json({
      message: "Failed to fetch logs",
    });
  }
};

/* ======================================================
   EXPORTS
====================================================== */

/* ======================================================
   🔐 ADMIN LOGOUT (SECURE)
====================================================== */

const adminLogout = async (req, res) => {
  try {
    // 🔥 invalidate all sessions
    const user = await User.findById(req.user._id);

    if (user) {
      user.tokenVersion += 1;
      await user.save();
    }

    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: "strict",
    });

    return res.json({
      message: "Admin logged out",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      message: "Logout failed",
    });
  }
};

/* ======================================================
   📊 ADMIN DASHBOARD
====================================================== */

const Order = require("../models/Order");

const getAdminDashboard = async (req, res) => {
  try {
    console.log("📊 Dashboard API hit");

    /* ================= USERS ================= */

    const totalUsers = await User.countDocuments({ role: "user" });
    const totalSellers = await User.countDocuments({
      role: "seller",
      sellerStatus: "approved",
    });
    const pendingSellers = await User.countDocuments({
      role: "seller",
      sellerStatus: "pending",
    });

    /* ================= ORDERS ================= */

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["Pending", "Confirmed", "Packed"] },
    });

    /* ================= REVENUE ================= */

    let totalRevenue = 0;

    try {
      const revenueAgg = await Order.aggregate([
        { $match: { status: "Delivered" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]);

      if (revenueAgg.length > 0) {
        totalRevenue = revenueAgg[0].total;
      }
    } catch (err) {
      console.error("❌ Revenue error:", err.message);
    }

    /* ================= CHART ================= */

    let chartData = [];

    try {
      const orders = await Order.find()
        .select("createdAt")
        .sort({ createdAt: 1 })
        .limit(15);

      chartData = orders.map((o) => ({
        date: o.createdAt.toISOString().split("T")[0],
        orders: 1,
      }));
    } catch (err) {
      console.error("❌ Chart error:", err.message);
    }

    /* ================= RESPONSE ================= */

    return res.json({
      success: true,
      totalUsers,
      totalSellers,
      pendingSellers,
      totalOrders,
      pendingOrders,
      totalRevenue,
      chartData,
    });
  } catch (error) {
    console.error("🔥 Dashboard CRASH:", error);

    return res.status(500).json({
      message: "Dashboard failed",
    });
  }
};

/* ======================================================
   🧑‍💼 SELLER APPROVAL
====================================================== */

const getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: "seller",
      sellerStatus: "pending",
    })
      .select("name email sellerInfo createdAt")
      .sort({ createdAt: -1 });

    return res.json(sellers);
  } catch (error) {
    console.error("Pending Sellers Error:", error);

    return res.status(500).json({
      message: "Failed to load sellers",
    });
  }
};

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

    return res.json({
      message: "Seller approved successfully",
    });
  } catch (error) {
    console.error("Approve Seller Error:", error);

    return res.status(500).json({
      message: "Approval failed",
    });
  }
};

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

    return res.json({
      message: "Seller rejected",
    });
  } catch (error) {
    console.error("Reject Seller Error:", error);

    return res.status(500).json({
      message: "Reject failed",
    });
  }
};

/* ======================================================
   👥 GET ALL USERS
====================================================== */

const getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "" } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ users });
  } catch (err) {
    console.error("Get Users Error:", err);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

/* ======================================================
   🚫 BLOCK / UNBLOCK USER
====================================================== */

const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ❌ admin ko block nahi karna
    if (user.role === "admin") {
      return res.status(400).json({
        message: "Cannot block admin",
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: user.isBlocked ? "User blocked" : "User unblocked",
    });
  } catch (err) {
    console.error("Toggle Block Error:", err);

    res.status(500).json({
      message: "Action failed",
    });
  }
};
/* ======================================================
   💰 WITHDRAW REQUESTS
====================================================== */

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

    return res.json(requests);
  } catch (err) {
    console.error("Withdraw Requests Error:", err);

    return res.status(500).json({
      message: "Failed to load requests",
    });
  }
};

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

    return res.json({
      message: "Withdrawal approved",
    });
  } catch (err) {
    console.error("Approve Withdraw Error:", err);

    return res.status(500).json({
      message: "Approval failed",
    });
  }
};

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

    return res.json({
      message: "Withdrawal rejected",
    });
  } catch (err) {
    console.error("Reject Withdraw Error:", err);

    return res.status(500).json({
      message: "Reject failed",
    });
  }
};

/* ======================================================
   EXPORTS
====================================================== */

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
  getAllUsers,
  toggleBlockUser,
  enable2FA,
  verify2FA,
  getAdminLogs,
};