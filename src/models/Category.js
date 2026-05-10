// src/models/Category.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   ATTRIBUTE SCHEMA
====================================================== */

const attributeSchema =
  new mongoose.Schema(
    {
      /* ================= BASIC ================= */

      name: {
        type: String,

        required: true,

        lowercase: true,

        trim: true,
      },

      displayName: {
        type: String,

        required: true,

        trim: true,
      },

      /* ================= INPUT TYPE ================= */

      type: {
        type: String,

        enum: [
          "text",
          "number",
          "select",
          "multi-select",
          "boolean",
          "date",
          "color",
        ],

        default: "text",
      },

      /* ================= OPTIONS ================= */

      options: [
        {
          type: String,

          trim: true,
        },
      ],

      /* ================= DEFAULT ================= */

      defaultValue: {
        type:
          mongoose.Schema.Types.Mixed,
      },

      placeholder: {
        type: String,

        trim: true,
      },

      unit: {
        type: String,

        trim: true,
      },

      /* ================= RANGE ================= */

      min: Number,

      max: Number,

      /* ================= FLAGS ================= */

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

        default: true,
      },

      isSearchable: {
        type: Boolean,

        default: true,
      },

      showInListing: {
        type: Boolean,

        default: false,
      },

      /* ================= SORT ================= */

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
   CATEGORY SCHEMA
====================================================== */

const categorySchema =
  new mongoose.Schema(
    {
      /* ================= BASIC ================= */

      name: {
        type: String,

        required: true,

        trim: true,

        minlength: 2,

        maxlength: 100,
      },

      slug: {
        type: String,

        required: true,

        lowercase: true,

        unique: true,

        trim: true,

        index: true,
      },

      /* ================= RELATION ================= */

      parent: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Category",

        default: null,
      },

      parentSlug: {
        type: String,

        lowercase: true,

        index: true,
      },

      /* ======================================================
         🔥 DYNAMIC ATTRIBUTE ENGINE
      ====================================================== */

      attributes: {
        type: [
          attributeSchema,
        ],

        default: [],
      },

      /* ================= SEO ================= */

      seoTitle: {
        type: String,

        trim: true,
      },

      seoDescription: {
        type: String,

        trim: true,
      },

      /* ================= UI ================= */

      icon: {
        type: String,
      },

      banner: {
        type: String,
      },

      image: {
        type: String,
      },

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

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

categorySchema.index({
  slug: 1,
});

categorySchema.index({
  parent: 1,
});

categorySchema.index({
  isActive: 1,
});

categorySchema.index({
  isFeatured: 1,
});

/* ======================================================
   AUTO SLUG
====================================================== */

categorySchema.pre(
  "validate",

  function (next) {

    if (
      !this.slug &&
      this.name
    ) {

      this.slug =
        this.name
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );
    }

    next();
  }
);

/* ======================================================
   CLEAN ATTRIBUTES
====================================================== */

categorySchema.pre(
  "save",

  function (next) {

    /* ================= ATTRIBUTES ================= */

    if (
      this.attributes &&
      this.attributes.length
    ) {

      this.attributes =
        this.attributes.map(
          (attr) => ({
            ...attr,

            name:
              attr.name
                .toLowerCase()
                .trim(),

            displayName:
              attr.displayName?.trim(),
          })
        );
    }

    /* ================= PARENT SLUG ================= */

    if (
      this.parent &&
      !this.parentSlug
    ) {
      this.parentSlug =
        undefined;
    }

    next();
  }
);

/* ======================================================
   VIRTUALS
====================================================== */

categorySchema.virtual(
  "attributeCount"
).get(function () {

  return (
    this.attributes
      ?.length || 0
  );
});

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .Category ||
  mongoose.model(
    "Category",
    categorySchema
  );