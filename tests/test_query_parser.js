"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "assets", "app.js"), "utf8");
const match = source.match(/function parseQueryLine\(line\) \{[\s\S]*?\n    \}/u);
assert.ok(match, "parseQueryLine not found");

const createParser = checked => new Function(
  "frequencyMode",
  `"use strict"; ${match[0]}; return parseQueryLine;`
)({ checked });

const parse = createParser(true);
assert.deepEqual(parse("вопросы психологу\t52 723"), { phrase: "вопросы психологу", frequency: "52723" });
assert.deepEqual(parse("бесплатный психолог\t51\u00A0569"), { phrase: "бесплатный психолог", frequency: "51569" });
assert.deepEqual(parse("психолог для детей\t47\u202F957"), { phrase: "психолог для детей", frequency: "47957" });
assert.deepEqual(parse("психолог москва,41 800"), { phrase: "психолог москва", frequency: "41800" });
assert.deepEqual(parse("психологический 2026"), { phrase: "психологический 2026", frequency: "" });
assert.deepEqual(createParser(false)("вопросы психологу\t52 723"), { phrase: "вопросы психологу\t52 723", frequency: "" });

console.log("query parser tests passed");
