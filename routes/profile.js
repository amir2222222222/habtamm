const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { user } = require('../middleware/authmiddleware');

// GET /profile
router.get('/profile', user, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.redirect('/login');

    const successName = req.query.successName ? 'Name updated successfully!' : null;
    const successCommission = req.query.successCommission ? 'User commission updated successfully!' : null;

    res.render('profile', {
      name: currentUser.name,
      shopname: currentUser.shopname || currentUser.name,
      userCommission: currentUser.user_commission || 0,
      successName,
      successCommission,
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Internal server error loading profile.');
  }
});

// POST /name - Update Name
router.post('/name', user, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).send('Name is required.');
    }

    const trimmedName = name.trim();

    await User.findByIdAndUpdate(req.user.id, {
      name: trimmedName,
      shopname: trimmedName, // name also becomes shopname
    });

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating name:', err);
    res.status(500).send('Internal server error updating name.');
  }
});


// POST /commission - Update User Commission
router.post('/commission', user, async (req, res) => {
  try {
    let { userCommission } = req.body;
    userCommission = parseInt(userCommission);

    if (isNaN(userCommission) || userCommission < 1 || userCommission > 100) {
      return res.status(400).send('Commission must be a number between 1 and 100.');
    }

    await User.findByIdAndUpdate(req.user.id, { user_commission: userCommission });
    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating commission:', err);
    res.status(500).send('Internal server error updating commission.');
  }
});

module.exports = router;
