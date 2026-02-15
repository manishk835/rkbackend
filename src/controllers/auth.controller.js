const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

/* ======================================================
   EMAIL TRANSPORTER (GMAIL)
====================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ======================================================
   SEND OTP EMAIL FUNCTION
====================================================== */

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"RK Fashion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "RK Fashion - OTP Verification",
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>OTP Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:5px">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      </div>
    `,
  });
};

/* ======================================================
   TOKEN HELPER
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
   REGISTER (WITH OTP + EMAIL)
====================================================== */

exports.register = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !phone || !password || !email) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    let user = await User.findOne({ phone });

    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!user) {
      user = new User({
        name: name.trim(),
        phone,
        password,
        email,
      });
    } else {
      user.name = name.trim();
      user.password = password;
      user.email = email;
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent to your email",
      phone,
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

/* ======================================================
   VERIFY OTP
====================================================== */

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Invalid OTP format",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    if (!user.otpCode || user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired. Please request again.",
      });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

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
   RESEND OTP (WITH RATE LIMIT FIXED)
====================================================== */

exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number required",
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

    // 🔒 Prevent spam (allow resend only after expiry)
    if (user.otpExpires && user.otpExpires > Date.now()) {
      return res.status(400).json({
        message: "OTP already sent. Please wait before requesting again.",
      });
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOtpEmail(user.email, otp);

    return res.json({
      message: "OTP resent to your email",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({
      message: "Failed to resend OTP",
    });
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

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        message: "Account temporarily locked",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Reset login attempts
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
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password incorrect",
      });
    }

    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({
      message: "Password change failed",
    });
  }
};

/* ======================================================
   FORGOT PASSWORD (SEND RESET OTP)
====================================================== */

/* ======================================================
   FORGOT PASSWORD (SEND RESET OTP - SECURE)
====================================================== */

exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

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

    // 🔐 Do NOT reveal if user exists
    if (!user) {
      return res.json({
        message: "If this number exists, OTP has been sent",
      });
    }

    // 🚫 Prevent spam (if OTP still valid)
    if (user.resetOtpExpires && user.resetOtpExpires > Date.now()) {
      return res.status(400).json({
        message: "OTP already sent. Please wait before requesting again.",
      });
    }

    // 🔐 Generate new reset OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtpCode = resetOtp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetOtpAttempts = 0;

    await user.save();

    // 📧 Send email OTP
    await sendOtpEmail(user.email, resetOtp);

    return res.json({
      message: "If this number exists, OTP has been sent",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

/* ======================================================
   VERIFY RESET OTP
====================================================== */

exports.verifyResetOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

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
        message: "Invalid request",
      });
    }

    // ✅ CHECK RESET OTP ONLY
    if (!user.resetOtpCode || !user.resetOtpExpires) {
      return res.status(400).json({
        message: "No reset OTP requested",
      });
    }

    if (user.resetOtpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (user.resetOtpCode !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // ✅ Allow password reset
    user.resetPasswordAllowed = true;

    // Clear reset OTP
    user.resetOtpCode = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    return res.json({
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};


/* ======================================================
   RESET PASSWORD (AFTER OTP VERIFIED)
====================================================== */

exports.resetPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    // 🔐 CRITICAL CHECK
    if (!user.resetPasswordAllowed) {
      return res.status(403).json({
        message: "OTP verification required",
      });
    }

    user.password = password; // will hash automatically
    user.tokenVersion += 1;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    // 🔥 Disable reset access after use
    user.resetPasswordAllowed = false;

    await user.save();

    return res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      message: "Password reset failed",
    });
  }
};