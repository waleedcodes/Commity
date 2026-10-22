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
   * Defaults to running every Monday at 02:00 AM UTC (matching committers.top weekly snapshot release)
   */
  start(cronExpression = process.env.UPDATE_SCHEDULE || '0 2 * * 1') {
    if (this.cronTask) {
      logger.warn('SyncWorker cron task is already scheduled');
      return;
    }

    logger.info(`⏰ Initializing SyncWorker background scheduler [Cadence: ${this.syncIntervalDays}-day weekly snapshot, Cron: ${cronExpression}]`);

    this.cronTask = cron.schedule(cronExpression, async () => {
      logger.info('🔄 Scheduled Monday weekly snapshot sync triggered by cron');
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
