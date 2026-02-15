// controllers/address.controller.js

const Address = require("../models/Address");
const mongoose = require("mongoose");

/* ======================================================
   CREATE ADDRESS
====================================================== */
exports.createAddress = async (req, res) => {
  try {
    const { name, phone, address, city, pincode, isDefault } = req.body;

    if (!name || !phone || !address || !city || !pincode) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    // If setting as default → remove previous default
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = await Address.create({
      user: req.user._id,
      name,
      phone,
      address,
      city,
      pincode,
      isDefault: !!isDefault,
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error("Create Address Error:", error);
    res.status(500).json({ message: "Failed to create address" });
  }
};

/* ======================================================
   GET USER ADDRESSES
====================================================== */
exports.getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });

    res.json(addresses);
  } catch (error) {
    console.error("Get Address Error:", error);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

/* ======================================================
   UPDATE ADDRESS (EDIT)
====================================================== */
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, pincode, isDefault } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    const existing = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    // If setting default → unset others
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      {
        name,
        phone,
        address,
        city,
        pincode,
        isDefault: !!isDefault,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error("Update Address Error:", error);
    res.status(500).json({ message: "Failed to update address" });
  }
};

/* ======================================================
   DELETE ADDRESS
====================================================== */
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    const deleted = await Address.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Address not found" });
    }

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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid address id" });
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove previous default
    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    res.json({ message: "Default address updated" });
  } catch (error) {
    console.error("Set Default Error:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};


// const Address = require("../models/Address");

// /* ======================================================
//    GET USER ADDRESSES
// ====================================================== */
// exports.getMyAddresses = async (req, res) => {
//   try {
//     const addresses = await Address.find({ user: req.user._id })
//       .sort({ createdAt: -1 });

//     res.json(addresses);
//   } catch (error) {
//     console.error("Get Addresses Error:", error);
//     res.status(500).json({ message: "Failed to fetch addresses" });
//   }
// };

// /* ======================================================
//    CREATE ADDRESS
// ====================================================== */
// exports.createAddress = async (req, res) => {
//   try {
//     const { name, phone, address, city, pincode, isDefault } = req.body;

//     if (!name || !phone || !address || !city || !pincode) {
//       return res.status(400).json({
//         message: "All fields required",
//       });
//     }

//     // If setting default → unset old default
//     if (isDefault) {
//       await Address.updateMany(
//         { user: req.user._id },
//         { isDefault: false }
//       );
//     }

//     const newAddress = await Address.create({
//       user: req.user._id,
//       name,
//       phone,
//       address,
//       city,
//       pincode,
//       isDefault: isDefault || false,
//     });

//     res.status(201).json(newAddress);

//   } catch (error) {
//     console.error("Create Address Error:", error);
//     res.status(500).json({ message: "Failed to create address" });
//   }
// };

// /* ======================================================
//    DELETE ADDRESS
// ====================================================== */
// exports.deleteAddress = async (req, res) => {
//   try {
//     const address = await Address.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!address) {
//       return res.status(404).json({
//         message: "Address not found",
//       });
//     }

//     await address.deleteOne();

//     res.json({ message: "Address deleted successfully" });

//   } catch (error) {
//     console.error("Delete Address Error:", error);
//     res.status(500).json({ message: "Failed to delete address" });
//   }
// };

// /* ======================================================
//    SET DEFAULT ADDRESS
// ====================================================== */
// exports.setDefaultAddress = async (req, res) => {
//   try {
//     const address = await Address.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!address) {
//       return res.status(404).json({
//         message: "Address not found",
//       });
//     }

//     // unset previous default
//     await Address.updateMany(
//       { user: req.user._id },
//       { isDefault: false }
//     );

//     address.isDefault = true;
//     await address.save();

//     res.json({ message: "Default address updated" });

//   } catch (error) {
//     console.error("Set Default Error:", error);
//     res.status(500).json({ message: "Failed to update default address" });
//   }
// };
