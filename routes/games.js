const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { user } = require('../middleware/authmiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Utility: Format today as YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Utility: Validate date format (YYYY-MM-DD)
function isValidDate(date) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
}

// === GET /games - View user games by date ===
router.get('/games', user, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let { date } = req.query;

  // If no date is provided, default to today's date
  date = date || getTodayDate();

  // Validate the date format
  if (!isValidDate(date)) {
    return res.status(400).send('Invalid date format. Please use YYYY-MM-DD.');
  }

  try {
    const userDoc = await User.findById(userId, { games: 1, name: 1 });

    if (!userDoc || !userDoc.games || userDoc.games.length === 0) {
      return res.render('games', { games: [], selectedDate: date });
    }

    const filteredGames = userDoc.games.filter(game =>
      typeof game.time === 'string' && game.time.startsWith(date)
    );

    res.render('games', {
      games: filteredGames,
      selectedDate: date
    });

  } catch (err) {
    return res.status(500).send('Internal server error');
  }
}));

// === POST /games - Redirect to GET with date query ===
router.post('/games', (req, res) => {
  const { date } = req.body;
  const safeDate = isValidDate(date) ? date : getTodayDate(); // Validate date before use
  res.redirect(`/games?date=${safeDate}`);
});

module.exports = router;
