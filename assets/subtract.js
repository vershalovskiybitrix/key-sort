(() => {
  "use strict";
  const api = window.KeySortServices;
  const status = document.getElementById("subtractStatus");
  const sourceField = document.getElementById("subtractSource");
  const removeField = document.getElementById("subtractRemove");
  const resultField = document.getElementById("subtractResult");
  const copyButton = document.getElementById("subtractCopy");
  const options = ["subtractLower", "subtractDedupe", "subtractLemma"].map(id => document.getElementById(id));
  const storageKey = "key-sort:subtract";
  let timer;
  let active;

  function save() {
    try {
      const expires = new Date();
      const day = expires.getUTCDate();
      expires.setUTCDate(1);
      expires.setUTCMonth(expires.getUTCMonth() + 4);
      const lastDay = new Date(Date.UTC(expires.getUTCFullYear(), expires.getUTCMonth() + 1, 0)).getUTCDate();
      expires.setUTCDate(Math.min(day, lastDay));
      localStorage.setItem(storageKey, JSON.stringify({
        expires: expires.getTime(), source: sourceField.value, remove: removeField.value,
        options: options.map(field => field.checked)
      }));
    } catch (error) {
      return error;
    }
  }

  function words(line) { return line.toLocaleLowerCase("ru-RU").match(/[\p{L}\p{N}-]+/gu) || []; }
  async function lemmaKeys(rows, signal) {
    const tokens = [...new Set(rows.flatMap(words))];
    const analyses = {};
    for (let index = 0; index < tokens.length; index += 1000) {
      const response = await fetch("/api/lemmatize", { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ words: tokens.slice(index, index + 1000) }) });
      if (!response.ok) throw new Error(`Словарь лемм недоступен: HTTP ${response.status}`);
      Object.assign(analyses, (await response.json()).analyses || {});
    }
    return rows.map(line => words(line).map(word => analyses[word]?.key || `word:${word}`).sort().join("|"));
  }

  function invalidate() {
    clearTimeout(timer);
    active?.abort();
    resultField.value = "";
    copyButton.disabled = true;
    api.setStatus(status, "");
  }

  async function calculate(storageError) {
    invalidate();
    const controller = new AbortController();
    active = controller;
    const lower = document.getElementById("subtractLower").checked;
    const dedupe = document.getElementById("subtractDedupe").checked;
    const lemma = document.getElementById("subtractLemma").checked;
    let source = api.lines(document.getElementById("subtractSource").value);
    let remove = api.lines(document.getElementById("subtractRemove").value);
    if (lower) { source = source.map(row => row.toLocaleLowerCase("ru-RU")); remove = remove.map(row => row.toLocaleLowerCase("ru-RU")); }
    api.setStatus(status, lemma ? "Сравнение по словарю…" : "Сравнение…");
    try {
      const keys = lemma && source.length ? await lemmaKeys([...source, ...remove], controller.signal) : [...source, ...remove];
      if (controller.signal.aborted) return;
      const removeKeys = new Set(keys.slice(source.length));
      const seen = new Set();
      const result = source.filter((row, index) => {
        const key = keys[index];
        if (removeKeys.has(key)) return false;
        if (dedupe && seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      resultField.value = result.join("\n");
      copyButton.disabled = !result.length;
      api.setStatus(status, `Осталось строк: ${result.length}.${storageError ? " Не удалось сохранить поля в браузере." : ""}`, Boolean(storageError));
    } catch (error) {
      if (!controller.signal.aborted) api.setStatus(status, error.message, true);
    }
  }

  function changed() {
    invalidate();
    const storageError = save();
    timer = setTimeout(() => calculate(storageError), 350);
  }

  sourceField.addEventListener("input", changed);
  removeField.addEventListener("input", changed);
  options.forEach(field => field.addEventListener("change", changed));
  document.getElementById("subtractApply").addEventListener("click", () => calculate());
  document.getElementById("subtractClear").addEventListener("click", () => {
    invalidate();
    sourceField.value = "";
    removeField.value = "";
    options.forEach(field => { field.checked = field.defaultChecked; });
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      api.setStatus(status, "Не удалось удалить сохранённые поля.", true);
    }
  });
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(resultField.value);
      api.setStatus(status, "Результат скопирован.");
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.expires > Date.now()) {
      sourceField.value = saved.source;
      removeField.value = saved.remove;
      options.forEach((field, index) => { field.checked = saved.options[index]; });
      if (sourceField.value) calculate();
    } else if (saved) {
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    api.setStatus(status, "Не удалось восстановить сохранённые поля.", true);
  }
})();
