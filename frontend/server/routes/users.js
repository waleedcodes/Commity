const express = require('express');
const router = express.Router();

// Import controllers
const UserController = require('../controllers/userController');
const WrappedController = require('../controllers/wrappedController');

// Import middleware
const { 
  validateGitHubUsername,
  validateQueryParams,
  validateUserProfileUpdate,
  validateBulkUserUpdate 
} = require('../middleware/validation');
const { optionalAuth, requireOwnership, requireActiveAccount } = require('../middleware/auth');

// Routes

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Public
 */
router.get('/',
  validateQueryParams,
  optionalAuth,
  UserController.getAllUsers
);

/**
 * @route   GET /api/users/search
 * @desc    Search users by query
 * @access  Public
 */
router.get('/search',
  optionalAuth,
  UserController.searchUsers
);

/**
 * @route   GET /api/users/:username/badge.svg
 * @desc    Get dynamic SVG badge for user profile README
 * @access  Public
 */
router.get('/:username/badge.svg',
  validateGitHubUsername,
  UserController.getUserBadgeSvg
);

/**
 * @route   GET /api/users/:username/streak.svg
 * @desc    Get dynamic SVG streak card for user profile README
 * @access  Public
 */
router.get('/:username/streak.svg',
  validateGitHubUsername,
  UserController.getUserStreakSvg
);
