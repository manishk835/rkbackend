const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/,
      index: true,
    },

    password: {
      type: String,
      select: false, // 🔥 never return password
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    /* ================= OTP ================= */
    otp: {
      type: String,
      select: false,
    },

    otpExpiry: {
      type: Date,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    /* ================= ACCOUNT SECURITY ================= */
    isBlocked: {
      type: Boolean,
      default: false,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

/* ======================================================
   PASSWORD HASH MIDDLEWARE
====================================================== */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password)
    return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* ======================================================
   PASSWORD COMPARE METHOD
====================================================== */
userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ======================================================
   AUTO UNLOCK IF LOCK EXPIRED
====================================================== */
userSchema.methods.isLocked = function () {
  return (
    this.lockUntil && this.lockUntil > Date.now()
  );
};

module.exports = mongoose.model("User", userSchema);
