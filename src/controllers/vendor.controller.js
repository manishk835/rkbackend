// controllers/vendor.controller.js
const VendorApplication = require("../models/VendorApplication");

/* ======================================================
   APPLY AS VENDOR (PUBLIC)
====================================================== */
exports.applyVendor = async (req, res) => {
  try {
    const { businessName, email, phone, category, message } =
      req.body;

    if (!businessName || !email || !phone || !category) {
      return res
        .status(400)
        .json({ message: "All required fields missing" });
    }

    const existing = await VendorApplication.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "Application already submitted",
      });
    }
    
    const application = await VendorApplication.create({
      businessName,
      email,
      phone,
      category,
      message,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Vendor Apply Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   GET ALL APPLICATIONS (ADMIN)
====================================================== */
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.find()
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   UPDATE STATUS (ADMIN)
====================================================== */
// exports.updateApplicationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!["approved", "rejected"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status",
//       });
//     }

//     const application =
//       await VendorApplication.findByIdAndUpdate(
//         id,
//         { status },
//         { new: true }
//       );

//     if (!application) {
//       return res.status(404).json({
//         message: "Application not found",
//       });
//     }

//     res.json({
//       message: "Status updated",
//       application,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };
const User = require("../models/User");

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const application = await VendorApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    application.status = status;
    await application.save();

    /* ================= CREATE SELLER ================= */

    if (status === "approved") {
      let user = await User.findOne({
        email: application.email,
      });

      if (!user) {
        user = await User.create({
          name: application.businessName,
          email: application.email,
          password: "ChangeMe123!",
          role: "seller",
        });
      } else {
        user.role = "seller";
        await user.save();
      }
    }

    res.json({
      message: "Status updated",
      application,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};