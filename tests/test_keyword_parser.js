"use strict";
const assert = require("node:assert/strict");
const core = require("../assets/keyword-parser-core.js");

const parsed = core.parseRequest("психолог -бесплатно", "онлайн, бесплатно");
assert.equal(parsed.basePhrase, "психолог");
assert.deepEqual(parsed.userMinusWords, ["бесплатно", "онлайн"]);

const automatic = Array.from({ length: 100 }, (_, index) => `слово${index}`);
const query = core.buildQuery("психолог", ["консультация"], ["бесплатно"], automatic);
assert.ok(core.chars(query) <= 400);
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
assert.equal(ranked.length, 40);
assert.equal(new Set(ranked.map(item => item.key)).size, 40);

const full = Array.from({ length: 2000 }, (_, index) => ({ phrase: `фраза ${index}`, count: 11 }));
assert.equal(core.branchComplete(full), false);
full[1999].count = 10;
assert.equal(core.branchComplete(full), true);
assert.equal(core.branchComplete(full.slice(0, 1999)), true);

console.log("keyword-parser core: ok");
