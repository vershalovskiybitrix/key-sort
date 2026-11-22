(() => {
  "use strict";
  function normalizeWordstat(nodes) {
    return (nodes || []).map(node => ({
      id: String(node.id ?? ""),
      name: String(node.name || node.label || ""),
      children: normalizeWordstat(node.children)
    })).filter(node => node.id && node.name);
  }

  function normalizeDirect(items) {
    if ((items || []).some(item => item.name)) {
      const nodes = new Map();
      for (const item of items || []) {
        const id = String(item.id ?? "");
        const name = String(item.name || "");
        if (id && name) nodes.set(id, { id, name, parentId: item.parentId == null ? "" : String(item.parentId), children: [] });
      }
      const roots = [];
      for (const node of nodes.values()) {
        const parent = nodes.get(node.parentId);
        if (parent && parent !== node) parent.children.push(node);
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
        if (!nodes.has(path)) nodes.set(path, { id: "", name: part, children: [] });
        const node = nodes.get(path);
        if (parent && !parent.children.includes(node)) parent.children.push(node);
        parent = node;
      }
      if (parent) parent.id = String(item.id ?? "");
    }
    const childNodes = new Set([...nodes.values()].flatMap(node => node.children));
    return [...nodes.values()].filter(node => !childNodes.has(node));
  }

  function sortTree(nodes) {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    nodes.forEach(node => sortTree(node.children));
    return nodes;
  }

  function bindRegionTree(root) {
    const button = document.createElement("button");
    const panel = document.createElement("div");
    const search = document.createElement("input");
    const allButton = document.createElement("button");
    const tree = document.createElement("div");
    let selectedId = "";
    let selectedName = "Все регионы";
    let regions = [];

    button.type = "button";
    button.className = "region-picker-button";
    button.textContent = selectedName;
    button.setAttribute("aria-haspopup", "tree");
    button.setAttribute("aria-expanded", "false");
    panel.className = "region-picker-panel";
    panel.hidden = true;
    search.type = "search";
    search.className = "region-picker-search";
    search.placeholder = "Поиск региона";
    allButton.type = "button";
    allButton.className = "region-picker-all";
    allButton.textContent = "Все регионы";
    tree.className = "region-picker-tree";
    tree.setAttribute("role", "tree");
    panel.append(search, allButton, tree);
    root.replaceChildren(button, panel);

    function choose(id, name) {
      selectedId = id;
      selectedName = name;
      button.textContent = name;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
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
          children.hidden = !needle;

          if (hasChildren) {
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "region-tree-toggle";
            toggle.textContent = needle ? "−" : "+";
            toggle.setAttribute("aria-label", `Раскрыть ${node.name}`);
            toggle.addEventListener("click", () => {
              children.hidden = !children.hidden;
              toggle.textContent = children.hidden ? "+" : "−";
            });
            row.append(toggle);
          } else {
            const spacer = document.createElement("span");
            spacer.className = "region-tree-spacer";
            row.append(spacer);
          }

          const select = document.createElement("button");
          select.type = "button";
          select.className = "region-tree-select";
          select.textContent = node.name;
          select.setAttribute("role", "treeitem");
          select.setAttribute("aria-selected", String(node.id === selectedId));
          select.disabled = !node.id;
          if (node.id) select.addEventListener("click", () => choose(node.id, node.name));
          row.append(select);
          item.append(row);
          if (hasChildren) { appendNodes(node.children, children, depth + 1); item.append(children); }
          parent.append(item);
        }
      }
      appendNodes(regions, list, 0);
    }

    allButton.addEventListener("click", () => choose("", "Все регионы"));
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
      button.textContent = selectedName;
    }).catch(error => {
      button.disabled = true;
      button.textContent = "Регионы не загружены";
      button.title = error.message;
      throw error;
    });
    return { ready, value: () => selectedId };
  }

  window.KeySortRegions = { bindRegionTree, normalizeWordstat, normalizeDirect };
})();
