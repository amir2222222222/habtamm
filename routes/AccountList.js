const express = require('express');
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User');
const asyncHandler = require("../Utils/AsyncHandler");
const { subadmin, admin } = require("../Middleware/AuthMiddleware");

// === List Users Created by Subadmin ===
router.get(
  '/user/list',
  subadmin, // Middleware to verify subadmin status
  asyncHandler(async (req, res) => {
    try {
      // Validate that subadmin ID exists in the request
      if (!req.subadmin?.id) {
        return res.status(400).render('error', { 
          message: 'sorry identification is missing' 
        });
      }

      // Define projection fields for security and performance
      const userProjection = {
        uuid: 1,
        name: 1,
        username: 1,
        balance: 1,
        credit: 1,
        state: 1,
        user_commission: 1,
        owner_commission: 1,
        initial_balance: 1,
        createdAt: 1,
      };

      // Fetch users with proper error handling
      const users = await User.find(
        { createdBy: req.subadmin.id },
        userProjection
      )
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(5000); // Add query timeout for safety

      return res.render('SubAdmin_Panal/UserList', { 
        users
      });

    } catch (error) {
      // Render error page with appropriate message
      return res.status(500).render('error', {
        message: 'Failed to load user list. Please try again later.'
      });
    }
  })
);


// === List SubAdmins ===
router.get(
  '/subadmin/list',
  admin, // Admin authentication middleware
  asyncHandler(async (req, res) => {
    try {
      // Input validation
      if (!req.admin?.id) {
        return res.status(400).render('error', {
          message: 'sorry identification is missing' 
        });
      }

      // Define projection for security and performance
      const subadminProjection = {
        uuid: 1,
        name: 1,
        username: 1,
        state: 1,
        balance: 1,
        credit: 1,
        lastCreditTime: 1,
        createdAt: 1,
      };

      // Add query execution timeout and logging
      const startTime = Date.now();
      const subadmins = await SubAdmin.find(
        { createdBy: req.admin.id },
        subadminProjection
      )
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(5000); // 3-second timeout for query

      // Success response
      return res.render('Admin_Panal/SubAdminList', {
        subadmins
      });

    } catch (error) {
      // User-friendly error response
      return res.status(500).render('error', {
         message: 'Failed to load subadmin list. Please try again later.'
      });
    }
  })
);


// === List Admins ===
router.get(
  '/admin/list',
  admin, // Admin authentication middleware
  asyncHandler(async (req, res) => {
    try {
      // Input validation
      if (!req.admin?.id) {
        return res.status(400).render('error', {
          message: 'sorry identification is missing' 
        });
      }

      // Define projection for security and performance
      const adminProjection = {
        uuid: 1,
        name: 1,
        username: 1,
        state: 1,
        createdAt: 1,
      };

      // Add query execution timeout and logging
      const startTime = Date.now();
      const admins = await Admin.find(
        { createdBy: req.admin.id },
        adminProjection
      )
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(5000); // 3-second timeout for query

      // Success response
      return res.render('Admin_Panal/AdminList', {
        admins
      });

    } catch (error) {
      // User-friendly error response
      return res.status(500).render('error', {
       message: 'Failed to load admin list. Please try again later.'
      });
    }
  })
);


module.exports = router;