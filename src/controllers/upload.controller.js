// src/controllers/upload.controller.js

const cloudinary = require("../config/cloudinary");

/* ======================================================
   SINGLE IMAGE UPLOAD
====================================================== */

exports.uploadImage = async (
  req,
  res
) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message:
          "No file uploaded",
      });
    }

    /* ================= UPLOAD ================= */

    const result =
      await cloudinary.uploader.upload(
        req.file.path,
        {
          folder:
            "rkfashion/uploads",

          resource_type:
            "image",
        }
      );

    return res.json({
      success: true,

      image: {
        url:
          result.secure_url,

        public_id:
          result.public_id,
      },
    });

  } catch (err) {

    console.error(
      "Single Upload Error:",
      err
    );

    return res.status(500).json({
      message:
        "Upload failed",
    });
  }
};

/* ======================================================
   MULTIPLE IMAGE UPLOAD
====================================================== */

exports.uploadMultipleImages =
  async (req, res) => {
    try {

      if (
        !req.files ||
        req.files.length === 0
      ) {
        return res.status(400).json({
          message:
            "No files uploaded",
        });
      }

      /* ================= LIMIT ================= */

      if (
        req.files.length > 6
      ) {
        return res.status(400).json({
          message:
            "Maximum 6 images allowed",
        });
      }

      /* ================= UPLOAD ALL ================= */

      const uploaded =
        await Promise.all(
          req.files.map(
            async (file) => {

              const result =
                await cloudinary.uploader.upload(
                  file.path,
                  {
                    folder:
                      "rkfashion/products",

                    resource_type:
                      "image",
                  }
                );

              return {
                url:
                  result.secure_url,

                public_id:
                  result.public_id,
              };
            }
          )
        );

      return res.json({
        success: true,

        count:
          uploaded.length,

        images:
          uploaded,
      });

    } catch (err) {

      console.error(
        "Multi Upload Error:",
        err
      );

      return res.status(500).json({
        message:
          "Multiple upload failed",
      });
    }
  };

/* ======================================================
   DELETE IMAGE
====================================================== */

exports.deleteImage =
  async (req, res) => {
    try {

      const {
        public_id,
      } = req.body;

      if (!public_id) {
        return res.status(400).json({
          message:
            "public_id required",
        });
      }

      await cloudinary.uploader.destroy(
        public_id
      );

      return res.json({
        success: true,

        message:
          "Image deleted successfully",
      });

    } catch (err) {

      console.error(
        "Delete Upload Error:",
        err
      );

      return res.status(500).json({
        message:
          "Delete failed",
      });
    }
  };