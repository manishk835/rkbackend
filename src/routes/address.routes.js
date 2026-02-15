const express = require("express");
const router = express.Router();

const {
  getMyAddresses,
  createAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");

const { protect } = require("../middlewares/auth.middleware");

/* ======================================================
   ALL ROUTES PROTECTED (USER LOGIN REQUIRED)
====================================================== */

router.get("/", protect, getMyAddresses);

router.post("/", protect, createAddress);

router.delete("/:id", protect, deleteAddress);

router.put("/:id/default", protect, setDefaultAddress);

module.exports = router;
