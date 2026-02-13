//src/controllers/order/controller.js
const Order = require("../models/Order");
const mongoose = require("mongoose");

/* ======================================================
   CREATE ORDER (USER - PROTECTED)
====================================================== */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      customer,
      items,
      discount = 0,
      paymentMethod,
      paymentStatus = "PENDING",
    } = req.body;

    /* ===== BASIC VALIDATION ===== */
    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({
        message: "Customer details incomplete",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
      });
    }

    /* ===== SERVER SIDE PRICE CALCULATION ===== */
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const totalAmount = subtotal - discount;

    const order = await Order.create({
      user: userId,
      customer,
      items,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: "Pending",
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
   USER – GET MY ORDERS (COOKIE BASED)
====================================================== */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error("User Orders Error:", error);
    return res.status(500).json({
      message: "Failed to fetch orders",
    });
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

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

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
