import React, { useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { VisualizerStyle } from '../types';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isActive: boolean; // Controls if the animation loop runs
  style: VisualizerStyle;
  onSwitchStyle: () => void;
  mode: 'mobile-immersive' | 'desktop-box';
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  analyser, 
  isPlaying, 
  isActive,
  style, 
  onSwitchStyle,
  mode 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount; // 128 if fftSize is 256
    const dataArray = new Uint8Array(bufferLength);

    const renderBars = (width: number, height: number) => {
      ctx.save();
      analyser.getByteFrequencyData(dataArray);
      
      const barsToRender = mode === 'desktop-box' ? 32 : 20; 
      const step = Math.floor(bufferLength / barsToRender);
      const barWidth = (width / barsToRender) - (mode === 'desktop-box' ? 4 : 8);
      let x = (width - (barsToRender * (barWidth + (mode === 'desktop-box' ? 4 : 8)))) / 2; 

      for (let i = 0; i < barsToRender; i++) {
        const value = dataArray[i * step];
        const percent = value / 255;
        const barHeight = Math.max(percent * height * 0.8, 2); // Ensure min height

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.8)');

        ctx.fillStyle = gradient;
        
        const y = mode === 'mobile-immersive' 
            ? (height - barHeight) / 2 
            : height - barHeight;

        ctx.fillRect(x, y, barWidth, barHeight);
        
        if (mode === 'desktop-box') {
            ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
            ctx.fillRect(x, height, barWidth, barHeight * 0.4);
        }

        x += barWidth + (mode === 'desktop-box' ? 4 : 8);
      }
      ctx.restore();
    };

    const renderWave = (width: number, height: number) => {
      ctx.save();
      analyser.getByteTimeDomainData(dataArray);
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0, 243, 255, 1)";
      ctx.stroke();
      ctx.restore();
    };

    const renderCircle = (width: number, height: number) => {
      ctx.save();
      analyser.getByteFrequencyData(dataArray);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 4;
      
      // Draw Base Circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(0, radius - 10), 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const bars = 40;
      const step = Math.PI * 2 / bars;
      
      for(let i = 0; i < bars; i++) {
          const value = dataArray[i * 2] || 0; 
          const barHeight = (value / 255) * (radius * 0.8) + 2; // Min length
          
          const angle = i * step;
          
          const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
          const yEnd = centerY + Math.sin(angle) * (radius + barHeight);
          
          const xStart = centerX + Math.cos(angle) * radius;
          const yStart = centerY + Math.sin(angle) * radius;
          
          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xEnd, yEnd);
          ctx.strokeStyle = `hsl(${(i / bars) * 360}, 100%, 50%)`;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
      }
      ctx.restore();
    };

    const renderFrame = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      try {
        if (style === VisualizerStyle.BARS) renderBars(width, height);
        else if (style === VisualizerStyle.WAVE) renderWave(width, height);
        else if (style === VisualizerStyle.CIRCLE) renderCircle(width, height);
      } catch (e) {
        console.error("Visualizer Error:", e);
      }

      if (isPlaying && isActive) {
        animationRef.current = requestAnimationFrame(renderFrame);
      }
    };

    if (isPlaying && isActive) {
      renderFrame();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mode === 'desktop-box') {
         ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
         ctx.fillRect(0, canvas.height/2, canvas.width, 1);
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isPlaying, isActive, style, mode]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Container styling based on mode
  const containerClasses = mode === 'desktop-box' 
    ? "w-full h-full relative overflow-hidden rounded-xl bg-black/60 backdrop-blur-sm border border-cyber-cyan/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] aspect-square"
    : "absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-100"; 

  // Button Positioning based on mode
  const buttonPositionClasses = mode === 'mobile-immersive'
    ? "fixed bottom-8 left-8"
    : "absolute bottom-4 left-4";

  return (
    <div className={containerClasses}>
        {/* Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />
        
        {/* Standby Text (Desktop only) */}
        {mode === 'desktop-box' && !isActive && (
             <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-cyber-cyan/30 font-mono text-xs tracking-[0.3em] animate-pulse">
                    VISUAL_OFF
                </div>
             </div>
        )}

        {/* Style Switcher */}
        {(isActive || mode === 'desktop-box') && (
            <button 
                onClick={(e) => {
                    e.stopPropagation(); 
                    onSwitchStyle();
                }}
                className={`${buttonPositionClasses} z-50 p-4 rounded-full bg-black/80 border border-cyber-cyan text-cyber-cyan shadow-[0_0_15px_rgba(0,243,255,0.5)] backdrop-blur hover:bg-cyber-cyan hover:text-black hover:shadow-[0_0_25px_rgba(0,243,255,0.8)] transition-all duration-300 ease-in-out group active:scale-95 pointer-events-auto`}
                title="Switch Visual Style"
                aria-label="Switch Visual Style"
            >
                <Layers size={24} className="group-hover:scale-110 transition-transform" />
            </button>
        )}
    </div>
  );
};