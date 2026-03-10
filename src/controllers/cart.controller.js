const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ================= GET CART ================= */

exports.getCart = async (req, res) => {

  try {

    let cart = await Cart.findOne({ user: req.user._id })
      .populate("items.productId");

    if (!cart) {
      cart = await Cart.create({ user: req.user._id });
    }

    res.json(cart);

  } catch (error) {

    res.status(500).json({ message: "Failed to fetch cart" });

  }

};

/* ================= ADD TO CART ================= */

exports.addToCart = async (req, res) => {

  try {

    const { productId, quantity, variant } = req.body;

    const product = await Product.findById(productId);

    if (!product || !product.isActive || !product.isApproved) {
      return res.status(404).json({
        message: "Product not available",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.variant?.sku === variant?.sku
    );

    if (existingItem) {

      existingItem.quantity += quantity || 1;

    } else {

      cart.items.push({
        productId: product._id,
        seller: product.seller,
        title: product.title,
        price: product.price,
        quantity: quantity || 1,
        variant,
        thumbnail: product.thumbnail,
      });

    }

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({ message: "Failed to add item" });

  }

};

/* ================= UPDATE CART ITEM ================= */

exports.updateCartItem = async (req, res) => {

  try {

    const { productId, quantity, sku } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (i) =>
        i.productId.toString() === productId &&
        i.variant?.sku === sku
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    item.quantity = quantity;

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({
      message: "Update failed",
    });

  }

};

/* ================= REMOVE ITEM ================= */

exports.removeItem = async (req, res) => {

  try {

    const { productId, sku } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          item.variant?.sku === sku
        )
    );

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({
      message: "Remove failed",
    });

  }

};

/* ================= CLEAR CART ================= */

exports.clearCart = async (req, res) => {

  try {

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.json({ message: "Cart already empty" });
    }

    cart.items = [];

    await cart.save();

    res.json({ message: "Cart cleared" });

  } catch (error) {

    res.status(500).json({
      message: "Failed to clear cart",
    });

  }

};