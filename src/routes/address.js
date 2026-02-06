// routes/address.js
const router = require("express").Router();
const Address = require("../models/Address");

// GET saved addresses
router.get("/:userId", async (req, res) => {
  const addresses = await Address.find({ userId: req.params.userId });
  res.json(addresses);
});

// ADD new address
router.post("/", async (req, res) => {
  const address = new Address(req.body);
  await address.save();
  res.json(address);
});

module.exports = router;
