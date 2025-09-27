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
      setUserAnalytics(response.data);
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
