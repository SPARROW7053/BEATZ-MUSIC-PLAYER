/**
 * localMusicDB.js — IndexedDB utility for persisting local music files.
 * 
 * Database structure:
 *   Store: "audioFiles"
 *     key: trackId (string)
 *     value: { id, blob, title, artist, album, folder, folderName, fileName }
 * 
 *   Store: "metadata"
 *     key: "library"
 *     value: { tracks: [...], folders: [...] }
 * 
 * All data is scoped per user via a userId prefix in the DB name.
 */

const DB_VERSION = 1;

/**
 * Open (or create) the IndexedDB for a given user
 */
function openDB(userId) {
  const dbName = `beatz_music_${userId}`;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Store for actual audio file blobs
      if (!db.objectStoreNames.contains('audioFiles')) {
        db.createObjectStore('audioFiles', { keyPath: 'id' });
      }
      // Store for library metadata (lightweight)
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save an audio file blob to IndexedDB
 */
export async function saveAudioFile(userId, track, blob) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioFiles', 'readwrite');
    const store = tx.objectStore('audioFiles');

    store.put({
      id: track.id,
      blob: blob,
      title: track.title,
      artist: track.artist,
      album: track.album,
      folder: track.folder || null,
      folderName: track.folderName || 'Unsorted',
      fileName: track.title, // original file name without extension
    });

    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save multiple audio files at once
 */
export async function saveAudioFiles(userId, tracksWithBlobs) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioFiles', 'readwrite');
    const store = tx.objectStore('audioFiles');

    tracksWithBlobs.forEach(({ track, blob }) => {
      store.put({
        id: track.id,
        blob: blob,
        title: track.title,
        artist: track.artist,
        album: track.album,
        folder: track.folder || null,
        folderName: track.folderName || 'Unsorted',
        fileName: track.title,
      });
    });

    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Load ALL audio files from IndexedDB for a user
 * Returns array of { id, blob, title, artist, album, folder, folderName }
 */
export async function loadAllAudioFiles(userId) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioFiles', 'readonly');
    const store = tx.objectStore('audioFiles');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete an audio file from IndexedDB
 */
export async function deleteAudioFile(userId, trackId) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioFiles', 'readwrite');
    const store = tx.objectStore('audioFiles');
    store.delete(trackId);

    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Clear all audio files for a user
 */
export async function clearAllAudioFiles(userId) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audioFiles', 'readwrite');
    const store = tx.objectStore('audioFiles');
    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save library metadata (folders structure) to IndexedDB
 */
export async function saveLibraryMeta(userId, folders) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put({ folders }, 'library');

    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Load library metadata from IndexedDB
 */
export async function loadLibraryMeta(userId) {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const request = store.get('library');

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (e) => reject(e.target.error);
  });
}
