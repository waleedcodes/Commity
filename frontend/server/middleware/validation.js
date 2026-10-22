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
    'createdAt', 'updatedAt', 'globalRank',
    'totalContributions', 'publicContributions', 'privateContributions',
    'contributionStreak', 'longestStreak'
  ).default('totalCommits'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().max(100).optional().allow(''),
  location: Joi.string().trim().max(100).optional().allow(''),
  language: Joi.string().trim().max(50).optional().allow(''),
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
