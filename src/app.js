(() => {
  'use strict';
  if (window.__nfiInstalled) return;
  window.__nfiInstalled = true;
  const storage = window.localStorage;
  let pending = null, timer = null;
  let previous = NFI.chatUrl(location.href);
  let panel;
  const raf = fn => setTimeout(fn, 0);
  function finish(outcome, signal, destination) {
    if (!pending) return;
    clearTimeout(timer);
    const record = { id: pending.id, time: pending.time, outcome, signal, elapsedMs: Date.now() - pending.time };
    NFI.save(storage, record, destination);
    pending = null;
    render();
  }
  function route() {
    const current = NFI.chatUrl(location.href);
    if (pending && current && current !== pending.source) finish('destination_observed', 'different_chat_navigation', current);
    previous = current;
  }
  function begin() {
    if (pending) finish('indeterminate', 'another_attempt');
    pending = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, time: Date.now(), source: previous };
    timer = setTimeout(() => finish('indeterminate', 'no_destination_within_45s'), 45000);
    render();
  }
  function forkControl(target) {
    const node = target.closest('button,[role="button"],[role="menuitem"]');
    if (!node || node.closest('#nfi-widget')) return false;
    const label = [node.getAttribute('aria-label'), node.getAttribute('title'), node.textContent].filter(Boolean).join(' ').trim();
    return /^fork(?:\s+into\s+(?:a\s+)?new\s+chat)?$/i.test(label) || /^fork\s+into\s+new\s+chat$/i.test(label);
  }
  document.addEventListener('click', e => { if (e.target instanceof Element && forkControl(e.target)) raf(begin); }, true);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) { const result = Reflect.apply(original, this, args); raf(route); return result; };
  }
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  addEventListener('pageshow', route);
  setInterval(route, 1200);
  // NFI memorandum 002: An unobserved departure shall not be stamped "failure."
  function button(label, action) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', action); return b; }
  function render() {
    if (!panel) return;
    const { records, history } = NFI.prune(storage);
    const data = NFI.report(records);
    panel.replaceChildren();
    const header = document.createElement('div'); header.className = 'nfi-header';
    header.append('Fork Diagnostics ', button('×', () => { panel.hidden = true; launcher.hidden = false; }));
    panel.append(header);
    const stats = document.createElement('p'); stats.textContent = `${data.counts.attempts} attempts · ${data.counts.destinationsObserved} destinations · ${data.counts.indeterminate} unknown`;
    panel.append(stats);
    if (pending) { const p = document.createElement('p'); p.textContent = 'Fork selected; waiting for a destination…'; panel.append(p); }
    const title = document.createElement('strong'); title.textContent = 'Recent destinations (private)'; panel.append(title);
    const list = document.createElement('ol');
    for (const item of history.slice().reverse().slice(0, 12)) {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = item.url; a.textContent = `Chat · ${new Date(item.time).toLocaleString()}`;
      a.rel = 'noopener noreferrer'; li.append(a); list.append(li);
    }
    if (!list.childNodes.length) { const li = document.createElement('li'); li.textContent = 'No destinations observed yet.'; list.append(li); }
    panel.append(list);
    const details = document.createElement('details'), heading = document.createElement('summary'); heading.textContent = 'Diagnostics and settings'; details.append(heading);
    for (const r of records.slice().reverse().slice(0, 12)) {
      const item = document.createElement('details'), h = document.createElement('summary'), code = document.createElement('pre');
      h.textContent = `${new Date(r.time).toLocaleString()} · ${NFI.summary(r)}`;
      code.textContent = JSON.stringify(data.records.find(x => x.time === new Date(r.time).toISOString()), null, 2);
      item.append(h, code); details.append(item);
    }
    const controls = document.createElement('div'); controls.className = 'nfi-controls';
    const days = document.createElement('select'), limit = document.createElement('select');
    for (const n of [7, 30, 90, 365]) days.add(new Option(`${n} days`, String(n), false, NFI.settings(storage).days === n));
    for (const n of [25, 100, 250]) limit.add(new Option(`${n} entries`, String(n), false, NFI.settings(storage).limit === n));
    function update() { storage.setItem(NFI.SETTINGS_KEY, JSON.stringify({ days: Number(days.value), limit: Number(limit.value) })); render(); }
    days.addEventListener('change', update); limit.addEventListener('change', update);
    controls.append('Keep ', days, limit);
    controls.append(button('Copy report', async () => { try { await navigator.clipboard.writeText(JSON.stringify(NFI.report(NFI.prune(storage).records), null, 2)); } catch { alert('Copy unavailable; use Export report.'); } }));
    controls.append(button('Export report', () => { const blob = new Blob([JSON.stringify(NFI.report(NFI.prune(storage).records), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nfi-diagnostics.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }));
    controls.append(button('Delete local data', () => { if (confirm('Delete all saved fork history and diagnostics from this browser?')) { NFI.clear(storage); render(); } }));
    details.append(controls); panel.append(details);
  }
  const style = document.createElement('style');
  style.textContent = '#nfi-widget,#nfi-launcher{position:fixed;z-index:2147483646;bottom:16px;right:16px;font:13px/1.4 system-ui,sans-serif;color:#eee}#nfi-launcher{background:#29223b;border:1px solid #9a85b9;border-radius:18px;padding:6px 12px;cursor:pointer}#nfi-widget{width:min(360px,calc(100vw - 24px));max-height:65vh;overflow:auto;background:#211d2e;border:1px solid #75648c;border-radius:10px;box-shadow:0 4px 20px #0008;padding:12px}#nfi-widget[hidden],#nfi-launcher[hidden]{display:none}#nfi-widget button,#nfi-widget select{background:#352d4a;border:1px solid #78678d;color:#eee;border-radius:5px;padding:3px 6px;cursor:pointer}#nfi-widget a{color:#cdb7ff}#nfi-widget ol{padding-left:22px;max-height:130px;overflow:auto}#nfi-widget li{margin:5px 0}#nfi-widget pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}#nfi-widget details{margin-top:8px}#nfi-widget summary{cursor:pointer}.nfi-header{display:flex;justify-content:space-between;font-weight:600}.nfi-controls{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center}';
  const launcher = document.createElement('button'); launcher.id = 'nfi-launcher'; launcher.textContent = 'Fork history'; launcher.addEventListener('click', () => { launcher.hidden = true; panel.hidden = false; render(); });
  panel = document.createElement('section'); panel.id = 'nfi-widget'; panel.hidden = true; panel.setAttribute('aria-label', 'Fork diagnostics');
  document.documentElement.append(style, launcher, panel);
  render();
})();
