// src/models/Address.js

const mongoose = require("mongoose");

/* ======================================================
   ADDRESS SCHEMA
====================================================== */

const addressSchema =
  new mongoose.Schema(
    {
      /* ================= USER ================= */

      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* ================= BASIC INFO ================= */

      name: {
        type: String,

        required: true,

        trim: true,

        minlength: 2,

        maxlength: 100,
      },

      phone: {
        type: String,

        required: true,

        trim: true,

        match:
          /^[6-9]\d{9}$/,

        index: true,
      },

      /* ================= ADDRESS ================= */

      address: {
        type: String,

        required: true,

        trim: true,

        maxlength: 500,
      },

      landmark: {
        type: String,

        trim: true,

        maxlength: 200,
      },

      city: {
        type: String,

        required: true,

        trim: true,

        maxlength: 100,
      },

      state: {
        type: String,

        trim: true,

        maxlength: 100,

        default: "",
      },

      country: {
        type: String,

        trim: true,

        maxlength: 100,

        default: "India",
      },

      pincode: {
        type: String,

        required: true,

        trim: true,

        match:
          /^\d{6}$/,

        index: true,
      },

      /* ================= TYPE ================= */

      addressType: {
        type: String,

        enum: [
          "home",
          "work",
          "office",
          "other",
        ],

        default: "home",
      },

      /* ================= DEFAULT ================= */

      isDefault: {
        type: Boolean,

        default: false,

        index: true,
      },

      /* ================= DELIVERY ================= */

      deliveryInstructions: {
        type: String,

        trim: true,

        maxlength: 500,
      },

      /* ================= GEO LOCATION ================= */

      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    {
      timestamps: true,
    }
  );

/* ======================================================
   INDEXES
====================================================== */

addressSchema.index({
  user: 1,
});

addressSchema.index({
  user: 1,
  isDefault: 1,
});

addressSchema.index({
  pincode: 1,
});

addressSchema.index({
  city: 1,
});

/* ======================================================
   AUTO DEFAULT ADDRESS
====================================================== */

addressSchema.pre(
  "save",
  async function (next) {

    try {

      /* ================= FIRST ADDRESS ================= */

      if (
        this.isNew
      ) {

        const existing =
          await mongoose
            .model("Address")
            .countDocuments({
              user:
                this.user,
            });

        if (
          existing === 0
        ) {
          this.isDefault =
            true;
        }
      }

      /* ================= SINGLE DEFAULT ================= */

      if (
        this.isDefault
      ) {

        await mongoose
          .model("Address")
          .updateMany(
            {
              user:
                this.user,

              _id: {
                $ne:
                  this._id,
              },
            },

            {
              $set: {
                isDefault: false,
              },
            }
          );
      }

      next();

    } catch (err) {

      next(err);
    }
  }
);

/* ======================================================
   JSON TRANSFORM
====================================================== */

addressSchema.set(
  "toJSON",
  {
    transform:
      function (_, ret) {

        delete ret.__v;

        return ret;
      },
  }
);

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  mongoose.models
    .Address ||
  mongoose.model(
    "Address",
    addressSchema
  );