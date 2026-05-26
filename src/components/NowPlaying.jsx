import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Heart, ChevronDown,
  SlidersHorizontal, Zap, Mic2
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import AudioVisualizer from './Visualizer';
import Equalizer from './Equalizer';
import { getTrackLyrics, getSyncedLyrics } from '../utils/saavnAPI';

const NowPlaying = ({ isOpen, onClose, initialView = 'player' }) => {
  const {
    currentTrack, isPlaying, progress, currentTime, duration,
    volume, shuffle, repeatMode, playbackSpeed,
    togglePlay, nextTrack, previousTrack,
    setProgress, setVolume, setShuffle, cycleRepeat,
    setPlaybackSpeed, formatSeconds, audioRef
  } = usePlayer();

  const [liked, setLiked] = useState(false);
  const [showEQ, setShowEQ] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialView === 'lyrics') {
        setShowLyrics(true);
        setShowEQ(false);
      } else if (initialView === 'eq') {
        setShowEQ(true);
        setShowLyrics(false);
      } else {
        setShowLyrics(false);
        setShowEQ(false);
      }
    }
  }, [isOpen, initialView]);

  const [lyrics, setLyrics] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const progressRef = useRef(null);

  const lyricsContainerRef = useRef(null);

  useEffect(() => {
    if (showLyrics && currentTrack) {
      const fetchLyrics = async () => {
        setLoadingLyrics(true);
        // Try to get synced lyrics from LrcLib first
        const durationSecs = typeof currentTrack.duration === 'number' ? currentTrack.duration : parseInt(currentTrack.duration);
        let synced = await getSyncedLyrics(currentTrack.title, currentTrack.artist, durationSecs || 0);
        
        if (synced && synced.length > 0) {
          setLyrics(synced);
        } else if (currentTrack.saavnId) {
          // Fallback to plain JioSaavn lyrics
          const plain = await getTrackLyrics(currentTrack.saavnId);
          setLyrics(plain);
        } else {
          setLyrics(null);
        }
        setLoadingLyrics(false);
      };
      fetchLyrics();
    } else {
      setLyrics(null);
    }
  }, [currentTrack, showLyrics]);

  // Find active line index
  const getActiveLineIndex = useCallback(() => {
    if (!Array.isArray(lyrics)) return -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i;
      }
    }
    return -1;
  }, [lyrics, currentTime]);

  const activeLineIndex = getActiveLineIndex();

  // Scroll active line into view
  useEffect(() => {
    if (showLyrics && Array.isArray(lyrics) && activeLineIndex !== -1 && lyricsContainerRef.current) {
       const activeEl = lyricsContainerRef.current.querySelector(`[data-index="${activeLineIndex}"]`);
       if (activeEl) {
         activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
    }
  }, [activeLineIndex, showLyrics, lyrics]);

  const handleLineClick = (time) => {
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
    }
  };

  // ─── Swipe-to-skip gestures ───
  const dragX = useMotionValue(0);
  const albumOpacity = useTransform(dragX, [-150, 0, 150], [0.3, 1, 0.3]);
  const albumScale = useTransform(dragX, [-150, 0, 150], [0.85, 1, 0.85]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -80) {
      nextTrack();
    } else if (info.offset.x > 80) {
      previousTrack();
    }
    animate(dragX, 0, { duration: 0.3 });
  };

  // ─── Progress bar handling ───
  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
  }, [setProgress]);

  const handleProgressMouseDown = (e) => {
    setDragging(true);
    handleProgressClick(e);
    const onMove = (ev) => handleProgressClick(ev);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ─── Playback speed options ───
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const nextSpeed = () => {
    const idx = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(idx + 1) % speeds.length]);
  };

  // ─── Repeat icon ───
  const repeatColor = repeatMode === 'off' ? 'text-gray-500' : 'text-neon-cyan';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden select-none"
          style={{
            background: 'linear-gradient(180deg, #0a0a12 0%, #050508 40%, #08060f 100%)',
          }}
        >
          {/* ─── Ambient Background Effects ─── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-neon-purple/15 rounded-full mix-blend-screen filter blur-[180px] animate-blob" />
            <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-neon-cyan/10 rounded-full mix-blend-screen filter blur-[160px] animate-blob-delay-2" />
            <div className="absolute top-[60%] left-[50%] w-[350px] h-[350px] bg-neon-pink/8 rounded-full mix-blend-screen filter blur-[140px] animate-blob-delay-4" />
            {/* Album art ambient reflection */}
            {currentTrack?.cover && (
              <div
                className="absolute top-0 left-0 w-full h-full opacity-[0.06]"
                style={{
                  backgroundImage: `url(${currentTrack.cover})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(80px) saturate(2)',
                }}
              />
            )}
          </div>

          {/* ─── Top Bar ─── */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronDown size={22} />
            </motion.button>

            <div className="text-center flex-1 px-4">
              <p className="text-[10px] uppercase tracking-[3px] text-gray-500 font-medium">Now Playing</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{currentTrack?.album}</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEQ(!showEQ)}
              className={`p-2 rounded-full transition-all ${
                showEQ 
                  ? 'bg-neon-cyan/15 text-neon-cyan' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal size={18} />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {showLyrics ? (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative z-10 overflow-y-auto px-6 py-4 hide-scrollbar"
                ref={lyricsContainerRef}
              >
                <div className="max-w-xl mx-auto min-h-full flex flex-col pt-10 pb-40">
                  <h3 className="text-xl font-bold text-white/50 mb-8 text-center uppercase tracking-[4px] text-[10px]">Lyrics</h3>
                  {loadingLyrics ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-neon-cyan animate-pulse">
                      <Mic2 size={32} className="mb-4" />
                      Loading lyrics...
                    </div>
                  ) : lyrics ? (
                    Array.isArray(lyrics) ? (
                      <div className="flex flex-col gap-6 text-center">
                        {lyrics.map((line, idx) => {
                          const isActive = idx === activeLineIndex;
                          const isPassed = idx < activeLineIndex;
                          return (
                            <motion.p
                              key={idx}
                              data-index={idx}
                              onClick={() => handleLineClick(line.time)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`cursor-pointer transition-all duration-300 md:text-3xl text-2xl font-bold ${
                                isActive
                                  ? 'text-white scale-105 text-shadow-neon'
                                  : isPassed
                                  ? 'text-gray-400'
                                  : 'text-gray-600 hover:text-gray-300'
                              }`}
                            >
                              {line.text}
                            </motion.p>
                          );
                        })}
                      </div>
                    ) : (
                      <div 
                        className="text-gray-300 text-lg leading-relaxed md:text-2xl md:leading-loose font-medium text-center"
                        dangerouslySetInnerHTML={{ __html: lyrics }}
                      />
                    )
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                       <Mic2 size={48} className="mb-4 opacity-20" />
                       <p>Lyrics are not available for this track.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : showEQ ? (
              <motion.div
                key="eq"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative z-10 overflow-y-auto hide-scrollbar"
              >
                <Equalizer />
              </motion.div>
            ) : (
              <motion.div
                key="player"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center relative z-10 px-6"
              >
                {/* ─── Album Art with Vinyl Disc ─── */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.3}
                  onDragEnd={handleDragEnd}
                  style={{ x: dragX, opacity: albumOpacity, scale: albumScale }}
                  className="relative mb-8 cursor-grab active:cursor-grabbing"
                >
                  {/* Outer glow ring */}
                  <motion.div
                    animate={isPlaying ? {
                      boxShadow: [
                        '0 0 40px rgba(0,243,255,0.15), 0 0 80px rgba(176,38,255,0.1)',
                        '0 0 60px rgba(0,243,255,0.25), 0 0 120px rgba(176,38,255,0.15)',
                        '0 0 40px rgba(0,243,255,0.15), 0 0 80px rgba(176,38,255,0.1)',
                      ]
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -inset-4 rounded-full"
                  />

                  {/* Vinyl disc behind album */}
                  <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute inset-0 m-auto w-[calc(100%+40px)] h-[calc(100%+40px)] -left-5 -top-5"
                    style={{
                      background: `
                        radial-gradient(circle at center,
                          #111 0%, #111 15%,
                          #1a1a22 16%, #222 17%,
                          transparent 17.5%,
                          #1a1a22 30%, #222 31%, transparent 31.5%,
                          #1a1a22 45%, #222 46%, transparent 46.5%,
                          #1a1a22 60%, #222 61%, transparent 61.5%,
                          #1a1a22 75%, transparent 75.5%,
                          #111 100%
                        )
                      `,
                      borderRadius: '50%',
                      opacity: isPlaying ? 0.6 : 0.3,
                      transition: 'opacity 0.5s ease',
                    }}
                  />

                  {/* Album art circle */}
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      {/* Dashed ring decoration */}
                      <div className="absolute -inset-2 rounded-full border-2 border-dashed border-neon-cyan/20" />
                      <img
                        src={currentTrack?.cover}
                        alt={currentTrack?.title}
                        className="w-64 h-64 md:w-72 md:h-72 rounded-full object-cover shadow-[0_0_60px_rgba(0,0,0,0.5)]"
                      />
                      {/* Center disc hole */}
                      <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#0a0a12] border-2 border-gray-800 shadow-inner" />
                    </motion.div>
                  </div>

                  {/* Swipe hint */}
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 whitespace-nowrap">
                    ← swipe to skip →
                  </p>
                </motion.div>

                {/* ─── Track Info ─── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTrack?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center mb-6 mt-4"
                  >
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-1 text-glow">
                      {currentTrack?.title}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {currentTrack?.artist}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* ─── Visualizer ─── */}
                <AudioVisualizer isPlaying={isPlaying} barCount={64} size="md" className="w-full max-w-sm mb-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Bottom Controls (always visible) ─── */}
          <div className="relative z-10 px-5 pb-6 pt-2">
            {/* Progress Bar */}
            <div className="mb-4">
              <div
                ref={progressRef}
                className="h-8 flex items-center cursor-pointer group"
                onMouseDown={handleProgressMouseDown}
                onTouchStart={(e) => {
                  setDragging(true);
                  const clientX = e.touches[0].clientX;
                  const rect = progressRef.current.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
                  setProgress(pct);
                }}
                onTouchMove={(e) => {
                  if (!dragging) return;
                  const clientX = e.touches[0].clientX;
                  const rect = progressRef.current.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
                  setProgress(pct);
                }}
                onTouchEnd={() => setDragging(false)}
              >
                <div className="h-1.5 w-full bg-white/10 rounded-full relative">
                  <div
                    className="h-full rounded-full relative neon-gradient-bg"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Scrubber thumb */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-neon-cyan shadow-[0_0_12px_rgba(0,243,255,0.8)] group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-gray-500 font-mono">{formatSeconds(currentTime)}</span>
                <span className="text-[11px] text-gray-500 font-mono">{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between max-w-md mx-auto mb-4">
              {/* Shuffle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={setShuffle}
                className={`p-2 rounded-full transition-all ${
                  shuffle 
                    ? 'text-neon-cyan bg-neon-cyan/10' 
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                <Shuffle size={20} />
              </motion.button>

              {/* Previous */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                onClick={previousTrack}
                className="text-gray-200 hover:text-white transition-colors p-2"
              >
                <SkipBack size={28} fill="currentColor" />
              </motion.button>

              {/* Play / Pause */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={togglePlay}
                className="w-16 h-16 rounded-full neon-gradient-bg flex items-center justify-center text-white relative"
                style={{
                  boxShadow: isPlaying 
                    ? '0 0 30px rgba(0,243,255,0.4), 0 0 60px rgba(176,38,255,0.2)' 
                    : '0 0 15px rgba(0,243,255,0.2)',
                }}
              >
                {isPlaying && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full neon-gradient-bg"
                  />
                )}
                <span className="relative z-10">
                  {isPlaying
                    ? <Pause size={28} fill="currentColor" />
                    : <Play size={28} fill="currentColor" className="ml-1" />
                  }
                </span>
              </motion.button>

              {/* Next */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                onClick={nextTrack}
                className="text-gray-200 hover:text-white transition-colors p-2"
              >
                <SkipForward size={28} fill="currentColor" />
              </motion.button>

              {/* Repeat */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={cycleRepeat}
                className={`p-2 rounded-full transition-all relative ${
                  repeatMode !== 'off' 
                    ? 'text-neon-purple bg-neon-purple/10' 
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                <Repeat size={20} />
                {repeatMode === 'one' && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-purple text-white text-[8px] font-black flex items-center justify-center">1</span>
                )}
              </motion.button>
            </div>

            {/* Secondary Controls Row */}
            <div className="flex items-center justify-between max-w-md mx-auto">
              {/* Like */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setLiked(l => !l)}
                className={`p-2 rounded-full transition-all ${
                  liked ? 'text-pink-400 bg-pink-400/10' : 'text-gray-500 hover:text-pink-400'
                }`}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </motion.button>

              {/* Playback Speed */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={nextSpeed}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  playbackSpeed !== 1
                    ? 'text-neon-green bg-neon-green/10 border border-neon-green/20'
                    : 'text-gray-500 bg-white/5 hover:text-gray-200'
                }`}
              >
                {playbackSpeed}x
              </motion.button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(m => !m)}
                  className="text-gray-500 hover:text-gray-200 transition-colors"
                >
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="relative w-20 h-1.5 bg-white/10 rounded-full cursor-pointer">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={muted ? 0 : volume}
                    onChange={(e) => { setMuted(false); setVolume(Number(e.target.value)); }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    style={{ height: '100%' }}
                  />
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${muted ? 0 : volume}%`,
                      background: 'linear-gradient(to right, #00f3ff, #b026ff)',
                    }}
                  />
                </div>
              </div>

              {/* Lyrics toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowLyrics(!showLyrics); setShowEQ(false); }}
                className={`p-2 rounded-full transition-all ${
                  showLyrics
                    ? 'text-neon-cyan bg-neon-cyan/10'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
                title="Lyrics"
              >
                <Mic2 size={18} />
              </motion.button>

              {/* EQ toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowEQ(!showEQ); setShowLyrics(false); }}
                className={`p-2 rounded-full transition-all ${
                  showEQ
                    ? 'text-neon-cyan bg-neon-cyan/10'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                <Zap size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NowPlaying;
