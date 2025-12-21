import React from 'react';
import { Plus, Trash2, CloudUpload, Cpu } from 'lucide-react';

interface SystemPanelProps {
  onAdd: () => void;
  onDelete: () => void;
  usedSpace: number; // in bytes
  totalSpace: number; // in bytes
}

export const SystemPanel: React.FC<SystemPanelProps> = ({ onAdd, onDelete, usedSpace, totalSpace }) => {
  const percentage = Math.min(100, (usedSpace / totalSpace) * 100);
  
  // Format bytes
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0MB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  const ActionButton = ({ icon, label, onClick, color, disabled = false }: { icon: React.ReactNode, label: string, onClick: () => void, color: string, disabled?: boolean }) => {
      let colorClasses = '';
      if (color === 'cyan') colorClasses = 'text-cyber-cyan border-cyber-cyan hover:bg-cyber-cyan/10 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]';
      if (color === 'pink') colorClasses = 'text-cyber-pink border-cyber-pink hover:bg-cyber-pink/10 hover:shadow-[0_0_10px_rgba(255,0,255,0.3)]';
      if (color === 'yellow') colorClasses = 'text-cyber-yellow border-cyber-yellow hover:bg-cyber-yellow/10 hover:shadow-[0_0_10px_rgba(252,238,10,0.3)]';

      if (disabled) {
          colorClasses = 'text-gray-600 border-gray-600 cursor-not-allowed opacity-50';
      }

      return (
          <button 
              type="button"
              onClick={(e) => { 
                  e.stopPropagation(); 
                  if(!disabled) onClick(); 
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`
                  flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded border border-opacity-40
                  transition-all duration-200 active:scale-95 group backdrop-blur-sm z-20
                  ${colorClasses}
              `}
          >
              <div className="mb-0.5 transform group-hover:scale-110 transition-transform">{icon}</div>
              <span className="text-[8px] font-bold tracking-widest">{label}</span>
          </button>
      )
  }

  return (
    <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="w-full mt-1 p-2 bg-cyber-dark/60 backdrop-blur-md border border-gray-700/50 rounded-lg relative overflow-hidden group shadow-[0_0_10px_rgba(0,0,0,0.6)] cursor-default z-10"
    >
       {/* Circuit background decorative */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #000 100%), repeating-linear-gradient(45deg, #00f3ff 0, #00f3ff 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
       </div>

      {/* Storage Bar (Moved to Top) */}
      <div className="relative z-10 space-y-1 mb-2">
        <div className="flex justify-between text-[9px] font-mono text-cyber-cyan/80 tracking-wider uppercase leading-none">
            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-cyber-cyan rounded-full animate-pulse"></span> MEM_USAGE</span>
            <span className="opacity-80 text-[8px]">{formatSize(usedSpace)}/{formatSize(totalSpace)}</span>
        </div>
        <div className="w-full h-1.5 bg-black/50 border border-gray-700/50 rounded-sm overflow-hidden relative">
            {/* Grid overlay on bar */}
            <div className="absolute inset-0 z-20 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
            <div 
                className="h-full bg-gradient-to-r from-cyber-cyan via-blue-500 to-cyber-pink transition-all duration-500 ease-out shadow-[0_0_5px_rgba(0,243,255,0.5)]"
                style={{ width: `${percentage}%` }}
            />
        </div>
      </div>

      {/* Buttons Row (Moved to Bottom & Compacted) */}
      <div className="relative z-10 flex justify-between items-stretch gap-2">
        <ActionButton icon={<Plus size={14} />} label="ADD" onClick={onAdd} color="cyan" />
        <ActionButton icon={<Trash2 size={14} />} label="DEL" onClick={onDelete} color="pink" />
        <ActionButton icon={<CloudUpload size={14} />} label="CLOUD" onClick={() => {}} color="cyan" disabled />
        <ActionButton icon={<Cpu size={14} />} label="SYS" onClick={() => {}} color="yellow" disabled />
      </div>
    </div>
  );
};