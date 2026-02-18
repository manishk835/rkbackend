// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRE_TIME = 10 * 60 * 1000; // 10 minutes

const userSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "seller"],
      default: "user",
    },

    /* ================= SELLER ================= */

    isSellerApproved: {
      type: Boolean,
      default: false,
    },

    sellerProfileCompleted: {
      type: Boolean,
      default: false,
    },

    walletBalance: {
      type: Number,
      default: 0,
    },
    /* ================= SELLER INFO ================= */

    sellerInfo: {
      storeName: { type: String, trim: true },
      storeDescription: { type: String },
      gstNumber: { type: String },
      panNumber: { type: String },
    },

    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },
    
    

    sellerRequestedAt: Date,
    sellerApprovedAt: Date,
    sellerRejectedAt: Date,

    /* ================= WISHLIST ================= */

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    /* ================= VERIFICATION ================= */

    isVerified: {
      type: Boolean,
      default: false,
    },

    otpCode: String,
    otpExpires: Date,

    /* ================= SECURITY ================= */

    isBlocked: {
      type: Boolean,
      default: false,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,

    tokenVersion: {
      type: Number,
      default: 0,
    },

    lastLogin: Date,

    /* ================= LOYALTY ================= */

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    /* ================= PASSWORD RESET ================= */

    resetOtpCode: String,
    resetOtpExpires: Date,
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },
    /* ================= RESET PASSWORD ================= */

    resetPasswordAllowed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ createdAt: -1 });

/* ================= PASSWORD HASH ================= */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/* ================= METHODS ================= */

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otp;
  this.otpExpires = Date.now() + OTP_EXPIRE_TIME;
  return otp;
};

module.exports = mongoose.model("User", userSchema);
