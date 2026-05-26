import CryptoJS from 'crypto-js';

// We use the local proxy to bypass CORS. 
// In dev: Vite proxy routes /api/jiosaavn to https://www.jiosaavn.com/api.php
// In prod: Netlify rewrites it using netlify.toml
const API_BASE = '/api/jiosaavn';

const decryptUrl = (encryptedUrl) => {
    if (!encryptedUrl) return '';
    try {
        const key = CryptoJS.enc.Utf8.parse("38346591");
        const decrypted = CryptoJS.DES.decrypt(
            { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
            key,
            { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
        );
        let decodedLink = decrypted.toString(CryptoJS.enc.Utf8);
        decodedLink = decodedLink.replace(/_96\.mp4/g, '_320.mp4');
        decodedLink = decodedLink.replace(/_160\.mp4/g, '_320.mp4');
        return decodedLink;
    } catch (e) {
        console.error("Decryption failed", e);
        return '';
    }
};

function decodeHTML(html) {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const mapSaavnToTrack = (song) => {
    let cover = song.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
    if (cover.includes('150x150')) cover = cover.replace('150x150', '500x500');

    // Decrypt the high quality audio link
    let audioSrc = decryptUrl(song.encrypted_media_url);
    if (!audioSrc && song.media_preview_url) {
        audioSrc = song.media_preview_url;
    }

    return {
        id: `saavn-${song.id}`,
        title: decodeHTML(song.song || song.title),
        artist: decodeHTML(song.primary_artists || song.singers || 'Unknown Artist'),
        album: decodeHTML(song.album || 'Single'),
        duration: song.duration ? formatDuration(parseInt(song.duration)) : '3:00', 
        cover: cover,
        audioSrc: audioSrc,
        isLocal: false,
        saavnId: song.id,
    };
};

export const searchSongs = async (query, limit = 10) => {
    if (!query) return [];
    try {
        // Use the official API format via our proxy
        const res = await fetch(`${API_BASE}?__call=search.getResults&q=${encodeURIComponent(query)}&n=${limit}&p=1&_format=json&_marker=0&ctx=web6dot0`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (data && data.results) {
            return data.results.map(mapSaavnToTrack);
        }
        return [];
    } catch (error) {
        console.error("Error searching JioSaavn:", error);
        return [];
    }
};

export const getTrendingSongs = async () => {
    try {
        // Search for a generic popular query to simulate trending
        const res = await fetch(`${API_BASE}?__call=search.getResults&q=top+hindi&n=15&p=1&_format=json&_marker=0&ctx=web6dot0`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (data && data.results) {
            return data.results.map(mapSaavnToTrack);
        }
        return [];
    } catch (error) {
        console.error("Error fetching trending from JioSaavn:", error);
        return [];
    }
};

export const getTrackLyrics = async (trackId) => {
    if (!trackId) return null;
    try {
        const res = await fetch(`${API_BASE}?__call=lyrics.getLyrics&lyrics_id=${trackId}&_format=json&_marker=0&ctx=web6dot0`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (data && data.lyrics) {
            // The lyrics contain <br> tags, let's keep them or parse them later
            return data.lyrics;
        }
        return null;
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        return null;
    }
};

export const parseLrc = (lrcString) => {
    if (!lrcString) return [];
    const lines = lrcString.split('\n');
    const parsed = [];
    for (let line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/);
        if (match) {
            const mins = parseInt(match[1]);
            const secs = parseFloat(match[2]);
            const time = mins * 60 + secs;
            const text = match[3].trim();
            if (text) parsed.push({ time, text });
        }
    }
    return parsed;
};

export const getSyncedLyrics = async (title, artist, durationSeconds) => {
    try {
        // Strip out brackets/parentheses for better search accuracy
        const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
        const cleanArtist = artist.split(',')[0].trim(); // use first artist
        
        // Try exact match first
        let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}&duration=${durationSeconds}`;
        let res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data.syncedLyrics) return parseLrc(data.syncedLyrics);
        }
        
        // Fallback to search
        url = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}`;
        res = await fetch(url);
        if (res.ok) {
            const results = await res.json();
            // Find first result with synced lyrics
            const synced = results.find(r => r.syncedLyrics);
            if (synced) return parseLrc(synced.syncedLyrics);
        }
        return null;
    } catch (error) {
        console.error("LrcLib error:", error);
        return null;
    }
};
