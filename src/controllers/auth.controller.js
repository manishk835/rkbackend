// controllers/auth.controllers.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs")
/* ======================================================
   HELPER: GENERATE TOKEN
====================================================== */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ======================================================
   REGISTER
====================================================== */

exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    await User.create({ name, phone, password });

    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ======================================================
   LOGIN
====================================================== */

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password required",
      });
    }

    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Account blocked" });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        message: "Account temporarily locked. Try later.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.handleFailedLogin();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await user.resetLoginAttempts();

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ======================================================
   GET ME
====================================================== */

exports.getMe = async (req, res) => {
  res.json(req.user);
};

/* ======================================================
   LOGOUT
====================================================== */

exports.logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Logged out successfully" });
};

/* ======================================================
   CHANGE PASSWORD
====================================================== */

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both passwords required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password incorrect",
      });
    }

    user.password = newPassword;
    user.tokenVersion += 1; // invalidate old tokens
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: "Password change failed" });
  }
};



// // controllers/auth.controllers
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// /* ======================================================
//    HELPER: GENERATE TOKEN
// ====================================================== */

// const generateToken = (user) => {
//   return jwt.sign(
//     { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );
// };


// /* ======================================================
//    REGISTER
// ====================================================== */

// exports.register = async (req, res) => {
//   try {
//     const { name, phone, password } = req.body;

//     if (!name || !phone || !password) {
//       return res.status(400).json({
//         message: "All fields required",
//       });
//     }

//     const existing = await User.findOne({ phone });

//     if (existing) {
//       return res.status(400).json({
//         message: "User already exists",
//       });
//     }

//     const user = await User.create({
//       name,
//       phone,
//       password,
//     });

//     res.status(201).json({
//       message: "Account created successfully",
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Registration failed",
//     });
//   }
// };

// /* ======================================================
//    LOGIN
// ====================================================== */

// exports.login = async (req, res) => {
//   try {
//     const { phone, password } = req.body;

//     if (!phone || !password) {
//       return res.status(400).json({
//         message: "Phone and password required",
//       });
//     }

//     const user = await User.findOne({ phone }).select("+password");

//     if (!user) {
//       return res.status(400).json({
//         message: "Invalid credentials",
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         message: "Account is blocked",
//       });
//     }

//     if (user.isLocked()) {
//       return res.status(423).json({
//         message: "Account temporarily locked. Try later.",
//       });
//     }

//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) {
//       user.failedLoginAttempts += 1;

//       if (user.failedLoginAttempts >= 5) {
//         user.lockUntil = Date.now() + 15 * 60 * 1000;
//         user.failedLoginAttempts = 0;
//       }

//       await user.save();

//       return res.status(400).json({
//         message: "Invalid credentials",
//       });
//     }

//     // reset login attempts
//     user.failedLoginAttempts = 0;
//     user.lockUntil = undefined;
//     user.lastLogin = new Date();
//     await user.save();

//     const token = generateToken(user);

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({ message: "Login successful" });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Login failed",
//     });
//   }
// };

// /* ======================================================
//    GET ME
// ====================================================== */

// exports.getMe = async (req, res) => {
//   res.json(req.user);
// };

// /* ======================================================
//    LOGOUT
// ====================================================== */

// exports.logout = async (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });

//   res.json({
//     message: "Logged out",
//   });
// };
