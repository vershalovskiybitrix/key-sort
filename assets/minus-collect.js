(() => {
  "use strict";
  const words = text => text.normalize("NFC").toLowerCase().match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) || [];

  function queryWords(text) {
    return text.split(/\r?\n/u).flatMap(line => {
      if (/^запрос\s*[,;\t]\s*частотность\s*$/iu.test(line.trim())) return [];
      return words(line.replace(/[,;\t]\s*\d(?:[\d \u00a0\u202f]*\d)?\s*$/u, ""));
    });
  }

  function collect(target, irrelevant, analyses) {
    const lemma = word => analyses.get(word)?.lemma || word;
    const excluded = new Set(target.map(lemma));
    const counts = new Map();
    for (const word of irrelevant) {
      const id = lemma(word);
      if (excluded.has(id)) continue;
      if (!counts.has(id)) counts.set(id, { lemma: id, count: 0, preposition: false, adverbOrPronoun: false });
      const row = counts.get(id);
      const pos = analyses.get(word)?.pos;
      row.count += 1;
      row.preposition ||= pos === "PREP";
      row.adverbOrPronoun ||= pos === "ADVB" || pos === "NPRO";
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma, "ru"));
  }

  const prepositions = new Set("без в во для до за из из-за из-под к ко кроме между на над о об обо около от перед по под при про ради с со сквозь среди у через".split(" "));
  const adverbsAndPronouns = new Set([
    "как где куда откуда когда почему зачем какой который чей кто что",
    "я мы ты вы он она оно они мой наш твой ваш свой себя его её ее их",
    "это этот этого тот такой каждый весь некоторый любой сам самый столько",
    "так там тут уже"
  ].join(" ").split(" "));
  function visibleRows(rows, options) {
    return rows.filter(row =>
      (!options.withoutPrepositions || !(row.preposition || prepositions.has(row.lemma))) &&
      (!options.withoutAdverbsAndPronouns || !(row.adverbOrPronoun || adverbsAndPronouns.has(row.lemma))) &&
      (!options.repeatedOnly || row.count >= 2));
  }

  function copyText(rows, withFrequency) {
    return rows.map(row => withFrequency ? `${row.lemma}\t${row.count}` : row.lemma).join("\n");
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { queryWords, collect, visibleRows, copyText };
    return;
  }

  const api = window.KeySortServices;
  const queries = document.getElementById("collectQueries");
  const minuses = document.getElementById("collectMinuses");
  const status = document.getElementById("collectStatus");
  const output = document.getElementById("collectResults");
  const copy = document.getElementById("collectCopy");
  const analyses = new Map();
  const optionFields = {
    withoutPrepositions: document.getElementById("collectWithoutPrepositions"),
    withoutAdverbsAndPronouns: document.getElementById("collectWithoutAdverbsAndPronouns"),
    repeatedOnly: document.getElementById("collectRepeatedOnly"),
    withFrequency: document.getElementById("collectWithFrequency")
  };
  const storageKey = "key-sort:minus-collect:copy-options";
  let result = [];
  let timer;
  let active;

  function options() {
    return Object.fromEntries(Object.entries(optionFields).map(([key, input]) => [key, input.checked]));
  }

  function render() {
    const rows = visibleRows(result, options());
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.insertCell().textContent = row.lemma;
      tr.insertCell().textContent = row.count;
      fragment.append(tr);
    }
    output.replaceChildren(fragment);
    copy.disabled = !rows.length;
  }

  async function calculate(signal) {
    const target = queryWords(queries.value);
    const irrelevant = queryWords(minuses.value);
    if (!target.length || !irrelevant.length) return;
    api.setStatus(status, "Проверка словоформ…");
    const tokens = new Set([...target, ...irrelevant]);
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
      result = collect(target, irrelevant, analyses);
      render();
      api.setStatus(status, result.length ? "" : "Подходящих минус-слов нет.");
    } catch (error) {
      if (!signal.aborted) api.setStatus(status, error.message, true);
    }
  }

  function changed() {
    clearTimeout(timer);
    active?.abort();
    result = [];
    render();
    api.setStatus(status, "");
    const controller = new AbortController();
    active = controller;
    timer = setTimeout(() => calculate(controller.signal), 350);
  }

  copy.addEventListener("click", async () => {
    try {
      const settings = options();
      const rows = visibleRows(result, settings);
      if (!rows.length) return;
      await navigator.clipboard.writeText(copyText(rows, settings.withFrequency));
      api.setStatus(status, "Минус-слова скопированы.");
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    for (const [key, input] of Object.entries(optionFields)) input.checked = saved?.[key] === true;
  } catch {}

  for (const [key, input] of Object.entries(optionFields)) input.addEventListener("change", () => {
    if (key !== "withFrequency") render();
    try {
      localStorage.setItem(storageKey, JSON.stringify(options()));
    } catch {
      api.setStatus(status, "Не удалось сохранить настройки копирования.", true);
    }
  });

  const memory = api.pageMemory("minus-collect");
  const clear = document.getElementById("collectClear");
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
