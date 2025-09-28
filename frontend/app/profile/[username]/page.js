'use client';
import { useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
import { useUser, useUserActivity, useUserRepositories } from '../../hooks/useUsers';
import { useUserAnalytics } from '../../hooks/useAnalytics';
import { useUserRanking } from '../../hooks/useLeaderboard';
import { formatNumber, formatDate, formatRelativeTime, getLanguageColor } from '../../utils/helpers';

export default function UserProfile({ params }) {
  const { username } = use(params);
  const [activeTab, setActiveTab] = useState('overview');

  const { user, loading: userLoading, refreshUser } = useUser(username);
  const { activity, loading: activityLoading } = useUserActivity(username);
  const { repositories, loading: reposLoading } = useUserRepositories(username);
  const { userAnalytics, loading: analyticsLoading } = useUserAnalytics(username);
  const { ranking, loading: rankingLoading } = useUserRanking(username);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The user "{username}" could not be found.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl || user.avatar_url} alt={user.login} />
              <AvatarFallback className="text-2xl">
                {user.login?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {user.name || user.login}
                  </h1>
                  <p className="text-lg text-muted-foreground">@{user.login}</p>
                  {user.bio && (
                    <p className="text-slate-600 dark:text-slate-300 mt-2">{user.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.company && (
                      <div className="flex items-center space-x-1">
                        <span>🏢</span>
                        <span>{user.company}</span>
                      </div>
                    )}
                    {user.blog && (
                      <div className="flex items-center space-x-1">
                        <span>🔗</span>
                        <a 
                          href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} 
                          className="hover:text-blue-600" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {user.blog}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>Joined {formatDate(user.githubCreatedAt || user.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button onClick={refreshUser}>
                    Refresh Data
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(user.htmlUrl || `https://github.com/${user.login}`, '_blank')}
                  >
                    View on GitHub
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(user.publicRepos || user.public_repos || 0)}</div>
              <div className="text-sm text-muted-foreground">Repositories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(user.followers || 0)}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(user.following || 0)}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {rankingLoading ? '...' : (ranking?.globalRank || 'N/A')}
              </div>
              <div className="text-sm text-muted-foreground">Global Rank</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'repositories', label: 'Repositories' },
            { key: 'activity', label: 'Activity' },
            { key: 'analytics', label: 'Analytics' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                {rankingLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Global Rank</span>
                      <Badge variant="default">#{ranking?.globalRank || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Country Rank</span>
                      <Badge variant="secondary">#{ranking?.countryRank || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>City Rank</span>
                      <Badge variant="outline">#{ranking?.cityRank || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Language Rank</span>
                      <Badge variant="outline">#{ranking?.languageRank || 'N/A'}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Language Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Programming Languages</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userAnalytics?.languages?.map((lang) => (
                      <div key={lang.name} className="text-center">
                        <div 
                          className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getLanguageColor(lang.name) }}
                        >
                          {lang.percentage}%
                        </div>
                        <p className="text-sm font-medium">{lang.name}</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(lang.bytes)} bytes</p>
                      </div>
                    )) || (
                      <p className="col-span-full text-center text-muted-foreground">
                        No language data available
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'repositories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reposLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              repositories.slice(0, 12).map((repo) => (
                <Card key={repo.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <a 
                        href={repo.html_url} 
                        className="hover:text-blue-600 transition-colors"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {repo.name}
                      </a>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {repo.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        {repo.language && (
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            ></div>
                            <span>{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span>⭐</span>
                          <span>{repo.stargazers_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>🍴</span>
                          <span>{repo.forks_count}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatRelativeTime(repo.updated_at)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activity?.slice(0, 20).map((event, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-sm">
                          {event.type === 'PushEvent' && '📤'}
                          {event.type === 'CreateEvent' && '➕'}
                          {event.type === 'IssuesEvent' && '🐛'}
                          {event.type === 'PullRequestEvent' && '🔄'}
                          {event.type === 'WatchEvent' && '⭐'}
                          {event.type === 'ForkEvent' && '🍴'}
                          {!['PushEvent', 'CreateEvent', 'IssuesEvent', 'PullRequestEvent', 'WatchEvent', 'ForkEvent'].includes(event.type) && '📝'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{event.type.replace('Event', '')}</span>
                          {' '}in{' '}
                          <a 
                            href={`https://github.com/${event.repo?.name}`}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {event.repo?.name}
                          </a>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(event.created_at)}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Contribution Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Commits</span>
                      <span className="font-bold">{formatNumber(userAnalytics?.totalCommits || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Stars Received</span>
                      <span className="font-bold">{formatNumber(userAnalytics?.totalStars || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Forks</span>
                      <span className="font-bold">{formatNumber(userAnalytics?.totalForks || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contribution Streak</span>
                      <span className="font-bold">{userAnalytics?.currentStreak || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longest Streak</span>
                      <span className="font-bold">{userAnalytics?.longestStreak || 0} days</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repository Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Most Starred Repo</span>
                      <Badge variant="outline">{userAnalytics?.topRepo?.name || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Language</span>
                      <Badge variant="outline">{userAnalytics?.primaryLanguage || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Stars per Repo</span>
                      <span className="font-bold">{userAnalytics?.avgStarsPerRepo || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Public Repos</span>
                      <span className="font-bold">{user.publicRepos || user.public_repos || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Age</span>
                      <span className="font-bold">
                        {Math.floor((Date.now() - new Date(user.githubCreatedAt || user.created_at)) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
