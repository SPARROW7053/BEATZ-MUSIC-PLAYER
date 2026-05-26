import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';

/**
 * SongCard — displays a track in a grid. Supports two variants:
 *   - 'grid'  (default) — square cover + metadata below
 *   - 'row'             — horizontal row layout (for track lists)
 */
const SongCard = ({ track, variant = 'grid', index }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isActive = currentTrack?.id === track.id;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  if (variant === 'row') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/15'
            : 'hover:bg-white/5 border border-transparent'
          }`}
        onClick={handlePlay}
      >
        {/* Index / Play indicator */}
        <div className="w-6 text-center shrink-0">
          <span className={`text-sm font-mono group-hover:hidden ${isActive ? 'text-neon-cyan hidden' : 'text-gray-600 block'}`}>
            {index + 1}
          </span>
          <button className={`${isActive ? 'flex' : 'hidden group-hover:flex'} items-center justify-center text-neon-cyan`}>
            {isActive && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>

        {/* Cover */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
          {isActive && isPlaying && (
            <div className="absolute inset-0 bg-dark-bg/50 flex items-end justify-center gap-px pb-1">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className={`w-0.5 bg-neon-cyan rounded-full bar-${i+1}`}
                  style={{ height: '60%' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${isActive ? 'text-neon-cyan' : 'text-white'}`}>
            {track.title}
          </p>
          <p className="text-gray-500 text-xs truncate">{track.artist}</p>
        </div>

        <p className="text-gray-600 text-xs hidden md:block truncate max-w-32">{track.album}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
            className={`p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${liked ? 'opacity-100 text-pink-400' : 'text-gray-600 hover:text-pink-400'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <span className="text-gray-600 text-xs font-mono w-9 text-right">{track.duration}</span>
        </div>
      </motion.div>
    );
  }

  // --- Grid variant ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -6 }}
      className={`glass-card-hover p-4 cursor-pointer group relative overflow-hidden
        ${isActive ? 'border-neon-cyan/20 shadow-[0_0_25px_rgba(0,243,255,0.08)]' : ''}`}
      onClick={handlePlay}
    >
      {/* Ambient glow when active */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-2xl" />
        </div>
      )}

      {/* Album art */}
      <div className="relative mb-4 aspect-square rounded-xl overflow-hidden">
        <img
          src={track.cover}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play/Pause button */}
        <AnimatePresence>
          <motion.button
            initial={{ scale: 0.5, opacity: 0 }}
            animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute inset-0 m-auto w-12 h-12 rounded-full neon-gradient-bg flex items-center justify-center text-white neon-shadow transition-all
              group-hover:!opacity-100 group-hover:!scale-100`}
            style={{
              width: 48,
              height: 48,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1)',
            }}
            onClick={handlePlay}
          >
            {isActive && isPlaying
              ? <Pause size={22} fill="currentColor" />
              : <Play size={22} fill="currentColor" className="ml-1" />
            }
          </motion.button>
        </AnimatePresence>

        {/* Mini equalizer for active card */}
        {isActive && isPlaying && (
          <div className="absolute bottom-3 left-3 flex items-end gap-0.5 h-5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`w-0.5 bg-neon-cyan rounded-full bar-${i}`} style={{ height: '100%' }} />
            ))}
          </div>
        )}

        {/* Like button */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
          className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm bg-black/30 transition-all duration-200
            opacity-0 group-hover:opacity-100 ${liked ? 'opacity-100 !text-pink-400' : 'text-white hover:text-pink-400'}`}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Metadata */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className={`font-bold text-sm truncate ${isActive ? 'text-neon-cyan' : 'text-white'}`}>
            {track.title}
          </h4>
          <p className="text-gray-500 text-xs truncate mt-0.5">{track.artist}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}
          className="text-gray-600 hover:text-gray-300 transition-colors p-0.5 mt-0.5 shrink-0"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-gray-700 text-xs">{track.album}</span>
        <span className="text-gray-600 text-xs font-mono">{track.duration}</span>
      </div>
    </motion.div>
  );
};

export default SongCard;
