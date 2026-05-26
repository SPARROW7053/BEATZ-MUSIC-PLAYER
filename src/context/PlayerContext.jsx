import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import initialTracks from '../data/tracks';
import { useAuth } from './AuthContext';
import { saveAudioFiles, loadAllAudioFiles, saveLibraryMeta, loadLibraryMeta } from '../utils/localMusicDB';

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

// ─── Equalizer Presets ───
const EQ_PRESETS = {
  flat:       { name: 'Flat',       gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  bass:       { name: 'Bass Boost', gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  treble:     { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8] },
  vocal:      { name: 'Vocal',      gains: [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2] },
  pop:        { name: 'Pop',        gains: [-1, 2, 4, 5, 4, 2, 0, -1, -1, -1] },
  rock:       { name: 'Rock',       gains: [5, 3, 1, 0, -1, -1, 0, 2, 3, 5] },
  jazz:       { name: 'Jazz',       gains: [3, 2, 0, 2, -2, -2, 0, 2, 3, 4] },
  electronic: { name: 'Electronic', gains: [5, 4, 2, 0, -2, 0, 2, 4, 5, 5] },
  classical:  { name: 'Classical',  gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  hiphop:     { name: 'Hip-Hop',    gains: [6, 5, 3, 1, 0, -1, 0, 1, 2, 3] },
};

// 10-band EQ frequencies (standard)
const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Repeat modes: 'off' | 'all' | 'one'
export const REPEAT_MODES = ['off', 'all', 'one'];

export const PlayerProvider = ({ children }) => {
  const [tracks, setTracks] = useState(initialTracks);
  const [currentTrack, setCurrentTrack] = useState(initialTracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Equalizer state
  const [eqEnabled, setEqEnabled] = useState(false);
  const [eqPreset, setEqPreset] = useState('flat');
  const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [bassBoost, setBassBoost] = useState(0); // 0-12 dB
  const [localFolders, setLocalFolders] = useState([]); // { name, path, trackIds[], cover }
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Get current user from Auth
  const { currentUser } = useAuth();

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const eqFiltersRef = useRef([]);
  const bassBoostFilterRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // ─── Initialize Web Audio API EQ ───
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // Create 10-band equalizer filters
      const filters = EQ_FREQUENCIES.map((freq) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });
      eqFiltersRef.current = filters;

      // Bass boost filter
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 150;
      bassFilter.gain.value = 0;
      bassBoostFilterRef.current = bassFilter;

      // Gain node for master volume
      const gainNode = ctx.createGain();
      gainNodeRef.current = gainNode;

      // Chain: source → EQ filters → bass boost → gain → destination
      let lastNode = source;
      filters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(bassFilter);
      bassFilter.connect(gainNode);
      gainNode.connect(ctx.destination);

    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }, []);

  // ─── Sync EQ gains to filters ───
  useEffect(() => {
    eqFiltersRef.current.forEach((filter, i) => {
      if (filter) {
        filter.gain.value = eqEnabled ? eqGains[i] : 0;
      }
    });
  }, [eqGains, eqEnabled]);

  // ─── Sync bass boost ───
  useEffect(() => {
    if (bassBoostFilterRef.current) {
      bassBoostFilterRef.current.gain.value = eqEnabled ? bassBoost : 0;
    }
  }, [bassBoost, eqEnabled]);

  // ─── Apply EQ preset ───
  const applyEqPreset = useCallback((presetKey) => {
    const preset = EQ_PRESETS[presetKey];
    if (preset) {
      setEqPreset(presetKey);
      setEqGains([...preset.gains]);
    }
  }, []);

  // ─── Set individual EQ band ───
  const setEqBand = useCallback((index, value) => {
    setEqGains(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setEqPreset('custom');
  }, []);

  // ─── Sync audio playback ───
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Init audio context on first play (required by browser autoplay policy)
        if (!audioContextRef.current) {
          initAudioContext();
        }
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play().catch(e => console.log("Playback prevented:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, initAudioContext]);

  // ─── Sync volume ───
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // ─── Sync playback speed ───
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // ─── Cycle repeat mode ───
  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const idx = REPEAT_MODES.indexOf(prev);
      return REPEAT_MODES[(idx + 1) % REPEAT_MODES.length];
    });
  }, []);

  const playTrack = useCallback((track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Playback prevented:", e));
      }
    }, 0);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const nextTrack = useCallback(() => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    let nextTrackTarget;
    if (shuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * tracks.length);
      } while (randomIndex === currentIndex && tracks.length > 1);
      nextTrackTarget = tracks[randomIndex];
    } else {
      const nextIndex = (currentIndex + 1) % tracks.length;
      nextTrackTarget = tracks[nextIndex];
    }
    playTrack(nextTrackTarget);
  }, [currentTrack, tracks, shuffle, playTrack]);

  const previousTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    playTrack(tracks[prevIndex]);
  }, [currentTrack, tracks, playTrack]);

  // Read local files — preserves folder structure via webkitRelativePath
  const addLocalFiles = useCallback(async (files, autoPlay = true) => {
    const fileArray = Array.from(files);
    const folderMap = {}; // path → { name, tracks[] }
    const tracksWithBlobs = []; // for IndexedDB saving

    const newTracks = fileArray.map((file, idx) => {
      const audioUrl = URL.createObjectURL(file);
      const trackId = `local-${Date.now()}-${idx}`;

      // Extract folder info from webkitRelativePath
      let folderPath = '';
      let folderName = 'Unsorted';
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          const dirParts = parts.slice(0, -1);
          folderPath = dirParts.join('/');
          folderName = dirParts[dirParts.length - 1];
        }
      }

      // Group into folder map
      if (folderPath) {
        if (!folderMap[folderPath]) {
          folderMap[folderPath] = {
            name: folderName,
            path: folderPath,
            trackIds: [],
          };
        }
        folderMap[folderPath].trackIds.push(trackId);
      }

      const track = {
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Device',
        album: folderName,
        duration: '--:--',
        cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
        audioSrc: audioUrl,
        isLocal: true,
        folder: folderPath || null,
        folderName: folderName,
      };

      // Keep file blob for IndexedDB
      tracksWithBlobs.push({ track, blob: file });

      return track;
    });

    // Build folder objects
    const newFolders = Object.values(folderMap).map(f => ({
      ...f,
      id: `folder-${Date.now()}-${f.path}`,
      cover: newTracks.find(t => f.trackIds.includes(t.id))?.cover,
      songCount: f.trackIds.length,
    }));

    setTracks(prev => [...newTracks, ...prev]);
    if (newFolders.length > 0) {
      setLocalFolders(prev => {
        const updated = [...newFolders, ...prev];
        // Save folder metadata to IndexedDB
        if (currentUser?.uid) {
          saveLibraryMeta(currentUser.uid, updated).catch(e => console.warn('Failed to save folder meta:', e));
        }
        return updated;
      });
    }
    if (autoPlay && newTracks.length > 0) {
      playTrack(newTracks[0]);
    }

    // ─── Persist audio blobs to IndexedDB ───
    if (currentUser?.uid) {
      try {
        await saveAudioFiles(currentUser.uid, tracksWithBlobs);
        console.log(`✅ Saved ${tracksWithBlobs.length} tracks to browser storage`);
      } catch (e) {
        console.warn('Failed to save audio files to IndexedDB:', e);
      }
    }
  }, [playTrack, currentUser]);

  // ─── Restore local library from IndexedDB on login ───
  useEffect(() => {
    if (!currentUser?.uid) {
      setLibraryLoading(false);
      return;
    }

    const restoreLibrary = async () => {
      try {
        setLibraryLoading(true);
        const savedFiles = await loadAllAudioFiles(currentUser.uid);
        const savedMeta = await loadLibraryMeta(currentUser.uid);

        if (savedFiles.length > 0) {
          // Reconstruct tracks from saved blobs
          const restoredTracks = savedFiles.map(file => {
            const audioUrl = URL.createObjectURL(file.blob);
            return {
              id: file.id,
              title: file.title,
              artist: file.artist || 'Local Device',
              album: file.album || 'Local Files',
              duration: '--:--',
              cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
              audioSrc: audioUrl,
              isLocal: true,
              folder: file.folder || null,
              folderName: file.folderName || 'Unsorted',
            };
          });

          setTracks(prev => [...restoredTracks, ...prev]);
          console.log(`✅ Restored ${restoredTracks.length} local tracks from browser storage`);
        }

        if (savedMeta?.folders?.length > 0) {
          setLocalFolders(savedMeta.folders);
          console.log(`✅ Restored ${savedMeta.folders.length} folders from browser storage`);
        }
      } catch (e) {
        console.warn('Failed to restore local library:', e);
      } finally {
        setLibraryLoading(false);
      }
    };

    restoreLibrary();
  }, [currentUser?.uid]);

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    setCurrentTime(current);
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all') {
      nextTrack();
    } else {
      // 'off' — stop at end of queue
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex < tracks.length - 1) {
        nextTrack();
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    }
  };

  const handleSeek = (pct) => {
    if (audioRef.current && audioRef.current.duration > 0) {
      const seekTime = (pct / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
      setProgress(pct);
      setCurrentTime(seekTime);
    }
  };

  // Format seconds to m:ss
  const formatSeconds = useCallback((secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const value = {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    shuffle,
    repeatMode,
    playbackSpeed,
    tracks,
    // EQ
    eqEnabled,
    eqPreset,
    eqGains,
    bassBoost,
    EQ_PRESETS,
    EQ_FREQUENCIES,
    // Actions
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    setTracks,
    setProgress: handleSeek,
    setVolume,
    addLocalFiles,
    localFolders,
    libraryLoading,
    setShuffle: () => setShuffle((p) => !p),
    cycleRepeat,
    setRepeatMode,
    setPlaybackSpeed,
    setEqEnabled,
    applyEqPreset,
    setEqBand,
    setBassBoost,
    formatSeconds,
    audioRef,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* The invisible audio brain */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioSrc || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        crossOrigin="anonymous"
      />
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
