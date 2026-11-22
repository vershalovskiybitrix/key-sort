(() => {
  "use strict";
  const api = window.KeySortServices;
  const status = document.getElementById("forecastStatus");
  const copyButton = document.getElementById("forecastCopy");
  const csvButton = document.getElementById("forecastCsv");
  const phrasesInput = document.getElementById("forecastPhrases");
  const currencySelect = document.getElementById("forecastCurrency");
  const regionsRoot = document.getElementById("forecastRegions");
  let exportedRows = [];
  let lastResult = null;
  let lastWarnings = [];
  let saveTimer = null;
  let databasePromise = null;
  api.bindExtensionState(["OAuth-токен Директа"]);
  const regionPicker = window.KeySortRegions.bindRegionTree(document.getElementById("forecastRegions"));
  regionPicker.ready.catch(error => api.setStatus(status, `Не удалось загрузить регионы: ${error.message}`, true));

  const wait = delay => new Promise(resolve => setTimeout(resolve, delay));
  const number = value => Number(value || 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  const htmlEscape = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const csvEscape = value => `"${String(value).replace(/"/g, '""')}"`;

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("key-sort", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("projects")) request.result.createObjectStore("projects");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }

  async function databaseGet() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction("projects", "readonly").objectStore("projects").get("budget-forecast");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function databasePut(value) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("projects", "readwrite");
      transaction.objectStore("projects").put(value, "budget-forecast");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function databaseDelete() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("projects", "readwrite");
      transaction.objectStore("projects").delete("budget-forecast");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function expired(savedAt) {
    const saved = new Date(savedAt);
    if (!Number.isFinite(saved.getTime())) return true;
    const expires = new Date(saved);
    const day = expires.getUTCDate();
    expires.setUTCDate(1);
    expires.setUTCMonth(expires.getUTCMonth() + 4);
    const lastDay = new Date(Date.UTC(expires.getUTCFullYear(), expires.getUTCMonth() + 1, 0)).getUTCDate();
    expires.setUTCDate(Math.min(day, lastDay));
    return Date.now() >= expires.getTime();
  }

  function savedState() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      phrases: phrasesInput.value,
      currency: currencySelect.value,
      regions: regionPicker.signedValue(),
      result: lastResult,
      warnings: lastWarnings
    };
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => databasePut(savedState()).catch(() => {}), 300);
  }

  function cleanPhrase(original) {
    const reasons = [];
    let phrase = original.replace(/[^A-Za-zÇĞİÖŞÜçğıöşüА-Яа-яЁёІіЇїЄєҐґЎўӘәҒғҚқҢңӨөҰұҮүҺһ0-9\s+\-!\[\]"()|.']/gu, "");
    phrase = phrase.replace(/\./g, (character, index, value) => /\d/u.test(value[index - 1] || "") && /\d/u.test(value[index + 1] || "") ? character : "");
    if (phrase !== original) reasons.push("удалены недопустимые символы");
    phrase = phrase.replace(/\s+/gu, " ").trim();
    const words = [...phrase.matchAll(/[\p{L}\p{N}]+/gu)];
    if (words.length > 7) {
      phrase = phrase.slice(0, words[6].index + words[6][0].length).trim();
      phrase = phrase.replace(/[+\-!\[\]"()|]+$/gu, "").trim();
      reasons.push("оставлены первые 7 слов");
    }
    return { original, phrase, reasons };
  }

  function preparePhrases(value) {
    const regular = [];
    const corrected = [];
    const warnings = [];
    for (const original of api.lines(value)) {
      const item = cleanPhrase(original);
      if (!item.phrase) {
        warnings.push({ ...item, reasons: [...item.reasons, "после очистки фраза стала пустой и не отправлена"] });
      } else if (item.reasons.length) {
        corrected.push(item.phrase);
        warnings.push(item);
      } else {
        regular.push(item.phrase);
      }
    }
    return { phrases: [...regular, ...corrected], warnings };
  }

  function resultStatus(count, warnings) {
    if (!warnings.length) return `Прогноз готов. Фраз: ${count}.`;
    const details = warnings.map(item => `«${item.original}» → ${item.phrase ? `«${item.phrase}»` : "не отправлена"} — ${item.reasons.join(", ")}`);
    return `Прогноз готов. Фраз: ${count}. С ошибками были обработаны:\n${details.join("\n")}`;
  }

  function emptyPhrasesStatus(warnings) {
    const details = warnings.map(item => `«${item.original}» — ${item.reasons.join(", ")}`);
    return `После очистки не осталось фраз для отправки.${details.length ? `\n${details.join("\n")}` : ""}`;
  }

  copyButton.addEventListener("click", async () => {
    const rows = [["Фраза", "Показы"], ...exportedRows];
    const text = rows.map(row => row.join("\t")).join("\n");
    const html = `<table>${rows.map((row, index) => `<tr>${row.map(value => `<${index ? "td" : "th"}>${htmlEscape(value)}</${index ? "td" : "th"}>`).join("")}</tr>`).join("")}</table>`;
    try {
      if (window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }), "text/html": new Blob([html], { type: "text/html" }) })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      api.setStatus(status, "Фразы и показы скопированы.");
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });

  csvButton.addEventListener("click", () => {
    const rows = [["Фраза", "Показы"], ...exportedRows];
    const csv = `\uFEFF${rows.map(row => row.map(csvEscape).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-forecast.csv";
    link.click();
    URL.revokeObjectURL(url);
  });

  async function waitForForecast(id, sessionId) {
    for (let attempt = 0; attempt < 45; attempt += 1) {
      const reports = await api.requestExtension("DIRECT_CALL", { method: "GetForecastList", sessionId });
      const report = (reports.data || []).find(item => Number(item.ForecastID) === Number(id));
      if (report?.StatusForecast === "Done") return;
      if (report?.StatusForecast === "Failed") throw new Error("Яндекс не смог сформировать прогноз");
      api.setStatus(status, "Яндекс формирует прогноз…");
      await wait(2000);
    }
    throw new Error("Прогноз не сформирован за 90 секунд");
  }

  async function createForecast(param, sessionId) {
    while (true) {
      try {
        return await api.requestExtension("DIRECT_CALL", { method: "CreateNewForecast", param, sessionId });
      } catch (error) {
        if (error.code !== "FORECAST_RATE_LIMIT" || !Number.isFinite(Number(error.retryAfter))) throw error;
        const delay = Math.max(1000, Number(error.retryAfter));
        api.setStatus(status, `Лимит запросов. Продолжение через ${Math.ceil(delay / 60000)} мин.…`);
        await wait(delay);
      }
    }
  }

  function render(data) {
    lastResult = data;
    const common = data.Common || {};
    document.getElementById("forecastGeo").textContent = `Регион: ${common.Geo || "—"}`;
    const summary = document.querySelectorAll("#forecastSummary strong");
    [common.Shows, common.Clicks, common.FirstPlaceClicks, common.PremiumClicks].forEach((value, index) => { summary[index].textContent = number(value); });
    const body = document.getElementById("forecastResults");
    body.textContent = "";
    exportedRows = (data.Phrases || []).map(row => [String(row.Phrase ?? ""), String(Number(row.Shows || 0))]);
    copyButton.disabled = exportedRows.length === 0;
    csvButton.disabled = exportedRows.length === 0;
    for (const row of data.Phrases || []) {
      const bids = (row.AuctionBids || []).map(item => `${item.Position}: ${number(item.Bid)} / ${number(item.Price)}`).join("; ");
      const values = [row.Phrase, row.Shows, row.Clicks, row.CTR, row.FirstPlaceClicks, row.FirstPlaceCTR, row.PremiumClicks, row.PremiumCTR, row.Min, row.Max, row.PremiumMin, row.PremiumMax, bids || "—"];
      const tr = document.createElement("tr");
      values.forEach((value, index) => {
        const td = document.createElement("td");
        td.textContent = index === 0 || index === values.length - 1 ? String(value ?? "—") : number(value);
        tr.append(td);
      });
      body.append(tr);
    }
    scheduleSave();
  }

  function clearResult() {
    lastResult = null;
    lastWarnings = [];
    exportedRows = [];
    copyButton.disabled = true;
    csvButton.disabled = true;
    document.getElementById("forecastGeo").textContent = "Регион: —";
    document.querySelectorAll("#forecastSummary strong").forEach(element => { element.textContent = "—"; });
    document.getElementById("forecastResults").textContent = "";
  }

  phrasesInput.addEventListener("input", scheduleSave);
  currencySelect.addEventListener("change", scheduleSave);
  regionsRoot.addEventListener("change", scheduleSave);
  document.getElementById("forecastClear").addEventListener("click", async () => {
    clearTimeout(saveTimer);
    phrasesInput.value = "";
    currencySelect.value = "RUB";
    await regionPicker.ready.catch(() => {});
    regionPicker.setSignedValue([]);
    clearResult();
    api.setStatus(status, "");
    await databaseDelete().catch(() => {});
  });

  async function restore() {
    const state = await databaseGet();
    if (!state || state.version !== 1) return;
    if (expired(state.savedAt)) {
      await databaseDelete();
      return;
    }
    phrasesInput.value = typeof state.phrases === "string" ? state.phrases : "";
    if ([...currencySelect.options].some(option => option.value === state.currency)) currencySelect.value = state.currency;
    await regionPicker.ready;
    regionPicker.setSignedValue(Array.isArray(state.regions) ? state.regions : []);
    lastWarnings = Array.isArray(state.warnings) ? state.warnings : [];
    if (state.result?.Phrases && state.result?.Common) {
      render(state.result);
      api.setStatus(status, resultStatus(state.result.Phrases.length, lastWarnings), lastWarnings.length > 0);
    }
  }

  restore().catch(() => {});

  document.getElementById("forecastForm").addEventListener("submit", async event => {
    event.preventDefault();
    const prepared = preparePhrases(phrasesInput.value);
    const phrases = prepared.phrases;
    if (!phrases.length) return api.setStatus(status, prepared.warnings.length ? emptyPhrasesStatus(prepared.warnings) : "Добавьте хотя бы одну фразу.", true);
    const geo = regionPicker.signedValue().map(Number).filter(Number.isFinite);
    api.setStatus(status, "Создание прогноза…");
    let sessionId = null;
    let keepAlive = null;
    try {
      const extensionState = await api.requestExtension("STATUS");
      if (!extensionState.forecastSafety) throw new Error("Расширение устарело. Обновите его на странице установки и перезагрузите в Chrome");
      const session = await api.requestExtension("DIRECT_FORECAST_BEGIN");
      sessionId = session.sessionId;
      keepAlive = setInterval(() => api.requestExtension("DIRECT_FORECAST_TOUCH", { sessionId }).catch(() => {}), 30000);
      const combined = { Phrases: [], Common: { Shows: 0, Clicks: 0, FirstPlaceClicks: 0, PremiumClicks: 0, Geo: "" } };
      const batches = [];
      for (let index = 0; index < phrases.length; index += 100) batches.push(phrases.slice(index, index + 100));
      for (let index = 0; index < batches.length; index += 1) {
        api.setStatus(status, `Расчёт пакета ${index + 1} из ${batches.length}…`);
        const created = await createForecast({
          Phrases: batches[index],
          GeoID: geo,
          Currency: currencySelect.value,
          AuctionBids: "Yes"
        }, sessionId);
        await waitForForecast(created.data, sessionId);
        const result = await api.requestExtension("DIRECT_CALL", { method: "GetForecast", param: created.data, sessionId });
        await api.requestExtension("DIRECT_CALL", { method: "DeleteForecastReport", param: created.data, sessionId });
        combined.Phrases.push(...(result.data?.Phrases || []));
        const common = result.data?.Common || {};
        combined.Common.Geo ||= common.Geo || "";
        ["Shows", "Clicks", "FirstPlaceClicks", "PremiumClicks"].forEach(field => { combined.Common[field] += Number(common[field] || 0); });
        if (index < batches.length - 1) {
          api.setStatus(status, `Пакет ${index + 1} из ${batches.length} готов. Пауза 5 секунд…`);
          await wait(5000);
        }
      }
      lastWarnings = prepared.warnings;
      render(combined);
      api.setStatus(status, resultStatus(combined.Phrases.length, lastWarnings), lastWarnings.length > 0);
    } catch (error) {
      api.setStatus(status, error.message, true);
    } finally {
      if (keepAlive !== null) clearInterval(keepAlive);
      if (sessionId) api.requestExtension("DIRECT_FORECAST_END", { sessionId }).catch(() => {});
    }
  });
})();
