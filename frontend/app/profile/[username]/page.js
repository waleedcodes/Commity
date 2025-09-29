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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'repositories', label: 'Repositories', icon: '📁' },
              { key: 'activity', label: 'Activity', icon: '📈' },
              { key: 'analytics', label: 'Analytics', icon: '🔍' }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center space-x-2"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <span>📊</span>
              <span>{formatNumber(user.publicRepos || 0)} repos</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>👥</span>
              <span>{formatNumber(user.followers || 0)} followers</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>⭐</span>
              <span>{formatNumber(userAnalytics?.totalStars || 0)} stars</span>
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Rankings */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Rankings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center py-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div>
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="flex items-center space-x-2">
                        <span>🌍</span>
                        <span className="font-medium">Global Rank</span>
                      </span>
                      <Badge 
                        variant={ranking?.globalRank ? "default" : "secondary"}
                        className="font-mono"
                      >
                        #{ranking?.globalRank || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="flex items-center space-x-2">
                        <span>🇵🇰</span>
                        <span className="font-medium">Country Rank</span>
                      </span>
                      <Badge 
                        variant={ranking?.countryRank ? "secondary" : "outline"}
                        className="font-mono"
                      >
                        #{ranking?.countryRank || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="flex items-center space-x-2">
                        <span>🏙️</span>
                        <span className="font-medium">City Rank</span>
                      </span>
                      <Badge 
                        variant={ranking?.cityRank ? "outline" : "outline"}
                        className="font-mono"
                      >
                        #{ranking?.cityRank || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center space-x-2">
                        <span>💻</span>
                        <span className="font-medium">Language Rank</span>
                      </span>
                      <Badge 
                        variant={ranking?.languageRank ? "outline" : "outline"}
                        className="font-mono"
                      >
                        #{ranking?.languageRank || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Ranking Note */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-muted-foreground text-center">
                    Rankings are calculated based on contribution activity, repository quality, and community engagement.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Language Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Programming Languages</span>
                  {userAnalytics?.languages && userAnalytics.languages.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {userAnalytics.languages.length} languages
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                ) : userAnalytics?.languages && userAnalytics.languages.length > 0 ? (
                  <div className="space-y-6">
                    {/* Top 3 Languages - Prominent Display */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {userAnalytics.languages.slice(0, 3).map((lang, index) => (
                        <div key={lang.name} className="text-center space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div className="relative">
                            <div 
                              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                              style={{ backgroundColor: getLanguageColor(lang.name) }}
                            >
                              {lang.percentage}%
                            </div>
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                                👑
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{lang.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(lang.bytes)} bytes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Additional Languages - Compact List */}
                    {userAnalytics.languages.length > 3 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Other Languages</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {userAnalytics.languages.slice(3, 11).map((lang) => (
                            <div key={lang.name} className="flex items-center space-x-2 p-2 rounded bg-slate-50 dark:bg-slate-800">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getLanguageColor(lang.name) }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{lang.name}</p>
                                <p className="text-xs text-muted-foreground">{lang.percentage}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {userAnalytics.languages.length > 11 && (
                          <p className="text-center text-sm text-muted-foreground">
                            +{userAnalytics.languages.length - 11} more languages
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💻</div>
                    <h3 className="font-semibold mb-2">No language data available</h3>
                    <p className="text-muted-foreground text-sm">
                      Language statistics will appear here once the user has public repositories.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'repositories' && (
          <div>
            {/* Repositories Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Repositories</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`https://github.com/${user.login}?tab=repositories`, '_blank')}
                >
                  View All on GitHub
                </Button>
              </div>
            </div>

            {/* Repositories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reposLoading ? (
                [...Array(9)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                        <div className="flex space-x-2 mt-4">
                          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : repositories && repositories.length > 0 ? (
                repositories.slice(0, 12).map((repo) => (
                  <Card key={repo.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-start justify-between">
                        <a 
                          href={repo.html_url} 
                          className="hover:text-blue-600 transition-colors flex-1 break-words"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {repo.name}
                        </a>
                        {repo.private && (
                          <Badge variant="secondary" className="ml-2 text-xs">Private</Badge>
                        )}
                        {repo.fork && (
                          <Badge variant="outline" className="ml-2 text-xs">Fork</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[3rem]">
                        {repo.description || 'No description available'}
                      </p>
                      
                      {/* Repository Stats */}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center space-x-4">
                          {repo.language && (
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                              ></div>
                              <span className="text-xs">{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span className="text-xs">{formatNumber(repo.stargazers_count)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>🍴</span>
                            <span className="text-xs">{formatNumber(repo.forks_count)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Repository Topics */}
                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {repo.topics.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                              {topic}
                            </Badge>
                          ))}
                          {repo.topics.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{repo.topics.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Last Updated */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Updated {formatRelativeTime(repo.updated_at)}
                        </span>
                        {repo.size && (
                          <span className="text-xs text-muted-foreground">
                            {(repo.size / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
                  <p className="text-muted-foreground">
                    This user doesn't have any public repositories yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {/* Activity Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`https://github.com/${user.login}`, '_blank')}
                >
                  View on GitHub
                </Button>
              </div>
            </div>

            {/* Activity Timeline */}
            <Card>
              <CardContent className="p-0">
                {activityLoading ? (
                  <div className="space-y-4 p-6">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3 mb-1"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity && activity.length > 0 ? (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {activity.slice(0, 20).map((event, index) => {
                      const getEventIcon = (type) => {
                        const icons = {
                          'PushEvent': '📤',
                          'CreateEvent': '➕',
                          'DeleteEvent': '🗑️',
                          'IssuesEvent': '🐛',
                          'IssueCommentEvent': '💬',
                          'PullRequestEvent': '🔄',
                          'PullRequestReviewEvent': '👀',
                          'WatchEvent': '⭐',
                          'ForkEvent': '🍴',
                          'ReleaseEvent': '🎉',
                          'PublicEvent': '🌍',
                          'MemberEvent': '👥',
                          'GollumEvent': '📚'
                        };
                        return icons[type] || '📝';
                      };

                      const getEventColor = (type) => {
                        const colors = {
                          'PushEvent': 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
                          'CreateEvent': 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
                          'DeleteEvent': 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
                          'IssuesEvent': 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
                          'PullRequestEvent': 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
                          'WatchEvent': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
                          'ForkEvent': 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                        };
                        return colors[type] || 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400';
                      };

                      const getEventDescription = (event) => {
                        const action = event.payload?.action || '';
                        const eventType = event.type.replace('Event', '');
                        
                        switch (event.type) {
                          case 'PushEvent':
                            const commitCount = event.payload?.commits?.length || 1;
                            return `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to`;
                          case 'CreateEvent':
                            const refType = event.payload?.ref_type;
                            return `Created ${refType || 'repository'}${refType === 'repository' ? '' : ' in'}`;
                          case 'IssuesEvent':
                            return `${action.charAt(0).toUpperCase() + action.slice(1)} issue in`;
                          case 'PullRequestEvent':
                            return `${action.charAt(0).toUpperCase() + action.slice(1)} pull request in`;
                          case 'WatchEvent':
                            return 'Starred';
                          case 'ForkEvent':
                            return 'Forked';
                          case 'ReleaseEvent':
                            return `${action.charAt(0).toUpperCase() + action.slice(1)} release in`;
                          default:
                            return `${eventType} in`;
                        }
                      };

                      return (
                        <div key={index} className="flex items-start space-x-4 p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getEventColor(event.type)}`}>
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">
                                  <span className="font-medium">{getEventDescription(event)}</span>
                                  {' '}
                                  <a 
                                    href={`https://github.com/${event.repo?.name}`}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {event.repo?.name}
                                  </a>
                                </p>
                                
                                {/* Additional event details */}
                                {event.payload?.commits && event.payload.commits.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground truncate">
                                      "{event.payload.commits[0].message}"
                                    </p>
                                  </div>
                                )}

                                {event.payload?.issue && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground truncate">
                                      "{event.payload.issue.title}"
                                    </p>
                                  </div>
                                )}

                                {event.payload?.pull_request && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground truncate">
                                      "{event.payload.pull_request.title}"
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right ml-4">
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(event.created_at)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(event.created_at, { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-xl font-semibold mb-2">No recent activity</h3>
                    <p className="text-muted-foreground">
                      This user hasn't had any public activity recently.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Analytics & Insights</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Analytics
              </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Commits</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {analyticsLoading ? '...' : formatNumber(userAnalytics?.totalCommits || user.totalCommits || 0)}
                      </p>
                    </div>
                    <div className="text-2xl">📊</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Stars</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {analyticsLoading ? '...' : formatNumber(userAnalytics?.totalStars || 0)}
                      </p>
                    </div>
                    <div className="text-2xl">⭐</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Forks</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {analyticsLoading ? '...' : formatNumber(userAnalytics?.totalForks || 0)}
                      </p>
                    </div>
                    <div className="text-2xl">🍴</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Repositories</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {formatNumber(user.publicRepos || user.public_repos || 0)}
                      </p>
                    </div>
                    <div className="text-2xl">📁</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contribution Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📈</span>
                    <span>Contribution Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>💻</span>
                          <span>Total Commits</span>
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatNumber(userAnalytics?.totalCommits || user.totalCommits || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>🔄</span>
                          <span>Pull Requests</span>
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {formatNumber(userAnalytics?.totalPullRequests || user.totalPullRequests || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>🐛</span>
                          <span>Issues</span>
                        </span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {formatNumber(userAnalytics?.totalIssues || user.totalIssues || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>👀</span>
                          <span>Code Reviews</span>
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatNumber(userAnalytics?.totalReviews || user.totalReviews || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>🔥</span>
                          <span>Current Streak</span>
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {userAnalytics?.currentStreak || user.contributionStreak || 0} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="flex items-center space-x-2">
                          <span>🏆</span>
                          <span>Longest Streak</span>
                        </span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {userAnalytics?.longestStreak || user.longestStreak || 0} days
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Repository Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Repository Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>🌟</span>
                          <span>Most Starred Repo</span>
                        </span>
                        <Badge variant="outline" className="font-mono">
                          {userAnalytics?.topRepo?.name || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>🚀</span>
                          <span>Primary Language</span>
                        </span>
                        <Badge 
                          variant="outline" 
                          className="font-mono"
                          style={{ 
                            backgroundColor: getLanguageColor(userAnalytics?.primaryLanguage) + '20',
                            borderColor: getLanguageColor(userAnalytics?.primaryLanguage) + '50'
                          }}
                        >
                          {userAnalytics?.primaryLanguage || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>📊</span>
                          <span>Avg Stars per Repo</span>
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {userAnalytics?.avgStarsPerRepo || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>📁</span>
                          <span>Public Repos</span>
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {user.publicRepos || user.public_repos || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="flex items-center space-x-2">
                          <span>🔒</span>
                          <span>Private Gists</span>
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {user.publicGists || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="flex items-center space-x-2">
                          <span>🎂</span>
                          <span>Account Age</span>
                        </span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {Math.floor((Date.now() - new Date(user.githubCreatedAt || user.created_at)) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Languages and Technologies */}
            {userAnalytics?.languages && userAnalytics.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>💻</span>
                    <span>Programming Languages & Technologies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userAnalytics.languages.slice(0, 8).map((lang, index) => (
                      <div key={lang.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getLanguageColor(lang.name) }}
                            />
                            <span className="font-medium">{lang.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{lang.percentage}%</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({formatNumber(lang.bytes)} bytes)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              backgroundColor: getLanguageColor(lang.name),
                              width: `${lang.percentage}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
