// createAdmin.js

const mongoose = require("mongoose");
const User = require("./src/models/User");

mongoose.connect("mongodb://localhost:27017/rkbackend");

(async () => {
  const admin = new User({
    name: "Admin",
    phone: "9999999999",
    email: "admin@rkfashion.com",
    password: "Admin@123",
    role: "admin",
    isVerified: true,
  });

  await admin.save();
  console.log("Admin created");
  process.exit();
})();