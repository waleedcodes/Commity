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
      category = 'contributions',
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
        let users;
        let totalCount;

        if (location) {
          let rankField = 'countryRankAll';
          if (category === 'commits') rankField = 'countryRankCommits';
          else if (category === 'public_contributions') rankField = 'countryRankPublic';

          const pipeline = [
            { $match: query },
            {
              $addFields: {
                hasOfficialRank: {
                  $cond: [{ $ifNull: [`$${rankField}`, false] }, 0, 1]
                },
                effectiveRank: {
                  $ifNull: [`$${rankField}`, 999999]
                }
              }
            },
            {
              $sort: {
                hasOfficialRank: 1,
                effectiveRank: 1,
                [sortField]: -1,
                createdAt: 1
              }
            },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $project: {
                contributionCalendar: 0,
                recentRepos: 0,
                __v: 0,
                hasOfficialRank: 0,
                effectiveRank: 0
              }
            }
          ];

          [users, totalCount] = await Promise.all([
            User.aggregate(pipeline),
            User.countDocuments(query)
          ]);
        } else {
          [users, totalCount] = await Promise.all([
            User.find(query)
              .sort({ [sortField]: -1, createdAt: 1 })
              .skip(skip)
              .limit(parseInt(limit))
              .select('-contributionCalendar -recentRepos -__v')
              .lean(),
            User.countDocuments(query)
          ]);
        }

        // Add rank numbers (respect authoritative committers.top rank when filtered by country/location)
        const rankedUsers = users.map((user, index) => {
          let officialRank = null;
          if (location) {
            if (category === 'commits' && user.countryRankCommits) {
              officialRank = user.countryRankCommits;
            } else if (category === 'public_contributions' && user.countryRankPublic) {
              officialRank = user.countryRankPublic;
            } else {
              officialRank = user.countryRankAll || user.countryRank;
            }
          }
          return {
            ...user,
            rank: officialRank || (skip + index + 1),
            dbPosition: skip + index + 1,
            officialRank: officialRank || null,
            categoryValue: user[sortField] || 0,
            percentile: Math.round((1 - (skip + index) / totalCount) * 100),
          };
        });

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
            { $match: { isActive: true, location: { $exists: true, $nin: [null, '', 'undefined', 'null'] } } },
            { $group: { _id: '$location', count: { $sum: 1 } } }
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
