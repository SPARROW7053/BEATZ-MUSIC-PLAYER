import React, { useState, useEffect } from 'react';
import { Play, Disc3, Search, Activity, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import { searchSongs, getTrendingSongs } from '../utils/saavnAPI';
import SongCard from '../components/SongCard';

const Explore = () => {
  const { playTrack, tracks, setTracks } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  // Use a simple debounce for searching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchSongs(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load trending songs on mount
  useEffect(() => {
    const fetchTrending = async () => {
      const top = await getTrendingSongs();
      setTrendingTracks(top);
      setIsLoadingTrending(false);
    };
    fetchTrending();
  }, []);

  const handlePlayTrending = (track) => {
    setTracks(trendingTracks);
    playTrack(track);
  };

  const handlePlaySearch = (track) => {
    setTracks(searchResults);
    playTrack(track);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-8 pb-32"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
            <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                Global <span className="neon-gradient">Explore</span> <Globe className="text-neon-cyan" size={32} />
            </h2>
            <p className="text-gray-500 text-sm">Discover and stream millions of songs online</p>
        </div>
        
        {/* Global Online Search */}
        <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Hindi, Bengali, Global..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151c30] border border-neon-cyan/30 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all"
            />
            {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
            )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Search Results View ── */}
        {searchQuery.trim().length > 0 ? (
            <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Online Results <span className="text-gray-500 text-sm font-normal">for "{searchQuery}"</span>
                    </h3>
                </div>

                {isSearching ? (
                     <div className="py-20 text-center text-gray-500">Searching global library...</div>
                ) : searchResults.length > 0 ? (
                    <div className="space-y-0.5">
                        {searchResults.map((track, idx) => (
                            <div key={track.id} onClick={() => handlePlaySearch(track)} className="cursor-pointer">
                                <SongCard track={track} variant="row" index={idx} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center text-gray-500">No tracks found. Try searching for "Arijit Singh" or "Pritam".</div>
                )}
            </motion.div>
        ) : (
            /* ── Default Trending View ── */
            <motion.div
                key="trending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* ── Trending Now ── */}
                <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <Activity size={20} className="text-neon-pink" /> Trending Now
                </h3>
                
                {isLoadingTrending ? (
                    <div className="flex gap-4 overflow-hidden mb-12">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="min-w-[160px] h-[220px] bg-white/5 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar mb-6 snap-x">
                        {trendingTracks.map((track, idx) => (
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -5 }}
                                onClick={() => handlePlayTrending(track)}
                                className="min-w-[160px] max-w-[160px] glass-card-hover p-4 cursor-pointer group snap-start"
                            >
                                <div className="relative rounded-xl overflow-hidden aspect-square mb-3 shadow-lg">
                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full neon-gradient-bg flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            <Play size={20} fill="currentColor" className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <h4 className="text-white font-bold text-sm truncate group-hover:text-neon-cyan transition-colors">{track.title}</h4>
                                <p className="text-gray-500 text-xs truncate mt-0.5">{track.artist}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Explore;
