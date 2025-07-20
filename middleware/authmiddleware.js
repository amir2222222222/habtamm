const { verifyToken } = require("../Utils/Jwt");
const { User, Admin, SubAdmin } = require('../Models/User');

// Cookie settings
const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const authorizeRole = (expectedRole) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        res.clearCookie("token", cookieOpts);
        return res.redirect("/login");
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.role) {
        res.clearCookie("token", cookieOpts);
        return res.redirect("/login");
      }

      // Fetch account from DB to check suspension status
      let account;
      if (decoded.role === 'admin') {
        account = await Admin.findById(decoded.id);
        if (!account || account.state === 'suspended') {
          res.clearCookie("token", cookieOpts);
          return res.redirect("/login");
        }
        req.admin = decoded;
      }

      if (decoded.role === 'subadmin') {
        account = await SubAdmin.findById(decoded.id);
        if (!account || account.state === 'suspended') {
          res.clearCookie("token", cookieOpts);
          return res.redirect("/login");
        }
        req.subadmin = decoded;
      }

      if (decoded.role === 'user') {
        account = await User.findById(decoded.id);
        if (!account || account.state === 'suspended') {
          res.clearCookie("token", cookieOpts);
          return res.redirect("/login");
        }
        req.user = decoded;
      }

      // Role mismatch
      if (decoded.role !== expectedRole) {
        res.clearCookie("token", cookieOpts);
        return res.redirect("/login");
      }

      next();
    } catch (err) {
      console.error('Authorization error:', err);
      res.clearCookie("token", cookieOpts);
      return res.redirect("/login");
    }
  };
};

// Export role-based middleware
module.exports = {
  user: authorizeRole('user'),
  admin: authorizeRole('admin'),
  subadmin: authorizeRole('subadmin'),
};
