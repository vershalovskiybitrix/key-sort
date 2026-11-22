"use strict";

const SITE = "https://key-sort.vershalovskiy.com/";
const WORDSTAT_URL = "https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests";
const WORDSTAT_REGIONS_URL = "https://searchapi.api.cloud.yandex.net/v2/wordstat/getRegionsTree";
const DIRECT_URL = "https://api.direct.yandex.ru/live/v4/json/";
const DIRECT_DICTIONARIES_URL = "https://api.direct.yandex.ru/json/v5/dictionaries";
const ALLOWED_DIRECT_METHODS = new Set(["CreateNewForecast", "GetForecastList", "GetForecast", "DeleteForecastReport"]);

function pageRequest(sender) {
  return Boolean(sender.tab?.url?.startsWith(SITE));
}

async function settings() {
  return chrome.storage.local.get(["cloudApiKey", "folderId", "directOAuthToken"]);
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error_str || `HTTP ${response.status}`);
  if (data.error_code || data.error) throw new Error(data.error_str || data.error?.error_string || data.error?.message || `Ошибка API ${data.error_code}`);
  return data;
}

async function wordstat(payload) {
  const config = await settings();
  if (!config.cloudApiKey || !config.folderId) throw new Error("Заполните API-ключ Yandex Cloud и ID каталога в настройках расширения");
  const phrase = String(payload.phrase || "").trim();
  if (!phrase) throw new Error("Пустой запрос");
  const numPhrases = Math.max(1, Math.min(2000, Number(payload.numPhrases) || 2000));
  const body = { phrase, numPhrases, folderId: config.folderId };
  if (Array.isArray(payload.regions) && payload.regions.length) body.regions = payload.regions.map(String).slice(0, 50);
  const response = await fetch(WORDSTAT_URL, {
    method: "POST",
    headers: { "Authorization": `Api-Key ${config.cloudApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

async function wordstatRegions() {
  const config = await settings();
  if (!config.cloudApiKey || !config.folderId) throw new Error("Заполните API-ключ Yandex Cloud и ID каталога в настройках расширения");
  const response = await fetch(WORDSTAT_REGIONS_URL, {
    method: "POST",
    headers: { "Authorization": `Api-Key ${config.cloudApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ folderId: config.folderId })
  });
  return parseResponse(response);
}

async function directRegions() {
  const config = await settings();
  if (!config.directOAuthToken) throw new Error("Заполните OAuth-токен Директа в настройках расширения");
  const response = await fetch(DIRECT_DICTIONARIES_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.directOAuthToken}`, "Accept-Language": "ru", "Content-Type": "application/json" },
    body: JSON.stringify({ method: "get", params: { DictionaryNames: ["GeoRegions"] } })
  });
  const data = await parseResponse(response);
  const items = data.result?.GeoRegions || [];
  return {
    regions: items.map(item => ({
      id: item.GeoRegionId,
      name: item.GeoRegionName,
      parentId: item.ParentId,
      type: item.GeoRegionType
    }))
  };
}

async function direct(payload) {
  const config = await settings();
  if (!config.directOAuthToken) throw new Error("Заполните OAuth-токен Директа в настройках расширения");
  if (!ALLOWED_DIRECT_METHODS.has(payload.method)) throw new Error("Метод Директа не разрешён расширением");
  const request = { method: payload.method, locale: "ru", token: config.directOAuthToken };
  if (Object.prototype.hasOwnProperty.call(payload, "param")) request.param = payload.param;
  const response = await fetch(DIRECT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
  return parseResponse(response);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!pageRequest(sender)) return false;
  (async () => {
    if (message.action === "STATUS") {
      const config = await settings();
      return { version: chrome.runtime.getManifest().version, "API-ключ Yandex Cloud": Boolean(config.cloudApiKey), "ID каталога": Boolean(config.folderId), "OAuth-токен Директа": Boolean(config.directOAuthToken) };
    }
    if (message.action === "OPEN_OPTIONS") { await chrome.runtime.openOptionsPage(); return true; }
    if (message.action === "WORDSTAT_TOP") return wordstat(message.payload || {});
    if (message.action === "WORDSTAT_REGIONS") return wordstatRegions();
    if (message.action === "DIRECT_REGIONS") return directRegions();
    if (message.action === "DIRECT_CALL") return direct(message.payload || {});
    throw new Error("Неизвестное действие");
  })().then(data => sendResponse({ ok: true, data })).catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});
