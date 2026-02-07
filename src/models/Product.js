// src/models/Product.js
const mongoose = require("mongoose");

/* ================= VARIANT SCHEMA ================= */
const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      required: true,
      uppercase: true,
    },
    
    priceOverride: Number,
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
    url: { type: String, required: true },
    alt: String,
    order: Number,
  },
  { _id: false }
);

/* ================= PRODUCT SCHEMA ================= */
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

    brand: String,

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

    tags: [String],

    /* ================= PRICING ================= */
    price: {
      type: Number,
      required: true,
    },

    originalPrice: Number,

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
    variants: [variantSchema],

    /* ================= STOCK ================= */
    totalStock: {
      type: Number,
      default: 0,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    maxOrderQty: {
      type: Number,
      default: 5,
    },

    /* ================= PRODUCT DETAILS ================= */
    material: String,
    fit: String,
    pattern: String,
    sleeve: String,
    occasion: String,
    careInstructions: String,
    countryOfOrigin: String,

    /* ================= DELIVERY & POLICY ================= */
    codAvailable: {
      type: Boolean,
      default: true,
    },

    returnDays: {
      type: Number,
      default: 7,
    },

    replacementDays: {
      type: Number,
      default: 7,
    },

    deliveryEstimate: String,

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

    /* ================= SEO ================= */
    seoTitle: String,
    seoDescription: String,

    /* ================= META ================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */
productSchema.index({ title: "text", tags: "text" });

/* ================= MIDDLEWARE ================= */

// 🔹 Auto slug generate (if not provided)
productSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

// 🔹 Auto calculate stock (CREATE + SAVE)
productSchema.pre("save", function () {
  if (Array.isArray(this.variants)) {
    this.totalStock = this.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );
    this.inStock = this.totalStock > 0;
  }
});

// 🔹 Auto calculate stock (UPDATE)
productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.variants && Array.isArray(update.variants)) {
    const totalStock = update.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    update.totalStock = totalStock;
    update.inStock = totalStock > 0;
    this.setUpdate(update);
  }
});

// 🔹 Auto-generate SKU if missing
productSchema.pre("validate", function () {
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach((v, i) => {
      if (!v.sku && this.slug) {
        v.sku = `${this.slug.toUpperCase()}-${
          v.size || "NA"
        }-${v.color || "NA"}-${i + 1}`;
      }
    });
  }
});


module.exports = mongoose.model("Product", productSchema);