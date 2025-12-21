import React from 'react';
import { X, Power, RefreshCw } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../constants';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: number[];
  setGains: (newGains: number[]) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  gains,
  setGains,
  isEnabled,
  setEnabled,
}) => {
  if (!isOpen) return null;

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
  };

  const applyPreset = (presetGains: number[]) => {
    setGains([...presetGains]);
  };

  const formatFreq = (hz: number) => {
    if (hz >= 1000) return `${hz / 1000}k`;
    return `${hz}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-cyber-dark/95 border border-cyber-cyan/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <h2 className="text-cyber-cyan font-mono text-lg font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-cyber-pink rounded-full animate-pulse"></span>
              AUDIO_EQ
            </h2>
            {/* Power Toggle */}
            <button
              onClick={() => setEnabled(!isEnabled)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold tracking-widest transition-all ${
                isEnabled 
                  ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]' 
                  : 'bg-transparent border-gray-600 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Power size={10} />
              {isEnabled ? 'ON' : 'BYPASS'}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className={`p-6 flex flex-col gap-6 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
          
          {/* Sliders Grid */}
          <div className="flex justify-between items-end h-48 gap-1 md:gap-2">
            {EQ_FREQUENCIES.map((freq, i) => (
              <div key={freq} className="flex flex-col items-center h-full group">
                {/* dB Value (Visible on hover/drag) */}
                <div className="h-4 text-[8px] text-cyber-pink font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {gains[i] > 0 ? '+' : ''}{gains[i]}
                </div>

                {/* Vertical Slider Wrapper */}
                <div className="relative flex-1 w-full flex justify-center items-center">
                   {/* Track Background */}
                   <div className="absolute w-1 h-full bg-gray-800 rounded-full overflow-hidden">
                      {/* Zero line */}
                      <div className="absolute top-1/2 w-full h-[1px] bg-gray-500"></div>
                      {/* Fill from center */}
                      <div 
                        className={`absolute w-full bg-cyber-cyan transition-all duration-75`}
                        style={{
                            height: `${Math.abs(gains[i]) / 12 * 50}%`,
                            top: gains[i] > 0 ? 'auto' : '50%',
                            bottom: gains[i] > 0 ? '50%' : 'auto',
                        }}
                      ></div>
                   </div>

                   {/* Native Input Range (rotated) */}
                   <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gains[i]}
                      onChange={(e) => handleGainChange(i, Number(e.target.value))}
                      className="absolute h-full w-8 opacity-0 cursor-pointer appearance-none z-10"
                      style={{ 
                          WebkitAppearance: 'slider-vertical', // Chrome/Safari/Edge specific
                          writingMode: 'bt-lr' // Old IE/Firefox
                      }}
                      // Fallback for styling if slider-vertical not supported perfectly (mostly handled by absolute overlay, input is just hit area)
                   />
                   
                   {/* Custom Thumb Visual */}
                   <div 
                      className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-75"
                      style={{
                          bottom: `${((gains[i] + 12) / 24) * 100}%`,
                          marginBottom: '-6px'
                      }}
                   />
                </div>

                {/* Frequency Label */}
                <div className="mt-2 text-[9px] text-gray-400 font-mono rotate-0">
                  {formatFreq(freq)}
                </div>
              </div>
            ))}
          </div>

          {/* Presets Row */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-cyber-yellow font-bold mr-2">
                <RefreshCw size={12} />
                PRESETS
            </div>
            {EQ_PRESETS.map((preset) => (
                <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.gains)}
                    className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 hover:bg-cyber-cyan/20 hover:border-cyber-cyan hover:text-cyber-cyan transition-all active:scale-95"
                >
                    {preset.name}
                </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};