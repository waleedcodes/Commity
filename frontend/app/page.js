'use client';
import { useState, useEffect } from 'react';
import Image from "next/image";

export default function Home() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRepositories: 0,
    totalCommits: 0,
    activeUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to backend (replace with actual API call when backend is ready)
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call to http://localhost:5000/api/analytics
        // const response = await fetch('http://localhost:5000/api/analytics');
        // const data = await response.json();
        
        // Mock data for now
        setTimeout(() => {
          setStats({
            totalUsers: 1247,
            totalRepositories: 3521,
            totalCommits: 18943,
            activeUsers: 847
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-xl font-bold">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Commity Analytics
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">GitHub Analytics Tool</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#dashboard" className="text-gray-500 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 font-medium transition-colors">
                Dashboard
              </a>
              <a href="#leaderboard" className="text-gray-500 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 font-medium transition-colors">
                Leaderboard
              </a>
              <a href="#analytics" className="text-gray-500 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 font-medium transition-colors">
                Analytics
              </a>
              <a href="#profile" className="text-gray-500 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 font-medium transition-colors">
                Profile
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            GitHub Analytics
            <span className="block text-indigo-600 dark:text-indigo-400">Made Simple</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Track commits, analyze contributions, and visualize your GitHub activity with powerful analytics and leaderboards.
          </p>
          <div className="mt-8">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
              Connect GitHub Account
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">👥</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Total Users
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? '...' : stats.totalUsers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📁</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Repositories
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? '...' : stats.totalRepositories.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">💾</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Total Commits
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? '...' : stats.totalCommits.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Active Users
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoading ? '...' : stats.activeUsers.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-12 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md">
              🔗 Connect GitHub
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md">
              📊 View Dashboard
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md">
              🏆 Check Leaderboard
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-12">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Analytics Dashboard
            </h3>
            <p className="text-gray-500 dark:text-gray-300">
              Comprehensive analytics of your GitHub activity with beautiful visualizations and insights.
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-4">
              <span className="text-3xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Leaderboards
            </h3>
            <p className="text-gray-500 dark:text-gray-300">
              Compete with other developers and track your ranking in the global community.
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              User Profiles
            </h3>
            <p className="text-gray-500 dark:text-gray-300">
              Detailed profiles showing contribution history, achievements, and growth metrics.
            </p>
          </div>
        </div>

        {/* Phase 2 Progress */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🚧 Phase 2: Frontend Development Progress
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
              <span className="text-gray-700 dark:text-gray-300">React frontend implementation</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded mr-3"></div>
              <span className="text-gray-500 dark:text-gray-400">User dashboard and profiles</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded mr-3"></div>
              <span className="text-gray-500 dark:text-gray-400">Leaderboard visualization</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded mr-3"></div>
              <span className="text-gray-500 dark:text-gray-400">Analytics dashboard</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-300">
              &copy; 2025 Commity Analytics. Built with ❤️ by{' '}
              <a href="https://github.com/waleedcodes" className="text-indigo-600 hover:text-indigo-500 font-medium">
                WaleedCodes
              </a>
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              GitHub Analytics Tool • Next.js & Express.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
