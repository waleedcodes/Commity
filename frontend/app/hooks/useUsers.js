import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { LOADING_STATES } from '../utils/constants';

export const useUsers = (params = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchUsers = async (newParams = {}) => {
    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getAllUsers({ ...params, ...newParams });
      setUsers(response.data);
      setPagination(response.pagination);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const fetchUser = async () => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserProfile(username);
      setUser(response.data.profile || response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  const refreshUser = async () => {
    if (!username) return;

    try {
      await userService.refreshUserData(username);
      await fetchUser(); // Refetch after refresh
    } catch (err) {
      setError(err.message);
    }
  };

  const updateUser = async (data) => {
    if (!username) return;

    try {
      const response = await userService.updateUserProfile(username, data);
      setUser(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchUser();
  }, [username]);

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

  const searchUsers = async (query, params = {}) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userService.searchUsers(query, params);
      setResults(response.data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

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

  const fetchActivity = async (params = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserActivity(username, params);
      setActivity(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [username]);

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

  const fetchRepositories = async (params = {}) => {
    if (!username) return;

    setLoading(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await userService.getUserRepositories(username, params);
      setRepositories(response.data);
      setLoading(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err.message);
      setLoading(LOADING_STATES.ERROR);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [username]);

  return {
    repositories,
    loading: loading === LOADING_STATES.LOADING,
    error,
    refetch: fetchRepositories
  };
};
