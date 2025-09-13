const { asyncHandler } = require('../middleware/errorHandler');
const { ErrorFactory } = require('../middleware/errorHandler');
const User = require('../models/User');
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
                location: { $exists: true, $ne: null, $ne: '' }
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
          includeCharts === 'true' ? Analytics.aggregate([
            {
              $match: {
                date: { $gte: dateRange.start, $lte: dateRange.end }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$date' },
                  month: { $month: '$date' },
                  day: { $dayOfMonth: '$date' }
                },
                totalCommits: { $sum: '$commits' },
                totalPullRequests: { $sum: '$pullRequests' },
                totalIssues: { $sum: '$issues' },
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
        const userAnalytics = await Analytics.find({
          username: user.username,
          date: { $gte: dateRange.start, $lte: dateRange.end }
        }).sort({ date: 1 });

        // Calculate statistics
        const totalStats = userAnalytics.reduce((acc, record) => ({
          commits: acc.commits + (record.commits || 0),
          pullRequests: acc.pullRequests + (record.pullRequests || 0),
          issues: acc.issues + (record.issues || 0),
          reviews: acc.reviews + (record.reviews || 0),
          activeDays: acc.activeDays + (record.commits > 0 ? 1 : 0),
        }), { commits: 0, pullRequests: 0, issues: 0, reviews: 0, activeDays: 0 });

        // Calculate rankings
        const rankings = await this._getUserRankings(user);

        // Activity timeline
        const activityTimeline = includeActivity === 'true' 
          ? userAnalytics.map(record => ({
              date: record.date.toISOString().split('T')[0],
              commits: record.commits || 0,
              pullRequests: record.pullRequests || 0,
              issues: record.issues || 0,
              reviews: record.reviews || 0,
              total: (record.commits || 0) + (record.pullRequests || 0) + 
                     (record.issues || 0) + (record.reviews || 0),
            }))
          : null;

        // Language analysis
        const languageAnalysis = includeLanguages === 'true' && user.topLanguages
          ? {
              primary: user.topLanguages[0] || null,
              distribution: user.topLanguages.slice(0, 10),
              totalLanguages: user.topLanguages.length,
              diversity: this._calculateLanguageDiversity(user.topLanguages),
            }
          : null;

        // Repository analysis
        const repositoryAnalysis = includeRepos === 'true' && user.recentRepos
          ? {
              totalPublic: user.publicRepos || 0,
              totalPrivate: user.totalRepos - user.publicRepos || 0,
              averageStars: Math.round(
                user.recentRepos.reduce((sum, repo) => sum + (repo.stargazersCount || 0), 0) / 
                user.recentRepos.length
              ),
              averageForks: Math.round(
                user.recentRepos.reduce((sum, repo) => sum + (repo.forksCount || 0), 0) / 
                user.recentRepos.length
              ),
              topRepositories: user.recentRepos
                .sort((a, b) => (b.stargazersCount || 0) - (a.stargazersCount || 0))
                .slice(0, 5)
                .map(repo => ({
                  name: repo.name,
                  description: repo.description,
                  language: repo.language,
                  stars: repo.stargazersCount || 0,
                  forks: repo.forksCount || 0,
                  updatedAt: repo.updatedAt,
                  htmlUrl: repo.htmlUrl,
                })),
              languageDistribution: this._calculateRepoLanguageDistribution(user.recentRepos),
            }
          : null;

        // Performance metrics
        const performanceMetrics = {
          consistencyScore: this._calculateConsistencyScore(userAnalytics),
          productivityScore: this._calculateProductivityScore(totalStats, userAnalytics.length),
          engagementScore: this._calculateEngagementScore(user),
          overallScore: this._calculateOverallScore(totalStats, user),
        };

        // Comparison with similar users
        const comparison = await this._getUserComparison(user, totalStats);

        return {
          user: {
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            location: user.location,
            bio: user.bio,
            company: user.company,
            blog: user.blog,
            followers: user.followers,
            following: user.following,
            publicRepos: user.publicRepos,
            totalRepos: user.totalRepos,
            createdAt: user.createdAt,
            lastUpdate: user.lastAnalyticsUpdate,
          },
          period: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
            duration: period,
            recordsFound: userAnalytics.length,
          },
          statistics: {
            period: totalStats,
            lifetime: {
              commits: user.totalCommits || 0,
              pullRequests: user.totalPullRequests || 0,
              issues: user.totalIssues || 0,
              reviews: user.totalReviews || 0,
              contributions: user.totalContributions || 0,
              streak: {
                current: user.currentStreak || 0,
                longest: user.longestStreak || 0,
              },
            },
          },
          rankings,
          activityTimeline,
          languageAnalysis,
          repositoryAnalysis,
          performanceMetrics,
          comparison,
          generatedAt: new Date().toISOString(),
        };
      },
      15 * 60 // 15 minutes cache
    );

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get analytics trends and patterns
   * @route   GET /api/analytics/trends
   * @access  Public
   */
  static getAnalyticsTrends = asyncHandler(async (req, res) => {
    const { 
      period = '90d',
      metric = 'commits',
      groupBy = 'daily',
      location,
      language 
    } = req.query;

    const cacheKey = CacheManager.generateKey(
      'analytics_trends',
      period,
      metric,
      groupBy,
      location || 'global',
      language || 'all'
    );

    const trends = await CacheManager.getOrSet(
      CACHE_KEYS.ANALYTICS,
      cacheKey,
      async () => {
        const dateRange = Helpers.getDateRange(period);
        
        // Build aggregation pipeline
        const pipeline = [
          {
            $match: {
              date: { $gte: dateRange.start, $lte: dateRange.end }
            }
          }
        ];

        // Add location filter if specified
        if (location) {
          // First get users from that location
          const usersInLocation = await User.find({
            location: { $regex: location, $options: 'i' },
            isActive: true
          }).select('username');
          
          const usernames = usersInLocation.map(u => u.username);
          pipeline.push({
            $match: { username: { $in: usernames } }
          });
        }

        // Add language filter if specified
        if (language) {
          const usersWithLanguage = await User.find({
            'topLanguages.name': { $regex: language, $options: 'i' },
            isActive: true
          }).select('username');
          
          const usernames = usersWithLanguage.map(u => u.username);
          pipeline.push({
            $match: { username: { $in: usernames } }
          });
        }

        // Group by time period
        let groupBy_id;
        switch (groupBy) {
          case 'weekly':
            groupBy_id = {
              year: { $year: '$date' },
              week: { $week: '$date' }
            };
            break;
          case 'monthly':
            groupBy_id = {
              year: { $year: '$date' },
              month: { $month: '$date' }
            };
            break;
          default: // daily
            groupBy_id = {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            };
        }

        pipeline.push(
          {
            $group: {
              _id: groupBy_id,
              totalCommits: { $sum: '$commits' },
              totalPullRequests: { $sum: '$pullRequests' },
              totalIssues: { $sum: '$issues' },
              totalReviews: { $sum: '$reviews' },
              activeUsers: { $addToSet: '$username' },
              averageCommits: { $avg: '$commits' },
              maxCommits: { $max: '$commits' },
              minCommits: { $min: '$commits' },
            }
          },
          {
            $addFields: {
              activeUserCount: { $size: '$activeUsers' },
              totalContributions: {
                $add: ['$totalCommits', '$totalPullRequests', '$totalIssues', '$totalReviews']
              }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
          }
        );

        const results = await Analytics.aggregate(pipeline);

        // Format results with date strings
        const formattedResults = results.map(item => {
          let dateStr;
          if (groupBy === 'monthly') {
            dateStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
          } else if (groupBy === 'weekly') {
            const date = new Date(item._id.year, 0, 1 + (item._id.week - 1) * 7);
            dateStr = date.toISOString().split('T')[0];
          } else {
            dateStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
          }

          return {
            date: dateStr,
            period: item._id,
            commits: item.totalCommits,
            pullRequests: item.totalPullRequests,
            issues: item.totalIssues,
            reviews: item.totalReviews,
            totalContributions: item.totalContributions,
            activeUsers: item.activeUserCount,
            averageCommitsPerUser: Math.round(item.averageCommits * 100) / 100,
            maxCommitsPerUser: item.maxCommits,
            minCommitsPerUser: item.minCommits,
            primaryMetricValue: item[`total${metric.charAt(0).toUpperCase() + metric.slice(1)}`] || 0,
          };
        });

        // Calculate trend statistics
        const trendStats = this._calculateTrendStatistics(formattedResults, metric);

        return {
          trends: formattedResults,
          statistics: trendStats,
          period: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
            duration: period,
            groupBy,
            dataPoints: formattedResults.length,
          },
          filters: {
            metric,
            location: location || null,
            language: language || null,
          },
        };
      },
      25 * 60 // 25 minutes cache
    );

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Compare multiple users' analytics
   * @route   POST /api/analytics/compare
   * @access  Public
   */
  static compareUsers = asyncHandler(async (req, res) => {
    const { usernames, period = '30d', metrics = ['commits', 'pullRequests', 'issues'] } = req.body;

    if (!usernames || !Array.isArray(usernames) || usernames.length < 2 || usernames.length > 10) {
      throw ErrorFactory.badRequest('Please provide 2-10 usernames to compare');
    }

    const cacheKey = CacheManager.generateKey(
      'user_comparison',
      usernames.sort().join(','),
      period,
      metrics.join(',')
    );

    const comparison = await CacheManager.getOrSet(
      CACHE_KEYS.USER_ANALYTICS,
      cacheKey,
      async () => {
        const dateRange = Helpers.getDateRange(period);
        
        // Get all users
        const users = await User.find({
          username: { $in: usernames },
          isActive: true
        });

        if (users.length !== usernames.length) {
          const foundUsernames = users.map(u => u.username);
          const missingUsernames = usernames.filter(u => !foundUsernames.includes(u));
          throw ErrorFactory.notFound(`Users not found: ${missingUsernames.join(', ')}`);
        }

        // Get analytics for all users in the period
        const userAnalytics = {};
        for (const user of users) {
          const analytics = await Analytics.find({
            username: user.username,
            date: { $gte: dateRange.start, $lte: dateRange.end }
          }).sort({ date: 1 });

          userAnalytics[user.username] = analytics;
        }

        // Prepare comparison data
        const comparisonData = users.map(user => {
          const analytics = userAnalytics[user.username];
          const periodStats = analytics.reduce((acc, record) => ({
            commits: acc.commits + (record.commits || 0),
            pullRequests: acc.pullRequests + (record.pullRequests || 0),
            issues: acc.issues + (record.issues || 0),
            reviews: acc.reviews + (record.reviews || 0),
            activeDays: acc.activeDays + (record.commits > 0 ? 1 : 0),
          }), { commits: 0, pullRequests: 0, issues: 0, reviews: 0, activeDays: 0 });

          return {
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            location: user.location,
            followers: user.followers,
            period: periodStats,
            lifetime: {
              commits: user.totalCommits || 0,
              pullRequests: user.totalPullRequests || 0,
              issues: user.totalIssues || 0,
              reviews: user.totalReviews || 0,
              contributions: user.totalContributions || 0,
              publicRepos: user.publicRepos || 0,
              streak: user.longestStreak || 0,
            },
            activity: analytics.map(record => ({
              date: record.date.toISOString().split('T')[0],
              commits: record.commits || 0,
              pullRequests: record.pullRequests || 0,
              issues: record.issues || 0,
              reviews: record.reviews || 0,
            })),
            performanceScore: this._calculateOverallScore(periodStats, user),
          };
        });

        // Calculate rankings for each metric
        const rankings = {};
        metrics.forEach(metric => {
          const sorted = [...comparisonData].sort((a, b) => 
            (b.period[metric] || 0) - (a.period[metric] || 0)
          );
          rankings[metric] = sorted.map((user, index) => ({
            username: user.username,
            rank: index + 1,
            value: user.period[metric] || 0,
          }));
        });

        // Statistical analysis
        const statistics = {};
        metrics.forEach(metric => {
          const values = comparisonData.map(user => user.period[metric] || 0);
          statistics[metric] = {
            min: Math.min(...values),
            max: Math.max(...values),
            average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
            median: Helpers.calculateMedian(values),
            standardDeviation: Math.round(Helpers.calculateStandardDeviation(values)),
          };
        });

        return {
          users: comparisonData,
          rankings,
          statistics,
          period: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
            duration: period,
          },
          metrics,
          totalUsers: comparisonData.length,
        };
      },
      10 * 60 // 10 minutes cache
    );

    res.json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @desc    Get comprehensive platform insights
   * @route   GET /api/analytics/insights
   * @access  Public
   */
  static getPlatformInsights = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;

    const cacheKey = CacheManager.generateKey('platform_insights', period);

    const insights = await CacheManager.getOrSet(
      CACHE_KEYS.ANALYTICS,
      cacheKey,
      async () => {
        const dateRange = Helpers.getDateRange(period);

        // Get various insights
        const [
          activityInsights,
          languageInsights,
          geographicInsights,
          performanceInsights,
          growthInsights
        ] = await Promise.all([
          this._getActivityInsights(dateRange),
          this._getLanguageInsights(dateRange),
          this._getGeographicInsights(dateRange),
          this._getPerformanceInsights(dateRange),
          this._getGrowthInsights(dateRange)
        ]);

        return {
          period: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
            duration: period,
          },
          insights: {
            activity: activityInsights,
            languages: languageInsights,
            geographic: geographicInsights,
            performance: performanceInsights,
            growth: growthInsights,
          },
          generatedAt: new Date().toISOString(),
        };
      },
      30 * 60 // 30 minutes cache
    );

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
    });
  });

  // Private helper methods

  static async _getUserRankings(user) {
    const [
      commitsRank,
      followersRank,
      reposRank,
      contributionsRank,
      totalUsers
    ] = await Promise.all([
      User.countDocuments({ totalCommits: { $gt: user.totalCommits }, isActive: true }),
      User.countDocuments({ followers: { $gt: user.followers }, isActive: true }),
      User.countDocuments({ publicRepos: { $gt: user.publicRepos }, isActive: true }),
      User.countDocuments({ totalContributions: { $gt: user.totalContributions }, isActive: true }),
      User.countDocuments({ isActive: true })
    ]);

    return {
      commits: { rank: commitsRank + 1, total: totalUsers, percentile: Math.round((1 - commitsRank / totalUsers) * 100) },
      followers: { rank: followersRank + 1, total: totalUsers, percentile: Math.round((1 - followersRank / totalUsers) * 100) },
      repositories: { rank: reposRank + 1, total: totalUsers, percentile: Math.round((1 - reposRank / totalUsers) * 100) },
      contributions: { rank: contributionsRank + 1, total: totalUsers, percentile: Math.round((1 - contributionsRank / totalUsers) * 100) },
    };
  }

  static _calculateLanguageDiversity(languages) {
    if (!languages || languages.length === 0) return 0;
    
    // Calculate Shannon diversity index
    const total = languages.reduce((sum, lang) => sum + lang.percentage, 0);
    if (total === 0) return 0;
    
    let diversity = 0;
    languages.forEach(lang => {
      const proportion = lang.percentage / total;
      if (proportion > 0) {
        diversity -= proportion * Math.log2(proportion);
      }
    });
    
    return Math.round(diversity * 100) / 100;
  }

  static _calculateRepoLanguageDistribution(repos) {
    const languageCount = {};
    repos.forEach(repo => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
    });

    return Object.entries(languageCount)
      .map(([language, count]) => ({
        language,
        count,
        percentage: Math.round((count / repos.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  static _calculateConsistencyScore(analytics) {
    if (analytics.length === 0) return 0;
    
    const commitCounts = analytics.map(a => a.commits || 0);
    const nonZeroDays = commitCounts.filter(c => c > 0).length;
    const consistencyRatio = nonZeroDays / analytics.length;
    
    return Math.round(consistencyRatio * 100);
  }

  static _calculateProductivityScore(stats, days) {
    if (days === 0) return 0;
    
    const dailyAverage = (stats.commits + stats.pullRequests * 2 + stats.issues) / days;
    return Math.min(Math.round(dailyAverage * 10), 100);
  }

  static _calculateEngagementScore(user) {
    const followersWeight = Math.min(user.followers / 100, 50);
    const reposWeight = Math.min(user.publicRepos / 20, 25);
    const activityWeight = Math.min((user.totalCommits + user.totalPullRequests * 2) / 1000, 25);
    
    return Math.round(followersWeight + reposWeight + activityWeight);
  }

  static _calculateOverallScore(stats, user) {
    const activityScore = Math.min((stats.commits + stats.pullRequests * 3 + stats.issues * 2) / 100, 40);
    const socialScore = Math.min(user.followers / 50, 30);
    const repoScore = Math.min(user.publicRepos / 10, 30);
    
    return Math.round(activityScore + socialScore + repoScore);
  }

  static async _getUserComparison(user, userStats) {
    // Find similar users based on location or languages
    const similarUsers = await User.find({
      $or: [
        { location: user.location },
        { 'topLanguages.name': { $in: user.topLanguages?.map(l => l.name) || [] } }
      ],
      username: { $ne: user.username },
      isActive: true
    }).limit(100);

    if (similarUsers.length === 0) return null;

    const avgStats = {
      commits: Math.round(similarUsers.reduce((sum, u) => sum + (u.totalCommits || 0), 0) / similarUsers.length),
      followers: Math.round(similarUsers.reduce((sum, u) => sum + (u.followers || 0), 0) / similarUsers.length),
      repos: Math.round(similarUsers.reduce((sum, u) => sum + (u.publicRepos || 0), 0) / similarUsers.length),
    };

    return {
      sampleSize: similarUsers.length,
      userVsAverage: {
        commits: {
          user: user.totalCommits || 0,
          average: avgStats.commits,
          percentageDiff: avgStats.commits > 0 ? Math.round(((user.totalCommits || 0) - avgStats.commits) / avgStats.commits * 100) : 0,
        },
        followers: {
          user: user.followers || 0,
          average: avgStats.followers,
          percentageDiff: avgStats.followers > 0 ? Math.round(((user.followers || 0) - avgStats.followers) / avgStats.followers * 100) : 0,
        },
        repositories: {
          user: user.publicRepos || 0,
          average: avgStats.repos,
          percentageDiff: avgStats.repos > 0 ? Math.round(((user.publicRepos || 0) - avgStats.repos) / avgStats.repos * 100) : 0,
        },
      },
    };
  }

  static _calculateTrendStatistics(data, metric) {
    if (data.length === 0) return {};

    const values = data.map(d => d.primaryMetricValue);
    const trend = this._calculateTrendDirection(values);
    
    return {
      total: values.reduce((a, b) => a + b, 0),
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      trend: {
        direction: trend.direction,
        percentage: trend.percentage,
        isSignificant: Math.abs(trend.percentage) > 10,
      },
      volatility: Math.round(Helpers.calculateStandardDeviation(values)),
    };
  }

  static _calculateTrendDirection(values) {
    if (values.length < 2) return { direction: 'stable', percentage: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const percentageChange = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    let direction = 'stable';
    if (percentageChange > 5) direction = 'increasing';
    else if (percentageChange < -5) direction = 'decreasing';
    
    return {
      direction,
      percentage: Math.round(percentageChange),
    };
  }

  // Additional insight methods (simplified for brevity)
  static async _getActivityInsights(dateRange) {
    // Implementation for activity insights
    return { mostActiveDay: 'Monday', peakHours: '14:00-16:00', totalContributions: 0 };
  }

  static async _getLanguageInsights(dateRange) {
    // Implementation for language insights
    return { trending: [], declining: [], emerging: [] };
  }

  static async _getGeographicInsights(dateRange) {
    // Implementation for geographic insights
    return { mostActiveRegions: [], growthRegions: [] };
  }

  static async _getPerformanceInsights(dateRange) {
    // Implementation for performance insights
    return { topPerformers: [], improvements: [] };
  }

  static async _getGrowthInsights(dateRange) {
    // Implementation for growth insights
    return { userGrowth: 0, activityGrowth: 0, predictions: {} };
  }
}

module.exports = AnalyticsController;
