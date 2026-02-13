const User = require("../models/User");
const mongoose = require("mongoose");

/* ======================================================
   GET WISHLIST (USER)
====================================================== */
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("wishlist");

    return res.json(user.wishlist);
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({
      message: "Failed to fetch wishlist",
    });
  }
};

/* ======================================================
   ADD TO WISHLIST
====================================================== */
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    user.wishlist.push(productId);
    await user.save();

    return res.json({ message: "Added to wishlist" });
  } catch (error) {
    console.error("Add Wishlist Error:", error);
    return res.status(500).json({
      message: "Failed to add wishlist",
    });
  }
};

/* ======================================================
   REMOVE FROM WISHLIST
====================================================== */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );

    await user.save();

    return res.json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);
    return res.status(500).json({
      message: "Failed to remove wishlist",
    });
  }
};
