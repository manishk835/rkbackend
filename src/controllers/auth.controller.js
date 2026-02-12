const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");

/* ======================================================
   HELPERS
====================================================== */

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOTP = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

/* ======================================================
   LOGIN (SEND OTP)
====================================================== */

exports.login = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name,
        phone,
      });
    }

    const otp = generateOTP();

    user.otp = hashOTP(otp);
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;

    await user.save();

    console.log("OTP:", otp); // replace with SMS provider

    res.json({
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Login failed",
    });
  }
};

/* ======================================================
   VERIFY OTP
====================================================== */

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user || !user.otp) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many attempts. Try later.",
      });
    }

    const hashed = hashOTP(otp);

    if (hashed !== user.otp) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    

    res.json({
      message: "Login successful",
    });
    user.lastLogin = new Date();
    await user.save();

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Verification failed",
    });
  }
};

/* ======================================================
   GET ME
====================================================== */

exports.getMe = async (req, res) => {
  res.json(req.user);
};

/* ======================================================
   FORGOT PASSWORD
====================================================== */

exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.json({
        message: "If phone exists, OTP sent",
      });
    }

    const otp = generateOTP();

    user.otp = hashOTP(otp);
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;

    await user.save();

    console.log("Reset OTP:", otp);

    res.json({
      message: "OTP sent",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error sending OTP",
    });
  }
};

/* ======================================================
   RESET PASSWORD
====================================================== */

exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, password } = req.body;

    const user = await User.findOne({ phone });

    if (!user || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const hashedOTP = hashOTP(otp);

    if (hashedOTP !== user.otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    res.status(500).json({
      message: "Reset failed",
    });
  }
};

/* ======================================================
   LOGOUT
====================================================== */

exports.logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    message: "Logged out",
  });
};
