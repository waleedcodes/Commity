'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Trophy, 
  Sparkles, 
  GitCompareArrows, 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeftRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Palette,
  Users,
  FolderGit2,
  Crown,
  Zap,
  Award,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { formatNumber } from '../utils/helpers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const POPULAR_EXAMPLES = [
  { username: 'waleedcodes', name: 'Waleed Ishfaq 🇵🇰' },
  { username: 'sufiyanshahiddev', name: 'Sufiyan Shahid 🇵🇰' },
  { username: 'torvalds', name: 'Linus Torvalds 🇺🇸' },
  { username: 'antfu', name: 'Anthony Fu 🇯🇵' },
  { username: 'bijay-shre-stha', name: 'Bijay Shrestha 🇳🇵' }
];

const THEMES = [
  { id: 'default', label: 'Default', bg: '#0d1117', border: '#30363d', ring: '#f97316' },
  { id: 'github', label: 'GitHub Green', bg: '#0d1117', border: '#238636', ring: '#39d353' },
  { id: 'radical', label: 'Radical', bg: '#141321', border: '#fe428e', ring: '#fe428e' },
  { id: 'tokyonight', label: 'Tokyo Night', bg: '#1a1b26', border: '#7aa2f7', ring: '#bb9af7' },
  { id: 'dracula', label: 'Dracula', bg: '#282a36', border: '#ff79c6', ring: '#50fa7b' },
  { id: 'react', label: 'React Blue', bg: '#20232a', border: '#61dafb', ring: '#61dafb' }
];

// Helper: Milestone progress calculation
const getMilestoneInfo = (currentStreak) => {
  const streak = Number(currentStreak) || 0;
  let target = 100;
  if (streak >= 100 && streak < 365) target = 365;
  else if (streak >= 365 && streak < 500) target = 500;
  else if (streak >= 500 && streak < 1000) target = 1000;
  else if (streak >= 1000 && streak < 1500) target = 1500;
  else if (streak >= 1500 && streak < 2000) target = 2000;
  else if (streak >= 2000) target = Math.ceil((streak + 1) / 500) * 500;

  const pct = Math.min(100, Math.round((streak / target) * 100));
  const remaining = Math.max(0, target - streak);
  return { target, pct, remaining };
};

// Helper: Proportional comparative duel ratio
const getRatio = (valA, valB) => {
  const a = Number(valA) || 0;
  const b = Number(valB) || 0;
  const sum = a + b;
  if (sum === 0) return { pctA: 50, pctB: 50 };
  const rawPctA = Math.round((a / sum) * 100);
  const clampedA = Math.max(10, Math.min(90, rawPctA));
  return {
    pctA: clampedA,
    pctB: 100 - clampedA
  };
};

// Helper: 1-Click comparison markdown table for GitHub
const generateComparisonMarkdown = (uA, uB, origin = '') => {
  if (!uA || !uB) return '';
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const streakDiff = (uA.currentStreak || 0) - (uB.currentStreak || 0);
  const streakLeader = streakDiff > 0 ? `@${uA.username} (+${streakDiff}d)` : streakDiff < 0 ? `@${uB.username} (+${Math.abs(streakDiff)}d)` : 'Tied';
  
  const totalA = uA.totalContribs ?? uA.contributions ?? 0;
  const totalB = uB.totalContribs ?? uB.contributions ?? 0;
  const totalDiff = totalA - totalB;
  const totalLeader = totalDiff > 0 ? `@${uA.username} (+${totalDiff.toLocaleString()})` : totalDiff < 0 ? `@${uB.username} (+${Math.abs(totalDiff).toLocaleString()})` : 'Tied';

  const longestDiff = (uA.longestStreak || 0) - (uB.longestStreak || 0);
  const longestLeader = longestDiff > 0 ? `@${uA.username} (+${longestDiff}d)` : longestDiff < 0 ? `@${uB.username} (+${Math.abs(longestDiff)}d)` : 'Tied';

  const followerDiff = (uA.followers || 0) - (uB.followers || 0);
  const followerLeader = followerDiff > 0 ? `@${uA.username}` : followerDiff < 0 ? `@${uB.username}` : 'Tied';

  const repoDiff = (uA.repos || 0) - (uB.repos || 0);
  const repoLeader = repoDiff > 0 ? `@${uA.username}` : repoDiff < 0 ? `@${uB.username}` : 'Tied';

  return `### ⚡ Commity GitHub Developer Head-to-Head
| Metric | [@${uA.username}](${base}/profile/${uA.username}) | [@${uB.username}](${base}/profile/${uB.username}) | Leader / Winner |
| :--- | :---: | :---: | :---: |
| **Current Streak** | 🔥 ${formatNumber(uA.currentStreak)} Days | 🔥 ${formatNumber(uB.currentStreak)} Days | **${streakLeader}** |
| **Longest Streak** | 🏆 ${formatNumber(uA.longestStreak)} Days | 🏆 ${formatNumber(uB.longestStreak)} Days | **${longestLeader}** |
| **Total Contributions** | 📦 ${formatNumber(totalA)} | 📦 ${formatNumber(totalB)} | **${totalLeader}** |
| **Public Contributions** | ${formatNumber(uA.publicContribs || 0)} | ${formatNumber(uB.publicContribs || 0)} | - |
| **Private Contributions** | ${formatNumber(uA.privateContribs || 0)} | ${formatNumber(uB.privateContribs || 0)} | - |
| **Followers** | 👥 ${formatNumber(uA.followers || 0)} | 👥 ${formatNumber(uB.followers || 0)} | **${followerLeader}** |
| **Public Repositories** | 📁 ${uA.repos || 0} | 📁 ${uB.repos || 0} | **${repoLeader}** |
| **Daily Velocity** | ⚡ ${uA.averagePerDay || 0} / day | ⚡ ${uB.averagePerDay || 0} / day | - |

*Comparison generated live by [Commity](${base}/profile)*`;
};

// Helper: Compute Category Verdict Champions
const getVerdicts = (uA, uB) => {
  if (!uA || !uB) return null;
  const totalA = uA.totalContribs ?? uA.contributions ?? 0;
  const totalB = uB.totalContribs ?? uB.contributions ?? 0;
  return {
    streakWinner: (uA.currentStreak || 0) >= (uB.currentStreak || 0) ? uA : uB,
    streakDiff: Math.abs((uA.currentStreak || 0) - (uB.currentStreak || 0)),
    volumeWinner: totalA >= totalB ? uA : uB,
    volumeDiff: Math.abs(totalA - totalB),
    followerWinner: (uA.followers || 0) >= (uB.followers || 0) ? uA : uB,
    followerDiff: Math.abs((uA.followers || 0) - (uB.followers || 0)),
    repoWinner: (uA.repos || 0) >= (uB.repos || 0) ? uA : uB,
    repoDiff: Math.abs((uA.repos || 0) - (uB.repos || 0)),
    velocityWinner: (uA.averagePerDay || 0) >= (uB.averagePerDay || 0) ? uA : uB,
    velocityDiff: Math.abs(Math.round(((uA.averagePerDay || 0) - (uB.averagePerDay || 0)) * 10) / 10)
  };
};

export default function StreakStudio({ initialUser = 'waleedcodes', initialCompareUser = 'sufiyanshahiddev' }) {
  const [mode, setMode] = useState('single'); // 'single' | 'compare'
  
  // Single user state
  const [singleUsername, setSingleUsername] = useState(initialUser);
  const [activeUser, setActiveUser] = useState(initialUser);
  const [streakData, setStreakData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [singleError, setSingleError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [hideBorder, setHideBorder] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [badgeFormat, setBadgeFormat] = useState('markdown'); // 'markdown' | 'html'

  // Compare mode state
  const [userAInput, setUserAInput] = useState(initialUser);
  const [userBInput, setUserBInput] = useState(initialCompareUser);
  const [activeUserA, setActiveUserA] = useState(initialUser);
  const [activeUserB, setActiveUserB] = useState(initialCompareUser);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [compareTheme, setCompareTheme] = useState('default');
  const [showCompareBadges, setShowCompareBadges] = useState(false);
  const [compareTableCopied, setCompareTableCopied] = useState(false);

  // Fetch Single User Streak & Profile (100% Real API)
  const fetchSingleUser = useCallback(async (usernameToFetch) => {
    if (!usernameToFetch || !usernameToFetch.trim()) return;
    const cleanUser = usernameToFetch.trim().toLowerCase();
    
    setIsLoadingSingle(true);
    setSingleError(null);

    try {
      // Parallel fetch for streak stats and user profile
      const [streakRes, profileRes] = await Promise.allSettled([
        fetch(`${API_BASE}/users/${encodeURIComponent(cleanUser)}/streak`),
        fetch(`${API_BASE}/users/${encodeURIComponent(cleanUser)}`)
      ]);

      let streakObj = null;
      if (streakRes.status === 'fulfilled' && streakRes.value.ok) {
        const json = await streakRes.value.json();
        if (json.success && json.data) streakObj = json.data;
      }

      let profileObj = null;
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const json = await profileRes.value.json();
        if (json.success && json.data) profileObj = json.data;
      }

      if (!streakObj && !profileObj) {
        throw new Error(`Unable to fetch real GitHub streak stats for @${cleanUser}. Make sure the username exists.`);
      }

      setStreakData(streakObj);
      setUserProfile(profileObj);
      setActiveUser(cleanUser);
    } catch (err) {
      console.error('Error fetching streak stats:', err);
      setSingleError(err.message || 'Failed to calculate authentic streak stats');
    } finally {
      setIsLoadingSingle(false);
    }
  }, []);

  // Fetch Compare Data for Both Users (100% Real API)
  const fetchCompareData = useCallback(async (uA, uB) => {
    if (!uA || !uB) return;
    const cleanA = uA.trim().toLowerCase();
    const cleanB = uB.trim().toLowerCase();

    setIsLoadingCompare(true);
    setCompareError(null);

    try {
      const [streakARes, profARes, streakBRes, profBRes] = await Promise.allSettled([
        fetch(`${API_BASE}/users/${encodeURIComponent(cleanA)}/streak`),
        fetch(`${API_BASE}/users/${encodeURIComponent(cleanA)}`),
        fetch(`${API_BASE}/users/${encodeURIComponent(cleanB)}/streak`),
        fetch(`${API_BASE}/users/${encodeURIComponent(cleanB)}`)
      ]);

      const getStreak = async (res) => {
        if (res.status === 'fulfilled' && res.value.ok) {
          const json = await res.value.json();
          return json.success ? json.data : null;
        }
        return null;
      };

      const getProfile = async (res) => {
        if (res.status === 'fulfilled' && res.value.ok) {
          const json = await res.value.json();
          return json.success ? json.data : null;
        }
        return null;
      };

      const [sA, pA, sB, pB] = await Promise.all([
        getStreak(streakARes),
        getProfile(profARes),
        getStreak(streakBRes),
        getProfile(profBRes)
      ]);

      // Merge real profile and streak data for A
      setDataA({
        username: cleanA,
        name: pA?.name || sA?.username || cleanA,
        avatar: pA?.avatarUrl || `https://github.com/${cleanA}.png`,
        rank: pA?.countryRank ? `#${pA.countryRank} Pakistan` : 'Maintainer',
        location: pA?.location || 'Global',
        followers: pA?.followers || 0,
        repos: pA?.publicRepos || 0,
        publicContribs: pA?.publicContributions || sA?.totalContributions || 0,
        privateContribs: pA?.privateContributions || 0,
        totalContribs: sA?.totalContributions || pA?.totalContributions || 0,
        currentStreak: sA?.currentStreak ?? 0,
        longestStreak: sA?.longestStreak ?? 0,
        currentStreakStart: sA?.currentStreakStart,
        currentStreakEnd: sA?.currentStreakEnd,
        longestStreakStart: sA?.longestStreakStart,
        longestStreakEnd: sA?.longestStreakEnd,
        totalContributionsStart: sA?.totalContributionsStart || 'All-time',
        activeDays: sA?.activeDays || 0,
        averagePerDay: sA?.averagePerDay || 0,
        lang: pA?.topLanguages?.[0]?.name || 'TypeScript'
      });

      // Merge real profile and streak data for B
      setDataB({
        username: cleanB,
        name: pB?.name || sB?.username || cleanB,
        avatar: pB?.avatarUrl || `https://github.com/${cleanB}.png`,
        rank: pB?.countryRank ? `#${pB.countryRank} Pakistan` : 'Maintainer',
        location: pB?.location || 'Global',
        followers: pB?.followers || 0,
        repos: pB?.publicRepos || 0,
        publicContribs: pB?.publicContributions || sB?.totalContributions || 0,
        privateContribs: pB?.privateContributions || 0,
        totalContribs: sB?.totalContributions || pB?.totalContributions || 0,
        currentStreak: sB?.currentStreak ?? 0,
        longestStreak: sB?.longestStreak ?? 0,
        currentStreakStart: sB?.currentStreakStart,
        currentStreakEnd: sB?.currentStreakEnd,
        longestStreakStart: sB?.longestStreakStart,
        longestStreakEnd: sB?.longestStreakEnd,
        totalContributionsStart: sB?.totalContributionsStart || 'All-time',
        activeDays: sB?.activeDays || 0,
        averagePerDay: sB?.averagePerDay || 0,
        lang: pB?.topLanguages?.[0]?.name || 'Python'
      });

      setActiveUserA(cleanA);
      setActiveUserB(cleanB);
    } catch (err) {
      console.error('Error fetching comparison:', err);
      setCompareError('Failed to fetch real comparison data. Please verify both usernames.');
    } finally {
      setIsLoadingCompare(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSingleUser(activeUser);
  }, [fetchSingleUser, activeUser]);

  useEffect(() => {
    if (mode === 'compare') {
      fetchCompareData(activeUserA, activeUserB);
    }
  }, [mode, activeUserA, activeUserB, fetchCompareData]);

  // Handle single calculate
  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (singleUsername.trim()) {
      fetchSingleUser(singleUsername.trim());
    }
  };

  // Handle compare submit
  const handleCompareSubmit = (e) => {
    e.preventDefault();
    if (userAInput.trim() && userBInput.trim()) {
      fetchCompareData(userAInput.trim(), userBInput.trim());
    }
  };

  // Handle swap compare users
  const handleSwapUsers = () => {
    const tempA = userAInput;
    const tempB = userBInput;
    setUserAInput(tempB);
    setUserBInput(tempA);
    fetchCompareData(tempB, tempA);
  };

  // README badge snippet
  const appBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const svgBadgeUrl = `${API_BASE}/users/${activeUser}/streak.svg?theme=${selectedTheme}${hideBorder ? '&hide_border=true' : ''}`;
  const markdownCode = `[![GitHub Streak](${svgBadgeUrl})](${appBase}/profile/${activeUser})`;
  const htmlCode = `<a href="${appBase}/profile/${activeUser}"><img src="${svgBadgeUrl}" alt="GitHub Streak" /></a>`;

  const handleCopyCode = () => {
    const text = badgeFormat === 'markdown' ? markdownCode : htmlCode;
    navigator.clipboard.writeText(text);
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                GitHub Streak Stats & Tracker
              </h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                100% Real GraphQL Data
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Generate authentic multi-year contribution streak cards, compare developer momentum head-to-head, and embed dynamic SVG badges in your GitHub README.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                mode === 'single'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Single User</span>
            </button>
            <button
              onClick={() => setMode('compare')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                mode === 'compare'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCompareArrows className="w-4 h-4" />
              <span>Head-to-Head Compare</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SINGLE USER MODE */}
      {/* ========================================================================= */}
      {mode === 'single' && (
        <div className="space-y-8">
          
          {/* Search Input Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
            <form onSubmit={handleSingleSubmit} className="relative flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-700 shadow-inner focus-within:border-amber-500 transition-all">
              <div className="pl-4 pr-2 text-slate-400">
                <FolderGit2 className="w-5 h-5 text-amber-400" />
              </div>
              <Input
                type="text"
                value={singleUsername}
                onChange={(e) => setSingleUsername(e.target.value)}
                placeholder="Enter any GitHub username (e.g. waleedcodes, torvalds, antfu)..."
                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-500 font-medium text-sm sm:text-base py-3"
              />
              <Button
                type="submit"
                disabled={isLoadingSingle || !singleUsername.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 text-xs sm:text-sm"
              >
                {isLoadingSingle ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Calculate Streak</span>
                  </>
                )}
              </Button>
            </form>

            {/* Popular Examples Quick-Select */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-medium">Quick examples:</span>
              {POPULAR_EXAMPLES.map((ex) => (
                <button
                  key={ex.username}
                  type="button"
                  onClick={() => {
                    setSingleUsername(ex.username);
                    fetchSingleUser(ex.username);
                  }}
                  className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all ${
                    activeUser === ex.username
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {singleError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{singleError}</span>
              <Button size="sm" variant="outline" onClick={() => fetchSingleUser(activeUser)} className="border-rose-500/30 text-rose-300 text-xs h-7">
                Retry
              </Button>
            </div>
          )}

          {/* Authentic 3-Column Streak Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-amber-400 shadow-md">
                  <AvatarImage src={userProfile?.avatarUrl || `https://github.com/${activeUser}.png`} alt={activeUser} />
                  <AvatarFallback className="bg-slate-800 text-amber-400 font-bold">{activeUser.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{userProfile?.name || activeUser}</h3>
                    <span className="text-xs text-blue-400 font-mono">@{activeUser}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {userProfile?.location || 'Verified GitHub Developer'} • {userProfile?.followers || 0} Followers
                  </p>
                </div>
              </div>

              <Link href={`/profile/${activeUser}`}>
                <Button size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-950 text-slate-200">
                  <span>View Full Profile</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                </Button>
              </Link>
            </div>

            {/* 3 Iconic Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              
              {/* Col 1: Total Contributions */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 relative group hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {streakData ? formatNumber(streakData.totalContributions) : '...'}
                </p>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Total Contributions
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {streakData?.totalContributionsStart ? `${streakData.totalContributionsStart} - Present` : 'All Time'}
                </p>
              </div>

              {/* Col 2: Current Streak (Centerpiece Flame) */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-950 border border-amber-500/30 space-y-2 relative group shadow-lg shadow-amber-500/5">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-spin-slow" />
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
                    <Flame className="w-6 h-6 animate-bounce" />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                  {streakData ? `${formatNumber(streakData.currentStreak)} Days` : '...'}
                </p>
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Current Streak
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {streakData?.currentStreakStart && streakData?.currentStreakEnd 
                    ? `${streakData.currentStreakStart} - ${streakData.currentStreakEnd}` 
                    : 'Active continuous streak'}
                </p>
              </div>

              {/* Col 3: Longest Streak (Trophy) */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 relative group hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  {streakData ? `${formatNumber(streakData.longestStreak)} Days` : '...'}
                </p>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Longest Streak
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {streakData?.longestStreakStart && streakData?.longestStreakEnd 
                    ? `${streakData.longestStreakStart} - ${streakData.longestStreakEnd}` 
                    : 'All-time personal record'}
                </p>
              </div>

            </div>

            {/* Streak Milestone Progress Card */}
            {(() => {
              const milestone = streakData ? getMilestoneInfo(streakData.currentStreak) : null;
              if (!milestone) return null;
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-orange-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Trophy className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-white block">
                          Next Milestone: {formatNumber(milestone.target)}-Day Streak Club
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Consistent daily GitHub commit dedication
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/20 text-amber-300 font-mono text-[11px] border-amber-500/40">
                        {milestone.pct}% Complete
                      </Badge>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {milestone.remaining > 0 ? `${formatNumber(milestone.remaining)} days left` : 'Goal reached! 🎉'}
                      </span>
                    </div>
                  </div>
                  {/* Glowing Progress Track */}
                  <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                    <div 
                      style={{ width: `${milestone.pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 shadow-md shadow-amber-500/40 transition-all duration-700"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Velocity & Analytics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">Active Days</p>
                <p className="text-base font-bold text-white mt-0.5">{streakData ? formatNumber(streakData.activeDays || 0) : '0'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">Daily Velocity</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{streakData?.averagePerDay || 0} / day</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">Joined GitHub</p>
                <p className="text-base font-bold text-blue-400 mt-0.5">{streakData?.joinedYear || 2022}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">Public Repositories</p>
                <p className="text-base font-bold text-purple-400 mt-0.5">{userProfile?.publicRepos || 0}</p>
              </div>
            </div>

            {/* Theme Selector & Card Preview */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Card Theme & Styling</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setSelectedTheme(th.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        selectedTheme === th.id
                          ? 'bg-white text-slate-950 shadow-md font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: th.ring || th.border }} />
                      <span>{th.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHideBorder(!hideBorder)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      hideBorder
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hideBorder ? 'Border: Off' : 'Border: On'}
                  </button>
                </div>
              </div>

              {/* Dynamic SVG Card Render */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-x-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={svgBadgeUrl}
                  alt={`@${activeUser} streak stats`}
                  className="rounded-xl max-w-full h-auto shadow-xl"
                />
              </div>
            </div>

            {/* Embed in README Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Embed in GitHub Profile README
                </h4>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setBadgeFormat('markdown')}
                    className={`px-2 py-0.5 rounded ${badgeFormat === 'markdown' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setBadgeFormat('html')}
                    className={`px-2 py-0.5 rounded ${badgeFormat === 'html' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    HTML
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                <pre className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto select-all">
                  {badgeFormat === 'markdown' ? markdownCode : htmlCode}
                </pre>
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  className="absolute right-2 bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-3"
                >
                  {badgeCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span>Copy Badge</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEAD-TO-HEAD COMPARE MODE */}
      {/* ========================================================================= */}
      {mode === 'compare' && (
        <div className="space-y-8">
          
          {/* Dual Inputs Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
            <form onSubmit={handleCompareSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full relative">
                <Input
                  type="text"
                  value={userAInput}
                  onChange={(e) => setUserAInput(e.target.value)}
                  placeholder="Developer A (e.g. waleedcodes)"
                  className="bg-slate-950 border-slate-700 text-white font-medium text-sm py-2.5"
                />
              </div>

              <Button
                type="button"
                onClick={handleSwapUsers}
                variant="outline"
                className="border-slate-700 bg-slate-950 text-slate-300 hover:text-white p-2.5 h-10 w-10 shrink-0"
                title="Swap Developers"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>

              <div className="flex-1 w-full relative">
                <Input
                  type="text"
                  value={userBInput}
                  onChange={(e) => setUserBInput(e.target.value)}
                  placeholder="Developer B (e.g. sufiyanshahiddev)"
                  className="bg-slate-950 border-slate-700 text-white font-medium text-sm py-2.5"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoadingCompare || !userAInput.trim() || !userBInput.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs sm:text-sm shrink-0"
              >
                {isLoadingCompare ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span>Comparing...</span>
                  </>
                ) : (
                  <>
                    <GitCompareArrows className="w-4 h-4 mr-2" />
                    <span>Compare Now</span>
                  </>
                )}
              </Button>
            </form>

            {/* Popular Compare Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-medium">Quick matchups:</span>
              {[
                { a: 'waleedcodes', b: 'sufiyanshahiddev', label: 'Waleed (#38) vs Sufiyan (#1 PK)' },
                { a: 'waleedcodes', b: 'torvalds', label: 'Waleed vs Linus Torvalds' },
                { a: 'antfu', b: 'sindresorhus', label: 'Anthony Fu vs Sindre Sorhus' }
              ].map((m) => (
                <button
                  key={`${m.a}-${m.b}`}
                  type="button"
                  onClick={() => {
                    setUserAInput(m.a);
                    setUserBInput(m.b);
                    fetchCompareData(m.a, m.b);
                  }}
                  className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all ${
                    activeUserA === m.a && activeUserB === m.b
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {compareError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {compareError}
            </div>
          )}

          {/* Side-by-Side Head-to-Head Card */}
          {dataA && dataB && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-8">
              
              {/* Top Developers Comparison Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* Developer A Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-3 relative">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16 ring-2 ring-blue-500 shadow-lg">
                      <AvatarImage src={dataA.avatar} alt={dataA.username} />
                      <AvatarFallback className="bg-slate-800 text-blue-400 font-bold">{dataA.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-lg truncate">{dataA.name}</h4>
                      <p className="text-xs text-blue-400 font-mono">@{dataA.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">{dataA.rank}</Badge>
                        <span className="text-[11px] text-slate-400">{dataA.location}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/profile/${dataA.username}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs border-slate-700 bg-slate-900 text-slate-200 mt-2">
                      <span>View @{dataA.username}</span>
                      <ExternalLink className="w-3 h-3 ml-1.5 text-slate-400" />
                    </Button>
                  </Link>
                </div>

                {/* Developer B Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 relative">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16 ring-2 ring-indigo-500 shadow-lg">
                      <AvatarImage src={dataB.avatar} alt={dataB.username} />
                      <AvatarFallback className="bg-slate-800 text-indigo-400 font-bold">{dataB.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-lg truncate">{dataB.name}</h4>
                      <p className="text-xs text-indigo-400 font-mono">@{dataB.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-indigo-500/20 text-indigo-300 text-[10px]">{dataB.rank}</Badge>
                        <span className="text-[11px] text-slate-400">{dataB.location}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/profile/${dataB.username}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs border-slate-700 bg-slate-900 text-slate-200 mt-2">
                      <span>View @{dataB.username}</span>
                      <ExternalLink className="w-3 h-3 ml-1.5 text-slate-400" />
                    </Button>
                  </Link>
                </div>

              </div>

              {/* Automated Category Verdicts Card */}
              {(() => {
                const verdicts = getVerdicts(dataA, dataB);
                if (!verdicts) return null;
                return (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-blue-500/10 border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <Crown className="w-4 h-4" />
                        </span>
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Trophy & Momentum Verdict
                        </h4>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono border-amber-500/30">
                        Live Evaluation
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Streak Champion */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                          <Flame className="w-3.5 h-3.5" />
                          <span>Streak Champ</span>
                        </div>
                        <p className="text-sm font-black text-white truncate">@{verdicts.streakWinner.username}</p>
                        <p className="text-[10px] text-amber-300 font-mono">+{formatNumber(verdicts.streakDiff)}d lead</p>
                      </div>

                      {/* Volume Champion */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Volume Champ</span>
                        </div>
                        <p className="text-sm font-black text-white truncate">@{verdicts.volumeWinner.username}</p>
                        <p className="text-[10px] text-blue-300 font-mono">+{formatNumber(verdicts.volumeDiff)} commits</p>
                      </div>

                      {/* Audience Leader */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-semibold">
                          <Users className="w-3.5 h-3.5" />
                          <span>Follower Leader</span>
                        </div>
                        <p className="text-sm font-black text-white truncate">@{verdicts.followerWinner.username}</p>
                        <p className="text-[10px] text-indigo-300 font-mono">+{formatNumber(verdicts.followerDiff)} followers</p>
                      </div>

                      {/* Codebase Leader */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-semibold">
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Codebase Leader</span>
                        </div>
                        <p className="text-sm font-black text-white truncate">@{verdicts.repoWinner.username}</p>
                        <p className="text-[10px] text-purple-300 font-mono">+{verdicts.repoDiff} repos</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Comparison Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCompareBadges(!showCompareBadges)}
                    className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:text-white"
                  >
                    <Palette className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    <span>{showCompareBadges ? 'Hide SVG Cards' : 'Preview Side-by-Side SVG Cards'}</span>
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    const md = generateComparisonMarkdown(dataA, dataB);
                    navigator.clipboard.writeText(md);
                    setCompareTableCopied(true);
                    setTimeout(() => setCompareTableCopied(false), 2500);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  {compareTableCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      <span>Copied Markdown Table!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      <span>Copy Comparison Markdown</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Side-by-Side SVG Streak Badges (when toggled) */}
              {showCompareBadges && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-blue-400" />
                      <span>Compare Theme Preview</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {THEMES.map((th) => (
                        <button
                          key={th.id}
                          onClick={() => setCompareTheme(th.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            compareTheme === th.id
                              ? 'bg-white text-slate-950 shadow-md font-bold'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: th.ring || th.border }} />
                          <span>{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-blue-500/20 flex flex-col items-center">
                      <span className="text-[11px] font-mono text-blue-400 mb-2">@{dataA.username}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API_BASE}/users/${dataA.username}/streak.svg?theme=${compareTheme}`}
                        alt={`${dataA.username} streak`}
                        className="rounded-xl max-w-full h-auto shadow-lg"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-indigo-500/20 flex flex-col items-center">
                      <span className="text-[11px] font-mono text-indigo-400 mb-2">@{dataB.username}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API_BASE}/users/${dataB.username}/streak.svg?theme=${compareTheme}`}
                        alt={`${dataB.username} streak`}
                        className="rounded-xl max-w-full h-auto shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Streak Head-to-Head Highlight */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-blue-500/10 border border-amber-500/30 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Contribution Streak Head-to-Head</span>
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {dataA.currentStreak >= dataB.currentStreak 
                      ? `@${dataA.username} leads streak by +${dataA.currentStreak - dataB.currentStreak} days`
                      : `@${dataB.username} leads streak by +${dataB.currentStreak - dataA.currentStreak} days`}
                  </Badge>
                </div>

                {/* Current Streak Comparison */}
                <div className="grid grid-cols-3 items-center text-center">
                  <div className="space-y-1">
                    <p className={`text-2xl sm:text-3xl font-black ${dataA.currentStreak >= dataB.currentStreak ? 'text-amber-400' : 'text-slate-300'}`}>
                      {formatNumber(dataA.currentStreak)} Days
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {dataA.currentStreakStart && dataA.currentStreakEnd ? `${dataA.currentStreakStart} - ${dataA.currentStreakEnd}` : 'Present'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Current Streak
                    </span>
                    <div className="text-[11px] font-mono text-amber-400">
                      Diff: {Math.abs(dataA.currentStreak - dataB.currentStreak)} Days
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className={`text-2xl sm:text-3xl font-black ${dataB.currentStreak >= dataA.currentStreak ? 'text-amber-400' : 'text-slate-300'}`}>
                      {formatNumber(dataB.currentStreak)} Days
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {dataB.currentStreakStart && dataB.currentStreakEnd ? `${dataB.currentStreakStart} - ${dataB.currentStreakEnd}` : 'Present'}
                    </p>
                  </div>
                </div>

                {/* Longest Streak Comparison */}
                <div className="grid grid-cols-3 items-center text-center pt-4 border-t border-slate-800">
                  <div className="space-y-1">
                    <p className={`text-2xl sm:text-3xl font-black ${dataA.longestStreak >= dataB.longestStreak ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatNumber(dataA.longestStreak)} Days
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {dataA.longestStreakStart && dataA.longestStreakEnd ? `${dataA.longestStreakStart} - ${dataA.longestStreakEnd}` : 'All Time'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Longest Streak Record
                    </span>
                    <div className="text-[11px] font-mono text-emerald-400">
                      Diff: {Math.abs(dataA.longestStreak - dataB.longestStreak)} Days
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className={`text-2xl sm:text-3xl font-black ${dataB.longestStreak >= dataA.longestStreak ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatNumber(dataB.longestStreak)} Days
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {dataB.longestStreakStart && dataB.longestStreakEnd ? `${dataB.longestStreakStart} - ${dataB.longestStreakEnd}` : 'All Time'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Comprehensive Breakdown Metrics with Visual Ratio Bars */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-blue-400">@{dataA.username} (Left)</span>
                  <span className="uppercase tracking-wider font-bold">Metrics Head-to-Head</span>
                  <span className="font-semibold text-indigo-400">@{dataB.username} (Right)</span>
                </div>

                {[
                  {
                    label: 'Total Contributions',
                    valA: dataA.totalContribs,
                    valB: dataB.totalContribs,
                    displayA: formatNumber(dataA.totalContribs),
                    displayB: formatNumber(dataB.totalContribs),
                    colorA: 'bg-blue-500',
                    colorB: 'bg-indigo-500'
                  },
                  {
                    label: 'Public Contributions',
                    valA: dataA.publicContribs,
                    valB: dataB.publicContribs,
                    displayA: formatNumber(dataA.publicContribs),
                    displayB: formatNumber(dataB.publicContribs),
                    colorA: 'bg-emerald-500',
                    colorB: 'bg-emerald-600'
                  },
                  {
                    label: 'Private Contributions',
                    valA: dataA.privateContribs,
                    valB: dataB.privateContribs,
                    displayA: formatNumber(dataA.privateContribs),
                    displayB: formatNumber(dataB.privateContribs),
                    colorA: 'bg-purple-500',
                    colorB: 'bg-purple-600'
                  },
                  {
                    label: 'Current Streak',
                    valA: dataA.currentStreak,
                    valB: dataB.currentStreak,
                    displayA: `${formatNumber(dataA.currentStreak)} Days`,
                    displayB: `${formatNumber(dataB.currentStreak)} Days`,
                    colorA: 'bg-amber-500',
                    colorB: 'bg-amber-600'
                  },
                  {
                    label: 'Longest Streak',
                    valA: dataA.longestStreak,
                    valB: dataB.longestStreak,
                    displayA: `${formatNumber(dataA.longestStreak)} Days`,
                    displayB: `${formatNumber(dataB.longestStreak)} Days`,
                    colorA: 'bg-emerald-500',
                    colorB: 'bg-emerald-600'
                  },
                  {
                    label: 'GitHub Followers',
                    valA: dataA.followers,
                    valB: dataB.followers,
                    displayA: formatNumber(dataA.followers),
                    displayB: formatNumber(dataB.followers),
                    colorA: 'bg-blue-500',
                    colorB: 'bg-indigo-500'
                  },
                  {
                    label: 'Public Repositories',
                    valA: dataA.repos,
                    valB: dataB.repos,
                    displayA: `${dataA.repos}`,
                    displayB: `${dataB.repos}`,
                    colorA: 'bg-purple-500',
                    colorB: 'bg-indigo-500'
                  },
                  {
                    label: 'Daily Velocity',
                    valA: dataA.averagePerDay,
                    valB: dataB.averagePerDay,
                    displayA: `${dataA.averagePerDay}/day`,
                    displayB: `${dataB.averagePerDay}/day`,
                    colorA: 'bg-amber-500',
                    colorB: 'bg-emerald-500'
                  }
                ].map((item) => {
                  const ratio = getRatio(item.valA, item.valB);
                  const isLeadA = Number(item.valA) > Number(item.valB);
                  const isLeadB = Number(item.valB) > Number(item.valA);
                  return (
                    <div key={item.label} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          {isLeadA && <Crown className="w-3 h-3 text-amber-400" />}
                          <span className={`font-mono font-bold text-sm ${isLeadA ? 'text-blue-300' : 'text-slate-300'}`}>
                            {item.displayA}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-sm ${isLeadB ? 'text-indigo-300' : 'text-slate-300'}`}>
                            {item.displayB}
                          </span>
                          {isLeadB && <Crown className="w-3 h-3 text-amber-400" />}
                        </div>
                      </div>

                      {/* Visual Dual Ratio Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 flex overflow-hidden">
                        <div
                          style={{ width: `${ratio.pctA}%` }}
                          className={`h-full ${item.colorA} rounded-l-full transition-all duration-500 opacity-90 hover:opacity-100`}
                          title={`@${dataA.username}: ${ratio.pctA}%`}
                        />
                        <div
                          style={{ width: `${ratio.pctB}%` }}
                          className={`h-full ${item.colorB} rounded-r-full transition-all duration-500 opacity-90 hover:opacity-100`}
                          title={`@${dataB.username}: ${ratio.pctB}%`}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Primary Language Row */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-400 text-sm">
                    {dataA.lang}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Primary Language
                  </span>
                  <span className="font-bold text-indigo-400 text-sm">
                    {dataB.lang}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
