import { Song, BackgroundTheme, EqualizerPreset } from './types';

export const SONGS: Song[] = [];

export const BACKGROUNDS: BackgroundTheme[] = [
  {
    id: 'bg1',
    name: 'Cyber City',
    url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop',
    colors: {
      primary: '0 243 255',   // Cyan
      secondary: '255 0 255', // Pink
      yellow: '252 238 10',   // Yellow
    }
  },
  {
    id: 'bg2',
    name: 'The Matrix',
    url: 'https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=2098&auto=format&fit=crop',
    colors: {
      primary: '0 255 70',    // Matrix Green
      secondary: '0 140 0',   // Darker Green
      yellow: '200 255 200',  // Pale Green
    }
  },
  {
    id: 'bg3',
    name: 'Crimson Sunset',
    url: 'https://images.unsplash.com/photo-1534234828569-189f977c3e51?q=80&w=2070&auto=format&fit=crop',
    colors: {
      primary: '255 100 0',   // Orange
      secondary: '147 51 234',// Purple
      yellow: '255 200 0',    // Gold
    }
  },
  {
    id: 'bg4',
    name: 'Deep Ocean',
    url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop',
    colors: {
      primary: '56 189 248',  // Sky Blue
      secondary: '59 130 246',// Royal Blue
      yellow: '14 165 233',   // Ocean Blue
    }
  },
  {
    id: 'bg5',
    name: 'Golden Age',
    url: 'https://images.unsplash.com/photo-1506318137071-a8bcbf6d943d?q=80&w=2000&auto=format&fit=crop',
    colors: {
      primary: '255 215 0',   // Gold
      secondary: '218 165 32',// Goldenrod
      yellow: '255 250 205',  // Lemon Chiffon
    }
  },
  {
    id: 'bg6',
    name: 'Bio Hazard',
    url: 'https://images.unsplash.com/photo-1598194727197-09d17d5c7f82?q=80&w=2000&auto=format&fit=crop',
    colors: {
      primary: '57 255 20',   // Neon Green
      secondary: '220 255 0', // Acid Yellow
      yellow: '154 205 50',   // Yellow Green
    }
  },
  {
    id: 'bg7',
    name: 'Neon Nebula',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop',
    colors: {
      primary: '168 85 247',  // Purple
      secondary: '236 72 153',// Pink
      yellow: '34 211 238',   // Cyan
    }
  },
  {
    id: 'bg8',
    name: 'Ice Glitch',
    url: 'https://images.unsplash.com/photo-1483401757887-2de4fc543b55?q=80&w=2000&auto=format&fit=crop',
    colors: {
      primary: '200 230 255', // Ice White
      secondary: '100 116 139',// Slate Grey
      yellow: '255 50 50',    // Red Alert (Contrast)
    }
  },
];

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: EqualizerPreset[] = [
  { id: 'flat', name: 'FLAT', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'cyber', name: 'CYBER', gains: [4, 3, 2, 0, -1, -1, 0, 2, 4, 5] },
  { id: 'bass', name: 'BASS++', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { id: 'vocal', name: 'VOCAL', gains: [-2, -2, -1, 1, 4, 4, 2, 1, 0, -1] },
];