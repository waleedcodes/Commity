const NodeCache = require('node-cache');
const logger = require('./logger');
const { CACHE_KEYS, TIME } = require('../config/constants');

// Cache configurations for different data types
const cacheConfigs = {
  // User profile data - cache for 5 minutes
  [CACHE_KEYS.USER_PROFILE]: {
    stdTTL: 5 * 60, // 5 minutes
    checkperiod: 60, // Check for expired keys every minute
  },
  
  // User repositories - cache for 10 minutes
  [CACHE_KEYS.USER_REPOS]: {
    stdTTL: 10 * 60, // 10 minutes
    checkperiod: 120, // Check every 2 minutes
  },
  
  // User events - cache for 2 minutes (more dynamic data)
  [CACHE_KEYS.USER_EVENTS]: {
    stdTTL: 2 * 60, // 2 minutes
    checkperiod: 30, // Check every 30 seconds
  },
  
  // User analytics - cache for 10 minutes
  [CACHE_KEYS.USER_ANALYTICS]: {
    stdTTL: 10 * 60, // 10 minutes
    checkperiod: 120, // Check every 2 minutes
  },
  
  // Leaderboard data - cache for 15 minutes
  [CACHE_KEYS.LEADERBOARD]: {
    stdTTL: 15 * 60, // 15 minutes
    checkperiod: 180, // Check every 3 minutes
  },
  
  // Analytics data - cache for 30 minutes
  [CACHE_KEYS.ANALYTICS]: {
    stdTTL: 30 * 60, // 30 minutes
    checkperiod: 300, // Check every 5 minutes
  },
  
  // Rate limit data - cache for 1 hour
  [CACHE_KEYS.RATE_LIMIT]: {
    stdTTL: 60 * 60, // 1 hour
    checkperiod: 600, // Check every 10 minutes
  },
};

// Create cache instances
const caches = {};

Object.keys(cacheConfigs).forEach(cacheType => {
  caches[cacheType] = new NodeCache(cacheConfigs[cacheType]);
  
  // Set up event listeners for monitoring
  caches[cacheType].on('set', (key, value) => {
    logger.debug(`Cache SET: ${cacheType}:${key}`);
  });
  
  caches[cacheType].on('get', (key, value) => {
    logger.debug(`Cache GET: ${cacheType}:${key} - ${value ? 'HIT' : 'MISS'}`);
  });
  
  caches[cacheType].on('del', (key, value) => {
    logger.debug(`Cache DEL: ${cacheType}:${key}`);
  });
  
  caches[cacheType].on('expired', (key, value) => {
    logger.debug(`Cache EXPIRED: ${cacheType}:${key}`);
  });
});

// Cache utility class
class CacheManager {
  
  /**
   * Get value from cache
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found
   */
  static get(cacheType, key) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        logger.warn(`Cache type ${cacheType} not found`);
        return null;
      }
      
      const value = cache.get(key);
      return value || null;
    } catch (error) {
      logger.error(`Error getting from cache ${cacheType}:${key}:`, error.message);
      return null;
    }
  }
  
  /**
   * Set value in cache
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Optional TTL in seconds
   * @returns {boolean} Success status
   */
  static set(cacheType, key, value, ttl = null) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        logger.warn(`Cache type ${cacheType} not found`);
        return false;
      }
      
      const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
      
      if (success) {
        logger.debug(`Cache SET success: ${cacheType}:${key}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error setting cache ${cacheType}:${key}:`, error.message);
      return false;
    }
  }
  
  /**
   * Delete value from cache
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  static del(cacheType, key) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        logger.warn(`Cache type ${cacheType} not found`);
        return 0;
      }
      
      return cache.del(key);
    } catch (error) {
      logger.error(`Error deleting from cache ${cacheType}:${key}:`, error.message);
      return 0;
    }
  }
  
  /**
   * Check if key exists in cache
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  static has(cacheType, key) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        return false;
      }
      
      return cache.has(key);
    } catch (error) {
      logger.error(`Error checking cache ${cacheType}:${key}:`, error.message);
      return false;
    }
  }
  
  /**
   * Get cache statistics
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @returns {object} Cache statistics
   */
  static getStats(cacheType) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        return null;
      }
      
      return cache.getStats();
    } catch (error) {
      logger.error(`Error getting cache stats for ${cacheType}:`, error.message);
      return null;
    }
  }
  
  /**
   * Clear all entries from a specific cache
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @returns {void}
   */
  static flush(cacheType) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        logger.warn(`Cache type ${cacheType} not found`);
        return;
      }
      
      cache.flushAll();
      logger.info(`Cache flushed: ${cacheType}`);
    } catch (error) {
      logger.error(`Error flushing cache ${cacheType}:`, error.message);
    }
  }
  
  /**
   * Clear all caches
   * @returns {void}
   */
  static flushAll() {
    try {
      Object.keys(caches).forEach(cacheType => {
        this.flush(cacheType);
      });
      logger.info('All caches flushed');
    } catch (error) {
      logger.error('Error flushing all caches:', error.message);
    }
  }
  
  /**
   * Get cache keys
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @returns {string[]} Array of cache keys
   */
  static keys(cacheType) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        return [];
      }
      
      return cache.keys();
    } catch (error) {
      logger.error(`Error getting cache keys for ${cacheType}:`, error.message);
      return [];
    }
  }
  
  /**
   * Set TTL for existing cache entry
   * @param {string} cacheType - Type of cache (from CACHE_KEYS)
   * @param {string} key - Cache key
   * @param {number} ttl - TTL in seconds
   * @returns {boolean} Success status
   */
  static ttl(cacheType, key, ttl) {
    try {
      const cache = caches[cacheType];
      if (!cache) {
        return false;
      }
      
      return cache.ttl(key, ttl);
    } catch (error) {
      logger.error(`Error setting TTL for cache ${cacheType}:${key}:`, error.message);
      return false;
    }
  }
  
  /**
   * Generate cache key with prefix
   * @param {string} prefix - Key prefix
   * @param {string|number} identifier - Unique identifier
   * @param {string} suffix - Optional suffix
   * @returns {string} Generated cache key
   */
  static generateKey(prefix, identifier, suffix = '') {
    const key = `${prefix}:${identifier}${suffix ? `:${suffix}` : ''}`;
    return key.toLowerCase().replace(/[^a-z0-9:_-]/g, '_');
  }
  
  /**
   * Cache wrapper function - get from cache or execute function and cache result
   * @param {string} cacheType - Type of cache
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @param {number} ttl - Optional TTL in seconds
   * @returns {Promise<any>} Cached or computed value
   */
  static async getOrSet(cacheType, key, fn, ttl = null) {
    try {
      // Try to get from cache first
      let value = this.get(cacheType, key);
      
      if (value !== null) {
        logger.debug(`Cache HIT: ${cacheType}:${key}`);
        return value;
      }
      
      // Cache miss - execute function
      logger.debug(`Cache MISS: ${cacheType}:${key} - executing function`);
      value = await fn();
      
      // Cache the result
      if (value !== null && value !== undefined) {
        this.set(cacheType, key, value, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error(`Error in cache getOrSet ${cacheType}:${key}:`, error.message);
      // If caching fails, still try to execute the function
      try {
        return await fn();
      } catch (fnError) {
        logger.error(`Function execution failed in getOrSet:`, fnError.message);
        throw fnError;
      }
    }
  }
  
  /**
   * Get overall cache health status
   * @returns {object} Cache health information
   */
  static getHealthStatus() {
    const status = {
      healthy: true,
      caches: {},
      totalKeys: 0,
      totalHits: 0,
      totalMisses: 0,
    };
    
    try {
      Object.keys(caches).forEach(cacheType => {
        const stats = this.getStats(cacheType);
        const keys = this.keys(cacheType);
        
        status.caches[cacheType] = {
          keys: keys.length,
          stats: stats,
        };
        
        status.totalKeys += keys.length;
        if (stats) {
          status.totalHits += stats.hits;
          status.totalMisses += stats.misses;
        }
      });
      
      status.hitRate = status.totalHits + status.totalMisses > 0 
        ? (status.totalHits / (status.totalHits + status.totalMisses) * 100).toFixed(2) + '%'
        : '0%';
        
    } catch (error) {
      logger.error('Error getting cache health status:', error.message);
      status.healthy = false;
      status.error = error.message;
    }
    
    return status;
  }
}

module.exports = CacheManager;
