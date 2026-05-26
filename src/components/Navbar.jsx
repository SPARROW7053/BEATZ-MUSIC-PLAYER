import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Heart, Settings, Play, X, User, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { searchSongs } from '../utils/saavnAPI';

const Navbar = ({ onOpenSidebar }) => {
  const { tracks, playTrack, setTracks } = usePlayer();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // debounced online JioSaavn search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOnlineResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      const res = await searchSongs(searchQuery, 4); // Limit to 4 for compact dropdown
      setOnlineResults(res);
      setIsSearchingOnline(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Local search logic
  const localResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [searchQuery, tracks]);

  const hasResults = localResults.length > 0 || onlineResults.length > 0;
  const showDropdown = searchFocused && searchQuery.trim().length > 0;

  const handlePlayFromSearch = (track) => {
    if (!track.isLocal && onlineResults.length > 0) {
      setTracks(onlineResults);
    }
    playTrack(track);
    setSearchQuery('');
    setSearchFocused(false);
    searchInputRef.current?.blur();
  };

  return (
    <header className="flex items-center justify-between px-2 py-4 select-none shrink-0 relative z-40 gap-3 md:gap-4">
      {/* Mobile Sidebar Hamburger Toggle */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden p-2.5 rounded-full bg-[#17181f] border border-white/5 text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
        title="Open Menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Search Bar ── */}
      <div ref={searchRef} className="relative flex-1 max-w-lg">
        <div
          className={`flex items-center gap-3 bg-[#17181f] border rounded-full px-5 py-3 transition-all duration-300 ${
            searchFocused
              ? 'border-white/15 bg-[#1b1c25] shadow-lg'
              : 'border-white/5 hover:border-white/10'
          }`}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search for a song"
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full pr-8"
          />
          <div className="absolute right-5 text-gray-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center">
            {searchQuery ? (
              <X size={16} onClick={() => setSearchQuery('')} />
            ) : (
              <Search size={16} />
            )}
          </div>
        </div>

        {/* Floating Dropdown Results */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-3 bg-[#1b1c25]/95 backdrop-blur-xl border border-white/10 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-[360px] overflow-y-auto premium-scrollbar z-50 p-2"
            >
              {!hasResults ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No results found for "<span className="text-white">{searchQuery}</span>"
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Local Library */}
                  {localResults.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1.5">
                        Local Library
                      </p>
                      {localResults.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handlePlayFromSearch(track)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-left group"
                        >
                          <img
                            src={track.cover}
                            alt={track.title}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-[#ff9500] transition-colors">
                              {track.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                          </div>
                          <Play size={12} className="text-gray-500 group-hover:text-white shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Online Search */}
                  {onlineResults.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Global Internet Search
                        </span>
                        {isSearchingOnline && (
                          <div className="w-2.5 h-2.5 border border-[#ff9500]/30 border-t-[#ff9500] rounded-full animate-spin"></div>
                        )}
                      </div>
                      {onlineResults.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handlePlayFromSearch(track)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-left group"
                        >
                          <img
                            src={track.cover}
                            alt={track.title}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-[#ff9500] transition-colors">
                              {track.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                          </div>
                          <Music size={12} className="text-[#ff9500] shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right Profile / Buttons ── */}
      <div className="flex items-center gap-4">
        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-lg">
            <img
              src="/covers/molly_hunter.png"
              alt="Molly Hunter Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left leading-tight">
            <h3 className="text-sm font-bold text-white tracking-wide">Molly Hunter</h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-extrabold text-[#14b8a6] bg-[#14b8a6]/10 border border-[#14b8a6]/15 rounded-full select-none">
              Premium
            </span>
          </div>
        </div>

        {/* Favorite Circular Container */}
        <button
          className="w-10 h-10 rounded-full bg-[#17181f] border border-white/5 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-[#1c1e26] hover:border-white/10 transition-all duration-200"
          title="Favorites"
        >
          <Heart size={16} />
        </button>

        {/* Settings Circular Container */}
        <button
          className="w-10 h-10 rounded-full bg-[#17181f] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1c1e26] hover:border-white/10 transition-all duration-200"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
