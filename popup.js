const CLIENT_ID = 'qne437hu847a1s1bfztklbqu8t91i0';

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(["twitch_channel", "twitch_token"]);
  if (data.twitch_channel) document.getElementById('channelInput').value = data.twitch_channel;
  if (data.twitch_token) document.getElementById('tokenInput').value = data.twitch_token;
});

// Автоматическая авторизация через Twitch OAuth
document.getElementById('authBtn').addEventListener('click', () => {
  // Строго официальный метод получения URI для расширений
  const redirectUri = chrome.identity.getRedirectURL();
  
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=chat:read+chat:edit`;

  console.log("Redirect URI для Twitch Console:", redirectUri); // Выведется в консоль расширения для проверки

  chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  }, (redirectedUrl) => {
    if (chrome.runtime.lastError) {
      console.error("Ошибка авторизации (LastError):", chrome.runtime.lastError.message);
      document.getElementById('status').textContent = "Ошибка: " + chrome.runtime.lastError.message;
      return;
    }
    
    if (!redirectedUrl) {
      console.error("Ошибка: пустой URL перенаправления");
      return;
    }

    const matches = redirectedUrl.match(/access_token=([^&]+)/);
    if (matches && matches[1]) {
      const token = matches[1];
      document.getElementById('tokenInput').value = token;
      
      const status = document.getElementById('status');
      status.textContent = "Токен успешно получен!";
      setTimeout(() => status.textContent = "", 3000);
    } else {
      console.error("Токен не найден в URL:", redirectedUrl);
    }
  });
});

// Сохранение и запуск
document.getElementById('saveBtn').addEventListener('click', async () => {
  const channel = document.getElementById('channelInput').value.trim();
  const token = document.getElementById('tokenInput').value.trim();

  await chrome.storage.local.set({
    twitch_channel: channel,
    twitch_token: token
  });

  const status = document.getElementById('status');
  status.textContent = "Сохранено и запуск!";
  
  chrome.runtime.sendMessage({ action: "restartBot" });

  setTimeout(() => status.textContent = "", 2500);
});