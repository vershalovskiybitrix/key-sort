"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

let listener;
const requests = [];
const stored = { cloudApiKey: "cloud-secret", folderId: "folder-id", directOAuthToken: "direct-secret" };
const context = {
  chrome: {
    storage: { local: {
      get: async keys => {
        if (typeof keys === "string") return { [keys]: stored[keys] };
        return stored;
      },
      set: async values => Object.assign(stored, values),
      remove: async key => { delete stored[key]; }
    } },
    runtime: { onMessage: { addListener(callback) { listener = callback; } }, openOptionsPage: async () => {}, getManifest: () => ({ version: "1.0.1" }) }
  },
  fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => {
      if (url.includes("getRegionsTree")) return { regions: [{ id: "225", label: "Россия" }] };
      if (url.includes("wordstat")) return { totalCount: 12, results: [] };
      if (url.includes("dictionaries")) return { result: { GeoRegions: [{ GeoRegionId: 225, GeoRegionName: "Россия", GeoRegionType: "Country", ParentId: null }] } };
      return { data: 77 };
    } };
  },
  Set,
  Error,
  Number,
  String,
  Array,
  Object,
  Boolean,
  JSON,
  Map,
  crypto: { randomUUID: () => "forecast-session" }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("chrome-extension/background.js", "utf8"), context);

function send(action, payload = {}) {
  return new Promise(resolve => {
    const keepOpen = listener({ action, payload }, { tab: { url: "https://key-sort.vershalovskiy.com/keyword-parser.html" } }, resolve);
    assert.strictEqual(keepOpen, true);
  });
}

(async () => {
  const status = await send("STATUS");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(status.data)), { version: "1.0.1", wordstatDailyLimit: 500, forecastSafety: true, forecastHourlyLimit: 30, forecastDailyLimit: 100, forecastAutoResume: true, "API-ключ Yandex Cloud": true, "ID каталога": true, "OAuth-токен Директа": true });
  assert.ok(!JSON.stringify(status).includes("cloud-secret"));

  const wordstat = await send("WORDSTAT_TOP", { phrase: "купить диван", numPhrases: 25, regions: ["213"] });
  assert.strictEqual(wordstat.ok, true);
  assert.strictEqual(stored.wordstatTimestamps.length, 1);
  assert.strictEqual(requests[0].options.headers.Authorization, "Api-Key cloud-secret");
  assert.deepStrictEqual(JSON.parse(requests[0].options.body), { phrase: "купить диван", numPhrases: 25, folderId: "folder-id", regions: ["213"] });
  stored.wordstatDailyLimit = 2;
  stored.wordstatTimestamps = [Date.now(), Date.now()];
  const wordstatLimited = await send("WORDSTAT_TOP", { phrase: "купить кресло" });
  assert.strictEqual(wordstatLimited.ok, false);
  assert.strictEqual(wordstatLimited.code, "WORDSTAT_DAILY_LIMIT");
  assert.match(wordstatLimited.error, /настройки расширения/);
  assert.ok(wordstatLimited.retryAfter > 0);
  assert.strictEqual(requests.length, 1);
  delete stored.wordstatDailyLimit;
  delete stored.wordstatTimestamps;

  const session = await send("DIRECT_FORECAST_BEGIN");
  const concurrent = await send("DIRECT_FORECAST_BEGIN");
  assert.strictEqual(concurrent.ok, false);
  assert.match(concurrent.error, /уже выполняется/);
  const created = await send("DIRECT_CALL", { method: "CreateNewForecast", param: { Phrases: ["купить диван"] }, sessionId: session.data.sessionId });
  assert.strictEqual(created.ok, true);
  const foreignForecast = await send("DIRECT_CALL", { method: "GetForecast", param: 88, sessionId: session.data.sessionId });
  assert.strictEqual(foreignForecast.ok, false);
  assert.match(foreignForecast.error, /не создавало/);
  const direct = await send("DIRECT_CALL", { method: "GetForecast", param: 77, sessionId: session.data.sessionId });
  assert.strictEqual(direct.ok, true);
  assert.deepStrictEqual(JSON.parse(requests[2].options.body), { method: "GetForecast", locale: "ru", token: "direct-secret", param: 77 });
  stored.directForecastTimestamps = Array(30).fill(Date.now());
  const limited = await send("DIRECT_CALL", { method: "CreateNewForecast", param: { Phrases: ["ещё фраза"] }, sessionId: session.data.sessionId });
  assert.strictEqual(limited.ok, false);
  assert.strictEqual(limited.code, "FORECAST_RATE_LIMIT");
  assert.ok(limited.retryAfter > 0);
  delete stored.directForecastTimestamps;
  stored.forecastHourlyLimit = 2;
  stored.forecastDailyLimit = 5;
  stored.forecastAutoResume = false;
  const customStatus = await send("STATUS");
  assert.strictEqual(customStatus.data.forecastHourlyLimit, 2);
  assert.strictEqual(customStatus.data.forecastDailyLimit, 5);
  assert.strictEqual(customStatus.data.forecastAutoResume, false);
  stored.directForecastTimestamps = Array(2).fill(Date.now());
  const customLimited = await send("DIRECT_CALL", { method: "CreateNewForecast", param: { Phrases: ["лимит"] }, sessionId: session.data.sessionId });
  assert.strictEqual(customLimited.code, "FORECAST_RATE_LIMIT");
  delete stored.directForecastTimestamps;

  const wordstatRegions = await send("WORDSTAT_REGIONS");
  assert.strictEqual(wordstatRegions.data.regions[0].label, "Россия");
  const directRegions = await send("DIRECT_REGIONS");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(directRegions.data.regions)), [{ id: 225, name: "Россия", parentId: null, type: "Country" }]);

  const forbidden = await send("DIRECT_CALL", { method: "GetCampaigns" });
  assert.strictEqual(forbidden.ok, false);
  assert.match(forbidden.error, /не разрешён/);

  const regionsContext = { window: { KeySortServices: {} }, Map, String };
  vm.createContext(regionsContext);
  vm.runInContext(fs.readFileSync("assets/region-select.js", "utf8"), regionsContext);
  const wordstatTree = regionsContext.window.KeySortRegions.normalizeWordstat([{ id: "225", name: "Россия", children: [{ id: "213", name: "Москва" }] }]);
  assert.strictEqual(wordstatTree[0].children[0].name, "Москва");
  const directTree = regionsContext.window.KeySortRegions.normalizeDirect([{ id: 225, name: "Россия", parentId: null }, { id: 213, name: "Москва", parentId: 225 }]);
  assert.strictEqual(directTree[0].children[0].id, "213");
  const oldDirectTree = regionsContext.window.KeySortRegions.normalizeDirect([{ id: 225, label: "Россия" }, { id: 213, label: "Россия → Москва" }]);
  assert.strictEqual(oldDirectTree[0].children[0].id, "213");
  const selectionTree = regionsContext.window.KeySortRegions.normalizeWordstat([
    { id: "225", label: "Россия", children: [{ id: "213", label: "Москва" }, { id: "1", label: "Область" }] },
    { id: "111", label: "Европа" }
  ]);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(regionsContext.window.KeySortRegions.compileSignedRegions(selectionTree, new Set(["225", "111"]), new Set(["213"])))),
    ["225", "111", "-213"]
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(regionsContext.window.KeySortRegions.compilePositiveRegions(selectionTree, new Set(["225", "111"]), new Set(["213"])))),
    ["1", "111"]
  );
  stored.wordstatDailyLimit = 10000;
  const cappedStatus = await send("STATUS");
  assert.strictEqual(cappedStatus.data.wordstatDailyLimit, 5000);
  stored.wordstatDailyLimit = 1;
  stored.wordstatTimestamps = [];
  const requestCount = requests.length;
  const parallel = await Promise.all([
    send("WORDSTAT_TOP", { phrase: "первый запрос" }),
    send("WORDSTAT_TOP", { phrase: "второй запрос" })
  ]);
  assert.strictEqual(parallel.filter(result => result.ok).length, 1);
  assert.strictEqual(parallel.filter(result => result.code === "WORDSTAT_DAILY_LIMIT").length, 1);
  assert.strictEqual(requests.length, requestCount + 1);
  console.log("extension tests passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
