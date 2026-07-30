import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Music,
  Type,
  Smile,
  Check,
  Play,
  Pause,
  Upload,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Search,
  Disc,
  MapPin,
  AtSign,
  HelpCircle,
  PenTool,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { UserStory, MusicTrack, StorySticker, StoryLocation, StoryMention, StoryQuestion } from '../types';
import { storyAudioPlayer } from '../utils/storyAudio';

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareStory: (story: UserStory) => void;
  isDarkMode: boolean;
  currentUser: {
    name: string;
    avatar: string;
  };
}

const PRESET_MUSIC: MusicTrack[] = [
  // --- HINDI SONGS ---
  {
    id: 'h1',
    title: 'Kesariya',
    artist: 'Arijit Singh & Pritam',
    album: 'Brahmastra',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/bf/19/d3/bf19d3ef-2a3b-2521-5a02-2a7e78ca6011/mzaf_11700683403167104331.plus.aac.p.m4a',
    lyrics: [
      'Mujhko kitna chahne lage...',
      'Kesariya tera ishq hai piya 🌸',
      'Rang jaaun jo main haath lagaun ✨',
      'Din beete yaari mein, raatein intezaari mein',
      'O piya... Kesariya tera ishq hai!'
    ],
  },
  {
    id: 'h2',
    title: 'Chaleya',
    artist: 'Arijit Singh & Shilpa Rao',
    album: 'Jawan',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/4a/db/76/4adb765e-26f6-8c46-7649-629ee9458925/mzaf_10912239474779262272.plus.aac.p.m4a',
    lyrics: [
      'Ishq mein dil bana hai tera...',
      'Chaleya teri ore, chaleya... ❤️',
      'Aanhi-jaani rutt wargiya',
      'Tera mera rishta purana hai 🌟',
      'Tu hai toh mujhe phir aur kya chahiye'
    ],
  },
  {
    id: 'h3',
    title: 'Apna Bana Le',
    artist: 'Arijit Singh & Sachin-Jigar',
    album: 'Bhediya',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/ed/21/53/ed21532f-bc26-88ef-4171-8854045f49e7/mzaf_17260563456345129845.plus.aac.p.m4a',
    lyrics: [
      'Tu mera koi na ho ke bhi kuch lage...',
      'Apna bana le mujhe, apna bana le piya 💖',
      'Dil ke nagar mein shehar tu basa le',
      'Baanth le sabhi gham mera!'
    ],
  },
  {
    id: 'h4',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    album: 'Aashiqui 2',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/28/7f/32/287f32e9-4e3e-45fa-284a-fa1f97a5531f/mzaf_11943890252516423984.plus.aac.p.m4a',
    lyrics: [
      'Hum tere bin ab reh nahi sakte...',
      'Tere bina kya wajood mera 🌧️',
      'Tujhse juda agar ho jayenge',
      'Toh khud se hi ho jayenge judaa...',
      'Kyunki tum hi ho, ab tum hi ho!'
    ],
  },
  {
    id: 'h5',
    title: 'Heeriye',
    artist: 'Jasleen Royal & Arijit Singh',
    album: 'Single',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/d9/3d/8c/d93d8c18-bc1a-63d1-4191-4c6017b2b8e3/mzaf_17395058742817290123.plus.aac.p.m4a',
    lyrics: [
      'Heeriye sehra tera, sajna ve...',
      'Akhaan di gall sun le, akhaan vich reh le ✨',
      'Sadiyan ton tera intezaar si',
      'Tujhpe hi aa ke rukiyan saansan!'
    ],
  },
  {
    id: 'h6',
    title: 'Satranga',
    artist: 'Arijit Singh & Shreyas Puranik',
    album: 'Animal',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/bf/19/d3/bf19d3ef-2a3b-2521-5a02-2a7e78ca6011/mzaf_11700683403167104331.plus.aac.p.m4a',
    lyrics: [
      'Mera mehram tu, mera mehram tu...',
      'Satranga yeh ishq re 🌈',
      'Koyal jaisi teri boli, palke teri haule',
      'Rab se pehle tera naam loon!'
    ],
  },
  {
    id: 'h7',
    title: 'O Maahi',
    artist: 'Arijit Singh & Pritam',
    album: 'Dunki',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/4a/db/76/4adb765e-26f6-8c46-7649-629ee9458925/mzaf_10912239474779262272.plus.aac.p.m4a',
    lyrics: [
      'O maahi O maahi mera...',
      'Dil vich reh ja, tu hi hai mera 💫',
      'O maahive, tere baaghon mein khile phool',
      'Hoke juda main mar jaavan!'
    ],
  },
  {
    id: 'h8',
    title: 'Sajni',
    artist: 'Arijit Singh & Ram Sampath',
    album: 'Laapataa Ladies',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/ed/21/53/ed21532f-bc26-88ef-4171-8854045f49e7/mzaf_17260563456345129845.plus.aac.p.m4a',
    lyrics: [
      'Sajni re, kaise kategi ratiya...',
      'Balam ki yaad mein beetey din-raat 🌙',
      'Kaise sambhaloon yeh chanchal manva',
      'Sajni re... tere bin suni hai duniya!'
    ],
  },
  {
    id: 'h9',
    title: 'Ve Kamleya',
    artist: 'Arijit Singh & Shreya Ghoshal',
    album: 'Rocky Aur Rani Kii Prem Kahaani',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/28/7f/32/287f32e9-4e3e-45fa-284a-fa1f97a5531f/mzaf_11943890252516423984.plus.aac.p.m4a',
    lyrics: [
      'Ve kamleya, ve kamleya...',
      'Dil nu samajh na aave 💔',
      'Raste judaa kyun ho gaye saade',
      'Tujhpe hi jaake saans aave!'
    ],
  },
  {
    id: 'h10',
    title: 'Tere Vaaste',
    artist: 'Varun Jain, Sachin-Jigar & Shadab Faridi',
    album: 'Zara Hatke Zara Bachke',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/d9/3d/8c/d93d8c18-bc1a-63d1-4191-4c6017b2b8e3/mzaf_17395058742817290123.plus.aac.p.m4a',
    lyrics: [
      'Tere vaaste falak se main chaand launga...',
      'Solah satrah sitare sang baandh launga ⭐',
      'Chaand taare tod laaoon, saari duniya pe chhaaoon',
      'Tere vaaste, tere vaaste!'
    ],
  },
  {
    id: 'h11',
    title: 'Maan Meri Jaan',
    artist: 'King',
    album: 'Champagne Talk',
    language: 'Hindi',
    coverUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/bf/19/d3/bf19d3ef-2a3b-2521-5a02-2a7e78ca6011/mzaf_11700683403167104331.plus.aac.p.m4a',
    lyrics: [
      'Tu maan meri jaan, main tujhe jaane na dunga...',
      'Main tujhko apni baahon mein chhupa ke rakhunga ❤️',
      'Tu hi hai dil ki dhadkan, tu hi mera junoon',
      'Tu maan meri jaan!'
    ],
  },

  // --- PUNJABI SONGS ---
  {
    id: 'p1',
    title: 'Softly',
    artist: 'Karan Aujla & Ikky',
    album: 'Making Memories',
    language: 'Punjabi',
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/f0/54/1b/f0541b31-29cf-4a33-611a-d47509439bd3/mzaf_178492027281938201.plus.aac.p.m4a',
    lyrics: [
      'Kehndi softly, softly, softly...',
      'Suit tera ni, heels teri... 💃',
      'Karan Aujla x Ikky on the beat',
      'Vibe teri wakhri hai goriye!'
    ],
  },
  {
    id: 'p2',
    title: 'Brown Munde',
    artist: 'AP Dhillon, Gurinder Gill, Shinda Kahlon',
    album: 'Run-Up Records',
    language: 'Punjabi',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/31/5e/e2/315ee2bb-85df-d122-38ef-0a563968d601/mzaf_319230592810398219.plus.aac.p.m4a',
    lyrics: [
      'AP Dhillon, Gurinder Gill...',
      'Majhe aale, Brown Munde! 🕶️',
      'Gaddi vich wajde ne geet...',
      'Desi kalakaar, international munde!'
    ],
  },
  {
    id: 'p3',
    title: 'Tauba Tauba',
    artist: 'Karan Aujla',
    album: 'Bad Newz',
    language: 'Punjabi',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/f0/54/1b/f0541b31-29cf-4a33-611a-d47509439bd3/mzaf_178492027281938201.plus.aac.p.m4a',
    lyrics: [
      'Husn tera tauba tauba...',
      'Nakhra tera tauba tauba 🔥',
      'Karan Aujla di beat te nache duniya',
      'Rabb di sau, lagdi ae killer!'
    ],
  },
  {
    id: 'p7',
    title: 'Pasoori',
    artist: 'Ali Sethi & Shae Gill',
    album: 'Coke Studio Season 14',
    language: 'Punjabi',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/27/98/e4/2798e4d2-3114-1188-7eef-51a82f34f71a/mzaf_90138291028391829.plus.aac.p.m4a',
    lyrics: [
      'Agg laavan majboori nu...',
      'Aan jaan di pasoorii nu 🎶',
      'Zahar bane haan teri...',
      'Pee jaavan main sabhi gham...'
    ],
  },

  // --- ENGLISH / GLOBAL ---
  {
    id: 'e1',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n Sweet',
    language: 'English',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bc/39/2f/bc392f44-8833-289b-2a2d-2092c46fa2b8/mzaf_1357599023819208391.plus.aac.p.m4a',
    lyrics: [
      "Now he's thinkin' 'bout me every night, oh...",
      'Is it that sweet? I guess so... ☕',
      "Say you can't sleep, baby, I know...",
      "That's that me, espresso!"
    ],
  },
  {
    id: 'e2',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    language: 'English',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/80/7e/15/807e15d8-e7b3-888a-211a-4d26b9117a02/mzaf_1381920831928019238.plus.aac.p.m4a',
    lyrics: [
      'I can buy myself flowers... 💐',
      'Write my name in the sand',
      'Talk to myself for hours...',
      'Yeah I can love me better than you can!'
    ],
  },
  {
    id: 'e3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    language: 'English',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/2f/78/3a/2f783ae5-08e1-efb4-8260-2491a9f14371/mzaf_113098329108392108.plus.aac.p.m4a',
    lyrics: [
      "I said, ooh, I'm blinded by the lights... ✨",
      "No, I can't sleep until I feel your touch",
      "I'm runnin' out of time...",
      "You can't see me through the night!"
    ],
  },
  {
    id: 'e4',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    language: 'English',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bc/39/2f/bc392f44-8833-289b-2a2d-2092c46fa2b8/mzaf_1357599023819208391.plus.aac.p.m4a',
    lyrics: [
      'If you wanna run away with me, I know a galaxy...',
      'And I can take you for a ride 🚀',
      "I got you, moonlight, you're my starlight",
      'I need you all night, come on, dance with me!'
    ],
  },
];

const FILTER_PRESETS = [
  { id: 'normal', name: 'Normal', filterClass: '' },
  { id: 'paris', name: 'Paris 🌸', filterClass: 'brightness-110 contrast-105 saturate-120 sepia-[0.15]' },
  { id: 'jaipur', name: 'Jaipur ☀️', filterClass: 'brightness-105 contrast-110 sepia-[0.35] hue-rotate-[-10deg]' },
  { id: 'oslo', name: 'Oslo ❄️', filterClass: 'contrast-125 saturate-110 hue-rotate-[15deg] brightness-95' },
  { id: 'vintage', name: 'Vintage 🎞️', filterClass: 'sepia-[0.5] contrast-90 brightness-105 saturate-85' },
  { id: 'cyberpunk', name: 'Cyber 🌆', filterClass: 'contrast-130 saturate-150 hue-rotate-[140deg]' },
  { id: 'noir', name: 'Noir 🖤', filterClass: 'grayscale contrast-140 brightness-90' },
  { id: 'tokyo', name: 'Tokyo 🔮', filterClass: 'brightness-110 saturate-140 hue-rotate-[290deg]' },
];

const PRESET_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800', // Sunset
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', // Beach
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800', // Nature
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', // Galaxy
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800', // Gradient
];

const LOCATION_PRESETS = ['📍 Mumbai, India', '📍 New Delhi', '📍 Chandigarh', '📍 Goa Beach', '📍 London, UK', '📍 New York'];
const EMOJI_STICKERS = ['✨', '🔥', '💖', '🎧', '🌊', '☕', '🎉', '🌟', '🍕', '🚀', '💯', '📍', '⚡', '😎', '👑', '🎶', '🇮🇳', '❤️'];
const PEN_COLORS = ['#ffffff', '#ec4899', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#000000'];

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  isOpen,
  onClose,
  onShareStory,
  isDarkMode,
  currentUser,
}) => {
  const [mediaUrl, setMediaUrl] = useState<string>(PRESET_BACKGROUNDS[0]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(PRESET_MUSIC[0]);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);

  // Music Search & Filter State
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<'All' | 'Hindi' | 'Punjabi' | 'English'>('All');
  const [onlineSearchResults, setOnlineSearchResults] = useState<MusicTrack[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);

  // Lyric Timer
  useEffect(() => {
    if (!isOpen || !selectedMusic) return;
    const interval = setInterval(() => {
      setActiveLyricIndex((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, selectedMusic]);

  // Online iTunes Search Effect
  useEffect(() => {
    if (!musicSearchQuery.trim() || musicSearchQuery.length < 2) {
      setOnlineSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(musicSearchQuery)}&entity=song&limit=8`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const tracks: MusicTrack[] = data.results.map((item: any) => ({
            id: `itunes-${item.trackId}`,
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName || 'Single',
            coverUrl: item.artworkUrl100?.replace('100x100bb', '300x300bb') || item.artworkUrl100,
            audioUrl: item.previewUrl,
            language: selectedLanguageFilter !== 'All' ? selectedLanguageFilter : 'Global',
            lyrics: [
              `🎵 ${item.trackName}`,
              `🎤 ${item.artistName}`,
              `✨ ${item.collectionName || 'Single'}`,
              `🎶 Pure Music Vibes...`
            ]
          }));
          setOnlineSearchResults(tracks);
        } else {
          setOnlineSearchResults([]);
        }
      } catch (err) {
        console.warn('iTunes online search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [musicSearchQuery, selectedLanguageFilter]);

  // Filter State
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');

  // Text Overlay State
  const [text, setText] = useState('');
  const [textStyle, setTextStyle] = useState<'modern' | 'neon' | 'classic' | 'typewriter'>('modern');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBg, setTextBg] = useState(true);

  // Instagram Stickers & Features State
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [location, setLocation] = useState<StoryLocation | null>(null);
  const [locationInput, setLocationInput] = useState('');

  const [mention, setMention] = useState<StoryMention | null>(null);
  const [mentionInput, setMentionInput] = useState('');

  const [question, setQuestion] = useState<StoryQuestion | null>(null);
  const [questionInput, setQuestionInput] = useState('');

  // Doodle Drawing Canvas State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [penColor, setPenColor] = useState('#ec4899');
  const [penSize, setPenSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState<'media' | 'filters' | 'music' | 'text' | 'stickers' | 'draw'>('media');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Music Audio Playback
  useEffect(() => {
    if (!isOpen) {
      storyAudioPlayer.stop();
      return;
    }

    if (selectedMusic && isPlayingMusic) {
      storyAudioPlayer.playTrack(selectedMusic.id, selectedMusic.language, selectedMusic.audioUrl);
    } else {
      storyAudioPlayer.stop();
    }

    return () => {
      storyAudioPlayer.stop();
    };
  }, [isOpen, selectedMusic, isPlayingMusic]);

  // Filtered Music List based on Search Query & Language Tab
  const filteredMusic = useMemo(() => {
    return PRESET_MUSIC.filter((m) => {
      const matchesLanguage = selectedLanguageFilter === 'All' || m.language === selectedLanguageFilter;
      const q = musicSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.artist.toLowerCase().includes(q) ||
        (m.album && m.album.toLowerCase().includes(q)) ||
        (m.language && m.language.toLowerCase().includes(q));

      return matchesLanguage && matchesQuery;
    });
  }, [musicSearchQuery, selectedLanguageFilter]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker: StorySticker = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      emoji,
      xPercent: 30 + Math.random() * 40,
      yPercent: 30 + Math.random() * 40,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddLocation = (locName: string) => {
    if (!locName.trim()) return;
    setLocation({
      name: locName.trim(),
      xPercent: 50,
      yPercent: 20,
    });
    setLocationInput('');
  };

  const handleAddMention = (handle: string) => {
    if (!handle.trim()) return;
    const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    setMention({
      username: cleanHandle,
      xPercent: 50,
      yPercent: 75,
    });
    setMentionInput('');
  };

  const handleAddQuestion = (qText: string) => {
    if (!qText.trim()) return;
    setQuestion({
      question: qText.trim(),
      xPercent: 50,
      yPercent: 40,
    });
    setQuestionInput('');
  };

  const handleAddCustomSearchSong = () => {
    if (!musicSearchQuery.trim()) return;
    const customTrack: MusicTrack = {
      id: `custom-${Date.now()}`,
      title: musicSearchQuery.trim(),
      artist: selectedLanguageFilter !== 'All' ? `${selectedLanguageFilter} Trending` : 'Trending Artist',
      language: selectedLanguageFilter !== 'All' ? selectedLanguageFilter : 'Hindi',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
    };
    setSelectedMusic(customTrack);
    setIsPlayingMusic(true);
  };

  // Drawing Canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlePublish = () => {
    storyAudioPlayer.stop();

    let drawingDataUrl: string | undefined;
    if (canvasRef.current) {
      drawingDataUrl = canvasRef.current.toDataURL();
    }

    const currentFilterClass = FILTER_PRESETS.find((f) => f.id === selectedFilter)?.filterClass || '';

    const newStory: UserStory = {
      id: `story-my-${Date.now()}`,
      contactId: 'me',
      contactName: currentUser.name || 'You',
      contactAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      mediaUrl,
      mediaType,
      timestamp: 'Just now',
      musicTrack: selectedMusic || undefined,
      filterStyle: currentFilterClass || undefined,
      textOverlay: text.trim()
        ? {
            text: text.trim(),
            style: textStyle,
            color: textColor,
            bgColor: textBg ? 'rgba(0,0,0,0.65)' : undefined,
          }
        : undefined,
      stickers: stickers.length > 0 ? stickers : undefined,
      location: location || undefined,
      mention: mention || undefined,
      question: question || undefined,
      drawingDataUrl: drawingDataUrl,
    };

    onShareStory(newStory);
    onClose();
  };

  const getTextStyleClass = () => {
    switch (textStyle) {
      case 'neon':
        return 'font-extrabold tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]';
      case 'classic':
        return 'font-serif italic font-semibold';
      case 'typewriter':
        return 'font-mono font-bold tracking-tight';
      default:
        return 'font-sans font-black tracking-normal';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-2xl h-[650px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Left Side: Live Phone Story Canvas Preview */}
        <div className="relative w-full md:w-80 bg-black flex items-center justify-center overflow-hidden shrink-0 select-none">
          {/* Background Media with Filter Style */}
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover transition-all ${
                FILTER_PRESETS.find((f) => f.id === selectedFilter)?.filterClass || ''
              }`}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Story canvas"
              className={`w-full h-full object-cover transition-all ${
                FILTER_PRESETS.find((f) => f.id === selectedFilter)?.filterClass || ''
              }`}
            />
          )}

          {/* Canvas Doodle Layer */}
          <canvas
            ref={canvasRef}
            width={320}
            height={650}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`absolute inset-0 z-15 touch-none ${isDrawingMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
          />

          {/* Music Badge Overlay at Top */}
          {selectedMusic && (
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 relative bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center">
                {selectedMusic.coverUrl ? (
                  <img src={selectedMusic.coverUrl} alt={selectedMusic.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-bold leading-tight truncate">{selectedMusic.title}</p>
                  {selectedMusic.language && (
                    <span className="text-[8px] font-bold px-1 py-0.2 rounded-full bg-pink-500/80 text-white shrink-0">
                      {selectedMusic.language}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-white/70 truncate">{selectedMusic.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white shrink-0"
              >
                {isPlayingMusic ? <Volume2 className="w-3.5 h-3.5 text-pink-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-300" />}
              </button>
            </div>
          )}

          {/* Location Sticker Tag */}
          {location && (
            <div
              style={{ top: `${location.yPercent}%`, left: `${location.xPercent}%` }}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              onClick={() => setLocation(null)}
              title="Click to remove location tag"
            >
              <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white font-extrabold text-xs shadow-xl flex items-center gap-1.5 border border-white/40 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                <span>{location.name}</span>
                <span className="text-[10px] text-slate-400 ml-1 group-hover:text-rose-500">✕</span>
              </div>
            </div>
          )}

          {/* Mention Tag */}
          {mention && (
            <div
              style={{ top: `${mention.yPercent}%`, left: `${mention.xPercent}%` }}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              onClick={() => setMention(null)}
              title="Click to remove mention"
            >
              <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white font-black text-xs shadow-xl flex items-center gap-1 border border-white/30">
                <AtSign className="w-3.5 h-3.5" />
                <span>{mention.username.replace(/^@/, '')}</span>
                <span className="text-[10px] text-white/70 ml-1 group-hover:text-white">✕</span>
              </div>
            </div>
          )}

          {/* Question Box Sticker */}
          {question && (
            <div
              style={{ top: `${question.yPercent}%`, left: `${question.xPercent}%` }}
              className="absolute z-20 w-48 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              onClick={() => setQuestion(null)}
              title="Click to remove question box"
            >
              <div className="p-3 rounded-2xl bg-white text-slate-900 shadow-2xl text-center border border-slate-200">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>Ask me a question</span>
                </div>
                <p className="text-xs font-extrabold text-slate-800 leading-snug">{question.question}</p>
                <div className="mt-2 py-1 px-3 bg-slate-100 rounded-xl text-[10px] text-slate-400 font-medium">
                  Type something...
                </div>
              </div>
            </div>
          )}

          {/* Text Overlay on Canvas */}
          {text.trim() && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 text-center pointer-events-none">
              <span
                style={{ color: textColor, backgroundColor: textBg ? 'rgba(0,0,0,0.65)' : 'transparent' }}
                className={`inline-block px-4 py-2 rounded-2xl text-base max-w-full break-words shadow-xl ${getTextStyleClass()}`}
              >
                {text}
              </span>
            </div>
          )}

          {/* Emoji Stickers on Canvas */}
          {stickers.map((st) => (
            <div
              key={st.id}
              style={{ top: `${st.yPercent}%`, left: `${st.xPercent}%` }}
              className="absolute z-20 text-3xl transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group hover:scale-125 transition-transform"
              onClick={() => handleRemoveSticker(st.id)}
              title="Click to remove sticker"
            >
              <span>{st.emoji}</span>
              <span className="absolute -top-2 -right-2 hidden group-hover:flex w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] items-center justify-center shadow-xs">
                ✕
              </span>
            </div>
          ))}

          {/* Synced Lyrics Sticker Overlay */}
          {selectedMusic && (
            <div className="absolute z-20 bottom-14 inset-x-4 p-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-pink-500/40 text-white text-center shadow-2xl animate-fade-in pointer-events-none">
              <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase font-bold text-pink-400 mb-1 tracking-wider">
                <Music className="w-3 h-3 text-pink-400 animate-spin" />
                <span>{selectedMusic.title} • Synced Lyrics Sticker</span>
              </div>
              <p className="text-xs font-black text-pink-200 my-0.5 drop-shadow-md">
                &quot;{selectedMusic.lyrics && selectedMusic.lyrics.length > 0
                  ? selectedMusic.lyrics[activeLyricIndex % selectedMusic.lyrics.length]
                  : `${selectedMusic.title} by ${selectedMusic.artist}`}&quot;
              </p>
              {selectedMusic.lyrics && selectedMusic.lyrics.length > 1 && (
                <p className="text-[10px] text-white/60 truncate">
                  {selectedMusic.lyrics[(activeLyricIndex + 1) % selectedMusic.lyrics.length]}
                </p>
              )}
            </div>
          )}

          {/* Top User Header info */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover border border-white" />
            <span className="text-xs font-bold text-white drop-shadow-md">{currentUser.name}</span>
          </div>

          <p className="absolute bottom-3 text-[10px] text-white/60 font-medium">Story Live Preview</p>
        </div>

        {/* Right Side: Creator Controls Studio */}
        <div className="flex-1 flex flex-col justify-between p-5 overflow-y-auto">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-base">Create Story</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 my-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setActiveTab('media');
                  setIsDrawingMode(false);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition-all ${
                  activeTab === 'media'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Media</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('filters');
                  setIsDrawingMode(false);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition-all ${
                  activeTab === 'filters'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('music');
                  setIsDrawingMode(false);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition-all ${
                  activeTab === 'music'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Music</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('text');
                  setIsDrawingMode(false);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition-all ${
                  activeTab === 'text'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Text</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('stickers');
                  setIsDrawingMode(false);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition-all ${
                  activeTab === 'stickers'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Stickers</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('draw');
                  setIsDrawingMode(true);
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition-all ${
                  activeTab === 'draw'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Doodle</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-pink-400/60 dark:border-pink-500/40 hover:bg-pink-50 dark:hover:bg-pink-950/30 text-pink-600 dark:text-pink-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo or Video from Device</span>
                </button>

                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Or Select Aesthetic Background</p>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_BACKGROUNDS.map((bg, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMediaUrl(bg);
                          setMediaType('image');
                        }}
                        className={`h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          mediaUrl === bg ? 'border-pink-500 scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={bg} alt="preset bg" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'music' && (
              <div className="space-y-3">
                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={musicSearchQuery}
                    onChange={(e) => setMusicSearchQuery(e.target.value)}
                    placeholder="Search Hindi, Punjabi or English song..."
                    className={`w-full py-2 pl-9 pr-8 text-xs rounded-xl border outline-hidden transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-pink-500'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-pink-500'
                    }`}
                  />
                  {musicSearchQuery && (
                    <button
                      onClick={() => setMusicSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Language Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'All', label: 'All 🔥' },
                    { id: 'Hindi', label: 'Hindi 🇮🇳' },
                    { id: 'Punjabi', label: 'Punjabi 🌾' },
                    { id: 'English', label: 'English 🎵' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedLanguageFilter(tab.id as any)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                        selectedLanguageFilter === tab.id
                          ? 'bg-pink-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Songs List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {/* Online Live Search Indicator */}
                  {isSearchingOnline && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-pink-500 font-bold">
                      <Disc className="w-4 h-4 animate-spin text-pink-500" />
                      <span>Searching live song database...</span>
                    </div>
                  )}

                  {/* Online Search Results */}
                  {onlineSearchResults.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-pink-500 px-1">
                        🌐 Live Online Songs ({onlineSearchResults.length})
                      </p>
                      {onlineSearchResults.map((m) => {
                        const isSelected = selectedMusic?.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMusic(m);
                              setIsPlayingMusic(true);
                            }}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-pink-50 dark:bg-pink-950/40 border-pink-500 text-pink-600 dark:text-pink-300 shadow-md'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={m.coverUrl} alt={m.title} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold truncate">{m.title}</p>
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 shrink-0">
                                    LIVE 🎶
                                  </span>
                                </div>
                                <p className="text-[10px] opacity-70 truncate">{m.artist}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMusic(m);
                                setIsPlayingMusic(!isPlayingMusic || selectedMusic?.id !== m.id);
                              }}
                              className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 shrink-0 ml-2 shadow-xs"
                            >
                              {isPlayingMusic && isSelected ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Preset Songs List Header if searching */}
                  {onlineSearchResults.length > 0 && (
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-1 pt-1">
                      🔥 Featured Songs
                    </p>
                  )}

                  {filteredMusic.map((m) => {
                    const isSelected = selectedMusic?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMusic(isSelected ? null : m)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-pink-50 dark:bg-pink-950/40 border-pink-500 text-pink-600 dark:text-pink-300 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={m.coverUrl} alt={m.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold truncate">{m.title}</p>
                              {m.language && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                  {m.language}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] opacity-70 truncate">{m.artist}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMusic(m);
                            setIsPlayingMusic(!isPlayingMusic || selectedMusic?.id !== m.id);
                          }}
                          className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 shrink-0 ml-2"
                        >
                          {isPlayingMusic && isSelected ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}

                  {/* Search Query Custom Song Option */}
                  {musicSearchQuery.trim() && onlineSearchResults.length === 0 && !isSearchingOnline && (
                    <button
                      onClick={handleAddCustomSearchSong}
                      className="w-full p-2.5 rounded-2xl border-2 border-dashed border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs flex items-center justify-between transition-colors mt-2"
                    >
                      <span className="truncate pr-2">
                        ✨ Select &quot;{musicSearchQuery}&quot; as custom music track
                      </span>
                      <Disc className="w-4 h-4 shrink-0 animate-spin" />
                    </button>
                  )}

                  {filteredMusic.length === 0 && onlineSearchResults.length === 0 && !musicSearchQuery.trim() && (
                    <p className="text-xs text-center text-slate-400 py-4 italic">No songs found in this category.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    Story Text
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type something memorable..."
                    className={`w-full py-2.5 px-3.5 text-sm rounded-xl border outline-hidden transition-all ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Font Styles */}
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Font Style</p>
                  <div className="flex items-center gap-2">
                    {(['modern', 'neon', 'classic', 'typewriter'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setTextStyle(s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border capitalize transition-all ${
                          textStyle === s
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color & Background Pill */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {['#ffffff', '#000000', '#f43f5e', '#eab308', '#06b6d4', '#84cc16'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setTextColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 ${
                          textColor === c ? 'ring-2 ring-pink-500 scale-110' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setTextBg(!textBg)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                      textBg ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Highlight Box {textBg ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Story Aesthetic Filter</p>
                <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {FILTER_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`p-2 rounded-2xl border text-center transition-all ${
                        selectedFilter === f.id
                          ? 'bg-pink-500 text-white border-pink-500 shadow-md font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-pink-300'
                      }`}
                    >
                      <div className="w-full h-12 rounded-xl mb-1.5 overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-300/40">
                        <img src={mediaUrl} alt={f.name} className={`w-full h-full object-cover ${f.filterClass}`} />
                      </div>
                      <span className="text-[11px] block truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stickers' && (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {/* Location Sticker Widget */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold">Add Location Tag</span>
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="e.g. Mumbai, Goa Beach..."
                      className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-hidden ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200'
                      }`}
                    />
                    <button
                      onClick={() => handleAddLocation(locationInput)}
                      className="px-3 py-1.5 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {LOCATION_PRESETS.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleAddLocation(loc.replace('📍 ', ''))}
                        className="px-2 py-1 bg-white dark:bg-slate-700 text-[10px] font-bold rounded-lg shrink-0 border border-slate-200 dark:border-slate-600 hover:text-pink-500"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mention Sticker Widget */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AtSign className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold">Tag Friend (@Mention)</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={mentionInput}
                      onChange={(e) => setMentionInput(e.target.value)}
                      placeholder="e.g. rahul_vibe, simran_99"
                      className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-hidden ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200'
                      }`}
                    />
                    <button
                      onClick={() => handleAddMention(mentionInput)}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
                    >
                      Tag
                    </button>
                  </div>
                </div>

                {/* Question Box Sticker Widget */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold">Interactive Question Box</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Ask me anything / Which song next?"
                      className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-hidden ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200'
                      }`}
                    />
                    <button
                      onClick={() => handleAddQuestion(questionInput)}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600"
                    >
                      Add Box
                    </button>
                  </div>
                </div>

                {/* Emojis Grid */}
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tap to Add Emojis / Stickers</p>
                  <div className="grid grid-cols-6 gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    {EMOJI_STICKERS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddSticker(emoji)}
                        className="text-2xl hover:scale-130 transition-transform p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'draw' && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Doodle on your Story Canvas</p>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1.5">Pen Color</p>
                  <div className="flex items-center gap-2">
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 transition-all ${
                          penColor === c ? 'ring-2 ring-pink-500 scale-125' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1.5">Pen Size ({penSize}px)</p>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={penSize}
                    onChange={(e) => setPenSize(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCanvas}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Drawings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              className="flex-1 py-2.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Share to Your Story</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

