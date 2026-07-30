export type DisappearingTimerOption = 'off' | '1m' | '24h' | '7d';

export interface ReplyToPayload {
  id: string;
  senderName: string;
  text: string;
  isMe: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface PollPayload {
  question: string;
  options: PollOption[];
  totalVotes: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  language?: 'Hindi' | 'Punjabi' | 'English' | string;
  album?: string;
  audioUrl?: string;
  lyrics?: string[];
}

export interface StorySticker {
  id: string;
  emoji: string;
  xPercent: number;
  yPercent: number;
}

export interface StoryLocation {
  name: string;
  xPercent: number;
  yPercent: number;
}

export interface StoryMention {
  username: string;
  xPercent: number;
  yPercent: number;
}

export interface StoryQuestion {
  question: string;
  responseCount?: number;
  xPercent: number;
  yPercent: number;
}

export interface UserStory {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: string;
  caption?: string;
  hasSeen?: boolean;
  musicTrack?: MusicTrack;
  filterStyle?: string;
  textOverlay?: {
    text: string;
    style: 'modern' | 'neon' | 'classic' | 'typewriter';
    color: string;
    bgColor?: string;
  };
  stickers?: StorySticker[];
  location?: StoryLocation;
  mention?: StoryMention;
  question?: StoryQuestion;
  drawingDataUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
  imageUrl?: string;
  gifUrl?: string;
  audioUrl?: string;
  audioDuration?: number; // duration in seconds
  reactions?: string[];
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  replyTo?: ReplyToPayload;
  isPinned?: boolean;
  expiresAt?: number; // Unix timestamp for disappearing messages
  disappearingTimer?: '1m' | '24h' | '7d';
  poll?: PollPayload;
}

export interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  bio?: string;
  nickname?: string;
  hasActiveStory?: boolean;
}

export interface ChatThread {
  id: string;
  contact: Contact;
  messages: Message[];
  unreadCount: number;
  isPinned?: boolean;
  pinnedMessageIds?: string[];
  disappearingTimer?: DisappearingTimerOption;
  customThemeId?: ChatTheme;
  customWallpaper?: WallpaperConfig;
}

export type ChatTheme = 'instagram' | 'blue' | 'sunset' | 'emerald' | 'cyber' | 'lavender' | 'neon' | 'peach';

export interface ChatThemeConfig {
  id: ChatTheme;
  name: string;
  gradientClass: string;
  bubbleClass: string;
  accentClass: string;
  glowClass: string;
}

export interface WallpaperConfig {
  type: 'none' | 'custom' | 'preset';
  url?: string;
  presetId?: string;
  blur?: number;
  opacity?: number;
}

