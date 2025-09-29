const User = require('../models/User');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const { ErrorFactory } = require('../middleware/errorHandler');

class UserService {
  
  /**
   * Create or update user in database
   * @param {object} userData - User data from GitHub API
   * @returns {Promise<User>} User document
   */
  async createOrUpdateUser(userData) {
    try {
      const existingUser = await User.findOne({ 
        $or: [
          { githubId: userData.githubId },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        // Update existing user
        Object.assign(existingUser, userData);
        existingUser.lastFetchedAt = new Date();
        await existingUser.save();
        
        logger.info(`Updated user: ${userData.username}`);
        return existingUser;
      } else {
        // Create new user
        const newUser = new User({
          ...userData,
          lastFetchedAt: new Date(),
        });
        
        await newUser.save();
        logger.info(`Created new user: ${userData.username}`);
        return newUser;
      }
    } catch (error) {
      logger.error(`Error creating/updating user ${userData.username}:`, error.message);
      throw ErrorFactory.database(`Failed to save user data: ${error.message}`);
    }
  }

  /**
   * Bulk update multiple users
   * @param {string[]} usernames - Array of GitHub usernames
   * @param {object} options - Update options
   * @returns {Promise<object>} Update results
   */
  async bulkUpdateUsers(usernames, options = {}) {
    const { forceUpdate = false, includeRepos = true, includeEvents = true } = options;
    
    const results = {
      success: [],
      failed: [],
      skipped: [],
      total: usernames.length,
    };

    const GitHubService = require('./githubService');
    const githubService = new GitHubService();

    for (const username of usernames) {
      try {
        // Check if user needs update
        if (!forceUpdate) {
          const existingUser = await User.findByUsername(username);
          if (existingUser && this._isRecentlyUpdated(existingUser)) {
            results.skipped.push({
              username,
              reason: 'Recently updated',
              lastUpdate: existingUser.lastFetchedAt,
            });
            continue;
          }
        }

        // Fetch user data from GitHub
        const [profile, contributions, languages] = await Promise.all([
          githubService.getUserProfile(username),
          githubService.getUserContributions(username).catch(() => null),
          githubService.getUserLanguages(username).catch(() => null),
        ]);

        // Merge data
        const userData = {
          ...profile,
          ...(contributions && {
            totalCommits: contributions.totalCommits,
            totalPullRequests: contributions.totalPullRequests,
            totalIssues: contributions.totalIssues,
            totalReviews: contributions.totalReviews,
            contributionCalendar: contributions.contributionCalendar,
          }),
          ...(languages && { topLanguages: languages.slice(0, 10) }),
        };

        // Update user
        const user = await this.createOrUpdateUser(userData);
        await user.updateRank('totalCommits');

        results.success.push({
          username,
          userId: user._id,
          rank: user.globalRank,
        });

        // Add delay to respect rate limits
        await Helpers.sleep(100);

      } catch (error) {
        results.failed.push({
          username,
          error: error.message,
          statusCode: error.statusCode,
        });
        logger.warn(`Failed to update user ${username}: ${error.message}`);
      }
    }

    logger.info(`Bulk update completed: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    return results;
  }

  /**
   * Calculate user analytics for a specific period
   * @param {string} userId - User ID
   * @param {string} period - Analytics period
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Analytics>} Analytics document
   */
  async calculateUserAnalytics(userId, period, startDate, endDate) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound('User not found');
      }

      // Check if analytics already exist for this period
      const existingAnalytics = await Analytics.findOne({
        userId,
        period,
        startDate,
        endDate,
      });

      if (existingAnalytics && this._isRecentlyCalculated(existingAnalytics)) {
        return existingAnalytics;
      }

      // Calculate analytics
      const GitHubService = require('./githubService');
      const githubService = new GitHubService();

      const [events, repositories, languages] = await Promise.all([
        githubService.getUserEvents(user.username, { per_page: 100 }).catch(() => []),
        githubService.getUserRepositories(user.username, { type: 'owner' }).catch(() => []),
        githubService.getUserLanguages(user.username).catch(() => []),
      ]);

      // Filter events by date range
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.createdAt);
        return eventDate >= startDate && eventDate <= endDate;
      });

      // Calculate contribution metrics
      const contributions = this._calculateContributions(filteredEvents);
      const repositoryMetrics = this._calculateRepositoryMetrics(repositories, startDate, endDate);
      const activityPatterns = this._calculateActivityPatterns(filteredEvents);
      const collaborationMetrics = this._calculateCollaborationMetrics(filteredEvents, repositories);

      const analyticsData = {
        userId,
        githubUsername: user.username,
        period,
        startDate,
        endDate,
        contributions,
        repositories: repositoryMetrics,
        languages: languages.map(lang => ({
          name: lang.name,
          bytes: lang.bytes,
          percentage: lang.percentage,
          commits: 0, // Would need additional API calls to get this
        })),
        activityPatterns,
        collaboration: collaborationMetrics,
        performance: {
          averageCommitsPerDay: contributions.commits / this._getDaysBetween(startDate, endDate),
          averagePRsPerWeek: contributions.pullRequests / this._getWeeksBetween(startDate, endDate),
          averageIssuesPerMonth: contributions.issues / this._getMonthsBetween(startDate, endDate),
        },
        lastCalculatedAt: new Date(),
      };

      // Save or update analytics
      if (existingAnalytics) {
        Object.assign(existingAnalytics, analyticsData);
        await existingAnalytics.save();
        return existingAnalytics;
      } else {
        const analytics = new Analytics(analyticsData);
        await analytics.save();
        return analytics;
      }

    } catch (error) {
      logger.error(`Error calculating analytics for user ${userId}:`, error.message);
      throw ErrorFactory.internal(`Failed to calculate analytics: ${error.message}`);
    }
  }

  /**
   * Get user leaderboard position for different categories
   * @param {string} userId - User ID
   * @returns {Promise<object>} Leaderboard positions
   */
  async getUserLeaderboardPositions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound('User not found');
      }

      const categories = ['totalCommits', 'followers', 'publicRepos', 'totalContributions'];
      const positions = {};

      for (const category of categories) {
        const rank = await User.countDocuments({
          [category]: { $gt: user[category] },
          isActive: true,
        }) + 1;

        const total = await User.countDocuments({ isActive: true });
        const percentile = Math.round((1 - (rank - 1) / total) * 100);

        positions[category] = {
          rank,
          total,
          percentile,
          value: user[category],
        };
      }

      return positions;
    } catch (error) {
      logger.error(`Error getting leaderboard positions for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Update user's contribution streak
   * @param {string} userId - User ID
   * @returns {Promise<object>} Streak information
   */
  async updateContributionStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ErrorFactory.notFound('User not found');
      }

      const contributionCalendar = user.contributionCalendar || [];
      if (contributionCalendar.length === 0) {
        return { current: 0, longest: 0 };
      }

      // Sort calendar by date
      const sortedCalendar = contributionCalendar.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Calculate streaks
      for (let i = sortedCalendar.length - 1; i >= 0; i--) {
        const day = sortedCalendar[i];
        
        if (day.contributionCount > 0) {
          tempStreak++;
          if (i === sortedCalendar.length - 1) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 0;
          if (i === sortedCalendar.length - 1) {
            currentStreak = 0;
          }
        }
      }

      // Final check for longest streak
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      // Update user
      user.contributionStreak = currentStreak;
      user.longestStreak = longestStreak;
      await user.save();

      return {
        current: currentStreak,
        longest: longestStreak,
      };
    } catch (error) {
      logger.error(`Error updating contribution streak for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if user data was recently updated
   */
  isRecentlyUpdated(user) {
    const threshold = 10 * 60 * 1000; // 10 minutes
    return user.lastFetchedAt && (Date.now() - user.lastFetchedAt.getTime()) < threshold;
  }

  /**
   * Check if user data was recently updated (private method for backward compatibility)
   * @private
   */
  _isRecentlyUpdated(user) {
    return this.isRecentlyUpdated(user);
  }

  /**
   * Check if analytics were recently calculated
   * @private
   */
  _isRecentlyCalculated(analytics) {
    const threshold = 30 * 60 * 1000; // 30 minutes
    return analytics.lastCalculatedAt && (Date.now() - analytics.lastCalculatedAt.getTime()) < threshold;
  }

  /**
   * Calculate contributions from events
   * @private
   */
  _calculateContributions(events) {
    const contributions = {
      commits: 0,
      pullRequests: 0,
      issues: 0,
      reviews: 0,
      total: 0,
    };

    events.forEach(event => {
      switch (event.type) {
        case 'PushEvent':
          contributions.commits += event.payload?.commits || 1;
          break;
        case 'PullRequestEvent':
          if (event.payload?.action === 'opened') {
            contributions.pullRequests++;
          }
          break;
        case 'IssuesEvent':
          if (event.payload?.action === 'opened') {
            contributions.issues++;
          }
          break;
        case 'PullRequestReviewEvent':
          contributions.reviews++;
          break;
      }
    });

    contributions.total = contributions.commits + contributions.pullRequests + contributions.issues + contributions.reviews;
    return contributions;
  }

  /**
   * Calculate repository metrics
   * @private
   */
  _calculateRepositoryMetrics(repositories, startDate, endDate) {
    const metrics = {
      created: 0,
      forked: 0,
      starred: 0,
      totalStars: 0,
      totalForks: 0,
    };

    repositories.forEach(repo => {
      if (repo.createdAt >= startDate && repo.createdAt <= endDate) {
        if (repo.fork) {
          metrics.forked++;
        } else {
          metrics.created++;
        }
      }
      
      metrics.totalStars += repo.stargazersCount;
      metrics.totalForks += repo.forksCount;
    });

    return metrics;
  }

  /**
   * Calculate activity patterns
   * @private
   */
  _calculateActivityPatterns(events) {
    const patterns = {
      byHour: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 })),
      byDayOfWeek: Array(7).fill(0).map((_, i) => ({ day: i, count: 0 })),
      byMonth: Array(12).fill(0).map((_, i) => ({ month: i + 1, count: 0 })),
    };

    events.forEach(event => {
      const date = new Date(event.createdAt);
      
      patterns.byHour[date.getHours()].count++;
      patterns.byDayOfWeek[date.getDay()].count++;
      patterns.byMonth[date.getMonth()].count++;
    });

    return patterns;
  }

  /**
   * Calculate collaboration metrics
   * @private
   */
  _calculateCollaborationMetrics(events, repositories) {
    const uniqueRepos = new Set();
    const uniqueCollaborators = new Set();
    let organizationContributions = 0;
    let openSourceContributions = 0;

    events.forEach(event => {
      if (event.repo) {
        uniqueRepos.add(event.repo.name);
        
        // Check if it's an organization repo (contains a slash and isn't user's own repo)
        if (event.repo.name.includes('/') && !event.repo.name.startsWith(event.actor.login + '/')) {
          organizationContributions++;
        }
      }
    });

    repositories.forEach(repo => {
      if (!repo.private) {
        openSourceContributions++;
      }
    });

    return {
      uniqueRepositories: uniqueRepos.size,
      uniqueCollaborators: uniqueCollaborators.size,
      organizationContributions,
      openSourceContributions,
    };
  }

  /**
   * Helper methods for date calculations
   * @private
   */
  _getDaysBetween(startDate, endDate) {
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  }

  _getWeeksBetween(startDate, endDate) {
    return Math.ceil(this._getDaysBetween(startDate, endDate) / 7);
  }

  _getMonthsBetween(startDate, endDate) {
    return Math.ceil(this._getDaysBetween(startDate, endDate) / 30);
  }
}

module.exports = UserService;
