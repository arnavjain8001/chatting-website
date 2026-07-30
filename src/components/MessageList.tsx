import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Contact, ChatThemeConfig, WallpaperConfig, DisappearingTimerOption } from '../types';
import { THEME_PRESETS } from '../themeData';
import { EmojiPicker } from './EmojiPicker';
import {
  Check,
  CheckCheck,
  Copy,
  Pencil,
  Trash2,
  Trash,
  MoreVertical,
  X,
  Ban,
  CheckCircle2,
  Smile,
  Plus,
  Reply,
  Pin,
  Mic,
  Play,
  Pause,
  Clock,
  Flame,
  Maximize2,
} from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  contact: Contact;
  isDarkMode: boolean;
  isTyping?: boolean;
  activeTheme?: ChatThemeConfig;
  activeWallpaper?: WallpaperConfig;
  pinnedMessageIds?: string[];
  disappearingTimer?: DisappearingTimerOption;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
  onReplyToMessage?: (message: Message) => void;
  onTogglePinMessage?: (messageId: string) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  currentUser?: { id?: string } | null;
}

interface ContextMenuState {
  message: Message;
  x: number;
  y: number;
}

const QUICK_EMOJI_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '🎉'];

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  contact,
  isDarkMode,
  isTyping = false,
  activeTheme = THEME_PRESETS[0],
  activeWallpaper,
  pinnedMessageIds = [],
  disappearingTimer = 'off',
  onReactToMessage,
  onEditMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onReplyToMessage,
  onTogglePinMessage,
  onVotePoll,
  currentUser,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showFullEmojiReactionModal, setShowFullEmojiReactionModal] = useState<Message | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Audio Playback state for Voice Notes
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]);

  // Audio Player Toggle
  const toggleAudioPlay = (msgId: string, url?: string) => {
    if (!url) return;

    if (playingAudioId === msgId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      setPlayingAudioId(msgId);

      newAudio.onended = () => {
        setPlayingAudioId(null);
      };

      newAudio.play().catch(() => {
        setPlayingAudioId(null);
      });
    }
  };

  // Toast timer
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Close context menu on outside click or scroll or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // Handle Right Click Context Menu
  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent context menu if deleted
    if (message.isDeletedForEveryone) return;

    // Constrain context menu within viewport
    const menuWidth = 230;
    const menuHeight = 280;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 12;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 12;
    }

    setContextMenu({ message, x, y });
  };

  // Handlers for Context Menu Options
  const handleReply = () => {
    if (!contextMenu) return;
    onReplyToMessage?.(contextMenu.message);
    setContextMenu(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!contextMenu) return;
    onReactToMessage?.(contextMenu.message.id, emoji);
    setContextMenu(null);
  };

  const handleCopy = () => {
    if (!contextMenu) return;
    if (contextMenu.message.text) {
      navigator.clipboard.writeText(contextMenu.message.text);
      showToast('Copied to clipboard');
    }
    setContextMenu(null);
  };

  const handleStartEdit = () => {
    if (!contextMenu) return;
    setEditingMessage(contextMenu.message);
    setEditText(contextMenu.message.text);
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (editingMessage && editText.trim()) {
      onEditMessage?.(editingMessage.id, editText.trim());
      showToast('Message edited');
      setEditingMessage(null);
      setEditText('');
    }
  };

  const handleDeleteMe = () => {
    if (!contextMenu) return;
    onDeleteForMe?.(contextMenu.message.id);
    showToast('Deleted for you');
    setContextMenu(null);
  };

  const handleDeleteEveryone = () => {
    if (!contextMenu) return;
    onDeleteForEveryone?.(contextMenu.message.id);
    showToast('Deleted for everyone');
    setContextMenu(null);
  };

  return (
    <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
      {/* Fixed Device Wallpaper Background Overlay */}
      {activeWallpaper?.url && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-300 z-0"
          style={{
            backgroundImage: `url(${activeWallpaper.url})`,
            opacity: activeWallpaper.opacity ?? 0.85,
            filter: activeWallpaper.blur ? `blur(${activeWallpaper.blur}px)` : 'none',
          }}
        />
      )}

      {/* Scrollable Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative z-10">
        {/* Encryption / Conversation Header Banner */}
        <div className="flex flex-col items-center justify-center my-4 space-y-2 text-center">
          <img
            src={contact.avatar}
            alt={contact.nickname || contact.name}
            className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-blue-500/20"
          />
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">{contact.nickname || contact.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{contact.username}</p>
          <div className="px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 mt-1 shadow-2xs">
            🔒 End-to-end encrypted chat thread
          </div>
        </div>

        {/* Messages list */}
        {messages.map((message, index) => {
          const isMe = message.isMe;
          const showAvatar =
            !isMe && (index === messages.length - 1 || messages[index + 1]?.isMe);

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {/* Contact Avatar (for received messages) */}
              {!isMe && (
                <div className="w-8 h-8 shrink-0">
                  {showAvatar ? (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-8 h-8 rounded-full object-cover shadow-xs"
                    />
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              )}

              {/* Bubble Container */}
              <div
                id={`msg-item-${message.id}`}
                onContextMenu={(e) => handleContextMenu(e, message)}
                className={`group relative max-w-[82%] sm:max-w-[70%] flex flex-col ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                {/* Context menu & Quick Reply hover buttons trigger */}
                {!message.isDeletedForEveryone && (
                  <div
                    className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 ${
                      isMe ? '-left-16' : '-right-16'
                    }`}
                  >
                    <button
                      onClick={() => onReplyToMessage?.(message)}
                      className="p-1 rounded-full bg-slate-800/80 text-white hover:bg-blue-600 shadow-md transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleContextMenu(e, message)}
                      className="p-1 rounded-full bg-slate-800/80 text-white hover:bg-slate-900 shadow-md transition-colors"
                      title="Message options (Right-click)"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Optional Attached Image */}
                {message.imageUrl && !message.isDeletedForEveryone && (
                  <div className="mb-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-xs shadow-sm">
                    <img
                      src={message.imageUrl}
                      alt="Attachment"
                      className="w-full h-auto object-cover max-h-60 hover:opacity-95 transition-opacity cursor-pointer"
                    />
                  </div>
                )}

                {/* Message Content Bubble with Dynamic Theme Colors */}
                {message.isDeletedForEveryone ? (
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs italic flex items-center gap-2 border ${
                      isDarkMode
                        ? 'bg-slate-800/40 text-slate-400 border-slate-800'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>This message was deleted</span>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs break-words relative transition-all cursor-pointer ${
                      isMe
                        ? `${activeTheme.bubbleClass} rounded-br-xs hover:opacity-95 shadow-md`
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-xs hover:bg-slate-750'
                        : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-xs hover:bg-slate-200/80'
                    }`}
                  >
                    {/* Quoted Replying Snippet */}
                    {message.replyTo && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetEl = document.getElementById(`msg-item-${message.replyTo?.id}`);
                          if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetEl.classList.add('ring-2', 'ring-blue-500', 'rounded-2xl', 'transition-all');
                            setTimeout(() => targetEl.classList.remove('ring-2', 'ring-blue-500'), 1500);
                          }
                        }}
                        className={`mb-2 p-2 rounded-xl text-xs border-l-4 cursor-pointer transition-opacity hover:opacity-90 ${
                          isMe
                            ? 'bg-black/20 border-white/90 text-white'
                            : isDarkMode
                            ? 'bg-slate-900/70 border-blue-500 text-slate-200'
                            : 'bg-slate-200/90 border-blue-600 text-slate-900'
                        }`}
                      >
                        <div className="font-semibold text-[11px] mb-0.5 opacity-90 flex items-center gap-1">
                          <Reply className="w-3 h-3 shrink-0" />
                          <span>{message.replyTo.senderName}</span>
                        </div>
                        <div className="line-clamp-2 italic text-[11px] opacity-85">
                          {message.replyTo.text || 'Photo'}
                        </div>
                      </div>
                    )}

                    {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

                    {/* Interactive Poll Card */}
                    {message.poll && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-black/10 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/60 space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 dark:border-slate-700/50 pb-1.5">
                          <span className="font-bold text-xs uppercase tracking-wider text-blue-500">Poll</span>
                          <span className="text-[10px] opacity-75 font-mono">{message.poll.totalVotes} vote{message.poll.totalVotes === 1 ? '' : 's'}</span>
                        </div>
                        <p className="font-bold text-sm tracking-tight">{message.poll.question}</p>
                        <div className="space-y-1.5 pt-1">
                          {message.poll.options.map((opt) => {
                            const pct = message.poll!.totalVotes > 0 ? Math.round((opt.votes.length / message.poll!.totalVotes) * 100) : 0;
                            const myId = currentUser?.id || 'me';
                            const hasVoted = opt.votes.includes(myId) || (isMe && opt.votes.includes('me'));
                            return (
                              <button
                                key={opt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onVotePoll?.(message.id, opt.id);
                                }}
                                className={`w-full relative overflow-hidden rounded-xl p-2 text-left text-xs font-semibold border transition-all ${
                                  hasVoted
                                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                                    : 'border-white/20 dark:border-slate-700/80 hover:bg-white/10'
                                }`}
                              >
                                <div
                                  className="absolute top-0 bottom-0 left-0 bg-blue-500/20 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex items-center justify-between">
                                  <span>{opt.text}</span>
                                  <span className="text-[10px] font-mono opacity-80 ml-2">{pct}%</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Reactions Pill Badges */}
                {message.reactions && message.reactions.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-1 -mt-1 z-10 px-2 py-0.5 rounded-full border text-xs shadow-xs ${
                      isMe ? 'mr-2' : 'ml-2'
                    } ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {message.reactions.map((r, i) => (
                      <span key={i}>{r}</span>
                    ))}
                  </motion.div>
                )}

                {/* Timestamp & Read Status & Edited Indicator */}
                <div
                  className={`flex items-center gap-1.5 text-[10px] mt-1 px-1 font-mono ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  <span>{message.timestamp}</span>
                  {message.isEdited && !message.isDeletedForEveryone && (
                    <span className="italic font-sans text-slate-400">(edited)</span>
                  )}
                  {isMe && (
                    <span title={message.status === 'read' ? 'Seen (Read by receiver)' : 'Sent (Unread)'}>
                      {message.status === 'read' ? (
                        <CheckCheck className="w-4 h-4 text-cyan-400 font-extrabold stroke-[2.5]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white/75 stroke-[2.2]" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Animated Bouncing Dots Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center gap-2.5 justify-start my-2"
            >
              <img
                src={contact.avatar}
                alt={contact.nickname || contact.name}
                className="w-8 h-8 rounded-full object-cover shadow-xs ring-2 ring-blue-500/30"
              />
              <div
                className={`px-4 py-3 rounded-2xl rounded-bl-xs text-xs flex items-center gap-2 shadow-sm border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700/80 text-slate-100'
                    : 'bg-slate-100 border-slate-200/80 text-slate-800'
                }`}
              >
                <span className="text-xs font-semibold text-blue-500 mr-1">
                  {contact.nickname || contact.name} is typing
                </span>
                <div className="flex items-center gap-1.5 py-0.5">
                  <motion.span
                    animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0 }}
                    className="w-2 h-2 rounded-full bg-blue-500 shadow-xs"
                  />
                  <motion.span
                    animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.15 }}
                    className="w-2 h-2 rounded-full bg-blue-500 shadow-xs"
                  />
                  <motion.span
                    animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.3 }}
                    className="w-2 h-2 rounded-full bg-blue-500 shadow-xs"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-Style Right-Click Context Menu Popup */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className={`fixed z-50 w-60 rounded-2xl shadow-2xl border p-2 animate-scaleIn select-none backdrop-blur-md ${
            isDarkMode
              ? 'bg-slate-900/95 border-slate-700/80 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          {/* Top Row: WhatsApp Emoji Quick Reactions + Plus for all emojis */}
          <div className="p-1.5 mb-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-1">
            {QUICK_EMOJI_REACTIONS.map((emoji) => {
              const isSelected = contextMenu.message.reactions?.includes(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`text-lg p-1 rounded-lg transition-transform hover:scale-125 ${
                    isSelected ? 'bg-blue-500/20 ring-1 ring-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
            <button
              onClick={() => {
                const msg = contextMenu.message;
                setContextMenu(null);
                setShowFullEmojiReactionModal(msg);
              }}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-500 transition-colors"
              title="More Emojis..."
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

          {/* Action Options */}
          <div className="space-y-0.5">
            {/* 0. Reply */}
            <button
              onClick={handleReply}
              className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                isDarkMode ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-blue-50 text-blue-600'
              }`}
            >
              <Reply className="w-4 h-4 text-blue-500" />
              <span>Reply</span>
            </button>

            {/* Pin / Unpin */}
            <button
              onClick={() => {
                const msg = contextMenu.message;
                setContextMenu(null);
                onTogglePinMessage?.(msg.id);
                showToast(pinnedMessageIds.includes(msg.id) ? 'Unpinned message' : 'Pinned message to top');
              }}
              className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-amber-50 text-amber-600'
              }`}
            >
              <Pin className="w-4 h-4 text-amber-500" />
              <span>{pinnedMessageIds.includes(contextMenu.message.id) ? 'Unpin Message' : 'Pin Message'}</span>
            </button>

            {/* 1. Copy */}
            <button
              onClick={handleCopy}
              className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Copy className="w-4 h-4 text-slate-400" />
              <span>Copy</span>
            </button>

            {/* 2. Edit (Only for sent messages) */}
            {contextMenu.message.isMe && (
              <button
                onClick={handleStartEdit}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Pencil className="w-4 h-4 text-blue-500" />
                <span>Edit</span>
              </button>
            )}

            {/* 3. Delete for me */}
            <button
              onClick={handleDeleteMe}
              className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                isDarkMode ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-rose-50 text-rose-600'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete for me</span>
            </button>

            {/* 4. Delete for everyone (Only for sent messages) */}
            {contextMenu.message.isMe && (
              <button
                onClick={handleDeleteEveryone}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-rose-500' : 'hover:bg-rose-50 text-rose-700'
                }`}
              >
                <Trash className="w-4 h-4" />
                <span>Delete for everyone</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full Emoji Reaction Modal */}
      {showFullEmojiReactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative">
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                onReactToMessage?.(showFullEmojiReactionModal.id, emoji);
                setShowFullEmojiReactionModal(null);
                showToast(`Reacted ${emoji}`);
              }}
              onClose={() => setShowFullEmojiReactionModal(null)}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-500" />
                Edit Message
              </h3>
              <button
                onClick={() => setEditingMessage(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className={`w-full p-3 text-sm rounded-xl border outline-hidden transition-all ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/90 text-white border border-slate-700 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
