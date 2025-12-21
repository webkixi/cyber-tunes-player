import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, ListOrdered, Sliders } from 'lucide-react';
import { PlayMode, Song } from '../types';

interface PlayerPanelProps {
  currentSong: Song | null;
  isPlaying: boolean;
  playMode: PlayMode;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleMode: () => void;
  onSeek: (time: number) => void;
  // Visualizer props
  isVisualizerActive: boolean;
  onToggleVisualizer: () => void;
  // EQ Props
  onOpenEq: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  currentSong,
  isPlaying,
  playMode,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrev,
  onToggleMode,
  onSeek,
  isVisualizerActive,
  onToggleVisualizer,
  onOpenEq,
}) => {
  
  const getModeIcon = () => {
    switch (playMode) {
      case PlayMode.SHUFFLE:
        return <Shuffle size={16} className="text-cyber-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]" />;
      case PlayMode.REPEAT_ONE:
        return <Repeat size={16} className="text-cyber-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]" />;
      case PlayMode.SEQUENCE:
      default:
        return <ListOrdered size={16} className="text-cyber-cyan drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" />;
    }
  };

  const getModeLabel = () => {
    switch (playMode) {
      case PlayMode.SHUFFLE: return "SHUFFLE";
      case PlayMode.REPEAT_ONE: return "LOOP_1";
      default: return "ORDERED";
    }
  };

  return (
    <div className="w-full bg-cyber-dark/90 backdrop-blur-xl border border-cyber-pink/30 rounded-xl p-4 relative shadow-2xl shadow-black/50">
      {/* Cyberpunk accents */}
      <div className="absolute -top-1 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-cyber-pink to-transparent"></div>
      <div className="absolute top-0 left-0 w-2 h-2 bg-cyber-pink rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-2 h-2 bg-cyber-pink rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyber-cyan rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyber-cyan rounded-br-lg"></div>

      {/* Progress Bar */}
      <div className="mb-4 group mt-1">
        <div className="flex justify-between text-[10px] font-mono text-cyber-cyan mb-1.5">
          <span>{formatTime(currentTime)}</span>
          <span className="opacity-50">/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative h-3 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute z-20 w-full opacity-0 cursor-pointer h-full"
          />
          {/* Custom Track */}
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden relative z-10">
            <div 
              className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-pink transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,0,255,0.8)]"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            ></div>
          </div>
           {/* Thumb visual fake */}
           <div 
              className="absolute h-2.5 w-2.5 bg-white rounded-full shadow-[0_0_10px_#fff] pointer-events-none z-10 transition-all duration-100 ease-linear"
              style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 5px)` }}
           ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-1">
        
        {/* Play Mode Toggle */}
        <button 
          onClick={onToggleMode}
          className="p-1.5 hover:bg-white/5 rounded-full transition-colors flex flex-col items-center gap-0.5 group"
          title="Toggle Mode"
        >
          {getModeIcon()}
          <span className="text-[7px] font-mono text-gray-500 group-hover:text-white transition-colors">
            {getModeLabel()}
          </span>
        </button>

        {/* Main Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onPrev}
            className="p-2 hover:text-cyber-cyan transition-all hover:scale-110 active:scale-95"
          >
            <SkipBack size={20} />
          </button>

          <button 
            onClick={onPlayPause}
            className="relative p-3 rounded-full bg-gradient-to-br from-cyber-cyan to-blue-600 text-black shadow-[0_0_15px_rgba(0,243,255,0.6)] hover:shadow-[0_0_25px_rgba(0,243,255,0.8)] transition-all hover:scale-105 active:scale-95 group"
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" className="relative z-10" />
            ) : (
              <Play size={24} fill="currentColor" className="relative z-10 ml-0.5" />
            )}
             <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>

          <button 
            onClick={onNext}
            className="p-2 hover:text-cyber-cyan transition-all hover:scale-110 active:scale-95"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Right Action Group: Visualizer & EQ */}
        <div className="flex items-center gap-2">
            {/* EQ Button */}
            <button 
                onClick={onOpenEq}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-all active:scale-95 text-gray-400 hover:text-cyber-yellow"
                title="Equalizer"
            >
                <Sliders size={18} />
            </button>

            {/* Visualizer Toggle (Interactive) */}
            <button 
            onClick={onToggleVisualizer}
            className={`w-8 flex flex-col items-center justify-end h-8 p-1 rounded hover:bg-white/5 transition-all active:scale-95 ${isVisualizerActive ? 'shadow-[0_0_10px_rgba(0,243,255,0.3)_inset] bg-cyber-cyan/10' : ''}`}
            title="Toggle Visualizer"
            >
                <div className={`w-0.5 bg-cyber-pink mb-[2px] rounded-full transition-all duration-300 ${isPlaying && isVisualizerActive ? 'animate-[pulse_0.5s_infinite] h-3' : 'h-1'}`}></div>
                <div className={`w-0.5 bg-cyber-cyan mb-[2px] rounded-full transition-all duration-300 delay-75 ${isPlaying && isVisualizerActive ? 'animate-[pulse_0.6s_infinite] h-4' : 'h-1.5'}`}></div>
                <div className={`w-0.5 bg-cyber-pink rounded-full transition-all duration-300 delay-150 ${isPlaying && isVisualizerActive ? 'animate-[pulse_0.4s_infinite] h-2' : 'h-1'}`}></div>
            </button>
        </div>
      </div>
    </div>
  );
};