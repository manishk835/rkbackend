const Address = require("../models/Address");

/* ======================================================
   GET USER ADDRESSES
====================================================== */
exports.getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(addresses);
  } catch (error) {
    console.error("Get Addresses Error:", error);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

/* ======================================================
   CREATE ADDRESS
====================================================== */
exports.createAddress = async (req, res) => {
  try {
    const { name, phone, address, city, pincode, isDefault } = req.body;

    if (!name || !phone || !address || !city || !pincode) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // If setting default → unset old default
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { isDefault: false }
      );
    }

    const newAddress = await Address.create({
      user: req.user._id,
      name,
      phone,
      address,
      city,
      pincode,
      isDefault: isDefault || false,
    });

    res.status(201).json(newAddress);

  } catch (error) {
    console.error("Create Address Error:", error);
    res.status(500).json({ message: "Failed to create address" });
  }
};

/* ======================================================
   DELETE ADDRESS
====================================================== */
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    await address.deleteOne();

    res.json({ message: "Address deleted successfully" });

  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};

/* ======================================================
   SET DEFAULT ADDRESS
====================================================== */
exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // unset previous default
    await Address.updateMany(
      { user: req.user._id },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    res.json({ message: "Default address updated" });

  } catch (error) {
    console.error("Set Default Error:", error);
    res.status(500).json({ message: "Failed to update default address" });
  }
};
