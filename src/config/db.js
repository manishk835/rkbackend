const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // connection pool
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);

    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

/* ======================================================
   CONNECTION EVENTS
====================================================== */

mongoose.connection.on("connected", () => {
  console.log("📦 MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  console.error("🔥 MongoDB error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB disconnected");
});

/* ======================================================
   GRACEFUL SHUTDOWN
====================================================== */

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB connection closed (App terminated)");
  process.exit(0);
});

module.exports = connectDB;
