// Date range constants
export const DATE_RANGES = {
  '7d': { label: '7 Days', value: 7 },
  '30d': { label: '30 Days', value: 30 },
  '90d': { label: '3 Months', value: 90 },
  '365d': { label: '1 Year', value: 365 },
  'all': { label: 'All Time', value: null }
};

// Leaderboard categories
export const LEADERBOARD_CATEGORIES = {
  commits: 'Total Commits',
  repositories: 'Public Repositories',
  followers: 'Followers',
  contributions: 'Contributions',
  stars: 'Stars Received',
  streak: 'Current Streak'
};

// Leaderboard time frames
export const LEADERBOARD_TIMEFRAMES = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  yearly: 'This Year',
  allTime: 'All Time'
};

// User activity types
export const ACTIVITY_TYPES = {
  commit: 'Commit',
  push: 'Push',
  pull_request: 'Pull Request',
  issue: 'Issue',
  star: 'Star',
  fork: 'Fork',
  watch: 'Watch',
  release: 'Release'
};

// Chart colors
export const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
];

// API endpoints
export const API_ENDPOINTS = {
  USERS: '/users',
  ANALYTICS: '/analytics',
  LEADERBOARD: '/leaderboard'
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'commity_theme',
  USER_PREFERENCES: 'commity_user_preferences',
  CACHE_PREFIX: 'commity_cache_'
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  USER_NOT_FOUND: 'User not found. Please check the username.',
  INVALID_USERNAME: 'Invalid GitHub username format.',
  RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
  SERVER_ERROR: 'Server error occurred. Please try again.',
  GENERIC_ERROR: 'An unexpected error occurred.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  DATA_REFRESHED: 'Data refreshed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  USER_ADDED: 'User added to watchlist',
  USER_REMOVED: 'User removed from watchlist'
};

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Status indicators
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  ERROR: 'error'
};

// File size limits
export const FILE_LIMITS = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// URL patterns
export const URL_PATTERNS = {
  GITHUB_USERNAME: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
  GITHUB_REPO: /^[a-z\d](?:[a-z\d]|[._-](?=[a-z\d])){0,99}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
};

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};
