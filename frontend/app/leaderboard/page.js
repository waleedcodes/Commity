'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { useLeaderboard, useLeaderboardStats } from '../hooks/useLeaderboard';
import { formatNumber, formatDate } from '../utils/helpers';
import { LEADERBOARD_CATEGORIES, LEADERBOARD_TIMEFRAMES } from '../utils/constants';

export default function Leaderboard() {
  const [selectedCategory, setSelectedCategory] = useState('commits');
  const [selectedTimeframe, setSelectedTimeframe] = useState('allTime');
  const [searchQuery, setSearchQuery] = useState('');

  const { leaderboard, loading, refetch } = useLeaderboard({
    category: selectedCategory,
    timeframe: selectedTimeframe,
    search: searchQuery
  });
  
  const { stats, loading: statsLoading } = useLeaderboardStats();

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    refetch({ category, timeframe: selectedTimeframe });
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    refetch({ category: selectedCategory, timeframe });
  };

  const filteredLeaderboard = leaderboard?.filter(user => 
    !searchQuery || 
    user.login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-xl font-bold">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Leaderboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top GitHub Contributors</p>
              </div>
            </div>
            <Button onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : formatNumber(stats?.totalContributors || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : formatNumber(stats?.activeThisMonth || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : formatNumber(stats?.newThisWeek || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : formatNumber(stats?.totalCountries || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search */}
              <div>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(LEADERBOARD_CATEGORIES).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryChange(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timeframe Filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Timeframe</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(LEADERBOARD_TIMEFRAMES).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedTimeframe === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeframeChange(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>
              {LEADERBOARD_CATEGORIES[selectedCategory]} - {LEADERBOARD_TIMEFRAMES[selectedTimeframe]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                    </div>
                    <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeaderboard.map((user, index) => (
                  <div
                    key={user.id || user.login}
                    className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && (
                        <span className="text-lg font-bold text-slate-500">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} alt={user.login} />
                      <AvatarFallback>{user.login?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{user.name || user.login}</h3>
                        {user.location && (
                          <Badge variant="outline" className="text-xs">
                            {user.location}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.login}</p>
                      {user.company && (
                        <p className="text-xs text-muted-foreground">{user.company}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatNumber(user[selectedCategory] || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {LEADERBOARD_CATEGORIES[selectedCategory].toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredLeaderboard.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">No users found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
