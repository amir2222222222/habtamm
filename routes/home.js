const express = require("express");
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User'); // Adjust as needed
const { user } = require("../Middleware/AuthMiddleware");
const { verifyToken, generateToken } = require("../Utils/Jwt");
const asyncHandler = require("../Utils/AsyncHandler");

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

router.get(
  "/home",
  user,
  asyncHandler(async (req, res) => {
    const foundUser = await User.findById(req.user.id).lean();
    if (!foundUser) {
      // If unauthenticated or user not found, send to login page
      return res.status(404).render("login");
    }
    res.render("home");
  })
);

router.post(
  "/home",
  user,
  asyncHandler(async (req, res) => {
    let { betbirr, selectedcarts, linechaker } = req.body;

    // Coerce types
    betbirr = parseFloat(betbirr);
    linechaker = parseInt(linechaker, 10);

    // Ensure selectedcarts is always an array
    if (!Array.isArray(selectedcarts)) {
      selectedcarts = selectedcarts ? [selectedcarts] : [];
    }

    // Validation
    if (isNaN(betbirr) || betbirr < 10) {
      return res.status(400).json({
        success: false,
        message: "betbirr must be at least 10."
      });
    }

    if (selectedcarts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one cart."
      });
    }

    if (isNaN(linechaker) || linechaker < 1 || linechaker > 5) {
      return res.status(400).json({
        success: false,
        message: "linechaker must be between 1 and 5."
      });
    }

    // Fetch user
    const foundUser = await User.findById(req.user.id).lean();
    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const userBalance = parseFloat(foundUser.balance);
    const commission = parseFloat(foundUser.user_commission) || 0;

    const totalBet = betbirr * selectedcarts.length;
    const cartCount = selectedcarts.length;

    let winningAmount;
    let requiredbalance;

    if (cartCount <= 3) {
      winningAmount = totalBet;
      requiredbalance = 0;
    } else {
      winningAmount = totalBet - (totalBet * (commission / 100));
      requiredbalance = totalBet - winningAmount;
    }

    if (userBalance < requiredbalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance."
      });
    }

    // Token update logic
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing."
      });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      console.warn("❌ Token verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    // Update token fields
    Object.assign(payload, {
      betbirr,
      selectedcarts,
      linechaker,
      totalBet: +totalBet.toFixed(2),
      winningAmount: +winningAmount.toFixed(2),
      requiredbalance: +requiredbalance.toFixed(2),
    });

    // Regenerate and set token
    const updatedToken = generateToken(payload);
    res.cookie("token", updatedToken, cookieOpts);

    // Success: redirect user to bingo_play
    return res.redirect("/bingo_play");
  })
);

module.exports = router;