// src/controllers/wishlist.controller.js

const mongoose = require(
  "mongoose"
);

const User = require(
  "../models/User"
);

const Product = require(
  "../models/Product"
);

/* ======================================================
   GET USER WISHLIST
====================================================== */

exports.getWishlist =
  async (req, res) => {
    try {

      const user =
        await User.findById(
          req.user._id
        ).populate({
          path: "wishlist",

          match: {
            isActive: true,
            isApproved: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      return res.json({
        success: true,

        count:
          user.wishlist
            ?.length || 0,

        wishlist:
          user.wishlist ||
          [],
      });

    } catch (error) {

      console.error(
        "GET WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch wishlist",
      });
    }
  };

/* ======================================================
   ADD TO WISHLIST
====================================================== */

exports.addToWishlist =
  async (req, res) => {
    try {

      const {
        productId,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (
        !productId
      ) {
        return res.status(400).json({
          message:
            "Product ID required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid product id",
        });
      }

      /* ================= PRODUCT CHECK ================= */

      const product =
        await Product.findById(
          productId
        );

      if (
        !product ||
        !product.isActive ||
        !product.isApproved
      ) {
        return res.status(404).json({
          message:
            "Product not available",
        });
      }

      /* ================= USER ================= */

      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      /* ================= DUPLICATE CHECK ================= */

      const exists =
        user.wishlist.some(
          (id) =>
            id.toString() ===
            productId
        );

      if (exists) {
        return res.status(400).json({
          message:
            "Product already in wishlist",
        });
      }

      /* ================= ADD ================= */

      user.wishlist.push(
        productId
      );

      await user.save();

      return res.json({
        success: true,

        message:
          "Added to wishlist",
      });

    } catch (error) {

      console.error(
        "ADD WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to add wishlist",
      });
    }
  };

/* ======================================================
   REMOVE FROM WISHLIST
====================================================== */

exports.removeFromWishlist =
  async (req, res) => {
    try {

      const {
        productId,
      } = req.params;

      /* ================= VALIDATION ================= */

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid product id",
        });
      }

      /* ================= USER ================= */

      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      /* ================= REMOVE ================= */

      user.wishlist =
        user.wishlist.filter(
          (id) =>
            id.toString() !==
            productId
        );

      await user.save();

      return res.json({
        success: true,

        message:
          "Removed from wishlist",
      });

    } catch (error) {

      console.error(
        "REMOVE WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to remove wishlist",
      });
    }
  };

/* ======================================================
   CHECK WISHLIST ITEM
====================================================== */

exports.isInWishlist =
  async (req, res) => {
    try {

      const {
        productId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid product id",
        });
      }

      const user =
        await User.findById(
          req.user._id
        ).select(
          "wishlist"
        );

      const exists =
        user.wishlist.some(
          (id) =>
            id.toString() ===
            productId
        );

      return res.json({
        success: true,

        exists,
      });

    } catch (error) {

      console.error(
        "CHECK WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to check wishlist",
      });
    }
  };