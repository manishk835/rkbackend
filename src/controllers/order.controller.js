const Order = require("../models/Order");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Order failed" });
  }
};

// ✅ ADMIN – ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ USER – PHONE BASED ORDERS
exports.getUserOrders = async (req, res) => {
  try {
    const phone = req.query.phone;

    if (!phone) {
      return res.json([]);
    }

    const orders = await Order.find({
      "customer.phone": phone,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "User orders fetch failed" });
  }
};

// UPDATE STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};


// const Order = require("../models/Order");

// // USER – create order
// exports.createOrder = async (req, res) => {
//   try {
//     const order = await Order.create(req.body);
//     res.status(201).json(order);
//   } catch (err) {
//     res.status(500).json({ message: "Order failed" });
//   }
// };

// // ADMIN – get all orders
// exports.getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find().sort({ createdAt: -1 });
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

// // USER – get orders by phone (simple & safe)
// exports.getUserOrders = async (req, res) => {
//   try {
//     const { phone } = req.query;

//     if (!phone) {
//       return res.json([]);
//     }

//     const orders = await Order.find({
//       "customer.phone": phone,
//     }).sort({ createdAt: -1 });

//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

// // ADMIN – update status
// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { status: req.body.status },
//       { new: true }
//     );
//     res.json(order);
//   } catch (err) {
//     res.status(500).json({ message: "Update failed" });
//   }
// };
    
