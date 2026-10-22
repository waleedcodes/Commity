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

