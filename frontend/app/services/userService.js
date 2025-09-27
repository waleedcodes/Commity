import { apiService } from './api';

class UserService {
  // Get all users with pagination and filtering
  async getAllUsers(params = {}) {
    return apiService.get('/users', params);
  }

  // Search users by query
  async searchUsers(query, params = {}) {
    return apiService.get('/users/search', { q: query, ...params });
  }

  // Get user profile by username
  async getUserProfile(username) {
    return apiService.get(`/users/${username}`);
  }

  // Update user profile
  async updateUserProfile(username, data) {
    return apiService.put(`/users/${username}`, data);
  }

  // Get user repositories
  async getUserRepositories(username, params = {}) {
    return apiService.get(`/users/${username}/repos`, params);
  }

  // Get user activity
  async getUserActivity(username, params = {}) {
    return apiService.get(`/users/${username}/activity`, params);
  }

  // Refresh user data from GitHub
  async refreshUserData(username) {
    return apiService.post(`/users/${username}/refresh`);
  }

  // Get user analytics
  async getUserAnalytics(username, params = {}) {
    return apiService.get(`/users/${username}/analytics`, params);
  }

  // Get user statistics
  async getUserStats(username) {
    return apiService.get(`/users/${username}/stats`);
  }

  // Get user contributions
  async getUserContributions(username, params = {}) {
    return apiService.get(`/users/${username}/contributions`, params);
  }

  // Get user followers
  async getUserFollowers(username, params = {}) {
    return apiService.get(`/users/${username}/followers`, params);
  }

  // Get user following
  async getUserFollowing(username, params = {}) {
    return apiService.get(`/users/${username}/following`, params);
  }

  // Bulk update users
  async bulkUpdateUsers(data) {
    return apiService.post('/users/bulk-update', data);
  }

  // Add user to watchlist
  async addToWatchlist(username) {
    return apiService.post(`/users/${username}/watch`);
  }

  // Remove user from watchlist
  async removeFromWatchlist(username) {
    return apiService.delete(`/users/${username}/watch`);
  }
}

export const userService = new UserService();
