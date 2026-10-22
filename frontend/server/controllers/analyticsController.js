const { asyncHandler } = require('../middleware/errorHandler');
const { ErrorFactory } = require('../middleware/errorHandler');
const User = require('../models/User');
const RankingSnapshot = require('../models/RankingSnapshot');
const Analytics = require('../models/Analytics');
const GitHubService = require('../services/githubService');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const CacheManager = require('../utils/cache');
const { CACHE_KEYS } = require('../config/constants');

class AnalyticsController {

  /**
   * @desc    Get global analytics overview
   * @route   GET /api/analytics/global
   * @access  Public
   */
  static getGlobalAnalytics = asyncHandler(async (req, res) => {
    const { 
      period = '30d',
      includeCharts = true 
    } = req.query;

    const cacheKey = CacheManager.generateKey('global_analytics', period, includeCharts);

    const analytics = await CacheManager.getOrSet(
      CACHE_KEYS.ANALYTICS,
      cacheKey,
      async () => {
        const dateRange = Helpers.getDateRange(period);
        
        // Get global statistics
        const [
          totalStats,
          activeUsers,
          newUsers,
          languageDistribution,
          locationDistribution,
          contributionTrends,
          topPerformers
        ] = await Promise.all([
          // Total statistics
          User.aggregate([
            { $match: { isActive: true } },
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalCommits: { $sum: '$totalCommits' },
                totalRepos: { $sum: '$publicRepos' },
                totalFollowers: { $sum: '$followers' },
                totalFollowing: { $sum: '$following' },
                avgCommitsPerUser: { $avg: '$totalCommits' },
                avgReposPerUser: { $avg: '$publicRepos' },
                avgFollowersPerUser: { $avg: '$followers' },
              }
            }
          ]),

          // Active users in period
          User.countDocuments({
            isActive: true,
            lastAnalyticsUpdate: { $gte: dateRange.start }
          }),

          // New users in period
          User.countDocuments({
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          }),

          // Language distribution
          User.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$topLanguages' },
            {
              $group: {
                _id: '$topLanguages.name',
                userCount: { $sum: 1 },
                totalPercentage: { $sum: '$topLanguages.percentage' },
                avgPercentage: { $avg: '$topLanguages.percentage' }
              }
            },
            { $sort: { userCount: -1 } },
            { $limit: 15 }
          ]),

          // Location distribution
          User.aggregate([
            { 
              $match: { 
                isActive: true,
                location: { $exists: true, $nin: [null, ''] }
              }
            },
            {
              $group: {
                _id: '$location',
                userCount: { $sum: 1 },
                avgCommits: { $avg: '$totalCommits' },
                totalCommits: { $sum: '$totalCommits' }
              }
            },
            { $sort: { userCount: -1 } },
            { $limit: 20 }
          ]),

          // Contribution trends (if charts enabled)
          (String(includeCharts) === 'true' || includeCharts === true) ? Analytics.aggregate([
            {
              $match: {
                $or: [
                  { date: { $gte: dateRange.start, $lte: dateRange.end } },
                  { startDate: { $gte: dateRange.start, $lte: dateRange.end } }
                ]
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: { $ifNull: ['$date', '$startDate'] } },
                  month: { $month: { $ifNull: ['$date', '$startDate'] } },
                  day: { $dayOfMonth: { $ifNull: ['$date', '$startDate'] } }
                },
                totalCommits: { $sum: { $ifNull: ['$commits', '$contributions.commits', 0] } },
                totalPullRequests: { $sum: { $ifNull: ['$pullRequests', '$contributions.pullRequests', 0] } },
                totalIssues: { $sum: { $ifNull: ['$issues', '$contributions.issues', 0] } },
                activeUsers: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 90 }
          ]) : [],

          // Top performers
          User.aggregate([
            { $match: { isActive: true } },
            {
              $addFields: {
                performanceScore: {
                  $add: [
                    { $multiply: ['$totalCommits', 1] },
                    { $multiply: ['$totalPullRequests', 3] },
                    { $multiply: ['$totalIssues', 2] },
                    { $multiply: ['$followers', 0.1] }
                  ]
                }
              }
            },
            { $sort: { performanceScore: -1 } },
            { $limit: 10 },
            {
              $project: {
                username: 1,
                name: 1,
                avatarUrl: 1,
                location: 1,
                totalCommits: 1,
                totalPullRequests: 1,
                totalIssues: 1,
                followers: 1,
                performanceScore: 1,
                primaryLanguage: { $arrayElemAt: ['$topLanguages.name', 0] }
              }
            }
          ])
        ]);

        const totalStatsData = totalStats[0] || {};

        // Calculate growth rates
        const previousPeriodStart = new Date(dateRange.start);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period.replace('d', '')));
        
        const previousActiveUsers = await User.countDocuments({
          isActive: true,
          lastAnalyticsUpdate: { 
            $gte: previousPeriodStart, 
            $lt: dateRange.start 
          }
        });

        const growthRate = previousActiveUsers > 0 
          ? Math.round(((activeUsers - previousActiveUsers) / previousActiveUsers) * 100)
          : 0;

        return {
          overview: {
            totalUsers: totalStatsData.totalUsers || 0,
            activeUsers,
            newUsers,
            totalCommits: totalStatsData.totalCommits || 0,
            totalRepositories: totalStatsData.totalRepos || 0,
            totalFollowers: totalStatsData.totalFollowers || 0,
            totalFollowing: totalStatsData.totalFollowing || 0,
            averages: {
              commitsPerUser: Math.round(totalStatsData.avgCommitsPerUser || 0),
              reposPerUser: Math.round(totalStatsData.avgReposPerUser || 0),
              followersPerUser: Math.round(totalStatsData.avgFollowersPerUser || 0),
            },
            growth: {
              activeUsersGrowth: growthRate,
              period: period,
            }
          },
          distributions: {
            languages: languageDistribution.map(lang => ({
              name: lang._id,
              userCount: lang.userCount,
              averageUsage: Math.round(lang.avgPercentage),
              totalUsage: Math.round(lang.totalPercentage),
            })),
            locations: locationDistribution.map(loc => ({
              name: loc._id,
              userCount: loc.userCount,
              averageCommits: Math.round(loc.avgCommits),
              totalCommits: loc.totalCommits,
            }))
          },
          trends: includeCharts === 'true' ? {
            daily: contributionTrends.map(trend => ({
              date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`,
              commits: trend.totalCommits,
              pullRequests: trend.totalPullRequests,
              issues: trend.totalIssues,
              activeUsers: trend.activeUsers,
            }))
          } : null,
          topPerformers: topPerformers.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            location: user.location,
            primaryLanguage: user.primaryLanguage,
            totalCommits: user.totalCommits,
            totalPullRequests: user.totalPullRequests,
            totalIssues: user.totalIssues,
            followers: user.followers,
            performanceScore: Math.round(user.performanceScore),
          })),
          period,
          generatedAt: new Date().toISOString(),
        };
      },
      20 * 60 // 20 minutes cache
    );

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get user-specific analytics
   * @route   GET /api/analytics/user/:username
   * @access  Public/Private
   */
  static getUserAnalytics = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const { 
      period = '30d',
      includeActivity = true,
      includeLanguages = true,
      includeRepos = true 
    } = req.query;

    const user = await User.findByUsername(username);
    if (!user) {
      throw ErrorFactory.notFound(`User '${username}' not found`);
    }

    const cacheKey = CacheManager.generateKey(
      'user_analytics',
      username,
      period,
      `${includeActivity}_${includeLanguages}_${includeRepos}`
    );

    const analytics = await CacheManager.getOrSet(
      CACHE_KEYS.USER_ANALYTICS,
      cacheKey,
      async () => {
        const dateRange = Helpers.getDateRange(period);

        // Get user's analytics records
        let userAnalytics = await Analytics.find({
          $and: [
            { $or: [{ username: user.username }, { githubUsername: user.username }] },
            { $or: [
                { date: { $gte: dateRange.start, $lte: dateRange.end } },
                { startDate: { $gte: dateRange.start, $lte: dateRange.end } }
              ]
            }
          ]
        }).sort({ date: 1, startDate: 1 });

        // If no analytics records found, synthesize from user's contributionCalendar
        if ((!userAnalytics || userAnalytics.length === 0) && user.contributionCalendar && user.contributionCalendar.length > 0) {
          const filteredCalendar = user.contributionCalendar.filter(item => {
            const d = new Date(item.date);
            return d >= dateRange.start && d <= dateRange.end;
          });
          
          userAnalytics = filteredCalendar.map(item => ({
            date: new Date(item.date),
            commits: item.contributionCount || 0,
            pullRequests: 0,
            issues: 0,
            reviews: 0,
          }));
        }

        // Calculate statistics
        const totalStats = userAnalytics.reduce((acc, record) => {
          const commits = record.commits || record.contributions?.commits || 0;
          const pullRequests = record.pullRequests || record.contributions?.pullRequests || 0;
          const issues = record.issues || record.contributions?.issues || 0;
          const reviews = record.reviews || record.contributions?.reviews || 0;
          return {
            commits: acc.commits + commits,
            pullRequests: acc.pullRequests + pullRequests,
            issues: acc.issues + issues,
            reviews: acc.reviews + reviews,
            activeDays: acc.activeDays + (commits > 0 ? 1 : 0),
          };
        }, { commits: 0, pullRequests: 0, issues: 0, reviews: 0, activeDays: 0 });

        // If totalStats has 0 commits but user has lifetime commits, use user totals as fallback
        if (totalStats.commits === 0 && (user.totalCommits || 0) > 0) {
          totalStats.commits = user.totalCommits || 0;
          totalStats.pullRequests = user.totalPullRequests || 0;
          totalStats.issues = user.totalIssues || 0;
          totalStats.reviews = user.totalReviews || 0;
          totalStats.activeDays = Math.min(30, user.totalCommits || 0);
        }

        // Calculate rankings
        const rankings = await this._getUserRankings(user);

        // Activity timeline
        const activityTimeline = (String(includeActivity) === 'true' || includeActivity === true)
          ? userAnalytics.map(record => {
              const recDate = record.date ? new Date(record.date) : (record.startDate ? new Date(record.startDate) : new Date());
              const commits = record.commits || record.contributions?.commits || 0;
              const pullRequests = record.pullRequests || record.contributions?.pullRequests || 0;
              const issues = record.issues || record.contributions?.issues || 0;
              const reviews = record.reviews || record.contributions?.reviews || 0;
              return {
                date: recDate.toISOString().split('T')[0],
                commits,
                pullRequests,
                issues,
                reviews,
                total: commits + pullRequests + issues + reviews,
              };
            })
          : null;

        // Language analysis - get from user model or fetch fresh
        let languageAnalysis = null;
        if (includeLanguages === 'true') {
          try {
            let languages = user.topLanguages || [];
            
            // If no languages in user model, try to fetch from GitHub
            if (!languages || languages.length === 0) {
              const githubService = new GitHubService();
              try {
                languages = await githubService.getUserLanguages(user.username);
              } catch (error) {
                logger.warn(`Failed to fetch languages for ${user.username}: ${error.message}`);
                languages = [];
              }
            }

            if (languages && languages.length > 0) {
              languageAnalysis = {
                primary: languages[0] || null,
                distribution: languages.slice(0, 10),
                totalLanguages: languages.length,
                diversity: this._calculateLanguageDiversity(languages),
              };
            }
          } catch (error) {
            logger.warn(`Error processing language analysis: ${error.message}`);
            languageAnalysis = null;
          }
        }

        // Repository analysis - fetch live data if not available in user model
        let repositoryAnalysis = null;
        if (includeRepos === 'true') {
          try {
            // Try to get repositories from user model first, otherwise fetch from GitHub
            let repositories = user.recentRepos || [];
            
            if (!repositories || repositories.length === 0) {
              const githubService = new GitHubService();
              repositories = await githubService.getUserRepositories(user.username, {
                type: 'owner',
                sort: 'updated',
                per_page: 50
              });
            }

            if (repositories && repositories.length > 0) {
              const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazersCount || 0), 0);
