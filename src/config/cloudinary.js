const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.db3jrilzf,
  api_key: process.env.v,
  api_secret: process.env.dfESW61QI8A1VHOgdudF7DuouzM,
});

module.exports = cloudinary;
