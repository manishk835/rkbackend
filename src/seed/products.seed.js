const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/Product");
const User = require("../models/User");
const connectDB = require("../config/db");

dotenv.config();

const products = [
  {
    title: "Men Bomber Jacket Lightweight",
    slug: "men-bomber-jacket-lightweight",
    brand: "RK Fashion",
    category: "men",
    subCategory: "jackets",
    tags: ["jacket", "bomber", "men", "winter"],

    shortDescription:
      "Lightweight bomber jacket for daily winter wear.",
    description:
      "Premium quality lightweight bomber jacket made with durable polyester fabric. Perfect for winter and casual outings.",

    price: 449,
    originalPrice: 1999,
    discountPercent: 78,
    currency: "INR",
    taxInclusive: true,

    thumbnail:
      "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",

    images: [
      {
        url: "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",
        alt: "Front",
        order: 1,
      },
      {
        url: "https://images.unsplash.com/photo-1593032465171-8a5b2a0b12c5",
        alt: "Side",
        order: 2,
      },
    ],

    variants: [
      { size: "S", color: "Green", stock: 5, sku: "JB-S-GRN" },
      { size: "M", color: "Green", stock: 10, sku: "JB-M-GRN" },
    ],

    totalStock: 36,
    maxOrderQty: 5,

    material: "Polyester",
    fit: "Regular Fit",
    pattern: "Solid",
    sleeve: "Full Sleeve",
    occasion: "Casual",
    countryOfOrigin: "India",

    codAvailable: true,
    returnDays: 10,
    replacementDays: 7,

    rating: 4.3,
    reviewsCount: 4053,

    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("🔥 Fetching Admin as Seller...");

    const admin = await User.findOne({
      email: "admin@rkfashion.com",
    });

    if (!admin) {
      throw new Error(
        "Admin not found. Please create admin first."
      );
    }

    console.log("🔥 Clearing existing products...");
    await Product.deleteMany();

    console.log("🚀 Assigning seller to all products...");

    const productsWithSeller = products.map((p) => ({
      ...p,
      seller: admin._id,   // 🔥 IMPORTANT FIX
    }));

    await Product.insertMany(productsWithSeller);

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
//   {
//     /* ================= CORE ================= */
//     title: "Men Bomber Jacket Lightweight",
//     slug: "men-bomber-jacket-lightweight",
//     brand: "RK Fashion",
//     category: "men",
//     subCategory: "jackets",
//     tags: ["jacket", "bomber", "men", "winter"],

//     /* ================= DESCRIPTION ================= */
//     shortDescription:
//       "Lightweight bomber jacket for daily winter wear.",
//     description:
//       "Premium quality lightweight bomber jacket made with durable polyester fabric. Perfect for winter and casual outings. Stylish, comfortable and long lasting.",

//     /* ================= PRICING ================= */
//     price: 449,
//     originalPrice: 1999,
//     discountPercent: 78,
//     currency: "INR",
//     taxInclusive: true,

//     /* ================= IMAGES ================= */
//     thumbnail:
//       "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",

//     images: [
//       {
//         url: "https://images.unsplash.com/photo-1618354691310-7fef1d3caa92",
//         alt: "Men Bomber Jacket Front",
//         order: 1,
//       },
//       {
//         url: "https://images.unsplash.com/photo-1593032465171-8a5b2a0b12c5",
//         alt: "Men Bomber Jacket Side",
//         order: 2,
//       },
//       {
//         url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273",
//         alt: "Men Bomber Jacket Back",
//         order: 3,
//       },
//     ],

//     /* ================= VARIANTS ================= */
//     variants: [
//       { size: "S", color: "Green", stock: 5, sku: "JB-S-GRN" },
//       { size: "M", color: "Green", stock: 10, sku: "JB-M-GRN" },
//       { size: "L", color: "Green", stock: 8, sku: "JB-L-GRN" },
//       { size: "XL", color: "Green", stock: 6, sku: "JB-XL-GRN" },
//       { size: "L", color: "Black", stock: 7, sku: "JB-L-BLK" },
//     ],

//     /* ================= STOCK ================= */
//     totalStock: 36,
//     inStock: true,
//     maxOrderQty: 5,

//     /* ================= PRODUCT DETAILS ================= */
//     material: "Polyester",
//     fit: "Regular Fit",
//     pattern: "Solid",
//     sleeve: "Full Sleeve",
//     occasion: "Casual, Winter Wear",
//     careInstructions:
//       "Machine wash cold, do not bleach, dry in shade",
//     countryOfOrigin: "India",

//     /* ================= DELIVERY & POLICY ================= */
//     codAvailable: true,
//     returnDays: 10,
//     replacementDays: 7,
//     deliveryEstimate: "2-4 business days",

//     /* ================= RATINGS ================= */
//     rating: 4.3,
//     reviewsCount: 4053,

//     /* ================= FLAGS ================= */
//     isFeatured: true,
//     isNewArrival: true,
//     isBestSeller: true,
//     isActive: true,
//   },
// ];

// const seedProducts = async () => {
//   try {
//     await connectDB();

//     console.log("🔥 Clearing existing products...");
//     await Product.deleteMany();

//     console.log("🚀 Seeding REAL products...");
//     await Product.insertMany(products);

//     console.log("✅ Products seeded successfully!");
//     process.exit();
//   } catch (error) {
//     console.error("❌ Seed failed:", error);
//     process.exit(1);
//   }
// };

// seedProducts();