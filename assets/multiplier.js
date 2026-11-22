(() => {
  "use strict";
  const api = window.KeySortServices;
  ["multiplyA", "multiplyB", "multiplyResult"].forEach(id => api.autoGrow(document.getElementById(id), 20));

  async function copyResult(resultId, statusId) {
    const result = document.getElementById(resultId);
    await navigator.clipboard.writeText(result.value);
    api.setStatus(document.getElementById(statusId), "Результат скопирован.");
  }

  document.getElementById("multiplyCopy").addEventListener("click", () => {
    copyResult("multiplyResult", "multiplyStatus").catch(error => api.setStatus(document.getElementById("multiplyStatus"), error.message, true));
  });
  document.getElementById("seoCopy").addEventListener("click", () => {
    copyResult("seoResult", "seoStatus").catch(error => api.setStatus(document.getElementById("seoStatus"), error.message, true));
  });

  document.getElementById("multiplyApply").addEventListener("click", () => {
    const a = api.lines(document.getElementById("multiplyA").value);
    const b = api.lines(document.getElementById("multiplyB").value);
    const limit = Math.max(1, Number(document.getElementById("multiplyLimit").value) || 10000);
    const result = [];
    outer: for (const left of a) for (const right of b) { result.push(`${left} ${right}`.trim()); if (result.length >= limit) break outer; }
    document.getElementById("multiplyResult").value = result.join("\n");
    document.getElementById("multiplyResult").dispatchEvent(new Event("input"));
    api.setStatus(document.getElementById("multiplyStatus"), `${result.length === limit && a.length * b.length > limit ? "Достигнут лимит. " : ""}Результатов: ${result.length}.`);
  });

  function splitTopLevel(value) {
    const result = []; let start = 0; const stack = [];
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === "{" || value[i] === "[") stack.push(value[i]);
      else if (value[i] === "}" || value[i] === "]") stack.pop();
      else if (value[i] === "|" && !stack.length) { result.push(value.slice(start, i)); start = i + 1; }
    }
    result.push(value.slice(start)); return result;
  }

  function findBlock(value) {
    for (let start = 0; start < value.length; start += 1) {
      const open = value[start]; if (open !== "{" && open !== "[") continue;
      const stack = [open];
      for (let end = start + 1; end < value.length; end += 1) {
        if (value[end] === "{" || value[end] === "[") stack.push(value[end]);
        else if (value[end] === "}" || value[end] === "]") {
          const expected = value[end] === "}" ? "{" : "[";
          if (stack.pop() !== expected) throw new Error("Несогласованные скобки в шаблоне");
          if (!stack.length) return { start, end, open };
        }
      }
      throw new Error("Незакрытая скобка в шаблоне");
    }
    return null;
  }

  function permutations(items, limit) {
    const result = []; const used = Array(items.length).fill(false); const current = [];
    function walk() {
      if (result.length >= limit) return;
      if (current.length === items.length) { result.push([...current]); return; }
      const level = new Set();
      for (let i = 0; i < items.length; i += 1) if (!used[i] && !level.has(items[i])) { level.add(items[i]); used[i] = true; current.push(items[i]); walk(); current.pop(); used[i] = false; }
    }
    walk(); return result;
  }

  function cartesian(groups, limit) {
    let result = [[]];
    for (const group of groups) {
      const next = [];
      for (const base of result) for (const item of group) { next.push([...base, item]); if (next.length >= limit) break; }
      result = next;
    }
    return result;
  }

  function expand(value, limit) {
    const block = findBlock(value); if (!block) return [value];
    const prefix = value.slice(0, block.start); const suffix = value.slice(block.end + 1);
    let inside = value.slice(block.start + 1, block.end); let replacements = [];
    if (block.open === "{") {
      for (const option of splitTopLevel(inside)) replacements.push(...expand(option, limit - replacements.length));
    } else {
      let separator = ""; const match = inside.match(/^\+([\s\S]*?)\+/);
      if (match) { separator = match[1]; inside = inside.slice(match[0].length); }
      const groups = splitTopLevel(inside).map(option => expand(option, limit));
      for (const selection of cartesian(groups, limit)) {
        for (const order of permutations(selection, limit - replacements.length)) { replacements.push(order.join(separator)); if (replacements.length >= limit) break; }
        if (replacements.length >= limit) break;
      }
    }
    const result = [];
    for (const replacement of replacements) for (const tail of expand(suffix, limit)) { result.push(prefix + replacement + tail); if (result.length >= limit) return result; }
    return result;
  }

  document.getElementById("seoApply").addEventListener("click", () => {
    const limit = Math.max(1, Number(document.getElementById("seoLimit").value) || 10000);
    const status = document.getElementById("seoStatus");
    try {
      const result = [...new Set(expand(document.getElementById("seoTemplate").value, limit + 1))];
      const truncated = result.length > limit; const shown = result.slice(0, limit);
      document.getElementById("seoResult").value = shown.join("\n");
      api.setStatus(status, `${truncated ? "Достигнут лимит. " : ""}Результатов: ${shown.length}.`);
    } catch (error) { api.setStatus(status, error.message, true); }
  });
  document.querySelectorAll("[data-template]").forEach(button => button.addEventListener("click", () => {
    const textarea = document.getElementById("seoTemplate");
    const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    const placeholder = button.dataset.template === "choice" ? "вариант 1|вариант 2" : "+ +слово 1|слово 2";
    const open = button.dataset.template === "choice" ? "{" : "[";
    const close = button.dataset.template === "choice" ? "}" : "]";
    const insertion = `${open}${selected || placeholder}${close}`;
    textarea.setRangeText(insertion, textarea.selectionStart, textarea.selectionEnd, "end");
    textarea.focus();
  }));
  window.KeySortMultiplier = { expand };
})();
