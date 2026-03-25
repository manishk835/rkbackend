// src/models/Category.js

const mongoose = require("mongoose");

/* ================= ATTRIBUTE ================= */

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String, // size, color, weight
      required: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String, // Size, Color
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "number", "select"],
      default: "text",
    },

    options: [
      {
        type: String, // ["S", "M", "L"]
      },
    ],

    isRequired: {
      type: Boolean,
      default: false,
    },

    isVariant: {
      type: Boolean,
      default: false, // 👈 IMPORTANT
    },
  },
  { _id: false }
);

/* ================= CATEGORY ================= */

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    parentSlug: {
      type: String,
      index: true,
    },

    /* 🔥 NEW: ATTRIBUTE SYSTEM */
    attributes: [attributeSchema],

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ================= SLUG ================= */

categorySchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");
  }
});

module.exports = mongoose.model("Category", categorySchema);

// // // src/models/Category.js

// const mongoose = require("mongoose");

// const categorySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     slug: {
//       type: String,
//       required: true,
//       lowercase: true,
//       unique: true,
//       index: true,
//     },
//     parentSlug: {
//         type: String, // "men" | "women" | "kids" | "footwear"
//         index: true,
//     },

//     parent: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       default: null, // null = main category
//     },

//     order: {
//       type: Number,
//       default: 0,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// categorySchema.pre("validate", function () {
//   if (!this.slug && this.name) {
//     this.slug = this.name
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9]+/g, "-");
//   }
// });

// module.exports = mongoose.model("Category", categorySchema);
