// src/controllers/order.controller.js
const Order = require("../models/Order");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ======================================================
   CREATE ORDER (
====================================================== */
const Product = require("../models/Product");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { customer, items, discount = 0, paymentMethod } = req.body;

    /* ================= VALIDATION ================= */

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({
        message: "Customer details incomplete",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain items",
      });
    }

    if (!["COD", "RAZORPAY"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* ================= FETCH PRODUCTS FROM DB ================= */

    const productIds = items.map((i) => i.productId);

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== items.length) {
      return res.status(400).json({
        message: "Some products not available",
      });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of items) {
      const product = products.find(
        (p) => p._id.toString() === cartItem.productId
      );

      if (!product) {
        return res.status(400).json({
          message: "Product not found",
        });
      }

      if (!product.inStock || product.totalStock < cartItem.quantity) {
        return res.status(400).json({
          message: `${product.title} is out of stock`,
        });
      }

      const itemTotal = product.price * cartItem.quantity;

      subtotal += itemTotal;

      const commissionPercent = 10;
      const commissionAmount = (itemTotal * commissionPercent) / 100;

      const sellerEarning = itemTotal - commissionAmount;

      orderItems.push({
        productId: product._id,
        seller: product.seller,
        title: product.title,
        price: product.price,
        quantity: cartItem.quantity,
        commission: commissionPercent,
        sellerEarning,
      });

      // 🔥 REDUCE STOCK
      product.totalStock -= cartItem.quantity;
      await product.save();
    }

    const validDiscount = discount > subtotal ? 0 : discount;
    const totalAmount = subtotal - validDiscount;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const order = await Order.create({
      user: userId,
      customer,
      items: orderItems,
      subtotal,
      discount: validDiscount,
      totalAmount,
      paymentMethod,
      status: "Pending",
      estimatedDelivery,
      statusHistory: [
        {
          status: "Pending",
          updatedAt: new Date(),
        },
      ],
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      message: "Order creation failed",
    });
  }
};

/* ======================================================
   USER – GET MY ORDERS
====================================================== */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.json(orders);
  } catch (error) {
    console.error("User Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ======================================================
   ADMIN – GET ALL ORDERS
====================================================== */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const conditions = [];

      if (mongoose.Types.ObjectId.isValid(search)) {
        conditions.push({ _id: search });
      }

      conditions.push({
        "customer.phone": {
          $regex: search,
          $options: "i",
        },
      });

      filter.$or = conditions;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name phone role")

        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return res.json({
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Get Orders Error:", error);
    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

/* ======================================================
   ADMIN – UPDATE ORDER STATUS
====================================================== */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;

    order.statusHistory.push({
      status,
      updatedAt: new Date(),
    });

    /* ===== GIVE LOYALTY POINTS WHEN DELIVERED ===== */
    if (status === "Delivered") {
      const User = require("../models/User");
    
      for (const item of order.items) {
        await User.findByIdAndUpdate(item.seller, {
          $inc: { walletBalance: item.sellerEarning || 0 },
        });
      }
    
      await User.findByIdAndUpdate(order.user, {
        $inc: { loyaltyPoints: order.loyaltyPointsEarned || 0 },
      });
    }
    

    await order.save();

    return res.json(order);
  } catch (error) {
    console.error("Update Order Error:", error);
    return res.status(500).json({
      message: "Status update failed",
    });
  }
};

/* ======================================================
   ADMIN – GET SINGLE ORDER
====================================================== */
exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error("Get Order Admin Error:", error);
    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

/* ======================================================
   ADMIN – EXPORT CSV
====================================================== */
exports.exportOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    let csv = "OrderID,Name,Phone,Total,Status,Date\n";

    orders.forEach((o) => {
      csv += `"${o._id}","${o.customer.name}","${o.customer.phone}","${o.totalAmount}","${o.status}","${o.createdAt}"\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    return res.send(csv);
  } catch (err) {
    console.error("CSV Export Error:", err);
    return res.status(500).send("Export failed");
  }
};

/* ======================================================
   USER – CANCEL ORDER
====================================================== */
exports.cancelOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Cancelled")
      return res.status(400).json({ message: "Already cancelled" });

    if (["Shipped", "Delivered"].includes(order.status))
      return res.status(400).json({ message: "Order cannot be cancelled now" });

    order.status = "Cancelled";
    order.cancelledAt = new Date();

    order.statusHistory.push({
      status: "Cancelled",
      updatedAt: new Date(),
    });

    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ message: "Cancel failed" });
  }
};

/* ======================================================
   USER – REQUEST RETURN
====================================================== */
exports.requestReturn = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Delivered") {
      return res.status(400).json({
        message: "Return allowed only after delivery",
      });
    }

    if (order.isReturnRequested) {
      return res.status(400).json({
        message: "Return already requested",
      });
    }

    order.isReturnRequested = true;
    order.returnRequestedAt = new Date();

    await order.save();

    res.json({ message: "Return requested successfully" });
  } catch (err) {
    console.error("Return Error:", err);
    res.status(500).json({ message: "Return failed" });
  }
};

exports.downloadInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Not found" });

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order._id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("Invoice", { align: "center" });
  doc.moveDown();

  doc.text(`Order ID: ${order._id}`);
  doc.text(`Customer: ${order.customer.name}`);
  doc.text(`Total: ₹${order.totalAmount}`);

  doc.end();
};

/* ======================================================
   CREATE RAZORPAY ORDER (SECURE)
====================================================== */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: "INR",
      receipt: `rk_${order._id}`,
    });

    order.paymentStatus = "INITIATED";
    await order.save();

    return res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Create Error:", error);
    return res.status(500).json({ message: "Razorpay order failed" });
  }
};

/* ======================================================
   VERIFY PAYMENT (SECURE + IDEMPOTENT)
====================================================== */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "PAID") {
      return res.json({ message: "Already verified" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({ message: "Invalid signature" });
    }

    order.paymentStatus = "PAID";
    order.status = "Confirmed";

    order.razorpay = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    };

    order.statusHistory.push({
      status: "Confirmed",
      updatedAt: new Date(),
    });

    await order.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Verify Error:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order || order.paymentStatus !== "PAID") {
      return res.status(400).json({ message: "Invalid order" });
    }

    const refund = await razorpay.payments.refund(order.razorpay.paymentId, {
      amount: order.totalAmount * 100,
    });

    order.paymentStatus = "REFUNDED";
    order.status = "Cancelled";

    order.paymentLogs.push({
      event: "refund.processed",
      payload: refund,
    });

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({ message: "Refund failed" });
  }
};

exports.getPaymentAnalytics = async (req, res) => {
  const totalRevenue = await Order.aggregate([
    { $match: { paymentStatus: "PAID" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const totalOrders = await Order.countDocuments();
  const paidOrders = await Order.countDocuments({
    paymentStatus: "PAID",
  });

  res.json({
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders,
    paidOrders,
  });
};
