const https = require('https');
const User = require('../models/User');
const logger = require('../utils/logger');

// Cache mapping: countryKey -> { data, timestamp }
const ranksCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * CommittersService: Regional ranking service
 * Ingests authoritative committers.top rankings across the 3 core categories:
 * 1. All (Public + Private) -> countryRankAll
 * 2. Contributions (Public only) -> countryRankPublic
 * 3. Commits -> countryRankCommits
 */
class CommittersService {
  /**
   * Normalize country name to committers.top filename key
   * e.g. "Pakistan" -> "pakistan", "United States" -> "united_states"
   */
  static normalizeCountryKey(countryName) {
    if (!countryName || typeof countryName !== 'string') return null;
    const clean = countryName.trim().toLowerCase();
    const map = {
      'pakistan': 'pakistan',
      'united states': 'united_states',
      'usa': 'united_states',
      'india': 'india',
      'germany': 'germany',
      'france': 'france',
      'canada': 'canada',
      'japan': 'japan',
      'united kingdom': 'united_kingdom',
      'uk': 'united_kingdom',
      'singapore': 'singapore',
      'brazil': 'brazil',
      'netherlands': 'netherlands',
      'australia': 'australia',
      'china': 'china',
    };
    return map[clean] || clean.replace(/\s+/g, '_');
  }

  /**
   * Fetch official rank-only JSON from committers.top (with memory cache)
   * @param {string} countryKey e.g. 'pakistan', 'united_states'
   */
  static fetchOfficialRanks(countryKey = 'pakistan') {
    const key = this.normalizeCountryKey(countryKey) || 'pakistan';
    const cached = ranksCache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return Promise.resolve(cached.data);
    }

    return new Promise((resolve) => {
      const url = `https://committers.top/rank_only/${key}.json`;
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          logger.warn(`[CommittersService] committers.top returned status ${res.statusCode} for ${key}`);
          return resolve(null);
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            ranksCache.set(key, { data: parsed, timestamp: Date.now() });
            resolve(parsed);
          } catch {
            resolve(null);
          }
        });
      }).on('error', (err) => {
        logger.warn(`[CommittersService] Error fetching committers.top for ${key}: ${err.message}`);
        resolve(null);
      });
    });
  }

  /**
   * Get verified committers.top ranks for a specific user
   * @param {string} username
   * @param {string} countryName
   * @returns {Promise<object|null>}
   */
  static async getUserRanks(username, countryName = 'pakistan') {
    if (!username) return null;
    const countryKey = this.normalizeCountryKey(countryName);
    if (!countryKey) return null;

    const official = await this.fetchOfficialRanks(countryKey);
    if (!official) return null;

    const lower = username.toLowerCase();
    const findIndex = (arr) => {
      if (!Array.isArray(arr)) return null;
      const idx = arr.findIndex(u => typeof u === 'string' && u.toLowerCase() === lower);
      return idx !== -1 ? idx + 1 : null;
    };

    const countryRankAll = findIndex(official.user_private);
    const countryRankPublic = findIndex(official.user_public);
    const countryRankCommits = findIndex(official.user);

    return {
      country: countryName,
      countryKey,
      countryRankAll,
      countryRankPublic,
      countryRankCommits,
      countryRank: countryRankAll || countryRankPublic || countryRankCommits || null,
      isRanked: Boolean(countryRankAll || countryRankPublic || countryRankCommits),
      asOf: official.data_asof || null,
    };
  }

  /**
   * Ingest and synchronize a region's rankings in bulk
   */
  static async syncRegion(countryKey = 'pakistan', countryName = 'Pakistan') {
    const key = this.normalizeCountryKey(countryKey) || 'pakistan';
    logger.info(`📥 [CommittersService] Ingesting official 3-category rankings for '${countryName}'...`);
    try {
      const official = await this.fetchOfficialRanks(key);
