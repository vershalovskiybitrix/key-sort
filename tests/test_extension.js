"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

let listener;
const requests = [];
const stored = { cloudApiKey: "cloud-secret", folderId: "folder-id", directOAuthToken: "direct-secret" };
const context = {
  chrome: {
    storage: { local: { get: async () => stored } },
    runtime: { onMessage: { addListener(callback) { listener = callback; } }, openOptionsPage: async () => {}, getManifest: () => ({ version: "1.1.0" }) }
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
  Map
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
  assert.deepStrictEqual(JSON.parse(JSON.stringify(status.data)), { version: "1.1.0", "API-ключ Yandex Cloud": true, "ID каталога": true, "OAuth-токен Директа": true });
  assert.ok(!JSON.stringify(status).includes("cloud-secret"));

  const wordstat = await send("WORDSTAT_TOP", { phrase: "купить диван", numPhrases: 25, regions: ["213"] });
  assert.strictEqual(wordstat.ok, true);
  assert.strictEqual(requests[0].options.headers.Authorization, "Api-Key cloud-secret");
  assert.deepStrictEqual(JSON.parse(requests[0].options.body), { phrase: "купить диван", numPhrases: 25, folderId: "folder-id", regions: ["213"] });

  const direct = await send("DIRECT_CALL", { method: "GetForecast", param: 77 });
  assert.strictEqual(direct.ok, true);
  assert.deepStrictEqual(JSON.parse(requests[1].options.body), { method: "GetForecast", locale: "ru", token: "direct-secret", param: 77 });

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
  console.log("extension tests passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
