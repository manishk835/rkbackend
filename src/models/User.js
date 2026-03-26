// src/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const SALT_ROUNDS = 12;
const OTP_EXPIRE_TIME = 5 * 60 * 1000;

/* ======================================================
   WALLET TRANSACTION
====================================================== */

const walletTxnSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    source: {
      type: String,
      enum: ["order", "withdrawal", "refund", "adjustment"],
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    note: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ======================================================
   USER SCHEMA
====================================================== */

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

    // email: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   lowercase: true,
    //   trim: true,
    //   match: /^\S+@\S+\.\S+$/,
    // },
    email: {
      type: String,
      unique: true,
      sparse: true, // ✅ important
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: /^[6-9]\d{9}$/,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
    },

    /* ================= ROLE ================= */

    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },

    /* ================= GOOGLE ================= */

    googleId: {
      type: String,
      sparse: true,
    },

    /* ======================================================
     🔥 BUSINESS TYPE (FINAL CORE SYSTEM)
  ====================================================== */

    businessType: {
      type: String,
      enum: ["fashion", "medical", "grocery", "electronics", "general"],
      default: null,
      index: true,
    },

    /* ================= SELLER ================= */

    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
      index: true,
    },

    sellerProfileCompleted: {
      type: Boolean,
      default: false,
    },

    sellerRequestedAt: Date,
    sellerApprovedAt: Date,
    sellerRejectedAt: Date,

    sellerInfo: {
      storeName: {
        type: String,
        trim: true,
      },
      storeDescription: String,
      gstNumber: String,
      panNumber: String,
    },

    /* ================= WALLET ================= */

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    walletTransactions: [walletTxnSchema],

    /* ================= WISHLIST ================= */

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    /* ================= ACCOUNT ================= */

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    /* ================= OTP ================= */

    otpCode: String,
    otpExpires: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },

    /* ================= LOGIN ================= */

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,
    lastLogin: Date,

    tokenVersion: {
      type: Number,
      default: 0,
    },

    /* ================= RESET ================= */

    resetOtpCode: String,
    resetOtpExpires: Date,
    resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    resetPasswordAllowed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ======================================================
   INDEXES
====================================================== */

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ sellerStatus: 1 });
userSchema.index({ businessType: 1 });
userSchema.index({ createdAt: -1 });

/* ======================================================
   PASSWORD HASH
====================================================== */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ======================================================
   WALLET METHODS
====================================================== */

userSchema.methods.creditWallet = async function ({
  amount,
  source = "order",
  orderId,
  note,
}) {
  this.walletBalance += amount;

  this.walletTransactions.push({
    type: "credit",
    amount,
    source,
    orderId,
    note,
    status: "completed",
  });

  await this.save();
};

userSchema.methods.debitWallet = async function ({
  amount,
  source = "withdrawal",
  note,
}) {
  if (this.walletBalance < amount) {
    throw new Error("Insufficient balance");
  }

  this.walletBalance -= amount;

  this.walletTransactions.push({
    type: "debit",
    amount,
    source,
    note,
    status: "completed",
  });

  await this.save();
};

/* ======================================================
   PASSWORD COMPARE
====================================================== */

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ======================================================
   OTP METHODS
====================================================== */

userSchema.methods.generateOTP = function () {

  // 🚫 prevent spam (30 sec rule)
  if (this.otpExpires && this.otpExpires > Date.now() - 30000) {
    throw new Error("OTP already sent. Please wait");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hash = crypto.createHash("sha256").update(otp).digest("hex");

  this.otpCode = hash;
  this.otpExpires = Date.now() + OTP_EXPIRE_TIME;
  this.otpAttempts = 0;

  return otp;
};

userSchema.methods.verifyOTP = function (otp) {

  // 🚫 expired
  if (!this.otpExpires || this.otpExpires < Date.now()) {
    return false;
  }

  // 🚫 too many attempts
  if (this.otpAttempts >= 5) {
    return false;
  }

  const hash = crypto.createHash("sha256").update(otp).digest("hex");

  const isValid = this.otpCode === hash;

  if (!isValid) {
    this.otpAttempts += 1;
  }

  return isValid;
};

/* ======================================================
   LOGIN HANDLERS
====================================================== */

userSchema.methods.handleFailedLogin = async function () {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000;
  }

  await this.save();
};

userSchema.methods.handleLoginSuccess = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();

  await this.save();
};

module.exports = mongoose.model("User", userSchema);
