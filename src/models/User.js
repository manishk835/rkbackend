const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const SALT_ROUNDS = 12;
const OTP_EXPIRE_TIME = 10 * 60 * 1000;

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

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/,
  },

  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // allow null values
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
    immutable: true,
  },

  /* ================= GOOGLE AUTH ================= */

  googleId: {
    type: String,
    sparse: true,
  },

  /* ================= SELLER ================= */

  sellerStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
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
      maxlength: 120,
    },

    storeDescription: {
      type: String,
      maxlength: 1000,
    },

    gstNumber: String,
    panNumber: String,

  },

  /* ================= WALLET ================= */

  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },

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

  /* ================= LOGIN SECURITY ================= */

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

  /* ================= PASSWORD RESET ================= */

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
userSchema.index({ createdAt: -1 });

/* ======================================================
   PASSWORD HASH
====================================================== */

// userSchema.pre("save", async function (next) {

//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(SALT_ROUNDS);

//   this.password = await bcrypt.hash(this.password, salt);

//   next();

// });
/* ================= PASSWORD HASH ================= */

userSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);

});
/* ======================================================
   PASSWORD COMPARE
====================================================== */

userSchema.methods.comparePassword = function (candidatePassword) {

  return bcrypt.compare(candidatePassword, this.password);

};

/* ======================================================
   GENERATE OTP
====================================================== */

userSchema.methods.generateOTP = function () {

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  this.otpCode = hash;
  this.otpExpires = Date.now() + OTP_EXPIRE_TIME;
  this.otpAttempts = 0;

  return otp;

};

/* ======================================================
   VERIFY OTP
====================================================== */

userSchema.methods.verifyOTP = function (otp) {

  if (this.otpAttempts >= 5) return false;

  const hash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  const isValid =
    this.otpCode === hash &&
    this.otpExpires > Date.now();

  if (!isValid) {
    this.otpAttempts += 1;
  }

  return isValid;

};

/* ======================================================
   FAILED LOGIN HANDLER
====================================================== */

userSchema.methods.handleFailedLogin = async function () {

  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000;
  }

  await this.save();

};

/* ======================================================
   SUCCESS LOGIN HANDLER
====================================================== */

userSchema.methods.handleLoginSuccess = async function () {

  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();

  await this.save();

};

module.exports = mongoose.model("User", userSchema);