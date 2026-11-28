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
  const memory = api.pageMemory("keyword-parser");
  const queryField = document.getElementById("parserQuery");
  const minusField = document.getElementById("parserMinus");
  const clearButton = document.getElementById("parserClear");
  const regionsRoot = document.getElementById("parserRegions");
  let saveTimer;

  function reportMemory(error) {
    api.setStatus(status, `Память браузера: ${error.message}`, true);
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    memory.save({
      query: queryField.value, minus: minusField.value, regions: regionPicker.signedValue(),
      rows: state.rows, frontier: state.frontier, depth: state.depth, settings: state.settings, job: state.job
    }).catch(reportMemory);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 500);
  }

  api.bindExtensionState(["API-ключ Yandex Cloud", "ID каталога"]);
  const regionPicker = window.KeySortRegions.bindRegionTree(document.getElementById("parserRegions"));
  regionPicker.ready.catch(error => api.setStatus(status, `Не удалось загрузить регионы: ${error.message}`, true));

  function setRunning(running) {
    state.running = running;
    collectButton.disabled = running;
    clearButton.disabled = running;
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
    const tasks = core.planLevel(state.frontier, candidates, state.settings);
    if (!tasks.length) throw new Error("В запросах веток нет места для следующего слова.");
    state.job = { tasks, index: 0, nextFrontier: [] };
  }

  async function collectOneLevel() {
    if (!state.job) await createLevelJob();
    const job = state.job;
    const count = job.tasks.length - job.index;
    if (!window.confirm(`Уровень ${state.depth + 1}: отправить запросов в Wordstat — ${count}?`)) return false;
    while (job.index < job.tasks.length) {
      const task = job.tasks[job.index];
      api.setStatus(status, `Уровень ${state.depth + 1}: запрос ${job.index + 1} из ${job.tasks.length}. Собрано уникальных фраз: ${state.rows.size}.`);
      const phrase = core.chars(task.query) <= core.QUERY_LIMIT ? task.query : core.buildQuery(
        state.settings.basePhrase, task.pathWords, state.settings.userMinusWords, core.parseRequest(task.query, "").userMinusWords
      );
      const rows = await requestTop(phrase);
      core.mergeRows(state.rows, rows);
      if (!core.branchComplete(rows)) job.nextFrontier.push({ pathWords: task.pathWords, pathKeys: task.pathKeys });
      job.index += 1;
      if (job.index % 10 === 0) save();
    }
    state.frontier = job.nextFrontier;
    state.depth += 1;
    state.job = null;
    return true;
  }

  async function collectBase() {
    const parsed = core.parseRequest(
      document.getElementById("parserQuery").value,
      document.getElementById("parserMinus").value
    );
    if (!parsed.basePhrase) throw new Error("Введите запрос.");
    await regionPicker.ready;
    const regions = regionPicker.positiveValue();
    if (!regions.length && regionPicker.signedValue().length) throw new Error("Из выбранных регионов исключены все доступные регионы.");
    if (regions.length > 50) throw new Error("Выберите не больше 50 регионов с учётом исключений.");
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
      save();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    run(collectBase);
  });

  deeperOneButton.addEventListener("click", () => run(async () => {
    if (!await collectOneLevel()) return;
    api.setStatus(status, `Уровень собран. Уникальных фраз: ${state.rows.size}. Активных веток: ${state.frontier.length}.`);
  }));

  deeperTwoButton.addEventListener("click", () => run(async () => {
    for (let step = 0; step < 2 && (state.frontier.length || state.job); step += 1) {
      if (!await collectOneLevel()) return;
    }
    api.setStatus(status, `Сбор завершён. Уникальных фраз: ${state.rows.size}. Активных веток: ${state.frontier.length}.`);
  }));

  document.getElementById("parserCopy").addEventListener("click", async () => {
    const rows = sortedRows();
    if (!rows.length) return;
    await navigator.clipboard.writeText(rows.map(row => `${row.phrase}\t${row.count}`).join("\n"));
    api.setStatus(status, `Скопировано строк: ${rows.length}.`);
  });

  queryField.addEventListener("input", scheduleSave);
  minusField.addEventListener("input", scheduleSave);
  regionsRoot.addEventListener("change", scheduleSave);
  window.addEventListener("pagehide", () => {
    if (saveTimer !== undefined || state.running) save();
  });
  clearButton.addEventListener("click", () => {
    if (state.running) return;
    clearTimeout(saveTimer);
    saveTimer = undefined;
    form.reset();
    regionPicker.setSignedValue([]);
    Object.assign(state, { rows: new Map(), frontier: [], depth: 0, settings: null, job: null });
    render();
    api.setStatus(status, "");
    memory.clear().catch(reportMemory);
  });

  form.inert = true;
  memory.load().then(saved => {
    if (!saved) return;
    queryField.value = saved.query;
    minusField.value = saved.minus;
    regionPicker.setSignedValue(saved.regions);
    const { rows, frontier, depth, settings, job } = saved;
    Object.assign(state, { rows, frontier, depth, settings, job });
  }).catch(reportMemory).finally(() => {
    render();
    form.inert = false;
  });
})();
