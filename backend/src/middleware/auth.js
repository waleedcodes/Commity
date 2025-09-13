const jwt = require('jsonwebtoken');
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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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

  // Add API key info to request
  req.apiKey = {
    key: apiKey,
    type: 'service',
  };

  next();
};

/**
 * Rate limiting by user
 * Applies different limits based on user type
 */
const rateLimitByUser = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  // Different limits for different user types
  const limits = {
    admin: 1000,     // requests per hour
    premium: 500,    // requests per hour
    user: 100,       // requests per hour
  };

  const userLimit = limits[req.user.role] || limits.user;
  
  // Add limit info to request for potential use by rate limiting middleware
  req.rateLimit = {
    max: userLimit,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: () => `user_${req.user.id}`,
  };

  next();
};

/**
 * Check if user owns the resource or is admin
 * Middleware factory for resource ownership validation
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(ErrorFactory.unauthorized('Authentication required'));
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[resourceIdParam];
    
    if (!resourceId) {
      return next(ErrorFactory.badRequest(`Missing ${resourceIdParam} parameter`));
    }

    try {
      // For user resources, check if user is accessing their own data
      if (resourceIdParam === 'userId' || resourceIdParam === 'username') {
        if (req.user.id !== resourceId && req.user.username !== resourceId) {
          return next(ErrorFactory.forbidden('Access denied. You can only access your own resources.'));
        }
        return next();
      }

      // For other resources, you might need to fetch the resource and check ownership
      // This is a placeholder - implement based on your specific resource models
      // Example:
      // const resource = await SomeModel.findById(resourceId);
      // if (!resource) {
      //   return next(ErrorFactory.notFound('Resource not found'));
      // }
      // if (resource[userIdField] !== req.user.id) {
      //   return next(ErrorFactory.forbidden('Access denied'));
      // }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * GitHub token validation middleware
 * Ensures GitHub token is valid and has required scopes
 */
const validateGitHubToken = async (req, res, next) => {
  const githubToken = req.headers['x-github-token'] || req.body.githubToken;

  if (!githubToken) {
    return next(ErrorFactory.badRequest('GitHub token required'));
  }

  try {
    // Validate token with GitHub API
    const { verifyGitHubToken } = require('../config/github');
    const tokenInfo = await verifyGitHubToken();

    if (!tokenInfo.valid) {
      return next(ErrorFactory.unauthorized('Invalid GitHub token'));
    }

    // Add GitHub user info to request
    req.githubUser = tokenInfo.user;
    req.githubScopes = tokenInfo.scopes;

    next();
  } catch (error) {
    next(ErrorFactory.unauthorized('GitHub token validation failed'));
  }
};

/**
 * Require specific GitHub scopes
 */
const requireGitHubScopes = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.githubScopes) {
      return next(ErrorFactory.unauthorized('GitHub authentication required'));
    }

    const hasRequiredScopes = requiredScopes.every(scope => 
      req.githubScopes.includes(scope)
    );

    if (!hasRequiredScopes) {
      return next(ErrorFactory.forbidden(
        `Missing required GitHub scopes: ${requiredScopes.join(', ')}`
      ));
    }

    next();
  };
};

/**
 * User account status validation
 * Ensures user account is active and verified if required
 */
const requireActiveAccount = (requireVerification = false) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ErrorFactory.unauthorized('Authentication required'));
    }

    if (!req.user.isActive) {
      return next(ErrorFactory.forbidden('Account is deactivated'));
    }

    if (requireVerification && !req.user.isVerified) {
      return next(ErrorFactory.forbidden('Account verification required'));
    }

    next();
  };
};

/**
 * Request logging middleware
 * Logs authentication-related requests
 */
const logAuthRequests = (req, res, next) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  // Add user info if available
  if (req.user) {
    logData.userId = req.user.id;
    logData.username = req.user.username;
    logData.role = req.user.role;
  }

  // Add API key info if available
  if (req.apiKey) {
    logData.apiKeyType = req.apiKey.type;
  }

  logger.info(`Auth Request: ${JSON.stringify(logData)}`);
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  authenticateAPIKey,
  rateLimitByUser,
  requireOwnership,
  validateGitHubToken,
  requireGitHubScopes,
  requireActiveAccount,
  logAuthRequests,
};
