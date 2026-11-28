"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "assets", "app.js"), "utf8");
const match = source.match(/function parseQueryLine\(line\) \{[\s\S]*?\n    \}/u);
assert.ok(match, "parseQueryLine not found");

const createParser = checked => new Function(
  "frequencyMode",
  "window",
  `"use strict"; ${match[0]}; return parseQueryLine;`
)({ checked }, { KeySortQueryText: require("../assets/query-text.js") });

const parse = createParser(true);
assert.deepEqual(parse("вопросы психологу\t52 723"), { phrase: "вопросы психологу", frequency: "52723" });
assert.deepEqual(parse("бесплатный психолог\t51\u00A0569"), { phrase: "бесплатный психолог", frequency: "51569" });
assert.deepEqual(parse("психолог для детей\t47\u202F957"), { phrase: "психолог для детей", frequency: "47957" });
assert.deepEqual(parse("психолог москва,41 800"), { phrase: "психолог москва", frequency: "41800" });
assert.deepEqual(parse("психологический 2026"), { phrase: "психологический 2026", frequency: "" });
assert.deepEqual(createParser(false)("вопросы психологу\t52 723"), { phrase: "вопросы психологу\t52 723", frequency: "" });
const mergeSource = source.slice(source.indexOf("    function mergeQueryDuplicates"), source.indexOf("    function deduplicateQueries"));
const merge = new Function("parseQueryLine", `${mergeSource}; return mergeQueryDuplicates;`)(parse);
const merged = merge([{ id: "first", line: "психолог,10" }, { id: "second", line: "психологи,100" }],
  { second: "group" }, () => "психолог");
assert.deepEqual(merged.rows, [{ id: "first", line: "психолог\t100" }]);
assert.equal(merged.assignments.first, "group");
const queryText = require("../assets/query-text.js");
const minusCollect = require("../assets/minus-collect.js");
assert.deepEqual(minusCollect.queryWords("запрос,частотность\nсанкт-петербург;100\nверсия 2.0\t45"), ["санкт-петербург", "версия", "2.0"]);
assert.deepEqual(queryText.words("Санкт-Петербург 2.0"), ["санкт", "петербург", "2.0"]);
const pronouns = minusCollect.collect([], ["этом", "другого", "дом"], new Map([["другого", { lemma: "другой", pos: "ADJ" }]]));
assert.deepEqual(minusCollect.visibleRows(pronouns, { withoutAdverbsAndPronouns: true }).map(row => row.lemma), ["дом"]);

console.log("query parser tests passed");
