const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

/* ======================================================
   BODY PARSERS (FIRST)
====================================================== */

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ======================================================
   CORS (VERY IMPORTANT FIX)
====================================================== */

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);

/* ======================================================
   SECURITY MIDDLEWARES (AFTER BODY PARSER)
====================================================== */

// app.use(
//   mongoSanitize({
//     replaceWith: "_",
//   })
// );
app.use((req, res, next) => {
  req.body = sanitizeObject(req.body);
  next();
});

function sanitizeObject(obj) {
  if (!obj) return obj;
  Object.keys(obj).forEach((key) => {
    if (key.includes("$") || key.includes(".")) {
      delete obj[key];
    }
  });
  return obj;
}

app.use(helmet());

/* ======================================================
   RATE LIMITERS
====================================================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Try again later.",
});
app.use("/api/auth", authLimiter);

/* ======================================================
   ROUTES
====================================================== */

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/address", require("./routes/address"));
app.use("/api/categories", require("./routes/category.routes"));

/* ======================================================
   404 HANDLER
====================================================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

/* ======================================================
   SERVER START
====================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 RK Fashion Backend running on port ${PORT}`);
});
