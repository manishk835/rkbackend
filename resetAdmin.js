const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./src/models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const hash = await bcrypt.hash("Admin@123", 10);

  await User.updateOne(
    { email: "admin@rkfashion.com" },
    { $set: { password: hash } }
  );

  console.log("Admin password reset done");
  process.exit();
})();