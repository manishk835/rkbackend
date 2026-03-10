// src/controllers/google.controller.js

const jwt = require("jsonwebtoken");

exports.googleCallback = async (req, res) => {

  try {

    const user = req.user;

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    /* redirect user dashboard */

    res.redirect(`${process.env.FRONTEND_URL}`);

  } catch (err) {

    console.error("Google Callback Error:", err);

    res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);

  }

};