// src/seed/seedProducts.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Product = require("../models/Product");
const User = require("../models/User");

const connectDB = require("../config/db");

dotenv.config();

/* ======================================================
   PRODUCTS
====================================================== */

const products = [

  /* ======================================================
     FASHION
  ====================================================== */

  {
    title: "Premium Cotton T-Shirt",

    category: "fashion",

    subCategory: "men",

    price: 499,

    description:
      "Comfortable cotton t-shirt for daily wear.",

    shortDescription:
      "Premium soft cotton t-shirt",

    thumbnail:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",

    images: [
      {
        url:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",

        public_id:
          "seed-1",
      },
    ],

    variants: [
      {
        name:
          "M / Black",

        stock: 10,

        sku:
          "TS-M-BLK",

        priceOverride:
          499,
      },

      {
        name:
          "L / Black",

        stock: 8,

        sku:
          "TS-L-BLK",

        priceOverride:
          499,
      },
    ],

    totalStock: 18,

    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    isApproved: true,
  },

  {
    title: "Women Kurti",

    category: "fashion",

    subCategory: "women",

    price: 899,

    description:
      "Elegant kurti for daily wear.",

    shortDescription:
      "Stylish women's kurti",

    thumbnail:
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03",

    images: [
      {
        url:
          "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03",

        public_id:
          "seed-2",
      },
    ],

    variants: [
      {
        name:
          "S / Pink",

        stock: 6,

        sku:
          "KU-S-PNK",

        priceOverride:
          899,
      },

      {
        name:
          "M / Pink",

        stock: 9,

        sku:
          "KU-M-PNK",

        priceOverride:
          899,
      },
    ],

    totalStock: 15,

    isNewArrival: true,
    isActive: true,
    isApproved: true,
  },

  /* ======================================================
     MEDICAL
  ====================================================== */

  {
    title:
      "Digital Thermometer",

    category:
      "medical",

    subCategory:
      "devices",

    price: 299,

    description:
      "Accurate digital thermometer for home use.",

    shortDescription:
      "Medical digital thermometer",

    thumbnail:
      "https://images.unsplash.com/photo-1584367369853-6c9cdb0c9c7c",

    images: [
      {
        url:
          "https://images.unsplash.com/photo-1584367369853-6c9cdb0c9c7c",

        public_id:
          "seed-3",
      },
    ],

    variants: [
      {
        name:
          "Standard",

        stock: 20,

        sku:
          "THERMO-STD",

        priceOverride:
          299,
      },
    ],

    totalStock: 20,

    isFeatured: true,
    isActive: true,
    isApproved: true,
  },

  {
    title:
      "Face Mask Pack",

    category:
      "medical",

    subCategory:
      "essentials",

    price: 199,

    description:
      "Pack of 50 disposable face masks.",

    shortDescription:
      "Disposable face masks",

    thumbnail:
      "https://images.unsplash.com/photo-1584634731339-252c581abfc5",

    images: [
      {
        url:
          "https://images.unsplash.com/photo-1584634731339-252c581abfc5",

        public_id:
          "seed-4",
      },
    ],

    variants: [
      {
        name:
          "Pack of 50",

        stock: 50,

        sku:
          "MASK-50",

        priceOverride:
          199,
      },
    ],

    totalStock: 50,

    isBestSeller: true,
    isActive: true,
    isApproved: true,
  },

  /* ======================================================
     ELECTRONICS
  ====================================================== */

  {
    title:
      "Wireless Headphones",

    category:
      "electronics",

    subCategory:
      "audio",

    price: 1999,

    description:
      "Bluetooth wireless headphones with deep bass.",

    shortDescription:
      "Wireless bass headphones",

    thumbnail:
      "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd",

    images: [
      {
        url:
          "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd",

        public_id:
          "seed-5",
      },
    ],

    variants: [
      {
        name:
          "Black",

        stock: 15,

        sku:
          "HP-BLK",

        priceOverride:
          1999,
      },
    ],

    totalStock: 15,

    isFeatured: true,
    isActive: true,
    isApproved: true,
  },

  {
    title:
      "Smartphone Charger",

    category:
      "electronics",

    subCategory:
      "accessories",

    price: 499,

    description:
      "Fast charging USB adapter.",

    shortDescription:
      "Fast charging adapter",

    thumbnail:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad",

    images: [
      {
        url:
          "https://images.unsplash.com/photo-1585386959984-a4155224a1ad",

        public_id:
          "seed-6",
      },
    ],

    variants: [
      {
        name:
          "Type-C",

        stock: 30,

        sku:
          "CHG-TC",

        priceOverride:
          499,
      },
    ],

    totalStock: 30,

    isNewArrival: true,
    isActive: true,
    isApproved: true,
  },
];

/* ======================================================
   SEED
====================================================== */

const seedProducts =
  async () => {
    try {

      /* ================= DB ================= */

      if (
        mongoose.connection
          .readyState === 0
      ) {
        await connectDB();
      }

      console.log(
        "🔎 Fetching Admin..."
      );

      /* ================= ADMIN ================= */

      const admin =
        await User.findOne({
          email:
            "manishkumar.dev08@gmail.com",
        });

      if (!admin) {
        throw new Error(
          "Admin not found"
        );
      }

      console.log(
        "🧹 Cleaning old products..."
      );

      await Product.deleteMany({
        seller:
          admin._id,
      });

      console.log(
        "📦 Inserting products..."
      );

      for (const p of products) {

        /* ================= STOCK ================= */

        const totalStock =
          p.variants.reduce(
            (acc, v) =>
              acc +
              (v.stock || 0),
            0
          );

        /* ================= UPSERT ================= */

        await Product.updateOne(
          {
            title:
              p.title,
          },

          {
            ...p,

            seller:
              admin._id,

            totalStock,

            inStock:
              totalStock > 0,

            slug:
              p.title
                .toLowerCase()
                .replace(
                  /\s+/g,
                  "-"
                ),

            status:
              "approved",
          },

          {
            upsert: true,
          }
        );
      }

      console.log(
        "✅ Seed completed successfully"
      );

      process.exit();

    } catch (err) {

      console.error(
        "❌ Seed Error:",
        err
      );

      process.exit(1);
    }
  };

seedProducts();