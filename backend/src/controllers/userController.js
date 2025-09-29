const { asyncHandler } = require('../middleware/errorHandler');
const { ErrorFactory } = require('../middleware/errorHandler');
const GitHubService = require('../services/githubService');
const UserService = require('../services/userService');
const User = require('../models/User');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

class UserController {
  
  /**
   * @desc    Get all users with pagination and filtering
   * @route   GET /api/users
   * @access  Public
   */
  static getAllUsers = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sort = 'totalCommits',
      order = 'desc',
      search,
      location,
      language,
      minCommits,
      maxCommits,
      minFollowers,
      maxFollowers,
      isVerified,
      isActive = true,
    } = req.query;

    // Build query
    const query = { isActive };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (language) {
      query['topLanguages.name'] = { $regex: language, $options: 'i' };
    }
    
    if (minCommits !== undefined || maxCommits !== undefined) {
      query.totalCommits = {};
      if (minCommits !== undefined) query.totalCommits.$gte = parseInt(minCommits);
      if (maxCommits !== undefined) query.totalCommits.$lte = parseInt(maxCommits);
    }
    
    if (minFollowers !== undefined || maxFollowers !== undefined) {
      query.followers = {};
      if (minFollowers !== undefined) query.followers.$gte = parseInt(minFollowers);
      if (maxFollowers !== undefined) query.followers.$lte = parseInt(maxFollowers);
    }
    
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort]: order === 'desc' ? -1 : 1 },
      select: '-contributionCalendar -recentRepos -__v',
    };

    const users = await User.paginate(query, options);
    
    // Transform response
    const response = {
      success: true,
      data: users.docs.map(user => user.toPublicJSON()),
      pagination: Helpers.generatePaginationMeta(
        users.page,
        users.limit,
        users.totalDocs
      ),
      filters: {
        totalResults: users.totalDocs,
        appliedFilters: { search, location, language, minCommits, maxCommits },
      },
      timestamp: new Date().toISOString(),
    };

    logger.logUserActivity(req.user?.id, 'list_users', { 
      query: req.query,
      resultCount: users.docs.length 
    });

    res.json(response);
  });

  /**
   * @desc    Get user profile by username
   * @route   GET /api/users/:username
   * @access  Public
   */
  static getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { includeRepos = 'false', includeActivity = 'false' } = req.query;

    // Find user in database
    let user = await User.findByUsername(username);
    
    // Check if user data is stale and needs refreshing
    const userService = new UserService();
    const shouldRefresh = !user || !userService.isRecentlyUpdated(user) || 
                         (user && (!user.topLanguages || user.topLanguages.length === 0) && 
                          (!user.totalCommits || user.totalCommits === 0));
    
    if (!user) {
      // If user not found, try to fetch from GitHub with complete data
      try {
        const githubService = new GitHubService();
        
        // Fetch complete user data including contributions and languages
        const [githubProfile, contributions, languages] = await Promise.all([
          githubService.getUserProfile(username),
          githubService.getUserContributions(username).catch(err => {
            logger.warn(`Failed to fetch contributions for ${username}: ${err.message}`);
            return null;
          }),
          githubService.getUserLanguages(username).catch(err => {
            logger.warn(`Failed to fetch languages for ${username}: ${err.message}`);
            return null;
          }),
        ]);

        // Merge all data
        const completeUserData = {
          ...githubProfile,
          ...(contributions && {
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
        
        logger.info(`Created new user profile with complete data for: ${username}`);
      } catch (error) {
        if (error.statusCode === 404) {
          throw ErrorFactory.notFound(`User '${username}' not found on GitHub`);
        }
        throw error;
      }
    } else if (shouldRefresh) {
      // Refresh existing user data in background if stale or incomplete
      try {
        const githubService = new GitHubService();
        
        // Fetch latest data
        const [contributions, languages] = await Promise.all([
          githubService.getUserContributions(username).catch(err => {
            logger.warn(`Failed to refresh contributions for ${username}: ${err.message}`);
            return null;
          }),
          githubService.getUserLanguages(username).catch(err => {
            logger.warn(`Failed to refresh languages for ${username}: ${err.message}`);
            return null;
          }),
        ]);

        // Update user with fresh data
        if (contributions) {
          user.totalCommits = contributions.totalCommits || user.totalCommits || 0;
          user.totalPullRequests = contributions.totalPullRequests || user.totalPullRequests || 0;
          user.totalIssues = contributions.totalIssues || user.totalIssues || 0;
          user.totalReviews = contributions.totalReviews || user.totalReviews || 0;
          user.contributionStreak = contributions.contributionStreak || user.contributionStreak || 0;
          user.longestStreak = contributions.longestStreak || user.longestStreak || 0;
          user.contributionCalendar = contributions.contributionCalendar || user.contributionCalendar || [];
        }

        if (languages && languages.length > 0) {
          user.topLanguages = languages.slice(0, 10).map(lang => ({
            name: lang.name,
            percentage: lang.percentage,
            bytes: lang.bytes,
            color: lang.color || '#f1c40f'
          }));
        }

        user.lastFetchedAt = new Date();
        await user.save();
        
        logger.info(`Refreshed stale user data for: ${username}`);
      } catch (error) {
        logger.warn(`Failed to refresh user data for ${username}: ${error.message}`);
        // Continue with existing data if refresh fails
      }
    }

    // Prepare response data
    const responseData = {
      profile: user.toPublicJSON(),
    };

    // Include repositories if requested
    if (includeRepos === 'true') {
      const githubService = new GitHubService();
      try {
        responseData.repositories = await githubService.getUserRepositories(username, {
          type: 'owner',
          sort: 'updated',
          per_page: 10,
        });
      } catch (error) {
        logger.warn(`Failed to fetch repositories for ${username}: ${error.message}`);
        responseData.repositories = [];
      }
    }

    // Include recent activity if requested
    if (includeActivity === 'true') {
      const githubService = new GitHubService();
      try {
        responseData.recentActivity = await githubService.getUserEvents(username, {
          per_page: 20,
        });
      } catch (error) {
        logger.warn(`Failed to fetch activity for ${username}: ${error.message}`);
        responseData.recentActivity = [];
      }
    }

    logger.logUserActivity(req.user?.id, 'view_profile', { 
      viewedUser: username,
      includeRepos,
      includeActivity 
    });

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Update user profile
   * @route   PUT /api/users/:username
   * @access  Private (User or Admin)
   */
  static updateUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const updates = req.body;

    // Check if user exists
    const user = await User.findByUsername(username);
    if (!user) {
      throw ErrorFactory.notFound(`User '${username}' not found`);
    }

    // Check permissions
    if (req.user.username !== username && req.user.role !== 'admin') {
      throw ErrorFactory.forbidden('You can only update your own profile');
    }

    // Update user profile
    Object.assign(user, updates);
    await user.save();

    logger.logUserActivity(req.user.id, 'update_profile', { 
      updatedUser: username,
      updates: Object.keys(updates) 
    });

    res.json({
      success: true,
      data: user.toPublicJSON(),
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get user repositories
   * @route   GET /api/users/:username/repositories
   * @access  Public
   */
  static getUserRepositories = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { 
      type = 'owner', 
      sort = 'updated', 
      direction = 'desc',
      per_page = 30,
      page = 1 
    } = req.query;

    const githubService = new GitHubService();
    
    try {
      const repositories = await githubService.getUserRepositories(username, {
        type,
        sort,
        direction,
        per_page: parseInt(per_page),
        page: parseInt(page),
      });

      // Add additional computed fields
      const enrichedRepos = repositories.map(repo => ({
        ...repo,
        contributionScore: Helpers.calculateContributionScore({
          commits: 1, // Placeholder - would need to fetch actual commit count
          stars: repo.stargazersCount,
          forks: repo.forksCount,
        }),
        isPopular: repo.stargazersCount > 10,
        isActive: repo.pushedAt && new Date(repo.pushedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      }));

      res.json({
        success: true,
        data: {
          repositories: enrichedRepos,
          totalCount: enrichedRepos.length,
          filters: { type, sort, direction },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      if (error.statusCode === 404) {
        throw ErrorFactory.notFound(`User '${username}' not found on GitHub`);
      }
      throw error;
    }
  });

  /**
   * @desc    Get user activity/events
   * @route   GET /api/users/:username/activity
   * @access  Public
   */
  static getUserActivity = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { per_page = 30, page = 1 } = req.query;

    const githubService = new GitHubService();
    
    try {
      const events = await githubService.getUserEvents(username, {
        per_page: parseInt(per_page),
        page: parseInt(page),
      });

      // Process and categorize events
      const categorizedEvents = {
        commits: events.filter(e => e.type === 'PushEvent'),
        pullRequests: events.filter(e => e.type === 'PullRequestEvent'),
        issues: events.filter(e => e.type === 'IssuesEvent'),
        releases: events.filter(e => e.type === 'ReleaseEvent'),
        other: events.filter(e => !['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'ReleaseEvent'].includes(e.type)),
      };

      const summary = {
        totalEvents: events.length,
        commitEvents: categorizedEvents.commits.length,
        prEvents: categorizedEvents.pullRequests.length,
        issueEvents: categorizedEvents.issues.length,
        releaseEvents: categorizedEvents.releases.length,
        otherEvents: categorizedEvents.other.length,
        mostActiveDay: null, // Could be computed from events
        averageEventsPerDay: null, // Could be computed
      };

      res.json({
        success: true,
        data: {
          events,
          categorized: categorizedEvents,
          summary,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      if (error.statusCode === 404) {
        throw ErrorFactory.notFound(`User '${username}' not found on GitHub`);
      }
      throw error;
    }
  });

  /**
   * @desc    Refresh user data from GitHub
   * @route   POST /api/users/:username/refresh
   * @access  Public (with rate limiting)
   */
  static refreshUserData = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { includeContributions = 'true', includeLanguages = 'true' } = req.body;

    const githubService = new GitHubService();
    const userService = new UserService();

    try {
      // Fetch fresh data from GitHub
      const [profile, contributions, languages] = await Promise.all([
        githubService.getUserProfile(username),
        includeContributions === 'true' ? githubService.getUserContributions(username) : null,
        includeLanguages === 'true' ? githubService.getUserLanguages(username) : null,
      ]);

      // Update user in database
      const updatedUser = await userService.createOrUpdateUser({
        ...profile,
        ...(contributions && {
          totalCommits: contributions.totalCommits,
          totalPullRequests: contributions.totalPullRequests,
          totalIssues: contributions.totalIssues,
          totalReviews: contributions.totalReviews,
          contributionCalendar: contributions.contributionCalendar,
        }),
        ...(languages && { topLanguages: languages.slice(0, 10) }),
      });

      // Update user's rank
      await updatedUser.updateRank('totalCommits');

      logger.logUserActivity(req.user?.id, 'refresh_user_data', { 
        refreshedUser: username,
        includeContributions,
        includeLanguages 
      });

      res.json({
        success: true,
        data: updatedUser.toPublicJSON(),
        message: 'User data refreshed successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      if (error.statusCode === 404) {
        throw ErrorFactory.notFound(`User '${username}' not found on GitHub`);
      }
      throw error;
    }
  });

  /**
   * @desc    Search users
   * @route   GET /api/users/search
   * @access  Public
   */
  static searchUsers = asyncHandler(async (req, res) => {
    const { q, sort = 'followers', order = 'desc', per_page = 30, page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      throw ErrorFactory.badRequest('Search query must be at least 2 characters long');
    }

    const githubService = new GitHubService();
    
    try {
      const searchResults = await githubService.searchUsers(q, {
        sort,
        order,
        per_page: parseInt(per_page),
        page: parseInt(page),
      });

      // Check which users exist in our database
      const usernames = searchResults.users.map(u => u.username);
      const existingUsers = await User.find({ 
        username: { $in: usernames } 
      }).select('username totalCommits followers globalRank');

      // Merge GitHub search results with our database data
      const enrichedResults = searchResults.users.map(githubUser => {
        const dbUser = existingUsers.find(u => u.username === githubUser.username);
        return {
          ...githubUser,
          inDatabase: !!dbUser,
          ...(dbUser && {
            totalCommits: dbUser.totalCommits,
            followers: dbUser.followers,
            globalRank: dbUser.globalRank,
          }),
        };
      });

      res.json({
        success: true,
        data: {
          users: enrichedResults,
          totalCount: searchResults.totalCount,
          incompleteResults: searchResults.incompleteResults,
          query: q,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      throw ErrorFactory.githubAPI(`Search failed: ${error.message}`);
    }
  });

  /**
   * @desc    Get user statistics summary
   * @route   GET /api/users/:username/stats
   * @access  Public
   */
  static getUserStats = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await User.findByUsername(username);
    if (!user) {
      throw ErrorFactory.notFound(`User '${username}' not found`);
    }

    // Calculate additional statistics
    const stats = {
      profile: {
        accountAge: user.accountAge,
        profileCompletion: user.profileCompletion,
        totalContributions: user.totalContributions,
        contributionStreak: user.contributionStreak,
        longestStreak: user.longestStreak,
      },
      rankings: {
        global: user.globalRank,
        byCommits: await user.updateRank('totalCommits'),
        byFollowers: await user.updateRank('followers'),
        byRepos: await user.updateRank('publicRepos'),
      },
      growth: {
        // These would be calculated from historical data
        followersGrowth: 0,
        reposGrowth: 0,
        commitsGrowth: 0,
      },
      activity: {
        averageCommitsPerDay: user.totalCommits / (user.accountAge || 1),
        topLanguages: user.topLanguages.slice(0, 5),
        recentRepos: user.recentRepos.slice(0, 5),
      },
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });
}

module.exports = UserController;
