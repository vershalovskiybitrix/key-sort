(() => {
  "use strict";

  let sequence = 0;
  const pending = new Map();

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (!message || message.channel !== "key-sort-extension" || message.type !== "RESPONSE") return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.ok) request.resolve(message.data);
    else request.reject(new Error(message.error || "Расширение вернуло ошибку"));
  });

  function requestExtension(action, payload = {}, timeout = 45000) {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${++sequence}`;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("Расширение Key Sort не отвечает"));
      }, timeout);
      pending.set(id, { resolve, reject, timer });
      window.postMessage({ channel: "key-sort-extension", type: "REQUEST", id, action, payload }, location.origin);
    });
  }

  function setStatus(element, text, error = false) {
    element.textContent = text;
    element.classList.toggle("error", error);
  }

  function openExtensionInstall(label) {
    const installUrl = new URL("extension-install.html", location.href).href;
    window.open(installUrl, "_blank", "noopener,noreferrer");
    const link = document.createElement("a");
    link.href = installUrl;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = "Открыть страницу установки";
    label.replaceChildren(document.createTextNode("Расширение не установлено. "), link);
  }

  async function bindExtensionState(required) {
    const root = document.querySelector("[data-extension-state]");
    if (!root) return;
    const label = root.querySelector("[data-extension-label]");
    const settings = root.querySelector("[data-extension-settings]");
    settings.addEventListener("click", () => requestExtension("OPEN_OPTIONS").catch(() => {}));
    try {
      const state = await requestExtension("STATUS", {}, 1500);
      if (!state.version) {
        openExtensionInstall(label);
        return;
      }
      const missing = required.filter(name => !state[name]);
      label.textContent = missing.length ? `Расширение подключено. Не заполнено: ${missing.join(", ")}.` : "Расширение подключено и настроено.";
    } catch {
      openExtensionInstall(label);
    }
  }

  function lines(value) {
    return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  function autoGrow(textarea, maxRows = 20) {
    const resize = () => {
      textarea.style.height = "auto";
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 18;
      const max = lineHeight * maxRows + 28;
      textarea.style.height = `${Math.min(textarea.scrollHeight, max)}px`;
    };
    textarea.addEventListener("input", resize);
    resize();
  }

  window.KeySortServices = { requestExtension, setStatus, bindExtensionState, lines, autoGrow };
})();
