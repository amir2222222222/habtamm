const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// Authenticated users only
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Redirect based on role
    if (req.user.role === "admin") {
      return res.redirect("/admin");
    } else if (req.user.role === "user") {
      return res.redirect("/home");
    } else {
      return res.redirect("/login");
    }
  } catch (err) {
    return res.redirect("/login");
  }
}

// User role only
function user(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (req.user.role === "user") {
      return next();
    } else if (req.user.role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/home");
    }
  } catch (err) {
    return res.redirect("/login");
  }
}

// Admin role only
function admin(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (req.user.role === "admin") {
      return next();
    } else if (req.user.role === "user") {
      return res.redirect("/home");
    } else {
      return res.redirect("/login");
    }
  } catch (err) {
    return res.redirect("/login");
  }
}

module.exports = { requireAuth, user, admin };
