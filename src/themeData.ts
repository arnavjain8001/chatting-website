import { ChatThemeConfig, WallpaperConfig } from './types';

export const THEME_PRESETS: ChatThemeConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram Gradient',
    gradientClass: 'from-purple-600 via-pink-600 to-amber-500',
    bubbleClass: 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white',
    accentClass: 'text-pink-500',
    glowClass: 'shadow-pink-500/20',
  },
  {
    id: 'blue',
    name: 'Classic Blue',
    gradientClass: 'from-blue-600 to-indigo-600',
    bubbleClass: 'bg-blue-600 text-white',
    accentClass: 'text-blue-600',
    glowClass: 'shadow-blue-500/20',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    gradientClass: 'from-amber-500 via-rose-500 to-purple-600',
    bubbleClass: 'bg-gradient-to-r from-amber-500 to-rose-600 text-white',
    accentClass: 'text-rose-500',
    glowClass: 'shadow-rose-500/20',
  },
  {
    id: 'emerald',
    name: 'Emerald Fresh',
    gradientClass: 'from-emerald-500 to-teal-700',
    bubbleClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    accentClass: 'text-emerald-500',
    glowClass: 'shadow-emerald-500/20',
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    gradientClass: 'from-cyan-500 to-blue-600',
    bubbleClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
    accentClass: 'text-cyan-500',
    glowClass: 'shadow-cyan-500/20',
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    gradientClass: 'from-indigo-400 to-purple-500',
    bubbleClass: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
    accentClass: 'text-purple-500',
    glowClass: 'shadow-purple-500/20',
  },
];

export const WALLPAPER_PRESETS = [
  {
    id: 'doodle',
    name: 'WhatsApp Doodle Pattern',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'nature',
    name: 'Mountain Sunrise',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'pastel',
    name: 'Pastel Gradient',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'dark-mesh',
    name: 'Dark Geometric Mesh',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
  },
];
