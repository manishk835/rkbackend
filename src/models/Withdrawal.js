// src/models/Withdrawal.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   ACCOUNT DETAILS SCHEMA
====================================================== */

const accountDetailsSchema =
  new mongoose.Schema(
    {
      /* ================= UPI ================= */

      upiId: {
        type: String,

        trim: true,

        lowercase: true,
      },

      /* ================= BANK ================= */

      bankName: {
        type: String,

        trim: true,
      },

      accountNumber: {
        type: String,

        trim: true,
      },

      ifsc: {
        type: String,

        trim: true,

        uppercase: true,
      },

      accountHolderName:
        {
          type: String,

          trim: true,
        },
    },

    {
      _id: false,
    }
  );

/* ======================================================
   WITHDRAWAL SCHEMA
====================================================== */

const withdrawalSchema =
  new mongoose.Schema(
    {
      /* ================= SELLER ================= */

      seller: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* ================= AMOUNT ================= */

      amount: {
        type: Number,

        required: true,

        min: 1,
      },

      /* ================= STATUS ================= */

      status: {
        type: String,

        enum: [
          "Pending",
          "Approved",
          "Rejected",
          "Paid",
        ],

        default:
          "Pending",

        index: true,
      },

      /* ================= METHOD ================= */

      method: {
        type: String,

        enum: [
          "Bank",
          "UPI",
        ],

        required: true,
      },

      /* ================= ACCOUNT DETAILS ================= */

      accountDetails:
        {
          type:
            accountDetailsSchema,

          required: true,
        },

      /* ================= TRACKING ================= */

      requestId: {
        type: String,

        unique: true,

        index: true,
      },

      transactionId: {
        type: String,

        trim: true,
      },

      /* ================= ADMIN ================= */

      processedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      processedAt: {
        type: Date,
      },

      adminNote: {
        type: String,

        trim: true,

        maxlength: 500,
      },

      rejectionReason: {
        type: String,

        trim: true,

        maxlength: 500,
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

withdrawalSchema.index({
  status: 1,
  createdAt: -1,
});

withdrawalSchema.index({
  seller: 1,
  createdAt: -1,
});

withdrawalSchema.index({
  requestId: 1,
});

/* ======================================================
   AUTO REQUEST ID
====================================================== */

withdrawalSchema.pre(
  "save",

  function (next) {

    if (
      !this.requestId
    ) {

      this.requestId =
        "WD-" +
        Date.now() +
        "-" +
        Math.floor(
          Math.random() *
            10000
        );
    }

    next();
  }
);

/* ======================================================
   AUTO PROCESS DATE
====================================================== */

withdrawalSchema.pre(
  "save",

  function (next) {

    if (
      this.isModified(
        "status"
      ) &&
      [
        "Approved",
        "Rejected",
        "Paid",
      ].includes(
        this.status
      ) &&
      !this.processedAt
    ) {

      this.processedAt =
        new Date();
    }

    next();
  }
);

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .Withdrawal ||
  mongoose.model(
    "Withdrawal",
    withdrawalSchema
  );