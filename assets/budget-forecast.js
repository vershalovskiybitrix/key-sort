(() => {
  "use strict";
  const api = window.KeySortServices;
  const status = document.getElementById("forecastStatus");
  api.bindExtensionState(["OAuth-токен Директа"]);

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
    if (!phrases.length || phrases.length > 100) return api.setStatus(status, "Укажите от 1 до 100 фраз.", true);
    const geo = document.getElementById("forecastRegions").value.split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite);
    api.setStatus(status, "Создание прогноза…");
    try {
      const created = await api.requestExtension("DIRECT_CALL", {
        method: "CreateNewForecast",
        param: { Phrases: phrases, GeoID: geo, Currency: document.getElementById("forecastCurrency").value, AuctionBids: "Yes" }
      });
      await waitForForecast(created.data);
      const result = await api.requestExtension("DIRECT_CALL", { method: "GetForecast", param: created.data });
      render(result.data || {});
      api.requestExtension("DIRECT_CALL", { method: "DeleteForecastReport", param: created.data }).catch(() => {});
      api.setStatus(status, `Прогноз готов. Фраз: ${(result.data?.Phrases || []).length}.`);
    } catch (error) {
      api.setStatus(status, error.message, true);
    }
  });
})();
