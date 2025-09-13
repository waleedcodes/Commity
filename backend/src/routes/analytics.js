const express = require('express');
const router = express.Router();

// Import middleware
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateAnalyticsQuery, 
  validateGitHubUsername,
  validateDateRange,
  validateQueryParams 
} = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');

// Import controller
const AnalyticsController = require('../controllers/analyticsController');

// Routes

/**
 * @route   GET /api/analytics/global
 * @desc    Get global analytics overview
 * @access  Public
 */
router.get('/global',
  validateAnalyticsQuery,
  validateDateRange,
  optionalAuth,
  AnalyticsController.getGlobalAnalytics
);

/**
 * @route   GET /api/analytics/insights
 * @desc    Get platform insights and comprehensive analytics
 * @access  Public
 */
router.get('/insights',
  validateQueryParams,
  AnalyticsController.getPlatformInsights
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get analytics trends and patterns
 * @access  Public
 */
router.get('/trends',
  validateAnalyticsQuery,
  validateDateRange,
  AnalyticsController.getAnalyticsTrends
);

/**
 * @route   POST /api/analytics/compare
 * @desc    Compare multiple users' analytics
 * @access  Public
 */
router.post('/compare',
  validateAnalyticsQuery,
  validateDateRange,
  AnalyticsController.compareUsers
);

/**
 * @route   GET /api/analytics/user/:username
 * @desc    Get detailed analytics for a specific user
 * @access  Public
 */
router.get('/user/:username',
  validateGitHubUsername,
  validateAnalyticsQuery,
  validateDateRange,
  optionalAuth,
  AnalyticsController.getUserAnalytics
);

module.exports = router;
