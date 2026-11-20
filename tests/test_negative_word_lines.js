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

const createWordFormatter = new Function(
  `${extractFunction("wordTextToLines")}
   ${extractFunction("cleanWordText")}
   return { wordTextToLines, cleanWordText };`
);

const { wordTextToLines, cleanWordText } = createWordFormatter();

assert.equal(wordTextToLines("психолог врач,москва;онлайн"), "психолог\nврач\nмосква\nонлайн");
assert.equal(wordTextToLines("психолог\tврач\r\nмосква"), "психолог\nврач\nмосква");
assert.equal(cleanWordText("психолог / врач, москва"), "психолог\nврач\nмосква");
assert.equal(cleanWordText("психолог   ", true), "психолог");

console.log("negative word line tests passed");
