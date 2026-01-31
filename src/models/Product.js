const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    /* ================= PRICING ================= */
    price: {
      type: Number,
      required: true,
    },

    originalPrice: {
      type: Number,
    },

    discountPercent: {
      type: Number,
      default: 0,
    },

    /* ================= IMAGES ================= */
    images: [
      {
        url: String,
        alt: String,
      },
    ],

    thumbnail: {
      type: String,
      required: true,
    },

    /* ================= CATEGORY ================= */
    category: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    subCategory: {
      type: String,
      lowercase: true,
      index: true,
    },

    tags: [String],

    /* ================= VARIANTS ================= */
    variants: [
      {
        size: String,        // S, M, L, XL
        color: String,       // Red, Black
        stock: Number,
        sku: String,
      },
    ],

    /* ================= STOCK ================= */
    totalStock: {
      type: Number,
      default: 0,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    /* ================= FLAGS ================= */
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /* ================= RATINGS ================= */
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    /* ================= SEO ================= */
    seoTitle: String,
    seoDescription: String,

    /* ================= META ================= */
    createdBy: {
      type: String, // admin id later
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
