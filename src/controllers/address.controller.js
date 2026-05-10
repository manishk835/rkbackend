// src/controllers/address.controller.js

const mongoose = require("mongoose");

const Address = require("../models/Address");

/* ======================================================
   VALIDATORS
====================================================== */

const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

const isValidPincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

/* ======================================================
   CREATE ADDRESS
====================================================== */

exports.createAddress = async (
  req,
  res
) => {
  try {

    const {
      name,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !name ||
      !phone ||
      !address ||
      !city ||
      !pincode
    ) {
      return res.status(400).json({
        message:
          "All required fields are mandatory",
      });
    }

    if (
      !isValidPhone(phone)
    ) {
      return res.status(400).json({
        message:
          "Invalid phone number",
      });
    }

    if (
      !isValidPincode(
        pincode
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid pincode",
      });
    }

    /* ================= DEFAULT HANDLING ================= */

    if (isDefault) {

      await Address.updateMany(
        {
          user:
            req.user._id,
        },

        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    /* ================= CREATE ================= */

    const newAddress =
      await Address.create({
        user:
          req.user._id,

        name:
          name.trim(),

        phone:
          phone.trim(),

        address:
          address.trim(),

        city:
          city.trim(),

        state:
          state?.trim() ||
          "",

        country:
          country?.trim() ||
          "India",

        pincode:
          pincode.trim(),

        landmark:
          landmark?.trim() ||
          "",

        addressType:
          addressType ||
          "home",

        isDefault:
          !!isDefault,
      });

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Address created successfully",

        address:
          newAddress,
      });

  } catch (error) {

    console.error(
      "Create Address Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create address",
    });
  }
};

/* ======================================================
   GET USER ADDRESSES
====================================================== */

exports.getUserAddresses =
  async (req, res) => {
    try {

      const addresses =
        await Address.find({
          user:
            req.user._id,
        })
          .sort({
            isDefault: -1,
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,

        count:
          addresses.length,

        addresses,
      });

    } catch (error) {

      console.error(
        "Get Address Error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch addresses",
      });
    }
  };

/* ======================================================
   GET SINGLE ADDRESS
====================================================== */

exports.getSingleAddress =
  async (req, res) => {
    try {

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid address id",
        });
      }

      const address =
        await Address.findOne({
          _id: id,

          user:
            req.user._id,
        }).lean();

      if (!address) {
        return res.status(404).json({
          message:
            "Address not found",
        });
      }

      return res.json({
        success: true,
        address,
      });

    } catch (error) {

      return res.status(500).json({
        message:
          "Failed to fetch address",
      });
    }
  };

/* ======================================================
   UPDATE ADDRESS
====================================================== */

exports.updateAddress =
  async (req, res) => {
    try {

      const { id } =
        req.params;

      const {
        name,
        phone,
        address,
        city,
        state,
        country,
        pincode,
        landmark,
        addressType,
        isDefault,
      } = req.body;

      /* ================= VALID ID ================= */

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid address id",
        });
      }

      /* ================= FIND ================= */

      const existing =
        await Address.findOne({
          _id: id,

          user:
            req.user._id,
        });

      if (!existing) {
        return res.status(404).json({
          message:
            "Address not found",
        });
      }

      /* ================= VALIDATION ================= */

      if (
        phone &&
        !isValidPhone(
          phone
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid phone number",
        });
      }

      if (
        pincode &&
        !isValidPincode(
          pincode
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid pincode",
        });
      }

      /* ================= DEFAULT ================= */

      if (isDefault) {

        await Address.updateMany(
          {
            user:
              req.user._id,
          },

          {
            $set: {
              isDefault: false,
            },
          }
        );
      }

      /* ================= UPDATE ================= */

      existing.name =
        name ??
        existing.name;

      existing.phone =
        phone ??
        existing.phone;

      existing.address =
        address ??
        existing.address;

      existing.city =
        city ??
        existing.city;

      existing.state =
        state ??
        existing.state;

      existing.country =
        country ??
        existing.country;

      existing.pincode =
        pincode ??
        existing.pincode;

      existing.landmark =
        landmark ??
        existing.landmark;

      existing.addressType =
        addressType ??
        existing.addressType;

      existing.isDefault =
        isDefault ??
        existing.isDefault;

      await existing.save();

      return res.json({
        success: true,

        message:
          "Address updated successfully",

        address:
          existing,
      });

    } catch (error) {

      console.error(
        "Update Address Error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update address",
      });
    }
  };

/* ======================================================
   DELETE ADDRESS
====================================================== */

exports.deleteAddress =
  async (req, res) => {
    try {

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid address id",
        });
      }

      const deleted =
        await Address.findOneAndDelete(
          {
            _id: id,

            user:
              req.user._id,
          }
        );

      if (!deleted) {
        return res.status(404).json({
          message:
            "Address not found",
        });
      }

      /* ================= AUTO DEFAULT ================= */

      if (
        deleted.isDefault
      ) {

        const nextAddress =
          await Address.findOne({
            user:
              req.user._id,
          }).sort({
            createdAt: -1,
          });

        if (nextAddress) {

          nextAddress.isDefault =
            true;

          await nextAddress.save();
        }
      }

      return res.json({
        success: true,

        message:
          "Address deleted successfully",
      });

    } catch (error) {

      console.error(
        "Delete Address Error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to delete address",
      });
    }
  };

/* ======================================================
   SET DEFAULT ADDRESS
====================================================== */

exports.setDefaultAddress =
  async (req, res) => {
    try {

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid address id",
        });
      }

      const address =
        await Address.findOne({
          _id: id,

          user:
            req.user._id,
        });

      if (!address) {
        return res.status(404).json({
          message:
            "Address not found",
        });
      }

      /* ================= REMOVE OLD DEFAULT ================= */

      await Address.updateMany(
        {
          user:
            req.user._id,
        },

        {
          $set: {
            isDefault: false,
          },
        }
      );

      /* ================= SET NEW ================= */

      address.isDefault =
        true;

      await address.save();

      return res.json({
        success: true,

        message:
          "Default address updated",
      });

    } catch (error) {

      console.error(
        "Set Default Error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to set default address",
      });
    }
  };