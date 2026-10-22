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
