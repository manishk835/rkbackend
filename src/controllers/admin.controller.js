// src/controllers/admin.controller.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ======================================================
   ADMIN LOGIN
====================================================== */
exports.adminLogin = async (req, res) => {
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
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Admin login successful" });

  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ======================================================
   ADMIN LOGOUT
====================================================== */
exports.adminLogout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Admin logged out" });
};

/* ======================================================
   GET PENDING SELLERS
====================================================== */
exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: "seller",
      sellerStatus: "pending",
    }).select("-password");

    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sellers" });
  }
};

/* ======================================================
   APPROVE SELLER
====================================================== */
exports.approveSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    user.sellerStatus = "approved";
    user.sellerApprovedAt = new Date();

    await user.save();

    res.json({ message: "Seller approved successfully" });

  } catch (error) {
    res.status(500).json({ message: "Approval failed" });
  }
};

/* ======================================================
   REJECT SELLER
====================================================== */
exports.rejectSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    user.sellerStatus = "rejected";
    user.sellerRejectedAt = new Date();

    await user.save();

    res.json({ message: "Seller rejected successfully" });

  } catch (error) {
    res.status(500).json({ message: "Rejection failed" });
  }
};
