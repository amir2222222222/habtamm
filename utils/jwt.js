const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "production";

// Create JWT
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
}

// Verify JWT
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
