// [Commity Core Phase 2: Logic] CommandPalette.js
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Users, 
  Trophy, 
  BarChart3, 
  LayoutDashboard, 
  Home, 
  Flame, 
  ArrowRight, 
  Sun, 
  Moon, 
  Swords, 
  Copy, 
  Check, 
  X, 
  Command,
  Sparkles
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';

const QUICK_DEVELOPERS = [
  { username: 'sufiyanshahiddev', name: 'Sufiyan Shahid', role: 'PK #1 Maintainer', avatar: 'https://avatars.githubusercontent.com/u/224948898?v=4', badge: '140K+ contribs' },
  { username: 'nehalatiq-dev', name: 'Nehal Atiq', role: 'PK #2 Maintainer', avatar: 'https://avatars.githubusercontent.com/u/105342898?v=4', badge: '108K+ contribs' },
  { username: 'awan', name: 'Muhammad Abdullah Khabir', role: 'PK #3 Maintainer', avatar: 'https://avatars.githubusercontent.com/u/10636224?v=4', badge: '95K+ contribs' },
  { username: 'waleedcodes', name: 'Waleed Ishfaq', role: 'Full-Stack Developer', avatar: 'https://avatars.githubusercontent.com/u/110061477?v=4', badge: '903d streak' },
  { username: 'farhanashrafdev', name: 'Farhan Ashraf', role: 'Maintainer (#23 PK)', avatar: 'https://avatars.githubusercontent.com/u/43789366?v=4', badge: '5.8K+ contribs' },
  { username: 'torvalds', name: 'Linus Torvalds', role: 'Linux & Git Creator', avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4', badge: 'Legend' },
  { username: 'sindresorhus', name: 'Sindre Sorhus', role: 'Open Sourcerer', avatar: 'https://avatars.githubusercontent.com/u/170270?v=4', badge: '1,100+ repos' },
  { username: 'antfu', name: 'Anthony Fu', role: 'Vue & Nuxt Core', avatar: 'https://avatars.githubusercontent.com/u/11247099?v=4', badge: 'TypeScript' },
  { username: 'yyx990803', name: 'Evan You', role: 'Vue & Vite Creator', avatar: 'https://avatars.githubusercontent.com/u/499550?v=4', badge: 'Creator' },
  { username: 'shadcn', name: 'shadcn', role: 'UI Component Architect', avatar: 'https://avatars.githubusercontent.com/u/124599?v=4', badge: 'Design System' },
];

const PLATFORM_NAV = [
  { name: 'Home', href: '/', icon: Home, desc: 'Overview, hero duels, and platform metrics' },
  { name: 'Profiles Directory', href: '/profile', icon: Users, desc: 'Browse 256+ maintainers & Streak Studio' },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, desc: 'National and worldwide developer rankings' },
  { name: 'Analytics Duel', href: '/analytics', icon: BarChart3, desc: 'Head-to-head developer comparison engine' },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, desc: 'Real-time GitHub activity & statistics' },
];

export default function CommandPalette({ isOpen, onClose, onToggleDarkMode }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedAction, setCopiedAction] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // open trigger
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter developers & navigation items
  const filteredDevs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_DEVELOPERS.slice(0, 6);
    return QUICK_DEVELOPERS.filter(
      d => d.username.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.role.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLATFORM_NAV;
    return PLATFORM_NAV.filter(
      n => n.name.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
    );
  }, [query]);

  // Quick Action items
  const quickActions = useMemo(() => [
    {
      id: 'duel-top2',
      label: 'Launch Duel: Sufiyan vs Waleed',
      icon: Swords,
      action: () => {
        router.push('/analytics?u1=sufiyanshahiddev&u2=waleedcodes');
        onClose();
      }
    },
    {
      id: 'duel-legends',
      label: 'Launch Duel: Linus vs Anthony Fu',
      icon: Flame,
      action: () => {
        router.push('/analytics?u1=torvalds&u2=antfu');
        onClose();
      }
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark / Light Mode',
      icon: Sun,
      action: () => {
        if (onToggleDarkMode) onToggleDarkMode();
        onClose();
      }
    },
    {
      id: 'copy-profile',
      label: 'Copy Commity Active Profile Link',
      icon: Copy,
      action: () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        let activeUser = 'waleedcodes';
        try {
          const saved = localStorage.getItem('commity_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.username) activeUser = parsed.username;
          }
        } catch {}
        navigator.clipboard.writeText(`${origin}/profile/${activeUser}`);
        setCopiedAction(true);
        setTimeout(() => {
          setCopiedAction(false);
          onClose();
        }, 800);
      }
    }
  ], [router, onClose, onToggleDarkMode]);

  // Flatten searchable list for keyboard navigation
  const flatItems = useMemo(() => {
    const items = [];

    // 1. Custom direct search item if query has text
    if (query.trim()) {
      items.push({
        type: 'custom',
        id: `search-${query.trim()}`,
        label: `Search developer: @${query.trim()}`,
        action: () => {
          router.push(`/profile/${encodeURIComponent(query.trim())}`);
          onClose();
        }
      });
    }

    // 2. Developers
    filteredDevs.forEach(d => {
      items.push({
        type: 'developer',
        id: `dev-${d.username}`,
        data: d,
        action: () => {
          router.push(`/profile/${d.username}`);
          onClose();
        }
      });
    });

    // 3. Navigation
    filteredNav.forEach(n => {
      items.push({
        type: 'nav',
        id: `nav-${n.href}`,
        data: n,
        action: () => {
          router.push(n.href);
          onClose();
        }
      });
    });

    // 4. Quick Actions
    quickActions.forEach(a => {
      items.push({
        type: 'action',
        id: a.id,
        data: a,
        action: a.action
      });
    });

    return items;
  }, [query, filteredDevs, filteredNav, quickActions, router, onClose]);

  // Keyboard navigation through flat items
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-150"
      onClick={() => onClose()}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a developer handle, page, or command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full py-4 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4">
          
          {/* Direct Search query option */}
          {query.trim() && (
            <div className="px-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  router.push(`/profile/${encodeURIComponent(query.trim())}`);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                  selectedIndex === 0
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedIndex === 0 ? 'bg-white/20' : 'bg-blue-500/10 text-blue-500'}`}>
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Inspect @{query.trim()}</p>
                    <p className={`text-xs ${selectedIndex === 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                      Fetch 365-day GraphQL contributions and streak
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}

          {/* Quick Developers Section */}
