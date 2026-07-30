import React, { useRef, useState } from 'react';
import { Contact, Message, ChatThemeConfig, WallpaperConfig, ChatTheme, DisappearingTimerOption } from '../types';
import { THEME_PRESETS, WALLPAPER_PRESETS } from '../themeData';
import {
  X,
  Bell,
  BellOff,
  Trash2,
  Image as ImageIcon,
  Palette,
  Upload,
  Check,
  Sparkles,
  Sliders,
  Pencil,
  UserCheck,
  Tag,
  Timer,
  Clock,
  Flame,
} from 'lucide-react';

interface ContactInfoDrawerProps {
  contact: Contact;
  messages: Message[];
  onClose: () => void;
  onClearChat: () => void;
  isDarkMode: boolean;
  activeTheme: ChatThemeConfig;
  onSelectTheme: (theme: ChatThemeConfig) => void;
  activeWallpaper?: WallpaperConfig;
  onSelectWallpaper: (wallpaper: WallpaperConfig) => void;
  onSetNickname?: (nickname: string) => void;
  disappearingTimer?: DisappearingTimerOption;
  onSetDisappearingTimer?: (timer: DisappearingTimerOption) => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  contact,
  messages,
  onClose,
  onClearChat,
  isDarkMode,
  activeTheme,
  onSelectTheme,
  activeWallpaper,
  onSelectWallpaper,
  onSetNickname,
  disappearingTimer,
  onSetDisappearingTimer,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(contact.nickname || '');
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const mediaMessages = messages.filter((m) => !!m.imageUrl);

  const handleSaveNickname = () => {
    onSetNickname?.(nicknameInput.trim());
    setIsEditingNickname(false);
  };

  const handleRemoveNickname = () => {
    setNicknameInput('');
    onSetNickname?.('');
    setIsEditingNickname(false);
  };

  // Handle Device File Upload for Wallpaper
  const handleDeviceWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelectWallpaper({
          type: 'custom',
          url: reader.result as string,
          opacity: activeWallpaper?.opacity ?? 0.85,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
      />

      <div
        className={`fixed inset-y-0 right-0 z-40 w-80 sm:w-96 max-w-full border-l flex flex-col h-full shadow-2xl transition-all duration-300 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        } lg:relative lg:inset-auto`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-sm tracking-wide text-slate-500 uppercase font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Chat Customization</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Profile Summary Card */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-20 h-20 rounded-full object-cover shadow-lg mb-2 ring-4 ring-blue-500/20"
            />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              {contact.nickname || contact.name}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{contact.username}</p>
            {contact.nickname && (
              <p className="text-xs text-slate-400 mt-1 italic">Real name: {contact.name}</p>
            )}
          </div>

          {/* SECTION 1: NICKNAME (INSTAGRAM STYLE) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              <span>Nickname</span>
            </h4>
            <div
              className={`p-3.5 rounded-2xl border ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {isEditingNickname ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Only you will see this nickname in your chats.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder={contact.name}
                      className="flex-1 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                  {contact.nickname && (
                    <button
                      onClick={handleRemoveNickname}
                      className="text-xs text-red-500 hover:underline font-medium block"
                    >
                      Remove nickname
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Current Nickname</p>
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {contact.nickname ? `"${contact.nickname}"` : 'None set'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNicknameInput(contact.nickname || '');
                      setIsEditingNickname(true);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{contact.nickname ? 'Change' : 'Set Nickname'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: INSTAGRAM CHAT THEME COLORS */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              <span>Instagram Chat Theme</span>
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              {THEME_PRESETS.map((theme) => {
                const isSelected = activeTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme)}
                    className={`relative p-2.5 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20'
                        : isDarkMode
                        ? 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${theme.gradientClass} shadow-md flex items-center justify-center`}
                    >
                      {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: CHAT WALLPAPER (DEVICE UPLOAD & PRESETS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                <span>Chat Wallpaper</span>
              </h4>
            </div>

            {/* Custom Device File Upload Button */}
            <input
              ref={wallpaperInputRef}
              type="file"
              accept="image/*"
              onChange={handleDeviceWallpaperUpload}
              className="hidden"
            />
            <button
              onClick={() => wallpaperInputRef.current?.click()}
              className="w-full p-3 rounded-2xl border-2 border-dashed border-blue-500/40 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:shadow-xs group"
            >
              <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Choose Wallpaper from Device</span>
            </button>

            {/* Preset Wallpaper Cards */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {WALLPAPER_PRESETS.map((wp) => {
                const isSelected = activeWallpaper?.url === wp.url;
                return (
                  <button
                    key={wp.id}
                    onClick={() =>
                      onSelectWallpaper({
                        type: 'preset',
                        url: wp.url,
                        presetId: wp.id,
                        opacity: activeWallpaper?.opacity ?? 0.85,
                      })
                    }
                    className={`relative h-20 rounded-xl overflow-hidden border transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-end p-1.5">
                      <span className="text-[10px] text-white font-semibold line-clamp-1">{wp.name}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 p-1 rounded-full bg-blue-500 text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Wallpaper Opacity Adjustment Slider */}
            {activeWallpaper?.url && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    Wallpaper Opacity
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {Math.round((activeWallpaper.opacity ?? 0.85) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={activeWallpaper.opacity ?? 0.85}
                  onChange={(e) =>
                    onSelectWallpaper({
                      ...activeWallpaper,
                      opacity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <button
                  onClick={() => onSelectWallpaper({ type: 'none' })}
                  className="w-full text-center text-xs text-rose-500 hover:underline pt-1"
                >
                  Remove Wallpaper
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: DISAPPEARING MESSAGES TIMER */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              <span>Disappearing Messages</span>
            </h4>
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                New messages in this chat will automatically expire and vanish after the selected duration.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(
                  [
                    { id: 'off', label: 'Off', desc: 'Keep forever' },
                    { id: '1m', label: '1 Minute', desc: 'Fast demo' },
                    { id: '24h', label: '24 Hours', desc: '1 day timer' },
                    { id: '7d', label: '7 Days', desc: '1 week timer' },
                  ] as const
                ).map((opt) => {
                  const isSelected = (disappearingTimer || 'off') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onSetDisappearingTimer?.(opt.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                          : isDarkMode
                          ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {opt.label}
                        </span>
                        {isSelected && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Preferences */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Preferences
            </h4>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-semibold border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isMuted ? <BellOff className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4 text-blue-500" />}
                <span>Mute Notifications</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isMuted ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {isMuted ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Shared Media Tabs (Photos, Voice Notes, Polls) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Shared Gallery</span>
            </h4>

            {/* Photos */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Photos & Images ({mediaMessages.length})</p>
              {mediaMessages.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No photos shared in this chat</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.map((msg) => (
                    <img
                      key={msg.id}
                      src={msg.imageUrl}
                      alt="Shared media"
                      className="w-full h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Voice Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Voice Notes ({messages.filter((m) => !!m.audioUrl).length})
              </p>
              {messages.filter((m) => !!m.audioUrl).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No voice notes shared</p>
              ) : (
                <div className="space-y-1.5">
                  {messages
                    .filter((m) => !!m.audioUrl)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs font-medium"
                      >
                        <span className="flex items-center gap-1.5 text-blue-500 font-semibold">
                          🎤 Voice Note
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Polls */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Polls ({messages.filter((m) => !!m.poll).length})
              </p>
              {messages.filter((m) => !!m.poll).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No polls created</p>
              ) : (
                <div className="space-y-1.5">
                  {messages
                    .filter((m) => !!m.poll)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs font-semibold"
                      >
                        <span className="text-indigo-500 truncate max-w-[200px]">📊 {msg.poll?.question}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{msg.poll?.totalVotes} votes</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Clear Chat */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={onClearChat}
              className="w-full p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat History</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
