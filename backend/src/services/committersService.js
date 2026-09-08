const https = require('https');
const User = require('../models/User');
const GitHubRankingService = require('./githubRankingService');
const logger = require('../utils/logger');

/**
 * CommittersService: Regional ranking service
 * Ingests official committers.top rankings across the 3 core categories:
 * 1. All (Public + Private) -> countryRankAll (e.g. #38)
 * 2. Contributions (Public only) -> countryRankPublic (e.g. #66)
 * 3. Commits -> countryRankCommits (e.g. #104)
 */
class CommittersService {
  /**
   * Fetch official rank-only JSON from committers.top
   * @param {string} countryKey e.g. 'pakistan', 'united_states'
   */
  static fetchOfficialRanks(countryKey = 'pakistan') {
    return new Promise((resolve) => {
      const url = `https://committers.top/rank_only/${countryKey}.json`;
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          return resolve(null);
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  }

  /**
   * Ingest and synchronize a region's rankings
   */
  static async syncRegion(countryKey = 'pakistan', countryName = 'Pakistan') {
    logger.info(`📥 [CommittersService] Ingesting official 3-category rankings for '${countryName}'...`);
    try {
      const official = await this.fetchOfficialRanks(countryKey);
      if (official) {
        if (Array.isArray(official.user_private)) {
          for (let i = 0; i < official.user_private.length; i++) {
            await User.updateOne(
              { username: official.user_private[i].toLowerCase() },
              { $set: { countryRankAll: i + 1, countryRank: i + 1 } }
            );
          }
        }
        if (Array.isArray(official.user_public)) {
          for (let i = 0; i < official.user_public.length; i++) {
            await User.updateOne(
              { username: official.user_public[i].toLowerCase() },
              { $set: { countryRankPublic: i + 1 } }
            );
          }
        }
        if (Array.isArray(official.user)) {
          for (let i = 0; i < official.user.length; i++) {
            await User.updateOne(
              { username: official.user[i].toLowerCase() },
              { $set: { countryRankCommits: i + 1 } }
            );
          }
        }
        logger.info(`✅ [CommittersService] Successfully updated 3-category ranks for ${countryName}`);
      }

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
