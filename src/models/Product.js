// src/models/Product.js
const mongoose = require("mongoose");

/* ================= VARIANT SCHEMA ================= */
const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    priceOverride: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

/* ================= IMAGE SCHEMA ================= */
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ================= PRODUCT SCHEMA ================= */
const productSchema = new mongoose.Schema(
  {
    /* ================= BASIC ================= */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    brand: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    shortDescription: {
      type: String,
      maxlength: 300,
    },

    description: {
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

    tags: {
      type: [String],
      index: true,
    },

    /* ================= PRICING ================= */
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    originalPrice: {
      type: Number,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    currency: {
      type: String,
      default: "INR",
    },

    taxInclusive: {
      type: Boolean,
      default: true,
    },

    /* ================= IMAGES ================= */
    thumbnail: {
      type: String,
      required: true,
    },

    images: [imageSchema],

    /* ================= VARIANTS ================= */
    variants: {
      type: [variantSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one variant required",
      },
    },

    /* ================= STOCK ================= */
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },

    maxOrderQty: {
      type: Number,
      default: 5,
      min: 1,
    },

    /* ================= RATINGS ================= */
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    /* ================= FLAGS ================= */
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ================= SEO ================= */
    seoTitle: String,
    seoDescription: String,

    /* ================= MARKETPLACE ================= */

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    commissionPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

/* ================= TEXT SEARCH INDEX ================= */
productSchema.index({
  title: "text",
  brand: "text",
  category: "text",
  subCategory: "text",
  tags: "text",
});

/* ================= AUTO SLUG ================= */
productSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

/* ================= AUTO STOCK CALC ================= */
productSchema.pre("save", function () {
  if (Array.isArray(this.variants)) {
    this.totalStock = this.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );
    this.inStock = this.totalStock > 0;
  }
});

/* ================= AUTO STOCK ON UPDATE ================= */
productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.variants) {
    const totalStock = update.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    update.totalStock = totalStock;
    update.inStock = totalStock > 0;

    this.setUpdate(update);
  }
});

module.exports = mongoose.model("Product", productSchema);
