// src/seed/seedProducts.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/Product");
const connectDB = require("../config/db");

dotenv.config();

const products = [
  {
    /* ================= CORE ================= */
    title: "Men Bomber Jacket Lightweight",
    slug: "men-bomber-jacket-lightweight",
    brand: "RK Fashion",
    category: "men",
    subCategory: "jackets",
    tags: ["jacket", "bomber", "men", "winter"],

    /* ================= DESCRIPTION ================= */
    shortDescription:
      "Lightweight bomber jacket for daily winter wear.",
    description:
      "Premium quality lightweight bomber jacket made with durable polyester fabric. Perfect for winter and casual outings. Stylish, comfortable and long lasting.",

    /* ================= PRICING ================= */
    price: 449,
    originalPrice: 1999,
    discountPercent: 78,
    currency: "INR",
    taxInclusive: true,

    /* ================= IMAGES ================= */
    thumbnail:
      "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",

    images: [
      {
        url: "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",
        alt: "Men Bomber Jacket Front",
        order: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1593032465171-8a5b2a0b12c5",
        alt: "Men Bomber Jacket Side",
        order: 2,
      },
      {
        url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273",
        alt: "Men Bomber Jacket Back",
        order: 3,
      },
    ],

    /* ================= VARIANTS ================= */
    variants: [
      { size: "S", color: "Green", stock: 5, sku: "JB-S-GRN" },
      { size: "M", color: "Green", stock: 10, sku: "JB-M-GRN" },
      { size: "L", color: "Green", stock: 8, sku: "JB-L-GRN" },
      { size: "XL", color: "Green", stock: 6, sku: "JB-XL-GRN" },
      { size: "L", color: "Black", stock: 7, sku: "JB-L-BLK" },
    ],

    /* ================= STOCK ================= */
    totalStock: 36,
    inStock: true,
    maxOrderQty: 5,

    /* ================= PRODUCT DETAILS ================= */
    material: "Polyester",
    fit: "Regular Fit",
    pattern: "Solid",
    sleeve: "Full Sleeve",
    occasion: "Casual, Winter Wear",
    careInstructions:
      "Machine wash cold, do not bleach, dry in shade",
    countryOfOrigin: "India",

    /* ================= DELIVERY & POLICY ================= */
    codAvailable: true,
    returnDays: 10,
    replacementDays: 7,
    deliveryEstimate: "2-4 business days",

    /* ================= RATINGS ================= */
    rating: 4.3,
    reviewsCount: 4053,

    /* ================= FLAGS ================= */
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("🔥 Clearing existing products...");
    await Product.deleteMany();

    console.log("🚀 Seeding REAL products...");
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
//   /* ================= MEN ================= */
//   {
//     title: "Men Cotton Kurta",
//     slug: "men-cotton-kurta",
//     description: "Premium cotton kurta for daily and festive wear.",
//     brand: "RK Fashion",
//     price: 899,
//     originalPrice: 1299,
//     discountPercent: 30,

//     thumbnail:
//       "https://images.unsplash.com/photo-1520975916090-3105956dac38",

//     images: [
//       { url: "https://images.unsplash.com/photo-1520975916090-3105956dac38" },
//       { url: "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36" },
//     ],

//     category: "men",
//     subCategory: "kurta",
//     tags: ["kurta", "men", "ethnic"],

//     variants: [
//       { size: "M", color: "White", stock: 10, sku: "MK-M-WHT" },
//       { size: "L", color: "White", stock: 8, sku: "MK-L-WHT" },
//     ],

//     totalStock: 18,
//     inStock: true,

//     isFeatured: true,
//     isNewArrival: true,
//     isBestSeller: true,

//     rating: 4.4,
//     reviewsCount: 56,
//   },

//   {
//     title: "Men Casual Shirt",
//     slug: "men-casual-shirt",
//     description: "Comfortable casual shirt perfect for everyday use.",
//     brand: "RK Fashion",
//     price: 799,
//     originalPrice: 1199,
//     discountPercent: 33,

//     thumbnail:
//       "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36",

//     images: [
//       { url: "https://images.unsplash.com/photo-1520975682031-a08f2fba5c36" },
//     ],

//     category: "men",
//     subCategory: "shirts",
//     tags: ["shirt", "men", "casual"],

//     variants: [
//       { size: "M", color: "Blue", stock: 12, sku: "MS-M-BLU" },
//       { size: "L", color: "Blue", stock: 6, sku: "MS-L-BLU" },
//     ],

//     totalStock: 18,
//     inStock: true,
//     isFeatured: true,

//     rating: 4.2,
//     reviewsCount: 34,
//   },

//   /* ================= WOMEN ================= */
//   {
//     title: "Women Floral Kurti",
//     slug: "women-floral-kurti",
//     description: "Elegant floral kurti made from soft breathable fabric.",
//     brand: "RK Fashion",
//     price: 1099,
//     originalPrice: 1599,
//     discountPercent: 31,

//     thumbnail:
//       "https://images.unsplash.com/photo-1520975695917-6aeb5f9b9b56",

//     images: [
//       { url: "https://images.unsplash.com/photo-1520975695917-6aeb5f9b9b56" },
//     ],

//     category: "women",
//     subCategory: "kurti",
//     tags: ["kurti", "women", "ethnic"],

//     variants: [
//       { size: "M", color: "Pink", stock: 7, sku: "WK-M-PNK" },
//       { size: "L", color: "Pink", stock: 5, sku: "WK-L-PNK" },
//     ],

//     totalStock: 12,
//     inStock: true,
//     isFeatured: true,
//     isNewArrival: true,

//     rating: 4.6,
//     reviewsCount: 41,
//   },

//   /* ================= FOOTWEAR ================= */
//   {
//     title: "Men Running Shoes",
//     slug: "men-running-shoes",
//     description: "Lightweight running shoes with extra cushioning.",
//     brand: "RK Active",
//     price: 1999,
//     originalPrice: 2999,
//     discountPercent: 33,

//     thumbnail:
//       "https://images.unsplash.com/photo-1542291026-7eec264c27ff",

//     images: [
//       { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
//     ],

//     category: "footwear",
//     subCategory: "shoes",
//     tags: ["shoes", "men", "sports"],

//     variants: [
//       { size: "8", color: "Black", stock: 5, sku: "SH-8-BLK" },
//       { size: "9", color: "Black", stock: 4, sku: "SH-9-BLK" },
//     ],

//     totalStock: 9,
//     inStock: true,
//     isFeatured: true,
//     isBestSeller: true,

//     rating: 4.5,
//     reviewsCount: 63,
//   },
// ];

// const seedProducts = async () => {
//   try {
//     await connectDB();

//     console.log("🔥 Clearing existing products...");
//     await Product.deleteMany();

//     console.log("🚀 Seeding real products...");
//     await Product.insertMany(products);

//     console.log("✅ Products seeded successfully!");
//     process.exit();
//   } catch (error) {
//     console.error("❌ Seed failed:", error);
//     process.exit(1);
//   }
// };

// seedProducts();