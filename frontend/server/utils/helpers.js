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
      .replace(/[<>"'%;()&+]/g, '') // Remove potentially harmful characters
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
    
    // Handle different period formats
    const periodLower = (period || '30d').toLowerCase();
    
    // Handle numeric periods like '7d', '30d', '90d', '365d'
    const dayMatch = periodLower.match(/^(\d+)d$/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1]);
      start = moment(end).subtract(days, 'days');
    } else {
      switch (periodLower) {
        case 'daily':
        case '1d':
          start = moment(end).subtract(1, 'day');
          break;
        case 'weekly':
        case '7d':
          start = moment(end).subtract(7, 'days');
          break;
        case 'monthly':
        case '30d':
          start = moment(end).subtract(30, 'days');
          break;
        case 'quarterly':
        case '90d':
          start = moment(end).subtract(90, 'days');
          break;
        case 'yearly':
        case '365d':
          start = moment(end).subtract(365, 'days');
          break;
        case 'all_time':
          start = moment('2008-01-01'); // GitHub founded in 2008
          break;
        default:
          start = moment(end).subtract(30, 'days');
      }
    }
    
