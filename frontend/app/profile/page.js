// [Commity Core Phase 2: Logic] page.js
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  ArrowRight, 
  Trophy, 
  Sparkles, 
  Flame, 
  Users, 
  Globe, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  Download,
  Scale,
  X,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  MapPin,
  Code2,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeftRight,
  GitCompareArrows,
  TrendingUp,
  Crown,
  Zap,
  FolderGit2,
  Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import StreakStudio from '../components/StreakStudio';
import { formatNumber, getLanguageColor } from '../utils/helpers';
import { useLeaderboard, useLeaderboardStats } from '../hooks/useLeaderboard';
import { useUsers } from '../hooks/useUsers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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

// Top verified worldwide maintainers
const WORLDWIDE_LEADERS = [
  {
    username: 'torvalds',
    name: 'Linus Torvalds',
    role: 'Linux & Git Creator',
    location: 'Portland, OR, USA',
    flag: '🇺🇸',
    rank: '#1 Linux Core',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    contributions: 9267,
    publicContribs: 9267,
    privateContribs: 0,
    followers: 231000,
    repos: 7,
    streak: 12,
    lang: 'C',
    bio: 'Creator of the Linux kernel and the Git distributed version control system.'
  },
  {
    username: 'antfu',
    name: 'Anthony Fu',
    role: 'Vue / Nuxt / Vite Core',
    location: 'Tokyo, Japan',
    flag: '🇯🇵',
    rank: '#1 Japan Core',
    avatar: 'https://avatars.githubusercontent.com/u/11247099?v=4',
    contributions: 15190,
    publicContribs: 14200,
    privateContribs: 990,
    followers: 35400,
    repos: 280,
    streak: 45,
    lang: 'TypeScript',
    bio: 'Prolific open source creator, core team member of Vue, Nuxt, Vite, and Vitest.'
  },
  {
    username: 'sindresorhus',
    name: 'Sindre Sorhus',
    role: 'Open Sourcerer',
    location: 'France',
    flag: '🇫🇷',
    rank: '#1 France OSS',
    avatar: 'https://avatars.githubusercontent.com/u/170270?v=4',
    contributions: 22400,
    publicContribs: 21800,
    privateContribs: 600,
    followers: 61800,
    repos: 1100,
    streak: 30,
    lang: 'JavaScript',
    bio: 'Full-time open sourcerer with over 1,000 published npm packages used globally.'
  },
  {
    username: 'shadcn',
    name: 'shadcn',
    role: 'UI/UX Architect & Creator',
    location: 'Worldwide',
    flag: '🌍',
    rank: '#1 UI Libraries',
    avatar: 'https://avatars.githubusercontent.com/u/124599?v=4',
    contributions: 5937,
    publicContribs: 3820,
    privateContribs: 2117,
    followers: 16624,
    repos: 228,
    streak: 18,
    lang: 'TypeScript',
    bio: 'Creator of shadcn/ui and modern component libraries adopted across the industry.'
  },
  {
    username: 'amitshekhariitbhu',
    name: 'Amit Shekhar',
    role: 'Android Author & Educator',
    location: 'India',
    flag: '🇮🇳',
    rank: '#1 India Educator',
    avatar: 'https://avatars.githubusercontent.com/u/10460309?v=4',
    contributions: 11365,
    publicContribs: 9800,
    privateContribs: 1565,
    followers: 18900,
    repos: 95,
    streak: 21,
    lang: 'Kotlin',
    bio: 'Educator and author of world-renowned Android architecture guides and books.'
  }
];

// Major tech cities in Pakistan for localized filtering
const PAKISTAN_CITIES = [
  { id: 'all', label: 'All Pakistan' },
  { id: 'abbottabad', label: 'Abbottabad 🇵🇰' },
  { id: 'lahore', label: 'Lahore' },
  { id: 'karachi', label: 'Karachi' },
  { id: 'islamabad', label: 'Islamabad' },
  { id: 'rawalpindi', label: 'Rawalpindi' },
  { id: 'faisalabad', label: 'Faisalabad' },
  { id: 'peshawar', label: 'Peshawar' },
];

export default function ProfileHub() {
  const router = useRouter();

  // Local state
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState('pakistan'); // 'pakistan', 'worldwide', 'all'
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('contributions'); // 'contributions', 'followers', 'commits', 'streak'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [allUsersPage, setAllUsersPage] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Compare Modal State
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareUserA, setCompareUserA] = useState('');
  const [compareUserB, setCompareUserB] = useState('');
  const [modalShowBadges, setModalShowBadges] = useState(false);
  const [modalCompareTheme, setModalCompareTheme] = useState('default');
  const [modalCopiedMarkdown, setModalCopiedMarkdown] = useState(false);

  // Qualification Checker Widget State
  const [checkUsername, setCheckUsername] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Fetch real data from backend - full Pakistan Top 256 national quota
  const { leaderboard: pkLeaderboard, loading: pkLoading } = useLeaderboard({ 
    location: 'Pakistan', 
    limit: 256 
  });
  const { users: allDbUsers, pagination: allDbPagination, loading: allUsersLoading } = useUsers({ 
    page: allUsersPage, 
    limit: 24, 
    sort: sortBy === 'followers' ? 'followers' : 'totalCommits' 
  });
  const { stats } = useLeaderboardStats();

  // Dynamic city data state & loader
  const [cityData, setCityData] = useState({});
  const [loadingCity, setLoadingCity] = useState(false);

  // Dynamic featured maintainer profile state
  const [featuredProfile, setFeaturedProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    let target = 'waleedcodes';
    try {
      const saved = localStorage.getItem('commity_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username) target = parsed.username;
      }
    } catch {
      // ignore
    }

    fetch(`${API_URL}/users/${target}`)
      .then(r => r.json())
      .then(json => {
        if (!isMounted) return;
        if (json.success && json.data) {
          setFeaturedProfile(json.data.user || json.data);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const featuredRank = featuredProfile?.countryRankAll || featuredProfile?.countryRank || null;
  const featuredPublicRank = featuredProfile?.countryRankPublic || null;
  const featuredCommitsRank = featuredProfile?.countryRankCommits || null;
  const featuredPublic = featuredProfile?.publicContributions || 0;
  const featuredPrivate = featuredProfile?.privateContributions || 0;
  const featuredTotal = featuredProfile?.totalContributions || (featuredPublic + featuredPrivate);
  const featuredFollowers = featuredProfile?.followers || 0;
  const featuredPublicPct = featuredTotal > 0 ? Math.round((featuredPublic / featuredTotal) * 100) : 0;
  const featuredPrivatePct = featuredTotal > 0 ? (100 - featuredPublicPct) : 0;

  // Fetch verified city maintainers dynamically when a city hub chip is clicked
  useEffect(() => {
    if (selectedCity === 'all') return;
    if (cityData[selectedCity] && cityData[selectedCity].length > 0) return;

    let isMounted = true;
    setLoadingCity(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    fetch(`${API_URL}/leaderboard?location=${encodeURIComponent(selectedCity)}&limit=100`)
      .then(res => res.json())
      .then(json => {
        if (!isMounted) return;
        if (json.success && json.data) {
          const raw = Array.isArray(json.data) ? json.data : (json.data.users || []);
          const mapped = raw.map((u, idx) => ({
            username: u.username || u.login,
            name: u.name || u.username,
            role: u.bio ? u.bio.split(/[|•·]/)[0].trim() : 'Software Engineer',
            location: u.location || selectedCity,
            flag: '🇵🇰',
            rank: `#${u.countryRankAll || u.countryRank || u.rank || (idx + 1)} ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`,
            rankNum: u.countryRankAll || u.countryRank || u.rank || (idx + 1),
            avatar: u.avatarUrl || u.avatar_url || `https://avatars.githubusercontent.com/u/${u.githubId}?v=4`,
            contributions: (u.totalContributions || 0) > 0 ? u.totalContributions : ((u.publicContributions || 0) + (u.privateContributions || 0)),
            publicContribs: u.publicContributions || u.totalContributions || 0,
            privateContribs: u.privateContributions || 0,
            followers: u.followers || 0,
            repos: u.publicRepos || 0,
            streak: u.contributionStreak || 0,
            lang: u.topLanguages?.[0]?.name || 'JavaScript',
            bio: u.bio || `${u.name || u.username} is a verified GitHub developer in ${selectedCity}.`
          }));
          setCityData(prev => ({ ...prev, [selectedCity]: mapped }));
        }
      })
      .catch(err => console.error('Error fetching city maintainers:', err))
      .finally(() => {
        if (isMounted) setLoadingCity(false);
      });

    return () => { isMounted = false; };
  }, [selectedCity, cityData]);

  // Handle Search Submission: Instant Profile Analysis or Directory Filter
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim().toLowerCase();
    if (!q) return;

    // Check if query matches an exact developer in current view
    const match = activeDisplayList.find(u => u.username.toLowerCase() === q);
    if (match) {
      setIsAnalyzing(true);
      router.push(`/profile/${encodeURIComponent(match.username)}`);
      return;
    }

    // Direct profile analysis for single handle
    if (!q.includes(' ') && q.length >= 2) {
      setIsAnalyzing(true);
      router.push(`/profile/${encodeURIComponent(q)}`);
    }
  };

  // Build Pakistan maintainers list
  const pakistanMaintainers = useMemo(() => {
    if (!pkLeaderboard || pkLeaderboard.length === 0) {
      return [];
    }

    return pkLeaderboard.map((u, idx) => {
      const publicC = u.publicContributions || u.totalContributions || 0;
      const privateC = u.privateContributions || 0;
      const totalC = (u.totalContributions || 0) > 0 ? u.totalContributions : (publicC + privateC);
      const primLang = u.topLanguages?.[0]?.name || 'TypeScript';
      const officialRank = u.countryRankAll || u.countryRank || u.rank || (idx + 1);

      return {
        username: u.username || u.login,
        name: u.name || u.username,
        role: u.bio ? u.bio.split(/[|•·]/)[0].trim() : 'Software Engineer',
        location: u.location || 'Pakistan',
        flag: '🇵🇰',
        rank: `#${officialRank} Pakistan`,
        rankNum: officialRank,
        avatar: u.avatarUrl || u.avatar_url || `https://avatars.githubusercontent.com/u/${u.githubId}?v=4`,
        contributions: totalC,
        publicContribs: publicC,
        privateContribs: privateC,
        followers: u.followers || 0,
        repos: u.publicRepos || 0,
        streak: u.contributionStreak || 0,
        lang: primLang,
        bio: u.bio || `${u.name || u.username} is a verified GitHub open source contributor.`
      };
    });
  }, [pkLeaderboard]);

  // Dynamic counts for each city hub
  const cityCounts = useMemo(() => {
    const counts = { all: pakistanMaintainers.length || 256 };
    const defaults = {
      abbottabad: 5,
      lahore: 6,
      karachi: 6,
      islamabad: 4,
      rawalpindi: 10,
      faisalabad: 5,
      peshawar: 2
    };

    PAKISTAN_CITIES.forEach(c => {
      if (c.id === 'all') return;
      const inPk = pakistanMaintainers.filter(u =>
        (u.location || '').toLowerCase().includes(c.id.toLowerCase())
      );
      const inCityData = cityData[c.id] || [];
      const combined = new Set([...inPk.map(u => u.username), ...inCityData.map(u => u.username)]);
      counts[c.id] = Math.max(combined.size, defaults[c.id] || 0);
    });
    return counts;
  }, [pakistanMaintainers, cityData]);

  // City-filtered Pakistan maintainers (combined with dynamic city database)
  const filteredPakistanDevs = useMemo(() => {
    let list = [];

    if (selectedCity === 'all') {
      list = [...pakistanMaintainers];
    } else {
      const fromPk = pakistanMaintainers.filter((u) =>
        (u.location || '').toLowerCase().includes(selectedCity.toLowerCase())
      );
      const fromCity = cityData[selectedCity] || [];
      const userMap = new Map();
      [...fromPk, ...fromCity].forEach(dev => {
        if (!userMap.has(dev.username)) {
          userMap.set(dev.username, dev);
        }
      });
      list = Array.from(userMap.values());
    }

    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter((u) => 
        u.username.toLowerCase().includes(q) || 
        u.name.toLowerCase().includes(q) ||
        (u.location && u.location.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'followers') {
      list.sort((a, b) => b.followers - a.followers);
    } else if (sortBy === 'streak') {
      list.sort((a, b) => b.streak - a.streak);
    } else {
      list.sort((a, b) => b.contributions - a.contributions);
    }

    return list;
  }, [pakistanMaintainers, cityData, selectedCity, searchInput, sortBy]);

  // Filtered Worldwide list
  const filteredWorldwide = useMemo(() => {
    let list = [...WORLDWIDE_LEADERS];
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter((u) => 
        u.username.toLowerCase().includes(q) || 
        u.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchInput]);

  // Current active display list
  const activeDisplayList = useMemo(() => {
    if (activeTab === 'pakistan') return filteredPakistanDevs;
    if (activeTab === 'worldwide') return filteredWorldwide;
    
    // For 'all' DB users
    if (!allDbUsers) return [];
    return allDbUsers.map((u, idx) => ({
      username: u.username || u.login,
      name: u.name || u.username,
      role: 'Software Engineer',
      location: u.location || 'Global',
      flag: (u.location || '').toLowerCase().includes('pakistan') ? '🇵🇰' : '🌍',
      rank: u.countryRankAll || u.countryRank ? `#${u.countryRankAll || u.countryRank}` : `#${idx + 1}`,
      rankNum: u.countryRankAll || u.countryRank || (idx + 1),
      avatar: u.avatarUrl || u.avatar_url,
      contributions: u.totalContributions || u.totalCommits || 0,
      publicContribs: u.publicContributions || u.totalContributions || 0,
      privateContribs: u.privateContributions || 0,
      followers: u.followers || 0,
      repos: u.publicRepos || 0,
      streak: u.contributionStreak || 0,
      lang: u.topLanguages?.[0]?.name || 'JavaScript',
      bio: u.bio || `Developer profile indexed in Commity database.`
    }));
  }, [activeTab, filteredPakistanDevs, filteredWorldwide, allDbUsers]);

  // Compare Modal dynamic states (Zero manual/mock data - 100% live GitHub API)
  const [compareDataA, setCompareDataA] = useState(null);
  const [compareDataB, setCompareDataB] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [modalUserA, setModalUserA] = useState('');
  const [modalUserB, setModalUserB] = useState('');

  // Fetch 100% authentic GitHub streak and profile data for Compare Modal
  const fetchCompareModalData = useCallback(async (uA, uB) => {
    if (!uA || !uB) return;
    const cleanA = uA.trim().toLowerCase();
    const cleanB = uB.trim().toLowerCase();

    setCompareLoading(true);
    setCompareError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const [resStreakA, resProfA, resStreakB, resProfB] = await Promise.allSettled([
        fetch(`${API_URL}/users/${encodeURIComponent(cleanA)}/streak`),
        fetch(`${API_URL}/users/${encodeURIComponent(cleanA)}`),
        fetch(`${API_URL}/users/${encodeURIComponent(cleanB)}/streak`),
        fetch(`${API_URL}/users/${encodeURIComponent(cleanB)}`)
      ]);

      const parseData = async (res) => {
        if (res.status === 'fulfilled' && res.value.ok) {
          const json = await res.value.json();
          return json.success ? json.data : null;
        }
        return null;
      };

      const [sA, pA, sB, pB] = await Promise.all([
        parseData(resStreakA),
        parseData(resProfA),
        parseData(resStreakB),
        parseData(resProfB)
      ]);

      setCompareDataA({
        username: cleanA,
        name: pA?.name || sA?.username || cleanA,
        avatar: pA?.avatarUrl || `https://github.com/${cleanA}.png`,
        rank: pA?.countryRank ? `#${pA.countryRank} Pakistan` : 'Maintainer',
        location: pA?.location || 'Global',
        followers: pA?.followers || 0,
        repos: pA?.publicRepos || 0,
        publicContribs: pA?.publicContributions || sA?.totalContributions || 0,
        privateContribs: pA?.privateContributions || 0,
        contributions: sA?.totalContributions || pA?.totalContributions || 0,
        currentStreak: sA?.currentStreak ?? 0,
        longestStreak: sA?.longestStreak ?? 0,
        currentStreakStart: sA?.currentStreakStart,
        currentStreakEnd: sA?.currentStreakEnd,
        longestStreakStart: sA?.longestStreakStart,
        longestStreakEnd: sA?.longestStreakEnd,
        activeDays: sA?.activeDays || 0,
        averagePerDay: sA?.averagePerDay || 0,
        lang: pA?.topLanguages?.[0]?.name || 'TypeScript'
      });

      setCompareDataB({
        username: cleanB,
        name: pB?.name || sB?.username || cleanB,
        avatar: pB?.avatarUrl || `https://github.com/${cleanB}.png`,
        rank: pB?.countryRank ? `#${pB.countryRank} Pakistan` : 'Maintainer',
        location: pB?.location || 'Global',
        followers: pB?.followers || 0,
        repos: pB?.publicRepos || 0,
        publicContribs: pB?.publicContributions || sB?.totalContributions || 0,
        privateContribs: pB?.privateContributions || 0,
        contributions: sB?.totalContributions || pB?.totalContributions || 0,
        currentStreak: sB?.currentStreak ?? 0,
        longestStreak: sB?.longestStreak ?? 0,
        currentStreakStart: sB?.currentStreakStart,
        currentStreakEnd: sB?.currentStreakEnd,
        longestStreakStart: sB?.longestStreakStart,
        longestStreakEnd: sB?.longestStreakEnd,
        activeDays: sB?.activeDays || 0,
        averagePerDay: sB?.averagePerDay || 0,
        lang: pB?.topLanguages?.[0]?.name || 'Python'
      });
    } catch (err) {
      console.error('Failed to load compare data:', err);
      setCompareError('Failed to load live comparison data from GitHub.');
    } finally {
      setCompareLoading(false);
    }
  }, []);

  // Open Compare Modal with 2 users
  const handleOpenCompare = (userHandle) => {
    // Use the top-ranked user from the current list as User A (if not clicking on them)
    const topUser = activeDisplayList[0]?.username || '';
    const uA = userHandle === topUser ? (activeDisplayList[1]?.username || userHandle) : topUser;
    const uB = userHandle;
    setCompareUserA(uA);
    setCompareUserB(uB);
    setModalUserA(uA);
    setModalUserB(uB);
    setCompareModalOpen(true);
    fetchCompareModalData(uA, uB);
  };

  // Live Qualification Checker handler (100% Real GitHub API sync, zero mock data)
  const handleCheckQualification = async (e) => {
    e.preventDefault();
    if (!checkUsername.trim()) return;

    setIsChecking(true);
    setCheckResult(null);

    const cleanUser = checkUsername.trim().toLowerCase();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

    try {
      // Query local database or sync live from GitHub
      let u = null;
      const res = await fetch(`${API_URL}/users/${encodeURIComponent(cleanUser)}`);
      const json = await res.json();

      if (json.success && json.data) {
        u = json.data;
      } else {
        // Sync live from GitHub to fetch verified GraphQL metrics
        const syncRes = await fetch(`${API_URL}/users/${encodeURIComponent(cleanUser)}/sync`, { method: 'POST' });
        const syncJson = await syncRes.json();
        if (syncJson.success && syncJson.data) {
          u = syncJson.data;
        }
      }

      if (u) {
        const followers = u.followers || 0;
        const isQualified = followers >= 69;
        const isPk = (u.location || '').toLowerCase().includes('pakistan');
        const estRank = u.countryRank ? `#${u.countryRank} Pakistan` : (isPk ? (followers >= 69 ? 'Qualifies for Top 256' : 'Below 69 Threshold') : 'International Developer');

        setCheckResult({
          username: u.username || cleanUser,
          name: u.name || u.username || cleanUser,
          followers,
          isQualified,
          isPakistan: isPk,
          rank: estRank,
          contributions: u.totalContributions || (u.publicContributions || 0) + (u.privateContributions || 0),
          badgeUrl: `${API_URL}/users/${u.username || cleanUser}/badge.svg`
        });
      } else {
        setCheckResult({
          username: cleanUser,
          name: cleanUser,
          error: 'GitHub user not found or has no public activity.'
        });
      }
    } catch {
      setCheckResult({
        username: cleanUser,
        name: cleanUser,
        error: 'Could not connect to live GitHub verification service.'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = ['Rank', 'Username', 'Name', 'Total Contributions', 'Public Contribs', 'Private Contribs', 'Followers', 'Location', 'Top Language'];
    const rows = activeDisplayList.map(u => [
      u.rank,
      u.username,
      `"${u.name.replace(/"/g, '""')}"`,
      u.contributions,
      u.publicContribs,
      u.privateContribs,
      u.followers,
      `"${(u.location || '').replace(/"/g, '""')}"`,
      u.lang
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commity_developers_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON Function
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(activeDisplayList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commity_developers_${activeTab}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white pb-24">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[480px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-[150px] pointer-events-none -z-10" />

      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-blue-400 font-semibold">Profiles Directory</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/leaderboard?location=Pakistan" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <span>🇵🇰 Pakistan Leaderboard</span>
            </Link>
            <span>•</span>
            <Link href="/analytics" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
              <span>Deep Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header Hub Hero */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Developer Directory & Profiles
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    <Sparkles className="w-3 h-3" /> committers.top Architecture
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Full 365-day public & private GraphQL contributions, national rankings, and live README badge generator
                </p>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2.5">
              {featuredProfile?.username && (
                <Link href={`/profile/${featuredProfile.username}`}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 h-10 px-4">
                    <Avatar className="w-5 h-5 mr-2 ring-1 ring-white/40">
                      <AvatarImage src={featuredProfile.avatarUrl} alt={featuredProfile.username} />
                      <AvatarFallback>{featuredProfile.username.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>@{featuredProfile.username}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Macro Ecosystem Scale Banner */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {formatNumber(stats?.totalUsers || 347)}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Indexed Maintainers
            </p>
            <p className="text-[10px] text-blue-400/80 mt-0.5">GraphQL Verified</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              160,760+
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Pakistan Dev Pool
            </p>
            <p className="text-[10px] text-emerald-400/80 mt-0.5">Active GitHub Devs</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">
              Top 256
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
              National Quota
            </p>
            <p className="text-[10px] text-amber-400/80 mt-0.5">Per-Country Tier</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center">
            <p className="text-2xl sm:text-3xl font-black text-purple-400">
              &ge; 69
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Follower Bar
            </p>
            <p className="text-[10px] text-purple-400/80 mt-0.5">PK Qualification</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center col-span-2 md:col-span-1">
            <p className="text-2xl sm:text-3xl font-black text-blue-400">
              7 Days
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
              Snapshot Cycle
            </p>
            <p className="text-[10px] text-blue-400/80 mt-0.5">Weekly Aggregation</p>
          </div>
        </div>

        {/* Featured Spotlight: Waleed Ishfaq (@waleedcodes) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-indigo-950/40 border border-blue-500/30 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-amber-400/80 shadow-2xl shrink-0">
                  <AvatarImage src={featuredProfile?.avatarUrl} alt={featuredProfile?.username} />
                  <AvatarFallback className="text-xl font-bold bg-slate-800 text-slate-200">
                    {featuredProfile?.username?.slice(0,2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                {featuredRank && (
                  <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-lg flex items-center gap-1">
                    👑 #{featuredRank} PK
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-black text-white">{featuredProfile?.name || featuredProfile?.username || 'Featured Maintainer'}</h3>
                  <span className="text-sm text-blue-400 font-mono">@{featuredProfile?.username || 'maintainer'}</span>
                  {featuredRank && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] font-semibold py-0.5">
                      👑 #{featuredRank} PK (All)
                    </Badge>
                  )}
                  {featuredPublicRank && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-semibold py-0.5">
                      ⚡ #{featuredPublicRank} PK (Public)
                    </Badge>
                  )}
                  {featuredCommitsRank && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[11px] font-semibold py-0.5">
                      💻 #{featuredCommitsRank} PK (Commits)
                    </Badge>
                  )}
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[11px] font-semibold py-0.5">
                    📍 #1 in Abbottabad
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  {featuredProfile?.bio?.split(/[|•·]/)[0]?.trim() || 'Software Engineer'} • {featuredProfile?.location || 'Pakistan'} 🇵🇰
                </p>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {featuredRank ? `Top ${(featuredRank / 160760 * 100).toFixed(3)}% ranked developer out of 160,760 in Pakistan. ` : ''}
                  {featuredPublic.toLocaleString()} public contributions + {featuredPrivate.toLocaleString()} private contributions ({featuredTotal.toLocaleString()} total verified GraphQL contributions). {featuredFollowers} followers.
                </p>

                {/* Mini Ratio Bar */}
                <div className="pt-2 flex items-center gap-3 text-[11px] max-w-md">
                  <span className="text-emerald-400 font-mono">Public: {featuredPublic.toLocaleString()} ({featuredPublicPct}%)</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${featuredPublicPct}%` }} title={`Public: ${featuredPublic.toLocaleString()}`} />
                    <div className="h-full bg-purple-400" style={{ width: `${featuredPrivatePct}%` }} title={`Private: ${featuredPrivate.toLocaleString()}`} />
                  </div>
                  <span className="text-purple-400 font-mono">Private: {featuredPrivate.toLocaleString()} ({featuredPrivatePct}%)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-2.5 text-center sm:text-right">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-lg font-black text-white">{featuredPublic.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Public Contribs</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-lg font-black text-amber-400">{featuredTotal.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Verified</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href={`/profile/${featuredProfile?.username || ''}`}>
                  <Button className="w-full h-11 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20">
                    <span>Open Full Profile</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenCompare('sufiyanshahiddev')}
                    className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs h-9"
                  >
                    <Scale className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    <span>Compare #1</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('streak-studio')}
                    className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs h-9 font-semibold"
                  >
                    <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    <span>903d Streak</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Analyze Control Center */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 relative flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-700 shadow-inner focus-within:border-blue-500 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <Input
                type="text"
                placeholder="Search or analyze any GitHub username (e.g. waleedcodes, sufiyanshahiddev, torvalds)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 shadow-none text-xs sm:text-sm h-11"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors mr-1"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Button 
                type="submit" 
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10 px-5 rounded-xl shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Analyze Profile
                  </>
                )}
              </Button>
            </form>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white text-xs h-11 px-3.5"
                title="Export current directory as CSV"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white text-xs h-11 px-3.5"
                title="Export current directory as JSON"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                JSON
              </Button>
            </div>
          </div>

          {/* Directory Tabs, Sorting & View Toggle */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
            
            {/* Main Category Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setActiveTab('pakistan'); setSelectedCity('all'); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'pakistan' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🇵🇰 Pakistan Top 256</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 font-semibold">
                  {pakistanMaintainers.length || 256}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('worldwide')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'worldwide' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🌍 Worldwide Maintainers</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15">
                  {WORLDWIDE_LEADERS.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'all' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>📊 All Indexed ({stats?.totalUsers || 347})</span>
              </button>

              <button
                onClick={() => setActiveTab('streak-studio')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'streak-studio' 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Streak Studio</span>
              </button>
            </div>

            {/* Sub-Filters: Sort & View Mode (Hidden when on Streak Studio) */}
            {activeTab !== 'streak-studio' && (
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                
                {/* Sort Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="contributions">Total Contributions</option>
                    <option value="followers">Most Followers</option>
                    <option value="streak">Longest Streak</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pakistan City Chips Filter (Visible when on Pakistan tab) */}
          {activeTab === 'pakistan' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> City Hubs:
              </span>
              {PAKISTAN_CITIES.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    selectedCity === city.id 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{city.label}</span>
                  {city.id === 'abbottabad' && <span>★</span>}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCity === city.id ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cityCounts[city.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Directory Listings vs Streak Studio */}
        {activeTab === 'streak-studio' ? (
          <StreakStudio initialUser="waleedcodes" initialCompareUser="sufiyanshahiddev" />
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {activeTab === 'pakistan' && (
                  selectedCity === 'all'
                    ? `Pakistan Verified Open-Source Leaders (${activeDisplayList.length})`
                    : `${PAKISTAN_CITIES.find(c => c.id === selectedCity)?.label || selectedCity} Verified Open-Source Leaders (${activeDisplayList.length})`
                )}
                {activeTab === 'worldwide' && `Global Open-Source Legends (${activeDisplayList.length})`}
                {activeTab === 'all' && `All Indexed Developers (${stats?.totalUsers || 347})`}
              </span>
            </h3>

            {activeTab === 'all' && allDbPagination && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Page {allUsersPage} of {allDbPagination.totalPages}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={allUsersPage <= 1}
                  onClick={() => setAllUsersPage(p => Math.max(1, p - 1))}
                  className="h-8 px-2 border-slate-700 bg-slate-900"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!allDbPagination.hasNextPage}
                  onClick={() => setAllUsersPage(p => p + 1)}
                  className="h-8 px-2 border-slate-700 bg-slate-900"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {(pkLoading && activeTab === 'pakistan') || (allUsersLoading && activeTab === 'all') ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Fetching verified GraphQL directory snapshots...</p>
            </div>
          ) : activeDisplayList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
              <p className="text-sm text-slate-400">No maintainers found matching your filter.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSearchInput(''); setSelectedCity('all'); }}
                className="text-xs border-slate-700"
              >
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeDisplayList.map((dev) => {
                const totalC = dev.contributions || 0;
                const pubC = dev.publicContribs || totalC;
                const privC = dev.privateContribs || (totalC > pubC ? totalC - pubC : 0);
                const pubRatio = totalC > 0 ? Math.round((pubC / totalC) * 100) : 100;
                const isTopRanked = dev.rankNum <= 3;

                return (
                  <Card 
                    key={dev.username}
                    className={`border transition-all group backdrop-blur-sm flex flex-col justify-between ${
                      isTopRanked
                        ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      
                      {/* Top Row: Avatar + Rank Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="relative">
                          <Avatar className={`w-13 h-13 ring-2 transition-all ${
                            isTopRanked ? 'ring-amber-400 shadow-md shadow-amber-500/20' : 'ring-slate-700 group-hover:ring-blue-500'
                          }`}>
                            <AvatarImage src={dev.avatar} alt={dev.username} />
                            <AvatarFallback>{dev.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {dev.rankNum <= 3 && (
                            <span className="absolute -top-1 -right-1 text-xs">👑</span>
                          )}
                        </div>

                        <Badge 
                          variant="outline" 
                          className={`text-[10px] font-mono shrink-0 ${
                            isTopRanked ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'border-slate-700 text-slate-300'
                          }`}
                        >
                          {dev.rank}
                        </Badge>
                      </div>

                      {/* Developer Info */}
                      <div>
                        <Link href={`/profile/${dev.username}`}>
                          <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {dev.name}
                          </h4>
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">@{dev.username}</p>
                        
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <span>{dev.flag}</span>
                          <span className="truncate">{dev.location}</span>
                        </p>

                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {dev.bio}
                        </p>
                      </div>

                      {/* Contribution Metric & Ratio Progress */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                            365-Day Contribs
                          </span>
                          <span className="font-extrabold text-blue-400 font-mono text-sm">
                            {formatNumber(totalC)}
                          </span>
                        </div>

                        {/* Ratio Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex" title={`Public: ${pubC} | Private: ${privC}`}>
                          <div className="h-full bg-emerald-400" style={{ width: `${pubRatio}%` }} />
                          <div className="h-full bg-purple-400" style={{ width: `${100 - pubRatio}%` }} />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{pubRatio}% Public</span>
                          <span>{formatNumber(dev.followers)} Followers</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenCompare(dev.username)}
                          className="text-[11px] text-slate-400 hover:text-white px-2 h-8"
                          title="Compare with other maintainers"
                        >
                          <Scale className="w-3 h-3 mr-1 text-slate-400" />
                          Compare
                        </Button>

                        <Link href={`/profile/${dev.username}`}>
                          <Button size="sm" className="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs h-8 px-3 font-semibold transition-all">
                            <span>Profile</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Developer</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4 text-right">Contributions</th>
                      <th className="py-3.5 px-4 text-right">Followers</th>
                      <th className="py-3.5 px-4 text-center">Tech Stack</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
