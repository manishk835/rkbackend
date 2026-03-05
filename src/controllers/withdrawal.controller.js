const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");

/* ================= SELLER REQUEST WITHDRAW ================= */

exports.createWithdrawal = async (req, res) => {
  try {

    const sellerId = req.seller._id;
    const { amount, method, accountDetails } = req.body;

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    if (amount > seller.walletBalance) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    const withdrawal = await Withdrawal.create({
      seller: sellerId,
      amount,
      method,
      accountDetails,
    });

    res.status(201).json({
      message: "Withdrawal request created",
      withdrawal,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= SELLER WITHDRAW LIST ================= */

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


/* ================= ADMIN APPROVE WITHDRAW ================= */

exports.approveWithdrawal = async (req, res) => {
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

    const seller = await User.findById(
      withdrawal.seller
    );

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    if (seller.walletBalance < withdrawal.amount) {
      return res.status(400).json({
        message: "Seller balance insufficient",
      });
    }

    seller.walletBalance -= withdrawal.amount;
    await seller.save();

    withdrawal.status = "Approved";
    withdrawal.processedAt = new Date();

    await withdrawal.save();

    res.json({
      message: "Withdrawal approved",
      withdrawal,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= ADMIN REJECT WITHDRAW ================= */

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


/* ================= ADMIN ALL WITHDRAWS ================= */

exports.getAllWithdrawals = async (req, res) => {
  try {

    const withdrawals = await Withdrawal.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(withdrawals);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};