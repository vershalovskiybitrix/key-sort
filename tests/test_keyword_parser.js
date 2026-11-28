"use strict";
const assert = require("node:assert/strict");
const core = require("../assets/keyword-parser-core.js");

const parsed = core.parseRequest("психолог -бесплатно", "онлайн, бесплатно");
assert.equal(parsed.basePhrase, "психолог");
assert.deepEqual(parsed.userMinusWords, ["бесплатно", "онлайн"]);

const automatic = Array.from({ length: 100 }, (_, index) => `слово${index}`);
const query = core.buildQuery("психолог", ["консультация"], ["бесплатно"], automatic);
assert.ok(core.chars(query) <= 399);
assert.ok(query.includes(" -бесплатно"));

const lemmaByWord = {};
const rows = [];
for (let index = 0; index < 60; index += 1) {
  const word = `слово${index}`;
  lemmaByWord[word] = { key: `lemma:${word}:NOUN`, lemma: word };
  rows.push({ phrase: `психолог ${word}`, count: 1000 - index });
}
lemmaByWord.психолог = { key: "lemma:психолог:NOUN", lemma: "психолог" };
const ranked = core.rankCandidates(rows, lemmaByWord, new Set(["lemma:психолог:NOUN"]));
assert.equal(ranked.length, 60);
assert.equal(new Set(ranked.map(item => item.key)).size, 60);
const short = Array.from({ length: 120 }, (_, n) => ({ key: String(n), lemma: "x" + n }));
const tasks = core.planLevel([{ pathWords: [], pathKeys: [] }], short, { basePhrase: "base", userMinusWords: ["exclude"] });
assert.ok(tasks.length > 60);
assert.ok(tasks.every(task => core.chars(task.query) <= 399 && task.query.includes(" -exclude")));
const repeated = core.planLevel([
  { pathWords: ["a"], pathKeys: ["a"] }, { pathWords: ["b"], pathKeys: ["b"] }
], [{ key: "a", lemma: "a" }, { key: "b", lemma: "b" }], { basePhrase: "base", userMinusWords: [] });
assert.deepEqual(repeated.map(task => task.query), ["base a b"]);
const allRows = new Map();
const changedRows = new Map();
core.mergeRows(allRows, [{ phrase: "base one", count: 8 }]);
core.mergeRows(allRows, [{ phrase: "base one", count: 6 }, { phrase: "base two", count: 9 }], changedRows);
assert.deepEqual([...changedRows.values()], [{ phrase: "base two", count: 9 }]);
assert.equal(allRows.get("base one").count, 8);

const full = Array.from({ length: 2000 }, (_, index) => ({ phrase: `фраза ${index}`, count: 11 }));
assert.equal(core.branchComplete(full), false);
full[1999].count = 10;
assert.equal(core.branchComplete(full), true);
assert.equal(core.branchComplete(full.slice(0, 1999)), true);

console.log("keyword-parser core: ok");
