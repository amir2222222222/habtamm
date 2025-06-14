const express = require('express');
const router = express.Router();
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken,verifyToken } = require("../utils/jwt");
const { admin } = require("../middleware/authmiddleware");

function getTodayDate() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

// GET: Admin panel
router.get('/admin', admin, (req, res) => {
  res.render("admin");
    
});

// POST: Register admin
router.post('/signup/admin', admin, asyncHandler(async (req, res) => {
    const { name, password } = req.body;

    const existing = await User.findOne({ username: name });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const user = new User({
        name,
        username: name,
        password,
        role: 'admin'
    });

    await user.save();
    res.status(201).json({ _id: user._id, username: user.username, role: user.role, name: user.name });
}));

// POST: Register user
// === POST: User Signup ===
router.post('/signup/user', admin, asyncHandler(async (req, res) => {
    const { name, password, credit, user_commission, owner_commission } = req.body;
    console.log({
        name,
        password,
        credit,
        user_commission,
        owner_commission
    });
    

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required and must be a string' });
    }

    if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Password is required and must be at least 4 characters' });
    }

    const parsedCredit = parseFloat(credit?.trim());
    const parsedUserCommission = parseFloat(user_commission?.trim());
    const parsedOwnerCommission = parseFloat(owner_commission?.trim());

    if (isNaN(parsedCredit) || parsedCredit < 0) {
        return res.status(400).json({ error: 'Credit must be a number >= 0' });
    }

    if (isNaN(parsedUserCommission) || parsedUserCommission < 1 || parsedUserCommission > 100) {
        return res.status(400).json({ error: 'User commission must be between 1 and 100' });
    }

    if (isNaN(parsedOwnerCommission) || parsedOwnerCommission < 1 || parsedOwnerCommission > 100) {
        return res.status(400).json({ error: 'Owner commission must be between 1 and 100' });
    }

    const user = new User({
        name,
        username: name,
        shopname: name,
        password,
        credit: parsedCredit,
        balance: parsedCredit,
        lastCreditTime: getTodayDate(),
        user_commission: parsedUserCommission,
        owner_commission: parsedOwnerCommission,
        role: 'user'
    });

    await user.save();

    res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        credit: user.credit,
        balance: user.balance,
        lastCreditTime: user.lastCreditTime
    });
}));



// GET: List users
router.get('/users_list', admin, asyncHandler(async (req, res) => {
    const users = await User.find({}, 'name username role balance credit lastCreditTime');
    res.json(users);
}));


// PUT: Update user fields
router.put('/users/:id', admin, asyncHandler(async (req, res) => {
    const updates = req.body;
    delete updates.password;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (updates.credit !== undefined) {
        const addCredit = parseFloat(updates.credit);
        if (!isNaN(addCredit) && addCredit > 0) {
            user.credit == addCredit;
            user.balance += addCredit;
            user.lastCreditTime = getTodayDate();
        }
    }

    if (updates.user_commission !== undefined) {
        const uc = parseFloat(updates.user_commission);
        if (isNaN(uc) || uc < 1 || uc > 100)
            return res.status(400).json({ error: 'User commission must be 1-100' });
        user.user_commission = uc;
    }

    if (updates.owner_commission !== undefined) {
        const oc = parseFloat(updates.owner_commission);
        if (isNaN(oc) || oc < 1 || oc > 100)
            return res.status(400).json({ error: 'Owner commission must be 1-100' });
        user.owner_commission = oc;
    }

    await user.save();
    res.json(user);
}));

// DELETE: Delete user
router.delete('/users/:id', admin, asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
}));

// POST: Logout
router.post('/logout', (req, res) => {
    ['token']
        .forEach(c => res.clearCookie(c, { path: '/' }));
    res.redirect('/login');
});

module.exports = router;
