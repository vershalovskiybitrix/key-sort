(() => {
  "use strict";
  const api = window.KeySortServices;
  const form = document.getElementById("parserForm");
  const status = document.getElementById("parserStatus");
  api.bindExtensionState(["API-ключ Yandex Cloud", "ID каталога"]);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    api.setStatus(status, "Запрос отправлен…");
    document.getElementById("parserResults").textContent = "";
    try {
      const regions = document.getElementById("parserRegions").value.split(/[,\s]+/).filter(Boolean);
      const data = await api.requestExtension("WORDSTAT_TOP", {
        phrase: document.getElementById("parserQuery").value.trim(),
        numPhrases: Number(document.getElementById("parserLimit").value),
        regions
      });
      document.getElementById("parserTotal").textContent = `Общая частотность: ${Number(data.totalCount || 0).toLocaleString("ru-RU")}`;
      const body = document.getElementById("parserResults");
      for (const row of data.results || []) {
        const tr = document.createElement("tr");
        const phrase = document.createElement("td");
        const count = document.createElement("td");
        phrase.textContent = row.phrase;
        count.textContent = Number(row.count || 0).toLocaleString("ru-RU");
        tr.append(phrase, count);
        body.append(tr);
      }
      api.setStatus(status, `Получено фраз: ${(data.results || []).length}.`);
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });
})();
