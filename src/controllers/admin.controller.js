// src/controllers/admin.controller.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ================= ADMIN LOGIN ================= */

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("========= ADMIN LOGIN ATTEMPT =========");
    console.log("Email:", email);
    console.log("Password (plain):", password);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const admin = await User.findOne({ email }).select("+password");

    if (!admin) {
      console.log("No user found");
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    console.log("User role:", admin.role);
    console.log("Hashed password:", admin.password);

    if (admin.role !== "admin") {
      return res.status(401).json({
        message: "Not authorized as admin",
      });
    }

    const isMatch = await admin.comparePassword(password);

    console.log("Password match:", isMatch);

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
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Admin login successful");

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

/* ================= EXPORTS ================= */

module.exports = {
  adminLogin,
  adminLogout,
};