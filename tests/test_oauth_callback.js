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
  chrome: { storage: { local: { set: async value => { saved = value; } } } },
  document: { title: "", body: { textContent: "" } },
  window: { close() {} },
  URLSearchParams,
  setTimeout(callback) { callback(); }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("chrome-extension/oauth-callback.js", "utf8"), context);
setImmediate(() => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(saved)), { directOAuthToken: "test-token" });
  assert.strictEqual(context.document.title, "Авторизация завершена");
  console.log("oauth callback tests passed");
});
