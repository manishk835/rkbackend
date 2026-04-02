require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("DB Connected");

    const email = "manishkumar.dev08@gmail.com";
    const password = "Admin@123";

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    // ❌ bcrypt hash यहाँ नहीं करना (model खुद करेगा)
    await User.create({
      name: "Super Admin",
      email,
      password: password, // ✅ plain password
      role: "admin",
      isBlocked: false,
      tokenVersion: 0,
    });

    console.log("✅ Admin created:");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

createAdmin();