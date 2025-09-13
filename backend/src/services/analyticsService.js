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
      const githubData = await GitHubService.getUserActivity(username, date);
      
      // Create or update analytics record
      const analyticsData = {
        username: user.username,
        date: new Date(date.toDateString()), // Normalize to date only
        commits: githubData.commits || 0,
        pullRequests: githubData.pullRequests || 0,
        issues: githubData.issues || 0,
        reviews: githubData.reviews || 0,
        repositories: githubData.repositories || [],
        languages: githubData.languages || [],
        additions: githubData.additions || 0,
        deletions: githubData.deletions || 0,
      };

      const analytics = await Analytics.findOneAndUpdate(
        { username: user.username, date: analyticsData.date },
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
      const analytics = await Analytics.find({ username: user.username });
      
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
          currentStreak: streakInfo.current,
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
          ]);

          // Previous period for comparison
          const previousStart = new Date(dateRange.start);
          const previousEnd = new Date(dateRange.end);
          const periodDays = Math.floor((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
          
          previousStart.setDate(previousStart.getDate() - periodDays);
          previousEnd.setDate(previousEnd.getDate() - periodDays);

          const previousData = await Analytics.aggregate([
            {
              $match: {
                date: { $gte: previousStart, $lte: previousEnd }
              }
            },
            {
              $group: {
                _id: '$username',
                totalMetric: { $sum: `$${metric}` }
              }
            }
          ]);

          // Create lookup map for previous data
          const previousMap = new Map();
          previousData.forEach(item => {
            previousMap.set(item._id, item.totalMetric);
          });

          // Calculate trends
          const trendingUsers = currentData.map(current => {
            const previous = previousMap.get(current._id) || 0;
            const growth = previous > 0 ? ((current.totalMetric - previous) / previous) * 100 : 0;
            
            return {
              username: current._id,
              current: current.totalMetric,
              previous,
              growth: Math.round(growth),
              avgDaily: Math.round(current.avgDaily * 100) / 100,
              trend: growth > 10 ? 'rising' : growth < -10 ? 'falling' : 'stable'
            };
          });

          return {
            metric,
            period,
            users: trendingUsers,
            summary: {
              totalUsers: currentData.length,
              avgGrowth: Math.round(trendingUsers.reduce((sum, user) => sum + user.growth, 0) / trendingUsers.length),
              risingCount: trendingUsers.filter(u => u.trend === 'rising').length,
              fallingCount: trendingUsers.filter(u => u.trend === 'falling').length,
            }
          };
        },
        20 * 60 // 20 minutes cache
      );
    } catch (error) {
      logger.error(`Error calculating trending for ${metric}:`, error);
      throw error;
    }
  }

  /**
   * Get leaderboard data
   * @param {string} category - Category (commits, followers, etc.)
   * @param {Object} filters - Filter options
   * @param {number} limit - Number of results
   * @returns {Array} Leaderboard data
   */
  static async getLeaderboard(category = 'commits', filters = {}, limit = 100) {
    try {
      const cacheKey = CacheManager.generateKey('leaderboard', category, JSON.stringify(filters), limit);
      
      return await CacheManager.getOrSet(
        CACHE_KEYS.LEADERBOARD,
        cacheKey,
        async () => {
          let sortField;
          switch (category) {
            case 'commits':
              sortField = 'totalCommits';
              break;
            case 'pullRequests':
              sortField = 'totalPullRequests';
              break;
            case 'issues':
              sortField = 'totalIssues';
              break;
            case 'followers':
              sortField = 'followers';
              break;
            case 'repositories':
              sortField = 'publicRepos';
              break;
            default:
              sortField = 'totalCommits';
          }

          const query = { isActive: true };
          
          // Apply filters
          if (filters.location) {
            query.location = { $regex: filters.location, $options: 'i' };
          }
          
          if (filters.language) {
            query['topLanguages.name'] = { $regex: filters.language, $options: 'i' };
          }

          if (filters.minValue) {
            query[sortField] = { $gte: parseInt(filters.minValue) };
          }

          const users = await User.find(query)
            .sort({ [sortField]: -1, createdAt: 1 })
            .limit(parseInt(limit))
            .select('username name avatarUrl location topLanguages totalCommits totalPullRequests totalIssues followers publicRepos')
            .lean();

          return users.map((user, index) => ({
            rank: index + 1,
            ...user,
            categoryValue: user[sortField] || 0,
            score: this._calculateUserScore(user),
          }));
        },
        15 * 60 // 15 minutes cache
      );
    } catch (error) {
      logger.error(`Error getting leaderboard for ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get platform statistics
   * @param {string} period - Time period
   * @returns {Object} Platform statistics
   */
  static async getPlatformStats(period = '30d') {
    try {
      const cacheKey = CacheManager.generateKey('platform_stats', period);
      
      return await CacheManager.getOrSet(
        CACHE_KEYS.ANALYTICS,
        cacheKey,
        async () => {
          const dateRange = Helpers.getDateRange(period);
          
          const [
            totalUsers,
            activeUsers,
            totalContributions,
            languageDistribution,
            locationDistribution
          ] = await Promise.all([
            User.countDocuments({ isActive: true }),
            
            User.countDocuments({
              isActive: true,
              lastAnalyticsUpdate: { $gte: dateRange.start }
            }),
            
            Analytics.aggregate([
              {
                $match: {
                  date: { $gte: dateRange.start, $lte: dateRange.end }
                }
              },
              {
                $group: {
                  _id: null,
                  totalCommits: { $sum: '$commits' },
                  totalPullRequests: { $sum: '$pullRequests' },
                  totalIssues: { $sum: '$issues' },
                  totalReviews: { $sum: '$reviews' }
                }
              }
            ]),
            
            User.aggregate([
              { $match: { isActive: true } },
              { $unwind: '$topLanguages' },
              {
                $group: {
                  _id: '$topLanguages.name',
                  userCount: { $sum: 1 },
                  avgPercentage: { $avg: '$topLanguages.percentage' }
                }
              },
              { $sort: { userCount: -1 } },
              { $limit: 20 }
            ]),
            
            User.aggregate([
              { 
                $match: { 
                  isActive: true,
                  location: { $exists: true, $ne: null, $ne: '' }
                }
              },
              {
                $group: {
                  _id: '$location',
                  userCount: { $sum: 1 },
                  avgCommits: { $avg: '$totalCommits' }
                }
              },
              { $sort: { userCount: -1 } },
              { $limit: 15 }
            ])
          ]);

          const contributionData = totalContributions[0] || {};
          
          return {
            period: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
              duration: period
            },
            users: {
              total: totalUsers,
              active: activeUsers,
              newUsers: 0 // Would need additional query for user creation dates
            },
            contributions: {
              commits: contributionData.totalCommits || 0,
              pullRequests: contributionData.totalPullRequests || 0,
              issues: contributionData.totalIssues || 0,
              reviews: contributionData.totalReviews || 0,
              total: (contributionData.totalCommits || 0) + 
                     (contributionData.totalPullRequests || 0) + 
                     (contributionData.totalIssues || 0) + 
                     (contributionData.totalReviews || 0)
            },
            distributions: {
              languages: languageDistribution.map(lang => ({
                name: lang._id,
                userCount: lang.userCount,
                averageUsage: Math.round(lang.avgPercentage)
              })),
              locations: locationDistribution.map(loc => ({
                name: loc._id,
                userCount: loc.userCount,
                averageCommits: Math.round(loc.avgCommits)
              }))
            }
          };
        },
        30 * 60 // 30 minutes cache
      );
    } catch (error) {
      logger.error(`Error getting platform stats:`, error);
      throw error;
    }
  }

  /**
   * Calculate user ranking
   * @param {string} username - GitHub username
   * @param {string} category - Ranking category
   * @returns {Object} Ranking information
   */
  static async getUserRanking(username, category = 'commits') {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error(`User ${username} not found`);
      }

      let field;
      switch (category) {
        case 'commits':
          field = 'totalCommits';
          break;
        case 'followers':
          field = 'followers';
          break;
        case 'repositories':
          field = 'publicRepos';
          break;
        case 'contributions':
          field = 'totalContributions';
          break;
        default:
          field = 'totalCommits';
      }

      const [rank, totalUsers] = await Promise.all([
        User.countDocuments({
          [field]: { $gt: user[field] },
          isActive: true
        }),
        User.countDocuments({ isActive: true })
      ]);

      const actualRank = rank + 1;
      const percentile = Math.round((1 - (rank / totalUsers)) * 100);

      return {
        username: user.username,
        category,
        rank: actualRank,
        totalUsers,
        percentile,
        value: user[field] || 0,
        isTopPercent: percentile >= 90,
        isTop100: actualRank <= 100,
        isTop10: actualRank <= 10
      };
    } catch (error) {
      logger.error(`Error getting user ranking for ${username}:`, error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Calculate streak information from analytics data
   * @private
   */
  static _calculateStreak(analytics) {
    if (!analytics || analytics.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Sort analytics by date
    const sortedAnalytics = analytics
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter(record => record.commits > 0); // Only count days with commits

    if (sortedAnalytics.length === 0) {
      return { current: 0, longest: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date();
    const lastRecordDate = new Date(sortedAnalytics[sortedAnalytics.length - 1].date);
    
    // Check if the streak continues to today (within 1 day)
    const daysDifference = Math.floor((today - lastRecordDate) / (1000 * 60 * 60 * 24));
    if (daysDifference <= 1) {
      currentStreak = 1;
    }

    // Calculate streaks
    for (let i = sortedAnalytics.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedAnalytics[i + 1].date);
      const previousDate = new Date(sortedAnalytics[i].date);
      const daysBetween = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        tempStreak++;
        if (i === sortedAnalytics.length - 2 && daysDifference <= 1) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      current: currentStreak,
      longest: longestStreak
    };
  }

  /**
   * Calculate user score for leaderboard
   * @private
   */
  static _calculateUserScore(user) {
    const weights = {
      commits: 1,
      pullRequests: 3,
      issues: 2,
      followers: 0.1,
      repositories: 0.5
    };

    return Math.round(
      (user.totalCommits || 0) * weights.commits +
      (user.totalPullRequests || 0) * weights.pullRequests +
      (user.totalIssues || 0) * weights.issues +
      (user.followers || 0) * weights.followers +
      (user.publicRepos || 0) * weights.repositories
    );
  }
}

module.exports = AnalyticsService;
