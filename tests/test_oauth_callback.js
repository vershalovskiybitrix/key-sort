"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

let saved;
const context = {
  location: {
    origin: "https://oauth.yandex.ru",
    pathname: "/verification_code",
    hash: "#access_token=test-token&expires_in=31536000"
  },
  chrome: { runtime: { sendMessage: async value => { saved = value; return { ok: true }; } } },
  document: { title: "", body: { textContent: "" } },
  window: { close() {} },
  URLSearchParams,
  setTimeout(callback) { callback(); }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("chrome-extension/oauth-callback.js", "utf8"), context);
setImmediate(() => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(saved)), { action: "DIRECT_OAUTH_CALLBACK", token: "test-token" });
  assert.strictEqual(context.document.title, "Авторизация завершена");
  console.log("oauth callback tests passed");
});
