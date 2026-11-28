"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { id, value: "", style: {}, addEventListener() {}, dispatchEvent() {} });
  return elements.get(id);
}
const context = {
  window: { KeySortServices: { autoGrow() {}, lines() { return []; }, setStatus() {},
    pageMemory() { return { load: async () => undefined }; } } },
  document: { getElementById: element, querySelectorAll() { return []; }, querySelector: element },
  Event: function Event(type) { this.type = type; },
  Set,
  Error,
  Number
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("assets/multiplier.js", "utf8"), context);
const expand = context.window.KeySortMultiplier.expand;

assert.deepStrictEqual(Array.from(expand("{купить|заказать} диван", 20)), ["купить диван", "заказать диван"]);
assert.deepStrictEqual(Array.from(expand("[+ +a|b|c]", 20)), ["a b c", "a c b", "b a c", "b c a", "c a b", "c b a"]);
assert.deepStrictEqual(Array.from(expand("{x|[+,+a|b]}", 20)), ["x", "a,b", "b,a"]);
assert.strictEqual(expand("[a|b|c|d|e|f|g|h]", 100).length, 100);
assert.throws(() => expand("{a|b", 20), /Незакрытая/);
console.log("multiplier tests passed");
