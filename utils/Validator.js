async function validateName(name) {
  if (!name || name.trim().length < 4) {
    return { valid: false, error: 'Name must be at least 4 characters' };
  }

  if (await checkDuplicate('name', name)) {
    return { valid: false, error: 'Name already exists' };
  }

  return { valid: true };
}

async function validateUsername(username) {
  if (!username || username.trim().length < 7) {
    return { valid: false, error: 'Username must be at least 7 characters' };
  }


  if (await checkDuplicate('username', username)) {
    return { valid: false, error: 'Username taken' };
  }

  return { valid: true };
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Minimum 8 characters' };
  }

  const requirements = [
    { test: /[A-Z]/, error: 'Need 1 uppercase letter' },
    { test: /[a-z]/, error: 'Need 1 lowercase letter' },
    { test: /[0-9]/, error: 'Need 1 number' },
    { test: /[^A-Za-z0-9]/, error: 'Need 1 special character' }
  ];

  for (const req of requirements) {
    if (!req.test.test(password)) {
      return { valid: false, error: req.error };
    }
  }

  return { valid: true };
}

async function validateCommission(commission) {
  const num = parseFloat(commission);
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }

  if (num < 0 || num > 100) {
    return { valid: false, error: 'Must be 0-100' };
  }

  return { valid: true, value: num };
}

async function validateCredit(credit) {
  const num = parseFloat(credit);
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }

  if (num < 0) {
    return { valid: false, error: 'Must be positive' };
  }

  return { valid: true, value: num };
}

async function validateState(state) {
  const validStates = ['active', 'suspended'];
  if (!validStates.includes(state)) {
    return { valid: false, error: `State must be: ${validStates.join(', ')}` };
  }
  return { valid: true };
}

// =====================
// EXPORTS
// =====================
module.exports = {
  validateName,
  validateUsername,
  validatePassword,
  validateCommission,
  validateCredit,
  validateState,
};
