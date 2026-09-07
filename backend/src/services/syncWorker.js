// [Commity Core Phase 2: Logic] syncWorker.js
const cron = require('node-cron');
const User = require('../models/User');
const UserService = require('./userService');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

class SyncWorker {
  constructor() {
    this.userService = new UserService();
    this.cronTask = null;
    this.isRunning = false;
    this.syncIntervalDays = parseInt(process.env.USER_SYNC_INTERVAL_DAYS, 10) || 7;
  }

  /**
   * Start the background cron schedule
   * Defaults to running every day at 03:00 AM to refresh any profiles older than 7 days
   */
  start(cronExpression = '0 3 * * *') {
    if (this.cronTask) {
      logger.warn('SyncWorker cron task is already scheduled');
      return;
    }

    logger.info(`⏰ Initializing SyncWorker background scheduler [Cadence: ${this.syncIntervalDays}-day weekly snapshot, Cron: ${cronExpression}]`);

    this.cronTask = cron.schedule(cronExpression, async () => {
      logger.info('🔄 Scheduled weekly snapshot sync triggered by cron');
      await this.runWeeklySync();
    });
  }

  /**
   * Stop the background cron schedule
   */
  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      logger.info('SyncWorker cron task stopped');
    }
  }

  /**
   * Run weekly snapshot sync for all stale profiles
   */
  async runWeeklySync() {
    if (this.isRunning) {
      logger.warn('SyncWorker is already executing a synchronization cycle, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const staleThreshold = new Date(Date.now() - (this.syncIntervalDays * 24 * 60 * 60 * 1000));

      // Find all users who haven't been synchronized within the last 7 days (excluding Organizations)
      const staleUsers = await User.find({
        isActive: true,
        accountType: { $ne: 'Organization' },
        $or: [
          { lastFetchedAt: { $lt: staleThreshold } },
          { lastFetchedAt: null },
          { totalContributions: 0 }
        ]
      }).select('username lastFetchedAt').limit(50);

      logger.info(`🔍 SyncWorker found ${staleUsers.length} profiles eligible for weekly snapshot sync`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const user of staleUsers) {
        try {
          logger.info(`Refreshing weekly snapshot for @${user.username}...`);
          await this.userService.syncUserProfile(user.username, true);
          updatedCount++;
          // Rate-limit pause to ensure GitHub API limits (5,000/hr) are never exceeded
          await Helpers.sleep(300);
        } catch (err) {
          errorCount++;
          logger.warn(`Failed to sync @${user.username}: ${err.message}`);
        }
      }

      const durationSec = Math.round((Date.now() - startTime) / 1000);
      logger.info(`✅ SyncWorker cycle finished in ${durationSec}s: ${updatedCount} updated, ${errorCount} errors`);

      // Generate authentic regional snapshot for Pakistan using direct GitHub GraphQL
      try {
        const GitHubRankingService = require('./githubRankingService');
        await GitHubRankingService.generateRegionalRanking('Pakistan', { candidateLimit: 30, topQuota: 256 });
      } catch (rankingErr) {
        logger.warn(`Regional ranking generation warning: ${rankingErr.message}`);
      }

