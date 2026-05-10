// src/routes/wishlist.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} = require(
  "../controllers/wishlist.controller"
);

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
} = require(
  "../middlewares/auth.middleware"
);

const rateLimit = require(
  "express-rate-limit"
);

/* ======================================================
   RATE LIMIT
====================================================== */

const wishlistLimiter =
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
        "Too many wishlist requests",
    },
  });

/* ======================================================
   ALL ROUTES REQUIRE LOGIN
====================================================== */

router.use(
  protect,
  wishlistLimiter
);

/* ======================================================
   GET WISHLIST
====================================================== */

/*
GET
/api/wishlist
*/

router.get(
  "/",

  getWishlist
);

/* ======================================================
   ADD TO WISHLIST
====================================================== */

/*
POST
/api/wishlist
BODY:
{
  productId
}
*/

router.post(
  "/",

  addToWishlist
);

/* ======================================================
   CHECK PRODUCT IN WISHLIST
====================================================== */

/*
GET
/api/wishlist/check/:productId
*/

router.get(
  "/check/:productId",

  isInWishlist
);

/* ======================================================
   REMOVE FROM WISHLIST
====================================================== */

/*
DELETE
/api/wishlist/:productId
*/

router.delete(
  "/:productId",

  removeFromWishlist
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;