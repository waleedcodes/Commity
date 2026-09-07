// [Commity Core Phase 2: Logic] cache.js
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

// Optional Redis client
let redisClient = null;
const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);

if (redisUrl) {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis connection retry limit reached. Falling back to in-memory cache.');
          return null;
        }
        return Math.min(times * 500, 2000);
      }
    });

    redisClient.connect().then(() => {
      logger.info('🚀 Redis connected successfully');
    }).catch(err => {
      logger.warn(`Redis connection warning: ${err.message}. Using in-memory cache.`);
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis error: ${err.message}`);
    });
  } catch (err) {
    logger.warn(`Could not initialize Redis client (${err.message}). Using in-memory cache.`);
  }
}

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
  
