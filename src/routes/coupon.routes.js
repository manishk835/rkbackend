// src/routes/coupon.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
} = require(
  "../controllers/coupon.controller"
);

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  adminAuth,
} = require(
  "../middlewares/admin.middleware"
);

const {
  protect,
} = require(
  "../middlewares/auth.middleware"
);

const rateLimit = require(
  "express-rate-limit"
);

/* ======================================================
   RATE LIMITERS
====================================================== */

const couponLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max: 50,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many coupon requests",
    },
  });

const validateLimiter =
  rateLimit({
    windowMs:
      5 * 60 * 1000,

    max: 30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many validation attempts",
    },
  });

/* ======================================================
   PUBLIC / USER ROUTES
====================================================== */

/*
POST
/api/coupons/validate
*/

router.post(
  "/validate",

  validateLimiter,

  validateCoupon
);

/* ======================================================
   ADMIN ROUTES
====================================================== */

router.use(
  adminAuth,
  couponLimiter
);

/* ================= CREATE ================= */

/*
POST
/api/coupons
*/

router.post(
  "/",

  createCoupon
);

/* ================= GET ALL ================= */

/*
GET
/api/coupons
*/

router.get(
  "/",

  getCoupons
);

/* ================= TOGGLE ================= */

/*
PATCH
/api/coupons/:id/toggle
*/

router.patch(
  "/:id/toggle",

  toggleCoupon
);

/* ================= DELETE ================= */

/*
DELETE
/api/coupons/:id
*/

router.delete(
  "/:id",

  deleteCoupon
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;