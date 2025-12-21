import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SONGS, BACKGROUNDS, EQ_FREQUENCIES } from './constants';
import { MusicList } from './components/MusicList';
import { PlayerPanel } from './components/PlayerPanel';
import { Visualizer } from './components/Visualizer';
import { BackgroundSwitcher } from './components/BackgroundSwitcher';
import { SkinSelector } from './components/SkinSelector';
import { EqualizerModal } from './components/EqualizerModal';
import { PlayMode, Song, VisualizerStyle } from './types';
import { saveSongToDB, getAllSongsFromDB, deleteSongFromDB, getStorageUsage } from './utils/db';

function App() {
  // Initialize from Local Storage or default to 0
  const [currentBgIndex, setCurrentBgIndex] = useState(() => {
    const saved = localStorage.getItem('cyber_tunes_theme');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.SEQUENCE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [usedStorage, setUsedStorage] = useState(0);
  const [isPro, setIsPro] = useState(false); // Toggle for Pro features
  const [isAppLoaded, setIsAppLoaded] = useState(false); // New loading state
  
  // Visualizer State
  const [isVisualizerActive, setIsVisualizerActive] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>(VisualizerStyle.BARS);

  // Equalizer State
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isEqEnabled, setIsEqEnabled] = useState(() => {
    return localStorage.getItem('cyber_tunes_eq_enabled') === 'true';
  });
  const [eqGains, setEqGains] = useState<number[]>(() => {
    const saved = localStorage.getItem('cyber_tunes_eq_gains');
    return saved ? JSON.parse(saved) : new Array(10).fill(0);
  });

  // State for the temporary toast message in the footer
  const [storageNotification, setStorageNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  // State for Skin Selector Modal
  const [isSkinSelectorOpen, setIsSkinSelectorOpen] = useState(false);

  // --- AUDIO ENGINE REFS ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]); // Store the 10 EQ filters
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedSongIdRef = useRef<string | null>(null);
  
  // Storage Limits
  const LIMIT_FREE = 256 * 1024 * 1024; // 256MB
  const LIMIT_PRO = 1024 * 1024 * 1024; // 1GB
  const MAX_STORAGE = isPro ? LIMIT_PRO : LIMIT_FREE;

  // ---------------------------------------------------------------------------
  // INITIALIZATION: DB & Theme
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const initApp = async () => {
      // 1. Theme Setup
      const theme = BACKGROUNDS[currentBgIndex].colors;
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.primary);
      root.style.setProperty('--color-secondary', theme.secondary);
      root.style.setProperty('--color-yellow', theme.yellow);
      localStorage.setItem('cyber_tunes_theme', currentBgIndex.toString());

      // 2. Load Local Songs from IDB
      try {
        const localSongs = await getAllSongsFromDB();
        const usage = await getStorageUsage();
        
        // Merge Cloud Songs (Constants) + Local Songs
        setPlaylist([...SONGS, ...localSongs]);
        setUsedStorage(usage);
      } catch (err) {
        console.error("Failed to load local DB", err);
        setPlaylist([...SONGS]);
      } finally {
        setIsAppLoaded(true);
      }
    };

    initApp();
  }, [currentBgIndex]);

  // ---------------------------------------------------------------------------
  // Helper: Format Bytes
  // ---------------------------------------------------------------------------
  const formatSizeForToast = (bytes: number) => {
    if (bytes === 0) return '0MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return (mb / 1024).toFixed(1) + 'GB';
    }
    return mb.toFixed(0) + 'MB'; 
  };

  // ---------------------------------------------------------------------------
  // Helper: Trigger Storage Toast
  // ---------------------------------------------------------------------------
  const triggerStorageToast = (currentUsed: number) => {
    if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
    }
    
    const maxStr = formatSizeForToast(MAX_STORAGE);
    const usedStr = formatSizeForToast(currentUsed);
    
    setStorageNotification(`已使用 ${usedStr}/${maxStr}`);
    
    notificationTimeoutRef.current = window.setTimeout(() => {
        setStorageNotification(null);
    }, 2000); 
  };

  // ---------------------------------------------------------------------------
  // Audio Initialization (Phase 1: Web Audio API Graph)
  // ---------------------------------------------------------------------------
  
  const handleNextRef = useRef<(auto?: boolean) => void>(() => {});

  useEffect(() => {
    // 1. Create Audio Element
    const audio = new Audio();
    // crossOrigin="anonymous" is REQUIRED for Web Audio API to process the audio data.
    audio.crossOrigin = "anonymous"; 
    audio.volume = 0.5;
    audioRef.current = audio;

    // 2. Setup Audio Context & Graph
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    // 3. Create Nodes
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256; 
    analyserRef.current = analyser;

    const gainNode = ctx.createGain(); // Master Volume
    gainNode.connect(ctx.destination);

    // 4. Create Source & EQ Chain
    try {
      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      // 4a. Create EQ Filters
      const filters = EQ_FREQUENCIES.map(freq => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4; // Standard Q
        filter.gain.value = 0; // Init at flat
        return filter;
      });
      filtersRef.current = filters;

      // 4b. Connect Chain: Source -> Filter[0] -> ... -> Filter[9] -> Analyser -> Gain -> Dest
      if (filters.length > 0) {
          source.connect(filters[0]);
          for (let i = 0; i < filters.length - 1; i++) {
              filters[i].connect(filters[i + 1]);
          }
          filters[filters.length - 1].connect(analyser);
      } else {
          // Fallback if no filters
          source.connect(analyser);
      }

      analyser.connect(gainNode);

    } catch (e) {
      console.warn("Audio source already created or error:", e);
    }

    // 5. Event Listeners
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if(!isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => handleNextRef.current(true);
    
    const handleError = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        let errorMessage = "Unknown Audio Error";
        if (target.error) {
            switch (target.error.code) {
                case target.error.MEDIA_ERR_ABORTED:
                    errorMessage = "Fetch aborted by user.";
                    break;
                case target.error.MEDIA_ERR_NETWORK:
                    errorMessage = "Network error during load.";
                    break;
                case target.error.MEDIA_ERR_DECODE:
                    errorMessage = "Decoding error.";
                    break;
                case target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = "Audio source not supported or not found.";
                    break;
                default:
                    errorMessage = `Error Code: ${target.error.code}`;
            }
        }
        console.error("Audio Load Error:", errorMessage, target.src);
        setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []); 

  // ---------------------------------------------------------------------------
  // EQ Effect: Update Filters
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Sync storage
    localStorage.setItem('cyber_tunes_eq_gains', JSON.stringify(eqGains));
    localStorage.setItem('cyber_tunes_eq_enabled', String(isEqEnabled));

    // Update Filter Nodes
    if (filtersRef.current.length === 10) {
        filtersRef.current.forEach((filter, index) => {
            // Apply gain if enabled, else flat (0)
            const targetGain = isEqEnabled ? eqGains[index] : 0;
            // Smooth transition to prevent clicking
            filter.gain.setTargetAtTime(targetGain, audioContextRef.current?.currentTime || 0, 0.1);
        });
    }
  }, [eqGains, isEqEnabled]);


  // ---------------------------------------------------------------------------
  // Navigation Logic
  // ---------------------------------------------------------------------------

  const handleNext = useCallback((auto = false) => {
    if (playlist.length === 0) return;

    if (playMode === PlayMode.REPEAT_ONE && auto) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.error("Replay error:", error));
        }
      }
      return;
    }

    if (playMode === PlayMode.SHUFFLE) {
      const nextIndex = Math.floor(Math.random() * playlist.length);
      setCurrentSongIndex(nextIndex);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    }
  }, [playMode, playlist.length]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const handlePrev = () => {
    if (playlist.length === 0) return;

    if (playMode === PlayMode.SHUFFLE) {
       const nextIndex = Math.floor(Math.random() * playlist.length);
       setCurrentSongIndex(nextIndex);
    } else {
       setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  // ---------------------------------------------------------------------------
  // Unified Audio Effect
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    const audio = audioRef.current;
    const ctx = audioContextRef.current;

    if (!audio || !ctx || playlist.length === 0 || !isAppLoaded) return;
    if (currentSongIndex >= playlist.length) return;

    const song = playlist[currentSongIndex];

    // 1. Resume Context
    if (isPlaying && ctx.state === 'suspended') {
        ctx.resume();
    }

    // 2. Load Source
    if (loadedSongIdRef.current !== song.id) {
        audio.src = song.url;
        loadedSongIdRef.current = song.id;
    }

    // 3. Sync Playback State
    if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Play error:", error);
                    if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
                        setIsPlaying(false);
                    }
                }
            });
        }
    } else {
        audio.pause();
    }
  }, [currentSongIndex, playlist, isPlaying, isAppLoaded]);


  // ---------------------------------------------------------------------------
  // UI Interactions
  // ---------------------------------------------------------------------------

  const togglePlayPause = useCallback(() => {
    if (playlist.length === 0) return;
    
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    setIsPlaying(prev => !prev);
  }, [playlist.length]);

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMode = () => {
    setPlayMode((prev) => {
      if (prev === PlayMode.SEQUENCE) return PlayMode.SHUFFLE;
      if (prev === PlayMode.SHUFFLE) return PlayMode.REPEAT_ONE;
      return PlayMode.SEQUENCE;
    });
  };

  const switchBackground = () => {
    setCurrentBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  const selectSong = (song: Song) => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const index = playlist.findIndex(s => s.id === song.id);
    if (index !== -1) {
      setCurrentSongIndex(index);
      setIsPlaying(true);
    }
  };

  const toggleUI = () => {
    setIsUIHidden(prev => !prev);
  };

  const toggleVisualizer = () => {
    if (!isVisualizerActive && audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    setIsVisualizerActive(prev => !prev);
  };

  const switchVisualizerStyle = () => {
      const styles = Object.values(VisualizerStyle);
      const currentIndex = styles.indexOf(visualizerStyle);
      const nextIndex = (currentIndex + 1) % styles.length;
      setVisualizerStyle(styles[nextIndex]);
  };

  const stopProp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is inputting text (if we add inputs later)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault(); // Prevent scrolling
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
            setCurrentTime(audioRef.current.currentTime);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
            setCurrentTime(audioRef.current.currentTime);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  // --- System Panel Functions ---

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const newSong = await saveSongToDB(file, MAX_STORAGE);
        if (newSong) {
            setPlaylist(prev => [...prev, newSong]);
            const newUsed = usedStorage + file.size;
            setUsedStorage(newUsed);
            triggerStorageToast(newUsed);
        }
    } catch (error: any) {
        if (error.message === 'STORAGE_LIMIT_EXCEEDED') {
            alert(`空间已满 (${isPro ? '1GB' : '256MB'})。${!isPro ? '请点击设置升级进阶版，或' : '请'}删除一些文件。`);
        } else {
            console.error("Save error:", error);
            alert("保存文件失败");
        }
    }
    e.target.value = ''; 
  };

  const handleDeleteSong = async () => {
      if (playlist.length === 0) return;
      
      const songToDelete = playlist[currentSongIndex];

      if (songToDelete.isLocal && songToDelete.id) {
          await deleteSongFromDB(songToDelete.id);
          URL.revokeObjectURL(songToDelete.url);
          
          if (songToDelete.size) {
            const newUsed = Math.max(0, usedStorage - songToDelete.size);
            setUsedStorage(newUsed);
            triggerStorageToast(newUsed);
          }
      }

      const newPlaylist = playlist.filter((_, i) => i !== currentSongIndex);
      setPlaylist(newPlaylist);

      if (newPlaylist.length === 0) {
          setIsPlaying(false);
          setCurrentSongIndex(0);
          loadedSongIdRef.current = null;
      } else {
          if (currentSongIndex >= newPlaylist.length) {
              setCurrentSongIndex(newPlaylist.length - 1);
          }
      }
  };

  const handleSettingsClick = () => {
      const newProState = !isPro;
      setIsPro(newProState);
      const msg = newProState 
        ? ">>> 系统升级：已激活进阶版权限\n>>> 存储空间扩容至 1GB" 
        : ">>> 系统降级：已恢复标准版权限\n>>> 存储空间限制为 256MB";
      alert(msg);
  };

  if (!isAppLoaded) {
      return <div className="w-full h-screen bg-black flex items-center justify-center text-cyber-cyan font-mono">LOADING SYSTEM...</div>;
  }

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-black font-mono select-none"
      onClick={toggleUI}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        onClick={(e) => e.stopPropagation()} 
        accept="audio/*" 
        className="hidden" 
      />
      
      {/* 
        LAYER 1: Background Image 
      */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
        style={{
            backgroundImage: `url(${BACKGROUNDS[currentBgIndex].url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6
        }}
      />

      {/* 
        LAYER 2: Mobile Immersive Visualizer (Background Layer)
        - Visible on Mobile (< lg)
        - Acts as wallpaper when UI is active or hidden
      */}
      <div className="absolute inset-0 z-1 lg:hidden pointer-events-none">
         {isVisualizerActive && (
             <Visualizer 
                analyser={analyserRef.current}
                isPlaying={isPlaying}
                isActive={isVisualizerActive}
                style={visualizerStyle}
                onSwitchStyle={switchVisualizerStyle}
                mode="mobile-immersive"
             />
         )}
      </div>

      {/* 
        LAYER 4: Main UI Container 
        - Centered, Fixed Max Width
      */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pb-24 px-6 md:max-w-md md:mx-auto pointer-events-none">
        
        {/* 
          WRAPPER: Wraps List and Panel. 
          - pointer-events-auto allows interaction with children.
          - gap-6 ensures spacing is part of the flow for height calculation.
        */}
        <div className="relative w-full flex flex-col gap-6 pointer-events-auto">
            
            {/* 
               Desktop Sidecar Visualizer
               - Positioned ABSOLUTE relative to the Wrapper.
               - In Immersive Mode (isUIHidden), it moves to CENTER screen.
               - In Normal Mode, it sits to the RIGHT (Sidecar).
            */}
            <div 
                className={`hidden lg:block absolute top-0 bottom-0 aspect-square transition-all duration-700 ease-in-out ${isUIHidden ? 'left-1/2 -translate-x-1/2 scale-110 z-20' : 'left-[105%] translate-x-0 z-0'}`}
            >
                 {isVisualizerActive && (
                     <div className="w-full h-full animate-[fade-in_0.5s_ease-out]">
                        <Visualizer 
                            analyser={analyserRef.current}
                            isPlaying={isPlaying}
                            isActive={isVisualizerActive}
                            style={visualizerStyle}
                            onSwitchStyle={switchVisualizerStyle}
                            mode="desktop-box"
                        />
                     </div>
                 )}
            </div>

            {/* Top Section: List & System (Flies Left) */}
            <div 
              className={`w-full transition-transform duration-700 ease-in-out ${isUIHidden ? '-translate-x-[150vw]' : 'translate-x-0'}`}
            >
              <div onClick={stopProp}>
                <div className="w-full relative group">
                  <div className="absolute -bottom-6 left-1/2 w-[2px] h-6 bg-gradient-to-b from-cyber-cyan to-transparent opacity-50 z-0"></div>
                  <MusicList 
                    songs={playlist} 
                    currentSongId={playlist[currentSongIndex]?.id} 
                    onSelectSong={selectSong}
                    isPlaying={isPlaying}
                    onAdd={handleAddFileClick}
                    onDelete={handleDeleteSong}
                    onSkinMenu={() => setIsSkinSelectorOpen(true)}
                    onSettings={handleSettingsClick}
                    usedSpace={usedStorage}
                    totalSpace={MAX_STORAGE}
                    notification={storageNotification}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section: Player Panel (Flies Right) */}
            <div 
              className={`w-full transition-transform duration-700 ease-in-out ${isUIHidden ? 'translate-x-[150vw]' : 'translate-x-0'}`}
            >
              <div onClick={stopProp}>
                <PlayerPanel 
                  currentSong={playlist[currentSongIndex] || null}
                  isPlaying={isPlaying}
                  playMode={playMode}
                  currentTime={currentTime}
                  duration={duration || playlist[currentSongIndex]?.duration || 0}
                  onPlayPause={togglePlayPause}
                  onNext={() => handleNext(false)}
                  onPrev={handlePrev}
                  onToggleMode={toggleMode}
                  onSeek={handleSeek}
                  isVisualizerActive={isVisualizerActive}
                  onToggleVisualizer={toggleVisualizer}
                  onOpenEq={() => setIsEqOpen(true)}
                />
              </div>
            </div>
        </div>

      </div>

      {/* Floating Action Button - Force Visible */}
      <BackgroundSwitcher 
        onSwitch={switchBackground} 
        currentBgIndex={currentBgIndex} 
        isHidden={false} 
      />

      {/* Skin Selector Modal */}
      <SkinSelector 
        isOpen={isSkinSelectorOpen}
        onClose={() => setIsSkinSelectorOpen(false)}
        onSelect={(index) => setCurrentBgIndex(index)}
        currentIndex={currentBgIndex}
      />
      
      {/* Equalizer Modal */}
      <EqualizerModal 
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        gains={eqGains}
        setGains={setEqGains}
        isEnabled={isEqEnabled}
        setEnabled={setIsEqEnabled}
      />

    </div>
  );
}

export default App;