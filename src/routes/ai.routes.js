// src/routes/ai.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLER
====================================================== */

const {
  generateDescription,
} = require(
  "../controllers/ai.controller"
);

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
  requireRole,
  approvedSeller,
} = require(
  "../middlewares/auth.middleware"
);

const rateLimit = require(
  "express-rate-limit"
);

/* ======================================================
   RATE LIMIT
====================================================== */

const aiLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max: 20,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many AI requests. Please try again later.",
    },
  });

/* ======================================================
   SELLER ACCESS
====================================================== */

const sellerAccess = [
  protect,

  requireRole(
    "seller",
    "admin"
  ),
];

/* ======================================================
   ROUTES
====================================================== */

/*
POST
/api/ai/generate-description
*/

router.post(
  "/generate-description",

  aiLimiter,

  sellerAccess,

  generateDescription
);

/* ======================================================
   EXPORT
====================================================== */

module.exports = router;