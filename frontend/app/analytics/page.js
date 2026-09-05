'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { useAnalytics, useCompareUsers } from '../hooks/useAnalytics';
import { formatNumber } from '../utils/helpers';
import { DATE_RANGES } from '../utils/constants';
import { 
  BarChart3, 
  TrendingUp, 
  GitCommit, 
  GitPullRequest, 
  Users, 
  FolderGit2, 
  Globe, 
  Sparkles, 
  Scale, 
  Flame, 
  RefreshCw, 
  Award, 
  CheckCircle2, 
  ArrowUpRight,
  Code2,
  MapPin,
  Swords
} from 'lucide-react';

export default function Analytics() {
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [compareUser1, setCompareUser1] = useState('torvalds');
  const [compareUser2, setCompareUser2] = useState('sindresorhus');
  
  const { analytics, loading: analyticsLoading, refetch } = useAnalytics({
    dateRange: selectedDateRange
  });

  const { 
    comparison, 
    loading: compareLoading, 
    compareUsers 
  } = useCompareUsers();

  // Run initial comparison between torvalds and sindresorhus
  useEffect(() => {
    compareUsers(['torvalds', 'sindresorhus']);
  }, [compareUsers]);

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    refetch({ dateRange: range });
  };

  const handleRunComparison = (e) => {
    if (e) e.preventDefault();
    if (!compareUser1.trim() || !compareUser2.trim()) return;
    compareUsers([compareUser1.trim(), compareUser2.trim()]);
  };

  const overview = analytics?.overview || {};
  const languages = analytics?.distributions?.languages || [];
  const locations = analytics?.distributions?.locations || [];
  const topPerformers = analytics?.topPerformers || [];

  const comparedUsers = comparison?.users || [];
  const compU1 = comparedUsers[0];
  const compU2 = comparedUsers[1];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Ambient Glow */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[850px] h-[320px] bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Platform Analytics & Intelligence
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                    <Sparkles className="w-3 h-3" /> Live Ecosystem Insights
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Global repository distributions, language shares, and developer comparison metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1">
                {Object.entries(DATE_RANGES).slice(0, 3).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => handleDateRangeChange(key)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      selectedDateRange === key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Indexed Developers</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {analyticsLoading ? '...' : formatNumber(overview.totalUsers || 12)}
                </h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> {overview.activeUsers || 12} Active contributors
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Commits</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {analyticsLoading ? '...' : formatNumber(overview.totalCommits || 67710)}
                </h3>
                <p className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
                  <Flame className="w-3 h-3" /> ~{formatNumber(overview.averages?.commitsPerUser || 5643)} / user
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitCommit className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Public Repositories</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {analyticsLoading ? '...' : formatNumber(overview.totalRepositories || 3375)}
                </h3>
                <p className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> ~{formatNumber(overview.averages?.reposPerUser || 281)} / user
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FolderGit2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Community Reach</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {analyticsLoading ? '...' : formatNumber(overview.totalFollowers || 767641)}
                </h3>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <Globe className="w-3 h-3" /> Combined Followers
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Globe className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Developer Head-to-Head Comparison Engine */}
        <Card className="bg-gradient-to-b from-slate-800/80 to-slate-800/40 border-slate-700/80 backdrop-blur-md overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-slate-700/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    Developer Comparison Engine
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    Compare any two GitHub profiles head-to-head across activity, repos, and impact
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Presets:</span>
                {[
                  ['torvalds', 'sindresorhus'],
                  ['antfu', 'yyx990803'],
                  ['waleedcodes', 'shadcn']
                ].map(([u1, u2]) => (
                  <button
                    key={`${u1}-${u2}`}
                    onClick={() => {
                      setCompareUser1(u1);
                      setCompareUser2(u2);
                      compareUsers([u1, u2]);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-500/50 transition"
                  >
                    {u1} vs {u2}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparison Input Form */}
            <form onSubmit={handleRunComparison} className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Input
                  placeholder="First GitHub username (e.g. torvalds)"
                  value={compareUser1}
                  onChange={(e) => setCompareUser1(e.target.value)}
                  className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <span className="text-sm font-black text-indigo-400 px-2 uppercase tracking-wider">VS</span>
              <div className="relative flex-1 w-full">
                <Input
                  placeholder="Second GitHub username (e.g. sindresorhus)"
                  value={compareUser2}
                  onChange={(e) => setCompareUser2(e.target.value)}
                  className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button 
                type="submit" 
                disabled={compareLoading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium shrink-0 shadow-lg shadow-indigo-500/20"
              >
                {compareLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Scale className="w-4 h-4 mr-2" />
                )}
                Compare Developers
              </Button>
            </form>
          </CardHeader>

          <CardContent className="p-6">
            {compareLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-400">Analyzing commits, PRs, and repositories...</p>
              </div>
            ) : compU1 && compU2 ? (
              <div className="space-y-6">
                {/* Side-by-Side Profiles Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contender 1 */}
                  <div className={`p-6 rounded-2xl border transition relative ${
                    (compU1.performanceScore || 0) >= (compU2.performanceScore || 0)
                      ? 'bg-gradient-to-b from-indigo-500/10 to-slate-900/80 border-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-700/60'
                  }`}>
                    {(compU1.performanceScore || 0) > (compU2.performanceScore || 0) && (
                      <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        🏆 Leader
                      </span>
                    )}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 ring-2 ring-indigo-500/40">
                        <AvatarImage src={compU1.avatarUrl} alt={compU1.username} />
                        <AvatarFallback>{compU1.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${compU1.username}`} className="hover:text-indigo-400 transition">
                          <h3 className="text-lg font-bold text-white flex items-center gap-1">
                            {compU1.name || compU1.username}
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-400">@{compU1.username}</p>
                        {compU1.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {compU1.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-center">
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-[11px] text-slate-400">Period Commits</p>
                        <p className="text-base font-bold text-white mt-0.5">
                          {formatNumber(compU1.period?.commits || 0)}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-[11px] text-slate-400">Lifetime Commits</p>
                        <p className="text-base font-bold text-indigo-300 mt-0.5">
                          {formatNumber(compU1.lifetime?.commits || 0)}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-[11px] text-slate-400">Followers</p>
                        <p className="text-base font-bold text-white mt-0.5">
                          {formatNumber(compU1.followers || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contender 2 */}
                  <div className={`p-6 rounded-2xl border transition relative ${
                    (compU2.performanceScore || 0) >= (compU1.performanceScore || 0)
                      ? 'bg-gradient-to-b from-purple-500/10 to-slate-900/80 border-purple-500/40'
                      : 'bg-slate-900/60 border-slate-700/60'
                  }`}>
                    {(compU2.performanceScore || 0) > (compU1.performanceScore || 0) && (
                      <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        🏆 Leader
                      </span>
                    )}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 ring-2 ring-purple-500/40">
                        <AvatarImage src={compU2.avatarUrl} alt={compU2.username} />
                        <AvatarFallback>{compU2.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${compU2.username}`} className="hover:text-purple-400 transition">
                          <h3 className="text-lg font-bold text-white flex items-center gap-1">
                            {compU2.name || compU2.username}
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-400">@{compU2.username}</p>
                        {compU2.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {compU2.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-center">
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-[11px] text-slate-400">Period Commits</p>
                        <p className="text-base font-bold text-white mt-0.5">
                          {formatNumber(compU2.period?.commits || 0)}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-[11px] text-slate-400">Lifetime Commits</p>
                        <p className="text-base font-bold text-purple-300 mt-0.5">
                          {formatNumber(compU2.lifetime?.commits || 0)}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-[11px] text-slate-400">Followers</p>
                        <p className="text-base font-bold text-white mt-0.5">
                          {formatNumber(compU2.followers || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metric Head-to-Head Comparison Bars */}
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700/60 space-y-4">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Direct Metric Breakdown
                  </h4>

                  {/* Commits Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-indigo-400">
                        @{compU1.username}: {formatNumber(compU1.lifetime?.commits || compU1.period?.commits || 0)} commits
                      </span>
                      <span className="text-purple-400">
                        @{compU2.username}: {formatNumber(compU2.lifetime?.commits || compU2.period?.commits || 0)} commits
                      </span>
                    </div>
                    {(() => {
                      const v1 = compU1.lifetime?.commits || compU1.period?.commits || 1;
                      const v2 = compU2.lifetime?.commits || compU2.period?.commits || 1;
                      const total = v1 + v2;
                      const pct1 = Math.round((v1 / total) * 100);
                      return (
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${pct1}%` }} />
                          <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${100 - pct1}%` }} />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Followers Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-indigo-400">
                        @{compU1.username}: {formatNumber(compU1.followers || 0)} followers
                      </span>
                      <span className="text-purple-400">
                        @{compU2.username}: {formatNumber(compU2.followers || 0)} followers
                      </span>
                    </div>
                    {(() => {
                      const v1 = compU1.followers || 1;
                      const v2 = compU2.followers || 1;
                      const total = v1 + v2;
                      const pct1 = Math.round((v1 / total) * 100);
                      return (
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${pct1}%` }} />
                          <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${100 - pct1}%` }} />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Public Repos Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-indigo-400">
                        @{compU1.username}: {formatNumber(compU1.lifetime?.publicRepos || 0)} repos
                      </span>
                      <span className="text-purple-400">
                        @{compU2.username}: {formatNumber(compU2.lifetime?.publicRepos || 0)} repos
                      </span>
                    </div>
                    {(() => {
                      const v1 = compU1.lifetime?.publicRepos || 1;
                      const v2 = compU2.lifetime?.publicRepos || 1;
                      const total = v1 + v2;
                      const pct1 = Math.round((v1 / total) * 100);
                      return (
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${pct1}%` }} />
                          <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${100 - pct1}%` }} />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                Enter any two GitHub usernames above to compare their performance.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2-Column: Language Ecosystem Share & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Language Ecosystem Distribution */}
          <Card className="bg-slate-800/60 border-slate-700/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-700/60">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                Community Language Ecosystem
              </CardTitle>
              <p className="text-xs text-slate-400">
                Aggregated code volume across tracked open source maintainers
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {languages.length === 0 ? (
                <p className="text-sm text-slate-400">No language data available</p>
              ) : (
                languages.slice(0, 8).map((lang, idx) => {
                  const colors = ['#f1e05a', '#3178c6', '#00ADD8', '#41b883', '#dea584', '#F05138', '#555555', '#3572A5'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={lang.name || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-medium text-white">{lang.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            {lang.userCount} developers
                          </span>
                          <span className="font-semibold text-white text-xs">
                            {lang.averageUsage}% avg
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(lang.averageUsage || 10, 100)}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Top Ranked Performers */}
          <Card className="bg-slate-800/60 border-slate-700/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-700/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Top Ranked Creators
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Leading maintainers ranked by platform performance score
                </p>
              </div>
              <Link 
                href="/leaderboard" 
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                Full Leaderboard <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700/50">
                {topPerformers.slice(0, 6).map((user) => (
                  <Link
                    key={user.username}
                    href={`/profile/${user.username}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-700/40 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 text-center font-bold text-xs text-slate-400 font-mono">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                      </div>
                      <Avatar className="h-9 w-9 ring-1 ring-slate-700">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">
                          {user.name || user.username}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>@{user.username}</span>
                          {user.primaryLanguage && (
                            <Badge variant="outline" className="text-[10px] py-0 border-slate-700 text-slate-400">
                              {user.primaryLanguage}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">
                        {formatNumber(user.totalCommits)}
                      </div>
                      <div className="text-[11px] text-slate-400">commits</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Developer Locations */}
        <Card className="bg-slate-800/60 border-slate-700/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-700/60">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Geographic Contributor Hubs
            </CardTitle>
            <p className="text-xs text-slate-400">
              Active open source developers indexed across global technology centers
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {locations.filter(l => l.name).slice(0, 10).map((loc, idx) => (
                <div 
                  key={loc.name || idx}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-cyan-500/40 transition"
                >
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{loc.name}</span>
                  </p>
                  <p className="text-lg font-bold text-white">
                    {loc.userCount} <span className="text-xs font-normal text-slate-400">devs</span>
                  </p>
                  <p className="text-[11px] text-cyan-400 mt-1">
                    ~{formatNumber(loc.averageCommits)} avg commits
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

