const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateToken,verifyToken } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");
const validator = require("validator"); // npm i validator



router.get(["/", "/login", "/signin"], (req, res) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = verifyToken(token); // Use jwt.verify instead of jwt.verifyToken
      return res.redirect(decoded.role === "admin" ? "/admin" : "/home");
    } catch (err) {
      res.clearCookie("token"); // Clear the cookie for invalid tokens
    }
  }

  res.render("login");
});

router.post("/login", asyncHandler(async (req, res) => {
  try {
    let { username, password } = req.body;
    username = username ? username.trim() : "";
    password = password ? password.trim() : "";

    if (!username || !password) return res.redirect("/login?error=1");

    if (!validator.isAlphanumeric(username.replace(/_/g, "")) || username.length < 3 || username.length > 30) {
      return res.redirect("/login?error=1");
    }

    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.redirect("/login?error=1");
    }

const token = generateToken({ id: user._id, role: user.role });
res.cookie("token", token, {
  httpOnly: true, // Prevents JavaScript access
  sameSite: "lax", // Adjust if cross-origin requests are needed
  secure: process.env.NODE_ENV === "production", // Use HTTPS in production
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  path: "/" // Accessible throughout the site
});

    return res.redirect(user.role === "admin" ? "/admin" : "/home");

  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/login?error=1");
  }
}));

router.get("/logout", (req, res) => {
  try {
    const cookieOptions = {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    };

    const cookiesToClear = [
      "token",
      "OpenToken",
      "WinningAmount",
      "BetBirr",
      "LineChaker",
      "TotalBet",
      "RequiredBalanceToken",
      "SelectedCarts",
      "VoiceType",
      "GameSpeed",
      "Patterns"
    ];

    cookiesToClear.forEach(name => {
      res.clearCookie(name, cookieOptions);
    });

    console.log("✅ Cookies cleared on logout:", cookiesToClear);
    res.redirect("/login");
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).send("Server error during logout");
  }
});



module.exports = router;
