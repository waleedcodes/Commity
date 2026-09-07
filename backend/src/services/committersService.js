const GitHubRankingService = require('./githubRankingService');
const logger = require('../utils/logger');

/**
 * CommittersService: Regional ranking service
 * Upgraded to use direct GitHub GraphQL candidate discovery and ranking
 * (committers.top architecture) without fragile HTML scraping or fake multipliers.
 */
class CommittersService {
  /**
   * Ingest/Sync a region's developers directly via GitHub GraphQL
   * @param {string} countryKey e.g. 'pakistan', 'united_states', 'india'
   * @param {string} countryName e.g. 'Pakistan'
   */
  static async syncRegion(countryKey = 'pakistan', countryName = 'Pakistan') {
    logger.info(`📥 [CommittersService] Delegating regional sync for '${countryName}' to GitHubRankingService...`);
    try {
      const snapshot = await GitHubRankingService.generateRegionalRanking(countryName, {
        regionKey: countryKey,
        candidateLimit: 30,
        topQuota: 256,
      });

      return {
        country: countryName,
        totalUsersInRegion: snapshot.totalUsersFound,
        minFollowers: snapshot.minimumFollowers,
        generatedAt: snapshot.generatedAt.toISOString(),
        totalIndexed: snapshot.usersRanked,
        dataSource: snapshot.dataSource,
      };
    } catch (error) {
      logger.error(`[CommittersService] Error syncing region '${countryName}':`, error.message);
      throw error;
    }
  }
}

module.exports = CommittersService;
