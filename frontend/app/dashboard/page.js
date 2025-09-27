'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { useAnalytics } from '../hooks/useAnalytics';
import { useUsers } from '../hooks/useUsers';
import { formatNumber, formatDate, getLanguageColor } from '../utils/helpers';

export default function Dashboard() {
  const { analytics, loading: analyticsLoading } = useAnalytics();
  const { users, loading: usersLoading } = useUsers({ limit: 5 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-xl font-bold">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">GitHub Analytics Overview</p>
              </div>
            </div>
            <Button>
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">👥</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.totalUsers || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repositories</CardTitle>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">📁</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.totalRepositories || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400">💾</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.totalCommits || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +23% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 dark:text-yellow-400">⚡</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.activeUsers || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  users.slice(0, 5).map((user, index) => (
                    <div key={user.id || index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} alt={user.login} />
                          <AvatarFallback>{user.login?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name || user.login}</p>
                          <p className="text-xs text-muted-foreground">@{user.login}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {formatNumber(user.public_repos || 0)} repos
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">New user registered: john-doe</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Repository analyzed: react-dashboard</p>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Leaderboard updated</p>
                    <p className="text-xs text-muted-foreground">10 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Data refresh completed</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Language Distribution */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Programming Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'JavaScript', percentage: 35, count: 1250 },
                { name: 'Python', percentage: 28, count: 980 },
                { name: 'TypeScript', percentage: 15, count: 530 },
                { name: 'Java', percentage: 12, count: 420 },
                { name: 'Go', percentage: 6, count: 210 },
                { name: 'Rust', percentage: 4, count: 140 }
              ].map((lang) => (
                <div key={lang.name} className="text-center">
                  <div 
                    className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: getLanguageColor(lang.name) }}
                  >
                    {lang.percentage}%
                  </div>
                  <p className="text-sm font-medium">{lang.name}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(lang.count)} repos</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
