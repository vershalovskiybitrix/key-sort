(() => {
  "use strict";
  const api = window.KeySortServices;
  const core = window.KeySortKeywordParserCore;
  const form = document.getElementById("parserForm");
  const status = document.getElementById("parserStatus");
  const resultBody = document.getElementById("parserResults");
  const total = document.getElementById("parserTotal");
  const collectButton = document.getElementById("parserCollect");
  const deeperOneButton = document.getElementById("parserDeeperOne");
  const deeperTwoButton = document.getElementById("parserDeeperTwo");
  const DISPLAY_LIMIT = 5000;
  const state = { rows: new Map(), frontier: [], depth: 0, settings: null, running: false, job: null };

  api.bindExtensionState(["API-ключ Yandex Cloud", "ID каталога"]);
  const regionPicker = window.KeySortRegions.bindRegionTree(document.getElementById("parserRegions"));
  regionPicker.ready.catch(error => api.setStatus(status, `Не удалось загрузить регионы: ${error.message}`, true));

  function setRunning(running) {
    state.running = running;
    collectButton.disabled = running;
    deeperOneButton.disabled = running || !state.settings || !state.frontier.length;
    deeperTwoButton.disabled = running || !state.settings || !state.frontier.length;
  }

  function sortedRows() {
    return [...state.rows.values()].sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase, "ru"));
  }

  function render() {
    const rows = sortedRows();
    resultBody.textContent = "";
    const fragment = document.createDocumentFragment();
    for (const row of rows.slice(0, DISPLAY_LIMIT)) {
      const tr = document.createElement("tr");
      const phrase = document.createElement("td");
      const count = document.createElement("td");
      phrase.textContent = row.phrase;
      count.textContent = row.count.toLocaleString("ru-RU");
      tr.append(phrase, count);
      fragment.append(tr);
    }
    resultBody.append(fragment);
    const displayNote = rows.length > DISPLAY_LIMIT ? ` В таблице показаны первые ${DISPLAY_LIMIT.toLocaleString("ru-RU")}; копирование включает все.` : "";
    total.textContent = `Уникальных фраз: ${rows.length.toLocaleString("ru-RU")}. Пройдено уровней: ${state.depth}.${displayNote}`;
    setRunning(state.running);
  }

  async function requestTop(phrase) {
    const data = await api.requestExtension("WORDSTAT_TOP", {
      phrase,
      numPhrases: 2000,
      regions: state.settings.regions
    });
    return data.results || [];
  }

  async function lemmaMapForRows(rows) {
    const allWords = core.unique(rows.flatMap(row => core.words(row.phrase)));
    const analyses = {};
    for (let index = 0; index < allWords.length; index += 1000) {
      const response = await fetch("/api/lemmatize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: allWords.slice(index, index + 1000) })
      });
      if (!response.ok) throw new Error("Не удалось выполнить лемматизацию результатов.");
      Object.assign(analyses, (await response.json()).analyses || {});
      if (index + 1000 < allWords.length) await new Promise(resolve => setTimeout(resolve, 350));
    }
    return analyses;
  }

  async function currentCandidates() {
    const rows = [...state.rows.values()];
    const lemmaByWord = await lemmaMapForRows(rows);
    const excludedWords = core.unique([
      ...core.words(state.settings.basePhrase),
      ...state.settings.userMinusWords
    ]);
    const excludedAnalyses = await lemmaMapForRows(excludedWords.map(phrase => ({ phrase })));
    const excludedKeys = new Set(excludedWords.map(word => excludedAnalyses[word]?.key).filter(Boolean));
    return core.rankCandidates(rows, lemmaByWord, excludedKeys, 20);
  }

  async function createLevelJob() {
    const candidates = await currentCandidates();
    if (!candidates.length) throw new Error("Не найдено слов для следующего уровня.");
    const tasks = [];
    const queryKeys = new Set();
    for (const parent of state.frontier) {
      const pathKeys = new Set(parent.pathKeys);
      for (const candidate of candidates) {
        if (pathKeys.has(candidate.key)) continue;
        const pathWords = [...parent.pathWords, candidate.lemma];
        const automaticMinusWords = candidates
          .filter(item => item.key !== candidate.key && !pathKeys.has(item.key))
          .map(item => item.lemma);
        const query = core.buildQuery(
          state.settings.basePhrase,
          pathWords,
          state.settings.userMinusWords,
          automaticMinusWords
        );
        const queryKey = query.toLowerCase();
        if (queryKeys.has(queryKey)) continue;
        queryKeys.add(queryKey);
        tasks.push({ query, pathWords, pathKeys: [...pathKeys, candidate.key] });
      }
    }
    state.job = { tasks, index: 0, nextFrontier: [] };
  }

  async function collectOneLevel() {
    if (!state.job) await createLevelJob();
    const job = state.job;
    while (job.index < job.tasks.length) {
      const task = job.tasks[job.index];
      api.setStatus(status, `Уровень ${state.depth + 1}: запрос ${job.index + 1} из ${job.tasks.length}. Собрано уникальных фраз: ${state.rows.size}.`);
      const rows = await requestTop(task.query);
      core.mergeRows(state.rows, rows);
      if (!core.branchComplete(rows)) job.nextFrontier.push({ pathWords: task.pathWords, pathKeys: task.pathKeys });
      job.index += 1;
    }
    state.frontier = job.nextFrontier;
    state.depth += 1;
    state.job = null;
  }

  async function collectBase() {
    const parsed = core.parseRequest(
      document.getElementById("parserQuery").value,
      document.getElementById("parserMinus").value
    );
    if (!parsed.basePhrase) throw new Error("Введите запрос.");
    const regions = regionPicker.positiveValue();
    if (regions.length > 100) throw new Error("Выбор с исключениями разворачивается более чем в 100 регионов. Wordstat API принимает не больше 100.");
    const query = core.buildQuery(parsed.basePhrase, [], parsed.userMinusWords, []);
    const settings = { ...parsed, regions };
    const previousSettings = state.settings;
    state.settings = settings;
    api.setStatus(status, "Собираю исходную выдачу…");
    let rows;
    try {
      rows = await requestTop(query);
    } catch (error) {
      state.settings = previousSettings;
      throw error;
    }
    state.rows.clear();
    state.frontier = [];
    state.depth = 0;
    state.job = null;
    core.mergeRows(state.rows, rows);
    if (!core.branchComplete(rows)) state.frontier = [{ pathWords: [], pathKeys: [] }];
    render();
    api.setStatus(status, `Исходная выдача собрана. Уникальных фраз: ${state.rows.size}.`);
  }

  async function run(action) {
    if (state.running) return;
    setRunning(true);
    try {
      await action();
    } catch (error) {
      api.setStatus(status, error.message, true);
    } finally {
      render();
      setRunning(false);
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    run(collectBase);
  });

  deeperOneButton.addEventListener("click", () => run(async () => {
    await collectOneLevel();
    api.setStatus(status, `Уровень собран. Уникальных фраз: ${state.rows.size}. Активных веток: ${state.frontier.length}.`);
  }));

  deeperTwoButton.addEventListener("click", () => run(async () => {
    for (let step = 0; step < 2 && (state.frontier.length || state.job); step += 1) await collectOneLevel();
    api.setStatus(status, `Сбор завершён. Уникальных фраз: ${state.rows.size}. Активных веток: ${state.frontier.length}.`);
  }));

  document.getElementById("parserCopy").addEventListener("click", async () => {
    const rows = sortedRows();
    if (!rows.length) return;
    await navigator.clipboard.writeText(rows.map(row => `${row.phrase}\t${row.count}`).join("\n"));
    api.setStatus(status, `Скопировано строк: ${rows.length}.`);
  });

  render();
})();
