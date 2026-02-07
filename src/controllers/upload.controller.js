const cloudinary = require("../config/cloudinary");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "rk-fashion/products",
      }
    );

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      message: "Image upload failed",
    });
  }
};
