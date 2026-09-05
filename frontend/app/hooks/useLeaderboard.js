import { useState, useEffect, useCallback } from 'react';
import { leaderboardService } from '../services/leaderboardService';
import { LOADING_STATES } from '../utils/constants';

export const useLeaderboard = (params = {}) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [regionSummary, setRegionSummary] = useState(null);

  const fetchLeaderboard = useCallback(async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const mergedParams = { limit: 100, ...params, ...newParams };
      if (mergedParams.timeframe === 'allTime') {
        mergedParams.timeframe = 'all_time';
      }
      const response = await leaderboardService.getLeaderboard(mergedParams);
      const userList = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.users || []);
      setLeaderboard(userList);
      setPagination(response.pagination);
      setRegionSummary(response.data?.regionSummary || null);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [params.category, params.timeframe, params.search, params.location, params.limit, params.page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading: loading === LOADING_STATES.LOADING,
    error,
    pagination,
    regionSummary,
    refetch: fetchLeaderboard
  };
};

export const useLeaderboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getLeaderboardStats();
      setStats(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchStats
  };
};

export const useTopContributors = (params = {}) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchTopContributors = useCallback(async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getTopContributors({ ...params, ...newParams });
      const list = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.users || response.data?.contributors || []);
      setContributors(list);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [params.category, params.period]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTopContributors();
  }, [fetchTopContributors]);

  return {
    contributors,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchTopContributors
  };
};

export const useUserRanking = (username) => {
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchUserRanking = useCallback(async (extraParams = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getUserRanking(username, extraParams);
      setRanking(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [username]);

  useEffect(() => {
    fetchUserRanking();
  }, [fetchUserRanking]);

  return {
    ranking,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchUserRanking
  };
};

export const useLocationLeaderboard = (location) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchLocationLeaderboard = useCallback(async (extraParams = {}) => {
    if (!location) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getLocationLeaderboard(location, extraParams);
      const list = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.users || []);
      setLeaderboard(list);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [location]);

  useEffect(() => {
    fetchLocationLeaderboard();
  }, [fetchLocationLeaderboard]);

  return {
    leaderboard,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchLocationLeaderboard
  };
};

export const useLanguageLeaderboard = (language) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchLanguageLeaderboard = useCallback(async (extraParams = {}) => {
    if (!language) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getLanguageLeaderboard(language, extraParams);
      const list = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.users || []);
      setLeaderboard(list);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [language]);

  useEffect(() => {
    fetchLanguageLeaderboard();
  }, [fetchLanguageLeaderboard]);

  return {
    leaderboard,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchLanguageLeaderboard
  };
};

export const useTrendingUsers = () => {
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchTrendingUsers = useCallback(async (extraParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getTrendingUsers(extraParams);
      const list = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.users || []);
      setTrendingUsers(list);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchTrendingUsers();
  }, [fetchTrendingUsers]);

  return {
    trendingUsers,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchTrendingUsers
  };
};
