// src/controllers/google.controller.js

const jwt = require(
  "jsonwebtoken"
);

/* ======================================================
   ENV CHECK
====================================================== */

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET missing"
  );
}

/* ======================================================
   GOOGLE CALLBACK
====================================================== */

exports.googleCallback =
  async (req, res) => {
    try {

      /* ================= USER ================= */

      const user =
        req.user;

      if (!user) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
        );
      }

      /* ================= BLOCK CHECK ================= */

      if (
        user.isBlocked
      ) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=account_blocked`
        );
      }

      /* ================= TOKEN ================= */

      const token =
        jwt.sign(
          {
            id:
              user._id,

            role:
              user.role,

            tokenVersion:
              user.tokenVersion,
          },

          process.env
            .JWT_SECRET,

          {
            expiresIn:
              "7d",
          }
        );

      /* ================= COOKIE ================= */

      res.cookie(
        "token",
        token,
        {
          httpOnly:
            true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite:
            "lax",

          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,

          path: "/",
        }
      );

      /* ======================================================
         REDIRECT BASED ON ROLE
      ====================================================== */

      let redirectURL =
        process.env
          .FRONTEND_URL ||
        "http://localhost:3000";

      if (
        user.role ===
        "admin"
      ) {

        redirectURL +=
          "/admin";

      } else if (
        user.role ===
        "seller"
      ) {

        redirectURL +=
          "/seller";

      }

      return res.redirect(
        redirectURL
      );

    } catch (err) {

      console.error(
        "GOOGLE CALLBACK ERROR:",
        err
      );

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google`
      );
    }
  };