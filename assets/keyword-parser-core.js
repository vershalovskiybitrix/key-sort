((root, factory) => {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  if (root) root.KeySortKeywordParserCore = core;
})(typeof window === "undefined" ? globalThis : window, () => {
  "use strict";

  const clean = value => String(value || "").trim().replace(/\s+/g, " ");
  const chars = value => Array.from(value).length;
  const words = value => clean(value).toLowerCase().match(/[a-zа-яё0-9]+/giu) || [];
  const unique = values => [...new Set(values.map(clean).filter(Boolean))];

  function parseRequest(query, minusText) {
    const positive = [];
    const negative = [];
    for (const token of clean(query).split(" ").filter(Boolean)) {
      if (token.startsWith("-") && token.length > 1) negative.push(...words(token.slice(1)));
      else positive.push(token);
    }
    negative.push(...words(minusText));
    return { basePhrase: clean(positive.join(" ")), userMinusWords: unique(negative) };
  }

  function buildQuery(basePhrase, pathWords, userMinusWords, automaticMinusWords, limit = 400) {
    const positive = clean([basePhrase, ...pathWords].join(" "));
    if (!positive) throw new Error("Введите запрос.");
    if (chars(positive) > limit) throw new Error(`Положительная часть запроса длиннее ${limit} символов.`);
    let query = positive;
    const added = new Set(words(positive));
    const append = word => {
      const normalized = clean(word).toLowerCase();
      if (!normalized || added.has(normalized)) return true;
      const candidate = `${query} -${normalized}`;
      if (chars(candidate) > limit) return false;
      query = candidate;
      added.add(normalized);
      return true;
    };
    for (const word of unique(userMinusWords)) {
      if (!append(word)) throw new Error(`Запрос вместе с обязательными минус-словами не помещается в ${limit} символов.`);
    }
    for (const word of unique(automaticMinusWords)) append(word);
    return query;
  }

  function rankCandidates(rows, lemmaByWord, excludedKeys, count = 20) {
    const stats = new Map();
    for (const row of rows) {
      const seen = new Set();
      for (const word of words(row.phrase)) {
        const analysis = lemmaByWord[word];
        if (!analysis || !analysis.key || excludedKeys.has(analysis.key) || seen.has(analysis.key)) continue;
        seen.add(analysis.key);
        const item = stats.get(analysis.key) || { key: analysis.key, lemma: analysis.lemma || word, frequency: 0, phrases: 0 };
        item.frequency += Number(row.count || 0);
        item.phrases += 1;
        stats.set(analysis.key, item);
      }
    }
    const values = [...stats.values()];
    const byFrequency = [...values].sort((a, b) => b.frequency - a.frequency || b.phrases - a.phrases || a.lemma.localeCompare(b.lemma, "ru"));
    const byPhrases = [...values].sort((a, b) => b.phrases - a.phrases || b.frequency - a.frequency || a.lemma.localeCompare(b.lemma, "ru"));
    const selected = byFrequency.slice(0, count);
    const selectedKeys = new Set(selected.map(item => item.key));
    for (const item of byPhrases) {
      if (selectedKeys.has(item.key)) continue;
      selected.push(item);
      selectedKeys.add(item.key);
      if (selected.length >= count * 2) break;
    }
    return selected;
  }

  function mergeRows(target, incoming) {
    for (const row of incoming || []) {
      const phrase = clean(row.phrase);
      if (!phrase) continue;
      const key = phrase.toLowerCase();
      const count = Number(row.count || 0);
      const previous = target.get(key);
      if (!previous || count > previous.count) target.set(key, { phrase, count });
    }
    return target;
  }

  function branchComplete(rows, pageSize = 2000, threshold = 10) {
    if ((rows || []).length < pageSize) return true;
    return Math.min(...rows.map(row => Number(row.count || 0))) <= threshold;
  }

  return { chars, words, unique, parseRequest, buildQuery, rankCandidates, mergeRows, branchComplete };
});
