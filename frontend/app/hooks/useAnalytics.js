import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { LOADING_STATES } from '../utils/constants';

export const useAnalytics = (params = {}) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await analyticsService.getGlobalAnalytics({ ...params, ...newParams });
      setAnalytics(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchAnalytics
  };
};

export const usePlatformInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchInsights = async (params = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await analyticsService.getPlatformInsights(params);
      setInsights(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return {
    insights,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchInsights
  };
};

export const useAnalyticsTrends = (params = {}) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchTrends = async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await analyticsService.getAnalyticsTrends({ ...params, ...newParams });
      setTrends(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return {
    trends,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchTrends
  };
};

export const useUserAnalytics = (username) => {
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchUserAnalytics = async (params = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await analyticsService.getUserAnalytics(username, params);
      const data = response.data;
      
      // Map the backend response structure to what the frontend expects
      const mappedAnalytics = {
        // Basic stats from lifetime statistics
        totalCommits: data.statistics?.lifetime?.commits || 0,
        totalPullRequests: data.statistics?.lifetime?.pullRequests || 0,
        totalIssues: data.statistics?.lifetime?.issues || 0,
        totalReviews: data.statistics?.lifetime?.reviews || 0,
        totalStars: data.repositoryAnalysis?.totalStars || 0,
        totalForks: data.repositoryAnalysis?.totalForks || 0,
        
        // Streak information
        currentStreak: data.statistics?.lifetime?.streak?.current || 0,
        longestStreak: data.statistics?.lifetime?.streak?.longest || 0,
        
        // Language analysis
        languages: data.languageAnalysis?.distribution || [],
        primaryLanguage: data.languageAnalysis?.primary?.name || null,
        
        // Repository analysis
        topRepo: data.repositoryAnalysis?.topRepositories?.[0] || null,
        avgStarsPerRepo: data.repositoryAnalysis?.averageStars || 0,
        
        // Activity timeline for charts
        activityTimeline: data.activityTimeline || [],
        
        // Performance metrics
        performanceMetrics: data.performanceMetrics || {}
      };
      
      setUserAnalytics(mappedAnalytics);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchUserAnalytics();
  }, [username]);

  return {
    userAnalytics,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchUserAnalytics
  };
};

export const useCompareUsers = () => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const compareUsers = async (usernames, params = {}) => {
    if (!usernames || usernames.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analyticsService.compareUsers(usernames, params);
      setComparison(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearComparison = () => {
    setComparison(null);
    setError(null);
  };

  return {
    comparison,
    loading,
    error,
    compareUsers,
    clearComparison
  };
};

export const useLanguageAnalytics = () => {
  const [languageData, setLanguageData] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchLanguageAnalytics = async (params = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await analyticsService.getLanguageAnalytics(params);
      setLanguageData(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchLanguageAnalytics();
  }, []);

  return {
    languageData,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchLanguageAnalytics
  };
};

export const useGrowthMetrics = (params = {}) => {
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchGrowthMetrics = async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await analyticsService.getGrowthMetrics({ ...params, ...newParams });
      setGrowthData(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchGrowthMetrics();
  }, []);

  return {
    growthData,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchGrowthMetrics
  };
};
