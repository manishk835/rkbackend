require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

mongoose.connect(process.env.MONGO_URI);

(async () => {
  const adminExists = await User.findOne({ role: "admin" });

  if (adminExists) {
    console.log("Admin already exists");
    process.exit();
  }

  await User.create({
    name: "Super Admin",
    phone: "9876543210",   // ✅ required
    email: "admin@example.com",
    password: "admin@123",
    role: "admin",
    isVerified: true      // optional but recommended
  });

  console.log("Admin created successfully");
  process.exit();
})();
