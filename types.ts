export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  url: string;
  isLocal?: boolean;
  size?: number; // bytes
}

export enum PlayMode {
  SEQUENCE = 'sequence',
  SHUFFLE = 'shuffle',
  REPEAT_ONE = 'repeat_one',
}

export enum VisualizerStyle {
  BARS = 'bars',
  WAVE = 'wave',
  CIRCLE = 'circle',
}

export interface ThemeColors {
  primary: string;   // RGB values: "0 243 255"
  secondary: string; // RGB values: "255 0 255"
  yellow: string;    // RGB values: "252 238 10"
}

export interface BackgroundTheme {
  id: string;
  url: string;
  name: string;
  colors: ThemeColors;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  gains: number[]; // Array of 10 numbers (-12 to 12)
}