'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  LayoutDashboard, 
  Trophy, 
  BarChart3, 
  Search, 
  Moon, 
  Sun, 
  Github, 
  Menu, 
  X,
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    username: 'waleedcodes',
    avatar: 'https://avatars.githubusercontent.com/u/110061477?v=4'
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check initial dark mode state
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }

    // Load active profile from localStorage
    try {
      const savedUser = localStorage.getItem('commity_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.username) {
          setCurrentUser({
            username: parsed.username,
            avatar: parsed.avatar || `https://github.com/${parsed.username}.png`
          });
        } else if (typeof savedUser === 'string') {
          setCurrentUser({
            username: savedUser,
            avatar: `https://github.com/${savedUser}.png`
          });
        }
      }
    } catch {
      // fallback default
    }

    const handleUserChange = (e) => {
      if (e.detail?.username) {
        setCurrentUser({
          username: e.detail.username,
          avatar: e.detail.avatar || `https://github.com/${e.detail.username}.png`
        });
      }
    };

    window.addEventListener('commity_user_changed', handleUserChange);
    return () => window.removeEventListener('commity_user_changed', handleUserChange);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Profiles', href: '/profile', icon: Users },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/profile/${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Commity
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Analytics
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Search Input */}
            <form onSubmit={handleSearch} className="hidden lg:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-9 pr-3 h-9 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-1"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </form>

            {/* Dark Mode Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDarkMode}
              className="w-9 h-9 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in fade-in zoom-in" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 animate-in fade-in zoom-in" />
              )}
            </Button>

            {/* GitHub Repo Link */}
            <a
              href="https://github.com/waleedcodes/Commity"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* User Profile Avatar */}
            <Link href={`/profile/${currentUser.username}`}>
              <Button variant="ghost" size="sm" className="h-9 px-2.5 rounded-lg flex items-center space-x-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                  <AvatarFallback className="text-xs font-semibold">
                    {currentUser.username ? currentUser.username[0]?.toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {currentUser.username}
                </span>
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden w-9 h-9 p-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search user (e.g. torvalds)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 text-sm"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </form>

            {/* Mobile Menu Items */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Active User Link */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                <Link
                  href={`/profile/${currentUser.username}`}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                    <AvatarFallback className="text-xs font-semibold">
                      {currentUser.username ? currentUser.username[0]?.toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs leading-tight">My Profile</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">@{currentUser.username}</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
