const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_TYPES } = require('../config/constants');

/**
 * Global error handling middleware
 * This middleware catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${err.name}: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = {
      type: ERROR_TYPES.VALIDATION_ERROR,
      message,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = {
      type: ERROR_TYPES.VALIDATION_ERROR,
      message,
      statusCode: HTTP_STATUS.CONFLICT,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      type: ERROR_TYPES.VALIDATION_ERROR,
      message: messages.join(', '),
      statusCode: HTTP_STATUS.BAD_REQUEST,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      type: ERROR_TYPES.AUTHENTICATION_ERROR,
      message: 'Invalid token',
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      type: ERROR_TYPES.AUTHENTICATION_ERROR,
      message: 'Token expired',
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  // GitHub API errors
  if (err.name === 'HttpError' && err.status) {
    const statusCode = err.status === 404 ? HTTP_STATUS.NOT_FOUND : 
                      err.status === 403 ? HTTP_STATUS.FORBIDDEN :
                      err.status === 401 ? HTTP_STATUS.UNAUTHORIZED :
                      HTTP_STATUS.BAD_GATEWAY;
    
    error = {
      type: ERROR_TYPES.GITHUB_API_ERROR,
      message: err.message || 'GitHub API error',
      statusCode,
      details: {
        githubStatus: err.status,
        githubMessage: err.response?.data?.message,
        documentation_url: err.response?.data?.documentation_url,
      },
    };
  }

  // Rate limit errors
  if (err.status === 429 || err.message?.includes('rate limit')) {
    error = {
      type: ERROR_TYPES.RATE_LIMIT_ERROR,
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      details: {
        retryAfter: err.response?.headers?.['retry-after'] || 60,
      },
    };
  }

  // Custom application errors
  if (err.isOperational) {
    error = {
      type: err.type || ERROR_TYPES.INTERNAL_ERROR,
      message: err.message,
      statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details: err.details,
    };
  }

  // Default error
  if (!error.statusCode) {
    error = {
      type: ERROR_TYPES.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  // Send error response
  const response = {
    success: false,
    error: {
      type: error.type || ERROR_TYPES.INTERNAL_ERROR,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  error.type = ERROR_TYPES.NOT_FOUND_ERROR;
