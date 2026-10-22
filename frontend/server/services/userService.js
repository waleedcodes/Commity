const User = require('../models/User');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const CommittersService = require('./committersService');
const { ErrorFactory } = require('../middleware/errorHandler');

class UserService {
  
  /**
   * Create or update user in database
   * @param {object} userData - User data from GitHub API
   * @returns {Promise<User>} User document
   */
  async createOrUpdateUser(userData) {
    try {
      // Auto-enrich with authoritative committers.top ranks if location is detected
      if (userData.username && userData.location && !userData.countryRankAll) {
        try {
          const countryName = Helpers.normalizeCountry(userData.location);
          if (countryName) {
            const official = await CommittersService.getUserRanks(userData.username, countryName);
            if (official && official.isRanked) {
              userData.countryRankAll = official.countryRankAll;
              userData.countryRankPublic = official.countryRankPublic;
              userData.countryRankCommits = official.countryRankCommits;
              userData.countryRank = official.countryRank;
            }
          }
        } catch (e) {
          // ignore rank lookup error and proceed
        }
      }

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

        // Fetch user profile first to verify account type
        const profile = await githubService.getUserProfile(username);
        const isOrg = profile.type === 'Organization' || profile.accountType === 'Organization';

        // Only query user contributions if not an organization
        const [contributions, languages] = await Promise.all([
          isOrg ? Promise.resolve(null) : githubService.getUserContributions(username).catch(() => null),
          githubService.getUserLanguages(username).catch(() => null),
        ]);

        // Merge data
        const userData = {
          ...profile,
          accountType: isOrg ? 'Organization' : 'User',
          ...(contributions && {
            totalContributions: contributions.totalContributions || 0,
            publicContributions: contributions.publicContributions || contributions.totalContributions || 0,
            privateContributions: contributions.privateContributions || 0,
            totalCommits: contributions.totalCommits || 0,
            totalPullRequests: contributions.totalPullRequests || 0,
            totalIssues: contributions.totalIssues || 0,
            totalReviews: contributions.totalReviews || 0,
            contributionStreak: contributions.contributionStreak || 0,
            longestStreak: contributions.longestStreak || 0,
            contributionCalendar: contributions.contributionCalendar || [],
          }),
          ...(languages && { topLanguages: languages.slice(0, 10) }),
        };

        // Update user
        const user = await this.createOrUpdateUser(userData);
        await user.updateRank('totalContributions');

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
