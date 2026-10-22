/**
 * Standalone weekly sync script for GitHub Actions / Cron
 * Can be executed via: node frontend/scripts/sync-weekly.js
 */

const connectDB = require('../server/config/database');
const syncWorker = require('../server/services/syncWorker');
const logger = require('../server/utils/logger');

async function run() {
  try {
    logger.info('🚀 Starting Commity Weekly Snapshot Synchronization...');
    await connectDB();

    logger.info('Running weekly ranking and profile sync...');
    await syncWorker.runWeeklySync();

    logger.info('🎉 Weekly synchronization finished successfully!');
    process.exit(0);
  } catch (err) {
    logger.error('Fatal error during sync script:', err.message || err);
    console.error(err);
    process.exit(1);
  }
}

run();
