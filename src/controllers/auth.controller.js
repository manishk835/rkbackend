// src/controllers/auth.controller.js
const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};


// // src/controllers/auth.controller.js

// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// // runtime hash
// const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// exports.adminLogin = async (req, res) => {
//   const { email, password } = req.body;

//   if (email !== ADMIN_EMAIL) {
//     return res.status(401).json({ message: "Invalid credentials" });
//   }

//   const isMatch = bcrypt.compareSync(password, hashedPassword);
//   if (!isMatch) {
//     return res.status(401).json({ message: "Invalid credentials" });
//   }

//   const token = jwt.sign(
//     { role: "admin" },
//     process.env.JWT_SECRET,
//     { expiresIn: "1d" }
//   );

//   res.json({ token });
// };
