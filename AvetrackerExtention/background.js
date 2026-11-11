let lastRespondTime = 0;
const COOLDOWN = 5000;

// Создаем скрытый документ (Offscreen Document), который живет вечно
async function setupOffscreenDocument() {
    // Проверяем существующие контексты через правильный namespace
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) return;

    // Вызываем метод корректно через chrome.offscreen
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['BLOBS'],
        justification: 'Keep persistent WebSocket connection to Twitch chat'
    });
}

async function initBot() {
    const config = await chrome.storage.local.get(["twitch_channel", "twitch_token"]);
    if (!config.twitch_channel || !config.twitch_token) return;

    await setupOffscreenDocument();

    // Передаем данные для подключения в оффскрин-скрипт
    chrome.runtime.sendMessage({
        action: "initConnect",
        config: {
            channel: config.twitch_channel,
            token: config.twitch_token
        }
    });
}

// Обработка запроса трека, когда в чате написали !трек
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "restartBot") {
        initBot();
        sendResponse({ success: true });
    }

    if (request.action === "requestTrack") {
        const now = Date.now();
        if (now - lastRespondTime > COOLDOWN) {
            lastRespondTime = now;
            const channel = request.channel;

            chrome.tabs.query({ url: "*://*.music.yandex.ru/*" }, (tabs) => {
                if (tabs.length === 0) {
                    sendToTwitch(channel, "Вкладка Яндекс Музыки не найдена");
                    return;
                }

                chrome.tabs.sendMessage(tabs[0].id, { action: "getTrack" }, (response) => {
                    if (chrome.runtime.lastError) {
                        sendToTwitch(channel, "Не удалось прочитать трек из вкладки");
                        return;
                    }
                    const trackText = response ? response.track : "Сейчас ничего не играет";
                    sendToTwitch(channel, trackText);
                });
            });
        }
    }
});

function sendToTwitch(channel, text) {
    chrome.runtime.sendMessage({
        action: "sendChat",
        channel: channel,
        text: text
    });
}

// Запуск при старте
initBot();