import { useState, useEffect } from 'react';
import { leaderboardService } from '../services/leaderboardService';
import { LOADING_STATES } from '../utils/constants';

export const useLeaderboard = (params = {}) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchLeaderboard = async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getLeaderboard({ ...params, ...newParams });
      setLeaderboard(response.data);
      setPagination(response.pagination);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return {
    leaderboard,
    loading: loading === LOADING_STATES.LOADING,
    error,
    pagination,
    refetch: fetchLeaderboard
  };
};

export const useLeaderboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

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

  const fetchTopContributors = async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getTopContributors({ ...params, ...newParams });
      setContributors(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchTopContributors();
  }, []);

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

  const fetchUserRanking = async (params = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getUserRanking(username, params);
      setRanking(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchUserRanking();
  }, [username]);

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

  const fetchLocationLeaderboard = async (params = {}) => {
    if (!location) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getLocationLeaderboard(location, params);
      setLeaderboard(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchLocationLeaderboard();
  }, [location]);

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

  const fetchLanguageLeaderboard = async (params = {}) => {
    if (!language) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getLanguageLeaderboard(language, params);
      setLeaderboard(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchLanguageLeaderboard();
  }, [language]);

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

  const fetchTrendingUsers = async (params = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await leaderboardService.getTrendingUsers(params);
      setTrendingUsers(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchTrendingUsers();
  }, []);

  return {
    trendingUsers,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchTrendingUsers
  };
};
