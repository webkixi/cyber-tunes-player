import React from 'react';
import { Song } from '../types';
import { Play, Plus, Trash2, Palette, Settings, Music } from 'lucide-react';

interface MusicListProps {
  songs: Song[];
  currentSongId: string;
  onSelectSong: (song: Song) => void;
  isPlaying: boolean;
  onAdd: () => void;
  onDelete: () => void;
  onSkinMenu?: () => void;
  onSettings?: () => void;
  usedSpace: number;
  totalSpace: number;
  notification: string | null; // New prop for the toast message
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    return (mb / 1024).toFixed(1) + 'GB';
  }
  return mb.toFixed(0) + 'MB';
};

export const MusicList: React.FC<MusicListProps> = ({
  songs,
  currentSongId,
  onSelectSong,
  isPlaying,
  onAdd,
  onDelete,
  onSkinMenu,
  onSettings,
  usedSpace,
  totalSpace,
  notification
}) => {
  
  const IconButton = ({ icon, onClick, color = "text-gray-400" }: { icon: React.ReactNode, onClick?: () => void, color?: string }) => (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${color} relative z-20`}
    >
      {icon}
    </button>
  );

  const percentage = Math.min(100, (usedSpace / totalSpace) * 100);
  const isCritical = percentage > 90;
  
  // Dynamic color for the background bar - EVEN DARKER VERSION (950 shade)
  const barColor = isCritical 
    ? 'bg-red-950/80 shadow-[0_0_15px_rgba(69,10,10,0.3)_inset]' 
    : 'bg-cyan-950/80 shadow-[0_0_15px_rgba(8,51,68,0.3)_inset]';
    
  const barBorder = isCritical ? 'border-r-red-900/50' : 'border-r-cyan-900/50';

  return (
    <div className="h-[40vh] w-full bg-cyber-dark/80 backdrop-blur-md border border-cyber-cyan/30 rounded-lg flex flex-col relative shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan pointer-events-none z-20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan pointer-events-none z-20"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyber-cyan pointer-events-none z-20"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan pointer-events-none z-20"></div>

      {/* Scrollable List Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 relative z-10 custom-scrollbar">
        {songs.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
              <Music size={40} className="mb-2 text-cyber-cyan/50" />
              <span className="text-xs font-mono tracking-widest">NO_MEDIA_DETECTED</span>
              <span className="text-[10px] font-mono mt-1 text-cyber-pink/70">Tap '+' to import</span>
           </div>
        ) : (
            songs.map((song) => {
              const isActive = song.id === currentSongId;
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className={`
                    group flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-300
                    border-l-2
                    ${
                      isActive
                        ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                        : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${isActive ? 'bg-cyber-cyan animate-pulse' : 'bg-gray-600'}`}></div>
                    <span className={`font-mono text-sm font-bold truncate ${isActive ? 'text-cyber-cyan' : 'text-gray-200'}`}>
                      {song.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && isPlaying && <Play size={10} className="animate-pulse text-cyber-pink" fill="currentColor" />}
                    <span className="font-mono text-xs">{formatTime(song.duration)}</span>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Bottom Function Area - Acts as Progress Bar Container */}
      <div className="h-10 shrink-0 relative bg-black/60 backdrop-blur border-t border-cyber-cyan/20 overflow-hidden group/footer">
        
        {/* The Progress Bar Background Layer */}
        <div 
            className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out border-r ${barColor} ${barBorder}`}
            style={{ width: `${percentage}%` }}
        >
            {/* Subtle striped texture for the progress bar */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.5)_25%,rgba(0,0,0,0.5)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.5)_75%,rgba(0,0,0,0.5)_100%)] bg-[length:10px_10px]"></div>
        </div>

        {/* Info Text Layer (Centered, Very Subtle) - Visible when no notification */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-200 ${notification ? 'opacity-0' : 'opacity-100'}`}>
            <span className={`text-[9px] font-mono tracking-[0.2em] font-bold opacity-30 transition-colors duration-300 ${isCritical ? 'text-red-400' : 'text-cyber-cyan'}`}>
                {formatSize(usedSpace)} / {formatSize(totalSpace)}
            </span>
        </div>

        {/* Notification Toast Overlay - Visible when triggered */}
        <div 
            className={`absolute inset-0 flex items-center justify-center z-50 bg-black/90 backdrop-blur-sm transition-all duration-300 ${notification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            <div className="flex items-center gap-2 px-3 py-1 border border-cyber-cyan/50 rounded bg-cyber-cyan/10 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <div className="w-1.5 h-1.5 bg-cyber-pink rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold text-cyber-cyan tracking-wider">
                    {notification}
                </span>
            </div>
        </div>

        {/* Buttons Layer (On Top) - Hidden visually when notification acts as toast covering them, but keeping structure */}
        <div className={`relative z-20 flex items-center justify-around h-full px-4 transition-opacity duration-200 ${notification ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <IconButton icon={<Plus size={16} />} onClick={onAdd} color="text-cyber-cyan hover:text-white" />
          <IconButton icon={<Trash2 size={16} />} onClick={onDelete} color="text-cyber-pink hover:text-white" />
          <IconButton icon={<Palette size={16} />} onClick={onSkinMenu} color="text-cyber-yellow hover:text-white" />
          <IconButton icon={<Settings size={16} />} onClick={onSettings} color="text-gray-400 hover:text-cyber-cyan" />
        </div>
      </div>
    </div>
  );
};