'use strict';

const STORE_KEY = 'usaf_route_notes_v1';

/* ============================== State ============================== */

let routes = [];
let currentRouteId = null;

/* ============================== Storage (IndexedDB + fallback) ============================== */

const DB_NAME = 'usaf_route_notes_db';
const canIdb = typeof indexedDB !== 'undefined';
let dbReady = idbOpen();
let _writeQueue = Promise.resolve();

function idbOpen() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
}

async function idbGet(key) {
  try {
    const db = await dbReady;
    return await new Promise((resolve) => {
      const req = db.transaction('kv', 'readonly').objectStore('kv').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
}

async function idbSet(key, value) {
  try {
    const db = await dbReady;
    return await new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) { return false; }
}

function loadRoutes() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch (e) { return []; }
}

// Writes are serialized so a slow save can't overwrite a newer one.
function persist() {
  const snapshot = JSON.parse(JSON.stringify(routes));
  if (canIdb) {
    _writeQueue = _writeQueue.then(() => idbSet(STORE_KEY, snapshot)).catch(() => {});
    return _writeQueue;
  }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(snapshot)); }
  catch (e) { toast('Storage is full. Export and delete old routes.'); }
  return Promise.resolve();
}

async function initStorage() {
  routes = canIdb ? (await idbGet(STORE_KEY)) || [] : loadRoutes();
  if (canIdb && !routes.length) {
    const legacy = loadRoutes();
    if (legacy.length) { routes = legacy; await persist(); }
  }
}

/* ============================== Model helpers ============================== */

function newRoute(name, stops) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: name || 'Untitled Route',
    createdAt: new Date().toISOString(),
    routeDate: todayISO(),
    stops: stops || [],
  };
}

function makeStop(name, cod, instructions) {
  return { name: name || '', cod: !!cod, instructions: instructions || '', notes: '' };
}

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function currentRoute() {
  return routes.find((r) => r.id === currentRouteId) || null;
}

/* ============================== UI helpers ============================== */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function toast(msg, ms = 2400) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================== Screen: Home ============================== */

function renderHome() {
  const view = document.getElementById('view');
  view.innerHTML = '';

  const newCard = el('div', { class: 'card new-route-card' }, [
    el('h2', { class: 'card-title' }, ['Start a New Route']),
    el('div', { class: 'field' }, [
      el('span', { class: 'field-label' }, ['Route Name']),
      el('input', { type: 'text', id: 'newRouteName', placeholder: 'e.g. Tuesday North Run', onkeydown: (e) => { if (e.key === 'Enter') createRoute(); } }),
    ]),
    el('button', { class: 'btn primary big', onclick: createRoute }, ['Start Route \u2192']),
  ]);
  view.appendChild(newCard);

  if (!routes.length) {
    view.appendChild(el('div', { class: 'empty' }, [
      'Name your route above, then add each stop as you go. Saved routes will show up here for printing later.',
    ]));
    return;
  }

  const sorted = [...routes].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const list = el('div', { class: 'rec-list' });
  list.appendChild(el('div', { class: 'page-head' }, [
    el('h2', { class: 'page-title' }, ['Saved Routes (' + sorted.length + ')']),
    el('button', { class: 'btn ghost small', onclick: exportAll }, ['Backup JSON']),
  ]));
  for (const r of sorted) {
    const withNotes = r.stops.filter((s) => s.notes && s.notes.trim()).length;
    list.appendChild(el('div', { class: 'card rec' }, [
      el('div', { class: 'rec-main', onclick: () => openRoute(r.id) }, [
        el('div', { class: 'rec-name' }, [r.name]),
        el('div', { class: 'rec-meta' }, [r.stops.length + ' stops  •  ' + (r.routeDate || 'no date')]),
      ]),
      el('div', { class: 'rec-sub' }, [
        el('span', { class: 'badge ' + (withNotes ? 'bad-ni' : 'bad-ok') }, [withNotes ? withNotes + ' with notes' : 'no notes yet']),
      ]),
      el('div', { class: 'rec-actions' }, [
        el('button', { class: 'btn ghost small', onclick: () => openRoute(r.id) }, ['Open']),
        el('button', { class: 'btn ghost small primary-outline', onclick: () => openPrint(r) }, ['Print / PDF']),
        el('button', { class: 'btn ghost small', onclick: () => exportRoute(r) }, ['JSON']),
        el('button', { class: 'btn ghost small danger', onclick: () => deleteRoute(r.id) }, ['Delete']),
      ]),
    ]));
  }
  view.appendChild(list);
}

function createRoute() {
  const input = document.getElementById('newRouteName');
  const name = input ? input.value.trim() : '';
  if (!name) { toast('Enter a route name first.'); return; }
  if (routes.some((r) => r.name.toLowerCase() === name.toLowerCase())) { toast('A route with that name already exists.'); return; }
  const r = newRoute(name);
  routes.push(r);
  persist();
  currentRouteId = r.id;
  renderRoute();
  toast('Route created \u2014 add your stops.');
}

function deleteRoute(id) {
  const r = routes.find((x) => x.id === id);
  if (!r) return;
  if (!confirm('Delete route \u201C' + r.name + '\u201D?')) return;
  routes = routes.filter((x) => x.id !== id);
  persist();
  renderHome();
}

function exportRoute(r) {
  download((r.name.replace(/\s+/g, '_') || 'route') + '-' + (r.routeDate || 'nodate') + '.json', JSON.stringify(r, null, 2));
}

function exportAll() {
  download('route-notes-all-' + todayISO() + '.json', JSON.stringify(routes, null, 2));
}

/* ============================== Screen: Route editor ============================== */

function openRoute(id) {
  currentRouteId = id;
  renderRoute();
}

function renderRoute() {
  const view = document.getElementById('view');
  view.innerHTML = '';
  const r = currentRoute();
  if (!r) { renderHome(); return; }

  const head = el('div', { class: 'route-head' }, [
    el('button', { class: 'btn ghost small', onclick: renderHome }, ['\u2190 Routes']),
    el('button', { class: 'btn primary small', onclick: () => openPrint(r) }, ['Print / PDF']),
  ]);
  view.appendChild(head);

  view.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'field' }, [
      el('span', { class: 'field-label' }, ['Route Name']),
      el('input', { type: 'text', value: r.name, onchange: (e) => { r.name = e.target.value; persist(); } }),
    ]),
    el('div', { class: 'field' }, [
      el('span', { class: 'field-label' }, ['Delivery Date']),
      el('input', { type: 'date', value: r.routeDate, onchange: (e) => { r.routeDate = e.target.value; persist(); } }),
    ]),
    el('div', { class: 'route-buttons' }, [
      el('button', { class: 'btn ghost small', onclick: () => clearNotes(r) }, ['Clear all notes']),
      el('button', { class: 'btn ghost small', onclick: () => exportRoute(r) }, ['Export JSON']),
    ]),
  ]));

  const progress = el('div', { class: 'progress' });
  view.appendChild(progress);
  updateProgress(r);

  const list = el('div', { class: 'stop-list' });
  r.stops.forEach((stop, idx) => {
    list.appendChild(stopCard(r, stop, idx));
  });
  view.appendChild(list);

  view.appendChild(el('div', { class: 'actions' }, [
    el('button', { class: 'btn primary big', onclick: () => addStop(r) }, ['+ Add Stop']),
  ]));
}

function stopCard(r, stop, idx) {
  const body = [
    el('div', { class: 'stop-head' }, [
      el('span', { class: 'stop-num' }, [String(idx + 1)]),
      el('span', { class: 'stop-name' }, [stop.name || '(new stop)']),
      stop.cod ? el('span', { class: 'cod' }, ['C.O.D.']) : null,
    ]),
    el('div', { class: 'stop-body' }, [
      el('div', { class: 'field' }, [
        el('span', { class: 'field-label' }, ['Stop Name']),
        el('input', { type: 'text', placeholder: 'e.g. OROURKE MOTORS', value: stop.name, oninput: (e) => { stop.name = e.target.value; persist(); updateStopLabel(stop, e.target); } }),
      ]),
      el('div', { class: 'field' }, [
        el('span', { class: 'field-label' }, ['Ride-along Notes (this run)']),
        el('textarea', {
          class: 'notes', rows: 2,
          placeholder: 'Type notes here…',
          value: stop.notes,
          oninput: (e) => { stop.notes = e.target.value; persist(); updateProgress(r); },
        }),
      ]),
      el('div', { class: 'field extra' }, [
        el('span', { class: 'field-label' }, ['Instructions (optional)']),
        el('textarea', { class: 'instr', rows: 1, placeholder: 'Drop-off instructions, contact, etc.', value: stop.instructions, oninput: (e) => { stop.instructions = e.target.value; persist(); } }),
      ]),
      el('label', { class: 'cod-toggle' }, [
        el('input', { type: 'checkbox', checked: stop.cod, onchange: (e) => { stop.cod = e.target.checked; persist(); } }),
        el('span', {}, ['C.O.D. (cash on delivery)']),
      ]),
      el('div', { class: 'stop-controls' }, [
        el('button', { class: 'btn ghost small', disabled: idx === 0, onclick: () => moveStop(r, idx, -1) }, ['\u2191']),
        el('button', { class: 'btn ghost small', disabled: idx === r.stops.length - 1, onclick: () => moveStop(r, idx, 1) }, ['\u2193']),
        el('button', { class: 'btn ghost small danger', onclick: () => deleteStop(r, idx) }, ['Delete stop']),
      ]),
    ]),
  ];
  return el('div', { class: 'card stop-card' }, body);
}

function updateStopLabel(stop, input) {
  const name = input.closest('.stop-card').querySelector('.stop-name');
  if (name) name.textContent = stop.name || '(new stop)';
}

function addStop(r) {
  r.stops.push(makeStop());
  persist();
  renderRoute();
}

function deleteStop(r, idx) {
  r.stops.splice(idx, 1);
  persist();
  renderRoute();
}

function moveStop(r, idx, dir) {
  const j = idx + dir;
  if (j < 0 || j >= r.stops.length) return;
  const [s] = r.stops.splice(idx, 1);
  r.stops.splice(j, 0, s);
  persist();
  renderRoute();
}

function clearNotes(r) {
  if (!confirm('Clear all ride-along notes on this route? (Instructions stay.)')) return;
  for (const s of r.stops) s.notes = '';
  persist();
  renderRoute();
  toast('Notes cleared.');
}

function updateProgress(r) {
  const done = r.stops.filter((s) => s.notes && s.notes.trim()).length;
  const pct = r.stops.length ? Math.round((done / r.stops.length) * 100) : 0;
  const bar = document.querySelector('.progress');
  if (bar) bar.innerHTML = '<div class="progress-fill" style="width:' + pct + '%"></div><span>' + done + '/' + r.stops.length + ' stops noted</span>';
}

/* ============================== Print / PDF ============================== */

function openPrint(r) {
  const w = window.open('', '_blank');
  if (!w) { toast('Popup blocked. Allow popups for this site.'); return; }
  w.document.open();
  w.document.write(printHtml(r));
  w.document.close();
}

function printHtml(r) {
  let rows = '';
  r.stops.forEach((stop, i) => {
    const notes = (stop.notes || '').trim();
    rows += '<tr class="stop-row"><td class="num">' + (i + 1) + '</td>' +
      '<td><div class="sn">' + esc(stop.name) + (stop.cod ? ' <span class="codb">C.O.D.</span>' : '') + '</div>' +
      '<div class="instr">' + (stop.instructions ? esc(stop.instructions) : '&nbsp;') + '</div>' +
      '<div class="notes' + (notes ? ' filled' : '') + '">' + (notes ? esc(notes) : '&nbsp;') + '</div></td></tr>';
  });

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Route Notes - ' + esc(r.name) + '</title>' +
    '<style>' +
    '@page { size: Letter; margin: 12mm 11mm; }' +
    'body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 0; }' +
    '.head { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 8px; }' +
    '.head h1 { font-size: 19px; margin: 0 0 2px; }' +
    '.head p { margin: 0; font-size: 11px; color: #444; }' +
    'table { width: 100%; border-collapse: collapse; }' +
    'tr.stop-row { page-break-inside: avoid; }' +
    'td { vertical-align: top; padding: 7px 9px; border: 1px solid #333; }' +
    'td.num { width: 5%; text-align: center; font-weight: 700; font-size: 13px; }' +
    '.sn { font-weight: 700; font-size: 12.5px; }' +
    '.codb { display: inline-block; background: #fff0f0; border: 1px solid #dc2626; color: #dc2626; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; margin-left: 5px; vertical-align: 1px; }' +
    '.instr { font-size: 11px; color: #444; margin-top: 3px; }' +
    '.notes { margin-top: 6px; min-height: 34px; border-bottom: 1px solid #999; font-size: 12px; line-height: 1.5; }' +
    '.notes.filled { border-bottom: none; }' +
    '.notes:empty, .notes:has(.blank) { }' +
    '.foot { margin-top: 16px; font-size: 9.5px; color: #555; border-top: 1px solid #aaa; padding-top: 5px; }' +
    '.sig { margin-top: 40px; display: flex; gap: 40px; }' +
    '.sig div { flex: 1; border-top: 1px solid #333; padding-top: 3px; font-size: 10px; color: #444; }' +
    '</style></head><body>' +
    '<div class="head"><h1>' + esc(r.name) + ' — Route Notes</h1>' +
    '<p>Delivery Date: <strong>' + esc(r.routeDate || todayISO()) + '</strong> &bull; ' + r.stops.length + ' stops &bull; U.S. AutoForce</p></div>' +
    '<table>' + rows + '</table>' +
    '<div class="sig"><div>DRIVER SIGNATURE</div><div>DATE</div></div>' +
    '<div class="foot">C.O.D. = Cash On Delivery (collect payment / check at stop). Many stops allow unattended drops — follow the location instructions carefully. U.S. AutoForce &bull; Confidential</div>' +
    '</body></html>';
}

/* ============================== Boot ============================== */

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

initStorage().then(() => {
  renderHome();
  registerSW();
});
