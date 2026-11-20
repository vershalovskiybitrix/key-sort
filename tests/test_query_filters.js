"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "assets", "app.js"), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} not found`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === "{") depth++;
    else if (source[index] === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} is incomplete`);
}

const createFilter = new Function(
  "frequencyMode",
  "queryTextFilter",
  "frequencyFilterValue",
  "frequencyFilterOperator",
  "lengthChecks",
  "getWords",
  `${extractFunction("activeLengths")}
   ${extractFunction("parseQueryLine")}
   ${extractFunction("activeQueryTextFilter")}
   ${extractFunction("activeFrequencyFilter")}
   ${extractFunction("visibleByFilters")}
   return visibleByFilters;`
);

const frequencyMode = { checked: true };
const queryTextFilter = { value: "" };
const frequencyFilterValue = { value: "" };
const frequencyFilterOperator = { value: "gt" };
const filter = createFilter(
  frequencyMode,
  queryTextFilter,
  frequencyFilterValue,
  frequencyFilterOperator,
  [],
  text => text.trim().split(/\s+/u).filter(Boolean)
);
const rows = [
  { id: "1", line: "вопросы психологу\t52 723" },
  { id: "2", line: "бесплатный психолог\t51 569" },
  { id: "3", line: "психолог для детей\t47 957" },
  { id: "4", line: "психолог москва\t41 800" },
  { id: "5", line: "психологический 2026" }
];

queryTextFilter.value = "ДЛЯ детей";
assert.deepEqual(filter(rows).map(row => row.id), ["3"]);

queryTextFilter.value = "";
frequencyFilterValue.value = "47957";
frequencyFilterOperator.value = "gt";
assert.deepEqual(filter(rows).map(row => row.id), ["1", "2"]);

frequencyFilterOperator.value = "lt";
assert.deepEqual(filter(rows).map(row => row.id), ["4"]);

frequencyMode.checked = false;
assert.deepEqual(filter(rows).map(row => row.id), ["1", "2", "3", "4", "5"]);

const lengthFilter = createFilter(
  { checked: true },
  { value: "" },
  { value: "" },
  { value: "gt" },
  [{ checked: true, dataset: { queryLength: "3" } }],
  text => text.trim().split(/\s+/u).filter(Boolean)
);
assert.deepEqual(lengthFilter(rows).map(row => row.id), ["3"]);

console.log("query filter tests passed");
