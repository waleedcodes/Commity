import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { LOADING_STATES } from '../utils/constants';

export const useUsers = (params = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchUsers = useCallback(async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getAllUsers({ ...params, ...newParams });
      const rawData = response.data;
      const userList = Array.isArray(rawData) ? rawData : (rawData?.users || []);
      setUsers(userList);
      setPagination(response.pagination);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [params.page, params.limit, params.sort, params.order]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refetch = (newParams = {}) => fetchUsers(newParams);

  return {
    users,
    loading: loading === LOADING_STATES.LOADING,
    error,
    pagination,
    refetch
  };
};

export const useUser = (username) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserProfile(username);
      setUser(response.data?.profile || response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [username]);

  const refreshUser = useCallback(async () => {
    if (!username) return;

    try {
      await userService.refreshUserData(username);
      await fetchUser();
    } catch (err) {
      setError(err.message);
    }
  }, [username, fetchUser]);

  const updateUser = useCallback(async (data) => {
    if (!username) return;

    try {
      const response = await userService.updateUserProfile(username, data);
      setUser(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [username]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchUser,
    refreshUser,
    updateUser
  };
};

export const useUserSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchUsers = useCallback(async (query, params = {}) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userService.searchUsers(query, params);
      const rawData = response.data;
      setResults(Array.isArray(rawData) ? rawData : (rawData?.users || []));
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchUsers,
    clearResults
  };
};

export const useUserActivity = (username) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchActivity = useCallback(async (params = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserActivity(username, params);
      const rawData = response.data;
      setActivity(Array.isArray(rawData) ? rawData : (rawData?.events || []));
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [username]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activity,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchActivity
  };
};

export const useUserRepositories = (username) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchRepositories = useCallback(async (params = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserRepositories(username, params);
      const rawData = response.data;
      setRepositories(Array.isArray(rawData) ? rawData : (rawData?.repositories || []));
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [username]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  return {
    repositories,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchRepositories
  };
};

export const useUserStreak = (username) => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const fetchStreak = useCallback(async () => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserStreak(username);
      setStreak(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  }, [username]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchStreak
  };
};
