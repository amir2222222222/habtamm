const express = require('express');
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User');
const { user } = require("../Middleware/AuthMiddleware");
const { hashPassword, comparePassword } = require('../Utils/Bcrypt');
const asyncHandler = require('../Utils/AsyncHandler');

// ---------- Validators ----------
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 8) {
    return { valid: false, error: 'Username must be at least 8 characters' };
  }
  // No case conversion - preserve original case
  return { valid: true, value: trimmed };
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  const hasUppercase = /[A-Z]/.test(trimmed);
  const hasLowercase = /[a-z]/.test(trimmed);
  const hasNumber = /[0-9]/.test(trimmed);
  const hasSpecial = /[^A-Za-z0-9]/.test(trimmed);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }

  return { valid: true, value: trimmed };
};

const validateCommission = (commission) => {
  const num = parseFloat(commission);
  if (isNaN(num)) {
    return { valid: false, error: 'Commission must be a number' };
  }
  if (num < 1 || num > 100) {
    return { valid: false, error: 'Commission must be between 1 and 100' };
  }
  return { valid: true, value: num };
};

// ---------- Case-sensitive Duplicate Check Utility ----------
const isDuplicateUsername = async (username) => {
  const trimmed = username.trim(); // No case conversion
  const [admin, subadmin, user] = await Promise.all([
    Admin.findOne({ username: trimmed }),
    SubAdmin.findOne({ username: trimmed }),
    User.findOne({ username: trimmed }),
  ]);
  return admin || subadmin || user;
};

// ---------- GET /profile ----------
router.get('/profile', user, asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id).select('-password');
  if (!currentUser) {
    return res.redirect('/login');
  }

  res.render('profile', {
    name: currentUser.name,
    username: currentUser.username,
    shopname: currentUser.shopname || currentUser.name,
    userCommission: currentUser.user_commission || 0,
    successUsername: req.query.successUsername,
    successCommission: req.query.successCommission,
    successPassword: req.query.successPassword,
    errorUsername: req.query.errorUsername,
    errorCommission: req.query.errorCommission,
    errorPassword: req.query.errorPassword
  });
}));

// ---------- POST /username ----------
router.post('/username', user, asyncHandler(async (req, res) => {
  const { username } = req.body;
  const currentUserId = req.user.id.toString();

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) return res.json({ success: false, error: 'User not found' });

  const result = validateUsername(username);
  if (!result.valid) return res.json({ success: false, error: result.error });

  const trimmedUsername = result.value; // Preserve original case
  if (trimmedUsername === currentUser.username) {
    return res.json({
      success: true,
      message: 'This is already your current username',
      newUsername: currentUser.username
    });
  }

  // Case-sensitive username check
  const existingAccount = await isDuplicateUsername(trimmedUsername);
  if (existingAccount && existingAccount._id.toString() !== currentUserId) {
    return res.json({ success: false, error: 'Username is already taken' });
  }

  const updatedUser = await User.findByIdAndUpdate(
    currentUserId,
    { username: trimmedUsername }, // Store with original case
    { new: true }
  ).select('-password');

  return res.json({
    success: true,
    message: 'Username updated successfully',
    newUsername: updatedUser.username // Return with original case
  });
}));

// ---------- POST /password ----------
router.post('/password', user, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.json({ success: false, error: 'All password fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.json({ success: false, error: 'New passwords do not match' });
  }

  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return res.json({ success: false, error: validation.error });
  }

  const userDoc = await User.findById(req.user.id).select('+password');
  if (!userDoc) return res.json({ success: false, error: 'User not found' });

  const isMatch = await comparePassword(currentPassword, userDoc.password);
  if (!isMatch) {
    return res.json({ success: false, error: 'Current password is incorrect' });
  }

  const isSamePassword = await comparePassword(newPassword, userDoc.password);
  if (isSamePassword) {
    return res.json({
      success: false,
      error: 'New password must be different from current password'
    });
  }

  const hashedPassword = await hashPassword(newPassword);
  await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

  return res.json({ success: true, message: 'Password updated successfully' });
}));

// ---------- POST /commission ----------
router.post('/commission', user, asyncHandler(async (req, res) => {
  const { commission } = req.body;

  const validation = validateCommission(commission);
  if (!validation.valid) return res.json({ success: false, error: validation.error });

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { user_commission: validation.value },
    { new: true }
  ).select('-password');

  return res.json({
    success: true,
    newCommission: updatedUser.user_commission
  });
}));

module.exports = router;