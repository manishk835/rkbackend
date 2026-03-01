// src/seed/seedProducts.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/Product");
const User = require("../models/User");
const connectDB = require("../config/db");

dotenv.config();

const products = [
  /* ================= MEN ================= */

  {
    title: "Men Premium Cotton T-Shirt",
    slug: "men-premium-cotton-tshirt",
    brand: "rk fashion",
    category: "men",
    subCategory: "tshirts",
    tags: ["tshirt", "cotton", "men"],

    shortDescription: "Breathable premium cotton everyday t-shirt.",
    description:
      "Soft 100% cotton t-shirt designed for comfort and durability. Perfect for casual daily wear.",

    price: 499,
    originalPrice: 999,
    discountPercent: 50,

    thumbnail:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",

    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
        public_id: "seed-1",
        alt: "Front View",
      },
    ],

    variants: [
      { size: "M", color: "Black", stock: 10, sku: "TS-M-BLK" },
      { size: "L", color: "Black", stock: 8, sku: "TS-L-BLK" },
    ],

    rating: 4.5,
    reviewsCount: 120,

    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    isApproved: true,
  },

  {
    title: "Men Slim Fit Denim Jeans",
    slug: "men-slim-fit-denim-jeans",
    brand: "urban style",
    category: "men",
    subCategory: "jeans",
    tags: ["jeans", "denim", "men"],

    shortDescription: "Stretchable slim fit denim jeans.",
    description:
      "Premium slim fit denim jeans with stretch fabric for everyday comfort.",

    price: 1299,
    originalPrice: 2499,
    discountPercent: 48,

    thumbnail:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",

    images: [
      {
        url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",
        public_id: "seed-2",
      },
    ],

    variants: [
      { size: "30", color: "Blue", stock: 5, sku: "JE-30-BLU" },
      { size: "32", color: "Blue", stock: 7, sku: "JE-32-BLU" },
    ],

    rating: 4.2,
    reviewsCount: 80,

    isNewArrival: true,
    isActive: true,
    isApproved: true,
  },

  /* ================= WOMEN ================= */

  {
    title: "Women Floral Printed Kurti",
    slug: "women-floral-printed-kurti",
    brand: "rk fashion",
    category: "women",
    subCategory: "kurtis",
    tags: ["kurti", "women", "ethnic"],

    shortDescription: "Elegant floral printed kurti for daily wear.",
    description:
      "Comfortable rayon kurti with floral print, ideal for office and casual outings.",

    price: 899,
    originalPrice: 1799,
    discountPercent: 50,

    thumbnail:
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03",

    images: [
      {
        url: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03",
        public_id: "seed-3",
      },
    ],

    variants: [
      { size: "S", color: "Pink", stock: 6, sku: "KU-S-PNK" },
      { size: "M", color: "Pink", stock: 9, sku: "KU-M-PNK" },
    ],

    rating: 4.6,
    reviewsCount: 230,

    isFeatured: true,
    isActive: true,
    isApproved: true,
  },

  /* ================= KIDS ================= */

  {
    title: "Kids Cartoon Hoodie",
    slug: "kids-cartoon-hoodie",
    brand: "happy kids",
    category: "kids",
    subCategory: "hoodies",
    tags: ["kids", "hoodie", "winter"],

    shortDescription: "Warm hoodie with fun cartoon print.",
    description:
      "Soft fleece hoodie designed for kids comfort during winter season.",

    price: 699,
    originalPrice: 1399,
    discountPercent: 50,

    thumbnail:
      "https://images.unsplash.com/photo-1503457574465-84c3b2d0a77c",

    images: [
      {
        url: "https://images.unsplash.com/photo-1503457574465-84c3b2d0a77c",
        public_id: "seed-4",
      },
    ],

    variants: [
      { size: "4-5Y", color: "Red", stock: 5, sku: "KH-4-RED" },
      { size: "6-7Y", color: "Red", stock: 7, sku: "KH-6-RED" },
    ],

    rating: 4.4,
    reviewsCount: 55,

    isBestSeller: true,
    isActive: true,
    isApproved: true,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("🔎 Fetching Admin as Seller...");

    const admin = await User.findOne({
      email: "admin@rkfashion.com",
    });

    if (!admin) {
      throw new Error("Admin not found.");
    }

    await Product.deleteMany();

    const productsWithSeller = products.map((p) => ({
      ...p,
      seller: admin._id,
    }));

    await Product.insertMany(productsWithSeller);

    console.log("✅ Marketplace seed completed!");
    process.exit();

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedProducts();

// // // src/seed/seedProducts.js
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const Product = require("../models/Product");
// const User = require("../models/User");
// const connectDB = require("../config/db");

// dotenv.config();

// const products = [
//   {
//     title: "Men Bomber Jacket Lightweight",
//     slug: "men-bomber-jacket-lightweight",
//     brand: "RK Fashion",
//     category: "men",
//     subCategory: "jackets",
//     tags: ["jacket", "bomber", "men", "winter"],

//     shortDescription:
//       "Lightweight bomber jacket for daily winter wear.",
//     description:
//       "Premium quality lightweight bomber jacket made with durable polyester fabric. Perfect for winter and casual outings.",

//     price: 449,
//     originalPrice: 1999,
//     discountPercent: 78,
//     currency: "INR",
//     taxInclusive: true,

//     thumbnail:
//       "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",

//     images: [
//       {
//         url: "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",
//         alt: "Front",
//         order: 1,
//       },
//       {
//         url: "https://images.unsplash.com/photo-1593032465171-8a5b2a0b12c5",
//         alt: "Side",
//         order: 2,
//       },
//     ],

//     variants: [
//       { size: "S", color: "Green", stock: 5, sku: "JB-S-GRN" },
//       { size: "M", color: "Green", stock: 10, sku: "JB-M-GRN" },
//     ],

//     totalStock: 36,
//     maxOrderQty: 5,

//     material: "Polyester",
//     fit: "Regular Fit",
//     pattern: "Solid",
//     sleeve: "Full Sleeve",
//     occasion: "Casual",
//     countryOfOrigin: "India",

//     codAvailable: true,
//     returnDays: 10,
//     replacementDays: 7,

//     rating: 4.3,
//     reviewsCount: 4053,

//     isFeatured: true,
//     isNewArrival: true,
//     isBestSeller: true,
//     isActive: true,
//   },
// ];

// const seedProducts = async () => {
//   try {
//     await connectDB();

//     console.log("🔥 Fetching Admin as Seller...");

//     const admin = await User.findOne({
//       email: "admin@rkfashion.com",
//     });

//     if (!admin) {
//       throw new Error(
//         "Admin not found. Please create admin first."
//       );
//     }

//     console.log("🔥 Clearing existing products...");
//     await Product.deleteMany();

//     console.log("🚀 Assigning seller to all products...");

//     const productsWithSeller = products.map((p) => ({
//       ...p,
//       seller: admin._id,   // 🔥 IMPORTANT FIX
//     }));

//     await Product.insertMany(productsWithSeller);

//     console.log("✅ Products seeded successfully!");
//     process.exit();

//   } catch (error) {
//     console.error("❌ Seed failed:", error);
//     process.exit(1);
//   }
// };

// seedProducts();
