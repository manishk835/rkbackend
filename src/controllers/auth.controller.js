// src/controllers/auth.controller.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

/* ======================================================
   EMAIL TRANSPORTER
====================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ======================================================
   SEND OTP EMAIL
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
   TOKEN GENERATOR
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
   COOKIE OPTIONS
====================================================== */

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

/* ======================================================
   REGISTER
====================================================== */

exports.register = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    // ✅ flexible validation
    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "Name, phone and password required",
      });
    }

    // ✅ phone validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    // ✅ password strong
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // ✅ optional email
    let cleanEmail = null;
    if (email) {
      cleanEmail = email.trim().toLowerCase();

      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail && existingEmail.isVerified) {
        return res.status(400).json({
          message: "Email already registered",
        });
      }
    }

    let user = await User.findOne({ phone });

    if (user && user.isVerified) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    if (!user) {
      user = new User({
        name: name.trim(),
        phone,
        password,
        email: cleanEmail,
      });
    } else {
      user.name = name.trim();
      user.password = password;
      if (cleanEmail) user.email = cleanEmail;
    }

    const otp = user.generateOTP();

    await user.save();

    // ✅ safe send OTP
    if (user.email) {
      await sendOtpEmail(user.email, otp);
    } else {
      console.log("OTP (no email):", otp);
    }

    res.json({
      message: "OTP sent successfully",
      phone,
    });
  } catch (err) {
    console.error("Register Error:", err);

    res.status(500).json({
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

    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP required",
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
        message: "Already verified",
      });
    }

    const isValid = user.verifyOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;

    await user.save();

    res.json({
      message: "Verified successfully",
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);

    res.status(500).json({
      message: "Verification failed",
    });
  }
};

/* ======================================================
   RESEND OTP
====================================================== */

exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone required",
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
        message: "Already verified",
      });
    }

    // 🚫 cooldown check (30 sec)
    if (user.otpExpires && user.otpExpires > Date.now() - 30000) {
      return res.status(429).json({
        message: "Please wait before requesting OTP again",
      });
    }

    const otp = user.generateOTP();

    await user.save();

    // ✅ DEBUG MODE (abhi phone nahi aayega)
    console.log("RESEND OTP:", otp);

    res.json({
      message: "OTP sent",
    });

  } catch (err) {
    console.error("Resend OTP Error:", err);

    res.status(500).json({
      message: "Failed to resend OTP",
    });
  }
};

/* ======================================================
   LOGIN
====================================================== */

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/Phone and password required",
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ phone: cleanIdentifier }, { email: cleanIdentifier }],
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    /* ================= GOOGLE ACCOUNT CHECK ================= */

    if (!user.password || user.password === "google-oauth") {
      return res.status(400).json({
        message: "This account uses Google login. Please sign in with Google.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your account first",
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

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.handleFailedLogin();

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    await user.handleLoginSuccess();

    const token = generateToken(user);

    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

/* ======================================================
   GET ME
====================================================== */

exports.getMe = (req, res) => {
  res.json(req.user);
};

/* ======================================================
   LOGOUT
====================================================== */

exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    message: "Logged out successfully",
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.json({
        message: "If account exists, OTP sent",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hash = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetOtpCode = hash;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    user.resetOtpAttempts = 0;
    user.resetPasswordAllowed = false;

    await user.save();

    await sendOtpEmail(user.email, otp);

    res.json({
      message: "Reset OTP sent",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);

    res.status(500).json({
      message: "Failed to send reset OTP",
    });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (!user.resetOtpCode || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    const hash = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.resetOtpCode !== hash) {
      user.resetOtpAttempts += 1;

      await user.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.resetPasswordAllowed = true;
    user.resetOtpCode = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    res.json({
      message: "OTP verified",
    });
  } catch (err) {
    console.error("Verify Reset OTP Error:", err);

    res.status(500).json({
      message: "Verification failed",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (!user.resetPasswordAllowed) {
      return res.status(403).json({
        message: "OTP verification required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    user.password = password;

    user.resetPasswordAllowed = false;
    user.resetOtpAttempts = 0;

    user.tokenVersion += 1;

    await user.save();

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);

    res.status(500).json({
      message: "Password reset failed",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password incorrect",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    user.password = newPassword;

    user.tokenVersion += 1;

    await user.save();

    res.json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Change Password Error:", err);

    res.status(500).json({
      message: "Password change failed",
    });
  }
};

// src/controllers/auth.controller.js

// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const nodemailer = require("nodemailer");
// const rateLimit = require("express-rate-limit");
// const crypto = require("crypto");
// const PendingUser = require("../models/PendingUser");

// /* ================= RATE LIMIT ================= */
// exports.otpLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 5,
//   message: "Too many OTP requests",
// });

// /* ================= EMAIL ================= */
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendOtpEmail = async (email, otp) => {
//   await transporter.sendMail({
//     from: `"RK Fashion" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "RK Fashion - OTP",
//     html: `<h2>Your OTP: ${otp}</h2>`,
//   });
// };

// /* ================= TOKEN ================= */
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

// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// };

// /* ======================================================
//    LOGIN: SEND OTP (ONLY EXISTING USER)
// ====================================================== */
// exports.sendOtp = async (req, res) => {
//   try {
//     const { identifier } = req.body;

//     if (!identifier) {
//       return res.status(400).json({ message: "Identifier required" });
//     }

//     const clean = identifier.trim().toLowerCase();

//     const user = await User.findOne({
//       $or: [{ email: clean }, { phone: clean }],
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const otp = user.generateOTP();
//     await user.save();

//     if (user.email) {
//       await sendOtpEmail(user.email, otp);
//     }

//     res.json({ message: "OTP sent" });

//   } catch (err) {
//     res.status(500).json({ message: "Failed to send OTP" });
//   }
// };

// /* ======================================================
//    LOGIN: VERIFY OTP
// ====================================================== */
// exports.verifyOTP = async (req, res) => {
//   try {
//     const { identifier, otp } = req.body;

//     const clean = identifier.trim().toLowerCase();

//     const user = await User.findOne({
//       $or: [{ email: clean }, { phone: clean }],
//     });

//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     if (!user.verifyOTP(otp)) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     user.isVerified = true;
//     user.otpCode = undefined;
//     user.otpExpires = undefined;
//     user.otpAttempts = 0;

//     await user.save();

//     const token = generateToken(user);
//     res.cookie("token", token, cookieOptions);

//     res.json({ message: "Login successful", user });

//   } catch {
//     res.status(500).json({ message: "Verification failed" });
//   }
// };

// /* ======================================================
//    REGISTER: SEND OTP (NEW USER)
// ====================================================== */
// exports.register = async (req, res) => {
//   try {
//     const { phone, name, password } = req.body;

//     if (!/^[6-9]\d{9}$/.test(phone)) {
//       return res.status(400).json({ message: "Invalid phone" });
//     }

//     if (!name || password.length < 6) {
//       return res.status(400).json({ message: "Invalid data" });
//     }

//     const existing = await User.findOne({ phone });
//     if (existing) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     await PendingUser.deleteMany({ phone });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const hash = crypto.createHash("sha256").update(otp).digest("hex");

//     await PendingUser.create({
//       phone,
//       name,
//       password,
//       otpCode: hash,
//       otpExpires: Date.now() + 5 * 60 * 1000,
//     });

//     console.log("OTP:", otp);

//     res.json({ message: "OTP sent" });

//   } catch {
//     res.status(500).json({ message: "Register failed" });
//   }
// };

// /* ======================================================
//    REGISTER: VERIFY OTP
// ====================================================== */
// exports.verifyRegisterOtp = async (req, res) => {
//   try {
//     const { phone, otp } = req.body;

//     const pending = await PendingUser.findOne({ phone });

//     if (!pending) {
//       return res.status(400).json({ message: "Session expired" });
//     }

//     if (pending.attempts >= 5) {
//       return res.status(429).json({ message: "Too many attempts" });
//     }

//     const hash = crypto.createHash("sha256").update(otp).digest("hex");

//     if (pending.otpCode !== hash || pending.otpExpires < Date.now()) {
//       pending.attempts += 1;
//       await pending.save();
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     const user = await User.create({
//       phone: pending.phone,
//       name: pending.name,
//       password: pending.password,
//       isVerified: true,
//     });

//     await PendingUser.deleteOne({ phone });

//     const token = generateToken(user);
//     res.cookie("token", token, cookieOptions);

//     res.json({ message: "Account created", user });

//   } catch {
//     res.status(500).json({ message: "Verification failed" });
//   }
// };

// /* ======================================================
//    RESEND OTP (LOGIN)
// ====================================================== */
// exports.resendOtp = async (req, res) => {
//   try {
//     const { identifier } = req.body;

//     const user = await User.findOne({
//       $or: [{ email: identifier }, { phone: identifier }],
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const otp = user.generateOTP();
//     await user.save();

//     if (user.email) {
//       await sendOtpEmail(user.email, otp);
//     }

//     res.json({ message: "OTP resent" });

//   } catch {
//     res.status(500).json({ message: "Failed" });
//   }
// };

// /* ======================================================
//    LOGOUT
// ====================================================== */
// exports.logout = (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });

//   res.json({ message: "Logged out" });
// };

// /* ======================================================
//    LOGIN
// ====================================================== */

// exports.login = async (req, res) => {

//   try {

//     const { identifier, password } = req.body;

//     if (!identifier || !password) {
//       return res.status(400).json({
//         message: "Email/Phone and password required",
//       });
//     }

//     const cleanIdentifier = identifier.trim().toLowerCase();

//     const user = await User.findOne({
//       $or: [
//         { phone: cleanIdentifier },
//         { email: cleanIdentifier },
//       ],
//     }).select("+password");

//     if (!user) {
//       return res.status(400).json({
//         message: "Invalid credentials",
//       });
//     }

//     /* ================= GOOGLE ACCOUNT CHECK ================= */

//     if (!user.password || user.password === "google-oauth") {
//       return res.status(400).json({
//         message: "This account uses Google login. Please sign in with Google.",
//       });
//     }

//     if (!user.isVerified) {
//       return res.status(403).json({
//         message: "Please verify your account first",
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         message: "Account blocked",
//       });
//     }

//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       return res.status(423).json({
//         message: "Account temporarily locked",
//       });
//     }

//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) {

//       await user.handleFailedLogin();

//       return res.status(400).json({
//         message: "Invalid credentials",
//       });

//     }

//     await user.handleLoginSuccess();

//     const token = generateToken(user);

//     res.cookie("token", token, cookieOptions);

//     res.json({
//       message: "Login successful",
//       user: {
//         _id: user._id,
//         name: user.name,
//         phone: user.phone,
//         email: user.email,
//         role: user.role,
//       },
//     });

//   } catch (err) {

//     console.error("Login Error:", err);

//     res.status(500).json({
//       message: "Login failed",
//     });

//   }

// };

// /* ======================================================
//    GET ME
// ====================================================== */

// exports.getMe = (req, res) => {
//   res.json(req.user);
// };

// /* ======================================================
//    LOGOUT
// ====================================================== */

// exports.logout = (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });

//   res.json({
//     message: "Logged out successfully",
//   });
// };

// exports.forgotPassword = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     if (!phone) {
//       return res.status(400).json({
//         message: "Phone required",
//       });
//     }

//     const user = await User.findOne({ phone });

//     if (!user) {
//       return res.json({
//         message: "If account exists, OTP sent",
//       });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     user.resetOtpCode = otp;
//     user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
//     user.resetOtpAttempts = 0;
//     user.resetPasswordAllowed = false;

//     await user.save();

//     await sendOtpEmail(user.email, otp);

//     res.json({
//       message: "Reset OTP sent",
//     });
//   } catch (err) {
//     console.error("Forgot Password Error:", err);

//     res.status(500).json({
//       message: "Failed to send reset OTP",
//     });
//   }
// };

// exports.verifyResetOtp = async (req, res) => {
//   try {
//     const { phone, otp } = req.body;

//     const user = await User.findOne({ phone });

//     if (!user) {
//       return res.status(400).json({
//         message: "User not found",
//       });
//     }

//     if (!user.resetOtpCode || user.resetOtpExpires < Date.now()) {
//       return res.status(400).json({
//         message: "OTP expired",
//       });
//     }

//     if (user.resetOtpCode !== otp) {
//       user.resetOtpAttempts += 1;

//       await user.save();

//       return res.status(400).json({
//         message: "Invalid OTP",
//       });
//     }

//     user.resetPasswordAllowed = true;
//     user.resetOtpCode = undefined;
//     user.resetOtpExpires = undefined;

//     await user.save();

//     res.json({
//       message: "OTP verified",
//     });
//   } catch (err) {
//     console.error("Verify Reset OTP Error:", err);

//     res.status(500).json({
//       message: "Verification failed",
//     });
//   }
// };

// exports.resetPassword = async (req, res) => {
//   try {
//     const { phone, password } = req.body;

//     const user = await User.findOne({ phone }).select("+password");

//     if (!user) {
//       return res.status(400).json({
//         message: "User not found",
//       });
//     }

//     if (!user.resetPasswordAllowed) {
//       return res.status(403).json({
//         message: "OTP verification required",
//       });
//     }

//     if (password.length < 8) {
//       return res.status(400).json({
//         message: "Password must be at least 8 characters",
//       });
//     }

//     user.password = password;

//     user.resetPasswordAllowed = false;
//     user.resetOtpAttempts = 0;

//     user.tokenVersion += 1;

//     await user.save();

//     res.json({
//       message: "Password reset successful",
//     });
//   } catch (err) {
//     console.error("Reset Password Error:", err);

//     res.status(500).json({
//       message: "Password reset failed",
//     });
//   }
// };

// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     const user = await User.findById(req.user._id).select("+password");

//     const isMatch = await user.comparePassword(currentPassword);

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Current password incorrect",
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         message: "Password must be at least 8 characters",
//       });
//     }

//     user.password = newPassword;

//     user.tokenVersion += 1;

//     await user.save();

//     res.json({
//       message: "Password updated successfully",
//     });
//   } catch (err) {
//     console.error("Change Password Error:", err);

//     res.status(500).json({
//       message: "Password change failed",
//     });
//   }
// };
