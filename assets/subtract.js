(() => {
  "use strict";
  const api = window.KeySortServices;
  const status = document.getElementById("subtractStatus");

  function words(line) { return line.toLocaleLowerCase("ru-RU").match(/[\p{L}\p{N}-]+/gu) || []; }
  async function lemmaKeys(rows) {
    const tokens = [...new Set(rows.flatMap(words))];
    const analyses = {};
    for (let index = 0; index < tokens.length; index += 1000) {
      const response = await fetch("/api/lemmatize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ words: tokens.slice(index, index + 1000) }) });
      if (!response.ok) throw new Error(`Словарь лемм недоступен: HTTP ${response.status}`);
      Object.assign(analyses, (await response.json()).analyses || {});
    }
    return rows.map(line => words(line).map(word => analyses[word]?.key || `word:${word}`).join("|"));
  }

  document.getElementById("subtractApply").addEventListener("click", async () => {
    const lower = document.getElementById("subtractLower").checked;
    const dedupe = document.getElementById("subtractDedupe").checked;
    const lemma = document.getElementById("subtractLemma").checked;
    let source = api.lines(document.getElementById("subtractSource").value);
    let remove = api.lines(document.getElementById("subtractRemove").value);
    if (lower) { source = source.map(row => row.toLocaleLowerCase("ru-RU")); remove = remove.map(row => row.toLocaleLowerCase("ru-RU")); }
    api.setStatus(status, lemma ? "Сравнение по словарю…" : "Сравнение…");
    try {
      const sourceKeys = lemma ? await lemmaKeys(source) : source.map(row => row.trim());
      const removeKeys = new Set(lemma ? await lemmaKeys(remove) : remove.map(row => row.trim()));
      const seen = new Set();
      const result = source.filter((row, index) => {
        const key = sourceKeys[index];
        if (removeKeys.has(key)) return false;
        if (dedupe && seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      document.getElementById("subtractResult").value = result.join("\n");
      api.setStatus(status, `Осталось строк: ${result.length}.`);
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });
})();
