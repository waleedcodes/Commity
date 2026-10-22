const GitHubService = require('./githubService');
const User = require('../models/User');
const RankingSnapshot = require('../models/RankingSnapshot');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

class GitHubRankingService {
  constructor() {
    this.githubService = new GitHubService();
  }

  /**
   * Step 1: Discover individual candidate developers in a region ordered by followers.
   * (GitHub API limitation: User search only supports sorting by followers, repositories, or joined date, not contributions.)
   * @param {string} region - Region name e.g. "Pakistan", "United States"
   * @param {object} options - Search options
   * @returns {Promise<{ totalUsersFound: number, candidates: Array }>}
   */
  async discoverCandidates(region, options = {}) {
    const limit = options.limit || 50;
    const cleanRegion = region.trim();
    const query = `location:"${cleanRegion}" type:user`;

    logger.info(`🔍 [GitHubRankingService] Discovering candidate developers for '${cleanRegion}'...`);

    try {
      const searchRes = await this.githubService.searchUsers(query, {
        sort: 'followers',
        order: 'desc',
        per_page: Math.min(limit, 100),
        page: options.page || 1,
      });

      const individualCandidates = (searchRes.users || []).filter(u => u.type !== 'Organization');

      return {
        totalUsersFound: searchRes.totalCount || individualCandidates.length,
        candidates: individualCandidates,
      };
    } catch (error) {
      logger.error(`[GitHubRankingService] Candidate discovery failed for '${cleanRegion}':`, error.message);
      throw error;
    }
  }

  /**
   * Step 2: Fetch genuine, verified contribution and profile metrics via GitHub GraphQL & REST.
   * NO fake multipliers (0.8, 0.15, 0.05). Stores exact numbers from GitHub.
   * @param {string} username - GitHub username
   * @returns {Promise<object>} Verified metrics
   */
  async fetchCandidateMetrics(username) {
    try {
      const [profile, contributions, languages] = await Promise.all([
        this.githubService.getUserProfile(username).catch(() => null),
        this.githubService.getUserContributions(username).catch(() => null),
        this.githubService.getUserLanguages(username).catch(() => []),
      ]);

      if (!profile) return null;

      const publicContribs = contributions?.publicContributions || 0;
      const privateContribs = contributions?.privateContributions || 0;
      const totalContributions = contributions?.totalContributions || (publicContribs + privateContribs);

      return {
        githubId: profile.githubId,
        username: profile.username.toLowerCase(),
        name: profile.name || profile.username,
        avatarUrl: profile.avatarUrl,
        htmlUrl: profile.htmlUrl,
        company: profile.company || null,
        location: profile.location || null,
        bio: profile.bio || null,
        followers: profile.followers || 0,
        following: profile.following || 0,
        publicRepos: profile.publicRepos || 0,
        totalContributions,
        publicContributions: publicContribs,
        privateContributions: privateContribs,
        totalCommits: contributions?.totalCommits || 0,
        totalPullRequests: contributions?.totalPullRequests || 0,
        totalIssues: contributions?.totalIssues || 0,
        totalReviews: contributions?.totalReviews || 0,
        contributionStreak: contributions?.contributionStreak || 0,
        longestStreak: contributions?.longestStreak || 0,
        contributionCalendar: contributions?.contributionCalendar || [],
        topLanguages: (languages || []).slice(0, 10),
        primaryLanguage: languages?.[0]?.name || null,
        dataQuality: 'verified',
        contributionSource: 'github_graphql',
      };
    } catch (error) {
      logger.warn(`[GitHubRankingService] Failed to fetch metrics for @${username}: ${error.message}`);
      return null;
    }
  }

  /**
   * Step 3: Full End-to-End Ranking Pipeline (committers.top architecture):
   * Candidate Discovery -> GraphQL Metrics -> Sort by Contributions -> Rank Top N -> Save Snapshot & Users.
   * @param {string} region - Region name (e.g. "Pakistan", "United States")
   * @param {object} options - Execution options
   * @returns {Promise<RankingSnapshot>}
   */
  async generateRegionalRanking(region = 'Pakistan', options = {}) {
    const startTime = Date.now();
    const candidateLimit = options.candidateLimit || 30;
    const topQuota = options.topQuota || 256;
    const regionKey = (options.regionKey || region).toLowerCase().trim().replace(/\s+/g, '_');

    logger.info(`🚀 [GitHubRankingService] Starting authentic ranking generation for '${region}' (Pool: ${candidateLimit}, Quota: ${topQuota})`);

    // 1. Discover individual candidates ordered by followers
    const { totalUsersFound, candidates } = await this.discoverCandidates(region, { limit: candidateLimit });
    logger.info(`📊 Discovered ${candidates.length} candidates for '${region}' (Total in region: ${totalUsersFound.toLocaleString()})`);

    // 2. Fetch verified GraphQL contributions in throttled batches
    const candidatePool = [];
    const batchSize = 5;

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(c => this.fetchCandidateMetrics(c.username))
      );

      for (const res of batchResults) {
        if (res.status === 'fulfilled' && res.value && res.value.totalContributions >= 0) {
          candidatePool.push(res.value);
        }
      }

      // Friendly rate-limit pause between batches
      if (i + batchSize < candidates.length) {
        await Helpers.sleep(200);
      }
    }

    // 3. Sort candidates by genuine totalContributions descending
    candidatePool.sort((a, b) => b.totalContributions - a.totalContributions);

    // 4. Assign authentic regional ranks (Top N)
    const rankedCandidates = candidatePool.slice(0, topQuota).map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));

    const minimumFollowers = rankedCandidates.length > 0
      ? rankedCandidates[rankedCandidates.length - 1].followers
      : 0;

    // 5. Upsert verified user records into MongoDB User collection
    let upsertedCount = 0;
    for (const cand of rankedCandidates) {
      try {
        await User.findOneAndUpdate(
          { username: cand.username },
          {
            $set: {
              name: cand.name,
