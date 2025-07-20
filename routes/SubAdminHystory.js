const express = require('express');
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User'); 
const { admin, subadmin } = require("../Middleware/AuthMiddleware");

// Get transaction history
router.get('/subadmin/SubAdminHystory',subadmin, async (req, res) => {
  try {
    const subadmin = await SubAdmin.findById(req.subadmin.id)
      .select('account_history')
      .sort({ 'account_history.date': -1 }); // Newest first
    
    if (!subadmin) {
      return res.status(404).json({ message: 'Subadmin not found' });
    }

    // Calculate total credited amount
    const totalCredited = subadmin.account_history.reduce((sum, transaction) => {
      return sum + Math.abs(transaction.amount);
    }, 0);

    res.render('SubAdmin_Panal/SubAdminHystory', { 
      transactions: subadmin.account_history,
      totalCredited,
      subadminName: subadmin.name
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;