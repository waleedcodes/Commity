'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  Code, 
  GitCommit, 
  GitPullRequest, 
  Eye, 
  Activity, 
  Share2, 
  Download, 
  Twitter, 
  Linkedin, 
  Copy, 
  Check, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  Pause, 
  Play, 
  RotateCcw, 
  ExternalLink,
  ShieldCheck,
  Globe,
  Zap,
  Users
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const TOTAL_SLIDES = 6;
const SLIDE_DURATION_MS = 6000;

function WrappedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const queryUser = searchParams.get('user') || searchParams.get('username') || '';
  
  const [username, setUsername] = useState(queryUser || 'waleedcodes');
  const [searchInput, setSearchInput] = useState(queryUser || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Initialize active username from localStorage if not provided via query
  useEffect(() => {
    if (!queryUser) {
      try {
        const saved = localStorage.getItem('commity_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.username) {
            setUsername(parsed.username);
            setSearchInput(parsed.username);
          }
        }
      } catch {
        // fallback
      }
    }
  }, [queryUser]);

  // Fetch Wrapped Data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setProgress(0);
    setActiveSlide(0);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    
    fetch(`${API_URL}/users/${encodeURIComponent(username)}/wrapped`)
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || `Developer '${username}' not found`);
        }
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        if (json.success && json.data) {
          setData(json.data);
        } else {
          throw new Error('Invalid wrapped data response');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  // Story Auto-Advance Timer
  useEffect(() => {
    if (loading || error || isPaused || activeSlide === TOTAL_SLIDES - 1) return;

    const intervalTime = 50;
    const increment = (intervalTime / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1));
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [loading, error, isPaused, activeSlide]);

  const nextSlide = useCallback(() => {
    setActiveSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1));
    setProgress(0);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((s) => Math.max(s - 1, 0));
    setProgress(0);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const clean = searchInput.trim();
      setUsername(clean);
      router.push(`/wrapped?user=${encodeURIComponent(clean)}`);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Generate Social Share Intent URLs
  const shareText = data
    ? `Just revealed my 2026 Developer Wrapped on @Commity! 🚀\n\n` +
      `🔥 Contributions: ${data.metrics.totalContributions.toLocaleString()}\n` +
      `⚡ Max Streak: ${data.metrics.longestStreak} Days\n` +
      `🏆 Archetype: ${data.archetype.badge}\n` +
      (data.standings.countryRank ? `🇵🇰 Rank: #${data.standings.countryRank} in ${data.standings.country}\n\n` : '\n') +
      `Check your developer card:`
    : 'Check your 2026 Developer Wrapped on Commity!';

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.href : 'https://commity.dev'
  )}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.href : 'https://commity.dev'
  )}`;

  // Pure Client-side High-Resolution PNG Card Exporter (1200 x 630 px standard social card)
  const handleDownloadCard = async () => {
    if (!data) return;
    setExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      // 1. Dark Gradient Background
      const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
      bgGradient.addColorStop(0, '#0a0f1d');
      bgGradient.addColorStop(0.5, '#111827');
      bgGradient.addColorStop(1, '#030712');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1200, 630);

      // 2. Neon Accent Glows
      const rad1 = ctx.createRadialGradient(150, 100, 10, 150, 100, 450);
      rad1.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
      rad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, 1200, 630);

      const rad2 = ctx.createRadialGradient(1050, 500, 10, 1050, 500, 400);
      rad2.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
      rad2.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, 1200, 630);

      // 3. Card Border Outer Glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, 1140, 570);

      // 4. Header Badge
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('COMMITY • 2026 DEVELOPER WRAPPED', 70, 85);

      // Year badge pill
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(1000, 60, 130, 36, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('⚡ 2026 EDITION', 1015, 84);

      // 5. User Profile Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(data.user.name || data.user.username, 70, 160);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText(`@${data.user.username}`, 70, 198);

      if (data.standings.countryRank) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`👑 Rank #${data.standings.countryRank} in ${data.standings.country} (${data.standings.nationalPercentile || 'Top Maintainer'})`, 70, 235);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`🌍 ${data.standings.globalPercentile}`, 70, 235);
      }

      // 6. Archetype Persona Box (Right Side)
      ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(720, 130, 410, 120, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('DEVELOPER ARCHETYPE', 745, 165);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(data.archetype.badge, 745, 200);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(data.archetype.tagline.slice(0, 48) + '...', 745, 230);

      // 7. Four Metric Highlight Cards
      const metrics = [
        { label: '365-DAY CONTRIBUTIONS', val: data.metrics.totalContributions.toLocaleString(), sub: `${data.metrics.publicContributions.toLocaleString()} Pub • ${data.metrics.privateContributions.toLocaleString()} Priv`, col: '#38bdf8' },
        { label: 'LONGEST CODING STREAK', val: `${data.metrics.longestStreak} Days`, sub: data.metrics.currentStreak > 0 ? `Active: ${data.metrics.currentStreak} days` : 'Verified continuous streak', col: '#f59e0b' },
        { label: 'DOMINANT TECH DNA', val: `${data.metrics.primaryLanguage}`, sub: `${data.metrics.primaryPercentage}% of verified byte volume`, col: '#34d399' },
        { label: 'CODE VELOCITY', val: `${data.metrics.commits} Commits`, sub: `${data.metrics.pullRequests} PRs • ${data.metrics.codeReviews} Reviews`, col: '#f43f5e' }
      ];

      metrics.forEach((m, idx) => {
        const x = 70 + (idx % 2) * 540;
        const y = 290 + Math.floor(idx / 2) * 140;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, 500, 115, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(m.label, x + 25, y + 32);

        ctx.fillStyle = m.col;
        ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(m.val, x + 25, y + 74);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(m.sub, x + 25, y + 98);
      });

      // 8. Footer Watermark
      ctx.fillStyle = '#475569';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Verified with official GitHub GraphQL & committers.top • commity.dev/wrapped', 70, 580);

      // Download triggered
      const link = document.createElement('a');
      link.download = `${data.user.username}-github-wrapped-2026.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to export wrapped image:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header / Search Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Commity
              </span>
            </Link>
            <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] px-2.5 py-0.5 border-none font-semibold shadow-xs">
              🎁 2026 Wrapped
            </Badge>
          </div>

          {/* User Search Switcher */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search user (e.g. torvalds, antfu)..."
                className="pl-9 h-9 text-xs bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-indigo-500"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
              Reveal
            </Button>
          </form>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Synthesizing 2026 Wrapped...</h3>
              <p className="text-xs text-slate-400">Analyzing commits, 365-day contributions, streak rhythm & rankings for @{username}</p>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 my-12">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Wrapped Unavailable</h3>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button 
                onClick={() => { setUsername('waleedcodes'); setSearchInput('waleedcodes'); }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Try Featured Maintainer (@waleedcodes)
              </Button>
              <Link href="/leaderboard">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 text-xs">
                  Browse Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        ) : data ? (
          <div className="w-full max-w-2xl flex flex-col items-center space-y-6">
            {/* Story Progress Indicators */}
            <div className="w-full flex items-center gap-1.5 px-2">
              {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setActiveSlide(idx); setProgress(0); }}
                  className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden cursor-pointer transition-all"
                  title={`Jump to slide ${idx + 1}`}
                >
                  <div 
                    className={`h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-75 ${
                      idx < activeSlide ? 'w-full' : idx === activeSlide ? '' : 'w-0'
                    }`}
                    style={{ width: idx === activeSlide ? `${progress}%` : undefined }}
                  />
                </div>
              ))}
            </div>

            {/* Slide Viewer Card */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[1/1] max-h-[580px] rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-2xl flex flex-col justify-between p-6 sm:p-10 select-none">
              
              {/* Top Meta within Slide */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-indigo-500/40">
                    <AvatarImage src={data.user.avatarUrl} alt={data.user.username} />
                    <AvatarFallback>{data.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{data.user.name}</h4>
                    <span className="text-xs text-indigo-400 font-mono">@{data.user.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                    title={isPaused ? 'Resume auto-play' : 'Pause'}
                  >
                    {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <Badge variant="outline" className="text-[11px] font-mono border-slate-700 bg-slate-900/80 text-slate-300">
                    {activeSlide + 1} / {TOTAL_SLIDES}
                  </Badge>
                </div>
              </div>

              {/* SLIDE 0: The Intro / Headline */}
              {activeSlide === 0 && (
                <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-xl shadow-indigo-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Year In Review</span>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                      Your 2026 Code Story
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Across open source repositories and daily builds, your impact echoes throughout the global developer ecosystem.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs text-amber-300 font-semibold shadow-inner">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{data.standings.countryRank ? `Ranked #${data.standings.countryRank} in ${data.standings.country}` : data.standings.globalPercentile}</span>
                  </div>
                </div>
              )}

              {/* SLIDE 1: Contribution Superpower */}
              {activeSlide === 1 && (
                <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Activity Spectrum</span>
                    <p className="text-xs text-slate-400">365-day verified contributionsCollection</p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 font-mono tracking-tight">
                      {data.metrics.totalContributions.toLocaleString()}
                    </h2>
                    <p className="text-sm font-semibold text-slate-300">Total Verified Contributions</p>
                  </div>

                  {/* Public vs Private Split Bar */}
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${Math.round((data.metrics.publicContributions / Math.max(1, data.metrics.totalContributions)) * 100)}%` }}
                        title="Public Contributions"
                      />
                      <div 
                        className="bg-indigo-500 h-full transition-all"
                        style={{ width: `${Math.round((data.metrics.privateContributions / Math.max(1, data.metrics.totalContributions)) * 100)}%` }}
                        title="Private Contributions"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span className="text-emerald-400">● {data.metrics.publicContributions.toLocaleString()} Public</span>
                      <span className="text-indigo-400">● {data.metrics.privateContributions.toLocaleString()} Private</span>
                    </div>
                  </div>

                  {/* Breakdown Cards */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto pt-2">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Commits</p>
                      <p className="text-lg font-bold text-white font-mono mt-0.5">{data.metrics.commits}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Pull Requests</p>
                      <p className="text-lg font-bold text-white font-mono mt-0.5">{data.metrics.pullRequests}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Code Reviews</p>
                      <p className="text-lg font-bold text-white font-mono mt-0.5">{data.metrics.codeReviews}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Coding Rhythm & Streaks */}
              {activeSlide === 2 && (
                <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Flame className="w-8 h-8 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Unstoppable Momentum</span>
                    <h2 className="text-4xl sm:text-6xl font-black text-white font-mono">
                      {data.metrics.longestStreak} Days
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">Longest Continuous Coding Streak</p>
                  </div>

                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {data.metrics.longestStreak >= 30 
                      ? "A remarkable demonstration of discipline. Your contribution graph stayed lit for months without skipping a beat."
                      : "Consistent and deliberate. You balance deep focused sprints with production releases."}
                  </p>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400">Current Streak</p>
                      <p className="text-base font-bold text-amber-300 font-mono">{data.metrics.currentStreak} Days</p>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400">Public Repos</p>
                      <p className="text-base font-bold text-indigo-300 font-mono">{data.metrics.publicRepos}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 3: Tech DNA & Language Craft */}
              {activeSlide === 3 && (
                <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Language Ecosystem</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white">
                      Your Tech DNA
                    </h2>
                  </div>

                  {/* Primary Language Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Code className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Primary Craft</p>
                        <p className="text-lg font-bold text-white">{data.metrics.primaryLanguage}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-mono font-bold">
                      {data.metrics.primaryPercentage}% Dominance
                    </Badge>
                  </div>

                  {/* Multi-language Spectrum Bars */}
                  <div className="space-y-2 max-w-md mx-auto">
                    {data.metrics.topLanguages.slice(0, 4).map((lang) => (
                      <div key={lang.name} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span className="font-semibold">{lang.name}</span>
                          <span className="font-mono text-slate-400">{Math.round(lang.percentage)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.max(4, lang.percentage)}%`,
                              backgroundColor: lang.color || '#6366f1'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLIDE 4: Developer Archetype Reveal */}
              {activeSlide === 4 && (
                <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                    Developer Archetype
                  </span>

                  <div className="relative max-w-md mx-auto">
                    {/* Glowing Aura */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-30 blur-xl animate-pulse" />
                    
                    <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/40 space-y-4">
                      <div className="inline-block text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                        {data.archetype.badge}
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-purple-300">
                        &ldquo;{data.archetype.tagline}&rdquo;
                      </p>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {data.archetype.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic font-serif">
                        &ldquo;{data.archetype.quote}&rdquo;
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 5: Grand Finale & Social Share Card */}
              {activeSlide === 5 && (
                <div className="my-auto space-y-4 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                      ★ 2026 Developer Summary ★
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      Ready to Share Your Impact?
                    </h2>
                  </div>

                  {/* High-Aesthetic Mini Card Preview */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl space-y-3 max-w-md mx-auto text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-9 h-9 ring-2 ring-indigo-400">
                          <AvatarImage src={data.user.avatarUrl} alt={data.user.username} />
                          <AvatarFallback>{data.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-white leading-none">{data.user.name}</p>
                          <p className="text-[11px] text-indigo-400 font-mono">@{data.user.username}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        2026 Wrapped
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[9px] text-slate-400 uppercase">Contributions</p>
                        <p className="text-sm font-bold text-sky-400">{data.metrics.totalContributions.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[9px] text-slate-400 uppercase">Streak Peak</p>
                        <p className="text-sm font-bold text-amber-400">{data.metrics.longestStreak} Days</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[9px] text-slate-400 uppercase">Tech DNA</p>
                        <p className="text-sm font-bold text-emerald-400">{data.metrics.primaryLanguage}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <p className="text-[9px] text-slate-400 uppercase">Archetype</p>
                        <p className="text-xs font-bold text-purple-400 truncate">{data.archetype.badge}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 max-w-md mx-auto">
                    <Button
                      onClick={handleDownloadCard}
                      disabled={exporting}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs h-10 shadow-lg shadow-amber-500/20 gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>{exporting ? 'Generating PNG...' : 'Download PNG Card'}</span>
                    </Button>

                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 text-white text-xs h-10 gap-1.5"
                      >
                        <Twitter className="w-4 h-4 text-sky-400 fill-sky-400" />
                        <span>Post on X</span>
                      </Button>
                    </a>

                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 text-white text-xs h-10 gap-1.5"
                      >
                        <Linkedin className="w-4 h-4 text-blue-400" />
                        <span>Share</span>
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Controls within Slide */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevSlide}
                  disabled={activeSlide === 0}
                  className="text-xs text-slate-400 hover:text-white disabled:opacity-30 gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                {activeSlide < TOTAL_SLIDES - 1 ? (
                  <Button
                    size="sm"
                    onClick={nextSlide}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 gap-1"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => { setActiveSlide(0); setProgress(0); }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Share Links Bar */}
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2 truncate">
                <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Share your custom link with friends and team</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-7 px-2.5 text-xs text-slate-300 hover:text-white gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Commity GitHub Analytics • Verified 365-day developer metrics</p>
          <div className="flex items-center gap-4">
            <Link href={`/profile/${username}`} className="hover:text-slate-300 transition">
              Full Profile ↗
            </Link>
            <Link href="/leaderboard" className="hover:text-slate-300 transition">
              Leaderboard ↗
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function WrappedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <WrappedContent />
    </Suspense>
  );
}
