// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* ======================================================
   CONSTANTS
====================================================== */

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

/* ======================================================
   SCHEMA
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

    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* ================= WISHLIST ================= */

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    /* ================= ACCOUNT SECURITY ================= */

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
  },
  { timestamps: true }
);

/* ======================================================
   INDEXES (ONLY HERE — NO DUPLICATE)
====================================================== */

userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ createdAt: -1 });

/* ======================================================
   PASSWORD HASH
====================================================== */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});


/* ======================================================
   METHODS
====================================================== */

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.handleFailedLogin = async function () {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = Date.now() + LOCK_TIME;
  }

  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

/* ======================================================
   EXPORT
====================================================== */

module.exports = mongoose.model("User", userSchema);

