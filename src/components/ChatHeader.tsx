import React from 'react';
import { Contact } from '../types';
import { Phone, Video, Info, ArrowLeft, Palette } from 'lucide-react';

interface ChatHeaderProps {
  contact: Contact;
  onBack: () => void;
  onToggleInfo: () => void;
  isDarkMode: boolean;
  onSimulateCall: (type: 'voice' | 'video') => void;
  isTyping?: boolean;
  onOpenStory?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  contact,
  onBack,
  onToggleInfo,
  isDarkMode,
  onSimulateCall,
  isTyping = false,
  onOpenStory,
}) => {
  return (
    <div
      className={`h-16 px-4 md:px-6 border-b flex items-center justify-between shrink-0 transition-colors z-10 ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-2xs'
      }`}
    >
      {/* Left: Mobile Back button + Contact Avatar & Details */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className={`p-2 rounded-full md:hidden transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          aria-label="Back to messages"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleInfo}
            className="relative shrink-0 group focus:outline-hidden"
            title="Contact info"
          >
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shadow-xs"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                isDarkMode ? 'border-slate-900' : 'border-white'
              } ${
                contact.status === 'online'
                  ? 'bg-emerald-500'
                  : 'bg-yellow-400'
              }`}
            />
          </button>

          <div onClick={onToggleInfo} className="min-w-0 cursor-pointer group">
            <h3 className="font-bold text-sm tracking-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {contact.nickname || contact.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
              {isTyping ? (
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <span>typing</span>
                  <span className="inline-flex items-center gap-0.5 ml-0.5">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              ) : (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      contact.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-400'
                    }`}
                  />
                  <span className="truncate">{contact.lastSeen || contact.status}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onSimulateCall('voice')}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Audio Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSimulateCall('video')}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Video Call"
        >
          <Video className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onToggleInfo}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-purple-400' : 'hover:bg-slate-100 text-purple-600'
          }`}
          title="Chat Theme & Wallpaper Customization"
        >
          <Palette className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleInfo}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Contact Info"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
