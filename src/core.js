const NFI = (() => {
  'use strict';
  const VERSION = 1;
  const PUBLIC_KEY = 'nfi:diagnostics:v1';
  const PRIVATE_KEY = 'nfi:history:v1';
  const SETTINGS_KEY = 'nfi:settings:v1';
  const DEFAULTS = { days: 30, limit: 100 };
  const CHAT_PATH = /^\/chats\/(\d+)\/?$/;
  const HOSTS = new Set(['janitorai.com', 'www.janitorai.com']);
  // NFI memorandum 001: The filing cabinet accepts only forms it can describe.
  function chatUrl(value) {
    try {
      const u = new URL(value);
      if (u.protocol !== 'https:' || !HOSTS.has(u.hostname) || u.port || u.username || u.password) return null;
      const m = CHAT_PATH.exec(u.pathname);
      return m ? `https://${u.hostname}/chats/${m[1]}` : null;
    } catch { return null; }
  }
  function read(storage, key, fallback) {
    try { const value = JSON.parse(storage.getItem(key)); return value && typeof value === 'object' ? value : fallback; }
    catch { return fallback; }
  }
  function settings(storage) {
    const raw = read(storage, SETTINGS_KEY, DEFAULTS);
    return { days: [7, 30, 90, 365].includes(raw.days) ? raw.days : 30,
      limit: [25, 100, 250].includes(raw.limit) ? raw.limit : 100 };
  }
  function prune(storage, now = Date.now()) {
    const s = settings(storage), min = now - s.days * 86400000;
    const records = read(storage, PUBLIC_KEY, []);
    const history = read(storage, PRIVATE_KEY, []);
    const safeRecords = Array.isArray(records) ? records.filter(r => r && Number.isFinite(r.time) && r.time >= min).slice(-s.limit) : [];
    const safeHistory = Array.isArray(history) ? history.filter(r => r && Number.isFinite(r.time) && r.time >= min && chatUrl(r.url)).slice(-s.limit).map(r => ({ id: r.id, time: r.time, url: chatUrl(r.url) })) : [];
    storage.setItem(PUBLIC_KEY, JSON.stringify(safeRecords));
    storage.setItem(PRIVATE_KEY, JSON.stringify(safeHistory));
    return { records: safeRecords, history: safeHistory };
  }
  function save(storage, record, destination) {
    const { records, history } = prune(storage, record.time);
    records.push(record);
    storage.setItem(PUBLIC_KEY, JSON.stringify(records.slice(-settings(storage).limit)));
    if (destination && chatUrl(destination)) {
      history.push({ id: record.id, time: record.time, url: chatUrl(destination) });
      storage.setItem(PRIVATE_KEY, JSON.stringify(history.slice(-settings(storage).limit)));
    }
  }
  function clear(storage) { storage.removeItem(PUBLIC_KEY); storage.removeItem(PRIVATE_KEY); }
  function summary(record) {
    if (record.outcome === 'destination_observed') return 'A different chat opened after Fork was selected. Destination saved locally.';
    if (record.outcome === 'pending') return 'Fork selected; waiting for a new chat destination.';
    return 'No new chat destination was observed. The fork outcome is unknown.';
  }
  function report(records) {
    const safe = records.map(r => ({ version: VERSION, time: new Date(r.time).toISOString(), outcome: r.outcome,
      signal: r.signal, elapsedMs: r.elapsedMs ?? null }));
    return { project: 'JanitorAI Fork Diagnostics', schema: VERSION, generatedAt: new Date().toISOString(),
      counts: { attempts: safe.length, destinationsObserved: safe.filter(r => r.outcome === 'destination_observed').length,
        indeterminate: safe.filter(r => r.outcome === 'indeterminate').length }, records: safe };
  }
  return { chatUrl, settings, prune, save, clear, summary, report, PUBLIC_KEY, PRIVATE_KEY, SETTINGS_KEY };
})();
