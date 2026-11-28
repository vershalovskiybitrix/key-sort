(() => {
  "use strict";
  const words = text => text.toLowerCase().match(/[\p{L}\p{N}]+(?:[.-][\p{L}\p{N}]+)*/gu) || [];

  function conflicts(phrases, minuses, analyses) {
    const key = word => analyses.get(word)?.key || `word:${word}`;
    const matches = new Map(minuses.map(word => [key(word), []]));
    for (const phrase of phrases) {
      for (const wordKey of new Set(words(phrase).map(key))) matches.get(wordKey)?.push(phrase);
    }
    return minuses.map(word => ({ word, phrases: matches.get(key(word)) })).filter(row => row.phrases.length);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { words, conflicts };
    return;
  }

  const api = window.KeySortServices;
  const queries = document.getElementById("cleanupQueries");
  const minuses = document.getElementById("cleanupMinuses");
  const status = document.getElementById("cleanupStatus");
  const body = document.getElementById("cleanupResults");
  const analyses = new Map();
  let timer;
  let active;

  function render(rows) {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.insertCell().textContent = row.word;
      tr.insertCell().textContent = row.phrases.length;
      let list = tr.insertCell();
      if (row.phrases.length > 10) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Показать фразы";
        details.append(summary);
        list.append(details);
        list = details;
      }
      for (const phrase of row.phrases) {
        const line = document.createElement("div");
        line.textContent = phrase;
        list.append(line);
      }
      fragment.append(tr);
    }
    body.replaceChildren(fragment);
  }

  async function calculate(signal) {
    const phrases = api.lines(queries.value);
    const negativeWords = [...new Set(words(minuses.value))];
    if (!phrases.length || !negativeWords.length) return;
    api.setStatus(status, "Проверка словоформ…");
    const tokens = new Set(negativeWords);
    for (const phrase of phrases) for (const word of words(phrase)) tokens.add(word);
    const missing = [...tokens].filter(word => /[а-яё]/u.test(word) && !analyses.has(word));
    try {
      for (let index = 0; index < missing.length; index += 1000) {
        if (index) await new Promise(resolve => setTimeout(resolve, 350));
        if (signal.aborted) return;
        const response = await fetch("/api/lemmatize", {
          method: "POST", signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words: missing.slice(index, index + 1000) })
        });
        if (!response.ok) throw new Error(`Словарь недоступен (HTTP ${response.status}).`);
        for (const [word, analysis] of Object.entries((await response.json()).analyses)) analyses.set(word, analysis);
      }
      if (signal.aborted) return;
      const rows = conflicts(phrases, negativeWords, analyses);
      render(rows);
      api.setStatus(status, rows.length ? "" : "Конфликтов нет.");
    } catch (error) {
      if (!signal.aborted) api.setStatus(status, error.message, true);
    }
  }

  function changed() {
    clearTimeout(timer);
    active?.abort();
    body.replaceChildren();
    api.setStatus(status, "");
    const controller = new AbortController();
    active = controller;
    timer = setTimeout(() => calculate(controller.signal), 350);
  }

  const memory = api.pageMemory("minus-cleanup");
  const clear = document.getElementById("cleanupClear");
  const reportMemoryError = message => api.setStatus(status, message, true);

  function inputChanged() {
    changed();
    memory.save({ queries: queries.value, minuses: minuses.value })
      .catch(() => reportMemoryError("Не удалось сохранить поля."));
  }

  queries.addEventListener("input", inputChanged);
  minuses.addEventListener("input", inputChanged);
  clear.addEventListener("click", () => {
    queries.value = "";
    minuses.value = "";
    changed();
    memory.clear().catch(() => reportMemoryError("Не удалось удалить сохранённые поля."));
  });

  queries.readOnly = true;
  minuses.readOnly = true;
  memory.load().then(saved => {
    if (saved) {
      queries.value = saved.queries;
      minuses.value = saved.minuses;
    }
    changed();
  }).catch(() => reportMemoryError("Не удалось восстановить сохранённые поля.")).finally(() => {
    queries.readOnly = false;
    minuses.readOnly = false;
    clear.disabled = false;
  });
})();
