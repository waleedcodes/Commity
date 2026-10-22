/**
 * Standalone weekly sync script for GitHub Actions / Cron
 * Can be executed via: node frontend/scripts/sync-weekly.js
 */

const connectDB = require('../server/config/database');
const syncWorker = require('../server/services/syncWorker');
const logger = require('../server/utils/logger');

