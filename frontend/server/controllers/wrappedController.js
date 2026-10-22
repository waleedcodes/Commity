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
        
        const privateContributions = user.privateContributions ?? 
          Math.max(0, totalContributions - publicContributions);

        const commits = user.totalCommits || 0;
        const pullRequests = user.totalPullRequests || 0;
        const codeReviews = user.totalReviews || 0;
        const issues = user.totalIssues || 0;
        const longestStreak = user.longestStreak || user.contributionStreak || 0;
        const currentStreak = user.contributionStreak || 0;
        const followers = user.followers || 0;
        const publicRepos = user.publicRepos || 0;

        // Top languages & dominant craft
        const topLanguages = (user.topLanguages || []).slice(0, 5);
        const primaryLanguage = topLanguages[0]?.name || 'JavaScript';
        const primaryPercentage = Math.round(topLanguages[0]?.percentage || 0);

        // Location & National rankings
        const country = Helpers.normalizeCountry(user.location) || 'Worldwide';
        const isPakistan = (user.location || '').toLowerCase().includes('pakistan');
        const countryRank = user.countryRankAll || user.countryRank || null;
        const countryRankPublic = user.countryRankPublic || null;
        const countryRankCommits = user.countryRankCommits || null;

        let nationalPercentile = null;
        if (countryRank) {
          const totalInCohort = isPakistan ? 160760 : 500000;
          const pct = ((countryRank / totalInCohort) * 100);
          nationalPercentile = pct < 0.01 ? `Top ${pct.toFixed(4)}%` : pct < 0.1 ? `Top ${pct.toFixed(3)}%` : `Top ${pct.toFixed(2)}%`;
        }

        // Global developer percentile standing
        let globalPercentile = 'Top 5% Active Developer';
        if (followers >= 5000 || totalContributions >= 10000) {
          globalPercentile = 'Top 0.05% Globally';
        } else if (followers >= 1000 || totalContributions >= 5000) {
          globalPercentile = 'Top 0.1% Globally';
        } else if (followers >= 300 || totalContributions >= 2500) {
          globalPercentile = 'Top 0.5% Globally';
        } else if (followers >= 69 || totalContributions >= 1000) {
          globalPercentile = 'Top 1% Globally';
        } else if (followers >= 20 || totalContributions >= 300) {
          globalPercentile = 'Top 2% Globally';
        }

        // Algorithmic Developer Archetype Engine
        let archetype = {
          title: 'The Code Craftsman',
          badge: '🛠️ Code Craftsman',
          tagline: 'Laser-focused builder quietly engineering resilient software',
          theme: 'from-blue-600 via-indigo-600 to-violet-700',
          accentColor: '#3b82f6',
          quote: 'Quality is not an act, it is a habit.',
          description: 'Steadily shipping meaningful code, prioritizing stability, clean execution, and dependable repositories.'
        };

        if (longestStreak >= 45 || currentStreak >= 30) {
          archetype = {
            title: 'The Streak Titan',
            badge: '🔥 Streak Titan',
            tagline: 'Unbreakable rhythm with unrelenting daily coding endurance',
            theme: 'from-amber-500 via-orange-600 to-rose-700',
            accentColor: '#f59e0b',
            quote: 'Consistency is the ultimate competitive advantage.',
            description: 'Day in and day out, your contribution graph remains ablaze. You push code relentlessly regardless of holidays or weekends.'
          };
        } else if (pullRequests >= 25 || codeReviews >= 15 || followers >= 250) {
          archetype = {
            title: 'The Open Source Pillar',
            badge: '🏛️ Open Source Pillar',
            tagline: 'Community champion multiplying the impact of developer ecosystems',
            theme: 'from-emerald-500 via-teal-600 to-cyan-700',
            accentColor: '#10b981',
            quote: 'We rise by lifting others in open source.',
            description: 'You believe code is a collaborative art. Your PRs, reviews, and community engagement elevate entire open source repositories.'
          };
        } else if (topLanguages.length >= 4) {
          archetype = {
            title: 'The Polyglot Architect',
            badge: '🌐 Polyglot Architect',
            tagline: 'Effortlessly navigating multi-ecosystem stacks and paradigms',
            theme: 'from-purple-600 via-fuchsia-600 to-indigo-700',
            accentColor: '#a855f7',
            quote: 'The right tool for the right problem.',
            description: 'You refuse to be confined to a single syntax. From backend logic to frontend craft, you adapt fluidly across languages.'
          };
        } else if (totalContributions >= 2000 || commits >= 400) {
          archetype = {
            title: 'Full-Stack Velocity Demon',
