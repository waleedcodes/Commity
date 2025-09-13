const express = require('express');
const router = express.Router();

// Import controllers
const UserController = require('../controllers/userController');

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
 * @desc    Get user repositories
 * @access  Public
 */
router.get('/:username/repositories',
  validateGitHubUsername,
  optionalAuth,
  UserController.getUserRepositories
);

/**
 * @route   GET /api/users/:username/activity
 * @desc    Get user activity/events
 * @access  Public
 */
router.get('/:username/activity',
  validateGitHubUsername,
  optionalAuth,
  UserController.getUserActivity
);

/**
 * @route   GET /api/users/:username/stats
 * @desc    Get user statistics summary
 * @access  Public
 */
router.get('/:username/stats',
  validateGitHubUsername,
  optionalAuth,
  UserController.getUserStats
);

/**
 * @route   POST /api/users/:username/refresh
 * @desc    Refresh user data from GitHub
 * @access  Public (with rate limiting)
 */
router.post('/:username/refresh',
  validateGitHubUsername,
  optionalAuth,
  UserController.refreshUserData
);

module.exports = router;
