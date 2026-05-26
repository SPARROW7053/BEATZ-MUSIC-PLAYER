import React, { useState, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Sparkles, Headphones, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import SongCard from '../components/SongCard';

const Home = () => {
  const { tracks, currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categoriesRef = useRef(null);
  const popularRef = useRef(null);

  const categories = [
    'All', 'Relax', 'Sad', 'Party', 'Romance', 'Energetic', 'Relaxing', 'Jazz', 'Alternative'
  ];

  // Quick Picks options from the original page
  const quickPicks = [
    { label: 'Synthwave Mix', color: 'from-[#00f3ff]/20 to-blue-900/40', border: 'border-[#00f3ff]/20 hover:border-[#00f3ff]/40 shadow-[0_0_15px_rgba(0,243,255,0.05)] hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]' },
    { label: 'Night Drive',   color: 'from-[#b026ff]/20 to-fuchsia-900/40', border: 'border-[#b026ff]/20 hover:border-[#b026ff]/40 shadow-[0_0_15px_rgba(176,38,255,0.05)] hover:shadow-[0_0_20px_rgba(176,38,255,0.15)]' },
    { label: 'Focus Mode',    color: 'from-emerald-600/20 to-teal-900/40', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
    { label: 'Bass Drop',     color: 'from-rose-600/20 to-red-900/40', border: 'border-rose-500/20 hover:border-rose-500/40' },
  ];

  // Song subsets
  const popularSongs = tracks;
  const featuredTracks = tracks.slice(0, 5);

  // Coverflow Carousel index matching (we use first 5 tracks)
  const coverflowSongs = tracks.slice(0, 5);
  
  // Find current active index in coverflow list
  const currentCoverflowIndex = coverflowSongs.findIndex(t => t.id === currentTrack?.id);
  const activeIndex = currentCoverflowIndex !== -1 ? currentCoverflowIndex : 0;

  const handleCoverflowClick = (index, track) => {
    if (index === activeIndex) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const scrollContainer = (ref, direction) => {
    if (!ref.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-8 space-y-9 select-none"
    >
      {/* ── 3D Coverflow Carousel Hero ── */}
      <section className="relative w-full h-[320px] flex items-center justify-center overflow-hidden py-10">
        <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
          {coverflowSongs.map((track, i) => {
            const offset = i - activeIndex;
            const isCenter = offset === 0;
            const isLeft = offset === -1 || offset < -1;
            const isRight = offset === 1 || offset > 1;
            const isFarLeft = offset === -2 || offset < -2;
            const isFarRight = offset === 2 || offset > 2;

            let positionStyles = {};
            let zIndex = 10;
            let scale = 0.75;
            let opacity = 0.4;
            let translateX = '0%';

            if (isCenter) {
              zIndex = 30;
              scale = 1.05;
              opacity = 1;
              translateX = '0%';
            } else if (offset === -1) {
              zIndex = 20;
              scale = 0.88;
              opacity = 0.75;
              translateX = '-45%';
            } else if (offset === 1) {
              zIndex = 20;
              scale = 0.88;
              opacity = 0.75;
              translateX = '45%';
            } else if (offset === -2) {
              zIndex = 10;
              scale = 0.75;
              opacity = 0.45;
              translateX = '-80%';
            } else if (offset === 2) {
              zIndex = 10;
              scale = 0.75;
              opacity = 0.45;
              translateX = '80%';
            } else if (offset < -2) {
              zIndex = 5;
              scale = 0.6;
              opacity = 0;
              translateX = '-120%';
            } else if (offset > 2) {
              zIndex = 5;
              scale = 0.6;
              opacity = 0;
              translateX = '120%';
            }

            return (
              <motion.div
                key={track.id}
                onClick={() => handleCoverflowClick(i, track)}
                className="absolute w-[240px] md:w-[280px] aspect-[4/5] rounded-[24px] overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 select-none origin-center"
                style={{
                  zIndex,
                  transform: `translateX(${translateX}) scale(${scale})`,
                  opacity,
                }}
                animate={{
                  transform: `translateX(${translateX}) scale(${scale})`,
                  opacity,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
              >
                {/* Album Art */}
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Vertical Gradient & Text Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-5 text-left leading-normal">
                  <h2 className="text-white text-base md:text-lg font-bold tracking-wide truncate">
                    {track.title}
                  </h2>
                  <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5 truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Central Play Button Overlay */}
                {isCenter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {isPlaying && currentTrack?.id === track.id ? (
                      <Pause size={18} fill="white" />
                    ) : (
                      <Play size={18} fill="white" className="ml-0.5" />
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Select Categories Section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide">Select Categories</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scrollContainer(categoriesRef, 'left')}
              className="w-8 h-8 rounded-full border border-white/5 bg-[#17181f] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollContainer(categoriesRef, 'right')}
              className="w-8 h-8 rounded-full border border-white/5 bg-[#17181f] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/10 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Category Group */}
        <div
          ref={categoriesRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar snap-x scroll-smooth pb-1"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`snap-start px-5 py-2.5 rounded-full text-xs font-semibold border tracking-wider transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#14b8a6] border-[#14b8a6] text-white shadow-md'
                    : 'bg-[#17181f] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Original Quick Picks Presets (Styled in RhythmoTune grid) ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
          <Sparkles size={18} className="text-[#ff9500]" /> Quick Picks
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {quickPicks.map((qp, i) => (
            <button
              key={qp.label}
              onClick={() => playTrack(tracks[i % tracks.length])}
              className={`bg-gradient-to-br ${qp.color} border ${qp.border} rounded-2xl p-4 flex items-center gap-3 text-left transition-all hover:scale-103 cursor-pointer group relative overflow-hidden`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:text-white group-hover:bg-[#ff9500]/20 transition-all shrink-0">
                <Play size={15} fill="currentColor" className="ml-0.5" />
              </div>
              <span className="text-white font-semibold text-sm truncate">{qp.label}</span>
              {/* Shine Overlay Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          ))}
        </div>
      </section>

      {/* ── Popular Songs Section (Original Trending Tracks slider) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <TrendingUp size={18} className="text-[#14b8a6]" /> Popular songs
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => scrollContainer(popularRef, 'left')}
              className="w-8 h-8 rounded-full border border-white/5 bg-[#17181f] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollContainer(popularRef, 'right')}
              className="w-8 h-8 rounded-full border border-white/5 bg-[#17181f] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/10 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Popular Grid Slider */}
        <div
          ref={popularRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar snap-x scroll-smooth pb-4"
        >
          {popularSongs.map((track) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                className={`snap-start relative min-w-[130px] md:min-w-[150px] aspect-[4/5] rounded-[24px] md:rounded-[28px] overflow-hidden cursor-pointer shadow-lg transition-transform hover:scale-105 duration-300 select-none group border-2 ${
                  isActive
                    ? 'border-[#ff9500] shadow-[0_0_20px_rgba(255,149,0,0.25)]'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Cover art full bleed */}
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Vertical Gradient & text overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-4 text-left leading-tight">
                  <h4 className="text-white text-xs md:text-sm font-bold truncate">
                    {track.title}
                  </h4>
                  <p className="text-gray-400 text-[10px] md:text-xs font-semibold mt-0.5 truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Active Play Equalizer overlay */}
                {isActive && isPlaying && (
                  <div className="absolute top-3 right-3 flex items-end gap-0.5 h-3">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-0.5 bg-[#ff9500] rounded-full bar-${i}`}
                        style={{ height: '100%' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Original Featured Playlist (Restored row format using SongCard) ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
          <Headphones size={18} className="text-[#a2d2ff]" /> Featured Tracks
        </h3>
        <div className="bg-[#17181f] border border-white/5 rounded-[24px] p-2 space-y-0.5">
          {featuredTracks.map((track, idx) => (
            <SongCard key={track.id} track={track} variant="row" index={idx} />
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
