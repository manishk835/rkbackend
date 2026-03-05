// src/controllers/coupon.controller.js
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

/* ================= CREATE ================= */

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL ================= */

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
};

/* ================= TOGGLE ACTIVE ================= */

exports.toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json(coupon);
};

/* ================= DELETE ================= */

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

/* ================= VALIDATE COUPON ================= */

exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, userId } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon)
      return res.status(400).json({ message: "Invalid coupon" });

    if (coupon.expiresAt < new Date())
      return res.status(400).json({ message: "Coupon expired" });

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ message: "Usage limit reached" });

    if (orderAmount < coupon.minOrderAmount)
      return res.status(400).json({
        message: "Minimum order not met",
      });

    const userOrders = await Order.countDocuments({
      user: userId,
      coupon: coupon._id,
    });

    if (userOrders >= coupon.perUserLimit)
      return res.status(400).json({
        message: "User usage limit reached",
      });

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (orderAmount * coupon.discountValue) / 100;

      if (coupon.maxDiscountAmount)
        discount = Math.min(
          discount,
          coupon.maxDiscountAmount
        );
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      valid: true,
      discount,
      finalAmount: orderAmount - discount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};