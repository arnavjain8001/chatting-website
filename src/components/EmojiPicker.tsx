import React, { useState } from 'react';
import { Search, X, Smile, ThumbsUp, Heart, Sparkles, Utensils, Compass, Gamepad2, Lightbulb, Flag } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  isDarkMode: boolean;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Reactions',
    icon: '😊',
    emojis: [
      '😊', '😂', '🤣', '😍', '🥰', '😘', '😋', '😎', '🥳', '🥺',
      '🤩', '😜', '😏', '🤔', '🫣', '😬', '😴', '😭', '🤯', '😱',
      '🤮', '😈', '💩', '🙈', '💬', '🔥', '✨', '💯', '🎉', '❤️',
      '💖', '💕', '💔', '❣️', '💗', '💓', '🖤', '🤍', '🤎', '💜'
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & Body',
    icon: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '🙏', '🤝', '✌️', '🤞', '🤟', '🤙',
      '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️', '🖖', '✊', '👊',
      '🤛', '🤜', '💪', '🦾', '🖕', '✍️', '💅', '🤳', '🧠', '👁️'
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄',
      '🐝', '🐛', '🦋', '🌸', '🌺', '🌻', '🌹', '🌷', '🌴', '🌲',
      '☀️', '🌙', '⭐', '⚡', '🔥', '🌈', '🌊', '❄️', '☁️', '🌧️'
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍔',
    emojis: [
      '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗', '🍿', '🍱',
      '🍣', '🍜', '🍝', '🍦', '🍨', '🍩', '🍪', '🎂', '🍰', '🍫',
      '🍬', '🍭', '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🍷', '🍹'
    ],
  },
  {
    id: 'activities',
    name: 'Activities & Sports',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🏓', '🏸', '🏒', '⛳', '🎯', '🎮', '🕹️', '🎲', '🧩', '🎨',
      '🎬', '🎤', '🎧', '🎷', '🎸', '🎹', '🎺', '🎻', '🥁', '🏆'
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: '🚗',
    emojis: [
      '🚗', '🏎️', '🛺', '🚲', '🛵', '🏍️', '✈️', '🚀', '🚁', '⛵',
      '🛥️', '🏠', '🏡', '🏖️', '🏔️', '🎡', '🌇', '🏙️', '🗺️', '🗽'
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Symbols',
    icon: '💡',
    emojis: [
      '💡', '📱', '💻', '🖥️', '📷', '📸', '📹', '📺', '⏰', '⌚',
      '🎁', '🎈', '🎉', '💎', '🔑', '🔒', '🔔', '📢', '⚠️', '❓'
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelectEmoji,
  onClose,
  isDarkMode,
}) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  // Search filtering across all emojis
  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const filteredEmojis = searchQuery.trim()
    ? Array.from(new Set(allEmojis)) // Unique list
    : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || [];

  return (
    <div
      className={`w-80 sm:w-96 rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-scaleIn select-none backdrop-blur-md ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-800'
      }`}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
            className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border outline-hidden transition-all ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500'
                : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Icons Tabs (if not searching) */}
      {!searchQuery && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-lg text-base transition-transform hover:scale-110 ${
                activeCategory === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900/60 ring-1 ring-blue-500'
                  : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid Container */}
      <div className="p-3 max-h-60 overflow-y-auto grid grid-cols-8 gap-1.5">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            onClick={() => onSelectEmoji(emoji)}
            className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 hover:scale-125 transition-all duration-150"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
