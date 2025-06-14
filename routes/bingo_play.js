const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { user } = require("../middleware/authmiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt"); // ✅ JWT import

// Read cartels.json file and parse the cartelas array
function getCartelasFromFile() {
  const filePath = path.join(__dirname, "..", "cartels.json");
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) return reject(err);
      try {
        const cartelas = JSON.parse(data);
        resolve(cartelas);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Safely read cookies without verification or signing
function getCookie(cookies, name, defaultValue, parseJson = false) {
  const cookieVal = cookies[name];
  if (!cookieVal) return defaultValue;
  return parseJson ? JSON.parse(cookieVal) : cookieVal;
}

function bingoRoutes(io) {
  router.get(
    "/bingo_play",
    user,
    asyncHandler(async (req, res) => {
      // ✅ Step 1: Verify OpenToken before anything else
      let openTokenData;
      try {
        const openToken = req.cookies.OpenToken;
        if (!openToken) {
          return res.redirect("/home"); // 👈 Redirect if missing
        }
        openTokenData = verifyToken(openToken);
      } catch (err) {
        return res.redirect("/home"); // 👈 Redirect if invalid
      }

      // ✅ OpenToken is valid; now continue with rest of logic
      const winningAmount = getCookie(req.cookies, "WinningAmount", 0);
      const betBirr = getCookie(req.cookies, "BetBirr", 0);
      const lineChaker = getCookie(req.cookies, "LineChaker", 1);
      const totalBet = getCookie(req.cookies, "TotalBet", 0);

      // ✅ Read RequiredBalance from RequiredBalanceToken
      let requiredBalance = 0;
      try {
        const token = req.cookies.RequiredBalanceToken;
        if (token) {
          const decoded = verifyToken(token);
          requiredBalance = parseFloat(decoded.requiredBalance) || 0;
        }
      } catch (err) {
        console.warn("⚠️ Failed to verify RequiredBalanceToken:", err.message);
      }

      const voiceType = getCookie(req.cookies, "VoiceType", "Recommended_Black_Male_Voice");
      const gameSpeed = getCookie(req.cookies, "GameSpeed", "2");
      const patterns = getCookie(req.cookies, "Patterns", ["h", "v", "d", "sc", "lc"], true);
      const selectedCarts = getCookie(req.cookies, "SelectedCarts", [], true);

      // Load all cartelas
      const cartelas = await getCartelasFromFile();

      // Filter only selected carts
      const selectedCartNumbers = selectedCarts.map(String);
      const filteredCartelas = cartelas.filter(c =>
        selectedCartNumbers.includes(String(c.cart_number))
      );

      // Render view
      res.render("bingo_play", {
        winningamount: winningAmount,
        betbirr: betBirr,
        linechaker: lineChaker,
        totalbet: totalBet,
        requiredbalance: requiredBalance,
        voicetype: voiceType,
        gamespeed: gameSpeed,
        patterns,
        selectedcarts: selectedCarts,
        cartelas: filteredCartelas,
        openTokenData, // optional: you can pass decoded info to view
      });
    })
  );

  // === POST /bingo_play ===
  router.post(
    "/bingo_play",
    user,
    asyncHandler(async (req, res) => {
      const { message } = req.body;

      if (message && message.trim()) {
        io.emit("announcement", {
          message: message.trim(),
          username: req.user.username,
        });
        res.send("Announcement sent.");
      } else {
        res.status(400).send("Message required.");
      }
    })
  );

  return router;
}

module.exports = bingoRoutes;