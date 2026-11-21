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
    runtime: { onMessage: { addListener(callback) { listener = callback; } }, openOptionsPage: async () => {} }
  },
  fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => url.includes("wordstat") ? { totalCount: 12, results: [] } : { data: 77 } };
  },
  Set,
  Error,
  Number,
  String,
  Array,
  Object,
  Boolean,
  JSON
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("chrome-extension/background.js", "utf8"), context);

function send(action, payload = {}) {
  return new Promise(resolve => {
    const keepOpen = listener({ action, payload }, { tab: { url: "https://key-sort.vershalovskiy.com/services.html" } }, resolve);
    assert.strictEqual(keepOpen, true);
  });
}

(async () => {
  const status = await send("STATUS");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(status.data)), { "API-ключ Yandex Cloud": true, "ID каталога": true, "OAuth-токен Директа": true });
  assert.ok(!JSON.stringify(status).includes("cloud-secret"));

  const wordstat = await send("WORDSTAT_TOP", { phrase: "купить диван", numPhrases: 25, regions: ["213"] });
  assert.strictEqual(wordstat.ok, true);
  assert.strictEqual(requests[0].options.headers.Authorization, "Api-Key cloud-secret");
  assert.deepStrictEqual(JSON.parse(requests[0].options.body), { phrase: "купить диван", numPhrases: 25, folderId: "folder-id", regions: ["213"] });

  const direct = await send("DIRECT_CALL", { method: "GetForecast", param: 77 });
  assert.strictEqual(direct.ok, true);
  assert.deepStrictEqual(JSON.parse(requests[1].options.body), { method: "GetForecast", locale: "ru", token: "direct-secret", param: 77 });

  const forbidden = await send("DIRECT_CALL", { method: "GetCampaigns" });
  assert.strictEqual(forbidden.ok, false);
  assert.match(forbidden.error, /не разрешён/);
  console.log("extension tests passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
