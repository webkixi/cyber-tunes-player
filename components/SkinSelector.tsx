import React from 'react';
import { X, Check } from 'lucide-react';
import { BACKGROUNDS } from '../constants';
import { BackgroundTheme } from '../types';

interface SkinSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  currentIndex: number;
}

export const SkinSelector: React.FC<SkinSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIndex,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-cyber-dark/90 border border-cyber-cyan/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80vh] animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <h2 className="text-cyber-cyan font-mono text-lg font-bold tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-cyber-pink rounded-full animate-pulse"></span>
            SKIN_GALLERY
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {BACKGROUNDS.map((theme: BackgroundTheme, index: number) => {
              const isActive = currentIndex === index;
              // Generate dynamic gradient based on theme colors
              const gradientStyle = {
                background: `linear-gradient(135deg, rgb(${theme.colors.primary}) 0%, rgb(${theme.colors.secondary}) 100%)`,
              };

              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelect(index);
                    // Optional: Close on select or keep open? Let's keep open for browsing.
                  }}
                  className={`
                    group relative rounded-lg overflow-hidden transition-all duration-300
                    border-2 h-24 flex flex-col items-center justify-center
                    ${isActive 
                      ? 'border-white scale-[1.02] shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                      : 'border-transparent hover:border-white/30 hover:scale-[1.02]'
                    }
                  `}
                >
                  {/* Background Preview */}
                  <div 
                    className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
                    style={{
                      backgroundImage: `url(${theme.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  
                  {/* Color Overlay */}
                  <div className="absolute inset-0 opacity-80 mix-blend-multiply bg-black" />
                  
                  {/* Theme Gradient Strip */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-80"
                    style={gradientStyle}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                     <span className={`font-mono text-xs font-bold tracking-wide ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {theme.name.toUpperCase()}
                     </span>
                     {isActive && <Check size={16} className="text-cyber-cyan drop-shadow-[0_0_5px_rgba(0,243,255,1)]" />}
                  </div>
                  
                  {/* Active Indicator Border Glow (Simulated via box-shadow on parent, but also internal highlight) */}
                  {isActive && (
                     <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center">
            <span className="text-[10px] text-gray-500 font-mono">
                SELECT TO APPLY • AUTO SAVED
            </span>
        </div>
      </div>
    </div>
  );
};