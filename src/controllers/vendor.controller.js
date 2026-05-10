// src/controllers/vendor.controller.js

const VendorApplication = require("../models/VendorApplication");
const User = require("../models/User");

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/* ======================================================
   EMAIL TRANSPORT
====================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ======================================================
   PASSWORD GENERATOR
====================================================== */

const generatePassword = () => {
  return crypto
    .randomBytes(6)
    .toString("base64")
    .slice(0, 10);
};

/* ======================================================
   APPLY AS VENDOR
====================================================== */

exports.applyVendor = async (req, res) => {
  try {

    /* ================= LOGIN REQUIRED ================= */

    if (!req.user) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const {
      businessName,
      phone,
      businessType,
      message,
      email,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !businessName?.trim() ||
      !phone?.trim() ||
      !businessType?.trim() ||
      !email?.trim()
    ) {
      return res.status(400).json({
        message:
          "All required fields missing",
      });
    }

    const emailRegex =
      /^\S+@\S+\.\S+$/;

    if (
      !emailRegex.test(email)
    ) {
      return res.status(400).json({
        message:
          "Invalid email format",
      });
    }

    /* ================= USER ================= */

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    /* ================= UPDATE EMAIL ================= */

    if (
      !user.email ||
      user.email !== email.trim()
    ) {
      user.email =
        email.trim();
    }

    /* ================= ALREADY SELLER ================= */

    if (
      user.sellerStatus ===
      "approved"
    ) {
      return res.status(400).json({
        message:
          "You are already a seller",
      });
    }

    /* ================= ALREADY PENDING ================= */

    if (
      user.sellerStatus ===
      "pending"
    ) {
      return res.status(400).json({
        message:
          "Application already submitted",
      });
    }

    /* ================= EXISTING APPLICATION ================= */

    const existing =
      await VendorApplication.findOne(
        {
          user: user._id,

          status: {
            $in: [
              "pending",
              "approved",
            ],
          },
        }
      );

    if (existing) {
      return res.status(400).json({
        message:
          "Application already submitted",
      });
    }

    /* ================= CREATE APPLICATION ================= */

    const application =
      await VendorApplication.create({
        user: user._id,

        businessName:
          businessName.trim(),

        email:
          email.trim(),

        phone:
          phone.trim(),

        category:
          businessType.trim(),

        businessType:
          businessType.trim(),

        message:
          message?.trim() || "",

        status: "pending",
      });

    /* ================= UPDATE USER ================= */

    user.sellerStatus =
      "pending";

    await user.save();

    return res.status(201).json({
      success: true,

      message:
        "Application submitted successfully",

      application,
    });

  } catch (error) {

    console.error(
      "Vendor Apply Error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

/* ======================================================
   GET ALL APPLICATIONS
====================================================== */

exports.getAllApplications =
  async (req, res) => {
    try {

      const applications =
        await VendorApplication.find()
          .populate(
            "user",
            "name email phone"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json(
        applications
      );

    } catch (error) {

      console.error(
        "Get Applications Error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",
      });
    }
  };

/* ======================================================
   GET SINGLE APPLICATION
====================================================== */

exports.getApplicationById =
  async (req, res) => {
    try {

      const application =
        await VendorApplication.findById(
          req.params.id
        ).populate(
          "user",
          "name email phone"
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      return res.json(
        application
      );

    } catch (error) {

      return res.status(500).json({
        message:
          "Server error",
      });
    }
  };

/* ======================================================
   UPDATE APPLICATION STATUS
====================================================== */

exports.updateApplicationStatus =
  async (req, res) => {
    try {

      const { id } =
        req.params;

      const { status } =
        req.body;

      /* ================= VALIDATION ================= */

      if (
        ![
          "approved",
          "rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid status",
        });
      }

      /* ================= APPLICATION ================= */

      const application =
        await VendorApplication.findById(
          id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      if (
        application.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "Application already reviewed",
        });
      }

      application.status =
        status;

      application.reviewedAt =
        new Date();

      await application.save();

      /* ======================================================
         APPROVED
      ====================================================== */

      if (
        status === "approved"
      ) {

        let user =
          await User.findOne({
            email:
              application.email,
          });

        const tempPassword =
          generatePassword();

        const hashedPassword =
          await bcrypt.hash(
            tempPassword,
            10
          );

        /* ================= CREATE USER ================= */

        if (!user) {

          user =
            await User.create({
              name:
                application.businessName,

              email:
                application.email,

              phone:
                application.phone,

              password:
                hashedPassword,

              role: "seller",

              sellerStatus:
                "approved",

              sellerApprovedAt:
                new Date(),

              businessType:
                application.businessType,

              sellerInfo: {
                storeName:
                  application.businessName,
              },
            });

        } else {

          /* ================= UPDATE USER ================= */

          user.role =
            "seller";

          user.sellerStatus =
            "approved";

          user.sellerApprovedAt =
            new Date();

          user.businessType =
            application.businessType;

          if (
            !user.sellerInfo
          ) {
            user.sellerInfo =
              {};
          }

          user.sellerInfo.storeName =
            application.businessName;

          /* ================= SET PASSWORD IF EMPTY ================= */

          if (
            !user.password
          ) {
            user.password =
              hashedPassword;
          }

          await user.save();
        }

        /* ================= EMAIL ================= */

        try {

          await transporter.sendMail({
            from: `"RK Fashion" <${process.env.EMAIL_USER}>`,

            to:
              application.email,

            subject:
              "Seller Account Approved",

            html: `
            <div style="font-family:Arial;padding:20px">

              <h2>
                Congratulations 🎉
              </h2>

              <p>
                Your seller account has been approved.
              </p>

              <p>
                <b>Email:</b>
                ${application.email}
              </p>

              <p>
                <b>Password:</b>
                ${tempPassword}
              </p>

              <p>
                Please login and change your password.
              </p>

            </div>
            `,
          });

        } catch (err) {

          console.error(
            "Email send failed",
            err
          );
        }

      }

      /* ======================================================
         REJECTED
      ====================================================== */

      if (
        status === "rejected"
      ) {

        const user =
          await User.findOne({
            email:
              application.email,
          });

        if (user) {
          user.sellerStatus =
            "rejected";

          await user.save();
        }
      }

      return res.json({
        message:
          "Status updated successfully",

        application,
      });

    } catch (error) {

      console.error(
        "Update Vendor Status Error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error",
      });
    }
  };

/* ======================================================
   DELETE APPLICATION
====================================================== */

exports.deleteApplication =
  async (req, res) => {
    try {

      const application =
        await VendorApplication.findByIdAndDelete(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      return res.json({
        message:
          "Application deleted",
      });

    } catch (error) {

      return res.status(500).json({
        message:
          "Delete failed",
      });
    }
  };