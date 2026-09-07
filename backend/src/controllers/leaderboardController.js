const { asyncHandler } = require('../middleware/errorHandler');
const { ErrorFactory } = require('../middleware/errorHandler');
const User = require('../models/User');
const RankingSnapshot = require('../models/RankingSnapshot');
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
        // Build query based on category (strictly individual developers)
        const query = { isActive: true, accountType: { $ne: 'Organization' } };
        
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
          case 'public_contributions':
            sortField = 'publicContributions';
            break;
          case 'private_contributions':
            sortField = 'privateContributions';
            break;
          case 'streak':
            sortField = 'longestStreak';
            break;
          default:
            sortField = 'totalCommits';
        }

        // Dynamic Live Crawling: If requesting a specific location and fewer than 10 profiles exist,
        // automatically query GitHub Search API to discover and sync real active developers live from GitHub!
        if (location) {
          const countInDb = await User.countDocuments(query);
          if (countInDb < 10) {
            try {
              const GitHubService = require('../services/githubService');
              const UserService = require('../services/userService');
              const githubService = new GitHubService();
              const userService = new UserService();

              logger.info(`🔍 Live discovering active GitHub developers for location: ${location}`);
              const searchRes = await githubService.searchUsers(`location:"${location}" type:user`, {
                sort: 'followers',
                order: 'desc',
                per_page: 15
              });

              if (searchRes && searchRes.users) {
                const individualDevelopers = searchRes.users.filter(u => u.type !== 'Organization');
                // Sync top 5 developers concurrently for ultra-fast first-time response
                const fastBatch = individualDevelopers.slice(0, 5);
                await Promise.allSettled(
                  fastBatch.map(async (u) => {
                    const existing = await User.findOne({ username: u.username.toLowerCase() });
                    if (!existing || !userService.isRecentlyUpdated(existing)) {
                      await userService.syncUserProfile(u.username, false);
                    }
                  })
                );

                // Crawl and sync the next batch in the background
                const nextBatch = individualDevelopers.slice(5, 15);
                (async () => {
                  for (const u of nextBatch) {
                    try {
                      const existing = await User.findOne({ username: u.username.toLowerCase() });
                      if (!existing || !userService.isRecentlyUpdated(existing)) {
                        await userService.syncUserProfile(u.username, false);
                        await Helpers.sleep(300);
                      }
                    } catch (e) {
                      // background ignore
                    }
                  }
                })();
              }
            } catch (crawlErr) {
              logger.warn(`Live location crawl notice for ${location}: ${crawlErr.message}`);
            }
          }
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

        // Regional ecosystem scale metadata (committers.top model)
        const REGION_ECOSYSTEM_DATA = {
          pakistan: { name: 'Pakistan', totalInRegion: 160760, minFollowers: 69, topRankedQuota: 256 },
          'united states': { name: 'United States', totalInRegion: 1903738, minFollowers: 120, topRankedQuota: 256 },
          usa: { name: 'United States', totalInRegion: 1903738, minFollowers: 120, topRankedQuota: 256 },
          india: { name: 'India', totalInRegion: 1182814, minFollowers: 95, topRankedQuota: 256 },
          germany: { name: 'Germany', totalInRegion: 336800, minFollowers: 80, topRankedQuota: 256 },
          france: { name: 'France', totalInRegion: 230278, minFollowers: 75, topRankedQuota: 256 },
          canada: { name: 'Canada', totalInRegion: 264337, minFollowers: 70, topRankedQuota: 256 },
          japan: { name: 'Japan', totalInRegion: 140714, minFollowers: 65, topRankedQuota: 256 },
          'united kingdom': { name: 'United Kingdom', totalInRegion: 350000, minFollowers: 85, topRankedQuota: 256 },
          uk: { name: 'United Kingdom', totalInRegion: 350000, minFollowers: 85, topRankedQuota: 256 },
        };

        const locKey = location ? location.toLowerCase().trim() : null;
        const matchedRegion = locKey ? (REGION_ECOSYSTEM_DATA[locKey] || {
          name: location,
          totalInRegion: Math.max(totalCount * 150, 10000),
          minFollowers: 50,
          topRankedQuota: 256,
        }) : {
          name: 'Worldwide',
          totalInRegion: 100000000, // 100M+ global developers on GitHub
          minFollowers: 100,
          topRankedQuota: 256,
        };

        return {
          users: rankedUsers,
          totalCount,
          category,
          period,
          location: location || null,
          language: language || null,
          regionSummary: {
            ...matchedRegion,
            indexedMaintainers: totalCount,
            cadence: '7-Day Weekly Snapshots',
            dataSource: 'GitHub GraphQL & committers.top',
          },
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

        const commitsSum = totalCommits[0]?.total || 0;
        const reposSum = totalRepos[0]?.total || 0;
        const followersSum = totalFollowers[0]?.total || 0;

        return {
          totalUsers,
          totalContributors: totalUsers,
          totalContributions: commitsSum,
          totalCommits: commitsSum,
          totalRepositories: reposSum,
          totalFollowers: followersSum,
          activeThisMonth: totalUsers,
          newThisWeek: recentUsers.length,
          overview: {
            totalUsers,
            totalContributors: totalUsers,
            totalContributions: commitsSum,
            totalCommits: commitsSum,
            totalRepositories: reposSum,
            totalFollowers: followersSum,
            activeThisMonth: totalUsers,
            newThisWeek: recentUsers.length,
            averageCommitsPerUser: totalUsers > 0 ? Math.round(commitsSum / totalUsers) : 0,
            averageReposPerUser: totalUsers > 0 ? Math.round(reposSum / totalUsers) : 0,
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
          accountType: { $ne: 'Organization' },
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
        accountType: { $ne: 'Organization' },
      }) + 1;

      const total = await User.countDocuments({ isActive: true, accountType: { $ne: 'Organization' } });
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
        accountType: { $ne: 'Organization' },
      }) + 1;

      const locationTotal = await User.countDocuments({
        location: { $regex: user.location, $options: 'i' },
        isActive: true,
        accountType: { $ne: 'Organization' },
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

  /**
   * @desc    Get algorithmic featured developers (Worldwide, Pakistan, Language Leaders)
   * @route   GET /api/leaderboard/featured
   * @access  Public
   */
  static getFeaturedDevelopers = asyncHandler(async (req, res) => {
    const cacheKey = 'featured_developers_v2';

    const data = await CacheManager.getOrSet(
      CACHE_KEYS.LEADERBOARD,
      cacheKey,
      async () => {
        const selectFields = 'username name avatarUrl location totalContributions totalCommits totalPullRequests followers topLanguages countryRank globalRank';

        const [worldwide, pakistan, javascript, typescript, python] = await Promise.all([
          // Top worldwide maintainers
          User.find({ isActive: true, accountType: { $ne: 'Organization' } })
            .sort({ totalContributions: -1 })
            .limit(6)
            .select(selectFields)
            .lean(),

          // Top Pakistan maintainers
          User.find({ 
            isActive: true, 
            accountType: { $ne: 'Organization' },
            location: { $regex: 'pakistan', $options: 'i' }
          })
            .sort({ totalContributions: -1 })
            .limit(6)
            .select(selectFields)
            .lean(),

          // Top JavaScript maintainers
          User.find({ 
            isActive: true, 
            accountType: { $ne: 'Organization' },
            'topLanguages.name': { $regex: '^javascript$', $options: 'i' }
          })
            .sort({ totalContributions: -1 })
            .limit(4)
            .select(selectFields)
            .lean(),

          // Top TypeScript maintainers
          User.find({ 
            isActive: true, 
            accountType: { $ne: 'Organization' },
            'topLanguages.name': { $regex: '^typescript$', $options: 'i' }
          })
            .sort({ totalContributions: -1 })
            .limit(4)
            .select(selectFields)
            .lean(),

          // Top Python maintainers
          User.find({ 
            isActive: true, 
            accountType: { $ne: 'Organization' },
            'topLanguages.name': { $regex: '^python$', $options: 'i' }
          })
            .sort({ totalContributions: -1 })
            .limit(4)
            .select(selectFields)
            .lean(),
        ]);

        return {
          worldwide,
          pakistan,
          languages: {
            javascript,
            typescript,
            python,
          },
          generatedAt: new Date().toISOString(),
        };
      },
      10 * 60 // 10 minutes cache
    );

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get dynamic region list with active maintainer counts
   * @route   GET /api/leaderboard/regions
   * @access  Public
   */
  static getRegions = asyncHandler(async (req, res) => {
    const cacheKey = 'leaderboard_regions_v2';

    const regions = await CacheManager.getOrSet(
      CACHE_KEYS.LEADERBOARD,
      cacheKey,
      async () => {
        // Aggregate distinct active regions from MongoDB
        const regionAggregation = await User.aggregate([
          { $match: { isActive: true, accountType: { $ne: 'Organization' }, location: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$location', count: { $sum: 1 }, totalContributions: { $sum: '$totalContributions' } } },
          { $sort: { count: -1 } },
          { $limit: 30 }
        ]);

        // Also fetch latest snapshots metadata
        const snapshots = await RankingSnapshot.find().sort({ generatedAt: -1 }).limit(10).lean();
        const snapshotMap = new Map();
        snapshots.forEach(s => {
          if (!snapshotMap.has(s.regionKey)) {
            snapshotMap.set(s.regionKey, s);
          }
        });

        // Built-in core regional metadata
        const CORE_REGIONS = [
          { id: 'all', name: 'Worldwide', flag: '🌍', query: '' },
          { id: 'pakistan', name: 'Pakistan', flag: '🇵🇰', query: 'Pakistan' },
          { id: 'usa', name: 'United States', flag: '🇺🇸', query: 'United States' },
          { id: 'india', name: 'India', flag: '🇮🇳', query: 'India' },
          { id: 'germany', name: 'Germany', flag: '🇩🇪', query: 'Germany' },
          { id: 'france', name: 'France', flag: '🇫🇷', query: 'France' },
          { id: 'japan', name: 'Japan', flag: '🇯🇵', query: 'Japan' },
          { id: 'canada', name: 'Canada', flag: '🇨🇦', query: 'Canada' },
          { id: 'united_kingdom', name: 'United Kingdom', flag: '🇬🇧', query: 'United Kingdom' },
          { id: 'singapore', name: 'Singapore', flag: '🇸🇬', query: 'Singapore' },
        ];

        return CORE_REGIONS.map(reg => {
          const snap = snapshotMap.get(reg.id);
          const agg = regionAggregation.find(a => a._id && a._id.toLowerCase().includes(reg.name.toLowerCase()));
          return {
            ...reg,
            indexedMaintainers: agg ? agg.count : (snap ? snap.usersRanked : 0),
            totalUsersFound: snap ? snap.totalUsersFound : (agg ? agg.count * 100 : null),
            minimumFollowers: snap ? snap.minimumFollowers : 0,
            lastSnapshotAt: snap ? snap.generatedAt : null,
          };
        });
      },
      15 * 60
    );

    res.json({
      success: true,
      data: regions,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get regional ranking snapshots
   * @route   GET /api/leaderboard/snapshots
   * @access  Public
   */
  static getRankingSnapshots = asyncHandler(async (req, res) => {
    const { region = 'pakistan', limit = 5 } = req.query;
    const regionKey = region.toLowerCase().trim().replace(/\s+/g, '_');

    const snapshots = await RankingSnapshot.find({ regionKey })
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit, 10))
      .select('-__v');

    res.json({
      success: true,
      data: snapshots,
      region,
      totalSnapshots: snapshots.length,
      timestamp: new Date().toISOString(),
    });
  });
}

module.exports = LeaderboardController;
