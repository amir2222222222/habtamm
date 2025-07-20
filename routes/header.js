const express = require("express");
const router = express.Router();
const { User } = require('../Models/User');
const asyncHandler = require("../Utils/AsyncHandler");
const { user } = require("../Middleware/AuthMiddleware");


router.get("/balance", user, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const foundUser = await User.findById(userId).lean();

    // Check if balance is undefined or null
    if (foundUser.balance === undefined || foundUser.balance === null) {
      return res.status(500).json({ message: "unavailable." });
    }

    // Ensure balance is a number
    if (typeof foundUser.balance !== 'number') {
      return res.status(500).json({ message: "Invalid balance data type." });
    }

    // Respond with the balance (which could be 0)
    res.json({ balance: foundUser.balance });

  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Failed to retrieve balance." });
  }
}));

module.exports = router;
