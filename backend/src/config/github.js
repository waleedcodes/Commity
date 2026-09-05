const { Octokit } = require('@octokit/rest');
const { graphql } = require('@octokit/graphql');
const logger = require('../utils/logger');

const isTokenPlaceholder = (token) => {
  return !token || 
         token === 'your_github_personal_access_token_here' || 
         token.includes('your_github_personal_access_token') ||
         token.trim() === '';
};

// GitHub API configuration
const createGitHubClient = () => {
  const auth = process.env.GITHUB_TOKEN;
  const isPlaceholder = isTokenPlaceholder(auth);
  
  if (isPlaceholder) {
    logger.warn('Valid GITHUB_TOKEN not provided. Using unauthenticated GitHub client.');
  }

  const clientOptions = {
    userAgent: 'GitHub-Analytics-Tool/1.0.0',
    timeZone: 'UTC',
    throttle: {
      onRateLimit: (retryAfter, options, octokit) => {
        logger.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds for ${options.method} ${options.url}`);
        return true;
      },
      onAbuseLimit: (retryAfter, options, octokit) => {
        logger.error(`Abuse detection triggered for ${options.method} ${options.url}`);
        return false;
      },
    },
  };

  if (!isPlaceholder) {
    clientOptions.auth = auth;
  }

  return new Octokit(clientOptions);
};

// GraphQL client for complex queries
const createGraphQLClient = () => {
  const auth = process.env.GITHUB_TOKEN;
  const isPlaceholder = isTokenPlaceholder(auth);
  
  if (isPlaceholder) {
    return async () => {
      throw new Error('GraphQL requires a valid GITHUB_TOKEN');
    };
  }

  return graphql.defaults({
    headers: {
      authorization: `token ${auth}`,
    },
  });
};

// GitHub API endpoints and configurations
const GITHUB_CONFIG = {
  // API endpoints
  BASE_URL: 'https://api.github.com',
  GRAPHQL_URL: 'https://api.github.com/graphql',
  
  // Rate limits
  REST_RATE_LIMIT: 5000, // requests per hour
  GRAPHQL_RATE_LIMIT: 5000, // points per hour
  
  // Pagination
  DEFAULT_PER_PAGE: 30,
  MAX_PER_PAGE: 100,
  
  // Cache settings
  CACHE_TTL: 300, // 5 minutes in seconds
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Verify GitHub token validity
const verifyGitHubToken = async () => {
  try {
    const octokit = createGitHubClient();
    const { data } = await octokit.rest.users.getAuthenticated();
    
    logger.info(`✅ GitHub token verified for user: ${data.login}`);
    return {
      valid: true,
      user: data,
      scopes: data.scopes || [],
    };
  } catch (error) {
    logger.error('❌ GitHub token verification failed:', error.message);
    return {
      valid: false,
      error: error.message,
    };
  }
};

// Get rate limit status
const getRateLimit = async () => {
  try {
    const octokit = createGitHubClient();
    const { data } = await octokit.rest.rateLimit.get();
    
    return {
      core: data.rate,
      search: data.search,
      graphql: data.graphql,
      integration_manifest: data.integration_manifest,
    };
  } catch (error) {
    logger.error('Error fetching rate limit:', error.message);
    throw error;
  }
};

module.exports = {
  createGitHubClient,
  createGraphQLClient,
  GITHUB_CONFIG,
  verifyGitHubToken,
  getRateLimit,
};
