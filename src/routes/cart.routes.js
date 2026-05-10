// src/routes/cart.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  getCart,
  addToCart,
  updateCartItem,
  removeItem,
  clearCart,
} = require(
  "../controllers/cart.controller"
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
   RATE LIMITERS
====================================================== */

const cartLimiter =
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
        "Too many cart requests. Please try again later.",
    },
  });

/* ======================================================
   ALL CART ROUTES REQUIRE LOGIN
====================================================== */

router.use(
  protect,
  cartLimiter
);

/* ======================================================
   GET CART
====================================================== */

/*
GET
/api/cart
*/

router.get(
  "/",

  getCart
);

/* ======================================================
   ADD TO CART
====================================================== */

/*
POST
/api/cart/add
*/

router.post(
  "/add",

  addToCart
);

/* ======================================================
   UPDATE CART ITEM
====================================================== */

/*
PUT
/api/cart/update
*/

router.put(
  "/update",

  updateCartItem
);

/* ======================================================
   REMOVE ITEM
====================================================== */

/*
DELETE
/api/cart/remove
*/

router.delete(
  "/remove",

  removeItem
);

/* ======================================================
   CLEAR CART
====================================================== */

/*
DELETE
/api/cart/clear
*/

router.delete(
  "/clear",

  clearCart
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;