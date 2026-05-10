// src/routes/address.routes.js

const express = require("express");

const router = express.Router();

/* ======================================================
   CONTROLLERS
====================================================== */

const {
  createAddress,
  getUserAddresses,
  getSingleAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");

/* ======================================================
   MIDDLEWARES
====================================================== */

const {
  protect,
} = require("../middlewares/auth.middleware");

/* ======================================================
   PROTECTED ROUTES
====================================================== */

/* CREATE ADDRESS */
router.post(
  "/",
  protect,
  createAddress
);

/* GET ALL USER ADDRESSES */
router.get(
  "/",
  protect,
  getUserAddresses
);

/* GET SINGLE ADDRESS */
router.get(
  "/:id",
  protect,
  getSingleAddress
);

/* UPDATE ADDRESS */
router.put(
  "/:id",
  protect,
  updateAddress
);

/* DELETE ADDRESS */
router.delete(
  "/:id",
  protect,
  deleteAddress
);

/* SET DEFAULT ADDRESS */
router.patch(
  "/:id/default",
  protect,
  setDefaultAddress
);

module.exports = router;