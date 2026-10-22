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
    PULL_REQUESTS: 'pull_requests',
    ISSUES: 'issues',
    REVIEWS: 'reviews',
    RELEASES: 'releases',
  },
  
  // Leaderboard categories
  LEADERBOARD_CATEGORIES: {
    COMMITS: 'commits',
    REPOSITORIES: 'repositories',
    FOLLOWERS: 'followers',
    CONTRIBUTIONS: 'contributions',
    PUBLIC_CONTRIBUTIONS: 'public_contributions',
    PRIVATE_CONTRIBUTIONS: 'private_contributions',
    STREAK: 'streak',
  },
  
  // Cache keys
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    USER_REPOS: 'user_repos',
    USER_EVENTS: 'user_events',
    USER_ANALYTICS: 'user_analytics',
    LEADERBOARD: 'leaderboard',
    ANALYTICS: 'analytics',
    RATE_LIMIT: 'rate_limit',
  },
  
  // Time constants (in milliseconds)
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000,
  },
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 1000,
  },
  
  // Status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
