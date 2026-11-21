(() => {
  "use strict";
  const api = window.KeySortServices;
  const status = document.getElementById("forecastStatus");
  api.bindExtensionState(["OAuth-токен Директа"]);
  window.KeySortRegions.bindRegionSelect(document.getElementById("forecastRegions"), "DIRECT_REGIONS").catch(error => api.setStatus(status, `Не удалось загрузить регионы: ${error.message}`, true));

  const wait = delay => new Promise(resolve => setTimeout(resolve, delay));
  const number = value => Number(value || 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 });

  async function waitForForecast(id) {
    for (let attempt = 0; attempt < 45; attempt += 1) {
      const reports = await api.requestExtension("DIRECT_CALL", { method: "GetForecastList" });
      const report = (reports.data || []).find(item => Number(item.ForecastID) === Number(id));
      if (report?.StatusForecast === "Done") return;
      if (report?.StatusForecast === "Failed") throw new Error("Яндекс не смог сформировать прогноз");
      api.setStatus(status, "Яндекс формирует прогноз…");
      await wait(2000);
    }
    throw new Error("Прогноз не сформирован за 90 секунд");
  }

  function render(data) {
    const common = data.Common || {};
    document.getElementById("forecastGeo").textContent = `Регион: ${common.Geo || "—"}`;
    const summary = document.querySelectorAll("#forecastSummary strong");
    [common.Shows, common.Clicks, common.FirstPlaceClicks, common.PremiumClicks].forEach((value, index) => { summary[index].textContent = number(value); });
    const body = document.getElementById("forecastResults");
    body.textContent = "";
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
  }

  document.getElementById("forecastForm").addEventListener("submit", async event => {
    event.preventDefault();
    const phrases = api.lines(document.getElementById("forecastPhrases").value);
    if (!phrases.length) return api.setStatus(status, "Добавьте хотя бы одну фразу.", true);
    const region = Number(document.getElementById("forecastRegions").value);
    const geo = Number.isFinite(region) && region > 0 ? [region] : [];
    api.setStatus(status, "Создание прогноза…");
    try {
      const combined = { Phrases: [], Common: { Shows: 0, Clicks: 0, FirstPlaceClicks: 0, PremiumClicks: 0, Geo: "" } };
      const batches = [];
      for (let index = 0; index < phrases.length; index += 100) batches.push(phrases.slice(index, index + 100));
      for (let index = 0; index < batches.length; index += 1) {
        api.setStatus(status, `Расчёт пакета ${index + 1} из ${batches.length}…`);
        const created = await api.requestExtension("DIRECT_CALL", {
          method: "CreateNewForecast",
          param: { Phrases: batches[index], GeoID: geo, Currency: document.getElementById("forecastCurrency").value, AuctionBids: "Yes" }
        });
        await waitForForecast(created.data);
        const result = await api.requestExtension("DIRECT_CALL", { method: "GetForecast", param: created.data });
        api.requestExtension("DIRECT_CALL", { method: "DeleteForecastReport", param: created.data }).catch(() => {});
        combined.Phrases.push(...(result.data?.Phrases || []));
        const common = result.data?.Common || {};
        combined.Common.Geo ||= common.Geo || "";
        ["Shows", "Clicks", "FirstPlaceClicks", "PremiumClicks"].forEach(field => { combined.Common[field] += Number(common[field] || 0); });
      }
      render(combined);
      api.setStatus(status, `Прогноз готов. Фраз: ${combined.Phrases.length}.`);
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });
})();
