const express = require('express');
const router = express.Router();

// Import middleware
const { asyncHandler } = require('../middleware/errorHandler');
const { validateLeaderboardQuery, validateQueryParams } = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');

// Import controller
const LeaderboardController = require('../controllers/leaderboardController');

// Routes

/**
 * @route   GET /api/leaderboard
 * @desc    Get global leaderboard
 * @access  Public
 */
router.get('/',
  validateLeaderboardQuery,
  optionalAuth,
  LeaderboardController.getLeaderboard
);

/**
 * @route   GET /api/leaderboard/stats
 * @desc    Get leaderboard statistics and overview
 * @access  Public
 */
router.get('/stats',
  LeaderboardController.getLeaderboardStats
);

/**
 * @route   GET /api/leaderboard/contributors
 * @desc    Get top contributors
 * @access  Public
 */
router.get('/contributors',
  validateLeaderboardQuery,
  LeaderboardController.getTopContributors
);

/**
 * @route   GET /api/leaderboard/repositories
 * @desc    Get top repositories
 * @access  Public
 */
router.get('/repositories',
  validateQueryParams,
  LeaderboardController.getTopRepositories
);

/**
 * @route   GET /api/leaderboard/location/:location
 * @desc    Get leaderboard filtered by location
 * @access  Public
 */
router.get('/location/:location',
  validateLeaderboardQuery,
  LeaderboardController.getLeaderboardByLocation
);

/**
 * @route   GET /api/leaderboard/language/:language
 * @desc    Get leaderboard filtered by programming language
 * @access  Public
 */
router.get('/language/:language',
  validateLeaderboardQuery,
  LeaderboardController.getLeaderboardByLanguage
);

/**
 * @route   GET /api/leaderboard/user/:username
 * @desc    Get specific user's ranking across different categories
 * @access  Public
 */
router.get('/user/:username',
  validateLeaderboardQuery,
  LeaderboardController.getUserRanking
);

module.exports = router;
