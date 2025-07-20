const express = require('express');
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User'); // Adjust as needed
const { subadmin, admin, user } = require("../Middleware/AuthMiddleware");
const asyncHandler = require('../Utils/AsyncHandler');

// GET /status
router.get('/status', user, asyncHandler(async (req, res) => {
  const foundUser = await User.findById(req.user.id).lean();
  if (!foundUser) return res.status(404).send('User not found');

  const credit = foundUser.credit || " ";
  const balance = foundUser.balance || " ";

  const formattedUser = {
    username: foundUser.username || foundUser.name ,
    name: foundUser.name || " ",
    shopname: foundUser.shopname || foundUser.name,
    credit,
    lastCreditTime: foundUser.lastCreditTime,
    initial_balance: foundUser.initial_balance || credit,
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

// GET /subadmin/status
router.get('/subadmin/status', subadmin, asyncHandler(async (req, res) => {
  try {
    // 1. Fetch subadmin data with better error handling
    const foundSubadmin = await SubAdmin.findById(req.subadmin.id)
      .select('username name shopname credit balance lastCreditTime createdAt')
      .lean();

    if (!foundSubadmin) {
      return res.status(404).render('error', {
        title: 'Subadmin Not Found',
        message: 'The requested subadmin account could not be found',
        status: 404
      });
    }

    // 2. Validate and format numerical values
    const credit = Math.max(0, Number(foundSubadmin.credit) || 0);
    const balance = Math.max(0, Number(foundSubadmin.balance) || 0);

    // 3. Enhanced status calculation with different thresholds
    const status = calculateStatusPercentage(balance, credit);
    const statusLevel = getStatusLevel(status);

    // 4. Format all data for the view
    const formattedUser = {
      ...foundSubadmin,
      username: foundSubadmin.username || foundSubadmin.name || 'Not Set',
      name: foundSubadmin.name || 'Not Set',
      shopname: foundSubadmin.shopname || 'Not Set',
      credit: credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      balance: balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      lastCreditTime: formatDateTime(foundSubadmin.lastCreditTime),
      createdAt: formatDate(foundSubadmin.createdAt),
      status: Math.min(100, Math.max(0, status)), // Clamp between 0-100
      statusLevel,
      statusClass: getStatusClass(statusLevel)
    };

    // 5. Render the view with additional context
    res.render('SubAdmin_Panal/subadminstatus', {
      title: 'Subadmin Dashboard',
      user: formattedUser,
      currentPage: 'status',
      lastUpdated: new Date().toISOString(),
      creditUtilization: calculateCreditUtilization(balance, credit)
    });

  } catch (error) {
    console.error('Subadmin status error:', {
      error: error.message,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.status(500).render('error', {
      title: 'Server Error',
      message: 'We encountered an error loading your dashboard',
      status: 500,
      retryUrl: '/subadmin/status'
    });
  }
}));

// Enhanced status calculation with different thresholds
function calculateStatusPercentage(balance, credit) {
  if (credit <= 0) return 0;
  const utilization = (balance / credit) * 100;
  
  // Apply non-linear scaling for better visual representation
  if (utilization > 90) return 100;
  if (utilization > 75) return 90 + (utilization - 75) * 0.4;
  if (utilization > 50) return 75 + (utilization - 50) * 0.6;
  return utilization * 1.5; // Amplify lower percentages for better visibility
}

// Determine status level for UI styling
function getStatusLevel(percentage) {
  if (percentage >= 90) return 'critical';
  if (percentage >= 70) return 'warning';
  if (percentage >= 30) return 'normal';
  return 'low';
}

// Get CSS class for status level
function getStatusClass(level) {
  const classes = {
    critical: 'status-critical',
    warning: 'status-warning',
    normal: 'status-normal',
    low: 'status-low'
  };
  return classes[level] || '';
}

// Format date with time
function formatDateTime(date) {
  if (!date) return 'Never';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date without time
function formatDate(date) {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Calculate credit utilization ratio
function calculateCreditUtilization(balance, credit) {
  if (credit <= 0) return 0;
  return Math.min(1, balance / credit);
}

module.exports = router;
