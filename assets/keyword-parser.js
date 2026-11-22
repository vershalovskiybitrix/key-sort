(() => {
  "use strict";
  const api = window.KeySortServices;
  const form = document.getElementById("parserForm");
  const status = document.getElementById("parserStatus");
  let rows = [];
  api.bindExtensionState(["API-ключ Yandex Cloud", "ID каталога"]);
  const regionPicker = window.KeySortRegions.bindRegionTree(document.getElementById("parserRegions"), "WORDSTAT_REGIONS");
  regionPicker.ready.catch(error => api.setStatus(status, `Не удалось загрузить регионы: ${error.message}`, true));

  document.getElementById("parserCopy").addEventListener("click", async () => {
    if (!rows.length) return;
    await navigator.clipboard.writeText(rows.map(row => `${row.phrase}\t${row.count}`).join("\n"));
    api.setStatus(status, `Скопировано строк: ${rows.length}.`);
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    api.setStatus(status, "Запрос отправлен…");
    document.getElementById("parserResults").textContent = "";
    try {
      const region = regionPicker.value();
      const data = await api.requestExtension("WORDSTAT_TOP", {
        phrase: document.getElementById("parserQuery").value.trim(),
        numPhrases: Number(document.getElementById("parserLimit").value),
        regions: region ? [region] : []
      });
      document.getElementById("parserTotal").textContent = `Общая частотность: ${Number(data.totalCount || 0).toLocaleString("ru-RU")}`;
      const body = document.getElementById("parserResults");
      rows = data.results || [];
      for (const row of rows) {
        const tr = document.createElement("tr");
        const phrase = document.createElement("td");
        const count = document.createElement("td");
        phrase.textContent = row.phrase;
        count.textContent = Number(row.count || 0).toLocaleString("ru-RU");
        tr.append(phrase, count);
        body.append(tr);
      }
      api.setStatus(status, `Получено фраз: ${rows.length}.`);
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });
})();
