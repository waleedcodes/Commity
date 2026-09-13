// [Commity Core Phase 2: Logic] users.js
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

/**
 * @route   GET /api/users/:username/streak
 * @desc    Get authentic GitHub contribution streak statistics
 * @access  Public
 */
router.get('/:username/streak',
  validateGitHubUsername,
  UserController.getUserStreakStats
);

/**
 * @route   GET /api/users/:username/wrapped
 * @desc    Get GitHub Developer Wrapped & Social Share insights
 * @access  Public
 */
router.get('/:username/wrapped',
  validateGitHubUsername,
  WrappedController.getDeveloperWrapped
);

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile by username
 * @access  Public
 */
router.get('/:username',
  validateGitHubUsername,
  optionalAuth,
  UserController.getUserProfile
);

/**
 * @route   POST /api/users/:username/sync
 * @desc    Force sync user profile with live GitHub data
 * @access  Public
 */
router.post('/:username/sync',
  validateGitHubUsername,
  UserController.syncUserProfile
);

/**
 * @route   PUT /api/users/:username
 * @desc    Update user profile
 * @access  Private (User or Admin)
 */
router.put('/:username',
  validateGitHubUsername,
  validateUserProfileUpdate,
  requireActiveAccount(),
  requireOwnership('username'),
  UserController.updateUserProfile
);

/**
 * @route   GET /api/users/:username/repositories
 * @route   GET /api/users/:username/repos (alias)
 * @desc    Get user repositories
