(() => {
  "use strict";
  const api = window.KeySortServices;

  function flattenTree(nodes, path = [], result = []) {
    for (const node of nodes || []) {
      const label = node.label || node.name || "";
      const current = [...path, label].filter(Boolean);
      result.push({ id: String(node.id), label: current.join(" → ") });
      flattenTree(node.children, current, result);
    }
    return result;
  }

  async function bindRegionSelect(select, action) {
    select.disabled = true;
    try {
      const data = await api.requestExtension(action, {}, 30000);
      const regions = action === "WORDSTAT_REGIONS"
        ? flattenTree(data.regions)
        : (data.regions || []).map(region => ({ id: String(region.id), label: region.label }));
      const seen = new Set();
      regions.sort((a, b) => a.label.localeCompare(b.label, "ru")).forEach(region => {
        const key = `${region.id}:${region.label}`;
        if (!region.id || !region.label || seen.has(key)) return;
        seen.add(key);
        const option = document.createElement("option");
        option.value = region.id;
        option.textContent = region.label;
        select.append(option);
      });
    } finally {
      select.disabled = false;
    }
  }

  window.KeySortRegions = { bindRegionSelect };
})();
