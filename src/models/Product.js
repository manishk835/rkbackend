const mongoose = require("mongoose");

/* ================= VARIANT ================= */

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
  { _id: false }
);

/* ================= IMAGE ================= */

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    alt: String,
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ================= PRODUCT ================= */

const productSchema = new mongoose.Schema(
  {
    /* ================= BASIC ================= */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text",
    },

    slug: {
      type: String,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
      maxlength: 300,
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
      index: true,
    },

    subCategory: {
      type: String,
      lowercase: true,
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
    },

    images: [imageSchema],

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
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    /* ================= FLAGS ================= */

    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },

    /* ================= SELLER ================= */

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= ANALYTICS ================= */

    views: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1, status: 1 });

productSchema.index(
  { "variants.sku": 1 },
  { unique: true, sparse: true }
);

/* ================= AUTO SLUG ================= */

productSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    const baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    this.slug = `${baseSlug}-${Date.now()}`;
  }
});

/* ================= STOCK CALC ================= */

productSchema.pre("save", function () {
  if (this.variants?.length) {
    this.totalStock = this.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    this.inStock = this.totalStock > 0;
  }
});

/* ================= EXPORT ================= */

module.exports =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

// const mongoose = require("mongoose");

// /* ================= VARIANT ================= */

// const variantSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     attributes: {
//       type: Map,
//       of: mongoose.Schema.Types.Mixed,
//       default: {},
//     },

//     stock: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     sku: {
//       type: String,
//       required: true,
//       uppercase: true,
//       trim: true,
//     },

//     priceOverride: {
//       type: Number,
//       min: 0,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { _id: false }
// );

// /* ================= IMAGE ================= */

// const imageSchema = new mongoose.Schema(
//   {
//     url: { type: String, required: true },
//     public_id: { type: String, required: true },
//     alt: String,
//     order: { type: Number, default: 0 },
//   },
//   { _id: false }
// );

// /* ================= PRODUCT ================= */

// const productSchema = new mongoose.Schema(
//   {
//     /* ================= BASIC ================= */

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 200,
//       index: "text",
//     },

//     slug: {
//       type: String,
//       lowercase: true,
//       index: true,
//     },

//     description: {
//       type: String,
//       required: true,
//     },

//     shortDescription: {
//       type: String,
//       maxlength: 300,
//     },

//     brand: {
//       type: String,
//       lowercase: true,
//       trim: true,
//       index: true,
//     },

//     /* ================= CATEGORY ================= */

//     category: {
//       type: String,
//       required: true,
//       lowercase: true,
//       index: true,
//     },

//     subCategory: {
//       type: String,
//       lowercase: true,
//       index: true,
//     },

//     categorySchemaId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//     },

//     /* ================= ATTRIBUTES ================= */

//     attributes: {
//       type: Map,
//       of: mongoose.Schema.Types.Mixed,
//       default: {},
//     },

//     searchKeywords: [
//       {
//         type: String,
//         lowercase: true,
//         index: true,
//       },
//     ],

//     tags: [
//       {
//         type: String,
//         lowercase: true,
//         trim: true,
//         index: true,
//       },
//     ],

//     /* ================= PRICING ================= */

//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//       index: true,
//     },

//     originalPrice: {
//       type: Number,
//       min: 0,
//     },

//     discountPercent: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 100,
//     },

//     currency: {
//       type: String,
//       default: "INR",
//     },

//     /* ================= MEDIA ================= */

//     thumbnail: {
//       type: String,
//       required: true,
//     },

//     images: [imageSchema],

//     /* ================= VARIANTS ================= */

//     variants: {
//       type: [variantSchema],
//       validate: {
//         validator: (v) => v.length > 0,
//         message: "At least one variant required",
//       },
//     },

//     /* ================= STOCK ================= */

//     totalStock: {
//       type: Number,
//       default: 0,
//       index: true,
//     },

//     inStock: {
//       type: Boolean,
//       default: true,
//     },

//     lowStockThreshold: {
//       type: Number,
//       default: 5,
//     },

//     /* ================= REVIEWS ================= */

//     rating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5,
//       index: true,
//     },

//     reviewsCount: {
//       type: Number,
//       default: 0,
//     },

//     /* ================= FLAGS ================= */

//     isFeatured: { type: Boolean, default: false, index: true },
//     isNewArrival: { type: Boolean, default: false, index: true },
//     isBestSeller: { type: Boolean, default: false, index: true },

//     isActive: { type: Boolean, default: true, index: true },
//     isDeleted: { type: Boolean, default: false, index: true },

//     /* ================= STATUS ================= */

//     status: {
//       type: String,
//       enum: ["draft", "pending", "approved", "rejected"],
//       default: "draft",
//       index: true,
//     },

//     /* ================= SELLER ================= */

//     seller: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     /* ================= APPROVAL ================= */

//     isApproved: { type: Boolean, default: false, index: true },

//     approvedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

//     approvedAt: Date,

//     /* ================= ANALYTICS ================= */

//     views: { type: Number, default: 0 },
//     purchases: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// /* ================= INDEXES ================= */

// productSchema.index({ seller: 1 });
// productSchema.index({ category: 1 });
// productSchema.index({ price: 1 });
// productSchema.index({ isActive: 1, isApproved: 1 });

// // 🔥 FIXED SKU INDEX
// productSchema.index(
//   { "variants.sku": 1 },
//   { unique: true, sparse: true }
// );

// /* ================= AUTO SLUG ================= */

// productSchema.pre("validate", function () {
//   if (!this.slug && this.title) {
//     const baseSlug = this.title
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "");

//     this.slug = `${baseSlug}-${Date.now()}`;
//   }
// });

// /* ================= STOCK CALC ================= */

// productSchema.pre("save", function () {
//   if (this.variants) {
//     this.totalStock = this.variants.reduce(
//       (sum, v) => sum + (Number(v.stock) || 0),
//       0
//     );

//     this.inStock = this.totalStock > 0;
//   }
// });

// /* ================= PRICE VALIDATION ================= */

// productSchema.pre("save", function (next) {
//   if (this.originalPrice && this.price > this.originalPrice) {
//     return next(new Error("Price cannot exceed original price"));
//   }
//   next();
// });

// module.exports =
//   mongoose.models.Product ||
//   mongoose.model("Product", productSchema);