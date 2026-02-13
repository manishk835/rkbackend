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
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
  });

  console.log("Admin created successfully");
  process.exit();
})();
