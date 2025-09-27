import { apiService } from './api';

class AnalyticsService {
  // Get global analytics overview
  async getGlobalAnalytics(params = {}) {
    return apiService.get('/analytics/global', params);
  }

  // Get platform insights and comprehensive analytics
  async getPlatformInsights(params = {}) {
    return apiService.get('/analytics/insights', params);
  }

  // Get analytics trends and patterns
  async getAnalyticsTrends(params = {}) {
    return apiService.get('/analytics/trends', params);
  }

  // Get user-specific analytics
  async getUserAnalytics(username, params = {}) {
    return apiService.get(`/analytics/user/${username}`, params);
  }

  // Compare multiple users
  async compareUsers(usernames, params = {}) {
    const usernamesQuery = Array.isArray(usernames) ? usernames.join(',') : usernames;
    return apiService.get('/analytics/compare', { users: usernamesQuery, ...params });
  }

  // Get contribution trends
  async getContributionTrends(params = {}) {
    return apiService.get('/analytics/trends', params);
  }

  // Get repository analytics
  async getRepositoryAnalytics(params = {}) {
    return apiService.get('/analytics/repositories', params);
  }

  // Get language analytics
  async getLanguageAnalytics(params = {}) {
    return apiService.get('/analytics/languages', params);
  }

  // Get activity patterns
  async getActivityPatterns(params = {}) {
    return apiService.get('/analytics/activity-patterns', params);
  }

  // Get growth metrics
  async getGrowthMetrics(params = {}) {
    return apiService.get('/analytics/growth', params);
  }

  // Get performance metrics
  async getPerformanceMetrics(params = {}) {
    return apiService.get('/analytics/performance', params);
  }

  // Get collaboration metrics
  async getCollaborationMetrics(params = {}) {
    return apiService.get('/analytics/collaboration', params);
  }

  // Get time-based analytics
  async getTimeBasedAnalytics(timeframe, params = {}) {
    return apiService.get(`/analytics/time/${timeframe}`, params);
  }

  // Get export data
  async exportAnalytics(format, params = {}) {
    return apiService.get(`/analytics/export/${format}`, params);
  }
}

export const analyticsService = new AnalyticsService();
