import { apiService } from './api';

class LeaderboardService {
  // Get global leaderboard
  async getLeaderboard(params = {}) {
    return apiService.get('/leaderboard', params);
  }

  // Get leaderboard statistics and overview
  async getLeaderboardStats() {
    return apiService.get('/leaderboard/stats');
  }

  // Get top contributors
  async getTopContributors(params = {}) {
    return apiService.get('/leaderboard/contributors', params);
  }

  // Get top repositories
  async getTopRepositories(params = {}) {
    return apiService.get('/leaderboard/repositories', params);
  }

  // Get location-based leaderboard
  async getLocationLeaderboard(location, params = {}) {
    return apiService.get(`/leaderboard/location/${location}`, params);
  }

  // Get language-specific leaderboard
  async getLanguageLeaderboard(language, params = {}) {
    return apiService.get(`/leaderboard/language/${language}`, params);
  }

  // Get organization leaderboard
  async getOrganizationLeaderboard(org, params = {}) {
    return apiService.get(`/leaderboard/organization/${org}`, params);
  }

  // Get time-based leaderboard (daily, weekly, monthly, yearly)
  async getTimeBasedLeaderboard(timeframe, params = {}) {
    return apiService.get(`/leaderboard/time/${timeframe}`, params);
  }

  // Get category-specific leaderboard
  async getCategoryLeaderboard(category, params = {}) {
    return apiService.get(`/leaderboard/category/${category}`, params);
  }

  // Get user ranking
  async getUserRanking(username, params = {}) {
    return apiService.get(`/leaderboard/user/${username}/rank`, params);
  }

  // Get trending users
  async getTrendingUsers(params = {}) {
    return apiService.get('/leaderboard/trending', params);
  }

  // Get recent activity leaders
  async getRecentActivityLeaders(params = {}) {
    return apiService.get('/leaderboard/recent-activity', params);
  }

  // Get leaderboard filters/categories
  async getLeaderboardFilters() {
    return apiService.get('/leaderboard/filters');
  }
}

export const leaderboardService = new LeaderboardService();
