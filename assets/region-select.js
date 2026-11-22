(() => {
  "use strict";

  function normalizeWordstat(nodes, parent = null) {
    return (nodes || []).map(source => {
      const node = { id: String(source.id ?? ""), name: String(source.name || source.label || ""), parent, children: [] };
      node.children = normalizeWordstat(source.children, node);
      return node;
    }).filter(node => node.id && node.name);
  }

  function normalizeDirect(items) {
    if ((items || []).some(item => item.name)) {
      const nodes = new Map();
      for (const item of items || []) {
        const id = String(item.id ?? "");
        const name = String(item.name || "");
        if (id && name) nodes.set(id, { id, name, parentId: item.parentId == null ? "" : String(item.parentId), parent: null, children: [] });
      }
      const roots = [];
      for (const node of nodes.values()) {
        const parent = nodes.get(node.parentId);
        if (parent && parent !== node) { node.parent = parent; parent.children.push(node); }
        else roots.push(node);
      }
      return roots;
    }

    const nodes = new Map();
    for (const item of items || []) {
      const parts = String(item.label || "").split(" → ").map(part => part.trim()).filter(Boolean);
      let parent = null;
      let path = "";
      for (const part of parts) {
        path = path ? `${path} → ${part}` : part;
        if (!nodes.has(path)) nodes.set(path, { id: "", name: part, parent: null, children: [] });
        const node = nodes.get(path);
        if (parent && !parent.children.includes(node)) { node.parent = parent; parent.children.push(node); }
        parent = node;
      }
      if (parent) parent.id = String(item.id ?? "");
    }
    return [...nodes.values()].filter(node => !node.parent);
  }

  function sortTree(nodes) {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    nodes.forEach(node => sortTree(node.children));
    return nodes;
  }

  function flatten(nodes) {
    const result = [];
    const visit = node => { result.push(node); node.children.forEach(visit); };
    nodes.forEach(visit);
    return result;
  }

  function hasAncestorIn(node, ids) {
    for (let parent = node.parent; parent; parent = parent.parent) if (ids.has(parent.id)) return true;
    return false;
  }

  function hasDescendantIn(node, ids) {
    return node.children.some(child => ids.has(child.id) || hasDescendantIn(child, ids));
  }

  function compileSignedRegions(nodes, included, excluded) {
    const byId = new Map(flatten(nodes).map(node => [node.id, node]));
    const positive = [...included].filter(id => byId.has(id) && !hasAncestorIn(byId.get(id), included));
    const negative = [...excluded].filter(id => byId.has(id) && hasAncestorIn(byId.get(id), included) && !hasAncestorIn(byId.get(id), excluded));
    return [...positive, ...negative.map(id => `-${id}`)];
  }

  function compilePositiveRegions(nodes, included, excluded) {
    const byId = new Map(flatten(nodes).map(node => [node.id, node]));
    const result = [];
    const expand = node => {
      if (excluded.has(node.id) || hasAncestorIn(node, excluded)) return;
      if (!hasDescendantIn(node, excluded)) { result.push(node.id); return; }
      node.children.forEach(expand);
    };
    for (const id of included) {
      const node = byId.get(id);
      if (node && !hasAncestorIn(node, included)) expand(node);
    }
    return [...new Set(result)];
  }

  function bindRegionTree(root) {
    const button = document.createElement("button");
    const panel = document.createElement("div");
    const search = document.createElement("input");
    const allRow = document.createElement("label");
    const allCheckbox = document.createElement("input");
    const allText = document.createElement("span");
    const tree = document.createElement("div");
    const included = new Set();
    const excluded = new Set();
    const expanded = new Set();
    let regions = [];

    button.type = "button";
    button.className = "region-picker-button";
    button.textContent = "Все регионы";
    button.setAttribute("aria-haspopup", "tree");
    button.setAttribute("aria-expanded", "false");
    panel.className = "region-picker-panel";
    panel.hidden = true;
    search.type = "search";
    search.className = "region-picker-search";
    search.placeholder = "Поиск региона";
    allRow.className = "region-picker-all";
    allCheckbox.type = "checkbox";
    allCheckbox.checked = true;
    allText.textContent = "Все регионы";
    allRow.append(allCheckbox, allText);
    tree.className = "region-picker-tree";
    tree.setAttribute("role", "tree");
    panel.append(search, allRow, tree);
    root.replaceChildren(button, panel);

    function clearDescendants(node) {
      for (const child of node.children) {
        included.delete(child.id);
        excluded.delete(child.id);
        clearDescendants(child);
      }
    }

    function isExcluded(node) {
      return excluded.has(node.id) || hasAncestorIn(node, excluded);
    }

    function isIncluded(node) {
      return !isExcluded(node) && (included.has(node.id) || hasAncestorIn(node, included));
    }

    function updateSummary() {
      allCheckbox.checked = included.size === 0;
      if (!included.size) button.textContent = "Все регионы";
      else if (!excluded.size && included.size === 1) {
        const selected = flatten(regions).find(node => included.has(node.id));
        button.textContent = selected ? selected.name : "Выбран 1 регион";
      } else button.textContent = `Выбрано: ${included.size}; исключено: ${excluded.size}`;
    }

    function toggleNode(node) {
      if (included.has(node.id)) {
        included.delete(node.id);
        clearDescendants(node);
      } else if (excluded.has(node.id)) {
        excluded.delete(node.id);
      } else if (isIncluded(node)) {
        excluded.add(node.id);
        clearDescendants(node);
      } else {
        included.add(node.id);
        excluded.delete(node.id);
        clearDescendants(node);
      }
      render(search.value);
      updateSummary();
    }

    function nodeMatches(node, query) {
      return node.name.toLocaleLowerCase("ru-RU").includes(query) || node.children.some(child => nodeMatches(child, query));
    }

    function render(query = "") {
      const needle = query.trim().toLocaleLowerCase("ru-RU");
      tree.textContent = "";
      const list = document.createElement("ul");
      list.className = "region-tree-level";
      tree.append(list);

      function appendNodes(nodes, parent, depth) {
        for (const node of nodes) {
          if (needle && !nodeMatches(node, needle)) continue;
          const item = document.createElement("li");
          const row = document.createElement("div");
          const children = document.createElement("ul");
          const hasChildren = node.children.length > 0;
          item.className = "region-tree-item";
          row.className = "region-tree-row";
          row.style.setProperty("--region-depth", depth);
          children.className = "region-tree-level";
          children.hidden = !needle && !expanded.has(node.id);

          if (hasChildren) {
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "region-tree-toggle";
            toggle.textContent = children.hidden ? "+" : "−";
            toggle.setAttribute("aria-label", `Раскрыть ${node.name}`);
            toggle.addEventListener("click", () => {
              children.hidden = !children.hidden;
              if (children.hidden) expanded.delete(node.id);
              else expanded.add(node.id);
              toggle.textContent = children.hidden ? "+" : "−";
            });
            row.append(toggle);
          } else {
            const spacer = document.createElement("span");
            spacer.className = "region-tree-spacer";
            row.append(spacer);
          }

          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          const text = document.createElement("span");
          label.className = "region-tree-select";
          checkbox.type = "checkbox";
          checkbox.checked = isIncluded(node);
          checkbox.indeterminate = !checkbox.checked && hasDescendantIn(node, included);
          checkbox.addEventListener("change", () => toggleNode(node));
          text.textContent = node.name;
          label.append(checkbox, text);
          row.append(label);
          item.append(row);
          if (hasChildren) { appendNodes(node.children, children, depth + 1); item.append(children); }
          parent.append(item);
        }
      }
      appendNodes(regions, list, 0);
    }

    allCheckbox.addEventListener("change", () => {
      included.clear();
      excluded.clear();
      render(search.value);
      updateSummary();
    });
    search.addEventListener("input", () => render(search.value));
    button.addEventListener("click", event => {
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) search.focus();
    });
    document.addEventListener("click", event => {
      if (!root.contains(event.target)) { panel.hidden = true; button.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) { panel.hidden = true; button.setAttribute("aria-expanded", "false"); button.focus(); }
    });

    button.disabled = true;
    button.textContent = "Загрузка регионов…";
    const ready = fetch("assets/regions.json?v=1", { credentials: "same-origin" }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }).then(data => {
      regions = sortTree(normalizeWordstat(data.regions));
      if (!regions.length) throw new Error("Яндекс вернул пустой список регионов");
      render();
      button.disabled = false;
      updateSummary();
    }).catch(error => {
      button.disabled = true;
      button.textContent = "Регионы не загружены";
      button.title = error.message;
      throw error;
    });

    return {
      ready,
      signedValue: () => compileSignedRegions(regions, included, excluded),
      positiveValue: () => compilePositiveRegions(regions, included, excluded),
      setSignedValue: values => {
        included.clear();
        excluded.clear();
        for (const value of values || []) {
          const id = String(value);
          if (id.startsWith("-")) excluded.add(id.slice(1));
          else included.add(id);
        }
        render(search.value);
        updateSummary();
      }
    };
  }

  window.KeySortRegions = { bindRegionTree, normalizeWordstat, normalizeDirect, compileSignedRegions, compilePositiveRegions };
})();
