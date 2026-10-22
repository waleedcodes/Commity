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
