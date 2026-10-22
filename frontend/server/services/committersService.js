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
