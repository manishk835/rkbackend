const Order = require("../models/Order");
const mongoose = require("mongoose");

/* ======================================================
   CREATE ORDER (USER)
   ====================================================== */
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      statusHistory: [
        {
          status: req.body.status || "Pending",
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
   ADMIN – GET ALL ORDERS
   (FILTER + SEARCH + PAGINATION)
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

    /* ===== STATUS FILTER ===== */
    if (status) {
      filter.status = status;
    }

    /* ===== SEARCH (ORDER ID / PHONE) ===== */
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
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
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
    console.error("Get all orders error:", error);
    return res.status(500).json({
      orders: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    });
  }
};

/* ======================================================
   USER – GET ORDERS BY PHONE
   ====================================================== */
exports.getUserOrders = async (req, res) => {
  try {
    const phone = req.params.phone || req.query.phone;

    if (!phone) {
      return res.json([]);
    }

    const orders = await Order.find({
      "customer.phone": phone,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(orders);
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({
      message: "User orders fetch failed",
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
      return res
        .status(400)
        .json({ message: "Status is required" });
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
      return res
        .status(404)
        .json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
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
      return res
        .status(400)
        .json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("Admin get order error:", error);
    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

/* ======================================================
   ADMIN – EXPORT ORDERS CSV
   ====================================================== */
   exports.exportOrdersCSV = async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
  
      let csv =
        "OrderID,Name,Phone,Total,Status,Date\n";
  
      orders.forEach((o) => {
        csv += `${o._id},${o.customer.name},${o.customer.phone},${o.totalAmount},${o.status},${o.createdAt}\n`;
      });
  
      res.header("Content-Type", "text/csv");
      res.attachment("orders.csv");
      return res.send(csv);
    } catch (err) {
      console.error("CSV export error", err);
      res.status(500).send("Export failed");
    }
  };
  
