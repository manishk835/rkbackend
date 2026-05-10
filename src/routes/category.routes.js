// src/routes/category.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require(
  "../controllers/category.controller"
);

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  adminAuth,
} = require(
  "../middlewares/admin.middleware"
);

const rateLimit = require(
  "express-rate-limit"
);

/* ======================================================
   RATE LIMIT
====================================================== */

const categoryLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max: 100,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many requests",
    },
  });

/* ======================================================
   PUBLIC ROUTES
====================================================== */

/*
GET
/api/categories
*/

router.get(
  "/",

  categoryLimiter,

  getCategories
);

/* ======================================================
   ADMIN ROUTES
====================================================== */

router.use(
  adminAuth
);

/* ================= CREATE ================= */

/*
POST
/api/categories
*/

router.post(
  "/",

  createCategory
);

/* ================= UPDATE ================= */

/*
PUT
/api/categories/:id
*/

router.put(
  "/:id",

  updateCategory
);

/* ================= DELETE ================= */

/*
DELETE
/api/categories/:id
*/

router.delete(
  "/:id",

  deleteCategory
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;