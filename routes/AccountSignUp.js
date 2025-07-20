const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { User, Admin, SubAdmin } = require('../Models/User');
const asyncHandler = require('../Utils/AsyncHandler');
const { admin, subadmin } = require("../Middleware/AuthMiddleware");
const { hashPassword } = require('../Utils/Bcrypt');
const { getTodayDate } = require('../Utils/Time');

// ---------- GET Views ----------
router.get('/signup/admin', admin, (req, res) => {
  if (!req.admin) return res.status(403).json({ error: 'Unauthorized' });
  res.render("Admin_Panal/SignUpAdmin");
});

router.get('/signup/subadmin', admin, (req, res) => {
  if (!req.admin) return res.status(403).json({ error: 'Unauthorized' });
  res.render("Admin_Panal/SignUpSubAdmin");
});

router.get('/signup/user', subadmin, (req, res) => {
  if (!req.subadmin) return res.status(403).json({ error: 'Unauthorized' });
  res.render("SubAdmin_Panal/SignUpUser");
});

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

// ---------- Case-sensitive Duplicate Check Utilities ----------
const isDuplicateUsername = async (username) => {
  const trimmed = username.trim(); // No case conversion
  const [admin, subadmin, user] = await Promise.all([
    Admin.findOne({ username: trimmed }),
    SubAdmin.findOne({ username: trimmed }),
    User.findOne({ username: trimmed })
  ]);
  return admin || subadmin || user;
};

const isDuplicateName = async (name) => {
  const trimmed = name.trim(); // No case conversion
  const [admin, subadmin, user] = await Promise.all([
    Admin.findOne({ name: trimmed }),
    SubAdmin.findOne({ name: trimmed }),
    User.findOne({ name: trimmed })
  ]);
  return admin || subadmin || user;
};

// ---------- Admin Signup ----------
router.post('/signup/admin', admin, asyncHandler(async (req, res) => {
  const { name, username, password } = req.body;
  
  // Check required fields
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate inputs
  const nameValidation = validateName(name);
  const usernameValidation = validateUsername(username);
  const passwordValidation = validatePassword(password);

  const errors = [
    ...(!nameValidation.valid ? [nameValidation.error] : []),
    ...(!usernameValidation.valid ? [usernameValidation.error] : []),
    ...(!passwordValidation.valid ? [passwordValidation.error] : [])
  ];

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Check for duplicates (case-sensitive)
  if (await isDuplicateUsername(usernameValidation.value)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  if (await isDuplicateName(nameValidation.value)) {
    return res.status(409).json({ error: 'Name already exists' });
  }

  // Create new admin
  const newAdmin = new Admin({
    uuid: uuidv4(),
    name: nameValidation.value,
    username: usernameValidation.value,
    state: 'active',
    password: await hashPassword(passwordValidation.value),
    role: 'admin',
    createdBy: req.admin.id || 'system',
    createdAt: getTodayDate(),
  });

  await newAdmin.save();

  res.status(201).json({
    success: true,
    message: 'Admin account created successfully'
  });
}));

// ---------- SubAdmin Signup ----------
router.post('/signup/subadmin', admin, asyncHandler(async (req, res) => {
  const { name, username, password, credit } = req.body;
  
  // Check required fields
  if (!name || !username || !password || credit === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate inputs
  const nameValidation = validateName(name);
  const usernameValidation = validateUsername(username);
  const passwordValidation = validatePassword(password);
  const creditValidation = validateCredit(credit);

  const validationErrors = [
    ...(!nameValidation.valid ? [nameValidation.error] : []),
    ...(!usernameValidation.valid ? [usernameValidation.error] : []),
    ...(!passwordValidation.valid ? [passwordValidation.error] : []),
    ...(!creditValidation.valid ? [creditValidation.error] : [])
  ];

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  // Check for duplicates (case-sensitive)
  if (await isDuplicateUsername(usernameValidation.value)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  if (await isDuplicateName(nameValidation.value)) {
    return res.status(409).json({ error: 'Name already exists' });
  }

  // Create new subadmin
  const newSubAdmin = new SubAdmin({
    uuid: uuidv4(),
    name: nameValidation.value,
    username: usernameValidation.value,
    password: await hashPassword(passwordValidation.value),
    role: 'subadmin',
    state: 'active',
    credit: creditValidation.value,
    balance: creditValidation.value,
    createdBy: req.admin.id || 'system',
    createdAt: getTodayDate(),
  });

  await newSubAdmin.save();

  res.status(201).json({
    success: true,
    message: 'Subadmin account created successfully',
  });
}));

// ---------- User Signup ----------
router.post('/signup/user', subadmin, asyncHandler(async (req, res) => {
  const session = await SubAdmin.startSession();
  session.startTransaction();

  try {
    const { name, username, password, credit, user_commission, owner_commission } = req.body;
    
    // Check required fields
    if (!name || !username || !password || credit === undefined ||
        user_commission === undefined || owner_commission === undefined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate inputs
    const creditValidation = validateCredit(credit);
    const nameValidation = validateName(name);
    const usernameValidation = validateUsername(username);
    const passwordValidation = validatePassword(password);
    const userCommValidation = validateCommission(user_commission);
    const ownerCommValidation = validateCommission(owner_commission);

    const validationErrors = [
      ...(!creditValidation.valid ? [creditValidation.error] : []),
      ...(!nameValidation.valid ? [nameValidation.error] : []),
      ...(!usernameValidation.valid ? [usernameValidation.error] : []),
      ...(!passwordValidation.valid ? [passwordValidation.error] : []),
      ...(!userCommValidation.valid ? [userCommValidation.error] : []),
      ...(!ownerCommValidation.valid ? [ownerCommValidation.error] : [])
    ];

    if (validationErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ errors: validationErrors });
    }

    // Check for duplicates (case-sensitive)
    if (await isDuplicateUsername(usernameValidation.value)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (await isDuplicateName(nameValidation.value)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ error: 'Name already exists' });
    }

    const creditAmount = creditValidation.value;
    const subadminAccount = await SubAdmin.findById(req.subadmin.id)
      .session(session)
      .select('balance account_history');

    if (!subadminAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Creator account not found' });
    }

    if (subadminAccount.balance < creditAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create new user
    const newUser = new User({
      uuid: uuidv4(),
      name: nameValidation.value,
      username: usernameValidation.value,
      shopname: nameValidation.value,
      password: await hashPassword(passwordValidation.value),
      credit: creditAmount,
      balance: creditAmount,
      initial_balance: creditAmount,
      lastCreditTime: getTodayDate(),
      user_commission: userCommValidation.value,
      owner_commission: ownerCommValidation.value,
      state: "active",
      role: 'user',
      createdBy: req.subadmin.id || 'system',
      createdAt: getTodayDate(),
    });

    // Update subadmin balance
    const updatedSubAdmin = await SubAdmin.findByIdAndUpdate(
      req.subadmin.id,
      {
        $inc: { balance: -creditAmount },
        $push: {
          account_history: {
            amount: -creditAmount,
            deposited_user_userName: usernameValidation.value,
            date: getTodayDate()
          }
        }
      },
      {
        session,
        new: true,
        select: 'balance'
      }
    );

    if (!updatedSubAdmin) {
      throw new Error("Balance update failed");
    }

    await newUser.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'User account created successfully',
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

module.exports = router;