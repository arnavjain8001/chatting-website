import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Bell, Settings, User, Menu, Moon, Sun, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenSettings: () => void;
  onOpenNewChat: () => void;
  totalUnread: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser?: { name: string; email: string; avatar: string } | null;
  onLogout?: () => void;
}

// Typewriter component for brand logo text
const TypewriterLogoText: React.FC = () => {
  const fullBrand = "Talking Tom & Jerry";
  const [displayText, setDisplayText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    setDisplayText('');
    setIsDone(false);

    const timer = setInterval(() => {
      if (index < fullBrand.length) {
        setDisplayText(fullBrand.slice(0, index + 1));
        index++;
      } else {
        setIsDone(true);
        clearInterval(timer);
      }
    }, 110);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 dark:from-blue-400 dark:via-indigo-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center">
      {displayText}
      {!isDone && (
        <span className="inline-block w-0.5 h-5 bg-indigo-600 dark:bg-indigo-400 ml-0.5 animate-pulse" />
      )}
    </span>
  );
};

// Typewriter component for Direct Badge
const TypewriterBadgeText: React.FC = () => {
  const fullText = "Chat";
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    // Delay start until brand name starts typing
    const startTimeout = setTimeout(() => {
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setDisplayText(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 120);

      return () => clearInterval(timer);
    }, 1200);

    return () => clearTimeout(startTimeout);
  }, []);

  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800 transition-all shadow-2xs">
      {displayText || '•'}
    </span>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onOpenSettings,
  onOpenNewChat,
  totalUnread,
  isDarkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  currentUser,
  onLogout,
}) => {
  // Animated Typewriter Placeholder for Search Input
  const placeholders = [
    "Search contacts & messages...",
    "Search @usernames...",
    "Find chat history & media...",
    "Search contacts & messages...",
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetText = placeholders[placeholderIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === targetText.length) {
      // Pause at full phrase
      typingSpeed = 2200;
      setIsDeleting(true);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      typingSpeed = 400;
    }

    const timer = setTimeout(() => {
      setCurrentPlaceholder(
        targetText.substring(0, charIndex + (isDeleting ? -1 : 1))
      );
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, placeholderIndex]);

  return (
    <header className={`h-16 px-4 md:px-6 border-b flex items-center justify-between shrink-0 transition-colors ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800 shadow-xs'
    }`}>
      {/* Left: Mobile Menu + Site Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className={`p-2 rounded-xl md:hidden transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <TypewriterLogoText />
              <TypewriterBadgeText />
            </div>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar (desktop with Typewriter Placeholder) */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-6 relative">
        <Search className={`w-4 h-4 absolute left-3.5 pointer-events-none ${
          isDarkMode ? 'text-slate-400' : 'text-slate-400'
        }`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={currentPlaceholder}
          className={`w-full pl-10 pr-4 py-1.5 text-sm rounded-full border transition-all outline-hidden ${
            isDarkMode
              ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:bg-slate-800'
              : 'bg-slate-100/80 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right: Actions & User Profile Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={onOpenNewChat}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-full relative transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Settings & Profile"
        >
          <Settings className="w-5 h-5" />
          {totalUnread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900 animate-ping" />
          )}
        </button>

        {/* User Profile Avatar */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="relative">
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
              alt={currentUser?.name || "You"}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/30 group-hover:ring-blue-600 transition-all"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
            {currentUser?.name || 'Alex Morgan'}
          </span>
        </div>

        {/* Quick Log Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-slate-100 text-rose-600'
            }`}
            title="Log Out / Switch Account"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    </header>
  );
};
