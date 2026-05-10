// src/middlewares/upload.middleware.js

const multer = require("multer");

const {
  CloudinaryStorage,
} = require(
  "multer-storage-cloudinary"
);

const cloudinary =
  require("../config/cloudinary");

/* ======================================================
   STORAGE
====================================================== */

const storage =
  new CloudinaryStorage({
    cloudinary,

    params: async (
      req,
      file
    ) => {

      let folder =
        "rkfashion/uploads";

      /* ================= PRODUCT IMAGES ================= */

      if (
        req.originalUrl.includes(
          "/products"
        )
      ) {
        folder =
          "rkfashion/products";
      }

      /* ================= SELLER DOCUMENTS ================= */

      if (
        req.originalUrl.includes(
          "/vendors"
        )
      ) {
        folder =
          "rkfashion/vendors";
      }

      return {
        folder,

        resource_type:
          "image",

        allowed_formats: [
          "jpg",
          "jpeg",
          "png",
          "webp",
        ],

        transformation: [
          {
            width: 1200,
            crop: "limit",
            quality: "auto",
            fetch_format:
              "auto",
          },
        ],

        public_id: `${
          Date.now()
        }-${file.originalname
          .split(".")[0]
          .replace(/\s+/g, "-")
          .toLowerCase()}`,
      };
    },
  });

/* ======================================================
   FILE FILTER
====================================================== */

const fileFilter = (
  req,
  file,
  cb
) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and WEBP images allowed"
      ),
      false
    );
  }
};

/* ======================================================
   MULTER
====================================================== */

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024, // 5MB

    files: 6,
  },
});

module.exports = upload;