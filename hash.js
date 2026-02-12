const bcrypt = require("bcryptjs");

bcrypt.hash("yourAdminPassword", 10).then((hash) => {
  console.log(hash);
});
