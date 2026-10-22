// Application constants
const APP_CONSTANTS = {
  // Application info
  APP_NAME: 'GitHub Analytics Tool',
  APP_VERSION: '1.0.0',
  API_VERSION: 'v1',
  
  // Environment
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
  
  // User roles
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
  },
  
  // Analytics periods
  ANALYTICS_PERIODS: {
    DAILY: '1d',
    WEEKLY: '7d', 
    MONTHLY: '30d',
    QUARTERLY: '90d',
    YEARLY: '365d',
    ALL_TIME: 'all_time',
    // Legacy support
    LEGACY_DAILY: 'daily',
    LEGACY_WEEKLY: 'weekly',
    LEGACY_MONTHLY: 'monthly',
    LEGACY_YEARLY: 'yearly',
  },
  
  // GitHub event types
  GITHUB_EVENTS: {
    PUSH: 'PushEvent',
    PULL_REQUEST: 'PullRequestEvent',
    ISSUES: 'IssuesEvent',
    FORK: 'ForkEvent',
    WATCH: 'WatchEvent',
    RELEASE: 'ReleaseEvent',
    CREATE: 'CreateEvent',
    DELETE: 'DeleteEvent',
  },
  
  // Contribution types
  CONTRIBUTION_TYPES: {
    COMMITS: 'commits',
