const moment = require('moment');
const { REGEX, TIME } = require('../config/constants');

/**
 * Helper utility functions for the GitHub Analytics Tool
 */

class Helpers {
  
  /**
   * Validate GitHub username format
   * @param {string} username - GitHub username to validate
   * @returns {boolean} True if valid
   */
  static isValidGitHubUsername(username) {
    if (!username || typeof username !== 'string') {
      return false;
    }
    
    return REGEX.GITHUB_USERNAME.test(username) && username.length <= 39;
  }
  
  /**
   * Validate GitHub repository name format
   * @param {string} repoName - Repository name to validate
   * @returns {boolean} True if valid
   */
  static isValidRepoName(repoName) {
    if (!repoName || typeof repoName !== 'string') {
      return false;
    }
    
    return REGEX.GITHUB_REPO_NAME.test(repoName) && repoName.length <= 100;
  }
  
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    return REGEX.EMAIL.test(email);
  }
  
  /**
   * Sanitize user input by removing potentially harmful characters
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>\"'%;()&+]/g, '') // Remove potentially harmful characters
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }
  
  /**
   * Generate a random string of specified length
   * @param {number} length - Length of the string
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   */
  static generateRandomString(length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
  
  /**
   * Format large numbers with appropriate suffixes (K, M, B)
   * @param {number} num - Number to format
   * @param {number} precision - Decimal places
   * @returns {string} Formatted number string
   */
  static formatNumber(num, precision = 1) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    
    const absNum = Math.abs(num);
    
    if (absNum >= 1e9) {
      return (num / 1e9).toFixed(precision) + 'B';
    } else if (absNum >= 1e6) {
      return (num / 1e6).toFixed(precision) + 'M';
    } else if (absNum >= 1e3) {
      return (num / 1e3).toFixed(precision) + 'K';
    }
    
    return num.toString();
  }
  
  /**
   * Calculate percentage with precision
   * @param {number} value - Current value
   * @param {number} total - Total value
   * @param {number} precision - Decimal places
   * @returns {number} Percentage
   */
  static calculatePercentage(value, total, precision = 2) {
    if (!total || total === 0) {
      return 0;
    }
    
    return parseFloat(((value / total) * 100).toFixed(precision));
  }
  
  /**
   * Get date range for different periods
   * @param {string} period - Period type (daily, weekly, monthly, yearly)
   * @param {Date} endDate - End date (default: now)
   * @returns {object} Object with startDate and endDate
   */
  static getDateRange(period, endDate = new Date()) {
    const end = moment(endDate);
    let start;
    
    switch (period.toLowerCase()) {
      case 'daily':
        start = moment(end).subtract(1, 'day');
        break;
      case 'weekly':
        start = moment(end).subtract(1, 'week');
        break;
      case 'monthly':
        start = moment(end).subtract(1, 'month');
        break;
      case 'yearly':
        start = moment(end).subtract(1, 'year');
        break;
      case 'all_time':
        start = moment('2008-01-01'); // GitHub founded in 2008
        break;
      default:
        start = moment(end).subtract(1, 'month');
    }
    
    return {
      startDate: start.toDate(),
      endDate: end.toDate(),
    };
  }
  
  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @param {string} format - Moment.js format string
   * @returns {string} Formatted date string
   */
  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).format(format);
  }
  
  /**
   * Calculate time ago from date
   * @param {Date|string} date - Date to calculate from
   * @returns {string} Human-readable time ago string
   */
  static timeAgo(date) {
    return moment(date).fromNow();
  }
  
  /**
   * Deep clone an object
   * @param {any} obj - Object to clone
   * @returns {any} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
    
    return obj;
  }
  
  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Retry function execution with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} Promise that resolves with function result
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after sleep
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if value is empty (null, undefined, empty string, empty array, empty object)
   * @param {any} value - Value to check
   * @returns {boolean} True if empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }
  
  /**
   * Generate pagination metadata
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} totalItems - Total number of items
   * @returns {object} Pagination metadata
   */
  static generatePaginationMeta(page, limit, totalItems) {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    };
  }
  
  /**
   * Convert camelCase to snake_case
   * @param {string} str - String to convert
   * @returns {string} snake_case string
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  
  /**
   * Convert snake_case to camelCase
   * @param {string} str - String to convert
   * @returns {string} camelCase string
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }
  
  /**
   * Calculate contribution score based on different factors
   * @param {object} contributions - Contribution data
   * @returns {number} Calculated score
   */
  static calculateContributionScore(contributions) {
    const weights = {
      commits: 1,
      pullRequests: 3,
      issues: 2,
      reviews: 2,
      releases: 5,
    };
    
    let score = 0;
    Object.entries(contributions).forEach(([type, count]) => {
      if (weights[type]) {
        score += count * weights[type];
      }
    });
    
    return score;
  }
  
  /**
   * Generate color based on string hash
   * @param {string} str - String to generate color from
   * @returns {string} Hex color code
   */
  static generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - color.length) + color;
  }
  
  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = Helpers;
