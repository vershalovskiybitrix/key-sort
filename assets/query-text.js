((root) => {
  "use strict";
  function words(text, compound = false) {
    const pattern = compound ? /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+|\.\d+)*/gu : /[\p{L}\p{N}]+(?:\.\d+)?/gu;
    return text.normalize("NFC").toLocaleLowerCase("ru-RU").match(pattern) || [];
  }
  function splitFrequency(line) {
    const match = line.match(/^(.*?)(?:\s*[,;]\s*|\t+)(\d(?:[\d \u00a0\u202f]*\d)?)\s*$/u);
    if (!match || !match[1].trim()) return { phrase: line, frequency: "" };
    return { phrase: match[1].trim(), frequency: match[2].replace(/[ \u00a0\u202f]/gu, "") };
  }
  const api = { words, splitFrequency };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KeySortQueryText = api;
})(globalThis);
