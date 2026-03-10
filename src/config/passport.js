// src/config/passport.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {

      try {

        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error("Google account has no email"), null);
        }

        let user = await User.findOne({ email });

        /* ================= EXISTING USER ================= */

        if (user) {

          if (!user.isVerified) {
            user.isVerified = true;
          }

          await user.save();

          return done(null, user);
        }

        /* ================= NEW USER ================= */

        user = await User.create({

          name: profile.displayName,

          email,

          phone: `temp-${Date.now()}`, // temporary

          password: Math.random().toString(36).slice(-12),

          isVerified: true,

        });

        return done(null, user);

      } catch (error) {

        console.error("Google OAuth Error:", error);

        return done(error, null);
      }

    }
  )
);

module.exports = passport;