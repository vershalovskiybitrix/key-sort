(() => {
  "use strict";
  if (location.origin !== "https://oauth.yandex.ru" || location.pathname !== "/verification_code") return;
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get("access_token");
  if (!token) return;
  chrome.storage.local.set({ directOAuthToken: token }).then(() => {
    document.title = "Авторизация завершена";
    document.body.textContent = "Токен сохранён в расширении. Эту вкладку можно закрыть.";
    setTimeout(() => window.close(), 800);
  });
})();
