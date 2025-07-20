const express = require("express");
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User');
const { generateToken, verifyToken } = require("../Utils/Jwt");
const asyncHandler = require("../Utils/AsyncHandler");
const { auth } = require("../Middleware/AuthMiddleware");
const path = require("path");
const fs = require("fs").promises;
const { comparePassword } = require("../Utils/Bcrypt");

// Cookie settings
const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

async function getCartelas() {
  const data = await fs.readFile(path.join(__dirname, "../cartels.json"), "utf-8");
  return JSON.parse(data);
}

// GET: Login page or redirect based on token
router.get(["/", "/login", "/signin"], async (req, res) => {
  const cartelas = await getCartelas();
  const token = req.cookies.token;

  if (!token) return res.render("Login", { cartelas });

  const decoded = verifyToken(token);
  if (!decoded || !decoded.role || decoded.state === "suspended")
    return res.render("Login", { cartelas });

  if (decoded.role === 'admin') return res.redirect('/signup/admin');
  if (decoded.role === 'subadmin') return res.redirect('/signup/user');
  if (decoded.role === 'user') return res.redirect('/home');

  return res.render("Login", { cartelas });
});

// POST: Handle login
router.post("/login", asyncHandler(async (req, res) => {
  let { username = "", password = "" } = req.body;

  username = username.trim();
  password = password.trim();

  // --- Validate username ---
  if (!username || typeof username !== 'string' || username.length < 8) {
    return res.status(400).json({
      error: "Invalid username",
      errors: ["Username must be at least 8 characters long."]
    });
  }

  // --- Validate password ---
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      error: "Invalid password",
      errors: ["Password must be at least 8 characters long."]
    });
  }

  // --- Find account by username ---
  const [user, admin, subadmin] = await Promise.all([
    User.findOne({ username }),
    Admin.findOne({ username }),
    SubAdmin.findOne({ username }),
  ]);

  const account = user || admin || subadmin;

  // --- Check for suspension ---
  if (account && account.state === 'suspended') {
    return res.status(403).json({
      error: "Account suspended",
      errors: ["Your account has been suspended. Please contact admin."]
    });
  }

  // --- Login: User ---
  if (user && await comparePassword(password, user.password)) {
    const token = generateToken({
      id: user._id,
      name: user.name,
      role: user.role,
      betbirr: 0,
      selectedcarts: [],
      linechaker: 0,
      winningAmount: 0,
      totalBet: 0,
      requiredbalance: 0,
    });

    res.cookie("token", token, cookieOpts);
    res.cookie("Voice", "Recommended_Black_Male_Voice", cookieOpts);
    res.cookie("Speed", "5", cookieOpts);
    res.cookie("Patterns", JSON.stringify(["h", "v", "d", "sc", "lc"]), cookieOpts);

    return res.status(200).json({
      message: "Login successful",
      redirect: "/Home"
    });
  }

  // --- Login: Admin ---
  if (admin && await comparePassword(password, admin.password)) {
    const token = generateToken({
      id: admin._id,
      name: admin.name,
      role: admin.role
    });

    res.cookie("token", token, cookieOpts);
    return res.status(200).json({
      message: "Admin login successful",
      redirect: "/SignUp/admin"
    });
  }

  // --- Login: SubAdmin ---
  if (subadmin && await comparePassword(password, subadmin.password)) {
    const token = generateToken({
      id: subadmin._id,
      name: subadmin.name,
      role: subadmin.role
    });

    res.cookie("token", token, cookieOpts);
    return res.status(200).json({
      message: "Subadmin login successful",
      redirect: "/SignUp/User"
    });
  }

  // --- Invalid Credentials ---
  return res.status(401).json({
    error: "Invalid credentials",
    errors: ["Invalid username or password"]
  });
}));

router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOpts);
  return res.redirect("/login");
});

module.exports = router;