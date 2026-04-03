const mongoose = require("mongoose");

/* ================= ATTRIBUTE ================= */

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "text",
        "number",
        "select",
        "multi-select",
        "boolean",
        "date",
      ],
      default: "text",
    },

    options: [
      {
        type: String,
        trim: true,
      },
    ],

    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    placeholder: {
      type: String,
    },

    unit: {
      type: String, // kg, cm, ml
    },

    min: Number,
    max: Number,

    isRequired: {
      type: Boolean,
      default: false,
    },

    isVariant: {
      type: Boolean,
      default: false,
    },

    isFilterable: {
      type: Boolean,
      default: true, // frontend filters
    },

    isSearchable: {
      type: Boolean,
      default: true,
    },

    showInListing: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
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

    /* 🔥 CORE: DYNAMIC ATTRIBUTE ENGINE */
    attributes: {
      type: [attributeSchema],
      default: [],
    },

    /* ================= SEO ================= */

    seoTitle: String,
    seoDescription: String,

    /* ================= UI ================= */

    icon: String,
    banner: String,

    /* ================= CONTROL ================= */

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });

/* ================= SLUG AUTO ================= */

categorySchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
});

/* ================= CLEAN ATTRIBUTES ================= */

categorySchema.pre("save", function () {
  if (this.attributes && this.attributes.length) {
    this.attributes = this.attributes.map((attr) => ({
      ...attr,
      name: attr.name.toLowerCase().trim(),
    }));
  }
});

module.exports =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema);