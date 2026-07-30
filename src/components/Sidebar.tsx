import React, { useState, useEffect } from 'react';
import { ChatThread, UserStory, Contact } from '../types';
import { Search, Plus, Pin, CheckCheck, Circle, Filter } from 'lucide-react';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onOpenNewChat: () => void;
  isDarkMode: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userStories?: UserStory[];
  onOpenAddStory?: () => void;
  onViewStories?: (contact: Contact, stories?: UserStory[]) => void;
  currentUserAvatar?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onOpenNewChat,
  isDarkMode,
  searchQuery,
  onSearchChange,
  userStories = [],
  onOpenAddStory,
  onViewStories,
  currentUserAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'online'>('all');

  // Typewriter Placeholder logic for Sidebar search
  const sidebarPlaceholders = [
    "Search contacts & messages...",
    "Type to find chats...",
    "Search contacts & messages...",
  ];
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetText = sidebarPlaceholders[placeholderIndex];
    let typingSpeed = isDeleting ? 40 : 85;

    if (!isDeleting && charIndex === targetText.length) {
      typingSpeed = 2000;
      setIsDeleting(true);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((prev) => (prev + 1) % sidebarPlaceholders.length);
      typingSpeed = 350;
    }

    const timer = setTimeout(() => {
      setCurrentPlaceholder(
        targetText.substring(0, charIndex + (isDeleting ? -1 : 1))
      );
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, placeholderIndex]);

  const filteredThreads = threads.filter((thread) => {
    // Search query filter
    const matchesSearch =
      thread.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter status tab
    if (filter === 'unread') return thread.unreadCount > 0;
    if (filter === 'online') return thread.contact.status === 'online';

    return true;
  });

  return (
    <div
      className={`w-full md:w-80 lg:w-96 flex flex-col h-full border-r shrink-0 transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Messages
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {threads.length}
            </span>
          </div>

          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            title="Start New Chat"
            aria-label="Start new chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile / Local Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={currentPlaceholder}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-all outline-hidden ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500'
                : 'bg-slate-100/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          {(['all', 'unread', 'online'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>


      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Filter className="w-8 h-8 opacity-40 stroke-1" />
            <p className="text-sm font-medium">No messages found</p>
            <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const lastMsg = thread.messages[thread.messages.length - 1];

            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`w-full p-3.5 flex items-center gap-3 text-left transition-all relative ${
                  isActive
                    ? isDarkMode
                      ? 'bg-slate-800/90 border-l-4 border-blue-500 text-white'
                      : 'bg-blue-50/80 border-l-4 border-blue-600 text-slate-900'
                    : isDarkMode
                    ? 'hover:bg-slate-800/40 text-slate-200'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                {/* Contact Avatar + Online Dot */}
                <div className="relative shrink-0">
                  <img
                    src={thread.contact.avatar}
                    alt={thread.contact.name}
                    className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shadow-xs"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${
                      isDarkMode ? 'border-slate-900' : 'border-white'
                    } ${
                      thread.contact.status === 'online'
                        ? 'bg-emerald-500'
                        : 'bg-yellow-400'
                    }`}
                  />
                </div>

                {/* Thread Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-semibold text-sm truncate ${
                        thread.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : ''
                      }`}>
                        {thread.contact.nickname || thread.contact.name}
                      </span>
                      {thread.isPinned && (
                        <Pin className="w-3 h-3 text-blue-500 rotate-45 shrink-0" />
                      )}
                    </div>
                    {lastMsg && (
                      <span className={`text-[11px] shrink-0 font-mono ${
                        thread.unreadCount > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'
                      }`}>
                        {lastMsg.timestamp}
                      </span>
                    )}
                  </div>

                  {/* Snippet */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${
                      thread.unreadCount > 0
                        ? 'font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {lastMsg ? (
                        <>
                          {lastMsg.isMe && <span className="text-slate-400 font-normal">You: </span>}
                          {lastMsg.imageUrl ? '📷 Photo' : lastMsg.text}
                        </>
                      ) : (
                        <span className="italic text-slate-400">No messages yet</span>
                      )}
                    </p>

                    {/* WhatsApp-Style Unread Counter Badge */}
                    {thread.unreadCount > 0 && (
                      <span className="min-w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-md px-1.5 ring-2 ring-emerald-400/30 animate-pulse">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
