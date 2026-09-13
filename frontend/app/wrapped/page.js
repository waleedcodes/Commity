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
