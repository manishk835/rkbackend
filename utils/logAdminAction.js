// src/utils/logAdminAction.js

const AdminLog = require(
  "../models/AdminLog"
);

/* ======================================================
   LOG ADMIN ACTION
====================================================== */

const logAdminAction =
  async (
    req,
    action,
    options = {}
  ) => {
    try {

      /* ================= SAFETY ================= */

      if (
        !req?.user?._id
      ) {
        console.warn(
          "Admin log skipped: missing admin user"
        );

        return;
      }

      if (!action) {
        console.warn(
          "Admin log skipped: missing action"
        );

        return;
      }

      /* ================= CLIENT IP ================= */

      const forwardedIp =
        req.headers[
          "x-forwarded-for"
        ];

      const ip =
        forwardedIp
          ? forwardedIp
              .split(",")[0]
              .trim()
          : req.ip ||
            req.connection
              ?.remoteAddress ||
            "";

      /* ================= CREATE LOG ================= */

      await AdminLog.create(
        {
          admin:
            req.user._id,

          action,

          ip,

          userAgent:
            req.headers[
              "user-agent"
            ] || "",

          method:
            req.method,

          endpoint:
            req.originalUrl,

          statusCode:
            options.statusCode,

          metadata:
            options.metadata ||
            {},
        }
      );

    } catch (err) {

      console.error(
        "ADMIN LOG ERROR:",
        err
      );
    }
  };

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  logAdminAction;