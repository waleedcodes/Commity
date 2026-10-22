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
 * @route   GET /api/leaderboard/featured
 * @desc    Get algorithmic featured developers (Worldwide, Regional, Language Leaders)
 * @access  Public
 */
router.get('/featured',
  LeaderboardController.getFeaturedDevelopers
);

/**
 * @route   GET /api/leaderboard/regions
 * @desc    Get dynamic region list with active maintainer counts
