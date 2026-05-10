// src/controllers/order.controller.js

const Order = require("../models/Order");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const WalletTransaction = require("../models/WalletTransaction");

const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ======================================================
   HELPERS
====================================================== */

const restoreOrderStock = async (order) => {

  for (const item of order.items) {

    const product = await Product.findById(
      item.productId
    );

    if (!product) continue;

    product.totalStock += item.quantity;

    await product.save();
  }
};

const reverseSellerEarnings = async (order) => {

  for (const item of order.items) {

    const seller = await User.findById(
      item.seller
    );

    if (!seller) continue;

    const amount =
      item.sellerEarning || 0;

    if (
      seller.walletBalance >= amount
    ) {

      seller.walletBalance -= amount;

      await seller.save();

      await WalletTransaction.create({
        user: seller._id,
        type: "DEBIT",
        amount,
        source: "refund",
        orderId: order._id,
        note: `Refund reversal for order ${order.orderNumber}`,
      });

    }

  }

};

/* ======================================================
   CREATE ORDER
====================================================== */

exports.createOrder = async (req, res) => {
  try {

    if (!req.user || !req.user._id) {

      return res.status(401).json({
        message: "Unauthorized",
      });

    }

    const userId = req.user._id;

    const {
      customer,
      items,
      discount = 0,
      paymentMethod,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address ||
      !customer?.city ||
      !customer?.pincode
    ) {

      return res.status(400).json({
        message: "Customer details incomplete",
      });

    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      return res.status(400).json({
        message: "Order must contain items",
      });

    }

    if (
      !["COD", "RAZORPAY"].includes(
        paymentMethod
      )
    ) {

      return res.status(400).json({
        message: "Invalid payment method",
      });

    }

    /* ================= PRODUCTS ================= */

    const productIds =
      items.map(
        (i) => i.productId
      );

    const products =
      await Product.find({
        _id: {
          $in: productIds,
        },
        isActive: true,
      });

    if (
      products.length !== items.length
    ) {

      return res.status(400).json({
        message:
          "Some products not available",
      });

    }

    let subtotal = 0;

    const orderItems = [];

    /* ================= PROCESS ================= */

    for (const cartItem of items) {

      const product =
        products.find(
          (p) =>
            p._id.toString() ===
            cartItem.productId
        );

      if (!product) {

        return res.status(400).json({
          message: "Product not found",
        });

      }

      if (
        product.totalStock <
        cartItem.quantity
      ) {

        return res.status(400).json({
          message:
            `${product.title} is out of stock`,
        });

      }

      const itemTotal =
        product.price *
        cartItem.quantity;

      subtotal += itemTotal;

      const commissionPercent = 10;

      const commissionAmount =
        (
          itemTotal *
          commissionPercent
        ) / 100;

      const sellerEarning =
        itemTotal -
        commissionAmount;

        orderItems.push({

          productId:
            product._id,
        
          seller:
            product.seller,
        
          title:
            product.title,
        
          price:
            product.price,
        
          quantity:
            cartItem.quantity,
        
          thumbnail:
            product.thumbnail,
        
          /* ================= VARIANT ================= */
        
          variantSku:
            cartItem.variant?.sku || "",
        
          variantName:
            cartItem.variant?.name || "",
        
          size:
            cartItem.variant?.size || "",
        
          color:
            cartItem.variant?.color || "",
        
          /* ================= EARNING ================= */
        
          commission:
            commissionPercent,
        
          sellerEarning,
        
        });

      /* STOCK REDUCE */

      product.totalStock -=
        cartItem.quantity;

      await product.save();

    }

    /* ================= PRICING ================= */

    const validDiscount =
      discount > subtotal
        ? 0
        : discount;

    const deliveryFee =
      subtotal >= 999
        ? 0
        : 49;

    const totalAmount =
      subtotal -
      validDiscount +
      deliveryFee;

    const estimatedDelivery =
      new Date();

    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + 5
    );

    /* ================= CREATE ================= */

    const order =
      await Order.create({
        user: userId,
        customer,
        items: orderItems,
        subtotal,
        discount: validDiscount,
        totalAmount,
        paymentMethod,

        paymentStatus:
          paymentMethod === "COD"
            ? "PENDING"
            : "INITIATED",

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

    console.error(
      "Create Order Error:",
      error
    );

    return res.status(500).json({
      message:
        "Order creation failed",
    });

  }
};

/* ======================================================
   USER — MY ORDERS
====================================================== */

exports.getUserOrders = async (req, res) => {
  try {

    const orders =
      await Order.find({
        user: req.user._id,
      }).sort({
        createdAt: -1,
      });

    return res.json(orders);

  } catch (error) {

    console.error(
      "User Orders Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch orders",
    });

  }
};

/* ======================================================
   ADMIN — GET ALL ORDERS
====================================================== */

exports.getAllOrders = async (req, res) => {
  try {

    const {
      status,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {

      const conditions = [];

      if (
        mongoose.Types.ObjectId.isValid(
          search
        )
      ) {

        conditions.push({
          _id: search,
        });

      }

      conditions.push({
        "customer.phone": {
          $regex: search,
          $options: "i",
        },
      });

      filter.$or = conditions;

    }

    const skip =
      (Number(page) - 1) *
      Number(limit);

    const [orders, total] =
      await Promise.all([
        Order.find(filter)
          .populate(
            "user",
            "name phone role"
          )
          .sort({
            createdAt: -1,
          })
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
        totalPages: Math.ceil(
          total / limit
        ),
      },
    });

  } catch (error) {

    console.error(
      "Admin Get Orders Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch orders",
    });

  }
};

/* ======================================================
   ADMIN — UPDATE STATUS
====================================================== */

exports.updateOrderStatus = async (req, res) => {
  try {

    const { status } = req.body;

    if (!status) {

      return res.status(400).json({
        message:
          "Status is required",
      });

    }

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {

      return res.status(404).json({
        message:
          "Order not found",
      });

    }

    const prevStatus =
      order.status;

    order.status = status;

    order.statusHistory.push({
      status,
      updatedAt: new Date(),
    });

    /* CREDIT SELLER */

    if (
      status === "Delivered" &&
      prevStatus !== "Delivered"
    ) {

      for (const item of order.items) {

        const seller =
          await User.findById(
            item.seller
          );

        if (!seller) continue;

        await seller.creditWallet({
          amount:
            item.sellerEarning || 0,

          source: "order",

          orderId: order._id,

          note:
            `Earning from order ${order.orderNumber}`,
        });

      }

    }

    await order.save();

    return res.json(order);

  } catch (error) {

    console.error(
      "Update Order Error:",
      error
    );

    return res.status(500).json({
      message:
        "Status update failed",
    });

  }
};

/* ======================================================
   ADMIN — SINGLE ORDER
====================================================== */

exports.getOrderByIdAdmin = async (req, res) => {
  try {

    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid order id",
      });

    }

    const order =
      await Order.findById(id);

    if (!order) {

      return res.status(404).json({
        message:
          "Order not found",
      });

    }

    return res.json(order);

  } catch (error) {

    console.error(
      "Get Order Admin Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch order",
    });

  }
};

/* ======================================================
   EXPORT CSV
====================================================== */

exports.exportOrdersCSV = async (req, res) => {
  try {

    const orders =
      await Order.find().sort({
        createdAt: -1,
      });

    let csv =
      "OrderID,Name,Phone,Total,Status,Date\n";

    orders.forEach((o) => {

      csv += `"${o._id}","${o.customer.name}","${o.customer.phone}","${o.totalAmount}","${o.status}","${o.createdAt}"\n`;

    });

    res.header(
      "Content-Type",
      "text/csv"
    );

    res.attachment(
      "orders.csv"
    );

    return res.send(csv);

  } catch (err) {

    console.error(
      "CSV Export Error:",
      err
    );

    return res.status(500).send(
      "Export failed"
    );

  }
};

/* ======================================================
   CANCEL ORDER
====================================================== */

exports.cancelOrder = async (req, res) => {
  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid order id",
      });

    }

    const order =
      await Order.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!order) {

      return res.status(404).json({
        message:
          "Order not found",
      });

    }

    if (
      order.status ===
      "Cancelled"
    ) {

      return res.status(400).json({
        message:
          "Already cancelled",
      });

    }

    if (
      [
        "Shipped",
        "Delivered",
      ].includes(order.status)
    ) {

      return res.status(400).json({
        message:
          "Order cannot be cancelled now",
      });

    }

    /* RESTORE STOCK */

    await restoreOrderStock(
      order
    );

    /* REFUND */

    if (
      order.paymentStatus ===
        "PAID" &&
      order.razorpay?.paymentId
    ) {

      try {

        const refund =
          await razorpay.payments.refund(
            order.razorpay.paymentId,
            {
              amount:
                order.totalAmount *
                100,
            }
          );

        order.paymentStatus =
          "REFUNDED";

        order.paymentLogs.push({
          event:
            "refund.processed",
          payload: refund,
        });

      } catch (refundErr) {

        console.error(
          "Refund failed:",
          refundErr
        );

      }

    }

    order.status =
      "Cancelled";

    order.cancelledAt =
      new Date();

    order.statusHistory.push({
      status: "Cancelled",
      updatedAt: new Date(),
    });

    await order.save();

    return res.json(order);

  } catch (err) {

    console.error(
      "Cancel Order Error:",
      err
    );

    return res.status(500).json({
      message:
        "Cancel failed",
    });

  }
};

/* ======================================================
   RETURN REQUEST
====================================================== */

exports.requestReturn = async (req, res) => {
  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid order id",
      });

    }

    const order =
      await Order.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!order) {

      return res.status(404).json({
        message:
          "Order not found",
      });

    }

    if (
      order.status !==
      "Delivered"
    ) {

      return res.status(400).json({
        message:
          "Return allowed only after delivery",
      });

    }

    if (
      order.isReturnRequested
    ) {

      return res.status(400).json({
        message:
          "Return already requested",
      });

    }

    order.isReturnRequested =
      true;

    order.returnRequestedAt =
      new Date();

    order.statusHistory.push({
      status:
        "Return Requested",
      updatedAt: new Date(),
    });

    /* RESTORE STOCK */

    await restoreOrderStock(
      order
    );

    /* REVERSE SELLER EARNING */

    await reverseSellerEarnings(
      order
    );

    /* REFUND */

    if (
      order.paymentStatus ===
        "PAID" &&
      order.razorpay?.paymentId
    ) {

      try {

        const refund =
          await razorpay.payments.refund(
            order.razorpay.paymentId,
            {
              amount:
                order.totalAmount *
                100,
            }
          );

        order.paymentStatus =
          "REFUNDED";

        order.paymentLogs.push({
          event:
            "refund.processed",
          payload: refund,
        });

      } catch (refundErr) {

        console.error(
          "Refund failed:",
          refundErr
        );

      }

    }

    await order.save();

    return res.json({
      message:
        "Return requested successfully",
    });

  } catch (err) {

    console.error(
      "Return Error:",
      err
    );

    return res.status(500).json({
      message:
        "Return failed",
    });

  }
};

/* ======================================================
   DOWNLOAD INVOICE
====================================================== */

exports.downloadInvoice = async (req, res) => {

  try {

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {

      return res.status(404).json({
        message: "Order not found",
      });

    }

    /* ================= PDF INIT ================= */

    const doc = new PDFDocument({
      margin: 50,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    /* ======================================================
       HEADER
    ====================================================== */

    doc
      .fontSize(26)
      .fillColor("#111")
      .text("RKFashion", {
        align: "left",
      });

    doc
      .fontSize(12)
      .fillColor("#666")
      .text("Premium Fashion Marketplace");

    doc.moveDown(2);

    /* ======================================================
       INVOICE TITLE
    ====================================================== */

    doc
      .fontSize(22)
      .fillColor("#000")
      .text("INVOICE", {
        align: "center",
      });

    doc.moveDown(2);

    /* ======================================================
       ORDER INFO
    ====================================================== */

    doc
      .fontSize(12)
      .fillColor("#000");

    doc.text(`Invoice ID: INV-${order._id.toString().slice(-8).toUpperCase()}`);

    doc.text(`Order ID: ${order._id}`);

    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`
    );

    doc.text(
      `Payment Method: ${order.paymentMethod || "COD"}`
    );

    doc.text(
      `Payment Status: ${order.paymentStatus || "Pending"}`
    );

    doc.moveDown(2);

    /* ======================================================
       CUSTOMER
    ====================================================== */

    doc
      .fontSize(16)
      .text("Billing Details");

    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Customer: ${order.customer?.name || "Customer"}`);

    doc.text(
      `Phone: ${order.customer?.phone || "-"}`
    );

    if (order.shippingAddress) {

      doc.text(
        `Address: ${[
          order.shippingAddress.addressLine1,
          order.shippingAddress.city,
          order.shippingAddress.state,
          order.shippingAddress.postalCode,
        ]
          .filter(Boolean)
          .join(", ")}`
      );

    }

    doc.moveDown(2);

    /* ======================================================
       ITEMS TABLE
    ====================================================== */

    doc
      .fontSize(16)
      .text("Order Items");

    doc.moveDown();

    const tableTop = doc.y;

    /* TABLE HEADER */

    doc
      .rect(50, tableTop, 500, 25)
      .fill("#f3f3f3");

    doc
      .fillColor("#000")
      .fontSize(11);

    doc.text("Product", 60, tableTop + 8);

    doc.text("Qty", 320, tableTop + 8);

    doc.text("Price", 380, tableTop + 8);

    doc.text("Total", 470, tableTop + 8);

    let position = tableTop + 35;

    /* ITEMS */

    order.items.forEach((item) => {

      const qty = item.quantity || 1;

      const price =
        item.price ||
        item.unitPrice ||
        0;

      const total = qty * price;

      doc
        .fillColor("#000")
        .fontSize(10);

      doc.text(
        item.title ||
        item.name ||
        "Product",
        60,
        position,
        {
          width: 220,
        }
      );

      doc.text(
        qty.toString(),
        330,
        position
      );

      doc.text(
        `₹${price}`,
        380,
        position
      );

      doc.text(
        `₹${total}`,
        470,
        position
      );

      position += 30;

    });

    doc.moveDown(3);

    /* ======================================================
       TOTALS
    ====================================================== */

    const subtotal =
      order.subtotal ||
      order.totalAmount;

    const shipping =
      order.shippingCharge || 0;

    const grandTotal =
      order.totalAmount;

    doc
      .fontSize(12)
      .text(
        `Subtotal: ₹${subtotal}`,
        {
          align: "right",
        }
      );

    doc.text(
      `Shipping: ₹${shipping}`,
      {
        align: "right",
      }
    );

    doc
      .fontSize(16)
      .fillColor("#000")
      .text(
        `Grand Total: ₹${grandTotal}`,
        {
          align: "right",
        }
      );

    doc.moveDown(3);

    /* ======================================================
       FOOTER
    ====================================================== */

    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        "Thank you for shopping with RKFashion ❤️",
        {
          align: "center",
        }
      );

    doc.text(
      "Support: support@rkfashion.com",
      {
        align: "center",
      }
    );

    doc.end();

  } catch (error) {

    console.error(
      "Invoice Error:",
      error
    );

    return res.status(500).json({
      message: "Invoice generation failed",
    });

  }

};

/* ======================================================
   CREATE RAZORPAY ORDER
====================================================== */

exports.createRazorpayOrder = async (req, res) => {
  try {

    const { orderId } =
      req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid order ID",
      });

    }

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {

      return res.status(404).json({
        message:
          "Order not found",
      });

    }

    if (
      order.user.toString() !==
      req.user._id.toString()
    ) {

      return res.status(403).json({
        message:
          "Unauthorized",
      });

    }

    if (
      order.paymentStatus ===
      "PAID"
    ) {

      return res.status(400).json({
        message:
          "Order already paid",
      });

    }

    const razorpayOrder =
      await razorpay.orders.create({
        amount:
          order.totalAmount *
          100,

        currency: "INR",

        receipt:
          `rk_${order._id}`,
      });

    order.paymentStatus =
      "INITIATED";

    await order.save();

    return res.json({
      id: razorpayOrder.id,
      amount:
        razorpayOrder.amount,
      currency:
        razorpayOrder.currency,
      key:
        process.env
          .RAZORPAY_KEY_ID,
    });

  } catch (error) {

    console.error(
      "Razorpay Create Error:",
      error
    );

    return res.status(500).json({
      message:
        "Razorpay order failed",
    });

  }
};

/* ======================================================
   VERIFY PAYMENT
====================================================== */

exports.verifyRazorpayPayment = async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {

      return res.status(404).json({
        message:
          "Order not found",
      });

    }

    if (
      order.paymentStatus ===
      "PAID"
    ) {

      return res.json({
        message:
          "Already verified",
      });

    }

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

    if (
      expectedSignature !==
      razorpay_signature
    ) {

      order.paymentStatus =
        "FAILED";

      await order.save();

      return res.status(400).json({
        message:
          "Invalid signature",
      });

    }

    order.paymentStatus =
      "PAID";

    order.status =
      "Confirmed";

    order.razorpay = {
      orderId:
        razorpay_order_id,
      paymentId:
        razorpay_payment_id,
      signature:
        razorpay_signature,
    };

    order.statusHistory.push({
      status: "Confirmed",
      updatedAt: new Date(),
    });

    await order.save();

    return res.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "Verify Error:",
      error
    );

    return res.status(500).json({
      message:
        "Payment verification failed",
    });

  }
};

/* ======================================================
   REFUND PAYMENT
====================================================== */

exports.refundPayment = async (req, res) => {
  try {

    const { orderId } =
      req.body;

    const order =
      await Order.findById(
        orderId
      );

    if (
      !order ||
      order.paymentStatus !==
        "PAID"
    ) {

      return res.status(400).json({
        message:
          "Invalid order",
      });

    }

    const refund =
      await razorpay.payments.refund(
        order.razorpay.paymentId,
        {
          amount:
            order.totalAmount *
            100,
        }
      );

    order.paymentStatus =
      "REFUNDED";

    order.status =
      "Cancelled";

    order.paymentLogs.push({
      event:
        "refund.processed",
      payload: refund,
    });

    await order.save();

    return res.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "Refund Error:",
      error
    );

    return res.status(500).json({
      message:
        "Refund failed",
    });

  }
};

/* ======================================================
   PAYMENT ANALYTICS
====================================================== */

exports.getPaymentAnalytics = async (req, res) => {

  const totalRevenue =
    await Order.aggregate([
      {
        $match: {
          paymentStatus:
            "PAID",
        },
      },

      {
        $group: {
          _id: null,
          total: {
            $sum:
              "$totalAmount",
          },
        },
      },
    ]);

  const totalOrders =
    await Order.countDocuments();

  const paidOrders =
    await Order.countDocuments({
      paymentStatus:
        "PAID",
    });

  res.json({
    totalRevenue:
      totalRevenue[0]?.total || 0,

    totalOrders,

    paidOrders,
  });

};

/* ======================================================
   USER — SINGLE ORDER
====================================================== */

exports.getOrderById = async (req, res) => {
  try {

    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order,
    });

  } catch (error) {

    console.error(
      "Get Single Order Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch order",
    });

  }
};