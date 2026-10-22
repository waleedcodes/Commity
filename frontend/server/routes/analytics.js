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
