/**
 * Serverless-friendly Logger for Next.js and Vercel
 * Uses console outputs with timestamps and status indicators
 */

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  info: (message, meta) => {
    console.log(`ℹ️ ${formatMessage('INFO', message, meta)}`);
  },
  warn: (message, meta) => {
    console.warn(`⚠️ ${formatMessage('WARN', message, meta)}`);
  },
  error: (message, meta) => {
    console.error(`❌ ${formatMessage('ERROR', message, meta)}`);
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🐛 ${formatMessage('DEBUG', message, meta)}`);
    }
  },
  http: (message, meta) => {
    console.log(`🌐 ${formatMessage('HTTP', message, meta)}`);
  },

  // Helper methods for structured logging
  logAPICall: (method, url, statusCode, duration, error = null) => {
    const logData = { method, url, statusCode, duration: `${duration}ms` };
    if (error) {
      logData.error = error.message;
      logger.error(`API Call Failed: ${JSON.stringify(logData)}`);
    } else {
      logger.info(`API Call: ${JSON.stringify(logData)}`);
    }
  },

  logGitHubAPI: (endpoint, rateLimit, error = null) => {
    const logData = {
      endpoint,
      rateLimit: {
        remaining: rateLimit?.remaining || 0,
        limit: rateLimit?.limit || 0,
        resetTime: rateLimit?.reset ? new Date(rateLimit.reset * 1000).toISOString() : null,
      },
    };
