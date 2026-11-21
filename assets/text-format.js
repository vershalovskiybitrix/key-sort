(() => {
  "use strict";
  const prepositions = new Set("без в во для до за из из-за из-под к ко кроме между на над о об обо около от перед по под при про ради с со сквозь среди у через".split(" "));
  const input = document.getElementById("formatInput");
  const output = document.getElementById("formatOutput");
  document.getElementById("formatAddPlus").addEventListener("change", event => { if (event.target.checked) document.getElementById("formatRemovePlus").checked = false; });
  document.getElementById("formatRemovePlus").addEventListener("change", event => { if (event.target.checked) document.getElementById("formatAddPlus").checked = false; });

  function addPlus(line) {
    return line.replace(/(^|\s)(\+?)([\p{L}-]+)/gu, (match, space, plus, word) => `${space}${prepositions.has(word.toLocaleLowerCase("ru-RU")) ? "+" : plus}${word}`);
  }

  document.getElementById("formatApply").addEventListener("click", () => {
    let rows = input.value.split(/\r?\n/);
    if (document.getElementById("formatClean").checked) rows = rows.map(row => row.replace(/[^\p{L}\p{N}\s+!\-"'\[\]{}|.,]/gu, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (document.getElementById("formatRemovePlus").checked) rows = rows.map(row => row.replace(/(^|\s)\+(?=\S)/g, "$1"));
    if (document.getElementById("formatAddPlus").checked) rows = rows.map(addPlus);
    if (document.getElementById("formatLower").checked) rows = rows.map(row => row.toLocaleLowerCase("ru-RU"));
    if (document.getElementById("formatDedupe").checked) rows = [...new Set(rows)];
    if (document.getElementById("formatSort").checked) rows.sort((a, b) => a.localeCompare(b, "ru"));
    output.value = rows.join("\n");
  });
})();
