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
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    ALL_TIME: 'all_time',
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
    MAX_LIMIT: 100,
  },
  
  // Status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
  },
  
  // Error types
  ERROR_TYPES: {
    VALIDATION_ERROR: 'ValidationError',
    AUTHENTICATION_ERROR: 'AuthenticationError',
    AUTHORIZATION_ERROR: 'AuthorizationError',
    NOT_FOUND_ERROR: 'NotFoundError',
    RATE_LIMIT_ERROR: 'RateLimitError',
    GITHUB_API_ERROR: 'GitHubAPIError',
    DATABASE_ERROR: 'DatabaseError',
    INTERNAL_ERROR: 'InternalError',
  },
  
  // Regular expressions
  REGEX: {
    GITHUB_USERNAME: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
    GITHUB_REPO_NAME: /^[a-zA-Z0-9._-]+$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
  
  // Data limits
  LIMITS: {
    MAX_USERNAME_LENGTH: 39,
    MAX_REPO_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_USERS_PER_REQUEST: 100,
    MAX_REPOS_PER_USER: 1000,
  },
  
  // Default values
  DEFAULTS: {
    AVATAR_URL: 'https://github.com/identicons/default.png',
    BIO: 'No bio available',
    LOCATION: 'Unknown',
    COMPANY: 'Independent',
  },
};

// Export constants
module.exports = APP_CONSTANTS;
