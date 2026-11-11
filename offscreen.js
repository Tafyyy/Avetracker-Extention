let ws = null;
let configData = null;

// Слушаем сообщения от background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "initConnect") {
        configData = message.config;
        connectPersistentTwitch();
    }
});

function connectPersistentTwitch() {
    if (!configData) return;
    if (ws && ws.readyState === WebSocket.OPEN) return;

    const channel = configData.channel.toLowerCase().trim();
    const token = configData.token.trim();

    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    ws.onopen = () => {
        console.log("AVETRACKER (Offscreen): Подключено к Twitch вечно!");
        setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(`PASS oauth:${token}`);
                ws.send(`NICK ${channel}`);
                ws.send(`JOIN #${channel}`);
            }
        }, 200);
    };

    ws.onmessage = (event) => {
        const msg = event.data;
        if (msg.startsWith("PING")) {
            ws.send("PONG :tmi.twitch.tv");
            return;
        }

        if (msg.includes("PRIVMSG")) {
            const textMatch = msg.match(/PRIVMSG #[^ ]+ :(.+)/);
            if (textMatch) {
                const text = textMatch[1].trim().toLowerCase();
                if (text === "!трек" || text === "!track" || text === "!song") {
                    // Пересылаем запрос в background.js для получения трека из вкладки Яндекса
                    chrome.runtime.sendMessage({ action: "requestTrack", channel: channel });
                }
            }
        }
    };

    ws.onclose = () => {
        ws = null;
        setTimeout(connectPersistentTwitch, 5000); // Автореконнект
    };

    ws.onerror = () => {
        if (ws) ws.close();
    };
}

// Функция отправки сообщения в чат из оффскрин-документа
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "sendChat" && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(`PRIVMSG #${message.channel} :${message.text}`);
    }
});