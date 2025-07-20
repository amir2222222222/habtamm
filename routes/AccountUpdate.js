const express = require('express');
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User');
const asyncHandler = require("../Utils/AsyncHandler");
const { subadmin, admin } = require("../Middleware/AuthMiddleware");
const { hashPassword, comparePassword } = require('../Utils/Bcrypt');
const { getTodayDate } = require('../Utils/Time');

// ---------- Validators (consistent with profile) ----------
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 4) {
    return { valid: false, error: 'Name must be at least 4 characters' };
  }
  return { valid: true, value: trimmed };
};

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

const validateCredit = (credit) => {
  const num = parseFloat(credit);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Credit must be a positive number' };
  }
  return { valid: true, value: num };
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

const validateState = (state) => {
  if (state && !['active', 'suspended'].includes(state)) {
    return { valid: false, error: 'State must be either active or suspended' };
  }
  return { valid: true, value: state || 'active' };
};

// ---------- Case-sensitive Duplicate Check Utilities ----------
const isDuplicateUsername = async (username, excludeId = null) => {
  const trimmed = username.trim(); // No case conversion
  const conditions = [
    Admin.findOne({ username: trimmed }),
    SubAdmin.findOne({ username: trimmed }),
    User.findOne({ username: trimmed })
  ];

  if (excludeId) {
    conditions.forEach(cond => {
      cond.where('_id').ne(excludeId);
    });
  }

  const [admin, subadmin, user] = await Promise.all(conditions);
  return admin || subadmin || user;
};

const isDuplicateName = async (name, excludeId = null) => {
  const trimmed = name.trim(); // No case conversion
  const conditions = [
    Admin.findOne({ name: trimmed }),
    SubAdmin.findOne({ name: trimmed }),
    User.findOne({ name: trimmed })
  ];

  if (excludeId) {
    conditions.forEach(cond => {
      cond.where('_id').ne(excludeId);
    });
  }

  const [admin, subadmin, user] = await Promise.all(conditions);
  return admin || subadmin || user;
};

// ---------- Update Admin ----------
router.put('/admin/:uuid', admin, asyncHandler(async (req, res) => {
  const adminDoc = await Admin.findOne({ uuid: req.params.uuid, createdBy: req.admin.id });
  if (!adminDoc) {
    return res.status(404).json({ success: false, error: 'Admin account not found' });
  }

  const updates = Object.entries(req.body);
  const errors = [];

  for (const [key, val] of updates) {
    try {
      switch (key) {
        case 'name': {
          const nameRes = validateName(val);
          if (!nameRes.valid) throw new Error(nameRes.error);
          
          // Case-sensitive name check excluding current document
          if (await isDuplicateName(nameRes.value, adminDoc._id)) {
            throw new Error('Name already exists');
          }
          adminDoc.name = nameRes.value;
          break;
        }
        case 'username': {
          const userRes = validateUsername(val);
          if (!userRes.valid) throw new Error(userRes.error);
          
          // Case-sensitive username check excluding current document
          if (await isDuplicateUsername(userRes.value, adminDoc._id)) {
            throw new Error('Username already exists');
          }
          adminDoc.username = userRes.value;
          break;
        }
        case 'password': {
          const passRes = validatePassword(val);
          if (!passRes.valid) throw new Error(passRes.error);
          
          // Check if new password is different from current
          const isSamePassword = await comparePassword(passRes.value, adminDoc.password);
          if (isSamePassword) {
            throw new Error('New password must be different from current password');
          }
          
          adminDoc.password = await hashPassword(passRes.value);
          break;
        }
        case 'state': {
          const stateRes = validateState(val);
          if (!stateRes.valid) throw new Error(stateRes.error);
          adminDoc.state = stateRes.value;
          break;
        }
        default:
          throw new Error(`Field "${key}" is not allowed`);
      }
    } catch (err) {
      errors.push(`${key}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  await adminDoc.save();
  res.json({ success: true, message: 'Admin updated successfully' });
}));

// ---------- Update SubAdmin ----------
router.put('/subadmin/:uuid', admin, asyncHandler(async (req, res) => {
  const subadminDoc = await SubAdmin.findOne({ uuid: req.params.uuid, createdBy: req.admin.id });
  if (!subadminDoc) {
    return res.status(404).json({ success: false, error: 'SubAdmin not found' });
  }

  const updates = Object.entries(req.body);
  const errors = [];

  for (const [key, val] of updates) {
    try {
      switch (key) {
        case 'name': {
          const nameRes = validateName(val);
          if (!nameRes.valid) throw new Error(nameRes.error);
          
          if (await isDuplicateName(nameRes.value, subadminDoc._id)) {
            throw new Error('Name already exists');
          }
          subadminDoc.name = nameRes.value;
          break;
        }
        case 'username': {
          const userRes = validateUsername(val);
          if (!userRes.valid) throw new Error(userRes.error);
          
          if (await isDuplicateUsername(userRes.value, subadminDoc._id)) {
            throw new Error('Username already exists');
          }
          subadminDoc.username = userRes.value;
          break;
        }
        case 'password': {
          const passRes = validatePassword(val);
          if (!passRes.valid) throw new Error(passRes.error);
          
          const isSamePassword = await comparePassword(passRes.value, subadminDoc.password);
          if (isSamePassword) {
            throw new Error('New password must be different from current password');
          }
          
          subadminDoc.password = await hashPassword(passRes.value);
          break;
        }
        case 'state': {
          const stateRes = validateState(val);
          if (!stateRes.valid) throw new Error(stateRes.error);
          subadminDoc.state = stateRes.value;
          break;
        }
        case 'credit': {
          const creditRes = validateCredit(val);
          if (!creditRes.valid) throw new Error(creditRes.error);
          subadminDoc.credit = creditRes.value;
          subadminDoc.balance += creditRes.value;
          subadminDoc.lastCreditTime = getTodayDate();
          break;
        }
        default:
          throw new Error(`Field "${key}" is not allowed`);
      }
    } catch (err) {
      errors.push(`${key}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  await subadminDoc.save();
  res.json({ success: true, message: 'SubAdmin updated successfully' });
}));

// ---------- Update User ----------
router.put('/user/:uuid', subadmin, asyncHandler(async (req, res) => {
  const session = await SubAdmin.startSession();
  session.startTransaction();

  try {
    const userDoc = await User.findOne({ uuid: req.params.uuid, createdBy: req.subadmin.id }).session(session);
    if (!userDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = Object.entries(req.body);
    const errors = [];
    let subadminDoc = null;

    for (const [key, val] of updates) {
      try {
        switch (key) {
          case 'name': {
            const nameRes = validateName(val);
            if (!nameRes.valid) throw new Error(nameRes.error);
            
            if (await isDuplicateName(nameRes.value, userDoc._id)) {
              throw new Error('Name already exists');
            }
            userDoc.name = nameRes.value;
            break;
          }
          case 'username': {
            const userRes = validateUsername(val);
            if (!userRes.valid) throw new Error(userRes.error);
            
            if (await isDuplicateUsername(userRes.value, userDoc._id)) {
              throw new Error('Username already exists');
            }
            userDoc.username = userRes.value;
            break;
          }
          case 'password': {
            const passRes = validatePassword(val);
            if (!passRes.valid) throw new Error(passRes.error);
            
            const isSamePassword = await comparePassword(passRes.value, userDoc.password);
            if (isSamePassword) {
              throw new Error('New password must be different from current password');
            }
            
            userDoc.password = await hashPassword(passRes.value);
            break;
          }
          case 'state': {
            const stateRes = validateState(val);
            if (!stateRes.valid) throw new Error(stateRes.error);
            userDoc.state = stateRes.value;
            break;
          }
          case 'credit': {
            const creditRes = validateCredit(val);
            if (!creditRes.valid) throw new Error(creditRes.error);

            subadminDoc = await SubAdmin.findById(req.subadmin.id).session(session).select('balance account_history');
            if (!subadminDoc || subadminDoc.balance < creditRes.value) {
              throw new Error('Insufficient balance');
            }

            await SubAdmin.findByIdAndUpdate(req.subadmin.id, {
              $inc: { balance: -creditRes.value },
              $push: {
                account_history: {
                  amount: -creditRes.value,
                  deposited_user_userName: userDoc.username,
                  date: getTodayDate()
                }
              }
            }, { session });

            userDoc.credit = creditRes.value;
            userDoc.balance += creditRes.value;
            userDoc.initial_balance = userDoc.balance;
            userDoc.lastCreditTime = getTodayDate();
            break;
          }
          default:
            throw new Error(`Field "${key}" is not allowed`);
        }
      } catch (err) {
        errors.push(`${key}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, errors });
    }

    await userDoc.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Clear games if needed (as in original code)
    userDoc.games = [];
    await userDoc.save();

    res.json({ success: true, message: 'User updated successfully' });

  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}));

module.exports = router;