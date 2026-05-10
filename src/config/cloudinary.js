// src/config/cloudinary.js

const cloudinary =
  require(
    "cloudinary"
  ).v2;

/* ======================================================
   ENV VALIDATION
====================================================== */

const requiredEnv =
  [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

requiredEnv.forEach(
  (key) => {
    if (
      !process.env[key]
    ) {

      console.warn(
        `⚠️ Missing Cloudinary env: ${key}`
      );
    }
  }
);

/* ======================================================
   CONFIG
====================================================== */

cloudinary.config({
  cloud_name:
    process.env
      .CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env
      .CLOUDINARY_API_KEY,

  api_secret:
    process.env
      .CLOUDINARY_API_SECRET,

  secure: true,
});

/* ======================================================
   TEST HELPER
====================================================== */

const testCloudinary =
  async () => {
    try {

      const result =
        await cloudinary.api.ping();

      console.log(
        "✅ Cloudinary connected:",
        result.status
      );

    } catch (err) {

      console.error(
        "❌ Cloudinary connection failed:",
        err.message
      );
    }
  };

/* ======================================================
   EXPORTS
====================================================== */

module.exports =
  cloudinary;

module.exports.testCloudinary =
  testCloudinary;