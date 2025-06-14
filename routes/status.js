const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { user } = require('../middleware/authmiddleware');
const asyncHandler = require('../utils/asyncHandler');

// GET /status
router.get('/status', user, asyncHandler(async (req, res) => {
  const foundUser = await User.findById(req.user.id).lean();
  if (!foundUser) return res.status(404).send('User not found');

  const credit = foundUser.credit || 0;
  const balance = foundUser.balance || 0;

  const formattedUser = {
    username: foundUser.username,
    name: foundUser.name || foundUser.username,
    shopname: foundUser.shopname || foundUser.name,
    shop: foundUser.username,
    credit,
    lastCreditTime: foundUser.lastCreditTime,
    balance,
    status: getStatus(balance, credit),
    commission: foundUser.user_commission || 0
  };

  res.render('status', { users: [formattedUser] });
}));

function getStatus(balance, credit) {
  if (credit <= 0) return 0;
  let percentage = (balance / credit) * 100;
  return Math.round(Math.max(0, Math.min(percentage, 100)));
}

module.exports = router;
