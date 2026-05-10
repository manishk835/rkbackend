// src/config/passport.js

const passport = require(
  "passport"
);

const GoogleStrategy =
  require(
    "passport-google-oauth20"
  ).Strategy;

const crypto = require(
  "crypto"
);

const User = require(
  "../models/User"
);

/* ======================================================
   ENV CHECK
====================================================== */

if (
  !process.env
    .GOOGLE_CLIENT_ID ||
  !process.env
    .GOOGLE_CLIENT_SECRET
) {

  console.warn(
    "⚠️ Google OAuth environment variables missing"
  );
}

/* ======================================================
   GOOGLE STRATEGY
====================================================== */

passport.use(
  new GoogleStrategy(
    {
      clientID:
        process.env
          .GOOGLE_CLIENT_ID,

      clientSecret:
        process.env
          .GOOGLE_CLIENT_SECRET,

      callbackURL:
        process.env
          .GOOGLE_CALLBACK_URL ||
        "/api/auth/google/callback",
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {

        /* ================= EMAIL ================= */

        const email =
          profile
            ?.emails?.[0]
            ?.value
            ?.toLowerCase();

        if (!email) {

          return done(
            new Error(
              "Google account has no email"
            ),

            null
          );
        }

        /* ================= PROFILE DATA ================= */

        const googleId =
          profile.id;

        const profileImage =
          profile
            ?.photos?.[0]
            ?.value || "";

        /* ======================================================
           EXISTING USER
        ====================================================== */

        let user =
          await User.findOne(
            {
              email,
            }
          );

        if (user) {

          /* ================= UPDATE GOOGLE ID ================= */

          if (
            !user.googleId
          ) {

            user.googleId =
              googleId;
          }

          /* ================= VERIFY ================= */

          if (
            !user.isVerified
          ) {

            user.isVerified =
              true;
          }

          /* ================= PROFILE IMAGE ================= */

          if (
            !user.profileImage &&
            profileImage
          ) {

            user.profileImage =
              profileImage;
          }

          /* ================= BLOCK CHECK ================= */

          if (
            user.isBlocked
          ) {

            return done(
              new Error(
                "Account blocked"
              ),

              null
            );
          }

          await user.save();

          return done(
            null,
            user
          );
        }

        /* ======================================================
           CREATE NEW USER
        ====================================================== */

        const randomPassword =
          crypto
            .randomBytes(
              12
            )
            .toString(
              "hex"
            );

        user =
          await User.create(
            {
              name:
                profile.displayName ||
                "Google User",

              email,

              googleId,

              profileImage,

              password:
                randomPassword,

              isVerified:
                true,

              role:
                "user",
            }
          );

        return done(
          null,
          user
        );

      } catch (error) {

        console.error(
          "GOOGLE OAUTH ERROR:",
          error
        );

        return done(
          error,
          null
        );
      }
    }
  )
);

/* ======================================================
   SERIALIZE / DESERIALIZE
====================================================== */

passport.serializeUser(
  (
    user,
    done
  ) => {

    done(
      null,
      user._id
    );
  }
);

passport.deserializeUser(
  async (
    id,
    done
  ) => {
    try {

      const user =
        await User.findById(
          id
        );

      done(
        null,
        user
      );

    } catch (err) {

      done(
        err,
        null
      );
    }
  }
);

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  passport;