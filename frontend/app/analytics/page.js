'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAnalytics, usePlatformInsights, useAnalyticsTrends } from '../hooks/useAnalytics';
import { formatNumber, formatPercentage, calculateGrowthRate } from '../utils/helpers';
import { DATE_RANGES } from '../utils/constants';

export default function Analytics() {
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  
  const { analytics, loading: analyticsLoading, refetch } = useAnalytics({
    dateRange: selectedDateRange
  });
  
  const { insights, loading: insightsLoading } = usePlatformInsights();
  const { trends, loading: trendsLoading } = useAnalyticsTrends({
    dateRange: selectedDateRange
  });

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    refetch({ dateRange: range });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-xl font-bold">📈</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Analytics
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Platform Insights & Trends</p>
              </div>
            </div>
            <Button onClick={() => refetch()}>
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Time Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={selectedDateRange === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateRangeChange(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="text-2xl">👥</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.totalUsers || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <Badge variant={analytics?.userGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                  {formatPercentage(analytics?.userGrowth || 0)}
                </Badge>
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="text-2xl">⚡</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.activeUsers || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <Badge variant={analytics?.activeUserGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                  {formatPercentage(analytics?.activeUserGrowth || 0)}
                </Badge>
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repositories</CardTitle>
              <div className="text-2xl">📁</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.totalRepositories || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <Badge variant={analytics?.repoGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                  {formatPercentage(analytics?.repoGrowth || 0)}
                </Badge>
                {' '}from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
              <div className="text-2xl">💾</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : formatNumber(analytics?.totalCommits || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <Badge variant={analytics?.commitGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                  {formatPercentage(analytics?.commitGrowth || 0)}
                </Badge>
                {' '}from last period
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Programming Languages</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {insights?.topLanguages?.map((lang, index) => (
                    <div key={lang.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: lang.color }}></div>
                        <span className="font-medium">{lang.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(lang.count)} repos
                        </span>
                        <Badge variant="secondary">
                          {lang.percentage}%
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No language data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">New Users</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(trends?.newUsers || 0)}</div>
                      <Badge variant={trends?.newUsersGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                        {formatPercentage(trends?.newUsersGrowth || 0)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">New Repositories</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(trends?.newRepositories || 0)}</div>
                      <Badge variant={trends?.newReposGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                        {formatPercentage(trends?.newReposGrowth || 0)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">Total Commits</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(trends?.totalCommits || 0)}</div>
                      <Badge variant={trends?.commitsGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                        {formatPercentage(trends?.commitsGrowth || 0)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Active Contributors</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(trends?.activeContributors || 0)}</div>
                      <Badge variant={trends?.contributorsGrowth >= 0 ? "success" : "destructive"} className="text-xs">
                        {formatPercentage(trends?.contributorsGrowth || 0)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Daily Active Users</span>
                    <span>{insights?.engagement?.dailyActive || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${insights?.engagement?.dailyActive || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weekly Active Users</span>
                    <span>{insights?.engagement?.weeklyActive || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${insights?.engagement?.weeklyActive || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly Active Users</span>
                    <span>{insights?.engagement?.monthlyActive || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${insights?.engagement?.monthlyActive || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights?.topCountries?.map((country, index) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{country.flag}</span>
                      <span className="font-medium">{country.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {formatNumber(country.count)}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-muted-foreground">No country data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Repository Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Repository Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Average Stars per Repo</span>
                  <span className="font-bold">{insights?.repositories?.avgStars || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Forks per Repo</span>
                  <span className="font-bold">{insights?.repositories?.avgForks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Most Active Language</span>
                  <Badge variant="outline">{insights?.repositories?.topLanguage || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Private Repositories</span>
                  <span className="font-bold">{insights?.repositories?.privatePercentage || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
