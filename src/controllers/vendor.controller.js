// controllers/vendor.controller.js

const VendorApplication = require("../models/VendorApplication");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

/* ================= EMAIL TRANSPORT ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================= PASSWORD GENERATOR ================= */

const generatePassword = () => {
  return crypto.randomBytes(6).toString("base64");
};

/* ======================================================
   APPLY AS VENDOR (PUBLIC)
====================================================== */

exports.applyVendor = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const { businessName, phone, businessType, message } = req.body;

    if (!businessName || !phone || !businessType) {
      return res.status(400).json({
        message: "All required fields missing",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.sellerStatus === "approved") {
      return res.status(400).json({
        message: "You are already a seller",
      });
    }

    if (user.sellerStatus === "pending") {
      return res.status(400).json({
        message: "Application already submitted",
      });
    }

    const existing = await VendorApplication.findOne({
      user: user._id,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "Application already submitted",
      });
    }

    const application = await VendorApplication.create({
      user: user._id,
      businessName: businessName.trim(),
      email: user.email,
      phone,
      businessType, // ✅ FINAL CHANGE
      message,
      status: "pending",
    });

    user.sellerStatus = "pending";
    await user.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application,
    });

  } catch (error) {
    console.error("Vendor Apply Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ======================================================
   GET ALL APPLICATIONS (ADMIN)
====================================================== */

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (error) {
    console.error("Get Applications Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ======================================================
   UPDATE APPLICATION STATUS (ADMIN)
====================================================== */

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

    if (application.status !== "pending") {
      return res.status(400).json({
        message: "Application already reviewed",
      });
    }

    application.status = status;
    await application.save();

    /* ======================================================
       SELLER APPROVED
    ====================================================== */

    if (status === "approved") {
      let user = await User.findOne({
        email: application.email,
      });

      const tempPassword = generatePassword();

      if (!user) {
        user = await User.create({
          name: application.businessName,
          email: application.email,
          phone: application.phone,
          password: tempPassword,

          role: "seller",
          sellerStatus: "approved",
          sellerApprovedAt: new Date(),

          businessType: application.businessType, // ✅ FINAL CORE

          sellerInfo: {
            storeName: application.businessName,
          },
        });
      } else {
        user.role = "seller";
        user.sellerStatus = "approved";
        user.sellerApprovedAt = new Date();

        user.businessType = application.businessType; // ✅ FINAL CORE

        if (!user.sellerInfo) {
          user.sellerInfo = {};
        }

        user.sellerInfo.storeName = application.businessName;

        await user.save();
      }

      /* ================= EMAIL ================= */

      try {
        await transporter.sendMail({
          from: `"Marketplace" <${process.env.EMAIL_USER}>`,
          to: application.email,
          subject: "Seller Account Approved",

          html: `
          <div style="font-family:Arial;padding:20px">
            <h2>Congratulations 🎉</h2>
            <p>Your seller account has been approved.</p>

            <p><b>Email:</b> ${application.email}</p>
            <p><b>Password:</b> ${tempPassword}</p>

            <p>Please login and change your password.</p>
          </div>
          `,
        });
      } catch (err) {
        console.error("Email send failed", err);
      }
    }

    res.json({
      message: "Status updated successfully",
      application,
    });

  } catch (error) {
    console.error("Update Vendor Status Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// // controllers/vendor.controller.js
// const VendorApplication = require("../models/VendorApplication");
// const User = require("../models/User");
// const nodemailer = require("nodemailer");
// const crypto = require("crypto");

// /* ================= EMAIL TRANSPORT ================= */

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// /* ================= PASSWORD GENERATOR ================= */

// const generatePassword = () => {
//   return crypto.randomBytes(6).toString("base64");
// };

// /* ======================================================
//    APPLY AS VENDOR (PUBLIC)
// ====================================================== */

// exports.applyVendor = async (req, res) => {
//   try {
//     // 🔥 LOGIN REQUIRED
//     if (!req.user) {
//       return res.status(401).json({
//         message: "Login required",
//       });
//     }

//     const { businessName, phone, category, message } = req.body;

//     if (!businessName || !phone || !category) {
//       return res.status(400).json({
//         message: "All required fields missing",
//       });
//     }

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // 🔥 ALREADY SELLER
//     if (user.sellerStatus === "approved") {
//       return res.status(400).json({
//         message: "You are already a seller",
//       });
//     }

//     // 🔥 PENDING
//     if (user.sellerStatus === "pending") {
//       return res.status(400).json({
//         message: "Application already submitted",
//       });
//     }

//     // 🔥 CHECK EXISTING APPLICATION
//     const existing = await VendorApplication.findOne({
//       user: user._id,
//       status: "pending",
//     });

//     if (existing) {
//       return res.status(400).json({
//         message: "Application already submitted",
//       });
//     }

//     // 🔥 CREATE APPLICATION (USER LINKED)
//     const application = await VendorApplication.create({
//       user: user._id, // 🔥 IMPORTANT
//       businessName: businessName.trim(),
//       email: user.email, // 🔥 AUTO
//       phone,
//       category,
//       message,
//       status: "pending",
//     });

//     // 🔥 UPDATE USER STATUS
//     user.sellerStatus = "pending";
//     await user.save();

//     res.status(201).json({
//       success: true,
//       message: "Application submitted successfully",
//       application,
//     });
//   } catch (error) {
//     console.error("Vendor Apply Error:", error);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

// /* ======================================================
//    GET ALL APPLICATIONS (ADMIN)
// ====================================================== */

// exports.getAllApplications = async (req, res) => {
//   try {
//     const applications = await VendorApplication.find()
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json(applications);
//   } catch (error) {
//     console.error("Get Applications Error:", error);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

// /* ======================================================
//    UPDATE APPLICATION STATUS (ADMIN)
// ====================================================== */

// exports.updateApplicationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!["approved", "rejected"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status",
//       });
//     }

//     const application = await VendorApplication.findById(id);

//     if (!application) {
//       return res.status(404).json({
//         message: "Application not found",
//       });
//     }

//     if (application.status !== "pending") {
//       return res.status(400).json({
//         message: "Application already reviewed",
//       });
//     }

//     application.status = status;

//     await application.save();

//     /* ======================================================
//        SELLER APPROVED
//     ====================================================== */

//     if (status === "approved") {
//       let user = await User.findOne({
//         email: application.email,
//       });

//       const tempPassword = generatePassword();

//       if (!user) {
//         user = await User.create({
//           name: application.businessName,
//           email: application.email,
//           phone: application.phone,
//           password: tempPassword,

//           role: "seller",
//           sellerStatus: "approved",
//           sellerApprovedAt: new Date(),

//           sellerInfo: {
//             storeName: application.businessName,
//           },
//         });
//       } else {
//         user.role = "seller";
//         user.sellerStatus = "approved";
//         user.sellerApprovedAt = new Date();

//         if (!user.sellerInfo) {
//           user.sellerInfo = {};
//         }

//         user.sellerInfo.storeName = application.businessName;

//         await user.save();
//       }

//       /* ================= EMAIL ================= */

//       try {
//         await transporter.sendMail({
//           from: `"RK Fashion" <${process.env.EMAIL_USER}>`,
//           to: application.email,

//           subject: "Your RK Fashion Seller Account is Approved",

//           html: `
//           <div style="font-family:Arial;padding:20px">

//             <h2>Congratulations 🎉</h2>

//             <p>Your seller account has been approved on <b>RK Fashion</b>.</p>

//             <p>You can login using:</p>

//             <p><b>Email:</b> ${application.email}</p>
//             <p><b>Password:</b> ${tempPassword}</p>

//             <p>Please login and change your password immediately.</p>

//             <br>

//             <a href="${process.env.FRONTEND_URL}/login"
//                style="background:#000;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
//                Login Now
//             </a>

//           </div>
//           `,
//         });
//       } catch (err) {
//         console.error("Email send failed", err);
//       }
//     }

//     res.json({
//       message: "Status updated successfully",
//       application,
//     });
//   } catch (error) {
//     console.error("Update Vendor Status Error:", error);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };
