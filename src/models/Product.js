// models/Product.js

const mongoose = require("mongoose");
const slugify = require("slugify");

/* ======================================================
   VARIANT SCHEMA
====================================================== */

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
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
  {
    _id: false,
  }
);

/* ======================================================
   IMAGE SCHEMA
====================================================== */

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    public_id: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/* ======================================================
   PRODUCT SCHEMA
====================================================== */

const productSchema = new mongoose.Schema(
  {
    /* ================= BASIC ================= */

    title: {
      type: String,
      trim: true,
      maxlength: 200,
      index: "text",
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text",
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      maxlength: 300,
      trim: true,
    },

    brand: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* ================= CATEGORY ================= */

    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    subCategory: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* ================= DYNAMIC ATTRIBUTES ================= */

    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /* ================= SEARCH ================= */

    searchKeywords: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
      },
    ],

    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
      },
    ],

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

    /* ================= MEDIA ================= */

    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [imageSchema],
      default: [],
    },

    /* ================= VARIANTS ================= */

    variants: {
      type: [variantSchema],

      validate: {
        validator: (v) => v.length > 0,
        message: "At least one variant required",
      },
    },

    /* ================= STOCK ================= */

    totalStock: {
      type: Number,
      default: 0,
      index: true,
    },

    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
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

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ================= STATUS ================= */

    status: {
      type: String,

      enum: [
        "draft",
        "pending",
        "approved",
        "rejected",
      ],

      default: "pending",

      index: true,
    },

    /* ================= SELLER ================= */

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= ADMIN ================= */

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    /* ================= ANALYTICS ================= */

    views: {
      type: Number,
      default: 0,
    },

    purchases: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================================================
   INDEXES
====================================================== */

productSchema.index({
  seller: 1,
});

productSchema.index({
  category: 1,
});

productSchema.index({
  subCategory: 1,
});

productSchema.index({
  price: 1,
});

productSchema.index({
  rating: -1,
});

productSchema.index({
  createdAt: -1,
});

productSchema.index({
  isActive: 1,
  isApproved: 1,
  isDeleted: 1,
});

productSchema.index(
  {
    title: "text",
    name: "text",
    brand: "text",
    category: "text",
    subCategory: "text",
    tags: "text",
    searchKeywords: "text",
  },
  {
    weights: {
      title: 10,
      name: 10,
      brand: 6,
      category: 4,
      subCategory: 4,
      tags: 3,
      searchKeywords: 2,
    },
  }
);

productSchema.index(
  {
    "variants.sku": 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

/* ======================================================
   AUTO SLUG
====================================================== */

productSchema.pre("validate", function () {

  if (!this.title && this.name) {
    this.title = this.name;
  }

  if (!this.name && this.title) {
    this.name = this.title;
  }

  const baseName =
    this.title || this.name;

  if (!this.slug && baseName) {

    const baseSlug = slugify(baseName, {
      lower: true,
      strict: true,
      trim: true,
    });

    this.slug = `${baseSlug}-${Date.now()}`;
  }

});

/* ======================================================
   AUTO SEARCH KEYWORDS
====================================================== */

productSchema.pre("save", function () {
  const keywords = new Set();

  if (this.title) {
    this.title
      .toLowerCase()
      .split(" ")
      .forEach((k) => keywords.add(k));
  }

  if (this.name) {
    this.name
      .toLowerCase()
      .split(" ")
      .forEach((k) => keywords.add(k));
  }

  if (this.brand) {
    keywords.add(
      this.brand.toLowerCase()
    );
  }

  if (this.category) {
    keywords.add(
      this.category.toLowerCase()
    );
  }

  if (this.subCategory) {
    keywords.add(
      this.subCategory.toLowerCase()
    );
  }

  this.searchKeywords = [
    ...keywords,
  ];

});

/* ======================================================
   STOCK CALCULATION
====================================================== */

productSchema.pre("save", function () {
  if (this.variants?.length) {

    this.totalStock =
      this.variants.reduce(
        (sum, variant) =>
          sum +
          (Number(variant.stock) || 0),
        0
      );

    this.inStock =
      this.totalStock > 0;
  }

});

/* ======================================================
   JSON TRANSFORM
====================================================== */

productSchema.set("toJSON", {
  transform: function (_, ret) {

    delete ret.__v;

    return ret;
  },
});



/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );