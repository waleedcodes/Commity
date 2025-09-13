const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define which log level to show based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.uncolorize(),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: logFormat,
  }),
];

// Add file transports only in production
if (process.env.NODE_ENV === 'production') {
  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports,
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Create HTTP request logger middleware
logger.http = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// Helper methods for structured logging
logger.logAPICall = (method, url, statusCode, duration, error = null) => {
  const logData = {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  };
  
  if (error) {
    logData.error = error.message;
    logger.error(`API Call Failed: ${JSON.stringify(logData)}`);
  } else {
    logger.info(`API Call: ${JSON.stringify(logData)}`);
  }
};

logger.logGitHubAPI = (endpoint, rateLimit, error = null) => {
  const logData = {
    endpoint,
    rateLimit: {
      remaining: rateLimit?.remaining || 0,
      limit: rateLimit?.limit || 0,
      resetTime: rateLimit?.reset ? new Date(rateLimit.reset * 1000).toISOString() : null,
    },
    timestamp: new Date().toISOString(),
  };
  
  if (error) {
    logData.error = error.message;
    logger.error(`GitHub API Error: ${JSON.stringify(logData)}`);
  } else {
    logger.info(`GitHub API Call: ${JSON.stringify(logData)}`);
  }
};

logger.logDatabaseOperation = (operation, collection, duration, error = null) => {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  };
  
  if (error) {
    logData.error = error.message;
    logger.error(`Database Error: ${JSON.stringify(logData)}`);
  } else {
    logger.debug(`Database Operation: ${JSON.stringify(logData)}`);
  }
};

logger.logUserActivity = (userId, action, metadata = {}) => {
  const logData = {
    userId,
    action,
    metadata,
    timestamp: new Date().toISOString(),
  };
  
  logger.info(`User Activity: ${JSON.stringify(logData)}`);
};

// Export the logger
module.exports = logger;
