  (() => {
    "use strict";
    const $ = id => document.getElementById(id);
    const queriesInput = $("queries");
    const wordsInput = $("negativeWords");
    const phrasesInput = $("negativePhrases");
    const clickableOutput = $("clickableResults");
    const formatter = new Intl.NumberFormat("ru-RU");
    const SEARCH_TARGETS = [
      {
        name: "Google",
        baseUrl: "https://www.google.com/search?q=",
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARHSURBVFhHvZddbBRVFMf7YrAq+OSbD6Kgb0qUUh60xq9VtA8k1EJrH1CsGIM+GLUmBA0kFi0WSMCHLcVCTMO2GmjFCiUFpH60sUjMEtIGLaAWama32w92dt2vOf7PndPd3M7sdmobf8k/M/fec8//zJ07s7NFXrEsawlUnclkmqEBaAxKisLS14yYKo6VafMHyR5A4hYoTh5BbAw6iLnLJc3cQZ7bkKQRSttp5w7mpqBdKKRY0noDE+7HxEuSZ94gVxA5l0n6wiDwYUwIyVyN9I0RMls/p4l33qDwi8+R4VtNxjOlFF7no/G3XyfzcBOlR/6UaB3kNHBYITbuyJU7zNOj12ly+/tkPL2KjKdKCgsxkx++p+bMhIvIuxIYuB0BjmWPn+qi0Atl7mYFFCp/nP45e0qy5IAH3w7nnsBAo8RkMY8cck3uVVMN2yWTDrwaxNYGFfGjpu12vnK3pKxIbRVFD+yj+DdHKd51DOf7KfJatRYztbueyLIkmw68UtqtQEeLjCl4s4Wef0xLyBqrWUuJ8/0S5SQx0EfhDeV0c/+n0pMfeDYrc5zfiYb2konufdNhPr7lZbKmpiQiP5YZlbPCwNPEKizm5a+WPoUVG6ZU9yKarLsna86PXGYiIhELB7zX8/I3S1uRuVpPqZ5blMx9d1FozUqKnzwuowsLvP1cwIC0FelffNkCWImjS4lSKRldWODdzwWMSVuR6r1bKyB9sUpG3Hnyo6hnnb2kXwi8DS4gKW1F6vQirYDM79tkxB03o3xq/VGz4gIS/2sBLecSMstmuoCwtBWOWxDcICPuuBnlU3u/YwXULdA34YVntQJGeh+kZGbum/CKkXEUcG7QsQfUJpzxGH6cNT/etZQeDayljuEeGfVOoC/pKGB0Qn81w9vPLyJtm1uxqxTrKab6jkdoZWCdkq/jFQrHxyVidm7GLarYa2rmG/0xGc0B70ouYAkq0Ub39O3Imk+rpvtdmkjM/ipO4iet7khcM2e1Oe+/icMd6vcAjYN2t82NqEFlX73kKKL8683Ue/28RDm5PH6NNnUGYDipmfNqxBKO5W9S5gxWYTk6tB1y4lqvo4BpVXz7FjVeaKH2yyfoy99O0mfBVnq1ZyuVBCrUeOmhOnrik7+yBXw/pH/XwisJz/vE3gadu2Q8yxdDnQ5zrypp3Uhlu392PPsMvHaKbQ7082f4RTskR/cfP+B21LiaFFJpWyUdCHZKlhzw+BWHW8VWB8uyDAH89aoxaoZo6097aFWbvcSzafOZD2gwMiyzcyD33zjcK3buIGCFWxEMb87Dg8doy3c7aE1nLa1ur1RX6uvYRLWnt6m9MBS5ItE6bI4LfEhsCiMrEZS58wa5eNkLX/lMUEQxJjZA//ljAHP5j+tOnLrfcy/IavA/Yn5xeIJjoSbM1R+1+YBki6H1SOyH+iEDSoj4nPv8iKlEDfYbblaKiv4FoeF/NqqvoEMAAAAASUVORK5CYII="
      },
      {
        name: "Яндекс",
        baseUrl: "https://ya.ru/search/?text=",
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQlSURBVGhDzVg7bhRBEPVFiLkCEidAIkMiJiAmIeUCxByBI5ATkhKRECNxAIdmPe7XW2/2zZuqnlm8tvykUlXXv7erewxX98Xty2eT8y2C35NA1hzo5vXzIVeKVI8PNpA1541mNvcBReqHA4uAeyPeENaZLlurvhd6CLAAaU8zvt7joxSl7w8mRKE9DZFG9szmuih/P3hyl10Hnvk6d3tmI0Ur5wPBVQHKVdFKTxrl5Zo82jkPTKiJXHad21xfcZcrita2sVUgsytBD/r39sV0+PCmpNt3r1Y5NLfK4NHeGEykgdVadeDT54/T9P3bdPj7Z5pxuJmm6+uTLOvbnz8WOVzOKNrMQSdPkhVY6D69n6bfv46NocG9aDGe19fgaotWc3ggg7I1dYevX85rGuBJtA1o3qq266LdNTSA5Mm0SP/lORK2CYwRRgQjNRMRvlsj1GsUtmj5BA+oAlXXZ53zHei6dhc8Hhf66CAbLUbI61W2aP0IKpWyQPJ+YZNfHY16DKhvwDaLE8hqZGu3Rdvri1sl8WR9JHQDkO2X17j5BAS+AfXP1m6LLax//SpI5f7qGPjr00/9sw3seYV8rfq5+czoCVy/eOuBNh5ZDHWrDeDEilcoW2dy3wBAgxorTlqcAJppNIqpRijz17hKJpUnsLnGE5ncAfUHMWZrhNxfa7ms69UlHslcg/oHjOBG2sXWGI2tTiDzJamuktPxUdn5TO0Psewe+Ckw7hIjpET9YoRcHq3BF19XApe5faE9rm9ARw5IRog0qqv64QiNdOBoanEK0SB0GDH40L/aQJYX3GUl9S1HaM8a1P+291EC2klgRNA4/BYbCM4RAmnuTHZO2v2PF18rLzcBxL3oG1BAP/gOqOyktsV3IEvg3GVSb9C/DQQ3YCOkrxApq1Nx0OYlrihN2hpaIZ7W1Qm0zegGtG6mc4Kt//oAFe7giZwr9e8CxkKAsaJv3wDsOAW5A5ory+s11Sfaz0dopFM9+Nycoq3xnC58FBsnoGsn2qL90/9CqDHTuTyvB6NDWmwgNou4RR7xV51zULR+wijBSM5Gh68L/cBXJwAUr1Cmy9bR+hFqrBKs5PbnxKr5hvJLTF85gd21TBdtn+DOvk71GB17GnV0NDY7gWqENI46tUXLa7ijctdXr04WA6ruQFWH5PZotUaWyJOgGf/y9iczXp0qZgGcXLsD9PcYyhlFqzng4MWVmBwNOVUxpHNiqHMebY7BJAzUAufIzrfkzF8p2tsHDfTEWqCSM53bM3/VK4+29qNKDnKbrrVopTvXFi2dj1HSkTzSkSqb66OV/4cmI7GIF8v0rhvZlKCLFi6HrBCLjdZOVcPKo+Tl4YVImd51I5vKUerhUDWQrV1X2SP14wGFydmEy1Xjbu8JnwLQELk3S7k7XgxXV3fXcJImhVdgHgAAAABJRU5ErkJggg=="
      },
      {
        name: "Яндекс Wordstat",
        baseUrl: "https://wordstat.yandex.ru/?region=0&view=table&words=",
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA5SURBVDhPY/j3799/SvBQNUBMDIKB7KFkAJIm/AYgK8QljsSGGIBDEgXjUIPfACLYowYMvAH//gMAApFOzueoXSAAAAAASUVORK5CYII="
      }
    ];
    const settingsButton = $("settingsButton");
    const settingsMenu = $("settingsMenu");
    const settingsRoot = $("settingsRoot");
    const clickSetting = $("settingClick");
    const cleanSetting = $("settingClean");
    const cleanPhrasesSetting = $("settingCleanPhrases");
    const dashSetting = $("settingDash");
    const quoteSetting = $("settingQuote");
    const copyFrequencySetting = $("settingCopyFrequency");
    const autoLemmaFrequencySetting = $("settingAutoLemmaFrequency");
    const siteFontsSetting = $("settingSiteFonts");
    const frequencyMode = $("frequencyMode");
    const undoButton = $("undoButton");
    const redoButton = $("redoButton");
    const noteInput = $("campaignNote");
    const resultOptionsRoot = $("resultOptionsRoot");
    const resultOptionsButton = $("resultOptionsButton");
    const resultOptionsMenu = $("resultOptionsMenu");
    const showAllButton = $("showAllButton");
    const queryTextFilter = $("queryTextFilter");
    const frequencyFilterSection = $("frequencyFilterSection");
    const frequencyFilterOperator = $("frequencyFilterOperator");
    const frequencyFilterValue = $("frequencyFilterValue");
    const lengthChecks = Array.from(document.querySelectorAll("[data-query-length]"));
    const defaultPageTitle = document.title;
    const MAX_IMPORT_FILE_BYTES = 25 * 1024 * 1024;
    const SESSION_RETENTION_MONTHS = 4;
    const MORPH_BATCH_SIZE = 1000;
    const MORPH_REQUEST_INTERVAL_MS = 350;
    const MORPH_FAILURE_LIMIT = 3;
    const MORPH_RECOVERY_INTERVAL_MS = 60000;
    let timer = null;
    let rawWords = wordsInput.value;    // Текст без автоматически добавленных дефисов.
    let negativeWordKeyOverrides = Object.create(null); // Внутренние ключи «лемма + часть речи» без вывода в поле и копирование.
    let rawPhrases = phrasesInput.value; // Текст без автоматически добавленных оболочек.
    let lastRemaining = [];
    let lastVisible = [];
    let querySortMode = "original";
    let frequencySortMode = "original";
    let queryRows = [];
    let sourceCache = { value: null, rows: [] };
    const createDefaultGroups = () => [
      { id: "hot", name: "Горячие", short: "ГО" },
      { id: "warm", name: "Тёплые", short: "ТЁ" },
      { id: "cold", name: "Холодные", short: "ХО" }
    ];
    let groups = createDefaultGroups();
    let assignments = Object.create(null);
    const morphCache = new Map();
    const morphQueued = new Set();
    let morphLoading = false;
    let morphAvailable = true;
    let morphFailureCount = 0;
    let lastMorphRequestAt = 0;
    let morphRequestChain = Promise.resolve();
    const directMorphRequests = new Map();
    let morphRetryTimer = null;
    let morphRetryDelay = 1000;
    let saveTimer = null;
    let databasePromise = null;
    let lemmaFrequencyPending = false;
    let lemmaFrequencyHasResult = false;
    let pendingQueryDeduplication = null;
    let pendingNegativeWordNormalization = null;

    // История хранится только в памяти открытой страницы. Отдельные нажатия на
    // поисковые слова, вставки, очистки и переключатели — самостоятельные шаги.
    // Последовательный ручной набор объединяем в короткие серии, как в редакторе.
    const HISTORY_LIMIT = 120;
    let history = [];
    let historyIndex = -1;
    let restoringHistory = false;
    let lastEdit = null;
    function syncHistoryButtons() {
      undoButton.disabled = historyIndex <= 0;
      redoButton.disabled = historyIndex >= history.length - 1;
    }
    function snapshot() {
      const active = document.activeElement;
      const focused = [queriesInput, wordsInput, phrasesInput, noteInput, queryTextFilter, frequencyFilterValue].includes(active) ? active : null;
      return {
        note: noteInput.value,
        selectedLengths: lengthChecks.filter(ch => ch.checked).map(ch => Number(ch.dataset.queryLength)),
        queryTextFilter: queryTextFilter.value,
        frequencyFilterOperator: frequencyFilterOperator.value,
        frequencyFilterValue: frequencyFilterValue.value,
        queries: queriesInput.value,
        words: wordsInput.value,
        phrases: phrasesInput.value,
        rawWords, rawPhrases, negativeWordKeyOverrides,
        queryRows,
        groups,
        assignments,
        click: clickSetting.checked,
        clean: cleanSetting.checked,
        cleanPhrases: cleanPhrasesSetting.checked,
        dash: dashSetting.checked,
        quote: quoteSetting.checked,
        frequencyMode: frequencyMode.checked,
        copyFrequency: copyFrequencySetting.checked,
        autoLemmaFrequency: autoLemmaFrequencySetting.checked,
        siteFonts: siteFontsSetting.checked,
        focusId: focused ? focused.id : null,
        selectionStart: focused ? focused.selectionStart : null,
        selectionEnd: focused ? focused.selectionEnd : null
      };
    }
    function equalSnapshot(a, b) {
      return a.note === b.note && a.selectedLengths.join(",") === b.selectedLengths.join(",") &&
        a.queryTextFilter === b.queryTextFilter && a.frequencyFilterOperator === b.frequencyFilterOperator &&
        a.frequencyFilterValue === b.frequencyFilterValue &&
        a.queries === b.queries && a.words === b.words && a.phrases === b.phrases &&
        a.rawWords === b.rawWords && a.rawPhrases === b.rawPhrases && a.negativeWordKeyOverrides === b.negativeWordKeyOverrides &&
        a.queryRows === b.queryRows && a.groups === b.groups && a.assignments === b.assignments &&
        a.click === b.click && a.clean === b.clean && a.cleanPhrases === b.cleanPhrases && a.dash === b.dash && a.quote === b.quote &&
        a.frequencyMode === b.frequencyMode && a.copyFrequency === b.copyFrequency &&
        a.autoLemmaFrequency === b.autoLemmaFrequency && a.siteFonts === b.siteFonts;
    }
    function storeHistory(kind = "action", field = "") {
      if (restoringHistory) return;
      const next = snapshot();
      if (historyIndex >= 0 && equalSnapshot(next, history[historyIndex])) return;
      const now = performance.now();
      const canMerge = kind === "typing" && lastEdit && lastEdit.kind === "typing" &&
        lastEdit.field === field && (now - lastEdit.time) <= 800 &&
        historyIndex > 0 && historyIndex === history.length - 1 &&
        next.focusId === lastEdit.focusId &&
        Math.abs((next.selectionStart ?? 0) - (lastEdit.cursor ?? 0)) <= 4;
      if (canMerge) {
        history[historyIndex] = next;
      } else {
        if (historyIndex < history.length - 1) history.length = historyIndex + 1;
        history.push(next);
        historyIndex++;
        if (history.length > HISTORY_LIMIT) { history.shift(); historyIndex--; }
      }
      lastEdit = kind === "typing"
        ? {kind, field, time: now, focusId: next.focusId, cursor: next.selectionEnd}
        : null;
      syncHistoryButtons();
      scheduleSave();
    }
    function performHistoryAction(change) {
      const before = snapshot();
      change();
      const after = snapshot();
      if (equalSnapshot(before, after)) return false;
      if (historyIndex < 0 || !equalSnapshot(history[historyIndex], before)) {
        if (historyIndex < history.length - 1) history.length = historyIndex + 1;
        history.push(before);
        historyIndex++;
      } else if (historyIndex < history.length - 1) {
        history.length = historyIndex + 1;
      }
      history.push(after);
      historyIndex++;
      while (history.length > HISTORY_LIMIT) { history.shift(); historyIndex--; }
      lastEdit = null;
      syncHistoryButtons();
      scheduleSave();
      return true;
    }
    function storeTextEdit(field, e) {
      const inputType = e && e.inputType;
      const isTyping = inputType === "insertText" || inputType === "deleteContentBackward" ||
        inputType === "deleteContentForward" || inputType === "insertCompositionText";
      storeHistory(isTyping ? "typing" : "action", field);
    }
    function syncPageTitle() {
      const name = noteInput.value.trim();
      document.title = name ? `${name} — Key Sort` : defaultPageTitle;
    }
    function activeLengths() {
      return new Set(lengthChecks.filter(ch => ch.checked).map(ch => Number(ch.dataset.queryLength)));
    }
    function activeQueryTextFilter() {
      return queryTextFilter.value.trim().normalize("NFC").toLocaleLowerCase("ru-RU");
    }
    function activeFrequencyFilter() {
      if (!frequencyMode.checked || frequencyFilterValue.value === "") return null;
      const value = Number(frequencyFilterValue.value);
      return Number.isFinite(value) && value >= 0 ? value : null;
    }
    function hasActiveResultFilters() {
      return activeLengths().size > 0 || Boolean(activeQueryTextFilter()) || activeFrequencyFilter() !== null;
    }
    function visibleByFilters(rows) {
      const selected = activeLengths();
      const phraseNeedle = activeQueryTextFilter();
      const frequencyLimit = activeFrequencyFilter();
      return rows.filter(row => {
        const parsed = parseQueryLine(row.line);
        if (selected.size) {
          const count = getWords(parsed.phrase).length;
          if (!selected.has(count >= 6 ? 6 : count)) return false;
        }
        if (phraseNeedle && !parsed.phrase.normalize("NFC").toLocaleLowerCase("ru-RU").includes(phraseNeedle)) return false;
        if (frequencyLimit !== null) {
          if (parsed.frequency === "") return false;
          const frequency = Number(parsed.frequency);
          if (frequencyFilterOperator.value === "lt" ? frequency >= frequencyLimit : frequency <= frequencyLimit) return false;
        }
        return true;
      });
    }
    function syncFrequencyFilterVisibility() {
      frequencyFilterSection.hidden = !frequencyMode.checked;
    }
    function syncClickableView() {
      const enabled = clickSetting.checked;
      clickableOutput.hidden = false;
      $("resultCopyHelp").textContent = enabled
        ? "Клик по слову добавляет его в минус-слова. По группам: стрелки — движение, Пробел или 1 — отметка."
        : "По группам: стрелки — движение, Пробел или 1 — отметка. Для полного списка есть кнопка «Скопировать».";
      renderClickable(lastVisible);
    }
    function syncFontMode() {
      document.documentElement.classList.toggle("legacy-fonts", !siteFontsSetting.checked);
    }
    function applySnapshot(state) {
      restoringHistory = true;
      if (timer !== null) { clearTimeout(timer); timer = null; }
      noteInput.value = state.note || "";
      syncPageTitle();
      const chosen = new Set(state.selectedLengths || []);
      lengthChecks.forEach(ch => { ch.checked = chosen.has(Number(ch.dataset.queryLength)); });
      queryTextFilter.value = state.queryTextFilter || "";
      frequencyFilterOperator.value = state.frequencyFilterOperator === "lt" ? "lt" : "gt";
      frequencyFilterValue.value = state.frequencyFilterValue || "";
      queriesInput.value = state.queries;
      wordsInput.value = state.words;
      phrasesInput.value = state.phrases;
      rawWords = state.rawWords;
      negativeWordKeyOverrides = state.negativeWordKeyOverrides || Object.create(null);
      rawPhrases = state.rawPhrases;
      queryRows = state.queryRows || [];
      groups = state.groups;
      assignments = state.assignments;
      clickSetting.checked = state.click;
      cleanSetting.checked = state.clean;
      cleanPhrasesSetting.checked = state.cleanPhrases;
      dashSetting.checked = state.dash;
      quoteSetting.checked = state.quote;
      frequencyMode.checked = Boolean(state.frequencyMode);
      copyFrequencySetting.checked = Boolean(state.copyFrequency);
      autoLemmaFrequencySetting.checked = Boolean(state.autoLemmaFrequency);
      siteFontsSetting.checked = state.siteFonts !== false;
      wordsInput.value = dashSetting.checked ? formatWords(wordTextToLines(rawWords)) : wordTextToLines(rawWords);
      syncFrequencyFilterVisibility();
      sourceCache = { value: queriesInput.value, rows: queryRows };
      queueMorphology(queryRows.flatMap(row => getWords(queryPhrase(row.line))));
      syncFontMode();
      syncClickableView();
      recalculate();
      wordsScroll.edited();
      phrasesScroll.edited();
      const target = state.focusId ? document.getElementById(state.focusId) : null;
      if (target && [queriesInput, wordsInput, phrasesInput, noteInput, queryTextFilter, frequencyFilterValue].includes(target)) {
        target.focus({preventScroll: true});
        const start = Math.min(target.value.length, state.selectionStart ?? target.value.length);
        const end = Math.min(target.value.length, state.selectionEnd ?? start);
        target.setSelectionRange(start, end);
      }
      lastEdit = null;
      restoringHistory = false;
      syncHistoryButtons();
      scheduleSave();
    }
    function undo() {
      if (historyIndex <= 0) { syncHistoryButtons(); return; }
      applySnapshot(history[--historyIndex]);
    }
    function redo() {
      if (historyIndex >= history.length - 1) { syncHistoryButtons(); return; }
      applySnapshot(history[++historyIndex]);
    }

    const getWords = text => (text.normalize("NFC").toLocaleLowerCase("ru-RU").match(/[\p{L}\p{N}]+(?:\.[0-9]+)?/gu) || []);
    function parseQueryLine(line) {
      if (!frequencyMode.checked) return { phrase: line, frequency: "" };
      const match = line.match(/^(.*?)(?:\s*[,;]\s*|\t+)(\d(?:[\d \u00A0\u202F]*\d)?)\s*$/u);
      if (!match || !match[1].trim()) return { phrase: line, frequency: "" };
      return { phrase: match[1].trim(), frequency: match[2].replace(/[ \u00A0\u202F]/gu, "") };
    }
    const queryPhrase = line => parseQueryLine(line).phrase;
    function formatQueryLines(rows) {
      return rows.map(row => {
        const line = typeof row === "string" ? row : row.line;
        return copyFrequencySetting.checked ? line : queryPhrase(line);
      }).join("\n");
    }
    function sortVisibleRows(rows) {
      if (querySortMode === "original" && frequencySortMode === "original") return rows;
      const originalIndex = new Map(rows.map((row, index) => [row.id, index]));
      return [...rows].sort((a, b) => {
        let compared = 0;
        if (querySortMode !== "original") {
          compared = queryPhrase(a.line).localeCompare(queryPhrase(b.line), "ru", { sensitivity: "base", numeric: true });
          if (querySortMode === "desc") compared = -compared;
        } else {
          const aValue = parseQueryLine(a.line).frequency;
          const bValue = parseQueryLine(b.line).frequency;
          const aNumber = aValue === "" ? null : Number(aValue);
          const bNumber = bValue === "" ? null : Number(bValue);
          if (aNumber === null && bNumber !== null) compared = 1;
          else if (aNumber !== null && bNumber === null) compared = -1;
          else if (aNumber !== null && bNumber !== null) compared = frequencySortMode === "desc" ? bNumber - aNumber : aNumber - bNumber;
        }
        return compared || originalIndex.get(a.id) - originalIndex.get(b.id);
      });
    }
    function applyVisibleSorting() {
      lastVisible = sortVisibleRows(visibleByFilters(lastRemaining));
      clickableOutput.scrollTop = 0;
      lastRenderedClickable = null;
      renderClickable(lastVisible, true);
    }
    function cycleQuerySort() {
      querySortMode = querySortMode === "original" ? "asc" : querySortMode === "asc" ? "desc" : "original";
      frequencySortMode = "original";
      applyVisibleSorting();
    }
    function cycleFrequencySort() {
      frequencySortMode = frequencySortMode === "original" ? "desc" : frequencySortMode === "desc" ? "asc" : "original";
      querySortMode = "original";
      applyVisibleSorting();
    }
    const createQueryRowId = () => `query-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    function syncQueryRows(lines) {
      const available = new Map();
      for (const row of queryRows) {
        const key = normalizedWord(queryPhrase(row.line));
        if (!available.has(key)) available.set(key, []);
        available.get(key).push(row);
      }
      const next = lines.map(line => {
        const key = normalizedWord(queryPhrase(line));
        const previous = available.get(key)?.shift();
        return previous ? { id: previous.id, line } : { id: createQueryRowId(), line };
      });
      queryRows = next;
      const activeIds = new Set(next.map(row => row.id));
      const nextAssignments = Object.create(null);
      for (const [id, groupId] of Object.entries(assignments)) {
        if (activeIds.has(id)) nextAssignments[id] = groupId;
      }
      assignments = nextAssignments;
      return next;
    }
    function refreshSourceCache() {
      const lines = queriesInput.value.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
      sourceCache = { value: queriesInput.value, rows: syncQueryRows(lines) };
      queueMorphology(sourceCache.rows.flatMap(row => getWords(queryPhrase(row.line))));
    }
    const normalizedWord = word => word.normalize("NFC").toLocaleLowerCase("ru-RU");
    function groupShortName(name) {
      return (name.match(/[\p{L}\p{N}]/gu) || ["+"]).slice(0, 2).join("").toLocaleUpperCase("ru-RU");
    }
    const morphKey = word => morphAvailable
      ? (morphCache.get(normalizedWord(word))?.key || `word:${normalizedWord(word)}`)
      : `word:${normalizedWord(word)}`;
    function addNegativeWordKeyOverride(word, key) {
      const normalized = normalizedWord(word);
      const current = negativeWordKeyOverrides[normalized] || [];
      if (current.includes(key)) return false;
      negativeWordKeyOverrides = { ...negativeWordKeyOverrides, [normalized]: [...current, key] };
      return true;
    }
    function pruneNegativeWordKeyOverrides() {
      const active = getNegativeWords(rawWords, []);
      const next = Object.create(null);
      for (const [word, keys] of Object.entries(negativeWordKeyOverrides)) {
        if (active.has(word) && Array.isArray(keys) && keys.length) next[word] = keys.slice();
      }
      const before = Object.keys(negativeWordKeyOverrides);
      const after = Object.keys(next);
      if (before.length !== after.length || before.some(word => !next[word])) negativeWordKeyOverrides = next;
    }

    function queryDuplicateKey(line) {
      const keys = getWords(queryPhrase(line)).map(morphKey).sort();
      return `${keys.length}:${keys.join("\u0000")}`;
    }
    function mergeAutomaticNormalizationIntoHistory(field, previousValue) {
      if (historyIndex >= 0 && history[historyIndex]?.[field] === previousValue) {
        history[historyIndex] = snapshot();
        lastEdit = null;
        syncHistoryButtons();
        scheduleSave();
      } else {
        storeHistory("action", field);
      }
    }
    function deduplicateQueries(source) {
      if (queriesInput.value !== source) return;
      const lines = source.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
      const seen = new Set();
      const unique = [];
      for (const line of lines) {
        const key = queryDuplicateKey(line);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(line);
      }
      if (unique.length === lines.length) return;
      queriesInput.value = unique.join("\n");
      refreshSourceCache();
      recalculate();
      mergeAutomaticNormalizationIntoHistory("queries", source);
    }
    function normalizeNegativeWordList(source, displayedSource) {
      if (rawWords !== source || wordsInput.value !== displayedSource) return;
      const seen = new Set();
      const displayed = new Set();
      const normalized = [];
      const nextOverrides = Object.create(null);
      for (const part of source.split(/[\s,;]+/u)) {
        if (!part) continue;
        const match = part.match(/^(-*)([\p{L}\p{N}]+(?:\.[0-9]+)?)$/u);
        if (!match) {
          normalized.push(part);
          continue;
        }
        const word = normalizedWord(match[2]);
        const analysis = morphCache.get(word);
        const keys = Array.isArray(negativeWordKeyOverrides[word]) && negativeWordKeyOverrides[word].length
          ? negativeWordKeyOverrides[word]
          : (analysis ? [analysis.key] : []);
        const comparisonKeys = keys.length ? keys : [`word:${word}`];
        const lemma = analysis?.lemma || word;
        const normalizedLemma = normalizedWord(lemma);
        let hasNewKey = false;
        for (const key of comparisonKeys) {
          if (seen.has(key)) continue;
          seen.add(key);
          hasNewKey = true;
        }
        if (!hasNewKey) continue;
        if (keys.length) {
          if (!nextOverrides[normalizedLemma]) nextOverrides[normalizedLemma] = [];
          for (const key of keys) if (!nextOverrides[normalizedLemma].includes(key)) nextOverrides[normalizedLemma].push(key);
        }
        if (!displayed.has(normalizedLemma)) {
          displayed.add(normalizedLemma);
          normalized.push(`${match[1] ? "-" : ""}${lemma}`);
        }
      }
      const next = normalized.join("\n");
      const overridesChanged = JSON.stringify(negativeWordKeyOverrides) !== JSON.stringify(nextOverrides);
      if (next === source && !overridesChanged) return;
      rawWords = next;
      negativeWordKeyOverrides = nextOverrides;
      setWordsFromCanonical();
      mergeAutomaticNormalizationIntoHistory("words", displayedSource);
    }
    function processPendingInputNormalization() {
      if (morphLoading || morphQueued.size) return;
      const querySource = pendingQueryDeduplication;
      const negativeSource = pendingNegativeWordNormalization;
      pendingQueryDeduplication = null;
      pendingNegativeWordNormalization = null;
      if (querySource !== null) deduplicateQueries(querySource);
      if (negativeSource !== null) normalizeNegativeWordList(negativeSource.raw, negativeSource.displayed);
    }
    function requestQueryDeduplication() {
      const source = queriesInput.value;
      pendingQueryDeduplication = source;
      queueMorphology(getWords(source.split(/\r?\n/u).map(queryPhrase).join("\n")));
      if (!morphLoading && !morphQueued.size) queueMicrotask(processPendingInputNormalization);
    }
    function requestNegativeWordNormalization() {
      const displayed = wordsInput.value;
      const source = rawWords;
      pendingNegativeWordNormalization = { raw: source, displayed };
      queueMorphology(getNegativeWords(source, []));
      if (!morphLoading && !morphQueued.size) queueMicrotask(processPendingInputNormalization);
    }
    function normalizeLoadedInputs() {
      requestQueryDeduplication();
      requestNegativeWordNormalization();
    }

    function queueMorphology(words) {
      if (!morphAvailable) return;
      for (const source of words) {
        const word = normalizedWord(source);
        if (/[а-яё]/iu.test(word) && !morphCache.has(word)) morphQueued.add(word);
      }
      if (!morphLoading && morphQueued.size) void flushMorphology();
    }
    function scheduleMorphologyRetry() {
      if (morphRetryTimer !== null || (morphAvailable && !morphQueued.size)) return;
      const delay = morphAvailable ? morphRetryDelay : MORPH_RECOVERY_INTERVAL_MS;
      morphRetryTimer = setTimeout(() => {
        morphRetryTimer = null;
        if (morphAvailable) void flushMorphology();
        else void recoverMorphology();
      }, delay);
      if (morphAvailable) morphRetryDelay = Math.min(morphRetryDelay * 2, 30000);
    }
    async function waitForMorphologyRateSlot() {
      const wait = Math.max(0, MORPH_REQUEST_INTERVAL_MS - (performance.now() - lastMorphRequestAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastMorphRequestAt = performance.now();
    }
    function requestMorphology(words) {
      const execute = async () => {
        await waitForMorphologyRateSlot();
        const response = await fetch("/api/lemmatize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.analyses || {};
      };
      const pending = morphRequestChain.then(execute, execute);
      morphRequestChain = pending.then(() => undefined, () => undefined);
      return pending;
    }
    async function recoverMorphology() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        morphAvailable = true;
        morphFailureCount = 0;
        morphRetryDelay = 1000;
        queueMorphology(queryRows.flatMap(row => getWords(queryPhrase(row.line))));
        requestQueryDeduplication();
        requestNegativeWordNormalization();
        recalculate();
      } catch (_) {
        scheduleMorphologyRetry();
      }
    }
    async function flushMorphology() {
      if (morphLoading || !morphQueued.size || !morphAvailable) return;
      morphLoading = true;
      let currentBatch = [];
      try {
        while (morphQueued.size) {
          currentBatch = Array.from(morphQueued).slice(0, MORPH_BATCH_SIZE);
          currentBatch.forEach(word => morphQueued.delete(word));
          const analyses = await requestMorphology(currentBatch);
          for (const [word, analysis] of Object.entries(analyses)) morphCache.set(word, analysis);
          currentBatch = [];
          morphFailureCount = 0;
          morphRetryDelay = 1000;
          recalculate();
        }
      } catch (_) {
        morphFailureCount++;
        if (morphFailureCount >= MORPH_FAILURE_LIMIT) {
          morphAvailable = false;
          morphQueued.clear();
          currentBatch = [];
          recalculate();
        } else {
          currentBatch.forEach(word => morphQueued.add(word));
        }
        scheduleMorphologyRetry();
      } finally {
        morphLoading = false;
        if (lemmaFrequencyPending && !morphQueued.size) refreshLemmaFrequency();
        if (!morphQueued.size) processPendingInputNormalization();
      }
    }

    function openDatabase() {
      if (databasePromise) return databasePromise;
      databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open("key-sort", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("projects");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return databasePromise;
    }
    async function databaseGet(key) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const request = db.transaction("projects", "readonly").objectStore("projects").get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
    async function databasePut(key, value) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("projects", "readwrite");
        transaction.objectStore("projects").put(value, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
    async function databaseDelete(key) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("projects", "readwrite");
        transaction.objectStore("projects").delete(key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
    function sessionExpired(savedAt, now = new Date()) {
      const saved = new Date(savedAt);
      if (!Number.isFinite(saved.getTime())) return true;
      const expires = new Date(saved);
      const savedDay = expires.getUTCDate();
      expires.setUTCDate(1);
      expires.setUTCMonth(expires.getUTCMonth() + SESSION_RETENTION_MONTHS);
      const lastDay = new Date(Date.UTC(expires.getUTCFullYear(), expires.getUTCMonth() + 1, 0)).getUTCDate();
      expires.setUTCDate(Math.min(savedDay, lastDay));
      return now.getTime() >= expires.getTime();
    }
    function projectState() {
      return {
        format: "key-sort-project",
        version: 3,
        savedAt: new Date().toISOString(),
        note: noteInput.value,
        queries: queriesInput.value,
        words: wordsInput.value,
        phrases: phrasesInput.value,
        rawWords,
        negativeWordKeyOverrides,
        rawPhrases,
        queryRows,
        groups,
        assignments,
        selectedLengths: lengthChecks.filter(ch => ch.checked).map(ch => Number(ch.dataset.queryLength)),
        settings: {
          click: clickSetting.checked,
          clean: cleanSetting.checked,
          cleanPhrases: cleanPhrasesSetting.checked,
          dash: dashSetting.checked,
          quote: quoteSetting.checked,
          frequencyMode: frequencyMode.checked,
          copyFrequency: copyFrequencySetting.checked,
          copyFrequencyVersion: 2,
          autoLemmaFrequency: autoLemmaFrequencySetting.checked,
          siteFonts: siteFontsSetting.checked,
          queryTextFilter: queryTextFilter.value,
          frequencyFilterOperator: frequencyFilterOperator.value,
          frequencyFilterValue: frequencyFilterValue.value
        }
      };
    }
    function normalizeProjectState(source) {
      if (!source || source.format !== "key-sort-project" || ![1, 2, 3].includes(source.version)) throw new Error("Неподдерживаемый файл проекта");
      if (typeof source.queries !== "string" || source.queries.length > 20_000_000 ||
          typeof source.words !== "string" || source.words.length > 2_000_000 ||
          typeof source.phrases !== "string" || source.phrases.length > 2_000_000) throw new Error("Некорректный размер данных проекта");
      if (!Array.isArray(source.groups) || source.groups.length < 1 || source.groups.length > 100) throw new Error("Некорректный список групп");
      const groupIds = new Set();
      const normalizedGroups = source.groups.map(group => {
        if (!group || typeof group.id !== "string" || !group.id || group.id.length > 100 ||
            typeof group.name !== "string" || !group.name.trim() || group.name.trim().length > 30 || groupIds.has(group.id)) {
          throw new Error("Некорректная или повторяющаяся группа");
        }
        groupIds.add(group.id);
        const name = group.name.trim();
        return { id: group.id, name, short: groupShortName(name) };
      });
      const lines = source.queries.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
      if (lines.length > 100_000) throw new Error("Слишком много поисковых запросов");
      const storedRows = Array.isArray(source.queryRows) ? source.queryRows : [];
      const rowIds = new Set();
      const normalizedRows = lines.map((line, index) => {
        const stored = storedRows[index];
        const id = stored && stored.line === line && typeof stored.id === "string" && stored.id && stored.id.length <= 100 && !rowIds.has(stored.id)
          ? stored.id
          : createQueryRowId();
        rowIds.add(id);
        return { id, line };
      });
      const normalizedAssignments = Object.create(null);
      const sourceAssignments = source.assignments && typeof source.assignments === "object" && !Array.isArray(source.assignments)
        ? source.assignments
        : {};
      for (const row of normalizedRows) {
        const selected = sourceAssignments[row.id] ?? sourceAssignments[row.line];
        const groupId = Array.isArray(selected) ? selected.find(id => groupIds.has(String(id))) : selected;
        if (groupId !== undefined && groupIds.has(String(groupId))) normalizedAssignments[row.id] = String(groupId);
      }
      const selectedLengths = Array.isArray(source.selectedLengths)
        ? source.selectedLengths.map(Number).filter(value => Number.isInteger(value) && value >= 1 && value <= 6)
        : [];
      const normalizedWordOverrides = Object.create(null);
      const activeNegativeWords = getNegativeWords(typeof source.rawWords === "string" ? source.rawWords : source.words, []);
      const sourceWordOverrides = source.negativeWordKeyOverrides && typeof source.negativeWordKeyOverrides === "object" && !Array.isArray(source.negativeWordKeyOverrides)
        ? source.negativeWordKeyOverrides
        : {};
      for (const [word, keys] of Object.entries(sourceWordOverrides)) {
        const normalized = normalizedWord(word);
        if (!activeNegativeWords.has(normalized) || !Array.isArray(keys)) continue;
        const validKeys = Array.from(new Set(keys.filter(key => typeof key === "string" && key.length > 0 && key.length <= 200)));
        if (validKeys.length) normalizedWordOverrides[normalized] = validKeys;
      }
      return {
        ...source,
        note: typeof source.note === "string" ? source.note.slice(0, 100) : "",
        groups: normalizedGroups,
        queryRows: normalizedRows,
        assignments: normalizedAssignments,
        negativeWordKeyOverrides: normalizedWordOverrides,
        selectedLengths,
        settings: source.settings && typeof source.settings === "object" && !Array.isArray(source.settings) ? source.settings : {}
      };
    }
    function applyProjectState(source) {
      const state = normalizeProjectState(source);
      noteInput.value = state.note || "";
      queriesInput.value = state.queries;
      wordsInput.value = state.words;
      phrasesInput.value = state.phrases;
      rawWords = typeof state.rawWords === "string" ? state.rawWords : state.words;
      negativeWordKeyOverrides = state.negativeWordKeyOverrides || Object.create(null);
      rawPhrases = typeof state.rawPhrases === "string" ? state.rawPhrases : state.phrases;
      groups = state.groups;
      queryRows = state.queryRows;
      assignments = state.assignments;
      const chosen = new Set(state.selectedLengths || []);
      lengthChecks.forEach(ch => { ch.checked = chosen.has(Number(ch.dataset.queryLength)); });
      const settings = state.settings || {};
      clickSetting.checked = settings.click !== false;
      cleanSetting.checked = settings.clean !== false;
      cleanPhrasesSetting.checked = settings.cleanPhrases !== false;
      dashSetting.checked = Boolean(settings.dash);
      quoteSetting.checked = Boolean(settings.quote);
      frequencyMode.checked = Boolean(settings.frequencyMode);
      copyFrequencySetting.checked = Number(settings.copyFrequencyVersion) >= 2 && Boolean(settings.copyFrequency);
      autoLemmaFrequencySetting.checked = Boolean(settings.autoLemmaFrequency);
      siteFontsSetting.checked = settings.siteFonts !== false;
      wordsInput.value = dashSetting.checked ? formatWords(wordTextToLines(rawWords)) : wordTextToLines(rawWords);
      queryTextFilter.value = typeof settings.queryTextFilter === "string" ? settings.queryTextFilter.slice(0, 200) : "";
      frequencyFilterOperator.value = settings.frequencyFilterOperator === "lt" ? "lt" : "gt";
      frequencyFilterValue.value = typeof settings.frequencyFilterValue === "string" || typeof settings.frequencyFilterValue === "number"
        ? String(settings.frequencyFilterValue).replace(/\D+/gu, "").slice(0, 15)
        : "";
      syncFrequencyFilterVisibility();
      lemmaFrequencyHasResult = false;
      $("lemmaFrequencyItems").replaceChildren(lemmaFrequencyMessage("Нажмите «Обновить»"));
      syncFontMode();
      sourceCache = { value: queriesInput.value, rows: queryRows };
      queueMorphology(queryRows.flatMap(row => getWords(queryPhrase(row.line))));
      lastRenderedClickable = null;
      syncPageTitle();
      syncClickableView();
      recalculate();
    }
    function scheduleSave() {
      if (restoringHistory) return;
      $("saveStatus").textContent = "Есть несохранённые изменения";
      if (saveTimer !== null) return;
      saveTimer = setTimeout(() => void saveNow(), 30000);
    }
    async function saveNow() {
      clearTimeout(saveTimer);
      saveTimer = null;
      try {
        await databasePut("current", projectState());
        $("saveStatus").textContent = "Сохранено в браузере";
      } catch (_) {
        $("saveStatus").textContent = "Автосохранение недоступно";
      }
    }
    function safeFileName() {
      const base = noteInput.value.trim() || "key-sort-project";
      return base.replace(/[<>:"/\\|?*\x00-\x1F]/gu, "_").slice(0, 80) + ".json";
    }
    function exportProject() {
      const blob = new Blob([JSON.stringify(projectState(), null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = safeFileName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    function getNegativeWords(raw, warnings) {
      const result = new Set();
      for (const part of raw.split(/[\s,;]+/u)) {
        if (!part) continue;
        if (/^[!+]/u.test(part.replace(/^-+/u, ""))) {
          warnings.push(`Спецсимволы используйте в Минус-фразах: «${part}»`);
          continue;
        }
        const word = part.replace(/^-+/u, "");
        if (!/^[\p{L}\p{N}]+(?:\.[0-9]+)?$/u.test(word)) {
          warnings.push(`Некорректное минус-слово «${part}»`);
          continue;
        }
        result.add(word.normalize("NFC").toLocaleLowerCase("ru-RU"));
      }
      return result;
    }

    // Разделители фраз: новая строка или запятая, но не внутри кавычек/скобок.
    // Оставляем разделители на месте, чтобы переключатель форматирования был обратимым.
    function phrasePieces(raw) {
      const out = [];
      let start = 0, quoted = false, brackets = 0;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === '"') quoted = !quoted;
        else if (!quoted && ch === "[") brackets++;
        else if (!quoted && ch === "]") brackets = Math.max(0, brackets - 1);
        if ((ch === "," || ch === "\n" || ch === "\r") && !quoted && brackets === 0) {
          out.push({ text: raw.slice(start, i), sep: ch });
          start = i + 1;
        }
      }
      out.push({ text: raw.slice(start), sep: "" });
      return out;
    }
    function splitPhrases(raw) { return phrasePieces(raw).map(p => p.text.trim()).filter(Boolean); }
    function getNegativePhrases(raw, warnings, skipDraft = false) {
      const phrases = [], seen = new Set();
      const pieces = phrasePieces(raw);
      // Пока пользователь пишет последнюю строку, она ещё не завершена.
      // Иначе одна введённая буква могла временно скрыть запрос, а затем
      // вернуть его после ввода следующего слова.
      if (skipDraft && pieces.length && !pieces[pieces.length - 1].sep) pieces.pop();
      for (const piece of pieces) {
        const sourceRaw = piece.text.trim();
        if (!sourceRaw) continue;
        let source = sourceRaw.replace(/^\s*-\s*/u, "").trim();
        let type = "all";
        // Автоматически добавленные кавычки — лишь оформление. Сочетания
        // [слова] и -"[слова]" должны фильтровать ОДИНАКОВО.
        if (source.startsWith('"') && source.endsWith('"') && source.length >= 2) {
          type = "exact";
          source = source.slice(1, -1).trim();
        }
        if (source.startsWith("[") && source.endsWith("]") && source.length >= 2) {
          type = "ordered";
          source = source.slice(1, -1).trim();
        }
        if (/["\[\]]/u.test(source)) {
          warnings.push(`Некорректные кавычки или скобки: «${sourceRaw}»`);
          continue;
        }
        // + и ! сохраняются для Коммандера, но при отключённой морфологии
        // оба означают точное совпадение со словом. Допускаем также - перед
        // словом (в первую очередь для уже скопированного списка).
        const pattern = /^(?:[+!\-]?[\p{L}\p{N}]+(?:\.[0-9]+)?)(?:\s+[+!\-]?[\p{L}\p{N}]+(?:\.[0-9]+)?)*$/u;
        if (!pattern.test(source)) {
          warnings.push(`Некорректная запись минус-фразы: «${sourceRaw}»`);
          continue;
        }
        const tokens = source.split(/\s+/u).filter(Boolean).map(token => {
          const match = token.match(/^([!+]?)([\p{L}\p{N}]+(?:\.[0-9]+)?)$/u);
          if (!match) return null;
          return { word: normalizedWord(match[2]), fixed: match[1] === "!", forced: match[1] === "+" || match[1] === "!" };
        });
        if (!tokens.length || tokens.some(token => token === null)) {
          warnings.push(`Некорректные операторы в минус-фразе: «${sourceRaw}»`);
          continue;
        }
        if (tokens.length > 7) {
          warnings.push(`В минус-фразе больше 7 слов: «${sourceRaw}»`);
          continue;
        }
        const key = `${type}:${tokens.map(token => `${token.fixed ? "!" : token.forced ? "+" : ""}${token.word}`).join("\u0000")}`;
        if (!seen.has(key)) { seen.add(key); phrases.push({ type, tokens, words: tokens.map(token => token.word) }); }
      }
      return phrases;
    }
    const STOP_POS = new Set(["PREP", "CONJ", "PRCL", "NPRO"]);
    function effectivePhraseTokens(phrase) {
      if (phrase.type !== "all") return phrase.tokens;
      return phrase.tokens.filter(token => token.forced || !STOP_POS.has(morphCache.get(token.word)?.pos));
    }
    function phraseTokenMatches(queryWord, token) {
      return token.fixed ? normalizedWord(queryWord) === token.word : morphKey(queryWord) === morphKey(token.word);
    }
    function uniqueExactPhraseTokens(tokens) {
      const seen = new Set();
      return tokens.filter(token => {
        const key = token.fixed ? `fixed:${token.word}` : `morph:${morphKey(token.word)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    function uniqueExactQueryWords(words) {
      const seen = new Set();
      return words.filter(word => {
        const key = normalizedWord(word);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    function phraseMatches(query, phrase) {
      let tokens = effectivePhraseTokens(phrase);
      if (!tokens.length) return false;
      if (phrase.type === "exact") {
        tokens = uniqueExactPhraseTokens(tokens);
        const queryWords = uniqueExactQueryWords(query.words);
        if (queryWords.length !== tokens.length) return false;
        const used = new Set();
        return tokens.every(token => {
          const index = queryWords.findIndex((word, i) => !used.has(i) && phraseTokenMatches(word, token));
          if (index < 0) return false;
          used.add(index);
          return true;
        });
      }
      if (phrase.type === "all") {
        const used = new Set();
        return tokens.every(token => {
          const index = query.words.findIndex((word, i) => !used.has(i) && phraseTokenMatches(word, token));
          if (index < 0) return false;
          used.add(index);
          return true;
        });
      }
      const len = tokens.length;
      for (let i = 0; i <= query.words.length - len; i++) {
        let ok = true;
        for (let j = 0; j < len; j++) if (!phraseTokenMatches(query.words[i + j], tokens[j])) { ok = false; break; }
        if (ok) return true;
      }
      return false;
    }
    function phraseIndexKey(token) {
      return token.fixed ? `fixed:${token.word}` : `morph:${morphKey(token.word)}`;
    }
    function buildNegativePhraseIndex(phrases) {
      const index = new Map();
      for (const phrase of phrases) {
        const first = effectivePhraseTokens(phrase)[0];
        if (!first) continue;
        const key = phraseIndexKey(first);
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(phrase);
      }
      return index;
    }
    function negativePhraseCandidates(words, index) {
      const candidates = new Set();
      for (const word of words) {
        for (const key of [`fixed:${normalizedWord(word)}`, `morph:${morphKey(word)}`]) {
          for (const phrase of index.get(key) || []) candidates.add(phrase);
        }
      }
      return candidates;
    }

    function wordTextToLines(s, trimEnd = false) {
      let v = s.replace(/[\s,;]+/gu, "\n").replace(/^\n/u, "");
      if (trimEnd) v = v.trimEnd();
      return v;
    }

    // Нормализуем только при включённом соответствующем переключателе.
    function cleanWordText(s, trimEnd = false) {
      const chars = Array.from(s);
      const res = [];
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (/[\p{L}\p{N}!+\[\]]/u.test(ch)) { res.push(ch); continue; }
        if (ch === "." && /[0-9]/.test(chars[i - 1] || "") && /[0-9]/.test(chars[i + 1] || "")) {
          res.push(ch); continue;
        }
        res.push(" ");
      }
      return wordTextToLines(res.join(""), trimEnd);
    }

    // Очистка минус-фраз не должна удалять их разделители или операторы.
    // В отличие от Минус-слов, запятая и перевод строки здесь значимы.
    function cleanPhraseText(s) {
      let value = s.replace(/\r\n?/gu, "\n").replace(/[«»“”„]/gu, '"');
      const chars = Array.from(value);
      const cleaned = [];
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (/[\p{L}\p{N} !+\[\]"\-,\n]/u.test(ch)) { cleaned.push(ch); continue; }
        if (ch === "." && /[0-9]/.test(chars[i - 1] || "") && /[0-9]/.test(chars[i + 1] || "")) {
          cleaned.push(ch); continue;
        }
        cleaned.push(" ");
      }
      return cleaned.join("")
        .replace(/ {2,}/gu, " ")                // Двойные пробелы.
        .replace(/ *\n */gu, "\n")             // Нет пробелов вокруг переводов строк.
        .replace(/\n{2,}/gu, "\n")             // Без пустых промежуточных строк.
        .replace(/ *, */gu, ", ")               // Запятая как разделитель.
        .replace(/(?:, *){2,}/gu, ", ")         // Повторные запятые.
        .replace(/, *\n/gu, "\n")              // Два разделителя подряд.
        .replace(/-{2,}/gu, "-")                  // Не дублировать минусы.
        .replace(/!{2,}/gu, "!")                 // Не дублировать ! и +.
        .replace(/\+{2,}/gu, "+")
        .replace(/"{2,}/gu, '"')
        .replace(/\[{2,}/gu, "[")
        .replace(/\]{2,}/gu, "]")
        .replace(/^ +/u, "");
    }

    // Прокрутка следует за новыми записями только пока пользователь находится внизу.
    // Собственная прокрутка курсора браузером не считается ручным изменением позиции.
    function stickyBottom(el) {
      let follow = true;
      let manualTop = 0;
      let userUntil = 0;
      let draggingBar = false;
      const atBottom = () => el.scrollHeight - el.clientHeight - el.scrollTop <= 14;
      function record() { follow = atBottom(); manualTop = el.scrollTop; }
      function markUser() {
        userUntil = performance.now() + 450;
        requestAnimationFrame(record);
      }
      el.addEventListener("wheel", markUser, { passive: true });
      el.addEventListener("touchmove", markUser, { passive: true });
      el.addEventListener("pointerdown", e => {
        const rect = el.getBoundingClientRect();
        // Обработка перетаскивания полосы прокрутки.
        if (e.clientX > rect.right - 23) { draggingBar = true; userUntil = performance.now() + 3000; }
      });
      window.addEventListener("pointerup", () => {
        if (draggingBar) { draggingBar = false; markUser(); }
      });
      el.addEventListener("keydown", e => {
        if (["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(e.key) && !e.ctrlKey && !e.metaKey) markUser();
      });
      el.addEventListener("scroll", () => {
        if (draggingBar || performance.now() < userUntil) record();
      }, { passive: true });
      el.addEventListener("beforeinput", () => { userUntil = 0; });
      return {
        edited() {
          userUntil = 0;
          if (follow) el.scrollTop = el.scrollHeight;
          else el.scrollTop = Math.min(manualTop, Math.max(0, el.scrollHeight - el.clientHeight));
        },
      };
    }
    const wordsScroll = stickyBottom(wordsInput);
    const phrasesScroll = stickyBottom(phrasesInput);

    const wordParts = s => s.split(/([\s,;]+)/u);
    function formatWords(raw) {
      return wordParts(raw).map(token => {
        if (!token || /^[\s,;]+$/u.test(token)) return token;
        return /^-/u.test(token) ? token : (/[\p{L}\p{N}]/u.test(token) ? "-" + token : token);
      }).join("");
    }
    // Снимаем автоматически добавленные '-', сохраняя те, что были написаны вручную
    // до включения настройки (сопоставление по позиции и содержимому слова).
    function unformatWords(display, previous) {
      const parts = wordParts(display);
      const prior = wordParts(previous).filter(p => p && !/^[\s,;]+$/u.test(p));
      let index = 0;
      return parts.map(token => {
        if (!token || /^[\s,;]+$/u.test(token)) return token;
        const existing = prior[index++] || "";
        if (token.startsWith("-")) {
          if (existing.startsWith("-") && existing.slice(1) === token.slice(1)) return token;
          return token.slice(1);
        }
        return token;
      }).join("");
    }

    function formatPhrasePiece(piece) {
      const leading = (piece.match(/^\s*/u) || [""])[0];
      const core = piece.slice(leading.length);
      if (!core || !core.trim()) return piece;
      const trimmed = core.trimEnd();
      const trailing = core.slice(trimmed.length);
      if (/^-\s*".*"$/su.test(trimmed)) return piece;
      if (/^".*"$/su.test(trimmed)) return leading + "-" + trimmed + trailing;
      // И квадратные скобки должны попасть внутрь кавычек: -"[фраза]".
      // Не трогаем оператор '-' пользователя, если он уже был в начале.
      if (/^-\s*$/u.test(trimmed)) return piece;
      const body = trimmed.replace(/^-\s*/u, "");
      // Пока фраза не закончена, пробел после слова остаётся ВНУТРИ кавычек.
      // Для закрытых [скобок] пробел уже является внешним разделителем.
      const completedBracket = /^\[.*\]$/su.test(body);
      return leading + '-"' + body + (completedBracket ? '"' + trailing : trailing + '"');
    }
    function formatPhrases(raw) { return phrasePieces(raw).map(p => formatPhrasePiece(p.text) + p.sep).join(""); }
    function unformatPhrasePiece(piece, previousPiece, preserveManualWrapper = false) {
      const leading = (piece.match(/^\s*/u) || [""])[0];
      const trailing = (piece.match(/\s*$/u) || [""])[0];
      const core = piece.slice(leading.length, piece.length - trailing.length);
      const previous = previousPiece.trim();
      if (!core) return piece;
      if (/^-\s*".*"$/su.test(core)) {
        const inner = core.replace(/^-\s*"/u, "").slice(0, -1);
        if (/^-\s*".*"$/su.test(previous) || (preserveManualWrapper && !previous)) {
          return leading + '-"' + inner + '"' + trailing;
        }
        if (/^".*"$/su.test(previous)) return leading + '"' + inner + '"' + trailing;
        if (/^-\s*\[.*\]$/su.test(previous) || (previous.startsWith("-") && !previous.startsWith('-"'))) {
          return leading + '-' + inner + trailing;
        }
        return leading + inner + trailing;
      }
      if (/^-\s*\[.*\]$/su.test(core)) {
        return leading + (previous.startsWith("-[") ? core : core.replace(/^-\s*/u, "")) + trailing;
      }
      if (core.startsWith('-"')) return leading + core.slice(2).replace(/"$/u, "") + trailing;
      if (core.startsWith("-")) return leading + core.slice(1) + trailing;
      return piece;
    }
    function unformatPhrases(display, previous, preserveManualWrapper = false) {
      const parts = phrasePieces(display);
      const prev = phrasePieces(previous);
      return parts.map((p, i) => unformatPhrasePiece(p.text, prev[i] ? prev[i].text : "", preserveManualWrapper) + p.sep).join("");
    }
    function mapWordCursor(oldText, newText, pos) {
      // Если сам текст не менялся — позицию оставляем.
      if (oldText === newText) return pos;
      const oldTokens = wordParts(oldText);
      let consumed = 0, delta = 0;
      for (const token of oldTokens) {
        if (consumed + token.length >= pos) {
          if (token && !/^[\s,;]+$/u.test(token) && !token.startsWith("-") && /[\p{L}\p{N}]/u.test(token)) delta++;
          break;
        }
        if (token && !/^[\s,;]+$/u.test(token) && !token.startsWith("-") && /[\p{L}\p{N}]/u.test(token)) delta++;
        consumed += token.length;
      }
      return Math.min(newText.length, Math.max(0, pos + delta));
    }
    function mapPhraseCursor(oldText, newText, pos) {
      if (oldText === newText) return pos;
      const parts = phrasePieces(oldText);
      let consumedOld = 0, consumedNew = 0;
      for (const p of parts) {
        const formatted = formatPhrasePiece(p.text);
        if (pos <= consumedOld + p.text.length) {
          const offset = pos - consumedOld;
          const lead = (p.text.match(/^\s*/u) || [""])[0].length;
          const oldCore = p.text.trim();
          const newCore = formatted.trim();
          let inserted = 0;
          if (newCore.startsWith('-"') && !oldCore.startsWith('-"')) inserted = oldCore.startsWith('"') || oldCore.startsWith('-') ? 1 : 2;
          else if (newCore.startsWith('-[') && !oldCore.startsWith('-[')) inserted = 1;
          return Math.min(newText.length, consumedNew + offset + (offset > lead ? inserted : 0));
        }
        consumedOld += p.text.length + p.sep.length;
        consumedNew += formatted.length + p.sep.length;
      }
      return newText.length;
    }
    // Стараемся сохранить позицию курсора при очистке, а не отправлять его в конец.
    function mapCleanPhraseCursor(oldText, newText, pos) {
      if (oldText === newText) return pos;
      if (pos === oldText.length) return newText.length;
      const before = cleanPhraseText(oldText.slice(0, pos));
      return Math.min(before.length, newText.length);
    }
    function replaceKeepingCursor(el, value, calcCursor) {
      if (el.value === value) return;
      const active = document.activeElement === el;
      const old = el.value;
      const start = active ? el.selectionStart : 0;
      const end = active ? el.selectionEnd : 0;
      el.value = value;
      if (active) {
        el.setSelectionRange(calcCursor(old, value, start), calcCursor(old, value, end));
      }
    }
    function updateWordsFromInput(e) {
      const displayed = wordsInput.value;
      rawWords = dashSetting.checked ? unformatWords(displayed, rawWords) : displayed;
      if (cleanSetting.checked) rawWords = cleanWordText(rawWords);
      else rawWords = wordTextToLines(rawWords);
      pruneNegativeWordKeyOverrides();
      if (dashSetting.checked || cleanSetting.checked || displayed !== rawWords) {
        const desired = dashSetting.checked ? formatWords(rawWords) : rawWords;
        replaceKeepingCursor(wordsInput, desired, (o, n, p) => dashSetting.checked ? mapWordCursor(o, n, p) : Math.min(p, n.length));
      }
      wordsScroll.edited();
      scheduleRecalculate();
      storeTextEdit("words", e);
      if (e && (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop")) requestNegativeWordNormalization();
    }
    function updatePhrasesFromInput(e) {
      const displayed = phrasesInput.value;
      const cursor = phrasesInput.selectionStart;
      rawPhrases = quoteSetting.checked ? unformatPhrases(displayed, rawPhrases, e && e.inputType === "insertFromPaste") : displayed;
      if (cleanPhrasesSetting.checked) rawPhrases = cleanPhraseText(rawPhrases);
      const desired = quoteSetting.checked ? formatPhrases(rawPhrases) : rawPhrases;
      if (displayed !== desired) {
        // Сначала очистка, затем (если включено) форматирование для Коммандера.
        const cleanDisplayed = cleanPhrasesSetting.checked ? cleanPhraseText(displayed) : displayed;
        const mappedCleanCursor = cleanPhrasesSetting.checked ? mapCleanPhraseCursor(displayed, cleanDisplayed, cursor) : cursor;
        const mappedFinalCursor = quoteSetting.checked
          ? mapPhraseCursor(cleanDisplayed, desired, mappedCleanCursor)
          : mappedCleanCursor;
        phrasesInput.value = desired;
        phrasesInput.setSelectionRange(mappedFinalCursor, mappedFinalCursor);
      }
      phrasesScroll.edited();
      scheduleRecalculate();
      storeTextEdit("phrases", e);
    }
    function setWordsFromCanonical() {
      const lines = wordTextToLines(rawWords);
      wordsInput.value = dashSetting.checked ? formatWords(lines) : lines;
      wordsScroll.edited();
      scheduleRecalculate();
    }
    async function analysisForNegativeWord(source) {
      const word = normalizedWord(source);
      let analysis = morphCache.get(word);
      if (!analysis && morphAvailable && /[а-яё]/iu.test(word)) {
        try {
          let pending = directMorphRequests.get(word);
          if (!pending) {
            pending = requestMorphology([word])
              .then(analyses => analyses[word] || null)
              .finally(() => directMorphRequests.delete(word));
            directMorphRequests.set(word, pending);
          }
          analysis = await pending;
          if (analysis) morphCache.set(word, analysis);
        } catch (_) {
          analysis = null;
          morphQueued.add(word);
          scheduleMorphologyRetry();
        }
      }
      return {
        word: analysis?.lemma || word,
        key: analysis?.key || null
      };
    }
    async function addNegativeWord(source) {
      const analysis = await analysisForNegativeWord(source);
      return performHistoryAction(() => {
        const normalized = normalizedWord(analysis.word);
        const keyAdded = analysis.key ? addNegativeWordKeyOverride(normalized, analysis.key) : false;
        if (!getNegativeWords(rawWords, []).has(normalized)) {
          rawWords += (rawWords && !/[\s,;]$/u.test(rawWords) ? "\n" : "") + analysis.word;
          if (cleanSetting.checked) rawWords = cleanWordText(rawWords);
          setWordsFromCanonical();
        } else if (!keyAdded) {
          return;
        } else {
          scheduleRecalculate();
        }
      });
    }
    function negativeWordRangeAt(text, position) {
      const matcher = /[-!+]*[\p{L}\p{N}]+(?:\.[0-9]+)?/gu;
      let match;
      while ((match = matcher.exec(text)) !== null) {
        if (position >= match.index && position < match.index + match[0].length) {
          return { start: match.index, end: match.index + match[0].length };
        }
      }
      return null;
    }
    function removeNegativeWordAt(start, end) {
      performHistoryAction(() => {
        const displayed = wordsInput.value;
        const after = displayed.slice(end).match(/^[\s,;]+/u)?.[0] || "";
        const before = after ? "" : (displayed.slice(0, start).match(/[\s,;]+$/u)?.[0] || "");
        const removeStart = start - before.length;
        const removeEnd = end + after.length;
        const next = displayed.slice(0, removeStart) + displayed.slice(removeEnd);
        wordsInput.value = next;
        rawWords = dashSetting.checked ? unformatWords(next, rawWords) : next;
        if (cleanSetting.checked) rawWords = cleanWordText(rawWords, true);
        pruneNegativeWordKeyOverrides();
        setWordsFromCanonical();
        const cursor = Math.min(removeStart, wordsInput.value.length);
        wordsInput.setSelectionRange(cursor, cursor);
      });
    }
    function lemmaFrequencyMessage(text) {
      const message = document.createElement("div");
      message.className = "lemma-frequency-empty";
      message.textContent = text;
      return message;
    }
    function renderLemmaFrequency() {
      const items = $("lemmaFrequencyItems");
      const previousScrollTop = items.scrollTop;
      const counts = new Map();
      for (const row of lastRemaining) {
        const inQuery = new Map();
        for (const word of getWords(queryPhrase(row.line))) {
          const normalized = normalizedWord(word);
          const analysis = morphCache.get(normalized);
          const key = analysis?.key || `word:${normalized}`;
          if (!inQuery.has(key)) inQuery.set(key, analysis?.lemma || normalized);
        }
        for (const [key, lemma] of inQuery) {
          const current = counts.get(key);
          if (current) current.count++;
          else counts.set(key, { lemma, count: 1 });
        }
      }
      const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma, "ru"));
      if (!sorted.length) {
        items.replaceChildren(lemmaFrequencyMessage("Нераспределённых запросов нет"));
      } else {
        const header = document.createElement("div");
        header.className = "lemma-frequency-row lemma-frequency-columns";
        const wordHead = document.createElement("div");
        wordHead.className = "lemma-frequency-label";
        wordHead.textContent = "Слово";
        const countHead = document.createElement("div");
        countHead.className = "lemma-frequency-count";
        countHead.textContent = "Запросов";
        header.append(wordHead, countHead);
        const rows = sorted.map(entry => {
          const row = document.createElement("div");
          row.className = "lemma-frequency-row";
          const word = document.createElement("button");
          word.type = "button";
          word.className = "lemma-frequency-word";
          word.dataset.word = entry.lemma;
          word.textContent = entry.lemma;
          word.title = `Добавить «${entry.lemma}» в минус-слова`;
          const count = document.createElement("div");
          count.className = "lemma-frequency-count";
          count.textContent = formatter.format(entry.count);
          row.append(word, count);
          return row;
        });
        items.replaceChildren(header, ...rows);
      }
      items.scrollTop = previousScrollTop;
      lemmaFrequencyHasResult = true;
      lemmaFrequencyPending = false;
      $("refreshLemmaFrequency").disabled = false;
    }
    function refreshLemmaFrequency() {
      if (morphAvailable && (morphLoading || morphQueued.size)) {
        lemmaFrequencyPending = true;
        $("refreshLemmaFrequency").disabled = true;
        if (!lemmaFrequencyHasResult) {
          $("lemmaFrequencyItems").replaceChildren(lemmaFrequencyMessage("Ожидание морфологии…"));
        }
        if (!morphLoading) void flushMorphology();
        return;
      }
      renderLemmaFrequency();
    }
    function setPhrasesFromCanonical() {
      phrasesInput.value = quoteSetting.checked ? formatPhrases(rawPhrases) : rawPhrases;
      phrasesScroll.edited();
      scheduleRecalculate();
    }

    // Не пересоздаём кликабельные слова, если видимый список не изменился.
    // Иначе пересчёт после ухода из поля Минус-фраз может оборвать
    // первое же выделение мышью, пока пользователь протягивает курсор.
    const VIRTUAL_ROW_HEIGHT = 24;
    const VIRTUAL_OVERSCAN = 20;
    let lastRenderedClickable = null;
    function assignedGroup(row) {
      const value = assignments[row.id];
      const candidates = Array.isArray(value) ? value : [value];
      return candidates.find(id => groups.some(group => group.id === id)) || null;
    }
    function moveGroup(groupId, offset) {
      const index = groups.findIndex(group => group.id === groupId);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= groups.length) return;
      performHistoryAction(() => {
        const next = groups.slice();
        [next[index], next[target]] = [next[target], next[index]];
        groups = next;
        lastRenderedClickable = null;
        recalculate();
      });
    }
    function deleteGroup(groupId) {
      if (groups.length <= 1) return;
      performHistoryAction(() => {
        groups = groups.filter(group => group.id !== groupId);
        assignments = Object.fromEntries(Object.entries(assignments).filter(([, assigned]) => assigned !== groupId));
        lastRenderedClickable = null;
        recalculate();
      });
    }
    function renameGroup(group, title, controls) {
      const input = document.createElement("input");
      input.className = "group-rename-input";
      input.value = group.name;
      input.maxLength = 30;
      input.setAttribute("aria-label", `Новое название группы «${group.name}»`);
      title.replaceWith(input);
      controls.replaceChildren();
      const groupIndex = groups.findIndex(item => item.id === group.id);
      const left = document.createElement("button");
      left.type = "button";
      left.className = "group-control";
      left.textContent = "←";
      left.title = "Переместить группу влево";
      left.disabled = groupIndex === 0;
      left.addEventListener("click", () => moveGroup(group.id, -1));
      const right = document.createElement("button");
      right.type = "button";
      right.className = "group-control";
      right.textContent = "→";
      right.title = "Переместить группу вправо";
      right.disabled = groupIndex === groups.length - 1;
      right.addEventListener("click", () => moveGroup(group.id, 1));
      const save = document.createElement("button");
      save.type = "button";
      save.className = "group-control group-rename";
      save.textContent = "Сохранить";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "group-control group-delete";
      remove.textContent = "Удалить";
      remove.disabled = groups.length <= 1;
      remove.addEventListener("click", () => deleteGroup(group.id));
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "group-control";
      cancel.textContent = "×";
      const commit = () => {
        const name = input.value.trim();
        if (!name || groups.some(item => item.id !== group.id && item.name.toLocaleLowerCase("ru-RU") === name.toLocaleLowerCase("ru-RU"))) {
          input.focus();
          return;
        }
        performHistoryAction(() => {
          groups = groups.map(item => item.id === group.id ? {
            ...item,
            name,
            short: groupShortName(name)
          } : item);
          lastRenderedClickable = null;
          recalculate();
        });
      };
      save.addEventListener("click", commit);
      cancel.addEventListener("click", () => recalculate());
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") { event.preventDefault(); commit(); }
        if (event.key === "Escape") { event.preventDefault(); recalculate(); }
      });
      controls.append(left, right, save, remove, cancel);
      input.focus();
      input.select();
    }
    const GROUP_ROW_HEIGHT = 26;
    const GROUP_VIRTUAL_OVERSCAN = 12;
    function createGroupListItem(row) {
      const parsed = parseQueryLine(row.line);
      const item = document.createElement("div");
      item.className = "group-list-item";
      const text = document.createElement("div");
      text.className = "group-list-text";
      text.textContent = parsed.phrase;
      text.title = parsed.phrase;
      item.append(text);
      if (frequencyMode.checked) {
        const frequency = document.createElement("div");
        frequency.className = "group-list-frequency";
        frequency.textContent = parsed.frequency;
        item.append(frequency);
      }
      const back = document.createElement("button");
      back.type = "button";
      back.className = "group-list-return";
      back.textContent = "×";
      back.title = "Вернуть в нераспределённые";
      back.setAttribute("aria-label", `Вернуть «${row.line}» в нераспределённые`);
      back.addEventListener("click", () => {
        performHistoryAction(() => {
          const next = { ...assignments };
          delete next[row.id];
          assignments = next;
          lastRenderedClickable = null;
          recalculate();
        });
      });
      item.append(back);
      return item;
    }
    function renderVirtualGroupItems(items, grouped) {
      if (!grouped.length) {
        const empty = document.createElement("div");
        empty.className = "group-list-empty";
        empty.textContent = "Список пуст";
        items.replaceChildren(empty);
        return;
      }
      let frame = null;
      let renderedStart = -1;
      let renderedEnd = -1;
      const render = () => {
        const scrollTop = items.scrollTop;
        const start = Math.max(0, Math.floor(scrollTop / GROUP_ROW_HEIGHT) - GROUP_VIRTUAL_OVERSCAN);
        const count = Math.ceil((items.clientHeight || 530) / GROUP_ROW_HEIGHT) + GROUP_VIRTUAL_OVERSCAN * 2;
        const end = Math.min(grouped.length, start + count);
        if (start === renderedStart && end === renderedEnd) return;
        renderedStart = start;
        renderedEnd = end;
        const children = [];
        if (start > 0) {
          const spacer = document.createElement("div");
          spacer.className = "group-list-spacer";
          spacer.style.height = `${start * GROUP_ROW_HEIGHT}px`;
          children.push(spacer);
        }
        for (let index = start; index < end; index++) children.push(createGroupListItem(grouped[index]));
        if (end < grouped.length) {
          const spacer = document.createElement("div");
          spacer.className = "group-list-spacer";
          spacer.style.height = `${(grouped.length - end) * GROUP_ROW_HEIGHT}px`;
          children.push(spacer);
        }
        items.replaceChildren(...children);
        items.scrollTop = scrollTop;
      };
      items.addEventListener("scroll", () => {
        if (frame !== null) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          render();
        });
      }, { passive: true });
      render();
    }
    function renderGroupLists(lines) {
      const root = $("groupLists");
      const lemmaFrequencyItems = $("lemmaFrequencyItems");
      const lemmaFrequencyScrollTop = lemmaFrequencyItems.scrollTop;
      const groupedById = new Map(groups.map(group => [group.id, []]));
      for (const line of lines) {
        const groupId = assignedGroup(line);
        if (groupId && groupedById.has(groupId)) groupedById.get(groupId).push(line);
      }
      root.replaceChildren($("lemmaFrequencyBlock"), ...groups.map(group => {
        const block = document.createElement("article");
        block.className = "group-list";
        const grouped = groupedById.get(group.id);
        const head = document.createElement("div");
        head.className = "group-list-head";
        const title = document.createElement("span");
        title.className = "group-list-title";
        title.textContent = group.name;
        const count = document.createElement("span");
        count.textContent = formatter.format(grouped.length);
        const controls = document.createElement("div");
        controls.className = "group-list-controls";
        const rename = document.createElement("button");
        rename.type = "button";
        rename.className = "group-control group-edit";
        rename.textContent = "✏️";
        rename.title = "Изменить группу";
        rename.setAttribute("aria-label", `Изменить группу «${group.name}»`);
        rename.addEventListener("click", () => renameGroup(group, title, controls));
        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "group-control group-copy";
        copy.textContent = "Копировать";
        copy.title = `Скопировать группу «${group.name}»`;
        copy.addEventListener("click", () => copyWithFeedback(copy, formatQueryLines(grouped)));
        controls.append(copy, rename);
        head.append(title, count, controls);
        const items = document.createElement("div");
        items.className = "group-list-items";
        renderVirtualGroupItems(items, grouped);
        block.append(head, items);
        return block;
      }), $("groupAddSection"));
      lemmaFrequencyItems.scrollTop = lemmaFrequencyScrollTop;
    }
    function toggleGroup(row, column) {
      const queryRow = lastVisible[row];
      const group = groups[column];
      if (!queryRow || !group) return;
      performHistoryAction(() => {
        assignments = { ...assignments, [queryRow.id]: group.id };
        lastRenderedClickable = null;
        recalculate();
      });
      requestAnimationFrame(() => {
        const nextRow = Math.min(row, Math.max(0, lastVisible.length - 1));
        focusGroupCell(nextRow, column);
      });
    }
    function focusGroupCell(row, column) {
      let cell = clickableOutput.querySelector(`[data-group-row="${row}"][data-group-column="${column}"]`);
      if (!cell) {
        clickableOutput.scrollTop = Math.max(0, 30 + row * VIRTUAL_ROW_HEIGHT - clickableOutput.clientHeight / 2);
        renderClickable(lastVisible, true);
        cell = clickableOutput.querySelector(`[data-group-row="${row}"][data-group-column="${column}"]`);
      }
      cell?.focus();
    }
    function renderClickable(lines, force = false) {
      const scrollTop = clickableOutput.scrollTop;
      const start = Math.max(0, Math.floor(Math.max(0, scrollTop - 30) / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
      const visibleCount = Math.ceil((clickableOutput.clientHeight || 480) / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
      const end = Math.min(lines.length, start + visibleCount);
      if (!force && lastRenderedClickable && lastRenderedClickable.start === start && lastRenderedClickable.end === end &&
          lines.length === lastRenderedClickable.lines.length && lines.every((row, i) => row === lastRenderedClickable.lines[i])) return;
      const grid = document.createElement("div");
      grid.className = "query-grid";
      if (frequencyMode.checked) grid.classList.add("with-frequency");
      grid.style.setProperty("--group-columns", `repeat(${groups.length}, 24px)`);
      const header = document.createElement("div");
      header.className = "query-row query-row-header";
      for (const group of groups) {
        const cell = document.createElement("div");
        cell.className = "group-head";
        cell.textContent = group.short;
        cell.title = group.name;
        header.append(cell);
      }
      const phraseHead = document.createElement("button");
      phraseHead.type = "button";
      phraseHead.className = "query-text query-sort-button";
      phraseHead.textContent = `Поисковый запрос${querySortMode === "asc" ? " ▲" : querySortMode === "desc" ? " ▼" : ""}`;
      phraseHead.title = "Сортировать по поисковому запросу";
      phraseHead.addEventListener("click", cycleQuerySort);
      header.append(phraseHead);
      const searchHead = document.createElement("div");
      searchHead.className = "query-search-actions query-search-actions-head";
      searchHead.textContent = "Поиск";
      header.append(searchHead);
      if (frequencyMode.checked) {
        const frequencyHead = document.createElement("button");
        frequencyHead.type = "button";
        frequencyHead.className = "query-frequency query-sort-button";
        frequencyHead.textContent = `Частотность${frequencySortMode === "desc" ? " ▼" : frequencySortMode === "asc" ? " ▲" : ""}`;
        frequencyHead.title = "Сортировать по частотности";
        frequencyHead.addEventListener("click", cycleFrequencySort);
        header.append(frequencyHead);
      }
      grid.append(header);
      if (start > 0) {
        const topSpacer = document.createElement("div");
        topSpacer.className = "query-virtual-spacer";
        topSpacer.style.height = `${start * VIRTUAL_ROW_HEIGHT}px`;
        grid.append(topSpacer);
      }
      const matcher = /[\p{L}\p{N}]+(?:\.[0-9]+)?/gu;
      for (let i = start; i < end; i++) {
        const sourceRow = lines[i];
        const parsed = parseQueryLine(sourceRow.line);
        const row = document.createElement("div");
        row.className = "query-row";
        groups.forEach((group, column) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "group-cell";
          button.dataset.groupRow = String(i);
          button.dataset.groupColumn = String(column);
          button.setAttribute("role", "checkbox");
          button.setAttribute("aria-checked", "false");
          button.setAttribute("aria-label", `${parsed.phrase}: ${group.name}`);
          button.title = group.name;
          row.append(button);
        });
        const text = document.createElement("div");
        text.className = "query-text";
        let last = 0;
        matcher.lastIndex = 0;
        let match;
        while ((match = matcher.exec(parsed.phrase)) !== null) {
          if (match.index > last) text.append(document.createTextNode(parsed.phrase.slice(last, match.index)));
          const span = document.createElement("span");
          span.className = "clickable-word";
          span.textContent = match[0];
          span.dataset.word = match[0];
          span.title = `Добавить нормальную форму слова «${match[0]}» в минус-слова`;
          text.append(span);
          last = match.index + match[0].length;
        }
        if (last < parsed.phrase.length) text.append(document.createTextNode(parsed.phrase.slice(last)));
        row.append(text);
        const searchActions = document.createElement("div");
        searchActions.className = "query-search-actions";
        for (const target of SEARCH_TARGETS) {
          const link = document.createElement("a");
          link.className = "query-search-link";
          link.href = target.baseUrl + encodeURIComponent(parsed.phrase);
          link.target = "_blank";
          link.rel = "noreferrer noopener";
          link.title = `Искать «${parsed.phrase}» в ${target.name}`;
          link.setAttribute("aria-label", link.title);
          const icon = document.createElement("img");
          icon.src = target.icon;
          icon.alt = "";
          link.append(icon);
          searchActions.append(link);
        }
        row.append(searchActions);
        if (frequencyMode.checked) {
          const frequency = document.createElement("div");
          frequency.className = "query-frequency";
          frequency.textContent = parsed.frequency;
          row.append(frequency);
        }
        grid.append(row);
      }
      if (end < lines.length) {
        const bottomSpacer = document.createElement("div");
        bottomSpacer.className = "query-virtual-spacer";
        bottomSpacer.style.height = `${(lines.length - end) * VIRTUAL_ROW_HEIGHT}px`;
        grid.append(bottomSpacer);
      }
      clickableOutput.replaceChildren(grid);
      lastRenderedClickable = { lines: lines.slice(), start, end };
      clickableOutput.scrollTop = scrollTop;
    }
    function recalculate() {
      if (queriesInput.value !== sourceCache.value) {
        refreshSourceCache();
      }
      const rows = sourceCache.rows;
      const warnings = [];
      const morphologyWarning = !morphAvailable ? "Морфология временно недоступна — используется точное сравнение слов." : "";
      const negativeWords = getNegativeWords(wordsInput.value, warnings);
      const draftPending = document.activeElement === phrasesInput && !/[,\n]\s*$/u.test(rawPhrases);
      const negativePhrases = getNegativePhrases(rawPhrases, warnings, draftPending);
      queueMorphology([...negativeWords, ...negativePhrases.flatMap(phrase => phrase.words)]);
      const negativePhraseIndex = buildNegativePhraseIndex(negativePhrases);
      const negativeWordKeys = new Set();
      for (const word of negativeWords) {
        const internalKeys = negativeWordKeyOverrides[word];
        if (!morphAvailable) negativeWordKeys.add(`word:${word}`);
        else if (Array.isArray(internalKeys) && internalKeys.length) internalKeys.forEach(key => negativeWordKeys.add(key));
        else negativeWordKeys.add(morphKey(word));
      }
      const remaining = [];
      for (const row of rows) {
        const words = getWords(queryPhrase(row.line));
        const query = { words };
        let excluded = words.some(w => negativeWordKeys.has(morphKey(w)));
        if (!excluded) excluded = Array.from(negativePhraseCandidates(words, negativePhraseIndex)).some(p => phraseMatches(query, p));
        if (!excluded) remaining.push(row);
      }
      const unassigned = remaining.filter(line => !assignedGroup(line));
      lastRemaining = unassigned;
      lastVisible = sortVisibleRows(visibleByFilters(unassigned));
      if (autoLemmaFrequencySetting.checked) refreshLemmaFrequency();
      // Опции меняют только отображение; базовая минусация остаётся прежней.
      renderClickable(lastVisible);
      renderGroupLists(remaining);
      $("sourceLabel").textContent = `${formatter.format(rows.length)} строк`;
      $("wordLabel").textContent = `${formatter.format(negativeWords.size)} слов`;
      $("phraseLabel").textContent = `${formatter.format(negativePhrases.length)} фраз`;
      $("totalCount").textContent = formatter.format(rows.length);
      $("excludedCount").textContent = formatter.format(rows.length - remaining.length);
      $("remainingCount").textContent = formatter.format(unassigned.length);
      $("shownCount").textContent = formatter.format(lastVisible.length);
      $("shownMetric").hidden = !hasActiveResultFilters();
      const warningBox = $("warning");
      if (warnings.length || morphologyWarning) {
        const inputWarning = warnings.length
          ? `Не применены некоторые записи (${warnings.length}): ${warnings.slice(0, 3).join("; ")}${warnings.length > 3 ? "; …" : ""}.`
          : "";
        warningBox.textContent = [morphologyWarning, inputWarning].filter(Boolean).join(" ");
        warningBox.classList.add("visible");
      } else {
        warningBox.textContent = "";
        warningBox.classList.remove("visible");
      }
    }
    function scheduleRecalculate(delay = 85) {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; recalculate(); }, delay);
    }
    noteInput.addEventListener("input", e => {
      syncPageTitle();
      storeTextEdit("note", e);
    });
    lengthChecks.forEach(ch => ch.addEventListener("change", () => {
      recalculate();
      storeHistory("action", "length");
    }));
    queryTextFilter.addEventListener("input", e => {
      scheduleRecalculate(120);
      storeTextEdit("query-filter", e);
    });
    frequencyFilterOperator.addEventListener("change", () => {
      recalculate();
      storeHistory("action", "frequency-filter");
    });
    frequencyFilterValue.addEventListener("input", e => {
      frequencyFilterValue.value = frequencyFilterValue.value.replace(/\D+/gu, "").slice(0, 15);
      scheduleRecalculate(120);
      storeTextEdit("frequency-filter", e);
    });
    showAllButton.addEventListener("click", () => {
      lengthChecks.forEach(ch => { ch.checked = false; });
      queryTextFilter.value = "";
      frequencyFilterOperator.value = "gt";
      frequencyFilterValue.value = "";
      recalculate();
      storeHistory("action", "filter");
    });
    resultOptionsButton.addEventListener("click", () => {
      const open = resultOptionsMenu.hidden;
      resultOptionsMenu.hidden = !open;
      resultOptionsButton.setAttribute("aria-expanded", String(open));
      if (open) {
        settingsMenu.hidden = true;
        settingsButton.setAttribute("aria-expanded", "false");
      }
    });
    queriesInput.addEventListener("input", e => {
      scheduleRecalculate(250);
      storeTextEdit("queries", e);
      if (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop") requestQueryDeduplication();
    });
    wordsInput.addEventListener("input", updateWordsFromInput);
    wordsInput.addEventListener("click", event => {
      if (event.button !== 0 || wordsInput.selectionStart !== wordsInput.selectionEnd) return;
      const range = negativeWordRangeAt(wordsInput.value, wordsInput.selectionStart);
      if (range) removeNegativeWordAt(range.start, range.end);
    });
    $("refreshLemmaFrequency").addEventListener("click", refreshLemmaFrequency);
    $("lemmaFrequencyItems").addEventListener("click", async event => {
      const button = event.target.closest(".lemma-frequency-word");
      if (button && await addNegativeWord(button.dataset.word)) button.closest(".lemma-frequency-row")?.remove();
    });
    phrasesInput.addEventListener("input", updatePhrasesFromInput);
    phrasesInput.addEventListener("focus", scheduleRecalculate);
    phrasesInput.addEventListener("blur", scheduleRecalculate);
    // После каждой вставки автоматически готовим отдельную новую строку.
    // При вставке готового многострочного списка лишний Enter не добавляется.
    phrasesInput.addEventListener("paste", e => {
      const clipboard = e.clipboardData;
      if (!clipboard) return;
      const text = clipboard.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      const original = phrasesInput.value;
      const start = phrasesInput.selectionStart;
      const end = phrasesInput.selectionEnd;
      const before = original.slice(0, start);
      const after = original.slice(end);
      const pasted = text.replace(/\r\n?/gu, "\n").replace(/\n+$/u, "");
      const previousLine = before.slice(before.lastIndexOf("\n") + 1);
      const atEndOfLine = !after || after.startsWith("\n");
      const needsLeadingLine = atEndOfLine && previousLine.trim() !== "" && !/[,\n]\s*$/u.test(before);
      const prefix = needsLeadingLine ? "\n" : "";
      const needsTrailingLine = !after.startsWith("\n");
      const insertion = prefix + pasted + (needsTrailingLine ? "\n" : "");
      phrasesInput.setRangeText(insertion, start, end, "end");
      updatePhrasesFromInput({ inputType: "insertFromPaste" });
      // В стандартном сценарии (вставка в конец) курсор остаётся на пустой строке.
      if (!after && insertion.endsWith("\n")) {
        phrasesInput.setSelectionRange(phrasesInput.value.length, phrasesInput.value.length);
      }
      phrasesScroll.edited();
    });

    wordsInput.addEventListener("blur", () => {
      if (cleanSetting.checked) {
        rawWords = cleanWordText(rawWords, true);
        setWordsFromCanonical();
        storeHistory("action", "words");
      }
      requestNegativeWordNormalization();
    });
    queriesInput.addEventListener("blur", requestQueryDeduplication);
    // В режиме авто-кавычек Enter и запятая завершают текущую фразу,
    // а не попадают внутрь автоматически сформированных кавычек.
    phrasesInput.addEventListener("keydown", e => {
      if (!quoteSetting.checked || (e.key !== "Enter" && e.key !== ",") || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      const full = phrasesInput.value;
      const pos = phrasesInput.selectionStart;
      const lineEnd = full.indexOf("\n", pos);
      const target = lineEnd < 0 ? full.length : lineEnd;
      const delim = e.key === "Enter" ? "\n" : ", ";
      phrasesInput.setRangeText(delim, target, target, "end");
      updatePhrasesFromInput();
    });
    clickSetting.addEventListener("change", () => {
      syncClickableView();
      storeHistory("action", "setting");
    });
    cleanSetting.addEventListener("change", () => {
      if (cleanSetting.checked) {
        rawWords = cleanWordText(rawWords, true);
        setWordsFromCanonical();
      }
      // При обычном выключении очистка не откатывается; Ctrl/Cmd+Z отменяет действие.
      storeHistory("action", "setting");
    });
    cleanPhrasesSetting.addEventListener("change", () => {
      if (cleanPhrasesSetting.checked) {
        rawPhrases = cleanPhraseText(rawPhrases);
        setPhrasesFromCanonical();
      }
      // Выключение не возвращает ранее удалённые символы.
      storeHistory("action", "setting");
    });
    dashSetting.addEventListener("change", () => {
      setWordsFromCanonical();
      storeHistory("action", "setting");
    });
    quoteSetting.addEventListener("change", () => {
      setPhrasesFromCanonical();
      storeHistory("action", "setting");
    });
    frequencyMode.addEventListener("change", () => {
      sourceCache.value = null;
      lastRenderedClickable = null;
      syncFrequencyFilterVisibility();
      recalculate();
      storeHistory("action", "setting");
    });
    copyFrequencySetting.addEventListener("change", () => {
      storeHistory("action", "setting");
    });
    autoLemmaFrequencySetting.addEventListener("change", () => {
      if (autoLemmaFrequencySetting.checked) refreshLemmaFrequency();
      storeHistory("action", "setting");
    });
    siteFontsSetting.addEventListener("change", () => {
      syncFontMode();
      storeHistory("action", "setting");
    });
    undoButton.addEventListener("click", undo);
    redoButton.addEventListener("click", redo);
    clickableOutput.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(clickableOutput);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      const cell = e.target.closest(".group-cell");
      if (!cell) return;
      const row = Number(cell.dataset.groupRow);
      const column = Number(cell.dataset.groupColumn);
      if (e.key === " " || e.key === "1") {
        e.preventDefault();
        toggleGroup(row, column);
        return;
      }
      const direction = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      if (!direction) return;
      e.preventDefault();
      const nextRow = Math.max(0, Math.min(lastVisible.length - 1, row + direction[0]));
      const nextColumn = Math.max(0, Math.min(groups.length - 1, column + direction[1]));
      focusGroupCell(nextRow, nextColumn);
    });
    let virtualScrollFrame = null;
    clickableOutput.addEventListener("scroll", () => {
      if (virtualScrollFrame !== null) return;
      virtualScrollFrame = requestAnimationFrame(() => {
        virtualScrollFrame = null;
        renderClickable(lastVisible, true);
      });
    }, { passive: true });
    clickableOutput.addEventListener("click", e => {
      const cell = e.target.closest(".group-cell");
      if (!cell) return;
      toggleGroup(Number(cell.dataset.groupRow), Number(cell.dataset.groupColumn));
    });
    // Отличаем короткий клик по слову от протягивания мышью для выделения.
    // Не проверяем window.getSelection(): выделение после предыдущего копирования
    // может остаться активным даже после перехода к полю Минус-фраз.
    // Иначе первый клик лишь снимает старое выделение, но не минусует слово.
    let resultPointerGesture = null;
    clickableOutput.addEventListener("pointerdown", e => {
      if (e.button !== 0 || !e.isPrimary) return;
      resultPointerGesture = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        dragged: false
      };
    });
    window.addEventListener("pointermove", e => {
      const gesture = resultPointerGesture;
      if (!gesture || e.pointerId !== gesture.id || gesture.dragged) return;
      if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 4) {
        gesture.dragged = true;
      }
    });
    window.addEventListener("pointercancel", e => {
      if (resultPointerGesture?.id === e.pointerId) resultPointerGesture = null;
    });
    clickableOutput.addEventListener("click", e => {
      const dragged = resultPointerGesture?.dragged || false;
      resultPointerGesture = null;
      const span = e.target.closest(".clickable-word");
      if (!clickSetting.checked || !span || dragged) return;
      addNegativeWord(span.dataset.word);
    });

    // Копирование результатов учитывает текущие Опции отображения,
    // но не меняет исходные запросы и общие счётчики минусации.
    async function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* fallback */ }
      }
      const tmp = document.createElement("textarea");
      tmp.value = text;
      tmp.setAttribute("readonly", "");
      tmp.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      const focused = document.activeElement;
      const selection = window.getSelection();
      const ranges = [];
      if (selection) for (let i=0; i<selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange());
      document.body.append(tmp);
      tmp.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) { /* unsupported */ }
      tmp.remove();
      if (focused && typeof focused.focus === "function") focused.focus({preventScroll:true});
      if (selection && ranges.length) {
        selection.removeAllRanges();
        for (const range of ranges) selection.addRange(range);
      }
      return ok;
    }
    async function copyWithFeedback(button, content) {
      const label = button.textContent;
      const copied = await copyText(content);
      button.textContent = copied ? "Скопировано ✓" : "Не удалось скопировать";
      clearTimeout(button.copyMessageTimer);
      button.copyMessageTimer = setTimeout(() => { button.textContent = label; }, 1500);
    }
    const fieldByName = { words: wordsInput, phrases: phrasesInput, queries: queriesInput };
    document.querySelectorAll("[data-copy]").forEach(button => {
      button.addEventListener("click", async () => {
        const name = button.dataset.copy;
        let content;
        if (name === "remaining") content = formatQueryLines(lastVisible);
        else if (name === "queries") content = formatQueryLines(queriesInput.value.split(/\r?\n/u).map(line => line.trim()).filter(Boolean));
        else content = fieldByName[name].value;
        // Последний автоматически добавленный перенос строки нужен для ввода,
        // но не должен попадать в Директ Коммандер вместе с минус-фразами.
        if (name === "phrases") content = content.replace(/\s+$/u, "");
        await copyWithFeedback(button, content);
      });
    });
    document.querySelectorAll("[data-clear]").forEach(button => {
      button.addEventListener("click", () => {
        const name = button.dataset.clear;
        const target = fieldByName[name];
        if (!target || !target.value) return; // Пустое поле не создаёт историю.
        // Надёжно сохраняем именно состояние ДО очистки. Это покрывает
        // и многоразовые вставки, и автоматическое оформление минус-фраз.
        storeHistory("action", "before-clear");
        if (name === "words") {
          rawWords = "";
          negativeWordKeyOverrides = Object.create(null);
          wordsInput.value = "";
        } else if (name === "phrases") {
          rawPhrases = "";
          phrasesInput.value = "";
        } else if (name === "queries") {
          queriesInput.value = "";
        }
        if (name === "words") wordsScroll.edited();
        if (name === "phrases") phrasesScroll.edited();
        scheduleRecalculate();
        storeHistory("action", "clear");
      });
    });

    $("groupAddForm").addEventListener("submit", e => {
      e.preventDefault();
      const input = $("groupName");
      const name = input.value.trim();
      if (!name || groups.some(group => group.name.toLocaleLowerCase("ru-RU") === name.toLocaleLowerCase("ru-RU"))) return;
      performHistoryAction(() => {
        groups = [...groups, {
          id: `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          short: groupShortName(name)
        }];
        input.value = "";
        lastRenderedClickable = null;
        recalculate();
      });
    });
    async function resetProject() {
      if (!window.confirm("Сбросить все поля, группы, распределение и настройки проекта?")) return;
      performHistoryAction(() => {
        noteInput.value = "";
        queriesInput.value = "";
        wordsInput.value = "";
        phrasesInput.value = "";
        rawWords = "";
        negativeWordKeyOverrides = Object.create(null);
        rawPhrases = "";
        queryRows = [];
        sourceCache = { value: null, rows: [] };
        groups = createDefaultGroups();
        assignments = Object.create(null);
        lastRemaining = [];
        lastVisible = [];
        querySortMode = "original";
        frequencySortMode = "original";
        lastRenderedClickable = null;
        pendingQueryDeduplication = null;
        pendingNegativeWordNormalization = null;
        lemmaFrequencyPending = false;
        lemmaFrequencyHasResult = false;
        lengthChecks.forEach(check => { check.checked = false; });
        queryTextFilter.value = "";
        frequencyFilterOperator.value = "gt";
        frequencyFilterValue.value = "";
        clickSetting.checked = true;
        cleanSetting.checked = true;
        cleanPhrasesSetting.checked = true;
        dashSetting.checked = false;
        quoteSetting.checked = false;
        frequencyMode.checked = false;
        copyFrequencySetting.checked = false;
        autoLemmaFrequencySetting.checked = false;
        siteFontsSetting.checked = true;
        syncFrequencyFilterVisibility();
        $("groupName").value = "";
        $("importProjectFile").value = "";
        $("lemmaFrequencyItems").replaceChildren(lemmaFrequencyMessage("Нажмите «Обновить»"));
        syncPageTitle();
        syncFontMode();
        syncClickableView();
        recalculate();
        wordsScroll.edited();
        phrasesScroll.edited();
      });
      settingsMenu.hidden = true;
      settingsButton.setAttribute("aria-expanded", "false");
      await saveNow();
    }
    $("exportProject").addEventListener("click", exportProject);
    $("importProject").addEventListener("click", () => $("importProjectFile").click());
    $("resetProject").addEventListener("click", resetProject);
    $("importProjectFile").addEventListener("change", async e => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("Файл проекта превышает 25 МБ");
        const state = JSON.parse(await file.text());
        applyProjectState(state);
        history = [snapshot()];
        historyIndex = 0;
        syncHistoryButtons();
        normalizeLoadedInputs();
        await saveNow();
      } catch (error) {
        $("saveStatus").textContent = error instanceof Error ? error.message : "Не удалось импортировать проект";
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && saveTimer !== null) void saveNow();
    });

    settingsButton.addEventListener("click", () => {
      const open = settingsMenu.hidden;
      settingsMenu.hidden = !open;
      settingsButton.setAttribute("aria-expanded", String(open));
      if (open) {
        resultOptionsMenu.hidden = true;
        resultOptionsButton.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("pointerdown", e => {
      if (!settingsRoot.contains(e.target)) {
        settingsMenu.hidden = true;
        settingsButton.setAttribute("aria-expanded", "false");
      }
      if (!resultOptionsRoot.contains(e.target)) {
        resultOptionsMenu.hidden = true;
        resultOptionsButton.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", e => {
      // Своя история заменяет браузерную в трёх полях и работает после кликов.
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey && !e.isComposing;
      // Для русской раскладки e.key может быть «я»/«н», а не «z»/«y».
      // Используем физические клавиши KeyZ/KeyY и резервное сравнение символов.
      // Это особенно важно после кнопки «Очистить»: браузер сам не умеет
      // откатывать программное изменение значения textarea.
      const key = e.key.toLowerCase();
      const undoKey = e.code === "KeyZ" || key === "z" || key === "я";
      const redoKey = e.code === "KeyY" || key === "y" || key === "н";
      if (mod && (undoKey || (redoKey && !e.shiftKey))) {
        e.preventDefault();
        if (undoKey && !e.shiftKey) undo();
        else redo();
        return;
      }
      if (e.key === "Escape" && !settingsMenu.hidden) {
        settingsMenu.hidden = true;
        settingsButton.setAttribute("aria-expanded", "false");
        settingsButton.focus();
      } else if (e.key === "Escape" && !resultOptionsMenu.hidden) {
        resultOptionsMenu.hidden = true;
        resultOptionsButton.setAttribute("aria-expanded", "false");
        resultOptionsButton.focus();
      }
    });
    async function initialize() {
      let restored = false;
      try {
        let saved = await databaseGet("current");
        if (saved && sessionExpired(saved.savedAt)) {
          await databaseDelete("current");
          saved = null;
        }
        if (saved) {
          applyProjectState(saved);
          restored = true;
        }
        else {
          if (cleanSetting.checked) {
            rawWords = cleanWordText(rawWords, true);
            wordsInput.value = dashSetting.checked ? formatWords(rawWords) : rawWords;
          } else {
            rawWords = wordTextToLines(rawWords, true);
            wordsInput.value = dashSetting.checked ? formatWords(rawWords) : rawWords;
          }
          if (cleanPhrasesSetting.checked) {
            rawPhrases = cleanPhraseText(rawPhrases);
            phrasesInput.value = quoteSetting.checked ? formatPhrases(rawPhrases) : rawPhrases;
          }
          syncClickableView();
          recalculate();
        }
        $("saveStatus").textContent = restored ? "Прошлая сессия восстановлена" : "Автосохранение включено";
      } catch (_) {
        syncClickableView();
        recalculate();
        $("saveStatus").textContent = "Автосохранение недоступно";
      }
      history = [snapshot()];
      historyIndex = 0;
      syncHistoryButtons();
      if (restored) normalizeLoadedInputs();
    }
    void initialize();
  })();

