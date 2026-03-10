const mongoose = require("mongoose");

/* ================= CART ITEM ================= */

const cartItemSchema = new mongoose.Schema(
{
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  variant: {
    size: String,
    color: String,
    sku: String,
  },

  thumbnail: String,

},
{ _id: false }
);

/* ================= CART ================= */

const cartSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },

  items: {
    type: [cartItemSchema],
    default: [],
  },

  totalItems: {
    type: Number,
    default: 0,
  },

  subtotal: {
    type: Number,
    default: 0,
  },

},
{ timestamps: true }
);

/* ================= AUTO CALC ================= */

cartSchema.pre("save", function () {

  let itemsCount = 0;
  let subtotalAmount = 0;

  if (this.items && this.items.length > 0) {

    this.items.forEach((item) => {

      itemsCount += item.quantity;

      subtotalAmount += item.price * item.quantity;

    });

  }

  this.totalItems = itemsCount;
  this.subtotal = subtotalAmount;

});

/* ================= EXPORT ================= */

module.exports =
  mongoose.models.Cart ||
  mongoose.model("Cart", cartSchema);