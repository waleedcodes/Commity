// [Commity Core Phase 2: Logic] analytics.js
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
 * @route   GET /api/analytics
 * @route   GET /api/analytics/global
 * @desc    Get global analytics overview
 * @access  Public
 */
router.get('/',
  validateAnalyticsQuery,
  validateDateRange,
  optionalAuth,
  AnalyticsController.getGlobalAnalytics
);

router.get('/global',
  validateAnalyticsQuery,
  validateDateRange,
  optionalAuth,
  AnalyticsController.getGlobalAnalytics
);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get analytics summary
 * @access  Public
 */
router.get('/summary',
  AnalyticsController.getAnalyticsSummary
);

/**
 * @route   GET /api/analytics/platform/stats
 * @route   GET /api/platform/stats
 * @desc    Get live platform statistics
 * @access  Public
 */
router.get('/platform/stats',
  AnalyticsController.getPlatformStats
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
