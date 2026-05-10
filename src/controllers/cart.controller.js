// src/controllers/cart.controller.js

const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ======================================================
   GET CART
====================================================== */

exports.getCart = async (
  req,
  res
) => {
  try {

    let cart =
      await Cart.findOne({
        user:
          req.user._id,
      }).populate({
        path:
          "items.productId",

        populate: {
          path: "seller",
          select:
            "name email role",
        },
      });

    /* ================= CREATE EMPTY CART ================= */

    if (!cart) {

      cart =
        await Cart.create({
          user:
            req.user._id,

          items: [],
        });
    }

    return res.json({
      success: true,

      cart,
    });

  } catch (error) {

    console.error(
      "GET CART ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch cart",
    });
  }
};

/* ======================================================
   ADD TO CART
====================================================== */

exports.addToCart = async (
  req,
  res
) => {
  try {

    const {
      productId,
      quantity = 1,
      variant,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (!productId) {
      return res.status(400).json({
        message:
          "Product ID required",
      });
    }

    /* ================= PRODUCT ================= */

    const product =
      await Product.findById(
        productId
      ).populate(
        "seller",
        "name email role"
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

    /* ================= STOCK CHECK ================= */

    let availableStock =
      product.totalStock ||
      0;

    if (
      variant?.sku &&
      product.variants
    ) {

      const matchedVariant =
        product.variants.find(
          (v) =>
            v.sku ===
            variant.sku
        );

      if (!matchedVariant) {
        return res.status(404).json({
          message:
            "Variant not found",
        });
      }

      availableStock =
        matchedVariant.stock ||
        0;
    }

    if (
      quantity >
      availableStock
    ) {
      return res.status(400).json({
        message:
          "Insufficient stock",
      });
    }

    /* ================= GET CART ================= */

    let cart =
      await Cart.findOne({
        user:
          req.user._id,
      });

    if (!cart) {

      cart =
        new Cart({
          user:
            req.user._id,

          items: [],
        });
    }

    /* ================= EXISTING ITEM ================= */

    const existingItem =
      cart.items.find(
        (item) =>
          item.productId.toString() ===
            productId &&
          (
            item.variant?.sku ||
            "DEFAULT"
          ) ===
            (
              variant?.sku ||
              "DEFAULT"
            )
      );

    if (existingItem) {

      const newQty =
        existingItem.quantity +
        quantity;

      if (
        newQty >
        availableStock
      ) {
        return res.status(400).json({
          message:
            "Stock limit exceeded",
        });
      }

      existingItem.quantity =
        newQty;

    } else {

      cart.items.push({
        productId:
          product._id,

        seller:
          product.seller?._id ||
          product.seller,

        title:
          product.title,

        price:
          variant?.priceOverride ||
          product.price,

        quantity,

        thumbnail:
          product.thumbnail ||
          product.images?.[0]
            ?.url ||
          "",

        variant: variant
          ? {
              sku:
                variant.sku ||
                "DEFAULT",

              name:
                variant.name ||
                "",

              stock:
                variant.stock ||
                0,

              priceOverride:
                variant.priceOverride ||
                product.price,

              attributes:
                variant.attributes ||
                {},
            }
          : {
              sku:
                "DEFAULT",

              name:
                "Default",

              stock:
                availableStock,
            },
      });
    }

    /* ================= SAVE ================= */

    await cart.save();

    /* ================= POPULATE ================= */

    const populatedCart =
      await Cart.findById(
        cart._id
      ).populate({
        path:
          "items.productId",

        populate: {
          path: "seller",
          select:
            "name email role",
        },
      });

    return res.json({
      success: true,

      message:
        "Added to cart",

      cart:
        populatedCart,
    });

  } catch (error) {

    console.error(
      "ADD TO CART ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to add item",
    });
  }
};

/* ======================================================
   UPDATE CART ITEM
====================================================== */

exports.updateCartItem =
  async (req, res) => {
    try {

      const {
        productId,
        quantity,
        sku,
      } = req.body;

      if (
        quantity < 1
      ) {
        return res.status(400).json({
          message:
            "Quantity must be at least 1",
        });
      }

      const cart =
        await Cart.findOne({
          user:
            req.user._id,
        });

      if (!cart) {
        return res.status(404).json({
          message:
            "Cart not found",
        });
      }

      const item =
        cart.items.find(
          (i) =>
            i.productId.toString() ===
              productId &&
            (
              i.variant?.sku ||
              "DEFAULT"
            ) ===
              (
                sku ||
                "DEFAULT"
              )
        );

      if (!item) {
        return res.status(404).json({
          message:
            "Item not found",
        });
      }

      /* ================= PRODUCT STOCK ================= */

      const product =
        await Product.findById(
          productId
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      let stock =
        product.totalStock ||
        0;

      if (
        sku &&
        product.variants
      ) {

        const matched =
          product.variants.find(
            (v) =>
              v.sku === sku
          );

        stock =
          matched?.stock ||
          0;
      }

      if (
        quantity > stock
      ) {
        return res.status(400).json({
          message:
            "Stock exceeded",
        });
      }

      item.quantity =
        quantity;

      await cart.save();

      return res.json({
        success: true,

        message:
          "Cart updated",

        cart,
      });

    } catch (error) {

      console.error(
        "UPDATE CART ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Update failed",
      });
    }
  };

/* ======================================================
   REMOVE ITEM
====================================================== */

exports.removeItem =
  async (req, res) => {
    try {

      const {
        productId,
        sku,
      } = req.body;

      const cart =
        await Cart.findOne({
          user:
            req.user._id,
        });

      if (!cart) {
        return res.status(404).json({
          message:
            "Cart not found",
        });
      }

      cart.items =
        cart.items.filter(
          (item) =>
            !(
              item.productId.toString() ===
                productId &&
              (
                item.variant
                  ?.sku ||
                "DEFAULT"
              ) ===
                (
                  sku ||
                  "DEFAULT"
                )
            )
        );

      await cart.save();

      return res.json({
        success: true,

        message:
          "Item removed",

        cart,
      });

    } catch (error) {

      console.error(
        "REMOVE CART ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Remove failed",
      });
    }
  };

/* ======================================================
   CLEAR CART
====================================================== */

exports.clearCart =
  async (req, res) => {
    try {

      const cart =
        await Cart.findOne({
          user:
            req.user._id,
        });

      if (!cart) {
        return res.json({
          success: true,

          message:
            "Cart already empty",
        });
      }

      cart.items = [];

      await cart.save();

      return res.json({
        success: true,

        message:
          "Cart cleared",
      });

    } catch (error) {

      console.error(
        "CLEAR CART ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to clear cart",
      });
    }
  };