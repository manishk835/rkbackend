// src/controllers/coupon.controller.js

const Coupon = require(
  "../models/Coupon"
);

const Order = require(
  "../models/Order"
);

/* ======================================================
   CREATE COUPON
====================================================== */

exports.createCoupon =
  async (req, res) => {
    try {

      const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        perUserLimit,
        expiresAt,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (!code) {
        return res.status(400).json({
          message:
            "Coupon code required",
        });
      }

      if (
        !discountType
      ) {
        return res.status(400).json({
          message:
            "Discount type required",
        });
      }

      if (
        !discountValue ||
        Number(
          discountValue
        ) <= 0
      ) {
        return res.status(400).json({
          message:
            "Valid discount value required",
        });
      }

      /* ================= CODE ================= */

      const normalizedCode =
        code
          .trim()
          .toUpperCase();

      const existing =
        await Coupon.findOne({
          code:
            normalizedCode,
        });

      if (existing) {
        return res.status(400).json({
          message:
            "Coupon already exists",
        });
      }

      /* ================= CREATE ================= */

      const coupon =
        await Coupon.create({
          code:
            normalizedCode,

          discountType,

          discountValue:
            Number(
              discountValue
            ),

          minOrderAmount:
            Number(
              minOrderAmount
            ) || 0,

          maxDiscountAmount:
            Number(
              maxDiscountAmount
            ) || null,

          usageLimit:
            Number(
              usageLimit
            ) || null,

          perUserLimit:
            Number(
              perUserLimit
            ) || 1,

          expiresAt,

          isActive: true,
        });

      return res.status(201).json({
        success: true,

        message:
          "Coupon created",

        coupon,
      });

    } catch (err) {

      console.error(
        "CREATE COUPON ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message ||
          "Coupon creation failed",
      });
    }
  };

/* ======================================================
   GET ALL COUPONS
====================================================== */

exports.getCoupons =
  async (req, res) => {
    try {

      const coupons =
        await Coupon.find()
          .sort({
            createdAt: -1,
          })

          .lean();

      return res.json({
        success: true,

        count:
          coupons.length,

        coupons,
      });

    } catch (err) {

      console.error(
        "GET COUPONS ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to fetch coupons",
      });
    }
  };

/* ======================================================
   TOGGLE COUPON STATUS
====================================================== */

exports.toggleCoupon =
  async (req, res) => {
    try {

      const coupon =
        await Coupon.findById(
          req.params.id
        );

      if (!coupon) {
        return res.status(404).json({
          message:
            "Coupon not found",
        });
      }

      coupon.isActive =
        !coupon.isActive;

      await coupon.save();

      return res.json({
        success: true,

        message:
          coupon.isActive
            ? "Coupon activated"
            : "Coupon deactivated",

        coupon,
      });

    } catch (err) {

      console.error(
        "TOGGLE COUPON ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Toggle failed",
      });
    }
  };

/* ======================================================
   DELETE COUPON
====================================================== */

exports.deleteCoupon =
  async (req, res) => {
    try {

      const coupon =
        await Coupon.findById(
          req.params.id
        );

      if (!coupon) {
        return res.status(404).json({
          message:
            "Coupon not found",
        });
      }

      await coupon.deleteOne();

      return res.json({
        success: true,

        message:
          "Coupon deleted",
      });

    } catch (err) {

      console.error(
        "DELETE COUPON ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Delete failed",
      });
    }
  };

/* ======================================================
   VALIDATE COUPON
====================================================== */

exports.validateCoupon =
  async (req, res) => {
    try {

      const {
        code,
        orderAmount,
        userId,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (!code) {
        return res.status(400).json({
          message:
            "Coupon code required",
        });
      }

      if (
        !orderAmount ||
        Number(
          orderAmount
        ) <= 0
      ) {
        return res.status(400).json({
          message:
            "Valid order amount required",
        });
      }

      /* ================= FIND COUPON ================= */

      const coupon =
        await Coupon.findOne({
          code:
            code
              .trim()
              .toUpperCase(),

          isActive: true,
        });

      if (!coupon) {
        return res.status(400).json({
          valid: false,

          message:
            "Invalid coupon",
        });
      }

      /* ================= EXPIRY ================= */

      if (
        coupon.expiresAt &&
        coupon.expiresAt <
          new Date()
      ) {
        return res.status(400).json({
          valid: false,

          message:
            "Coupon expired",
        });
      }

      /* ================= USAGE LIMIT ================= */

      if (
        coupon.usageLimit &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {
        return res.status(400).json({
          valid: false,

          message:
            "Usage limit reached",
        });
      }

      /* ================= MIN ORDER ================= */

      if (
        Number(
          orderAmount
        ) <
        coupon.minOrderAmount
      ) {
        return res.status(400).json({
          valid: false,

          message:
            `Minimum order amount is ₹${coupon.minOrderAmount}`,
        });
      }

      /* ================= USER LIMIT ================= */

      if (userId) {

        const userOrders =
          await Order.countDocuments(
            {
              user: userId,

              coupon:
                coupon._id,
            }
          );

        if (
          userOrders >=
          coupon.perUserLimit
        ) {
          return res.status(400).json({
            valid: false,

            message:
              "User usage limit reached",
          });
        }
      }

      /* ================= DISCOUNT ================= */

      let discount = 0;

      const amount =
        Number(
          orderAmount
        );

      if (
        coupon.discountType ===
        "percentage"
      ) {

        discount =
          (amount *
            coupon.discountValue) /
          100;

        if (
          coupon.maxDiscountAmount
        ) {
          discount =
            Math.min(
              discount,
              coupon.maxDiscountAmount
            );
        }

      } else {

        discount =
          coupon.discountValue;
      }

      /* ================= FINAL ================= */

      discount =
        Math.round(
          discount
        );

      const finalAmount =
        Math.max(
          0,
          amount - discount
        );

      return res.json({
        success: true,

        valid: true,

        coupon: {
          _id:
            coupon._id,

          code:
            coupon.code,

          discountType:
            coupon.discountType,

          discountValue:
            coupon.discountValue,
        },

        discount,

        finalAmount,
      });

    } catch (err) {

      console.error(
        "VALIDATE COUPON ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message ||
          "Coupon validation failed",
      });
    }
  };