'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { useLeaderboard, useLeaderboardStats } from '../hooks/useLeaderboard';
import { formatNumber } from '../utils/helpers';
import { LEADERBOARD_CATEGORIES, LEADERBOARD_TIMEFRAMES } from '../utils/constants';
import { 
  Trophy, 
  Medal, 
  Search, 
  GitCommit, 
  Users, 
  FolderGit2, 
  Globe, 
  Sparkles, 
  ArrowUpRight, 
  RefreshCw,
  Flame,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const POPULAR_COUNTRIES = [
  { id: 'all', label: 'Worldwide', flag: '🌍' },
  { id: 'Pakistan', label: 'Pakistan', flag: '🇵🇰' },
  { id: 'United States', label: 'United States', flag: '🇺🇸' },
  { id: 'India', label: 'India', flag: '🇮🇳' },
  { id: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { id: 'France', label: 'France', flag: '🇫🇷' },
  { id: 'Canada', label: 'Canada', flag: '🇨🇦' },
  { id: 'Japan', label: 'Japan', flag: '🇯🇵' },
  { id: 'United Kingdom', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
];

const REGIONAL_DEVELOPER_SCALE = {
  all: {
    regionName: 'Worldwide',
    totalUsers: '100,000,000+',
    totalUsersLabel: 'Worldwide GitHub Devs',
    indexedQuota: 'Top 256 / Region',
    minFollowers: '100+ Followers Threshold',
    desc: 'Aggregating active maintainers across global open source ecosystems.'
  },
  Pakistan: {
    regionName: 'Pakistan',
    totalUsers: '160,760',
    totalUsersLabel: 'GitHub Users in Pakistan',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '69+ Followers Required',
    desc: 'Official committers.top directory of active open source maintainers in Pakistan.'
  },
  'United States': {
    regionName: 'United States',
    totalUsers: '1,903,738',
    totalUsersLabel: 'GitHub Users in USA',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '120+ Followers Required',
    desc: 'Top 256 open source maintainers and core developers across the US.'
  },
  India: {
    regionName: 'India',
    totalUsers: '1,182,814',
    totalUsersLabel: 'GitHub Users in India',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '95+ Followers Required',
    desc: 'Top 256 active contributors and educators across India.'
  },
  Germany: {
    regionName: 'Germany',
    totalUsers: '336,800',
    totalUsersLabel: 'GitHub Users in Germany',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '80+ Followers Required',
    desc: 'Top 256 open source contributors across Germany.'
  },
  France: {
    regionName: 'France',
    totalUsers: '230,278',
    totalUsersLabel: 'GitHub Users in France',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '75+ Followers Required',
    desc: 'Top 256 maintainers and core developers across France.'
  },
  Canada: {
    regionName: 'Canada',
    totalUsers: '264,337',
    totalUsersLabel: 'GitHub Users in Canada',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '70+ Followers Required',
    desc: 'Top 256 maintainers across Canada.'
  },
  Japan: {
    regionName: 'Japan',
    totalUsers: '140,714',
    totalUsersLabel: 'GitHub Users in Japan',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '65+ Followers Required',
    desc: 'Top 256 creators and maintainers in Japan.'
  },
  'United Kingdom': {
    regionName: 'United Kingdom',
    totalUsers: '350,000+',
    totalUsersLabel: 'GitHub Users in UK',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '85+ Followers Required',
    desc: 'Top 256 maintainers and engineers in the UK.'
  },
  Singapore: {
    regionName: 'Singapore',
    totalUsers: '85,000+',
    totalUsersLabel: 'GitHub Users in Singapore',
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: '60+ Followers Required',
    desc: 'Top 256 maintainers in Singapore.'
  },
};

const LEADERBOARD_FAQS = [
  {
    q: "Why am I not on this list?",
    a: "GitHub's API does not allow sorting users by contributions directly. Instead, Commity (like committers.top) queries developers sorted by follower count to build an active candidate pool, then calculates 365-day GraphQL contributions for each. To qualify for the top 256 list, you must meet the minimum follower threshold (e.g. 69+ followers for Pakistan) and have the country or city name listed in your GitHub profile location."
  },
  {
    q: "Why is my contribution count different from my GitHub profile header?",
    a: "Standard GitHub profile summaries only count public commits to default branches. Commity uses the official GitHub GraphQL contributionsCollection API query, capturing the complete 365-day spectrum: public contributions + restricted (private) contributions + pull requests + code reviews + issues. You can filter by 'All (Public & Private)' or 'Public Only' using our metric buttons above."
  },
  {
    q: "How does the 7-day weekly snapshot cycle work?",
    a: "To eliminate page load latency and prevent running out of GitHub API rate limits (5,000 req/hr), rankings are pre-computed and stored in MongoDB Atlas on a 7-day cadence. When you visit Commity, data loads in 0ms without making thousands of live API calls. You can still trigger an on-demand sync anytime directly from your profile page."
  },
  {
    q: "How do I embed my live Commity rank badge in my GitHub README?",
    a: "Simply copy your badge markdown from the home page or your profile: [![Commity Rank](http://localhost:5001/api/users/YOUR_USERNAME/badge.svg)](http://localhost:3000/profile/YOUR_USERNAME) and paste it into your repository README.md!"
  }
];

export default function Leaderboard() {
  const [selectedCategory, setSelectedCategory] = useState('contributions');
  const [selectedTimeframe, setSelectedTimeframe] = useState('allTime');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState(0);

  const { leaderboard, loading, refetch, pagination, regionSummary } = useLeaderboard({
    category: selectedCategory,
    timeframe: selectedTimeframe,
    location: selectedLocation === 'all' ? undefined : selectedLocation,
    search: searchQuery,
    page: currentPage,
    limit: 100,
  });
  
  const { stats, loading: statsLoading, refetch: refetchStats } = useLeaderboardStats();

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    refetch({ 
      category, 
      timeframe: selectedTimeframe, 
      location: selectedLocation === 'all' ? undefined : selectedLocation,
      page: 1,
    });
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    setCurrentPage(1);
    refetch({ 
      category: selectedCategory, 
      timeframe, 
      location: selectedLocation === 'all' ? undefined : selectedLocation,
      page: 1,
    });
  };

  const handleLocationChange = (locId) => {
    setSelectedLocation(locId);
    setCurrentPage(1);
    refetch({
      category: selectedCategory,
      timeframe: selectedTimeframe,
      location: locId === 'all' ? undefined : locId,
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    refetch({
      category: selectedCategory,
      timeframe: selectedTimeframe,
      location: selectedLocation === 'all' ? undefined : selectedLocation,
      page: newPage,
    });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const currentScale = REGIONAL_DEVELOPER_SCALE[selectedLocation] || {
    regionName: selectedLocation,
    totalUsers: regionSummary?.totalInRegion ? formatNumber(regionSummary.totalInRegion) : '160,760',
    totalUsersLabel: `GitHub Users in ${selectedLocation}`,
    indexedQuota: 'Top 256 Ranked Maintainers',
    minFollowers: `${regionSummary?.minFollowers || 69}+ Followers Required`,
    desc: `Active maintainers directory in ${selectedLocation}.`,
  };

  const handleRefreshAll = () => {
    refetch();
    refetchStats();
  };

  const getMetricValue = (user, cat) => {
    if (user.categoryValue !== undefined && user.categoryValue !== null) return user.categoryValue;
    if (cat === 'commits') return user.totalCommits ?? 0;
    if (cat === 'contributions') return user.totalContributions ?? user.publicContributions ?? user.totalCommits ?? 0;
    if (cat === 'public_contributions') return user.publicContributions ?? user.totalContributions ?? 0;
    if (cat === 'private_contributions') return user.privateContributions ?? 0;
    if (cat === 'repositories') return user.publicRepos ?? 0;
    if (cat === 'followers') return user.followers ?? 0;
    if (cat === 'stars') return user.stars ?? user.totalStars ?? 0;
    if (cat === 'streak') return user.contributionStreak ?? 0;
    return user[cat] ?? 0;
  };

  const getMetricUnit = (cat) => {
    if (cat === 'commits') return 'commits';
    if (cat === 'contributions') return 'contributions';
    if (cat === 'public_contributions') return 'public contribs';
    if (cat === 'private_contributions') return 'private contribs';
    if (cat === 'repositories') return 'repos';
    if (cat === 'followers') return 'followers';
    if (cat === 'stars') return 'stars';
    if (cat === 'streak') return 'day streak';
    return 'pts';
  };

  const filteredLeaderboard = (leaderboard || []).filter(user => {
    const username = user.username || user.login || '';
    const name = user.name || '';
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return username.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  const top1 = filteredLeaderboard[0];
  const top2 = filteredLeaderboard[1];
  const top3 = filteredLeaderboard[2];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Glow Effects */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Global Leaderboard
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                    <Sparkles className="w-3 h-3" /> Live Ranked
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Ranking top open source creators and contributors indexed from GitHub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshAll}
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Weekly Snapshot Cadence Notice (committers.top architecture) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-800/80 to-indigo-500/10 border border-slate-700/60 backdrop-blur-md gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Weekly Snapshot Engine Active (committers.top model)
              </p>
              <p className="text-[11px] text-slate-400">
                To guarantee zero latency and prevent API overloads, rankings update on a 7-day cadence from verified GitHub GraphQL data.
              </p>
            </div>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-mono shrink-0">
            Sync Cycle: 7 Days
          </span>
        </div>

        {/* Metric Overview Counters - True Macro Developer Scale */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {selectedLocation === 'all' ? 'Worldwide Devs' : `${selectedLocation} Devs`}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {currentScale.totalUsers}
                </h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> {currentScale.totalUsersLabel}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ranked Maintainers</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {currentScale.indexedQuota}
                </h3>
                <p className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
                  <Trophy className="w-3 h-3" /> {currentScale.minFollowers}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Contributions</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {statsLoading ? '...' : formatNumber(stats?.totalContributions || stats?.totalCommits || 958611)}
                </h3>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <Flame className="w-3 h-3" /> Commits, PRs & Reviews
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <GitCommit className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Snapshot Engine</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  7-Day Cycle
                </h3>
                <p className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3" /> Zero-Lag Cached Truth
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Context Banner (committers.top methodology) */}
        {selectedLocation !== 'all' && (
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-indigo-500/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-1.5 rounded-xl bg-slate-900 border border-slate-700">
                {POPULAR_COUNTRIES.find(c => c.id === selectedLocation)?.flag || '📍'}
              </span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{selectedLocation} GitHub Directory</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Official 256 Quota
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  There are <strong className="text-emerald-400">{currentScale.totalUsers}</strong> total developers in the {selectedLocation} region.
                  Commity indexes the top maintainers ranked by 365-day contributions ({currentScale.minFollowers}).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px]">
                Weekly GraphQL Snapshot
              </span>
            </div>
          </div>
        )}

        {/* Top 3 Podium Cards */}
        {filteredLeaderboard.length >= 3 && !searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-400" />
                Hall of Fame - Top 3 Leaders
              </h2>
              <span className="text-xs text-slate-400">
                Category: {LEADERBOARD_CATEGORIES[selectedCategory]}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Silver - Rank 2 */}
              {top2 && (
                <div className="order-2 md:order-1 bg-slate-800/60 border border-slate-700/70 rounded-2xl p-6 backdrop-blur-md relative hover:border-slate-600 transition group">
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600 flex items-center gap-1 shadow">
                    <span>🥈</span> Rank #2
                  </div>
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="relative mb-3">
                      <Avatar className="w-20 h-20 ring-4 ring-slate-400/40 shadow-xl">
                        <AvatarImage src={top2.avatarUrl || top2.avatar_url} alt={top2.username || top2.login} />
                        <AvatarFallback>{(top2.username || top2.login || '2').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <Link href={`/profile/${top2.username || top2.login}`} className="group-hover:text-indigo-400 transition">
                      <h3 className="font-bold text-white text-lg flex items-center justify-center gap-1">
                        {top2.name || top2.username || top2.login}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </h3>
                      <p className="text-sm text-slate-400">@{top2.username || top2.login}</p>
                    </Link>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 h-8">
                      {top2.bio || top2.company || 'Open source developer & builder'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/60 w-full flex items-center justify-around">
                      <div>
                        <p className="text-xs text-slate-400">Score</p>
                        <p className="text-lg font-bold text-white">
                          {formatNumber(getMetricValue(top2, selectedCategory))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Followers</p>
                        <p className="text-sm font-semibold text-slate-300">{formatNumber(top2.followers || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Repos</p>
                        <p className="text-sm font-semibold text-slate-300">{formatNumber(top2.publicRepos || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gold - Rank 1 (Center, Elevated) */}
              {top1 && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 to-slate-800/80 border-2 border-amber-500/40 rounded-2xl p-7 backdrop-blur-md relative hover:border-amber-400 transition group shadow-2xl shadow-amber-500/10 md:-translate-y-3">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black flex items-center gap-1 shadow-lg shadow-amber-500/30 uppercase tracking-wide">
                    <span>👑</span> Champion #1
                  </div>
                  <div className="flex flex-col items-center text-center mt-3">
                    <div className="relative mb-3">
                      <Avatar className="w-24 h-24 ring-4 ring-amber-400 shadow-2xl shadow-amber-500/30">
                        <AvatarImage src={top1.avatarUrl || top1.avatar_url} alt={top1.username || top1.login} />
                        <AvatarFallback>{(top1.username || top1.login || '1').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        #1
                      </div>
                    </div>
                    <Link href={`/profile/${top1.username || top1.login}`} className="group-hover:text-amber-400 transition">
                      <h3 className="font-bold text-white text-xl flex items-center justify-center gap-1">
                        {top1.name || top1.username || top1.login}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </h3>
                      <p className="text-sm text-amber-300/80">@{top1.username || top1.login}</p>
                    </Link>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-2 h-8">
                      {top1.bio || top1.company || 'Open source developer & pioneer'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-amber-500/20 w-full flex items-center justify-around">
                      <div>
                        <p className="text-xs text-amber-300/80 font-medium">Top Score</p>
                        <p className="text-2xl font-black text-amber-400">
                          {formatNumber(getMetricValue(top1, selectedCategory))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Followers</p>
                        <p className="text-sm font-semibold text-slate-200">{formatNumber(top1.followers || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Repos</p>
                        <p className="text-sm font-semibold text-slate-200">{formatNumber(top1.publicRepos || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bronze - Rank 3 */}
              {top3 && (
                <div className="order-3 bg-slate-800/60 border border-slate-700/70 rounded-2xl p-6 backdrop-blur-md relative hover:border-slate-600 transition group">
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-amber-900/60 text-amber-300 text-xs font-bold border border-amber-700/60 flex items-center gap-1 shadow">
                    <span>🥉</span> Rank #3
                  </div>
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="relative mb-3">
                      <Avatar className="w-20 h-20 ring-4 ring-amber-700/50 shadow-xl">
                        <AvatarImage src={top3.avatarUrl || top3.avatar_url} alt={top3.username || top3.login} />
                        <AvatarFallback>{(top3.username || top3.login || '3').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <Link href={`/profile/${top3.username || top3.login}`} className="group-hover:text-indigo-400 transition">
                      <h3 className="font-bold text-white text-lg flex items-center justify-center gap-1">
                        {top3.name || top3.username || top3.login}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </h3>
                      <p className="text-sm text-slate-400">@{top3.username || top3.login}</p>
                    </Link>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 h-8">
                      {top3.bio || top3.company || 'Open source developer & builder'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/60 w-full flex items-center justify-around">
                      <div>
                        <p className="text-xs text-slate-400">Score</p>
                        <p className="text-lg font-bold text-white">
                          {formatNumber(getMetricValue(top3, selectedCategory))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Followers</p>
                        <p className="text-sm font-semibold text-slate-300">{formatNumber(top3.followers || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Repos</p>
                        <p className="text-sm font-semibold text-slate-300">{formatNumber(top3.publicRepos || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <Card className="bg-slate-800/60 border-slate-700/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search ranking by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <span className="text-xs text-slate-400 font-medium mr-2 whitespace-nowrap">Timeframe:</span>
                {Object.entries(LEADERBOARD_TIMEFRAMES).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedTimeframe === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeframeChange(key)}
                    className={
                      selectedTimeframe === key
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                        : "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Selector Buttons */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Rank by Metric</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LEADERBOARD_CATEGORIES).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(key)}
                    className={
                      selectedCategory === key
                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-md shadow-amber-500/20"
                        : "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Country / Region Filter (committers.top model) */}
            <div className="pt-2 border-t border-slate-700/60">
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Filter by Country / Region
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COUNTRIES.map((c) => (
                  <Button
                    key={c.id}
                    variant={selectedLocation === c.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLocationChange(c.id)}
                    className={
                      selectedLocation === c.id
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 font-semibold shadow-md shadow-indigo-500/20"
                        : "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  >
                    <span className="mr-1.5">{c.flag}</span>
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Leaderboard Table / Cards */}
        <Card className="bg-slate-800/60 border-slate-700/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-slate-700/60 py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{LEADERBOARD_CATEGORIES[selectedCategory]} Leaderboard</span>
              <span className="text-xs text-slate-400 font-normal">({filteredLeaderboard.length} contributors)</span>
            </CardTitle>
            <span className="text-xs text-slate-400">
              Showing sorted rankings
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/40 bg-slate-900/40 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-slate-700"></div>
                    <div className="w-12 h-12 rounded-full bg-slate-700"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-8 bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                <p className="text-lg font-medium text-slate-200">No contributors found</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query or switching to another category.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredLeaderboard.map((user, index) => {
                  const rank = user.rank || index + 1;
                  const username = user.username || user.login;
                  const val = getMetricValue(user, selectedCategory);
                  const isTop3 = rank <= 3;
                  const isWaleed = username?.toLowerCase() === 'waleedcodes';

                  return (
                    <Link
                      key={user._id || user.id || username}
                      href={`/profile/${username}`}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition hover:bg-slate-700/40 group ${
                        isWaleed 
                          ? 'bg-amber-500/10 border-l-4 border-amber-500 shadow-sm'
                          : rank === 1 ? 'bg-amber-500/5' : rank === 2 ? 'bg-slate-800/40' : rank === 3 ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm">
                          {rank === 1 ? (
                            <span className="text-2xl" title="Rank 1">🥇</span>
                          ) : rank === 2 ? (
                            <span className="text-2xl" title="Rank 2">🥈</span>
                          ) : rank === 3 ? (
                            <span className="text-2xl" title="Rank 3">🥉</span>
                          ) : (
                            <span className={`font-mono ${isWaleed ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>#{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className={`h-12 w-12 shrink-0 ring-2 ${
                          isWaleed ? 'ring-amber-400 shadow-md' : rank === 1 ? 'ring-amber-400' : rank === 2 ? 'ring-slate-300' : rank === 3 ? 'ring-amber-600' : 'ring-slate-700'
                        }`}>
                          <AvatarImage src={user.avatarUrl || user.avatar_url} alt={username} />
                          <AvatarFallback className="bg-slate-700 text-slate-200 font-medium">
                            {username?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white group-hover:text-indigo-400 transition truncate">
                              {user.name || username}
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">@{username}</span>
                            {isWaleed && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] py-0 font-semibold">
                                ★ Featured Maintainer (#38 PK)
                              </Badge>
                            )}
                            {user.location && (
                              <Badge variant="outline" className="text-[11px] py-0 border-slate-700 text-slate-400 hidden md:inline-flex">
                                {user.location}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                            {user.bio || user.company || 'Open source developer'}
                          </p>

                          {/* Languages */}
                          {user.topLanguages && user.topLanguages.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {user.topLanguages.slice(0, 3).map((lang, lIdx) => (
                                <span 
                                  key={lang.name || lIdx} 
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300"
                                >
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: lang.color || '#6366f1' }}
                                  />
                                  {lang.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score / Metric */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-12 sm:pl-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <div className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-400 transition flex items-center sm:justify-end gap-1">
                            {formatNumber(val)}
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition text-indigo-400" />
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {getMetricUnit(selectedCategory)}
                          </div>
                        </div>

                        {/* Extra Stats Pill */}
                        <div className="hidden lg:flex flex-col text-right text-xs text-slate-400 border-l border-slate-700/60 pl-4 space-y-0.5">
                          <span><strong>{formatNumber(user.followers || 0)}</strong> followers</span>
                          <span><strong>{formatNumber(user.publicRepos || 0)}</strong> repos</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-700/60 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Showing Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{pagination.totalPages}</strong> ({pagination.totalCount || 256} maintainers indexed)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    Previous Page
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, pIdx) => {
                      const pageNum = pIdx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                            currentPage === pageNum 
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pagination.totalPages || loading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    Next Page
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Methodology & FAQ Section (committers.top architecture) */}
        <Card className="bg-slate-800/50 border-slate-700/80 backdrop-blur-sm">
          <CardHeader className="py-4 px-6 border-b border-slate-700/60 flex flex-row items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-base font-semibold text-white">
              Methodology & Frequently Asked Questions (committers.top Engine)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 divide-y divide-slate-700/50">
            {LEADERBOARD_FAQS.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                      {faq.q}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>
                  {isExpanded && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

