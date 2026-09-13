const { asyncHandler } = require('../middleware/errorHandler');
const { ErrorFactory } = require('../middleware/errorHandler');
const User = require('../models/User');
const UserService = require('../services/userService');
const GitHubService = require('../services/githubService');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const CacheManager = require('../utils/cache');
const { CACHE_KEYS } = require('../config/constants');

class WrappedController {
  /**
   * @desc    Get GitHub Developer Wrapped & Social Card insights
   * @route   GET /api/users/:username/wrapped
   * @access  Public
   */
  static getDeveloperWrapped = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const cacheKey = `wrapped_${username.toLowerCase()}_${year}`;

    const wrappedData = await CacheManager.getOrSet(
      CACHE_KEYS.USER_PROFILE,
      cacheKey,
      async () => {
        // Find or sync user
        let user = await User.findByUsername(username);
        const userService = new UserService();

        if (!user || !userService.isRecentlyUpdated(user) || 
            (user && (!user.topLanguages || user.topLanguages.length === 0) && (!user.totalCommits || user.totalCommits === 0))) {
          try {
            const githubService = new GitHubService();
            const [githubProfile, contributions, languages] = await Promise.all([
              githubService.getUserProfile(username),
              githubService.getUserContributions(username).catch(err => {
                logger.warn(`Failed to fetch contributions for ${username} during wrapped: ${err.message}`);
                return null;
              }),
              githubService.getUserLanguages(username).catch(err => {
                logger.warn(`Failed to fetch languages for ${username} during wrapped: ${err.message}`);
                return null;
              }),
            ]);

            const completeUserData = {
              ...githubProfile,
              ...(contributions && {
                totalContributions: contributions.totalContributions || 0,
                totalCommits: contributions.totalCommits || 0,
                totalPullRequests: contributions.totalPullRequests || 0,
                totalIssues: contributions.totalIssues || 0,
                totalReviews: contributions.totalReviews || 0,
                contributionStreak: contributions.contributionStreak || 0,
                longestStreak: contributions.longestStreak || 0,
                contributionCalendar: contributions.contributionCalendar || [],
              }),
              ...(languages && { 
                topLanguages: languages.slice(0, 10).map(lang => ({
                  name: lang.name,
                  percentage: lang.percentage,
                  bytes: lang.bytes,
                  color: lang.color || '#f1c40f'
                }))
              }),
            };

            user = await userService.createOrUpdateUser(completeUserData);
          } catch (error) {
            if (!user) {
              if (error.statusCode === 404) {
                throw ErrorFactory.notFound(`User '${username}' not found on GitHub`);
              }
              throw error;
            }
          }
        }

        if (!user) {
          throw ErrorFactory.notFound(`User '${username}' not found`);
        }

        // Metrics breakdown
        const totalContributions = user.totalContributions || 
          ((user.publicContributions || 0) + (user.privateContributions || 0)) || 
          user.totalCommits || 0;
        
        const publicContributions = user.publicContributions ?? 
          (user.totalContributions ? Math.round(user.totalContributions * 0.7) : totalContributions);
