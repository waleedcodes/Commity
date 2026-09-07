// [Commity Core Phase 1: Setup] syncWorker.js
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

      // Find all users who haven't been synchronized within the last 7 days
      const staleUsers = await User.find({
        isActive: true,
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

      // Sync top 256 developers for key regional directories (Pakistan, etc.) from committers.top
      try {
        const CommittersService = require('./committersService');
        await CommittersService.syncRegion('pakistan', 'Pakistan');
      } catch (committersErr) {
        logger.warn(`CommittersService weekly sync warning: ${committersErr.message}`);
      }

      // Run automated geographic discovery for active developers across key regions
      await this.runWeeklyCrawl();

    } catch (error) {
      logger.error('Error during SyncWorker weekly cycle:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Automatically discover and crawl new active developers from key regions using GitHub API
   */
  async runWeeklyCrawl() {
    const keyRegions = ['Pakistan', 'USA', 'Germany', 'France', 'Japan', 'United Kingdom', 'Canada', 'India', 'Singapore'];
    const GitHubService = require('./githubService');
    const githubService = new GitHubService();

    logger.info('🌐 SyncWorker running automated geographic GitHub API crawling...');
    for (const region of keyRegions) {
      try {
        const searchRes = await githubService.searchUsers(`location:"${region}"`, {
          sort: 'followers',
          order: 'desc',
          per_page: 10
        });

        if (searchRes && searchRes.users) {
          for (const u of searchRes.users.slice(0, 5)) {
            try {
              const existing = await User.findOne({ username: u.username.toLowerCase() });
              if (!existing || !this.userService.isRecentlyUpdated(existing)) {
                await this.userService.syncUserProfile(u.username, false);
                await Helpers.sleep(300);
              }
            } catch (err) {
              logger.warn(`Failed weekly sync for @${u.username}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        logger.warn(`Weekly crawl notice for ${region}: ${err.message}`);
      }
    }
  }
}

module.exports = new SyncWorker();
