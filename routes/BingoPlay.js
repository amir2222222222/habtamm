const express = require("express");
const router = express.Router();
const { User } = require('../Models/User');
const { user } = require("../Middleware/AuthMiddleware");
const { generateToken, verifyToken } = require("../Utils/Jwt");
const asyncHandler = require("../Utils/AsyncHandler");
const { getTodayDate } = require('../Utils/Time');

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/",
};

router.get("/bingo_play", user, asyncHandler(async (req, res) => {
  const [foundUser, token] = await Promise.all([
    User.findById(req.user.id).lean(),
    req.cookies.token
  ]);

  if (!foundUser || !token) return res.redirect("/home");

  let tokenData;
  try {
    tokenData = verifyToken(token);
    if (!tokenData || typeof tokenData !== "object") return res.redirect("/home");

    const userBalance = parseFloat(foundUser.balance) || 0;
    const required = parseFloat(tokenData.requiredbalance) || 0;

    if (required > userBalance) return res.redirect("/home");
  } catch {
    return res.redirect("/home");
  }

  const preferences = {
    voicetype: req.cookies.Voice || "Recommended_Black_Male_Voice",
    gamespeed: req.cookies.Speed || "5",
    patterns: req.cookies.Patterns
      ? JSON.parse(req.cookies.Patterns)
      : ["h", "v", "d", "sc", "lc"]
  };

  res.render("BingoPlay", {
    betbirr: tokenData.betbirr || 0,
    totalbet: tokenData.totalBet || 0,
    winningamount: tokenData.winningAmount || 0,
    linechaker: tokenData.linechaker || 0,
    ...preferences,
    selectedcarts: tokenData.selectedcarts || []
  });
}));

router.post('/start-game', user, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return;

    const token = verifyToken(req.cookies.token);
    const requiredBalance = parseFloat(token.requiredbalance) || 0;

  if (user.balance < requiredBalance) {
  return res.redirect("/home"); // 👈 Redirects user to /home instead of sending JSON
}


    const time = getTodayDate();
    user.balance -= requiredBalance;

    const newGame = {
      gameStart: time,
      gameEnd: time,
      betBirr: token.betbirr,
      pickedCards: token.selectedcarts || [],
      onCalls: [],
      winnerCards: [],
      luckypassedCards: [],
      dersh: token.winningAmount,
      commission: requiredBalance,
      by: user.username,
      shopname: user.shopname || user.name,
      time,
      index: user.games.length,
    };

    try {
      user.games.push(newGame);
      await user.save();
    } catch {
      // Skip saving game on failure, don't crash
    }

    const payload = { index: newGame.index };
    const finalToken = generateToken(payload);

    res.cookie('indexToken', finalToken, cookieOpts).json({ gameIndex: newGame.index });

  } catch {
    // Suppress all errors except insufficient balance
  }
}));

router.post('/check-cartela', user, asyncHandler(async (req, res) => {
  try {
    const { cart, winner, luckyPassed } = req.body;
    const decoded = verifyToken(req.cookies.indexToken);
    const currentGameIndex = typeof decoded.index === 'number' ? decoded.index : null;
    if (currentGameIndex === null) return;

    const update = {
      [`games.${currentGameIndex}.gameEnd`]: getTodayDate(),
    };

    if (cart) {
      update.$addToSet = { [`games.${currentGameIndex}.onCalls`]: cart };
      if (luckyPassed) {
        update.$addToSet[`games.${currentGameIndex}.luckypassedCards`] = cart;
      } else if (winner) {
        update.$addToSet[`games.${currentGameIndex}.winnerCards`] = cart;
      }
    }

    await User.findOneAndUpdate({ _id: req.user.id }, update, { new: true });
    res.json({ success: true });

  } catch {
    // Ignore errors, don't respond or crash
  }
}));


module.exports = router;