const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const mongoose = require("mongoose");

/* ================= SELLER REQUEST ================= */

exports.createWithdrawal = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const { amount, method, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    if (!method) {
      return res.status(400).json({
        message: "Withdrawal method required",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    if (seller.walletBalance < amount) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    const withdrawal = await Withdrawal.create({
      seller: sellerId,
      amount,
      method,
      accountDetails,
      status: "Pending",
    });

    res.status(201).json({
      message: "Withdrawal request created",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= SELLER HISTORY ================= */

exports.getSellerWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      seller: req.seller._id,
    }).sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ADMIN APPROVE ================= */

exports.approveWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal = await Withdrawal.findById(
      req.params.id
    ).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== "Pending") {
      throw new Error("Already processed");
    }

    const seller = await User.findById(
      withdrawal.seller
    ).session(session);

    if (!seller) {
      throw new Error("Seller not found");
    }

    if (seller.walletBalance < withdrawal.amount) {
      throw new Error("Insufficient balance");
    }

    // 🔥 ATOMIC UPDATE
    seller.walletBalance -= withdrawal.amount;
    await seller.save({ session });

    withdrawal.status = "Approved";
    withdrawal.processedAt = new Date();

    await withdrawal.save({ session });

    await session.commitTransaction();

    res.json({
      message: "Withdrawal approved",
      withdrawal,
    });
  } catch (err) {
    await session.abortTransaction();

    res.status(400).json({
      message: err.message || "Approval failed",
    });
  } finally {
    session.endSession();
  }
};

/* ================= ADMIN REJECT ================= */

exports.rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(
      req.params.id
    );

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "Pending") {
      return res.status(400).json({
        message: "Already processed",
      });
    }

    withdrawal.status = "Rejected";
    withdrawal.processedAt = new Date();

    await withdrawal.save();

    res.json({
      message: "Withdrawal rejected",
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ADMIN ALL ================= */

exports.getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};