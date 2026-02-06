const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// 🔹 Load env variables
dotenv.config();

// 🔹 Connect MongoDB
connectDB();

const app = express();

// 🔹 Middlewares
app.use(cors());
app.use(express.json());

// 🔹 ROUTES
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payment", require("./routes/payment.routes")); // 🔥 RAZORPAY ROUTE
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/address", require("./routes/address")); // (agar address route hai)

// 🔹 Test route
app.get("/", (req, res) => {
  res.send("RK Fashion Backend Running 🚀");
});

// 🔹 Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");

// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/products", require("./routes/product.routes"));
// app.use("/api/orders", require("./routes/order.routes"));
// app.use("/api/upload", require("./routes/upload.routes"));

// app.get("/", (_, res) => {
//   res.send("RK Fashion Backend Running 🚀");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`Server running on port ${PORT}`)
// );
