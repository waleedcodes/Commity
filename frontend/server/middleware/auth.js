const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { ErrorFactory } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * JWT token authentication middleware
 * Verifies JWT tokens and adds user information to request
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(ErrorFactory.unauthorized('Access token required'));
  }

  const secret = process.env.JWT_SECRET || 'commity_default_jwt_secret_dev_key';

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ErrorFactory.unauthorized('Token expired'));
      }
      if (err.name === 'JsonWebTokenError') {
        return next(ErrorFactory.unauthorized('Invalid token'));
      }
      return next(ErrorFactory.unauthorized('Token verification failed'));
    }

    req.user = user;
    next();
  });
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET || 'commity_default_jwt_secret_dev_key';

  jwt.verify(token, secret, (err, user) => {
    if (!err) {
      req.user = user;
    }
    // Continue regardless of token validity
    next();
  });
};

/**
 * Role-based authorization middleware
 * Requires specific roles to access the route
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ErrorFactory.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ErrorFactory.forbidden(`Access denied. Required roles: ${roles.join(', ')}`));
    }

    next();
  };
};

/**
 * Admin only middleware
 * Requires admin role
 */
const requireAdmin = requireRole('admin');

/**
 * API key authentication middleware
 * For service-to-service communication
 */
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(ErrorFactory.unauthorized('API key required'));
  }

  // In production, store API keys in database with proper hashing
  const validAPIKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);

  if (!validAPIKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempted.');
    return next(ErrorFactory.unauthorized('Invalid API key'));
  }

