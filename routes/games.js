const express = require('express');
const router = express.Router();
const {User} = require('../Models/User');
const asyncHandler = require("../Utils/AsyncHandler");
const { user } = require("../Middleware/AuthMiddleware");

function isValidDate(date) {
  if (!date) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
}

// === GET /games - View user games ===
router.get('/games', user, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).send('User ID not found');
  }

  const { date } = req.query;
  const userDoc = await User.findById(userId, { games: 1, name: 1 });

  if (!userDoc?.games?.length) {
    return res.render('games', { games: [], selectedDate: date || '' });
  }

  // Get all games or filter by date if provided
  let games = userDoc.games;
  if (isValidDate(date)) {
    games = games.filter(game => 
      typeof game.time === 'string' && game.time.startsWith(date)
    );
  }

  // Sort all results by index (descending - highest index first)
  games.sort((a, b) => b.index - a.index);

  res.render('games', {
    games,
    selectedDate: date || ''
  });
}));

// === POST /games - Redirect to GET with date query ===
router.post('/games', user,(req, res) => {
  const { date } = req.body;
  if (isValidDate(date)) {
    return res.redirect(`/games?date=${encodeURIComponent(date)}`);
  }
  res.redirect('/games'); // No date or invalid date - show all
});

module.exports = router;