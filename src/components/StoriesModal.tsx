import React, { useState, useEffect } from 'react';
import { X, Heart, Send, ChevronLeft, ChevronRight, Music, MapPin, AtSign, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Contact, UserStory } from '../types';
import { storyAudioPlayer } from '../utils/storyAudio';

interface StoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  storiesList?: UserStory[];
  onReplyStory: (storyText: string) => void;
  isDarkMode: boolean;
}

const DEFAULT_MOCK_STORIES: UserStory[] = [
  {
    id: 'story-1',
    contactId: 'c1',
    contactName: 'Tom',
    contactAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    mediaType: 'image',
    timestamp: '2h ago',
    caption: 'Sunset vibes by the beach! 🌊☀️',
    musicTrack: {
      id: 'm3',
      title: 'Summer Breeze',
      artist: 'Acoustic Sunset',
    },
    stickers: [{ id: 'st1', emoji: '☀️', xPercent: 50, yPercent: 30 }],
  },
  {
    id: 'story-2',
    contactId: 'c1',
    contactName: 'Tom',
    contactAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    mediaType: 'image',
    timestamp: '5h ago',
    caption: 'Great dinner catching up with friends 🍕☕',
  },
];

export const StoriesModal: React.FC<StoriesModalProps> = ({
  isOpen,
  onClose,
  contact,
  storiesList,
  onReplyStory,
  isDarkMode,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);

  const activeStories = storiesList && storiesList.length > 0 ? storiesList : DEFAULT_MOCK_STORIES;
  const currentStory = activeStories[currentIndex] || activeStories[0];

  // Play story music when active
  useEffect(() => {
    if (!isOpen) {
      storyAudioPlayer.stop();
      return;
    }

    if (currentStory?.musicTrack && !isMuted) {
      storyAudioPlayer.playTrack(
        currentStory.musicTrack.id,
        currentStory.musicTrack.language,
        currentStory.musicTrack.audioUrl
      );
    } else {
      storyAudioPlayer.stop();
    }

    return () => {
      storyAudioPlayer.stop();
    };
  }, [isOpen, currentStory, isMuted]);

  // Lyric cycle interval
  useEffect(() => {
    if (!isOpen) return;
    const lyricInterval = setInterval(() => {
      setActiveLyricIndex((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(lyricInterval);
  }, [isOpen, currentIndex]);

  // 30-Second Story Timer (30000ms total, updating every 100ms)
  useEffect(() => {
    if (!isOpen) return;
    setProgress(0);

    const stepIncrement = (100 / 30000) * 100; // ~0.333% per 100ms

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < activeStories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            clearInterval(interval);
            storyAudioPlayer.stop();
            onClose();
            return 100;
          }
        }
        return Math.min(100, prev + stepIncrement);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, activeStories.length, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReplyStory(`Replied to story: "${replyText.trim()}"`);
    setReplyText('');
    onClose();
  };

  const handleSendHeart = () => {
    onReplyStory('Loved your story ❤️');
    onClose();
  };

  const getTextStyleClass = (style?: string) => {
    switch (style) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm h-[600px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col bg-black text-white">
        
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 p-3 z-30 flex items-center gap-1.5 bg-gradient-to-b from-black/80 to-transparent">
          {activeStories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header Contact info & Music Tag */}
        <div className="absolute top-6 inset-x-0 p-3 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.contactAvatar || contact.avatar}
              alt={currentStory.contactName || contact.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-pink-500"
            />
            <div>
              <p className="text-xs font-bold text-white leading-tight">{currentStory.contactName || contact.nickname || contact.name}</p>
              <p className="text-[10px] text-white/70">{currentStory.timestamp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentStory.musicTrack && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70"
                title={isMuted ? 'Unmute Story Sound' : 'Mute Story Sound'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-pink-400" />}
              </button>
            )}
            <button
              onClick={() => {
                storyAudioPlayer.stop();
                onClose();
              }}
              className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Music Tag Overlay below Header */}
        {currentStory.musicTrack && (
          <div className="absolute top-16 left-3 right-3 z-30 flex items-center justify-between p-1.5 px-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="w-3.5 h-3.5 text-pink-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-tight truncate">
                  {currentStory.musicTrack.title} • <span className="text-white/70 font-normal">{currentStory.musicTrack.artist}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[9px] font-bold text-pink-300 bg-pink-500/20 px-1.5 py-0.5 rounded-full border border-pink-500/30">
                {Math.floor((progress / 100) * 30)}s / 30s
              </span>
              {currentStory.musicTrack.language && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500 text-white">
                  {currentStory.musicTrack.language}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Story Media Canvas */}
        <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden select-none">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover ${currentStory.filterStyle || ''}`}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt={currentStory.caption || 'Story'}
              className={`w-full h-full object-cover ${currentStory.filterStyle || ''}`}
            />
          )}

          {/* Canvas Doodle Overlay */}
          {currentStory.drawingDataUrl && (
            <img src={currentStory.drawingDataUrl} alt="Doodle drawing" className="absolute inset-0 w-full h-full object-cover z-15 pointer-events-none" />
          )}

          {/* Location Sticker Tag */}
          {currentStory.location && (
            <div
              style={{ top: `${currentStory.location.yPercent}%`, left: `${currentStory.location.xPercent}%` }}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 text-slate-900 font-extrabold text-xs shadow-xl flex items-center gap-1.5 border border-white/40 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                <span>{currentStory.location.name}</span>
              </div>
            </div>
          )}

          {/* Mention Tag */}
          {currentStory.mention && (
            <div
              style={{ top: `${currentStory.mention.yPercent}%`, left: `${currentStory.mention.xPercent}%` }}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white font-black text-xs shadow-xl flex items-center gap-1 border border-white/30">
                <AtSign className="w-3.5 h-3.5" />
                <span>{currentStory.mention.username.replace(/^@/, '')}</span>
              </div>
            </div>
          )}

          {/* Question Box Sticker */}
          {currentStory.question && (
            <div
              style={{ top: `${currentStory.question.yPercent}%`, left: `${currentStory.question.xPercent}%` }}
              className="absolute z-20 w-48 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="p-3 rounded-2xl bg-white text-slate-900 shadow-2xl text-center border border-slate-200">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>Ask me a question</span>
                </div>
                <p className="text-xs font-extrabold text-slate-800 leading-snug">{currentStory.question.question}</p>
                <div className="mt-2 py-1 px-3 bg-slate-100 rounded-xl text-[10px] text-slate-400 font-medium">
                  Type something...
                </div>
              </div>
            </div>
          )}

          {/* Text Overlay */}
          {currentStory.textOverlay && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 text-center">
              <span
                style={{
                  color: currentStory.textOverlay.color,
                  backgroundColor: currentStory.textOverlay.bgColor || 'transparent',
                }}
                className={`inline-block px-4 py-2 rounded-2xl text-base max-w-full break-words shadow-xl ${getTextStyleClass(
                  currentStory.textOverlay.style
                )}`}
              >
                {currentStory.textOverlay.text}
              </span>
            </div>
          )}

          {/* Stickers */}
          {currentStory.stickers?.map((st) => (
            <div
              key={st.id}
              style={{ top: `${st.yPercent}%`, left: `${st.xPercent}%` }}
              className="absolute z-20 text-3xl transform -translate-x-1/2 -translate-y-1/2"
            >
              <span>{st.emoji}</span>
            </div>
          ))}

          {/* Synced Lyrics Sticker Overlay */}
          {currentStory.musicTrack && (
            <div className="absolute z-25 bottom-16 inset-x-4 p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-pink-500/40 text-white text-center shadow-2xl animate-fade-in pointer-events-none">
              <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase font-bold text-pink-400 mb-1 tracking-wider">
                <Music className="w-3 h-3 text-pink-400 animate-spin" />
                <span>{currentStory.musicTrack.title} • Live Lyrics</span>
              </div>
              <p className="text-sm font-black text-pink-200 my-0.5 drop-shadow-md">
                &quot;{currentStory.musicTrack.lyrics && currentStory.musicTrack.lyrics.length > 0
                  ? currentStory.musicTrack.lyrics[activeLyricIndex % currentStory.musicTrack.lyrics.length]
                  : `${currentStory.musicTrack.title} by ${currentStory.musicTrack.artist}`}&quot;
              </p>
              {currentStory.musicTrack.lyrics && currentStory.musicTrack.lyrics.length > 1 && (
                <p className="text-[10px] text-white/60 truncate">
                  {currentStory.musicTrack.lyrics[(activeLyricIndex + 1) % currentStory.musicTrack.lyrics.length]}
                </p>
              )}
            </div>
          )}

          {/* Navigation Tap Zones */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-20 bottom-20 w-1/3 z-20 flex items-center justify-start p-2 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 text-white drop-shadow-md" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-20 bottom-20 w-1/3 z-20 flex items-center justify-end p-2 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-white drop-shadow-md" />
          </button>

          {/* Caption Overlay */}
          {currentStory.caption && (
            <div className="absolute bottom-16 inset-x-0 p-4 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
              <p className="text-xs font-medium text-white drop-shadow-sm">{currentStory.caption}</p>
            </div>
          )}
        </div>

        {/* Bottom Story Reply Bar */}
        <form
          onSubmit={handleSendReply}
          className="p-3 bg-black/90 border-t border-white/10 flex items-center gap-2 z-30"
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${currentStory.contactName || contact.name}...`}
            className="flex-1 py-2 px-4 text-xs rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-hidden focus:border-pink-500"
          />
          <button
            type="button"
            onClick={handleSendHeart}
            className="p-2 text-pink-500 hover:scale-110 transition-transform"
            title="Love Story"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
          {replyText.trim() && (
            <button
              type="submit"
              className="p-2 text-blue-400 hover:text-blue-300 font-bold text-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

      </div>
    </div>
  );
};

