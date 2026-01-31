// src/seed/seedProducts.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/Product");
const connectDB = require("../config/db");

dotenv.config();

const products = [
  /* ================= MEN ================= */
  {
    title: "Men Cotton Kurta",
    slug: "men-cotton-kurta",
    description: "Premium cotton kurta for daily and festive wear.",
    brand: "RK Fashion",
    price: 899,
    originalPrice: 1299,
    discountPercent: 30,

    thumbnail:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38",

    images: [
      { url: "https://images.unsplash.com/photo-1520975916090-3105956dac38" },
      { url: "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36" },
    ],

    category: "men",
    subCategory: "kurta",
    tags: ["kurta", "men", "ethnic"],

    variants: [
      { size: "M", color: "White", stock: 10, sku: "MK-M-WHT" },
      { size: "L", color: "White", stock: 8, sku: "MK-L-WHT" },
    ],

    totalStock: 18,
    inStock: true,

    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,

    rating: 4.4,
    reviewsCount: 56,
  },

  {
    title: "Men Casual Shirt",
    slug: "men-casual-shirt",
    description: "Comfortable casual shirt perfect for everyday use.",
    brand: "RK Fashion",
    price: 799,
    originalPrice: 1199,
    discountPercent: 33,

    thumbnail:
      "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36",

    images: [
      { url: "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36" },
    ],

    category: "men",
    subCategory: "shirts",
    tags: ["shirt", "men", "casual"],

    variants: [
      { size: "M", color: "Blue", stock: 12, sku: "MS-M-BLU" },
      { size: "L", color: "Blue", stock: 6, sku: "MS-L-BLU" },
    ],

    totalStock: 18,
    inStock: true,
    isFeatured: true,

    rating: 4.2,
    reviewsCount: 34,
  },

  /* ================= WOMEN ================= */
  {
    title: "Women Floral Kurti",
    slug: "women-floral-kurti",
    description: "Elegant floral kurti made from soft breathable fabric.",
    brand: "RK Fashion",
    price: 1099,
    originalPrice: 1599,
    discountPercent: 31,

    thumbnail:
      "https://images.unsplash.com/photo-1520975695917-6aeb5f9b9b56",

    images: [
      { url: "https://images.unsplash.com/photo-1520975695917-6aeb5f9b9b56" },
    ],

    category: "women",
    subCategory: "kurti",
    tags: ["kurti", "women", "ethnic"],

    variants: [
      { size: "M", color: "Pink", stock: 7, sku: "WK-M-PNK" },
      { size: "L", color: "Pink", stock: 5, sku: "WK-L-PNK" },
    ],

    totalStock: 12,
    inStock: true,
    isFeatured: true,
    isNewArrival: true,

    rating: 4.6,
    reviewsCount: 41,
  },

  /* ================= FOOTWEAR ================= */
  {
    title: "Men Running Shoes",
    slug: "men-running-shoes",
    description: "Lightweight running shoes with extra cushioning.",
    brand: "RK Active",
    price: 1999,
    originalPrice: 2999,
    discountPercent: 33,

    thumbnail:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",

    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
    ],

    category: "footwear",
    subCategory: "shoes",
    tags: ["shoes", "men", "sports"],

    variants: [
      { size: "8", color: "Black", stock: 5, sku: "SH-8-BLK" },
      { size: "9", color: "Black", stock: 4, sku: "SH-9-BLK" },
    ],

    totalStock: 9,
    inStock: true,
    isFeatured: true,
    isBestSeller: true,

    rating: 4.5,
    reviewsCount: 63,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("🔥 Clearing existing products...");
    await Product.deleteMany();

    console.log("🚀 Seeding real products...");
    await Product.insertMany(products);

    console.log("✅ Products seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedProducts();


// // src/seed/seedProducts.js
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const Product = require("../models/Product");
// const connectDB = require("../config/db");

// dotenv.config();

// const products = [
//   // ================= MEN =================
//   {
//     title: "Men Cotton Kurta",
//     slug: "men-cotton-kurta",
//     price: 899,
//     originalPrice: 1299,
//     image: "https://images.unsplash.com/photo-1520975916090-3105956dac38",
//     category: "men",
//     subCategory: "kurta",
//     inStock: true,
//     isFeatured: true,
//     isNewArrival: true,
//   },
//   {
//     title: "Men Printed Kurta",
//     slug: "men-printed-kurta",
//     price: 999,
//     originalPrice: 1499,
//     image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
//     category: "men",
//     subCategory: "kurta",
//     inStock: true,
//     isFeatured: false,
//     isNewArrival: true,
//   },
//   {
//     title: "Men Casual Shirt",
//     slug: "men-casual-shirt",
//     price: 799,
//     originalPrice: 1199,
//     image: "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36",
//     category: "men",
//     subCategory: "shirts",
//     inStock: true,
//     isFeatured: true,
//   },

//   // ================= WOMEN =================
//   {
//     title: "Women Floral Kurti",
//     slug: "women-floral-kurti",
//     price: 1099,
//     originalPrice: 1599,
//     image: "https://images.unsplash.com/photo-1520975695917-6aeb5f9b9b56",
//     category: "women",
//     subCategory: "kurti",
//     inStock: true,
//     isFeatured: true,
//     isNewArrival: true,
//   },
//   {
//     title: "Women Cotton Kurti",
//     slug: "women-cotton-kurti",
//     price: 899,
//     originalPrice: 1299,
//     image: "https://images.unsplash.com/photo-1600180758895-7d3a6d7a7d4c",
//     category: "women",
//     subCategory: "kurti",
//     inStock: true,
//   },

//   // ================= KIDS =================
//   {
//     title: "Kids Festive Kurta",
//     slug: "kids-festive-kurta",
//     price: 699,
//     originalPrice: 999,
//     image: "https://images.unsplash.com/photo-1600180758784-8b99f5f7e2db",
//     category: "kids",
//     subCategory: "kurta",
//     inStock: true,
//     isNewArrival: true,
//   },

//   // ================= FOOTWEAR =================
//   {
//     title: "Men Running Shoes",
//     slug: "men-running-shoes",
//     price: 1999,
//     originalPrice: 2999,
//     image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
//     category: "footwear",
//     subCategory: "shoes",
//     inStock: true,
//     isFeatured: true,
//   },
// ];

// const seedProducts = async () => {
//   try {
//     await connectDB();

//     console.log("🔥 Clearing existing products...");
//     await Product.deleteMany();

//     console.log("🚀 Seeding products...");
//     await Product.insertMany(products);

//     console.log("✅ Products seeded successfully!");
//     process.exit();
//   } catch (error) {
//     console.error("❌ Seed failed:", error);
//     process.exit(1);
//   }
// };

// seedProducts();
