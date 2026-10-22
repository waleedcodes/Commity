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
