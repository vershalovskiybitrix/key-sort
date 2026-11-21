(() => {
  "use strict";
  const services = [
    ["Парсинг ключей", "keyword-parser.html"],
    ["Прогноз бюджета", "budget-forecast.html"],
    ["Форматирование текста", "text-format.html"],
    ["Вычитание дублей", "subtract.html"],
    ["Перемножитель", "multiplier.html"]
  ];

  document.querySelectorAll("[data-services-menu]").forEach((root, rootIndex) => {
    const button = document.createElement("button");
    const panel = document.createElement("div");
    const panelId = `servicesMenuPanel-${rootIndex}`;
    button.type = "button";
    button.className = "settings-button";
    button.textContent = "Сервисы";
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panelId);
    panel.id = panelId;
    panel.className = "services-menu-panel";
    panel.hidden = true;
    services.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.className = "services-menu-link";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = label;
      panel.append(link);
    });
    button.addEventListener("click", event => {
      event.stopPropagation();
      const settingsMenu = document.getElementById("settingsMenu");
      const settingsButton = document.getElementById("settingsButton");
      if (settingsMenu) settingsMenu.hidden = true;
      if (settingsButton) settingsButton.setAttribute("aria-expanded", "false");
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
    });
    document.addEventListener("click", event => {
      if (!root.contains(event.target)) { panel.hidden = true; button.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { panel.hidden = true; button.setAttribute("aria-expanded", "false"); button.focus(); }
    });
    root.append(button, panel);
  });
})();
