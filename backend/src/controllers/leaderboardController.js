const { asyncHandler } = require('../middleware/errorHandler');
const { ErrorFactory } = require('../middleware/errorHandler');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const CacheManager = require('../utils/cache');
const { CACHE_KEYS, LEADERBOARD_CATEGORIES } = require('../config/constants');

class LeaderboardController {
  
  /**
   * @desc    Get global leaderboard
   * @route   GET /api/leaderboard
   * @access  Public
   */
  static getLeaderboard = asyncHandler(async (req, res) => {
    const {
      category = 'commits',
      period = 'all_time',
      location,
      language,
      page = 1,
      limit = 100,
    } = req.query;

    const cacheKey = CacheManager.generateKey(
      'leaderboard',
      `${category}_${period}_${location || 'global'}_${language || 'all'}`,
      `${page}_${limit}`
    );

    const leaderboardData = await CacheManager.getOrSet(
      CACHE_KEYS.LEADERBOARD,
      cacheKey,
      async () => {
        // Build query based on category
        const query = { isActive: true };
        
        if (location) {
          query.location = { $regex: location, $options: 'i' };
        }
        
        if (language) {
          query['topLanguages.name'] = { $regex: language, $options: 'i' };
        }

        // Determine sort field based on category
        let sortField;
        switch (category) {
          case 'commits':
            sortField = 'totalCommits';
            break;
          case 'repositories':
            sortField = 'publicRepos';
            break;
          case 'followers':
            sortField = 'followers';
            break;
          case 'contributions':
            sortField = 'totalContributions';
            break;
          case 'streak':
            sortField = 'longestStreak';
            break;
          default:
            sortField = 'totalCommits';
        }

        // Execute query
        const skip = (page - 1) * limit;
        const users = await User.find(query)
          .sort({ [sortField]: -1, createdAt: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-contributionCalendar -recentRepos -__v')
          .lean();

        // Get total count for pagination
        const totalCount = await User.countDocuments(query);

        // Add rank numbers
        const rankedUsers = users.map((user, index) => ({
          ...user,
          rank: skip + index + 1,
          categoryValue: user[sortField] || 0,
          percentile: Math.round((1 - (skip + index) / totalCount) * 100),
        }));

        return {
          users: rankedUsers,
          totalCount,
          category,
          period,
          location: location || null,
          language: language || null,
        };
      },
      15 * 60 // 15 minutes cache
    );

    const pagination = Helpers.generatePaginationMeta(
      parseInt(page),
      parseInt(limit),
      leaderboardData.totalCount
    );

    res.json({
      success: true,
      data: leaderboardData,
      pagination,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get leaderboard statistics and overview
   * @route   GET /api/leaderboard/stats
   * @access  Public
   */
  static getLeaderboardStats = asyncHandler(async (req, res) => {
    const cacheKey = 'leaderboard_stats';

    const stats = await CacheManager.getOrSet(
      CACHE_KEYS.LEADERBOARD,
      cacheKey,
      async () => {
        // Get overall statistics
        const [
          totalUsers,
          totalCommits,
          totalRepos,
          totalFollowers,
          topCountries,
          topLanguages,
          recentUsers,
        ] = await Promise.all([
          User.countDocuments({ isActive: true }),
          User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$totalCommits' } } }
          ]),
          User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$publicRepos' } } }
          ]),
          User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$followers' } } }
          ]),
          User.aggregate([
            { $match: { isActive: true, location: { $exists: true, $ne: null } } },
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]),
          User.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$topLanguages' },
            { $group: { 
              _id: '$topLanguages.name', 
              totalUsers: { $sum: 1 },
              avgPercentage: { $avg: '$topLanguages.percentage' }
            }},
            { $sort: { totalUsers: -1 } },
            { $limit: 10 }
          ]),
          User.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username name avatarUrl totalCommits followers createdAt')
        ]);

        return {
          overview: {
            totalUsers,
            totalCommits: totalCommits[0]?.total || 0,
            totalRepositories: totalRepos[0]?.total || 0,
            totalFollowers: totalFollowers[0]?.total || 0,
            averageCommitsPerUser: totalUsers > 0 ? Math.round((totalCommits[0]?.total || 0) / totalUsers) : 0,
            averageReposPerUser: totalUsers > 0 ? Math.round((totalRepos[0]?.total || 0) / totalUsers) : 0,
          },
          topCountries: topCountries.map(country => ({
            name: country._id,
            userCount: country.count,
          })),
          topLanguages: topLanguages.map(lang => ({
            name: lang._id,
            userCount: lang.totalUsers,
            averageUsage: Math.round(lang.avgPercentage),
          })),
          recentUsers: recentUsers.map(user => ({
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            totalCommits: user.totalCommits,
            followers: user.followers,
            joinedAt: user.createdAt,
          })),
        };
      },
      30 * 60 // 30 minutes cache
    );

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get top contributors
   * @route   GET /api/leaderboard/contributors
   * @access  Public
   */
  static getTopContributors = asyncHandler(async (req, res) => {
    const { 
      category = 'commits',
      period = 'all_time',
      limit = 50 
    } = req.query;

    const cacheKey = CacheManager.generateKey('top_contributors', category, period);

    const contributors = await CacheManager.getOrSet(
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
          case 'reviews':
            sortField = 'totalReviews';
            break;
          default:
            sortField = 'totalCommits';
        }

        const topUsers = await User.find({ 
          isActive: true,
          [sortField]: { $gt: 0 }
        })
        .sort({ [sortField]: -1 })
        .limit(parseInt(limit))
        .select('username name avatarUrl location topLanguages totalCommits totalPullRequests totalIssues totalReviews followers')
        .lean();

        return topUsers.map((user, index) => ({
          rank: index + 1,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          location: user.location,
          primaryLanguage: user.topLanguages?.[0]?.name || null,
          categoryValue: user[sortField] || 0,
          totalContributions: (user.totalCommits || 0) + (user.totalPullRequests || 0) + 
                            (user.totalIssues || 0) + (user.totalReviews || 0),
          followers: user.followers || 0,
          score: this._calculateContributorScore(user),
        }));
      },
      20 * 60 // 20 minutes cache
    );

    res.json({
      success: true,
      data: {
        contributors,
        category,
        period,
        totalContributors: contributors.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get top repositories
   * @route   GET /api/leaderboard/repositories
   * @access  Public
   */
  static getTopRepositories = asyncHandler(async (req, res) => {
    const { 
      sort = 'stars',
      language,
      limit = 50 
    } = req.query;

    const cacheKey = CacheManager.generateKey('top_repositories', sort, language || 'all');

    const repositories = await CacheManager.getOrSet(
      CACHE_KEYS.LEADERBOARD,
      cacheKey,
      async () => {
        // Aggregate repositories from users
        const pipeline = [
          { $match: { isActive: true } },
          { $unwind: '$recentRepos' },
        ];

        if (language) {
          pipeline.push({
            $match: { 'recentRepos.language': { $regex: language, $options: 'i' } }
          });
        }

        let sortField;
        switch (sort) {
          case 'stars':
            sortField = 'recentRepos.stargazersCount';
            break;
          case 'forks':
            sortField = 'recentRepos.forksCount';
            break;
          case 'updated':
            sortField = 'recentRepos.updatedAt';
            break;
          default:
            sortField = 'recentRepos.stargazersCount';
        }

        pipeline.push(
          { $sort: { [sortField]: -1 } },
          { $limit: parseInt(limit) },
          {
            $project: {
              name: '$recentRepos.name',
              fullName: '$recentRepos.fullName',
              description: '$recentRepos.description',
              language: '$recentRepos.language',
              stars: '$recentRepos.stargazersCount',
              forks: '$recentRepos.forksCount',
              updatedAt: '$recentRepos.updatedAt',
              htmlUrl: '$recentRepos.htmlUrl',
              owner: {
                username: '$username',
                name: '$name',
                avatarUrl: '$avatarUrl',
              },
            }
          }
        );

        const topRepos = await User.aggregate(pipeline);

        return topRepos.map((repo, index) => ({
          rank: index + 1,
          ...repo,
          score: (repo.stars || 0) + (repo.forks || 0) * 2,
        }));
      },
      25 * 60 // 25 minutes cache
    );

    res.json({
      success: true,
      data: {
        repositories,
        sort,
        language: language || null,
        totalRepositories: repositories.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get leaderboard filtered by location
   * @route   GET /api/leaderboard/location/:location
   * @access  Public
   */
  static getLeaderboardByLocation = asyncHandler(async (req, res) => {
    const { location } = req.params;
    const { 
      category = 'commits',
      page = 1,
      limit = 50 
    } = req.query;

    // Use the main leaderboard method with location filter
    req.query.location = location;
    await LeaderboardController.getLeaderboard(req, res);
  });

  /**
   * @desc    Get leaderboard filtered by programming language
   * @route   GET /api/leaderboard/language/:language
   * @access  Public
   */
  static getLeaderboardByLanguage = asyncHandler(async (req, res) => {
    const { language } = req.params;
    const { 
      category = 'commits',
      page = 1,
      limit = 50 
    } = req.query;

    // Use the main leaderboard method with language filter
    req.query.language = language;
    await LeaderboardController.getLeaderboard(req, res);
  });

  /**
   * @desc    Get specific user's ranking across different categories
   * @route   GET /api/leaderboard/user/:username
   * @access  Public
   */
  static getUserRanking = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { categories = 'commits,followers,repositories,contributions' } = req.query;

    const user = await User.findByUsername(username);
    if (!user) {
      throw ErrorFactory.notFound(`User '${username}' not found`);
    }

    const categoryList = categories.split(',');
    const rankings = {};

    for (const category of categoryList) {
      let field;
      switch (category.trim()) {
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
          continue;
      }

      const rank = await User.countDocuments({
        [field]: { $gt: user[field] },
        isActive: true,
      }) + 1;

      const total = await User.countDocuments({ isActive: true });
      const percentile = Math.round((1 - (rank - 1) / total) * 100);

      rankings[category.trim()] = {
        rank,
        total,
        percentile,
        value: user[field] || 0,
        category: category.trim(),
      };
    }

    // Get user's position in location-based leaderboard if location exists
    if (user.location) {
      const locationRank = await User.countDocuments({
        totalCommits: { $gt: user.totalCommits },
        location: { $regex: user.location, $options: 'i' },
        isActive: true,
      }) + 1;

      const locationTotal = await User.countDocuments({
        location: { $regex: user.location, $options: 'i' },
        isActive: true,
      });

      rankings.location = {
        rank: locationRank,
        total: locationTotal,
        percentile: Math.round((1 - (locationRank - 1) / locationTotal) * 100),
        value: user.totalCommits,
        category: 'location',
        locationName: user.location,
      };
    }

    res.json({
      success: true,
      data: {
        user: {
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          location: user.location,
        },
        rankings,
        overallScore: this._calculateOverallScore(rankings),
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Calculate contributor score
   * @private
   */
  static _calculateContributorScore(user) {
    const weights = {
      commits: 1,
      pullRequests: 3,
      issues: 2,
      reviews: 2,
      followers: 0.1,
    };

    return Math.round(
      (user.totalCommits || 0) * weights.commits +
      (user.totalPullRequests || 0) * weights.pullRequests +
      (user.totalIssues || 0) * weights.issues +
      (user.totalReviews || 0) * weights.reviews +
      (user.followers || 0) * weights.followers
    );
  }

  /**
   * Calculate overall score from rankings
   * @private
   */
  static _calculateOverallScore(rankings) {
    const weights = {
      commits: 0.3,
      followers: 0.2,
      repositories: 0.2,
      contributions: 0.3,
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(rankings).forEach(([category, data]) => {
      if (weights[category] && data.percentile) {
        totalScore += data.percentile * weights[category];
        totalWeight += weights[category];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
}

module.exports = LeaderboardController;
