// controllers/order.controller.js
const Order = require("../models/Order");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
/* ======================================================
   CREATE ORDER (USER)
====================================================== */
/* ======================================================
   CREATE ORDER (USER)
====================================================== */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { customer, items, discount = 0, paymentMethod } = req.body;

    /* ===== BASIC VALIDATION ===== */
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

    /* ===== SERVER SIDE PRICE CALCULATION ===== */
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const validDiscount = discount > subtotal ? 0 : discount;
    const totalAmount = subtotal - validDiscount;

    /* ===== ESTIMATED DELIVERY (5 Days) ===== */
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    /* ===== LOYALTY POINTS ===== */
    const loyaltyPointsEarned = Math.floor(totalAmount / 100);

    const order = await Order.create({
      user: userId,
      customer,
      items,
      subtotal,
      discount: validDiscount,
      totalAmount,
      paymentMethod,
      status: "Pending",
      estimatedDelivery,
      loyaltyPointsEarned,
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
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

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

      await User.findByIdAndUpdate(order.user, {
        $inc: { loyaltyPoints: order.loyaltyPointsEarned },
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

    let csv =
      "OrderID,Name,Phone,Total,Status,Date\n";

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

    if (!order)
      return res.status(404).json({ message: "Order not found" });

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

    if (!order)
      return res.status(404).json({ message: "Order not found" });

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
   CHANGE PASSWORD (USER - PROTECTED)
====================================================== */
// exports.changePassword = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         message: "Both current and new password required",
//       });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         message: "Password must be at least 6 characters",
//       });
//     }

//     const user = await User.findById(userId).select("+password");

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     const isMatch = await bcrypt.compare(
//       currentPassword,
//       user.password
//     );

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Current password incorrect",
//       });
//     }

//     user.password = newPassword; // 🔥 auto hash via pre-save
//     await user.save();

//     return res.json({
//       message: "Password updated successfully",
//     });
//   } catch (error) {
//     console.error("Change Password Error:", error);
//     return res.status(500).json({
//       message: "Password change failed",
//     });
//   }
// };

