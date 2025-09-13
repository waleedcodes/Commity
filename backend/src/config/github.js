const { Octokit } = require('@octokit/rest');
const { graphql } = require('@octokit/graphql');
const logger = require('../utils/logger');

// GitHub API configuration
const createGitHubClient = () => {
  const auth = process.env.GITHUB_TOKEN;
  
  if (!auth) {
    logger.error('GITHUB_TOKEN is required but not provided');
    throw new Error('GitHub token is required. Please set GITHUB_TOKEN environment variable.');
  }

  const octokit = new Octokit({
    auth,
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
  });

  return octokit;
};

// GraphQL client for complex queries
const createGraphQLClient = () => {
  const auth = process.env.GITHUB_TOKEN;
  
  if (!auth) {
    throw new Error('GitHub token is required for GraphQL client');
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
