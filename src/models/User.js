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
      maxlength: 100,
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
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

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
      index: true,
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
  },
  { timestamps: true }
);

/* ======================================================
   PASSWORD HASH MIDDLEWARE
====================================================== */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
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
   CHECK IF ACCOUNT IS LOCKED
====================================================== */

userSchema.methods.isLocked = function () {
  if (!this.lockUntil) return false;
  return this.lockUntil > Date.now();
};

/* ======================================================
   STATIC: FIND ADMINS
====================================================== */

userSchema.statics.findAdmins = function () {
  return this.find({ role: "admin" });
};

/* ======================================================
   STATIC: FIND USERS
====================================================== */

userSchema.statics.findUsers = function () {
  return this.find({ role: "user" });
};

module.exports = mongoose.model("User", userSchema);
