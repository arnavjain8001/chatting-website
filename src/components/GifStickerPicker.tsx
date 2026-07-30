import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, Flame, Heart, Smile, ThumbsUp, Zap, Loader2 } from 'lucide-react';

interface GifStickerPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

interface GifItem {
  id: string;
  title: string;
  category?: string;
  url: string;
  tags?: string[];
}

// Public GIPHY API Key for client side search
const GIPHY_API_KEY = 'sX4weR9zpUKRqySFP1I8ZPO3XuA384A2';

// Rich Curated Fallback Collection for offline / instant search matching
const FALLBACK_GIFS: GifItem[] = [
  { id: '1', title: 'Happy Dance', category: 'Dance', url: 'https://media.giphy.com/media/l0AMOCI491Lid4f2M/giphy.gif', tags: ['dance', 'happy', 'party', 'celebrate'] },
  { id: '2', title: 'Mind Blown', category: 'Reaction', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', tags: ['mind blown', 'shocked', 'wow', 'omg'] },
  { id: '3', title: 'Cute Cat Vibe', category: 'Cat', url: 'https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif', tags: ['cat', 'cute', 'kitten', 'vibes', 'cool'] },
  { id: '4', title: 'Thumbs Up Approval', category: 'Trending', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', tags: ['thumbs up', 'like', 'agree', 'yes', 'ok'] },
  { id: '5', title: 'Laughing Out Loud', category: 'Lol', url: 'https://media.giphy.com/media/10yXFibl978FqE/giphy.gif', tags: ['lol', 'laugh', 'funny', 'haha', 'rofl'] },
  { id: '6', title: 'Love Heart Kiss', category: 'Love', url: 'https://media.giphy.com/media/26BRv0ThOHfdDxkcU/giphy.gif', tags: ['love', 'kiss', 'heart', 'romance', 'hug'] },
  { id: '7', title: 'Fire Hyped', category: 'Fire', url: 'https://media.giphy.com/media/Lopx9eUi34rbq/giphy.gif', tags: ['fire', 'hot', 'lit', 'hyped', 'epic'] },
  { id: '8', title: 'Applause Clapping', category: 'Applause', url: 'https://media.giphy.com/media/G9pD9p2XJgR9A3P9rF/giphy.gif', tags: ['applause', 'clapping', 'bravo', 'congrats'] },
  { id: '9', title: 'Anime Shock', category: 'Anime', url: 'https://media.giphy.com/media/89asT84PzDww8/giphy.gif', tags: ['anime', 'shock', 'gasp', 'naruto', 'dbz'] },
  { id: '10', title: 'Cool Sunglasses Dog', category: 'Trending', url: 'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif', tags: ['dog', 'cool', 'sunglasses', 'puppy', 'swag'] },
  { id: '11', title: 'SpongeBob Crying', category: 'Lol', url: 'https://media.giphy.com/media/ISOckXU1vnEG4/giphy.gif', tags: ['spongebob', 'sad', 'crying', 'tears', 'mood'] },
  { id: '12', title: 'Celebration Confetti', category: 'Trending', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', tags: ['celebrate', 'cheers', 'champagne', 'party'] },
  { id: '13', title: 'Tom & Jerry Chase', category: 'Anime', url: 'https://media.giphy.com/media/3o6Zt8b35A21qJ1KjS/giphy.gif', tags: ['tom', 'jerry', 'cartoon', 'run', 'funny'] },
  { id: '14', title: 'Facepalm Sigh', category: 'Reaction', url: 'https://media.giphy.com/media/xsF1FSDbjguis/giphy.gif', tags: ['facepalm', 'fail', 'sigh', 'dumb', 'no'] },
  { id: '15', title: 'Popcorn Eating', category: 'Reaction', url: 'https://media.giphy.com/media/13cptIwW9bgzk6/giphy.gif', tags: ['popcorn', 'watching', 'drama', 'chill'] },
  { id: '16', title: 'Salute Respect', category: 'Trending', url: 'https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif', tags: ['salute', 'respect', 'captain', 'bye'] },
  { id: '17', title: 'Baby Yoda Grogu Wave', category: 'Trending', url: 'https://media.giphy.com/media/Wn74RUT0vjnoU98Hnt/giphy.gif', tags: ['yoda', 'baby yoda', 'hi', 'wave', 'cute'] },
  { id: '18', title: 'Blinking Guy What', category: 'Reaction', url: 'https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif', tags: ['what', 'confused', 'blink', 'huh'] },
];

const FALLBACK_STICKERS: GifItem[] = [
  { id: 's1', title: 'Heart Sparkle', url: 'https://media.giphy.com/media/M9P096uTUy5EOlM2pe/giphy.gif', tags: ['heart', 'love', 'sparkle'] },
  { id: 's2', title: 'Cool Cat Sticker', url: 'https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/giphy.gif', tags: ['cat', 'cool', 'sticker'] },
  { id: 's3', title: 'Star Burst', url: 'https://media.giphy.com/media/Y4SIn9J13f1i3e5u1T/giphy.gif', tags: ['star', 'gold', 'shine'] },
  { id: 's4', title: 'Party Frog', url: 'https://media.giphy.com/media/4oXo09n6k7kL2yK4cK/giphy.gif', tags: ['frog', 'party', 'dance'] },
  { id: 's5', title: 'Rainbow Sparkles', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', tags: ['rainbow', 'magic', 'sparkle'] },
  { id: 's6', title: 'Cute Coffee Mug', url: 'https://media.giphy.com/media/l0HlNz1cno5jKInYc/giphy.gif', tags: ['coffee', 'good morning', 'cute'] },
];

const CATEGORY_CHIPS = ['Trending', 'Reaction', 'Dance', 'Cat', 'Lol', 'Love', 'Fire', 'Anime', 'Applause'];

export const GifStickerPicker: React.FC<GifStickerPickerProps> = ({
  onSelectGif,
  onClose,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'gifs' | 'stickers'>('gifs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('Trending');
  const [giphyResults, setGiphyResults] = useState<GifItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Live GIPHY API Fetch with debouncing
  useEffect(() => {
    let isMounted = true;
    const query = searchQuery.trim();

    const fetchGiphy = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'gifs' ? 'gifs' : 'stickers';
        const url = query
          ? `https://api.giphy.com/v1/${endpoint}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
              query
            )}&limit=24&rating=g`
          : `https://api.giphy.com/v1/${endpoint}/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const mapped: GifItem[] = data.data.map((item: any) => ({
              id: item.id,
              title: item.title || 'GIF',
              url: item.images?.fixed_height?.url || item.images?.original?.url,
            }));
            if (isMounted) {
              setGiphyResults(mapped);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('GIPHY API fetch warning, using curated database:', err);
      }

      if (isMounted) {
        setGiphyResults([]);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchGiphy();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, activeTab]);

  // Combine GIPHY API results or Fallback Filtering
  const getDisplayItems = () => {
    if (giphyResults.length > 0) return giphyResults;

    const sourceList = activeTab === 'gifs' ? FALLBACK_GIFS : FALLBACK_STICKERS;
    const q = searchQuery.toLowerCase().trim();

    return sourceList.filter((item) => {
      if (!q) {
        if (!selectedCategory || selectedCategory === 'Trending') return true;
        return item.category?.toLowerCase() === selectedCategory.toLowerCase();
      }
      return (
        item.title.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  };

  const displayItems = getDisplayItems();

  return (
    <div
      className={`w-80 sm:w-96 rounded-2xl border shadow-2xl p-3 flex flex-col gap-3 transition-all animate-fadeIn ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-xl'
          : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-xl'
      }`}
    >
      {/* Header Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('gifs');
              setSelectedCategory('Trending');
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'gifs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🎬 GIFs
          </button>
          <button
            onClick={() => {
              setActiveTab('stickers');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'stickers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ✨ Stickers
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) setSelectedCategory(null);
          }}
          placeholder={activeTab === 'gifs' ? 'Search all GIFs (e.g., cat, dance, love)...' : 'Search stickers...'}
          className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border outline-hidden transition-all ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500'
              : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Direct Search & Grid without category chips */}

      {/* Grid Display */}
      <div className="relative min-h-[180px] max-h-60 overflow-y-auto pr-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Searching GIPHY...</span>
          </div>
        ) : displayItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {displayItems.map((gif) => (
              <button
                key={gif.id}
                onClick={() => {
                  onSelectGif(gif.url);
                  onClose();
                }}
                className={`group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-blue-500 transition-all transform active:scale-95 ${
                  activeTab === 'stickers' ? 'aspect-square p-2' : 'aspect-video'
                }`}
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className={`w-full h-full ${
                    activeTab === 'stickers' ? 'object-contain' : 'object-cover'
                  } group-hover:scale-105 transition-transform duration-300`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                  <span className="text-[10px] font-medium text-white truncate">{gif.title}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
            <p>No {activeTab} found for "{searchQuery}"</p>
            <p className="text-[10px] text-slate-500 mt-1">Try searching for "dance", "cat", "happy", or "love"</p>
          </div>
        )}
      </div>
    </div>
  );
};

