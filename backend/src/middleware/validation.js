const Joi = require('joi');
const { ErrorFactory } = require('./errorHandler');
const { REGEX, PAGINATION, ANALYTICS_PERIODS } = require('../config/constants');

/**
 * Validation middleware factory
 * Creates middleware for validating request data using Joi schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return next(ErrorFactory.badRequest('Validation failed', { validationErrors: details }));
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validation schemas
 */

// GitHub username validation schema
const githubUsernameSchema = Joi.object({
  username: Joi.string()
    .pattern(REGEX.GITHUB_USERNAME)
    .min(1)
    .max(39)
    .required()
    .messages({
      'string.pattern.base': 'Invalid GitHub username format',
      'string.min': 'Username must be at least 1 character long',
      'string.max': 'Username cannot be longer than 39 characters',
    }),
});

// User profile update schema
const userProfileUpdateSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  bio: Joi.string().trim().max(500).optional(),
  location: Joi.string().trim().max(100).optional(),
  company: Joi.string().trim().max(100).optional(),
  blog: Joi.string().uri().optional().allow(''),
  twitterUsername: Joi.string().trim().max(50).optional().allow(''),
  email: Joi.string().email().optional(),
  isPublic: Joi.boolean().optional(),
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    publicProfile: Joi.boolean().optional(),
    dataSharing: Joi.boolean().optional(),
  }).optional(),
});

// Query parameters validation schema
const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  sort: Joi.string().valid(
    'username', 'name', 'totalCommits', 'followers', 'publicRepos', 
    'createdAt', 'updatedAt', 'globalRank'
  ).default('totalCommits'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().max(100).optional(),
  location: Joi.string().trim().max(100).optional(),
  language: Joi.string().trim().max(50).optional(),
  minCommits: Joi.number().integer().min(0).optional(),
  maxCommits: Joi.number().integer().min(0).optional(),
  minFollowers: Joi.number().integer().min(0).optional(),
  maxFollowers: Joi.number().integer().min(0).optional(),
  isVerified: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

// Analytics query schema
const analyticsQuerySchema = Joi.object({
  period: Joi.string()
    .valid(...Object.values(ANALYTICS_PERIODS), '1d', '7d', '30d', '90d', '365d')
    .default('30d'),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  username: Joi.string().pattern(REGEX.GITHUB_USERNAME).optional(),
  userId: Joi.string().hex().length(24).optional(), // MongoDB ObjectId
  metric: Joi.string().valid(
    'commits', 'pullRequests', 'issues', 'reviews', 'total'
  ).default('total'),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year').optional(),
});

// Leaderboard query schema
const leaderboardQuerySchema = Joi.object({
  category: Joi.string().valid(
    'commits', 'repositories', 'followers', 'contributions', 'streak'
  ).default('commits'),
  period: Joi.string()
    .valid(...Object.values(ANALYTICS_PERIODS))
    .default(ANALYTICS_PERIODS.ALL_TIME),
  location: Joi.string().trim().max(100).optional(),
  language: Joi.string().trim().max(50).optional(),
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

// Repository data schema
const repositorySchema = Joi.object({
  name: Joi.string().pattern(REGEX.GITHUB_REPO_NAME).required(),
  fullName: Joi.string().required(),
  description: Joi.string().max(500).optional().allow(null),
  private: Joi.boolean().required(),
  fork: Joi.boolean().required(),
  homepage: Joi.string().uri().optional().allow('', null),
  language: Joi.string().max(50).optional().allow(null),
  stargazersCount: Joi.number().integer().min(0).required(),
  forksCount: Joi.number().integer().min(0).required(),
  watchersCount: Joi.number().integer().min(0).required(),
  size: Joi.number().integer().min(0).required(),
  defaultBranch: Joi.string().max(100).required(),
  openIssuesCount: Joi.number().integer().min(0).required(),
  topics: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  hasIssues: Joi.boolean().required(),
  hasProjects: Joi.boolean().required(),
  hasWiki: Joi.boolean().required(),
  hasPages: Joi.boolean().required(),
  hasDownloads: Joi.boolean().required(),
  archived: Joi.boolean().required(),
  disabled: Joi.boolean().required(),
  pushedAt: Joi.date().iso().optional().allow(null),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required(),
});

// Bulk user update schema
const bulkUserUpdateSchema = Joi.object({
  usernames: Joi.array()
    .items(Joi.string().pattern(REGEX.GITHUB_USERNAME))
    .min(1)
    .max(100)
    .unique()
    .required(),
  updateOptions: Joi.object({
    forceUpdate: Joi.boolean().default(false),
    includeRepos: Joi.boolean().default(true),
    includeEvents: Joi.boolean().default(true),
  }).optional(),
});

// Search query schema
const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(200).required(),
  type: Joi.string().valid('users', 'repositories', 'code', 'commits').default('users'),
  sort: Joi.string().valid('stars', 'forks', 'help-wanted-issues', 'updated').optional(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).max(100).default(1),
  per_page: Joi.number().integer().min(1).max(100).default(30),
});

// GitHub webhook schema
const githubWebhookSchema = Joi.object({
  action: Joi.string().required(),
  repository: Joi.object().required(),
  sender: Joi.object().required(),
  // Add more specific webhook fields as needed
}).unknown(true); // Allow unknown fields for flexibility

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return next(ErrorFactory.badRequest('Query validation failed', { validationErrors: details }));
    }

    req.query = value;
    next();
  };
};

/**
 * Validate URL parameters
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return next(ErrorFactory.badRequest('Parameter validation failed', { validationErrors: details }));
    }

    req.params = value;
    next();
  };
};

/**
 * Custom validation functions
 */

// Validate GitHub username parameter
const validateGitHubUsername = validateParams(Joi.object({
  username: Joi.string()
    .pattern(REGEX.GITHUB_USERNAME)
    .min(1)
    .max(39)
    .required()
    .messages({
      'string.pattern.base': 'Invalid GitHub username format',
    }),
}));

// Validate MongoDB ObjectId parameter
const validateObjectId = (paramName = 'id') => {
  return validateParams(Joi.object({
    [paramName]: Joi.string().hex().length(24).required().messages({
      'string.hex': 'Invalid ID format',
      'string.length': 'Invalid ID format',
    }),
  }));
};

// Validate date range
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return next(ErrorFactory.badRequest('Start date must be before end date'));
    }
    
    // Limit date range to prevent excessive queries
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (end - start > maxRangeMs) {
      return next(ErrorFactory.badRequest('Date range cannot exceed 1 year'));
    }
  }
  
  next();
};

/**
 * Middleware exports with validation schemas
 */
module.exports = {
  // Main validation functions
  validate,
  validateQuery,
  validateParams,
  
  // Specific validators
  validateGitHubUsername,
  validateObjectId,
  validateDateRange,
  
  // Validation schemas
  schemas: {
    githubUsername: githubUsernameSchema,
    userProfileUpdate: userProfileUpdateSchema,
    queryParams: queryParamsSchema,
    analyticsQuery: analyticsQuerySchema,
    leaderboardQuery: leaderboardQuerySchema,
    repository: repositorySchema,
    bulkUserUpdate: bulkUserUpdateSchema,
    searchQuery: searchQuerySchema,
    githubWebhook: githubWebhookSchema,
  },
  
  // Pre-configured middleware
  validateQueryParams: validateQuery(queryParamsSchema),
  validateAnalyticsQuery: validateQuery(analyticsQuerySchema),
  validateLeaderboardQuery: validateQuery(leaderboardQuerySchema),
  validateSearchQuery: validateQuery(searchQuerySchema),
  validateUserProfileUpdate: validate(userProfileUpdateSchema),
  validateBulkUserUpdate: validate(bulkUserUpdateSchema),
  validateGitHubWebhook: validate(githubWebhookSchema),
};
