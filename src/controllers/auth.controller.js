const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs")

/* ================= TOKEN HELPER ================= */

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
   REGISTER (WITH OTP)
====================================================== */

exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    /* ===== BASIC VALIDATION ===== */
    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    let user = await User.findOne({ phone }).select("+password");

    /* ===== CASE 1: Already verified user ===== */
    if (user && user.isVerified) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    /* ===== CASE 2: New user ===== */
    if (!user) {
      user = new User({
        name: name.trim(),
        phone,
        password,
      });
    } 
    /* ===== CASE 3: Existing but not verified ===== */
    else {
      user.name = name.trim();
      user.password = password; // will auto-hash
    }

    /* ===== GENERATE OTP ===== */
    const otp = user.generateOTP();
    await user.save();

    // ⚠️ Production me SMS bhejna hoga
    console.log("📲 OTP for", phone, ":", otp);

    return res.status(200).json({
      message: "OTP sent to your phone",
      phone,
    });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({
      message: "Registration failed",
    });
  }
};


/* ======================================================
   VERIFY OTP
====================================================== */

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    /* ===== BASIC VALIDATION ===== */
    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Invalid OTP format",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Phone already verified",
      });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        message: "No OTP requested",
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired. Please request again",
      });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    /* ===== SUCCESS ===== */
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;

    await user.save();

    return res.json({
      message: "Phone verified successfully",
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};


/* ======================================================
   RESEND OTP
====================================================== */
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    /* ===== VALIDATION ===== */
    if (!phone) {
      return res.status(400).json({
        message: "Phone number required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    /* ===== RATE LIMIT (Prevent Spam) ===== */
    // Agar OTP abhi bhi valid hai → resend allow nahi
    if (user.otpExpires && user.otpExpires > Date.now()) {
      return res.status(400).json({
        message: "OTP already sent. Please wait before requesting again.",
      });
    }

    /* ===== GENERATE NEW OTP ===== */
    const newOtp = user.generateOTP(); // use model method
    await user.save();

    console.log("🔁 Resent OTP for", phone, ":", newOtp);

    return res.json({
      message: "OTP resent successfully",
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({
      message: "Failed to resend OTP",
    });
  }
};




/* ======================================================
   LOGIN (ONLY VERIFIED USERS)
====================================================== */

// exports.login = async (req, res) => {
//   try {
//     const { phone, password } = req.body;

//     const user = await User.findOne({ phone }).select("+password");

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     if (!user.isVerified) {
//       return res.status(403).json({
//         message: "Please verify your phone first",
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({ message: "Account blocked" });
//     }

//     if (user.isLocked()) {
//       return res.status(423).json({
//         message: "Account temporarily locked",
//       });
//     }

//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

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
//     console.error("Login Error:", err);
//     res.status(500).json({ message: "Login failed" });
//   }
// };
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
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your phone first",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked",
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        message: "Account temporarily locked. Try later.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 🔥 Reset attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
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

// // controllers/auth.controllers.js

// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const bcrypt = require("bcryptjs")
// /* ======================================================
//    HELPER: GENERATE TOKEN
// ====================================================== */

// const generateToken = (user) => {
//   return jwt.sign(
//     {
//       id: user._id,
//       role: user.role,
//       tokenVersion: user.tokenVersion,
//     },
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
//       return res.status(400).json({ message: "All fields required" });
//     }

//     const existing = await User.findOne({ phone });
//     if (existing) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     await User.create({ name, phone, password });

//     res.status(201).json({ message: "Account created successfully" });
//   } catch (err) {
//     console.error("Register Error:", err);
//     res.status(500).json({ message: "Registration failed" });
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
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({ message: "Account blocked" });
//     }

//     if (user.isLocked()) {
//       return res.status(423).json({
//         message: "Account temporarily locked. Try later.",
//       });
//     }

//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) {
//       await user.handleFailedLogin();
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     await user.resetLoginAttempts();

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
//     console.error("Login Error:", err);
//     res.status(500).json({ message: "Login failed" });
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

//   res.json({ message: "Logged out successfully" });
// };

// /* ======================================================
//    CHANGE PASSWORD
// ====================================================== */

// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         message: "Both passwords required",
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         message: "Password must be at least 8 characters",
//       });
//     }

//     const user = await User.findById(req.user._id).select("+password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isMatch = await user.comparePassword(currentPassword);

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Current password incorrect",
//       });
//     }

//     user.password = newPassword;
//     user.tokenVersion += 1; // invalidate old tokens
//     await user.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (err) {
//     console.error("Change Password Error:", err);
//     res.status(500).json({ message: "Password change failed" });
//   }
// };