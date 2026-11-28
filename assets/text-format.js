(() => {
  "use strict";
  const prepositions = new Set("без в во для до за из из-за из-под к ко кроме между на над о об обо около от перед по под при про ради с со сквозь среди у через".split(" "));
  const input = document.getElementById("formatInput");
  const output = document.getElementById("formatOutput");
  const api = window.KeySortServices;
  const memory = api.pageMemory("text-format");
  const status = document.getElementById("formatStatus");
  const options = [...document.querySelectorAll(".service-checks input[type=checkbox]")];
  const copy = document.getElementById("formatCopy");
  const report = error => api.setStatus(status, error.message, true);
  document.getElementById("formatAddPlus").addEventListener("change", event => { if (event.target.checked) document.getElementById("formatRemovePlus").checked = false; });
  document.getElementById("formatRemovePlus").addEventListener("change", event => { if (event.target.checked) document.getElementById("formatAddPlus").checked = false; });

  function addPlus(line) {
    return line.replace(/(^|\s)(\+?)([\p{L}-]+)/gu, (match, space, plus, word) => `${space}${prepositions.has(word.toLocaleLowerCase("ru-RU")) ? "+" : plus}${word}`);
  }

  function calculate() {
    let rows = input.value.split(/\r?\n/);
    if (document.getElementById("formatClean").checked) rows = rows.map(row => row.replace(/[^\p{L}\p{N}\s+!\-"'\[\]{}|.,]/gu, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (document.getElementById("formatRemovePlus").checked) rows = rows.map(row => row.replace(/(^|\s)\+(?=\S)/g, "$1"));
    if (document.getElementById("formatAddPlus").checked) rows = rows.map(addPlus);
    if (document.getElementById("formatLower").checked) rows = rows.map(row => row.toLocaleLowerCase("ru-RU"));
    if (document.getElementById("formatDedupe").checked) rows = [...new Set(rows)];
    if (document.getElementById("formatSort").checked) rows.sort((a, b) => a.localeCompare(b, "ru"));
    output.value = rows.join("\n");
    copy.disabled = !output.value;
  }

  function changed() {
    calculate();
    memory.save({ input: input.value, options: options.map(field => field.checked) }).catch(report);
  }
  document.getElementById("formatApply").addEventListener("click", calculate);
  input.addEventListener("input", changed);
  options.forEach(field => field.addEventListener("change", changed));
  document.getElementById("formatClear").addEventListener("click", () => {
    input.value = "";
    options.forEach(field => { field.checked = field.defaultChecked; });
    calculate();
    api.setStatus(status, "");
    memory.clear().catch(report);
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      api.setStatus(status, "Результат скопирован.");
    } catch (error) { report(error); }
  });
  const main = document.querySelector("main");
  main.inert = true;
  memory.load().then(saved => {
    if (!saved) return;
    input.value = saved.input;
    options.forEach((field, index) => { field.checked = saved.options[index]; });
    calculate();
  }).catch(report).finally(() => { main.inert = false; });
})();
