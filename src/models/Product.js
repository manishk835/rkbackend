// src/models/Product.js
const mongoose = require("mongoose");

/* ================= VARIANT SCHEMA ================= */
const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String, // S, M, L, XL, 2XL, 8, 9 etc.
      required: true,
    },

    color: {
      type: String, // Green, Black
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    priceOverride: {
      type: Number, // agar kisi size/color ka price alag ho
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
    url: {
      type: String,
      required: true,
    },
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

    brand: {
      type: String,
      trim: true,
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

    deliveryEstimate: {
      type: String, // "2-4 business days"
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
      ref: "User", // future admin
    },
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */
productSchema.index({ title: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);


// const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema(
//   {
//     /* ================= BASIC INFO ================= */
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     slug: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       index: true,
//     },

//     description: {
//       type: String,
//       required: true,
//     },

//     brand: {
//       type: String,
//       trim: true,
//     },

//     /* ================= PRICING ================= */
//     price: {
//       type: Number,
//       required: true,
//     },

//     originalPrice: {
//       type: Number,
//     },

//     discountPercent: {
//       type: Number,
//       default: 0,
//     },

//     /* ================= IMAGES ================= */
//     images: [
//       {
//         url: String,
//         alt: String,
//       },
//     ],

//     thumbnail: {
//       type: String,
//       required: true,
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

//     tags: [String],

//     /* ================= VARIANTS ================= */
//     variants: [
//       {
//         size: String,        // S, M, L, XL
//         color: String,       // Red, Black
//         stock: Number,
//         sku: String,
//       },
//     ],

//     /* ================= STOCK ================= */
//     totalStock: {
//       type: Number,
//       default: 0,
//     },

//     inStock: {
//       type: Boolean,
//       default: true,
//     },

//     /* ================= FLAGS ================= */
//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },

//     isNewArrival: {
//       type: Boolean,
//       default: false,
//     },

//     isBestSeller: {
//       type: Boolean,
//       default: false,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },

//     /* ================= RATINGS ================= */
//     rating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5,
//     },

//     reviewsCount: {
//       type: Number,
//       default: 0,
//     },

//     /* ================= SEO ================= */
//     seoTitle: String,
//     seoDescription: String,

//     /* ================= META ================= */
//     createdBy: {
//       type: String, // admin id later
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Product", productSchema);
