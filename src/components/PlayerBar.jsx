import React, { useState, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Heart, Mic2, SlidersHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import NowPlaying from './NowPlaying';

const PlayerBar = () => {
  const {
    currentTrack, isPlaying, progress, currentTime, duration,
    volume, shuffle, repeatMode,
    togglePlay, nextTrack, previousTrack,
    setProgress, setVolume, setShuffle, cycleRepeat,
    formatSeconds,
  } = usePlayer();

  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [nowPlayingView, setNowPlayingView] = useState('player');
  const progressRef = useRef(null);

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

  const repeatActive = repeatMode !== 'off';

  return (
    <>
      {/* ─── Synced Now Playing Panel Drawer (Enlarges on Cover/Details click) ─── */}
      <NowPlaying
        isOpen={showNowPlaying}
        onClose={() => {
          setShowNowPlaying(false);
          setNowPlayingView('player');
        }}
        initialView={nowPlayingView}
      />

      {/* ── Bottom Player Bar ── */}
      <div className="h-[76px] bg-[#17181f] border-t border-white/5 px-6 flex items-center justify-between select-none shrink-0 relative z-40">
        {/* ── Left Currently Playing Info (Clicking enlarges it!) ── */}
        <div className="flex items-center gap-3 w-[26%] min-w-0">
          {currentTrack && (
            <>
              {/* Cover Art (Enlarges on click) */}
              <div 
                onClick={() => {
                  setNowPlayingView('player');
                  setShowNowPlaying(true);
                }}
                className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-md cursor-pointer transform hover:scale-105 transition-all duration-300 relative group"
                title="Expand View"
              >
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
                {/* Thin overlay icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                  </svg>
                </div>
              </div>

              {/* Title & Artist (Enlarges on click) */}
              <div 
                onClick={() => {
                  setNowPlayingView('player');
                  setShowNowPlaying(true);
                }}
                className="min-w-0 leading-tight cursor-pointer group"
                title="Expand View"
              >
                <h4 className="text-white text-sm font-bold truncate tracking-wide group-hover:text-[#ff9500] transition-colors">
                  {currentTrack.title}
                </h4>
                <p className="text-gray-500 text-xs truncate mt-0.5 font-medium group-hover:text-gray-300 transition-colors">
                  {currentTrack.artist}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Center Controls & Progress ── */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-4">
          {/* Buttons Row */}
          <div className="flex items-center gap-5">
            {/* Previous Track */}
            <button
              onClick={previousTrack}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            {/* Circular Play / Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#252833]/50 border border-white/10 flex items-center justify-center text-white hover:bg-[#252833]/80 hover:border-white/20 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {isPlaying ? (
                <Pause size={16} fill="white" />
              ) : (
                <Play size={16} fill="white" className="ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={nextTrack}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
              {formatSeconds(currentTime)}
            </span>

            {/* Progress Slider Track */}
            <div
              ref={progressRef}
              onMouseDown={handleProgressMouseDown}
              className="flex-1 h-3 flex items-center cursor-pointer relative group"
            >
              <div className="h-1 w-full bg-white/10 rounded-full relative">
                <div
                  className="h-full bg-white rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Drag Scrubber handle */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md scale-0 group-hover:scale-100 transition-transform origin-center" />
                </div>
              </div>
            </div>

            <span className="text-[10px] text-gray-500 font-mono w-8">
              {formatSeconds(duration || currentTrack?.durationSeconds)}
            </span>
          </div>
        </div>

        {/* ── Right Icons & Volume ── */}
        <div className="flex items-center justify-end gap-3.5 md:gap-4 w-[26%] shrink-0">
          {/* Synced Lyrics shortcut button */}
          <button
            onClick={() => {
              setNowPlayingView('lyrics');
              setShowNowPlaying(true);
            }}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
            title="Synced Lyrics"
          >
            <Mic2 size={16} />
          </button>

          {/* Equalizer Panel shortcut button */}
          <button
            onClick={() => {
              setNowPlayingView('eq');
              setShowNowPlaying(true);
            }}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
            title="Equalizer & Presets"
          >
            <SlidersHorizontal size={16} />
          </button>

          {/* Like */}
          <button
            onClick={() => setLiked(!liked)}
            className={`transition-colors cursor-pointer p-1 ${
              liked ? 'text-red-400' : 'text-gray-500 hover:text-white'
            }`}
            title="Like track"
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </button>

          {/* Shuffle */}
          <button
            onClick={setShuffle}
            className={`hidden sm:block transition-colors cursor-pointer p-1 ${
              shuffle ? 'text-[#ff9500]' : 'text-gray-500 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`hidden sm:block transition-colors cursor-pointer relative p-1 ${
              repeatActive ? 'text-[#a2d2ff]' : 'text-gray-500 hover:text-white'
            }`}
            title="Repeat"
          >
            <Repeat size={16} />
            {repeatMode === 'one' && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#a2d2ff] text-gray-900 text-[6px] font-black flex items-center justify-center">
                1
              </span>
            )}
          </button>

          {/* Volume Controls */}
          <div className="hidden sm:flex items-center gap-2 group">
            <button
              onClick={() => setMuted(!muted)}
              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="relative w-16 h-1 bg-white/10 rounded-full cursor-pointer">
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setMuted(false);
                  setVolume(Number(e.target.value));
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="h-full bg-gray-400 rounded-full transition-colors group-hover:bg-[#ff9500]"
                style={{ width: `${muted ? 0 : volume}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerBar;
