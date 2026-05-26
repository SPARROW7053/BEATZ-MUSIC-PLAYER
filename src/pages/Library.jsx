import React, { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock, ListMusic, Plus, Search, FolderOpen, Music, ChevronLeft, FolderClosed, Play } from 'lucide-react';
import SongCard from '../components/SongCard';
import { usePlayer } from '../context/PlayerContext';

// Audio file extensions for filtering folder uploads
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|wma|opus|webm|mp4)$/i;

// Default cover images for folders (cycles through these)
const FOLDER_GRADIENTS = [
  'from-cyan-600 to-blue-800',
  'from-purple-600 to-violet-900',
  'from-pink-600 to-rose-800',
  'from-emerald-600 to-teal-800',
  'from-amber-600 to-orange-800',
  'from-indigo-600 to-blue-900',
];

const playlists = [
  { name: 'Liked Songs',        count: '142 songs', icon: Heart,     gradient: 'from-pink-600 to-rose-800' },
  { name: 'Recently Played',    count: '50 songs',  icon: Clock,     gradient: 'from-cyan-600 to-blue-800' },
  { name: 'My Mix — Synthwave', count: '24 songs',  icon: ListMusic, gradient: 'from-purple-600 to-violet-900' },
];

const Library = () => {
  const { tracks, addLocalFiles, localFolders, playTrack, libraryLoading } = usePlayer();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [openFolder, setOpenFolder] = useState(null); // currently browsing folder path
  const [searchQuery, setSearchQuery] = useState('');

  // Handle file selection (individual files)
  const handleFileUpload = (e) => {
    if (e.target.files.length > 0) {
      addLocalFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Handle folder selection — filter only audio files
  const handleFolderUpload = (e) => {
    const allFiles = Array.from(e.target.files);
    const audioFiles = allFiles.filter(f => AUDIO_EXTENSIONS.test(f.name));
    if (audioFiles.length > 0) {
      addLocalFiles(audioFiles);
    }
    e.target.value = '';
  };

  // Build folder tree from localFolders for hierarchical display
  const folderTree = useMemo(() => {
    if (!openFolder) return null;

    // Find all child folders of the currently open folder
    const childFolders = localFolders.filter(f => {
      if (f.path === openFolder) return false; // skip self
      // Must start with openFolder/ and not have more depth
      if (!f.path.startsWith(openFolder + '/')) return false;
      const remaining = f.path.slice(openFolder.length + 1);
      return !remaining.includes('/'); // direct children only
    });

    return childFolders;
  }, [openFolder, localFolders]);

  // Get tracks for the currently open folder (and its subfolders)
  const folderTracks = useMemo(() => {
    if (!openFolder) return [];
    return tracks.filter(t => t.folder && t.folder.startsWith(openFolder));
  }, [openFolder, tracks]);

  // Get ONLY direct tracks in the current folder (not in subfolders)
  const directFolderTracks = useMemo(() => {
    if (!openFolder) return [];
    return tracks.filter(t => t.folder === openFolder);
  }, [openFolder, tracks]);

  // Get the folder name for display
  const openFolderName = useMemo(() => {
    if (!openFolder) return '';
    const parts = openFolder.split('/');
    return parts[parts.length - 1];
  }, [openFolder]);

  // Get parent folder path for back navigation
  const parentFolder = useMemo(() => {
    if (!openFolder) return null;
    const parts = openFolder.split('/');
    if (parts.length <= 1) return null; // we're at root level
    return parts.slice(0, -1).join('/');
  }, [openFolder]);

  // Get root-level folders (top level uploaded folders)
  const rootFolders = useMemo(() => {
    return localFolders.filter(f => {
      const parts = f.path.split('/');
      return parts.length === 1; // just "FolderName" with no slashes
    });
  }, [localFolders]);

  // All local tracks (not in any folder)
  const unsortedTracks = useMemo(() => {
    return tracks.filter(t => t.isLocal && !t.folder);
  }, [tracks]);

  // Non-local tracks
  const streamingTracks = useMemo(() => {
    return tracks.filter(t => !t.isLocal);
  }, [tracks]);

  // Search filtering
  const filteredTracks = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [searchQuery, tracks]);

  // Play all tracks in folder
  const playFolder = (folderPath) => {
    const folderSongs = tracks.filter(t => t.folder && t.folder.startsWith(folderPath));
    if (folderSongs.length > 0) {
      playTrack(folderSongs[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-8 pb-32"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white">
            Your <span className="neon-gradient">Library</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Your personal music collection</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/8 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/30 transition-colors w-48"
            />
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            id="local-music-upload"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={folderInputRef}
            type="file"
            id="local-folder-upload"
            className="hidden"
            onChange={handleFolderUpload}
            {...{ webkitdirectory: '', directory: '', mozdirectory: '' }}
          />

          {/* Add Files button */}
          <motion.label
            htmlFor="local-music-upload"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-sm text-neon-cyan cursor-pointer hover:bg-neon-cyan/20 transition-all font-semibold"
          >
            <Music size={15} /> Add Files
          </motion.label>

          {/* Add Folder button */}
          <motion.label
            htmlFor="local-folder-upload"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-sm text-neon-purple cursor-pointer hover:bg-neon-purple/20 transition-all font-semibold"
          >
            <FolderOpen size={15} /> Add Folder
          </motion.label>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-sm text-gray-300 hover:text-white hover:bg-white/10 hover:border-neon-cyan/20 transition-all"
          >
            <Plus size={16} /> New Playlist
          </motion.button>
        </div>
      </div>

      {/* ─── Search Results ─── */}
      {filteredTracks && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white">
              Search Results
              <span className="text-gray-500 text-sm font-normal ml-2">"{searchQuery}"</span>
            </h3>
            <span className="text-xs text-gray-600 uppercase tracking-wider">{filteredTracks.length} found</span>
          </div>
          {filteredTracks.length > 0 ? (
            <div className="space-y-0.5">
              {filteredTracks.map((track, idx) => (
                <SongCard key={track.id} track={track} variant="row" index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No tracks found matching your search.</p>
          )}
        </div>
      )}

      {/* ─── Loading State ─── */}
      {libraryLoading && !filteredTracks && (
        <div className="w-full flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-neon-cyan animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Restoring Local Library</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Just a sec, we are loading your previously uploaded music and folders directly from your browser.
          </p>
        </div>
      )}

      {/* Only show the rest when not searching and not loading */}
      {!filteredTracks && !libraryLoading && (
        <>
          {/* Playlist cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {playlists.map((pl, idx) => (
              <motion.div
                key={pl.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass-card-hover flex items-center gap-4 p-5 cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${pl.gradient} shrink-0 shadow-lg`}>
                  <pl.icon size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-lg truncate group-hover:text-neon-cyan transition-colors">
                    {pl.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{pl.count}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ─── Folder Browser ─── */}
          <AnimatePresence mode="wait">
            {openFolder ? (
              /* ──── Inside a folder ──── */
              <motion.div
                key={openFolder}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="mb-12"
              >
                {/* Folder header with back button */}
                <div className="flex items-center gap-3 mb-6">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpenFolder(parentFolder)}
                    className="p-2 rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-900 flex items-center justify-center shrink-0">
                      <FolderOpen size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">{openFolderName}</h3>
                      <p className="text-xs text-gray-500">{folderTracks.length} songs total</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => playFolder(openFolder)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl neon-gradient-bg text-white text-sm font-semibold neon-shadow"
                  >
                    <Play size={16} fill="currentColor" /> Play All
                  </motion.button>
                </div>

                {/* Sub-folders */}
                {folderTree && folderTree.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Folders</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {folderTree.map((folder, idx) => (
                        <motion.div
                          key={folder.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ y: -4 }}
                          onClick={() => setOpenFolder(folder.path)}
                          className="glass-card-hover p-4 cursor-pointer group text-center"
                        >
                          <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${FOLDER_GRADIENTS[idx % FOLDER_GRADIENTS.length]} shadow-lg`}>
                            <FolderClosed size={24} className="text-white" />
                          </div>
                          <p className="text-white font-semibold text-sm truncate group-hover:text-neon-cyan transition-colors">
                            {folder.name}
                          </p>
                          <p className="text-gray-500 text-[11px] mt-0.5">{folder.songCount} songs</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct tracks in this folder */}
                {directFolderTracks.length > 0 && (
                  <>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Songs</p>
                    <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-600 uppercase tracking-wider border-b border-white/5 mb-2">
                      <span className="w-6 text-center">#</span>
                      <span className="w-10" />
                      <span className="flex-1">Title</span>
                      <span className="hidden md:block max-w-32">Album</span>
                      <span className="w-20 text-right pr-2">Duration</span>
                    </div>
                    <div className="space-y-0.5">
                      {directFolderTracks.map((track, idx) => (
                        <SongCard key={track.id} track={track} variant="row" index={idx} />
                      ))}
                    </div>
                  </>
                )}

                {directFolderTracks.length === 0 && (!folderTree || folderTree.length === 0) && (
                  <div className="glass-card p-12 text-center border border-dashed border-white/10">
                    <FolderOpen size={44} className="text-gray-700 mx-auto mb-3" />
                    <p className="text-lg text-gray-400 font-semibold mb-1">Empty folder</p>
                    <p className="text-gray-600 text-sm">No audio files found in this directory.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ──── Root level — show folder grid ──── */
              <motion.div
                key="root"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Local Folders Section */}
                {localFolders.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-white">
                        <FolderClosed size={18} className="inline mr-2 text-neon-purple" />
                        Local Folders
                      </h3>
                      <span className="text-xs text-gray-600 uppercase tracking-wider">{rootFolders.length} folders</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {rootFolders.map((folder, idx) => {
                        // Count all tracks in this folder tree
                        const totalSongs = tracks.filter(t => t.folder && t.folder.startsWith(folder.path)).length;
                        // Count subfolders
                        const subfolderCount = localFolders.filter(f =>
                          f.path !== folder.path && f.path.startsWith(folder.path + '/')
                        ).length;

                        return (
                          <motion.div
                            key={folder.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            onClick={() => setOpenFolder(folder.path)}
                            className="glass-card-hover p-4 cursor-pointer group text-center"
                          >
                            <div className={`w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${FOLDER_GRADIENTS[idx % FOLDER_GRADIENTS.length]} shadow-lg relative`}>
                              <FolderOpen size={28} className="text-white" />
                              {subfolderCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-purple text-white text-[9px] font-bold flex items-center justify-center">
                                  {subfolderCount}
                                </span>
                              )}
                            </div>
                            <p className="text-white font-semibold text-sm truncate group-hover:text-neon-cyan transition-colors">
                              {folder.name}
                            </p>
                            <p className="text-gray-500 text-[11px] mt-0.5">
                              {totalSongs} songs{subfolderCount > 0 ? ` · ${subfolderCount} folders` : ''}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unsorted local files (uploaded individually, not from folders) */}
                {unsortedTracks.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-white">
                        <Music size={18} className="inline mr-2 text-neon-cyan" />
                        Local Files
                      </h3>
                      <span className="text-xs text-gray-600 uppercase tracking-wider">{unsortedTracks.length} tracks</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-600 uppercase tracking-wider border-b border-white/5 mb-2">
                      <span className="w-6 text-center">#</span>
                      <span className="w-10" />
                      <span className="flex-1">Title</span>
                      <span className="hidden md:block max-w-32">Album</span>
                      <span className="w-20 text-right pr-2">Duration</span>
                    </div>
                    <div className="space-y-0.5">
                      {unsortedTracks.map((track, idx) => (
                        <SongCard key={track.id} track={track} variant="row" index={idx} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Songs list (streaming/default tracks) */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-white">All Songs</h3>
                  <span className="text-xs text-gray-600 uppercase tracking-wider">{streamingTracks.length} tracks</span>
                </div>

                {/* Column headers */}
                <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-600 uppercase tracking-wider border-b border-white/5 mb-2">
                  <span className="w-6 text-center">#</span>
                  <span className="w-10" />
                  <span className="flex-1">Title</span>
                  <span className="hidden md:block max-w-32">Album</span>
                  <span className="w-20 text-right pr-2">Duration</span>
                </div>

                <div className="space-y-0.5">
                  {streamingTracks.map((track, idx) => (
                    <SongCard key={track.id} track={track} variant="row" index={idx} />
                  ))}
                </div>

                {/* Empty state for saved albums */}
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-white mb-5">Saved Albums</h3>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-12 text-center border border-dashed border-white/10"
                  >
                    <ListMusic size={44} className="text-gray-700 mx-auto mb-3" />
                    <p className="text-lg text-gray-400 font-semibold mb-1">No saved albums yet</p>
                    <p className="text-gray-600 text-sm">Explore and save albums to see them here.</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default Library;
