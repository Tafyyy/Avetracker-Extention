let currentTrack = "Музыка не играет";

setInterval(() => {
    try {
        let track = null;
        if (navigator.mediaSession && navigator.mediaSession.metadata) {
            const m = navigator.mediaSession.metadata;
            if (m.artist && m.title) {
                track = `${m.artist} — ${m.title}`;
            }
        }
        if (!track && document.title.includes(" — ")) {
            track = document.title.split(" — Яндекс Музыка")[0].trim();
        }
        
        const isPlaying = navigator.mediaSession?.playbackState === 'playing';
        currentTrack = (isPlaying && track) ? `🎵 ${track}` : "Сейчас ничего не играет";
    } catch (e) {
        currentTrack = "Музыка не играет";
    }
}, 2000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTrack") {
        sendResponse({ track: currentTrack });
    }
});