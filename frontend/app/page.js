'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Sparkles, 
  Trophy, 
  BarChart3, 
  GitCommit, 
  Users, 
  FolderGit2, 
  ArrowRight, 
  Star, 
  Flame, 
  ShieldCheck, 
  Code2, 
  Layers, 
  GitFork,
  CheckCircle,
  ExternalLink,
  Crown,
  Medal,
  Award,
  Globe,
  Clock,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  GitPullRequest
} from 'lucide-react';
import { Card, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/Avatar';
import { Badge } from './components/ui/Badge';
import { apiService } from './services/api';
import { formatNumber, getLanguageColor } from './utils/helpers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Featured popular developers with real verified handles
const POPULAR_DEVELOPERS = [
  { username: 'sufiyanshahiddev', name: 'Sufiyan Shahid', role: 'PK Rank #1 Maintainer', country: 'Pakistan', flag: '🇵🇰', avatar: 'https://avatars.githubusercontent.com/u/224948898?v=4', lang: 'Python', contributions: 140654 },
  { username: 'nehalatiq-dev', name: 'Nehal Atiq', role: 'PK Rank #2 Maintainer', country: 'Pakistan', flag: '🇵🇰', avatar: 'https://avatars.githubusercontent.com/u/105342898?v=4', lang: 'JavaScript', contributions: 108964 },
  { username: 'awan', name: 'Muhammad Abdullah Khabir', role: 'PK Rank #3 Maintainer', country: 'Pakistan', flag: '🇵🇰', avatar: 'https://avatars.githubusercontent.com/u/10636224?v=4', lang: 'TypeScript', contributions: 95343 },
  { username: 'waleedcodes', name: 'Waleed Ishfaq', role: 'Full-Stack Developer (#38 PK)', country: 'Pakistan', flag: '🇵🇰', avatar: 'https://avatars.githubusercontent.com/u/110061477?v=4', lang: 'JavaScript', contributions: 4225 },
  { username: 'farhanashrafdev', name: 'Farhan Ashraf', role: 'Open Source Maintainer (#23 PK)', country: 'Pakistan', flag: '🇵🇰', avatar: 'https://avatars.githubusercontent.com/u/43789366?v=4', lang: 'Python', contributions: 5865 },
  { username: 'sindresorhus', name: 'Sindre Sorhus', role: 'Open Sourcerer', country: 'France', flag: '🇫🇷', avatar: 'https://avatars.githubusercontent.com/u/170270?v=4', lang: 'JavaScript', contributions: 22400 },
  { username: 'antfu', name: 'Anthony Fu', role: 'Vue & Nuxt Core', country: 'Japan', flag: '🇯🇵', avatar: 'https://avatars.githubusercontent.com/u/11247099?v=4', lang: 'TypeScript', contributions: 15190 },
  { username: 'amitshekhariitbhu', name: 'Amit Shekhar', role: 'Android Educator', country: 'India', flag: '🇮🇳', avatar: 'https://avatars.githubusercontent.com/u/10460309?v=4', lang: 'Kotlin', contributions: 11365 },
  { username: 'yyx990803', name: 'Evan You', role: 'Vue & Vite Creator', country: 'Singapore', flag: '🇸🇬', avatar: 'https://avatars.githubusercontent.com/u/499550?v=4', lang: 'TypeScript', contributions: 10460 },
  { username: 'torvalds', name: 'Linus Torvalds', role: 'Linux & Git Creator', country: 'USA', flag: '🇺🇸', avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4', lang: 'C', contributions: 9267 },
];

// Country filter tabs inspired by committers.top
const COUNTRY_TABS = [
  { id: 'all', name: 'Worldwide', flag: '🌍', query: '' },
  { id: 'Pakistan', name: 'Pakistan', flag: '🇵🇰', query: 'Pakistan', highlight: 'sufiyanshahiddev' },
  { id: 'USA', name: 'United States', flag: '🇺🇸', query: 'USA', highlight: 'torvalds' },
  { id: 'India', name: 'India', flag: '🇮🇳', query: 'India', highlight: 'amitshekhariitbhu' },
  { id: 'Japan', name: 'Japan', flag: '🇯🇵', query: 'Japan', highlight: 'antfu' },
  { id: 'France', name: 'France', flag: '🇫🇷', query: 'France', highlight: 'sindresorhus' },
  { id: 'Canada', name: 'Canada', flag: '🇨🇦', query: 'Canada', highlight: 'tj' },
  { id: 'Singapore', name: 'Singapore', flag: '🇸🇬', query: 'Singapore', highlight: 'yyx990803' },
  { id: 'UK', name: 'United Kingdom', flag: '🇬🇧', query: 'London', highlight: 'gaearon' },
  { id: 'Germany', name: 'Germany', flag: '🇩🇪', query: 'Germany', highlight: 'tiangolo' },
];

const PRESET_DUELS = [
  { u1: 'sufiyanshahiddev', u2: 'nehalatiq-dev', label: 'Sufiyan vs Nehal (PK #1 vs #2)' },
  { u1: 'waleedcodes', u2: 'torvalds', label: 'Waleed vs Linus (Pakistan vs Worldwide)' },
  { u1: 'farhanashrafdev', u2: 'waleedcodes', label: 'Farhan vs Waleed (Pakistan Maintainers)' },
  { u1: 'antfu', u2: 'yyx990803', label: 'Anthony Fu vs Evan You' },
  { u1: 'sindresorhus', u2: 'tj', label: 'Sindre vs TJ' },
];

const FAQS = [
  {
    q: 'How does the 7-day weekly snapshot cache prevent GitHub rate-limit errors?',
    a: 'Commity uses the proven committers.top architecture. Instead of querying GitHub APIs synchronously on every page visit, our background worker pre-computes rankings and caches rich profile data in MongoDB Atlas every 7 days. Visitors experience 0ms latency with zero risk of running out of GitHub API rate limits.'
  },
  {
    q: 'Why do Commity contributions differ from default GitHub commit numbers?',
    a: 'Standard GitHub profile headers only count commits made to default branches in public repositories. Commity uses the full GitHub GraphQL contributions collection, which aggregates all 365 days of contributions—including pull requests, code reviews, issues, and private contributions (when enabled)—giving accurate counts (e.g. 4,000+ for active maintainers).'
  },
  {
    q: 'How do country and regional leaderboards work?',
    a: 'Commity indexes contributor profile locations (e.g. Pakistan, United States, Japan) and enables instant country-level rankings. For example, selecting Pakistan indexes the top 256 maintainers from over 160,760 developers in the region, including Sufiyan Shahid (#1 in Pakistan) and @waleedcodes (#38 in Pakistan with 4,225+ contributions).'
  },
  {
    q: 'Can I force an on-demand refresh for my own profile?',
    a: 'Yes! While rankings refresh automatically every week, every user profile features a dedicated "Sync with GitHub" button that allows you to instantly trigger a fresh GitHub fetch.'
  },
  {
    q: 'How do I embed the Commity badge into my GitHub profile README?',
    a: 'Use our interactive Badge Generator on this page or on your profile page. Copy the provided markdown snippet and paste it into your repository README.md for a live, always-updated badge!'
  }
];

export default function Home() {
  const router = useRouter();
  const appBase = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Platform statistics
  const [stats, setStats] = useState({
    totalUsers: 12,
    totalRepositories: 3375,
    totalContributions: 67710,
    totalContributors: 12,
    totalFollowers: 767641,
  });

  // Top 3 Podium Contributors
  const [topThree, setTopThree] = useState([
    { rank: 1, username: 'sindresorhus', name: 'Sindre Sorhus', contributions: 22400, repos: 1120, followers: 58000, lang: 'JavaScript', location: 'Paris, France', avatar: 'https://avatars.githubusercontent.com/u/170270?v=4' },
    { rank: 2, username: 'antfu', name: 'Anthony Fu', contributions: 15190, repos: 480, followers: 43000, lang: 'TypeScript', location: 'Tokyo, Japan', avatar: 'https://avatars.githubusercontent.com/u/11247099?v=4' },
    { rank: 3, username: 'tj', name: 'TJ Holowaychuk', contributions: 15120, repos: 590, followers: 52000, lang: 'Go', location: 'Victoria, Canada', avatar: 'https://avatars.githubusercontent.com/u/25254?v=4' },
  ]);

  // Country Explorer State
  const [activeCountry, setActiveCountry] = useState('all');
  const [countryUsers, setCountryUsers] = useState([]);
  const [isCountryLoading, setIsCountryLoading] = useState(false);

  // Compare Duel State
  const [compareUser1, setCompareUser1] = useState('waleedcodes');
  const [compareUser2, setCompareUser2] = useState('torvalds');

  // Badge Generator State
  const [badgeUsername, setBadgeUsername] = useState('waleedcodes');
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [badgeType, setBadgeType] = useState('svg');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial summary & global top 3
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [summaryRes, lbRes] = await Promise.allSettled([
          apiService.get('/analytics/summary'),
          apiService.get('/leaderboard', { limit: 3, category: 'contributions' }),
        ]);

        if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
          const sum = summaryRes.value.data;
          setStats((prev) => ({
            ...prev,
            totalUsers: sum.totalUsers || prev.totalUsers,
            totalRepositories: sum.totalRepositories || prev.totalRepositories,
            totalContributions: sum.totalContributions || sum.totalCommits || prev.totalContributions,
            totalContributors: sum.totalContributors || prev.totalContributors,
          }));
        }

        if (lbRes.status === 'fulfilled') {
          const lb = lbRes.value?.data;
          const list = Array.isArray(lb) ? lb : (lb?.users || []);
          if (list.length >= 3) {
            setTopThree(list.slice(0, 3).map((u, i) => ({
              rank: i + 1,
              username: u.username || u.login,
              name: u.name || u.username || u.login,
              contributions: u.totalContributions || u.totalCommits || u.categoryValue || 0,
              repos: u.publicRepos || u.repositories?.length || 0,
              followers: u.followers || 0,
              lang: u.topLanguages?.[0]?.name || u.primaryLanguage || 'JavaScript',
              location: u.location || 'Global',
              avatar: u.avatarUrl || u.avatar_url || `https://avatars.githubusercontent.com/${u.username}?v=4`,
            })));
          }
        }
      } catch (err) {
        console.warn('Home data fetch notice:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Fetch Country specific leaderboard when tab changes
  useEffect(() => {
    const fetchCountryData = async () => {
      const selected = COUNTRY_TABS.find(t => t.id === activeCountry);
      if (!selected || !selected.query) {
        setCountryUsers([]);
        return;
      }

      setIsCountryLoading(true);
      try {
        const res = await apiService.get('/leaderboard', {
          location: selected.query,
          limit: 15,
          category: 'contributions',
        });
        const users = res?.data?.users || (Array.isArray(res?.data) ? res.data : []);
        setCountryUsers(users);
      } catch (err) {
        console.warn(`Failed to fetch country leaderboard for ${selected.name}:`, err.message);
        setCountryUsers([]);
      } finally {
        setIsCountryLoading(false);
      }
    };

    if (activeCountry !== 'all') {
      fetchCountryData();
    }
  }, [activeCountry]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/profile/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle Compare Submission
  const handleCompare = (e) => {
    e.preventDefault();
    if (compareUser1.trim() && compareUser2.trim()) {
      router.push(`/analytics?u1=${encodeURIComponent(compareUser1.trim())}&u2=${encodeURIComponent(compareUser2.trim())}`);
    }
  };

  // Badge Markdown Snippet
  const badgeMarkdown = useMemo(() => {
    const user = badgeUsername.trim() || 'waleedcodes';
    if (badgeType === 'svg') {
      return `[![Commity Rank](${API_BASE}/users/${user}/badge.svg)](${appBase}/profile/${user})`;
    }
    return `[![Commity Rank](https://img.shields.io/badge/Commity-%231%20Rank-2563eb?style=for-the-badge&logo=github)](${appBase}/profile/${user})`;
  }, [badgeUsername, badgeType, appBase]);

  const handleCopyBadge = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2500);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Background Ambient Glows & Grid Mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Glow Spheres */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-96 -left-48 w-96 h-96 bg-purple-600/15 blur-[100px] rounded-full" />
        <div className="absolute top-[800px] -right-48 w-96 h-96 bg-emerald-600/10 blur-[100px] rounded-full" />
        
        {/* Subtle Engineering Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          
          {/* Release & Architecture Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xl backdrop-blur-md hover:border-blue-500/50 transition-all cursor-default">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-200">160,760+ Developers in Pakistan 🇵🇰</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">100M+ Worldwide</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400 font-medium lowercase">7-day weekly snapshots</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            Track, Rank & Benchmark <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Millions of GitHub Contributors
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            Index and rank open-source engineers across Pakistan and 190+ countries worldwide with true 365-day contribution tracking, regional leaderboards, and zero-lag 7-day snapshot caching.
          </p>

          {/* Search Bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl shadow-blue-950/20 backdrop-blur-xl focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <div className="relative flex-1 w-full flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search GitHub username (e.g. waleedcodes, torvalds)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 h-12 text-sm sm:text-base border-0 focus-visible:ring-0 shadow-none bg-transparent text-white placeholder:text-slate-500"
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="w-full sm:w-auto h-12 px-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 gap-2 transition-all"
              >
                <span>Analyze Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Popular Profiles Links */}
          <div className="mt-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Explore Featured Open-Source Leaders
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              {POPULAR_DEVELOPERS.map((dev) => (
                <Link
                  key={dev.username}
                  href={`/profile/${dev.username}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-800/80 hover:scale-105 transition-all text-xs font-medium text-slate-300 group shadow-xs"
                >
                  <Avatar className="w-5 h-5 border border-slate-700">
                    <AvatarImage src={dev.avatar} alt={dev.username} />
                    <AvatarFallback className="text-[10px]">{dev.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-slate-400 group-hover:text-blue-400 font-semibold">{dev.flag} {dev.name}</span>
                  <span className="text-slate-400 text-[11px]">@{dev.username}</span>
                  <span className="text-blue-400/90 font-mono text-[11px]">
                    {formatNumber(dev.contributions)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Action Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
            <Link href="/leaderboard" className="inline-flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Global Rankings</span>
            </Link>
            <span>•</span>
            <Link href="/leaderboard?location=Pakistan" className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <span>🇵🇰 Pakistan Leaderboard</span>
            </Link>
            <span>•</span>
            <Link href="/analytics?compare=waleedcodes,torvalds" className="inline-flex items-center gap-1.5 hover:text-purple-400 transition-colors">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Developer Duel</span>
            </Link>
            <span>•</span>
            <a href="#readme-badge" className="inline-flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>README Badge Generator</span>
            </a>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. LIVE PLATFORM METRICS */}
        {/* ========================================================================= */}
        <section className="py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Metric 1: Pakistan Community */}
            <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all">
              <CardContent className="p-5 sm:p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="text-xl">🇵🇰</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pakistan Devs</p>
                  <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                    160,760
                  </h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active on GitHub</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metric 2: Worldwide Reach */}
            <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all">
              <CardContent className="p-5 sm:p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Global Developers</p>
                  <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                    100M+
                  </h3>
                  <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3" />
                    <span>Worldwide Network</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metric 3: Contributions */}
            <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all">
              <CardContent className="p-5 sm:p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <GitCommit className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Annual Contributions</p>
                  <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                    {isLoading ? '...' : formatNumber(stats.totalContributions || 958611)}+
                  </h3>
                  <p className="text-[10px] text-purple-400 flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3" />
                    <span>365-Day GraphQL Truth</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metric 4: Verified Maintainers */}
            <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-all">
              <CardContent className="p-5 sm:p-6 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ranked Maintainers</p>
                  <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                    Top 256
                  </h3>
                  <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>Min 69 Followers Cohort</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zero Lag Cache Notice */}
          <div className="mt-4 p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-blue-300">Weekly Snapshot Cadence:</strong> Database snapshots are refreshed every 7 days in the background via automated workers, guaranteeing 0ms API response time.
              </span>
            </div>
            <Link href="/leaderboard" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 shrink-0">
              <span>View Leaderboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ELEVATED 3D PODIUM SHOWCASE (TOP 3) */}
        {/* ========================================================================= */}
        <section className="py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-3">
              <Crown className="w-4 h-4" />
              <span>Global Open Source Champions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Top 3 Verified Contributors
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Real developers ranked by all 365-day contributions including commits, pull requests, and verified code reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-end">
            
            {/* Rank #2: Silver (Left) */}
            {topThree[1] && (
              <div className="order-2 md:order-1 rounded-3xl p-6 bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950 border border-slate-700/80 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                    #2
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono border-slate-700 bg-slate-800/50 text-slate-300">
                    <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: getLanguageColor(topThree[1].lang) }} />
                    {topThree[1].lang}
                  </Badge>
                </div>

                <div className="text-center my-3">
                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-slate-400/40 shadow-xl group-hover:scale-105 transition-transform">
                    <AvatarImage src={topThree[1].avatar} alt={topThree[1].username} />
                    <AvatarFallback className="font-bold text-lg">{topThree[1].username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg text-white mt-3 group-hover:text-blue-400 transition-colors">
                    {topThree[1].name}
                  </h3>
                  <p className="text-xs text-slate-400">@{topThree[1].username}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{topThree[1].location}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="font-black text-white text-base block">
                      {formatNumber(topThree[1].contributions)}
                    </span>
                    <span className="text-slate-400 text-[10px]">contributions</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="font-black text-white text-base block">
                      {formatNumber(topThree[1].repos)}
                    </span>
                    <span className="text-slate-400 text-[10px]">repositories</span>
                  </div>
                </div>

                <Link
                  href={`/profile/${topThree[1].username}`}
                  className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Full Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Rank #1: Gold (Center Elevated) */}
            {topThree[0] && (
              <div className="order-1 md:order-2 rounded-3xl p-7 bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/10 hover:-translate-y-3 transition-all duration-300 flex flex-col justify-between relative md:-translate-y-4 group">
                
                {/* Crown decoration */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  <span>#1 WORLDWIDE</span>
                </div>

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-lg shadow-amber-500/30">
                    #1
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono border-amber-500/40 bg-amber-500/10 text-amber-300">
                    <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: getLanguageColor(topThree[0].lang) }} />
                    {topThree[0].lang}
                  </Badge>
                </div>

                <div className="text-center my-3">
                  <Avatar className="w-24 h-24 mx-auto ring-4 ring-amber-400 shadow-2xl group-hover:scale-105 transition-transform">
                    <AvatarImage src={topThree[0].avatar} alt={topThree[0].username} />
                    <AvatarFallback className="font-bold text-2xl">{topThree[0].username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-black text-xl text-white mt-3 group-hover:text-amber-400 transition-colors">
                    {topThree[0].name}
                  </h3>
                  <p className="text-xs text-amber-400/90 font-medium">@{topThree[0].username}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{topThree[0].location}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="font-black text-amber-300 text-lg block">
                      {formatNumber(topThree[0].contributions)}
                    </span>
                    <span className="text-slate-400 text-[10px]">contributions</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/40">
                    <span className="font-black text-white text-lg block">
                      {formatNumber(topThree[0].repos)}
                    </span>
                    <span className="text-slate-400 text-[10px]">repositories</span>
                  </div>
                </div>

                <Link
                  href={`/profile/${topThree[0].username}`}
                  className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <span>Inspect Champion Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Rank #3: Bronze (Right) */}
            {topThree[2] && (
              <div className="order-3 rounded-3xl p-6 bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950 border border-slate-700/80 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-700/80 text-white flex items-center justify-center font-black text-sm shadow-md">
                    #3
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono border-slate-700 bg-slate-800/50 text-slate-300">
                    <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: getLanguageColor(topThree[2].lang) }} />
                    {topThree[2].lang}
                  </Badge>
                </div>

                <div className="text-center my-3">
                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-amber-700/40 shadow-xl group-hover:scale-105 transition-transform">
                    <AvatarImage src={topThree[2].avatar} alt={topThree[2].username} />
                    <AvatarFallback className="font-bold text-lg">{topThree[2].username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg text-white mt-3 group-hover:text-blue-400 transition-colors">
                    {topThree[2].name}
                  </h3>
                  <p className="text-xs text-slate-400">@{topThree[2].username}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{topThree[2].location}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="font-black text-white text-base block">
                      {formatNumber(topThree[2].contributions)}
                    </span>
                    <span className="text-slate-400 text-[10px]">contributions</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="font-black text-white text-base block">
                      {formatNumber(topThree[2].repos)}
                    </span>
                    <span className="text-slate-400 text-[10px]">repositories</span>
                  </div>
                </div>

                <Link
                  href={`/profile/${topThree[2].username}`}
                  className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Full Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. COUNTRY & REGIONAL EXPLORER (committers.top Feature) */}
        {/* ========================================================================= */}
        <section className="py-12 border-t border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Geographic Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Country & Regional Leaderboards
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore verified open-source contributors filtered by country or city.
              </p>
            </div>

            <Link 
              href={`/leaderboard${activeCountry !== 'all' ? `?location=${COUNTRY_TABS.find(t=>t.id===activeCountry)?.query}` : ''}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>View Full {COUNTRY_TABS.find(t=>t.id===activeCountry)?.name} Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Country Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {COUNTRY_TABS.map((tab) => {
              const isActive = activeCountry === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCountry(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/50'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="text-sm">{tab.flag}</span>
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Country View */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            
            {activeCountry === 'all' ? (
              // Worldwide view: Top table preview
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 font-semibold uppercase">
                  <span>Developer</span>
                  <div className="flex items-center gap-6">
                    <span className="hidden sm:inline">Top Stack</span>
                    <span>Total Contributions</span>
                  </div>
                </div>

                {topThree.map((user) => (
                  <Link
                    key={user.username}
                    href={`/profile/${user.username}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                        #{user.rank}
                      </div>
                      <Avatar className="w-9 h-9 border border-slate-700">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </h4>
                        <p className="text-xs text-slate-400">@{user.username} • {user.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono border-slate-700 text-slate-300">
                        <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: getLanguageColor(user.lang) }} />
                        {user.lang}
                      </Badge>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-blue-400 block font-mono">
                          {formatNumber(user.contributions)}
                        </span>
                        <span className="text-[10px] text-slate-400">{user.repos} repos</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : isCountryLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span>Fetching {COUNTRY_TABS.find(t=>t.id===activeCountry)?.name} rankings...</span>
              </div>
            ) : countryUsers.length > 0 ? (
              <div className="space-y-3">
                {/* Country scale indicator banner */}
                <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between gap-3 text-xs mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{COUNTRY_TABS.find(t=>t.id===activeCountry)?.flag}</span>
                    <span className="text-slate-300 leading-relaxed">
                      {activeCountry === 'Pakistan' 
                        ? '160,760 active GitHub developers in Pakistan. Indexing top maintainers nationwide (committers.top model, min 69 followers required).'
                        : `Showing top ranked contributors in ${COUNTRY_TABS.find(t=>t.id===activeCountry)?.name} with verified full-year GraphQL contributions.`}
                    </span>
                  </div>
                  <Link 
                    href={`/leaderboard?location=${COUNTRY_TABS.find(t=>t.id===activeCountry)?.query}`}
                    className="text-blue-400 hover:text-blue-300 font-semibold shrink-0"
                  >
                    View All 256 &rarr;
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 font-semibold uppercase">
                  <span>{COUNTRY_TABS.find(t=>t.id===activeCountry)?.name} Developer</span>
                  <div className="flex items-center gap-6">
                    <span className="hidden sm:inline">Location</span>
                    <span>Contributions</span>
                  </div>
                </div>

                {countryUsers.map((user, idx) => (
                  <Link
                    key={user.username || idx}
                    href={`/profile/${user.username}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/40 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{idx + 1}
                      </div>
                      <Avatar className="w-9 h-9 border border-slate-700">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {user.name || user.username}
                          </h4>
                          {idx === 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] py-0">
                              #1 {COUNTRY_TABS.find(t=>t.id===activeCountry)?.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">@{user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="hidden sm:inline text-xs text-slate-400">{user.location || 'Local'}</span>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-blue-400 block font-mono">
                          {formatNumber(user.totalContributions || user.totalCommits || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400">{user.publicRepos || 0} repos</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // Default fallback for countries with few seeded developers
              <div className="p-6 text-center">
                <p className="text-sm text-slate-400 mb-4">
                  No cached profiles indexed yet for {COUNTRY_TABS.find(t=>t.id===activeCountry)?.name}.
                </p>
                <Link
                  href={`/profile/${COUNTRY_TABS.find(t=>t.id===activeCountry)?.highlight || 'waleedcodes'}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <span>Explore Featured Profile: @{COUNTRY_TABS.find(t=>t.id===activeCountry)?.highlight || 'waleedcodes'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. INTERACTIVE README BADGE GENERATOR (Direct on Home Page) */}
        {/* ========================================================================= */}
        <section id="readme-badge" className="py-16 border-t border-slate-800/80">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-slate-900 border border-blue-800/40 relative overflow-hidden shadow-2xl">
            
            {/* Ambient Corner Light */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-400/30">
                <ShieldCheck className="w-4 h-4" />
                <span>GitHub Profile README Widget</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Embed Your Commity Rank In Your GitHub README
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                Showcase your verified open source ranking to recruiters and collaborators. Generates an auto-updating live SVG badge for your profile.
              </p>

              {/* Username Input */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                  <Input
                    type="text"
                    value={badgeUsername}
                    onChange={(e) => setBadgeUsername(e.target.value)}
                    placeholder="Enter GitHub username (e.g. waleedcodes)..."
                    className="pl-8 bg-slate-900/90 border-slate-700 text-white h-11 text-sm rounded-xl"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant={badgeType === 'svg' ? 'default' : 'outline'}
                    onClick={() => setBadgeType('svg')}
                    className="h-11 px-4 text-xs font-semibold rounded-xl"
                  >
                    SVG Badge
                  </Button>
                  <Button
                    type="button"
                    variant={badgeType === 'shields' ? 'default' : 'outline'}
                    onClick={() => setBadgeType('shields')}
                    className="h-11 px-4 text-xs font-semibold rounded-xl"
                  >
                    Shields.io
                  </Button>
                </div>
              </div>

              {/* Live Preview & Code Box */}
              <div className="mt-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Live Badge Preview:
                  </span>
                  
                  {/* Dynamic SVG Badge Rendering */}
                  <div className="inline-flex items-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`${API_BASE}/users/${badgeUsername.trim() || 'waleedcodes'}/badge.svg`}
                      alt="Commity Rank Badge"
                      className="h-7 w-auto"
                      onError={(e) => {
                        // Fallback shield in case backend is offline
                        e.currentTarget.src = `https://img.shields.io/badge/Commity-%231%20Rank%20%E2%80%A2%204.2K%20Contribs-2563eb?style=for-the-badge&logo=github`;
                      }}
                    />
                  </div>
                </div>

                {/* Markdown Code Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-slate-400">Copy Markdown to your README.md:</span>
                    <button
                      onClick={handleCopyBadge}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedBadge ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-xs text-blue-300 overflow-x-auto selection:bg-blue-500">
                    {badgeMarkdown}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. HEAD-TO-HEAD DEVELOPER DUEL ARENA */}
        {/* ========================================================================= */}
        <section className="py-16 border-t border-slate-800/80">
          <div className="rounded-3xl p-8 sm:p-12 bg-slate-900/70 border border-slate-800 relative overflow-hidden backdrop-blur-md">
            
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-2">
                <Code2 className="w-3.5 h-3.5" />
                <span>Developer Duel Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Compare Any Two Contributors Side-by-Side
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Benchmark contribution volumes, repository popularity, and programming languages between top open-source engineers.
              </p>
            </div>

            {/* Duel Arena Form */}
            <form onSubmit={handleCompare} className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                
                {/* User 1 */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                    <Input
                      type="text"
                      placeholder="User 1 (e.g. waleedcodes)"
                      value={compareUser1}
                      onChange={(e) => setCompareUser1(e.target.value)}
                      className="pl-8 bg-slate-950/80 border-slate-700 text-white h-12 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>

                {/* VS Badge */}
                <div className="sm:col-span-1 flex justify-center py-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-purple-600/30">
                    VS
                  </div>
                </div>

                {/* User 2 */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                    <Input
                      type="text"
                      placeholder="User 2 (e.g. torvalds)"
                      value={compareUser2}
                      onChange={(e) => setCompareUser2(e.target.value)}
                      className="pl-8 bg-slate-950/80 border-slate-700 text-white h-12 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-center">
                <Button 
                  type="submit" 
                  size="lg"
                  className="h-12 px-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 gap-2"
                >
                  <span>Launch Deep Comparison</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Preset Quick Matches */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Trending Duels:</span>
                {PRESET_DUELS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCompareUser1(preset.u1);
                      setCompareUser2(preset.u2);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. ARCHITECTURAL ADVANTAGES (Why Commity?) */}
        {/* ========================================================================= */}
        <section className="py-16 border-t border-slate-800/80">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Engineered for Open-Source Scale
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Combining the proven 7-day stability of committers.top with modern interactive developer analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">7-Day Weekly Snapshots</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Background cron workers pre-compute rankings and cache user snapshots in MongoDB Atlas, providing 0ms responses without hitting GitHub rate limits.
              </p>
              <Link href="/leaderboard" className="text-xs font-semibold text-blue-400 hover:underline inline-flex items-center gap-1 pt-1">
                Explore Leaderboards &rarr;
              </Link>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">365-Day GraphQL Truth</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We pull the complete contribution calendar, counting all 4,000+ contributions (commits, PRs, issues, code reviews) rather than just default-branch commits.
              </p>
              <Link href="/analytics" className="text-xs font-semibold text-purple-400 hover:underline inline-flex items-center gap-1 pt-1">
                View Global Analytics &rarr;
              </Link>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Dynamic README Badges</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-resolution SVG badges to embed in your GitHub profile README. Visitors see your national and global Commity ranking in real-time.
              </p>
              <a href="#readme-badge" className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1 pt-1">
                Generate Your Badge &rarr;
              </a>
            </Card>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. FREQUENTLY ASKED QUESTIONS */}
        {/* ========================================================================= */}
        <section className="py-16 border-t border-slate-800/80">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Learn how Commity keeps open source metrics fast, accurate, and accessible.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full p-4 sm:p-5 text-left font-semibold text-sm sm:text-base text-white flex items-center justify-between gap-4"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. BOTTOM CALL TO ACTION */}
        {/* ========================================================================= */}
        <section className="py-16 mb-12">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Start Tracking Your Open Source Impact
              </h2>
              <p className="text-blue-100 text-sm sm:text-base mt-2">
                Join developers worldwide benchmarking their annual contributions and claiming their country ranks.
              </p>

              <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input
                  type="text"
                  placeholder="Your GitHub username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200 text-sm rounded-xl"
                />
                <Button 
                  type="submit" 
                  className="h-12 px-6 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg shrink-0"
                >
                  Analyze Me
                </Button>
              </form>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
