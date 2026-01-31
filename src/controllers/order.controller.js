const Order = require("../models/Order");

/* ================= CREATE ORDER ================= */
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

/* ================= ADMIN – ALL ORDERS ================= */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/* ================= USER – ORDERS BY PHONE ================= */
exports.getUserOrders = async (req, res) => {
  try {
    const phone = req.params.phone || req.query.phone;

    if (!phone) return res.json([]);

    const orders = await Order.find({
      "customer.phone": phone,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ message: "User orders fetch failed" });
  }
};

/* ================= UPDATE STATUS (ADMIN) ================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(order);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};
