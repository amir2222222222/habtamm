const express = require('express');
const router = express.Router();
const { User, Admin, SubAdmin } = require('../Models/User');
const asyncHandler = require("../Utils/AsyncHandler");
const { subadmin, admin } = require("../Middleware/AuthMiddleware");

/**
 * @route DELETE /user/:uuid
 * @description Delete a user created by the requesting subadmin
 * @access Subadmin only
 */
router.delete(
  '/user/:uuid',
  subadmin,
  asyncHandler(async (req, res) => {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({ 
          success: false,
          error: 'User Id is required' 
        });
      }

      const deleted = await User.findOneAndDelete({
        uuid: uuid,
        createdBy: req.subadmin.id
      });

      if (!deleted) {
        return res.status(403).json({ 
          success: false,
          error: 'User not found' 
        });
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'User deleted successfully',
      });

    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  })
);

/**
 * @route DELETE /admin/:uuid
 * @description Delete an admin created by the requesting admin
 * @access Admin only
 */
router.delete(
  '/admin/:uuid',
  admin,
  asyncHandler(async (req, res) => {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({ 
          success: false,
          error: 'Admin Id is required' 
        });
      }

      const adminToDelete = await Admin.findOne({ 
        uuid: uuid,
        createdBy: req.admin.id 
      });
      
      if (!adminToDelete) {
        return res.status(403).json({ 
          success: false,
          error: 'Admin not found' 
        });
      }

      const deleted = await Admin.findOneAndDelete({ 
        uuid: uuid,
        createdBy: req.admin.id 
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Admin deleted successfully',
      });

    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  })
);

/**
 * @route DELETE /subadmin/:uuid
 * @description Delete a subadmin created by the requesting admin
 * @access Admin only
 */
router.delete(
  '/subadmin/:uuid',
  admin,
  asyncHandler(async (req, res) => {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({ 
          success: false,
          error: 'Subadmin Id is required' 
        });
      }

      const subadminToDelete = await SubAdmin.findOne({ 
        uuid: uuid,
        createdBy: req.admin.id 
      });
      
      if (!subadminToDelete) {
        return res.status(403).json({ 
          success: false,
          error: 'Subadmin not found' 
        });
      }

      const deleted = await SubAdmin.findOneAndDelete({ 
        uuid: uuid,
        createdBy: req.admin.id 
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Subadmin deleted successfully',
      });

    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  })
);

module.exports = router;