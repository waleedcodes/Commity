// [Commity Core Phase 1: Setup] index.js
// Load environment variables first
require('dotenv').config();
console.log('✅ Environment variables loaded');

const express = require('express');
console.log('✅ Express loaded');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
console.log('✅ Middleware packages loaded');

// Import configurations
const connectDB = require('./config/database');
console.log('✅ Database config loaded');
const logger = require('./utils/logger');
console.log('✅ Logger loaded');

// Import routes
const userRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // 10,000 requests in dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

const mongoose = require('mongoose');

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Handle 404 routes
app.use('*', notFound);

// Global error handling middleware
app.use(errorHandler);

let server = null;

// Graceful shutdown helper
const shutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server and database connections`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
      }
      process.exit(0);
    });
  } else {
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.close = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
};

// Start server when run directly
if (require.main === module) {
  connectDB()
    .then(() => {
      server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📊 GitHub Analytics Tool API ready`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        // Start background snapshot sync worker (7-day cadence)
        const syncWorker = require('./services/syncWorker');
        syncWorker.start();
      });
    })
    .catch((err) => {
      logger.error('Failed to connect to database on startup:', err);
      process.exit(1);
    });
} else {
  // Imported by tests: connect without crashing
  connectDB().catch((err) => {
    logger.warn('Database connection warning in test environment:', err.message);
  });
}

module.exports = app;
