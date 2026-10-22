const User = require('../models/User');
const Analytics = require('../models/Analytics');
const GitHubService = require('./githubService');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const CacheManager = require('../utils/cache');
const { CACHE_KEYS } = require('../config/constants');

class AnalyticsService {

  /**
   * Calculate and store analytics for a user
   * @param {string} username - GitHub username
   * @param {Date} date - Date for analytics record
   * @returns {Object} Analytics data
   */
  static async calculateUserAnalytics(username, date = new Date()) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Get user's GitHub activity for the date
      const githubService = new GitHubService();
      let events = [];
      try {
        events = await githubService.getUserEvents(username, { per_page: 100 });
      } catch (e) {
        logger.warn(`Could not fetch events for ${username}: ${e.message}`);
      }

      const targetDateStr = date.toISOString().split('T')[0];
      const dayEvents = (events || []).filter(e => {
        const dStr = e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : '';
        return dStr === targetDateStr;
      });

      let commits = 0;
      let pullRequests = 0;
      let issues = 0;
      let reviews = 0;

      dayEvents.forEach(e => {
        if (e.type === 'PushEvent') commits += (e.payload?.commits || 1);
        else if (e.type === 'PullRequestEvent') pullRequests += 1;
        else if (e.type === 'IssuesEvent') issues += 1;
        else if (e.type === 'PullRequestReviewEvent') reviews += 1;
      });
      
      // Create or update analytics record
      const analyticsData = {
        userId: user._id,
        githubUsername: user.username,
        username: user.username,
        date: new Date(date.toDateString()),
        startDate: new Date(date.toDateString()),
        endDate: new Date(date.toDateString()),
        period: 'daily',
        commits,
        pullRequests,
        issues,
        reviews,
        repositories: [],
        languages: [],
        additions: 0,
        deletions: 0,
        contributions: {
          commits: commits || 0,
          pullRequests: pullRequests || 0,
          issues: issues || 0,
          reviews: reviews || 0,
          total: (commits || 0) + (pullRequests || 0) + (issues || 0) + (reviews || 0),
        },
      };

      const analytics = await Analytics.findOneAndUpdate(
        { 
          $or: [{ username: user.username }, { githubUsername: user.username }],
          date: analyticsData.date 
        },
        analyticsData,
        { upsert: true, new: true }
      );

      logger.info(`Analytics calculated for user: ${username}, date: ${date.toDateString()}`);
      return analytics;
    } catch (error) {
      logger.error(`Error calculating analytics for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Update user's aggregate statistics
   * @param {string} username - GitHub username
   * @returns {Object} Updated user data
   */
  static async updateUserStatistics(username) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      // Get all analytics records for the user
      const analytics = await Analytics.find({
        $or: [{ username: user.username }, { githubUsername: user.username }]
      });
      
      // Calculate aggregated statistics
      const totalStats = analytics.reduce((acc, record) => ({
        commits: acc.commits + (record.commits || 0),
        pullRequests: acc.pullRequests + (record.pullRequests || 0),
        issues: acc.issues + (record.issues || 0),
        reviews: acc.reviews + (record.reviews || 0),
        additions: acc.additions + (record.additions || 0),
        deletions: acc.deletions + (record.deletions || 0),
      }), { commits: 0, pullRequests: 0, issues: 0, reviews: 0, additions: 0, deletions: 0 });

      // Calculate streak information
      const streakInfo = this._calculateStreak(analytics);

      // Update user with calculated statistics
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          totalCommits: totalStats.commits,
          totalPullRequests: totalStats.pullRequests,
          totalIssues: totalStats.issues,
          totalReviews: totalStats.reviews,
          totalContributions: totalStats.commits + totalStats.pullRequests + totalStats.issues + totalStats.reviews,
          contributionStreak: streakInfo.current,
          longestStreak: streakInfo.longest,
          lastAnalyticsUpdate: new Date(),
        },
        { new: true }
      );

      logger.info(`User statistics updated for: ${username}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user statistics for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics data for date range
   * @param {string} username - GitHub username
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Analytics records
   */
  static async getAnalyticsRange(username, startDate, endDate) {
    try {
      const analytics = await Analytics.find({
        username,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      return analytics;
    } catch (error) {
      logger.error(`Error getting analytics range for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Calculate trending metrics
   * @param {string} metric - Metric name (commits, pullRequests, etc.)
   * @param {string} period - Time period (7d, 30d, 90d)
   * @returns {Object} Trending data
   */
  static async calculateTrending(metric = 'commits', period = '30d') {
    try {
      const cacheKey = CacheManager.generateKey('trending', metric, period);
      
      return await CacheManager.getOrSet(
        CACHE_KEYS.ANALYTICS,
        cacheKey,
        async () => {
          const dateRange = Helpers.getDateRange(period);
          
          // Current period data
          const currentData = await Analytics.aggregate([
            {
              $match: {
                date: { $gte: dateRange.start, $lte: dateRange.end }
              }
            },
            {
              $group: {
                _id: '$username',
                totalMetric: { $sum: `$${metric}` },
                avgDaily: { $avg: `$${metric}` },
                records: { $sum: 1 }
              }
            },
            { $sort: { totalMetric: -1 } },
            { $limit: 100 }
