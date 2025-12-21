import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface BackgroundSwitcherProps {
  onSwitch: () => void;
  currentBgIndex: number;
  isHidden?: boolean;
}

export const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({ onSwitch, currentBgIndex, isHidden = false }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSwitch();
      }}
      className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-black/80 border border-cyber-pink text-cyber-pink shadow-[0_0_15px_rgba(255,0,255,0.5)] backdrop-blur hover:bg-cyber-pink hover:text-black hover:shadow-[0_0_25px_rgba(255,0,255,0.8)] transition-all duration-700 ease-in-out group ${isHidden ? 'translate-x-[200%]' : 'translate-x-0'}`}
      aria-label="Switch Background"
    >
      <ImageIcon size={24} className="group-hover:scale-110 transition-transform" />
      <span className="absolute -top-8 right-0 bg-black/80 text-cyber-pink text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-cyber-pink/50">
        THEME_{currentBgIndex + 1}
      </span>
    </button>
  );
};