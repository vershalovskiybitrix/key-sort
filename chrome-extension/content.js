(() => {
  "use strict";
  const allowedOrigin = "https://key-sort.vershalovskiy.com";
  if (location.origin !== allowedOrigin) return;

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== allowedOrigin) return;
    const message = event.data;
    if (!message || message.channel !== "key-sort-extension" || message.type !== "REQUEST") return;
    chrome.runtime.sendMessage({ action: message.action, payload: message.payload || {} }, response => {
      const error = chrome.runtime.lastError?.message;
      window.postMessage({
        channel: "key-sort-extension",
        type: "RESPONSE",
        id: message.id,
        ok: !error && Boolean(response?.ok),
        data: response?.data,
        error: error || response?.error || "Расширение не выполнило запрос"
      }, allowedOrigin);
    });
  });
})();
