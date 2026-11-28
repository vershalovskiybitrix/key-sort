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
    const limit = Math.min(100000, Math.max(1, Math.trunc(Number(document.getElementById("multiplyLimit").value)) || 10000));
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

  function* permutations(items, current = [], used = new Set()) {
    if (current.length === items.length) {
      yield current;
      return;
    }
    const seen = new Set();
    for (let index = 0; index < items.length; index += 1) {
      if (used.has(index) || seen.has(items[index])) continue;
      seen.add(items[index]);
      used.add(index);
      yield* permutations(items, [...current, items[index]], used);
      used.delete(index);
    }
  }

  function* combinations(options, index = 0, selected = []) {
    if (index === options.length) {
      yield selected;
      return;
    }
    for (const item of uniqueVariants(options[index])) {
      yield* combinations(options, index + 1, [...selected, item]);
    }
  }

  function* replacements(inside, open) {
    if (open === "{") {
      for (const option of splitTopLevel(inside)) yield* uniqueVariants(option);
      return;
    }
    const separator = inside.match(/^\+([\s\S]*?)\+/);
    const options = splitTopLevel(separator ? inside.slice(separator[0].length) : inside);
    for (const selected of combinations(options)) {
      for (const order of permutations(selected)) yield order.join(separator?.[1] ?? "");
    }
  }

  function* uniqueVariants(value) {
    const block = findBlock(value);
    if (!block) {
      yield value;
      return;
    }
    const prefix = value.slice(0, block.start);
    const suffix = value.slice(block.end + 1);
    const seen = new Set();
    const seenReplacements = new Set();
    for (const replacement of replacements(value.slice(block.start + 1, block.end), block.open)) {
      if (seenReplacements.has(replacement)) continue;
      seenReplacements.add(replacement);
      for (const tail of uniqueVariants(suffix)) {
        const result = prefix + replacement + tail;
        if (seen.has(result)) continue;
        seen.add(result);
        yield result;
      }
    }
  }

  function expand(value, limit) {
    const result = [];
    if (limit <= 0) return result;
    for (const item of uniqueVariants(value)) {
      result.push(item);
      if (result.length >= limit) break;
    }
    return result;
  }

  document.getElementById("seoApply").addEventListener("click", () => {
    const limit = Math.min(100000, Math.max(1, Math.trunc(Number(document.getElementById("seoLimit").value)) || 10000));
    const status = document.getElementById("seoStatus");
    try {
      const result = expand(document.getElementById("seoTemplate").value, limit + 1);
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
    textarea.dispatchEvent(new Event("input"));
    textarea.focus();
  }));
  function bindMemory(prefix, fieldIds, auto) {
    const get = id => document.getElementById(id);
    const fields = fieldIds.map(get);
    const result = get(prefix + "Result");
    const status = get(prefix + "Status");
    const apply = get(prefix + "Apply");
    const memory = api.pageMemory(prefix);
    const report = error => api.setStatus(status, error.message, true);
    const save = () => memory.save({
      fields: fields.map(field => field.type === "checkbox" ? field.checked : field.value),
      result: result.value
    }).catch(report);
    let timer;
    let updatingFields = false;
    for (const field of fields) field.addEventListener("input", () => {
      if (updatingFields) return;
      clearTimeout(timer);
      save();
      if (auto?.checked) timer = setTimeout(() => apply.click(), 350);
    });
    apply.addEventListener("click", () => { clearTimeout(timer); save(); });
    get(prefix + "Clear").addEventListener("click", () => {
      clearTimeout(timer);
      for (const field of fields) {
        if (field.type === "checkbox") field.checked = field.defaultChecked;
        else field.value = field.defaultValue;
      }
      result.value = "";
      updatingFields = true;
      [...fields, result].filter(field => field.tagName === "TEXTAREA").forEach(field => field.dispatchEvent(new Event("input")));
      updatingFields = false;
      api.setStatus(status, "");
      memory.clear().catch(report);
    });
    return memory.load().then(saved => {
      if (!saved) return;
      fields.forEach((field, index) => {
        if (field.type === "checkbox") field.checked = saved.fields[index];
        else field.value = saved.fields[index];
      });
      result.value = saved.result;
      updatingFields = true;
      [...fields, result].filter(field => field.tagName === "TEXTAREA").forEach(field => field.dispatchEvent(new Event("input")));
      updatingFields = false;
    }).catch(report);
  }

  const main = document.querySelector("main");
  main.inert = true;
  Promise.all([
    bindMemory("multiply", ["multiplyA", "multiplyB", "multiplyLimit", "multiplyAuto"], document.getElementById("multiplyAuto")),
    bindMemory("seo", ["seoTemplate", "seoLimit"])
  ]).finally(() => { main.inert = false; });
  window.KeySortMultiplier = { expand };
})();
