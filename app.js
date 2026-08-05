'use strict';

/* ============================== Template: Maq Route ============================== */

const MAQ_ROUTE_TEMPLATE = [
  ['OROURKE MOTORS', false, 'Drop tires off by 2nd overhead door on the northside of building.'],
  ['H AND H AUTO', false, 'Drop tires off by front walk-in door.'],
  ['COUNTY AUTOMOTIVE SERVICES', false, 'Drop tires off by front middle overhead door. Roll up invoices and put into exhaust port on overhead door.'],
  ['HERMSEN AUTOMOTIVE', false, 'Drop tires off by eastside 2nd overhead door.'],
  ['GOODNEWS AUTO LLC', true, 'Drop tires off inside outdoor walking cooler. Check will be in a Pringles can on shelf.'],
  ['JM AUTO SERVICE & REPAIR LLC', false, 'Drop tires off right of key drop off. See invoice notes.'],
  ['STEVE FEUSS AUTO', false, 'Drop tires off by garage walk-in door. Place invoices inside grill.'],
  ['RINIKER AUTO SALES', false, 'Drop tires off by shop doors.'],
  ['ZIPS REPAIR', true, 'Ron gets in around 7:00-7:15am.'],
  ['MERFELD AUTO', true, 'Customer gets in around 7:30. Phone: (563) 556-4740'],
  ['BOUREKS CERTIFIED AUTO SERVICE', false, 'Drop tires off by shop walk-in door when unattended.'],
  ['PEOSTA AUTOMOTIVE', true, 'Doug and Nick get in around 7:00-7:30.'],
  ['WILLIS AUTO BODY, LLC', false, 'If unattended, leave product by shop door.'],
  ['TRISTATE AUTO DIAGNOSTICS', true, 'If before 8:15, check is in outdoor outlet box left of the shop\'s walk-in door.'],
  ['MAIERS AUTO SERVICE', false, 'Drop tires off between overhead doors in front of key drop off.'],
  ['BREITBACH GARAGE LC.', true, 'Al and Amy get in around 7:00am. Drop tires off by shop doors.'],
  ['AVALON SERVICE CENTER INC', false, 'Drop tires off in front of shed/receiving dock. Take invoices to office at the main building.'],
  ['AVALON BODY SHOP', false, 'Drop tires off inside shop walk-in door. Take invoices to office.'],
  ['SPOERL AUTOMOTIVE', false, 'If unattended, leave product by shop walk-in door.'],
  ['BERENDES GARAGE INC.', false, 'If unattended, leave product by shop walk-in door.'],
  ['TILLS GARAGE', false, 'Drive around into the back alley, drop tires off in front of 2nd outdoor shed. Bring invoices to Steve at the front counter.'],
  ['ZEIMETS GARAGE INC', false, 'Drop tires in back shed up the driveway hill. Drop invoices off on front office desk.'],
  ['OLYS GARAGE', true, 'Drop tires off in front of tub by overhead doors. Go in for check.'],
  ['JESSE\'S AUTOMOTIVE & MINI MART', true, 'Drop tires off inside shop.'],
  ['LAURITZEN AUTOMOTIVE', false, 'Drop product inside shop.'],
  ['L AND J AUTO AND STORAGE', false, 'Drop tires inside shop.'],
  ['HERMES AUTO UPHOLSTERY', false, 'Drop tires inside shop.'],
  ['K AND B TIRE - MAQUOKETA', false, 'Drop tires outside of shop office.'],
  ['DOWNEY AUTO REPAIR', true, 'Drop tires inside shop. If Corey isn\'t there, check restroom on side of building facing bar for a check. Otherwise call Corey at (563) 357-4647.'],
  ['B&H TIRE LLC.', false, 'Drop tires off outside of shop.'],
  ['BRAD DEERY MOTORS CHRYSLER', false, 'Drive to receiving door, ring bell. DO NOT LEAVE TIRES UNATTENDED.'],
  ['ROTMAN MOTORS', false, 'Drop tires off inside shop, leave invoices at parts counter.'],
  ['THEISEN SUPPLY 02 MAQUOKETA', false, 'Drop product inside receiving door located behind store.'],
  ['BRAD DEERY FORD', false, 'Drop tires off behind parts counter on tire rack.'],
  ['SMALL TOWN MACHINING', false, 'Drop tires off inside shop. Pam or Ron will have check ready in their office. If no one there, leave unattended, check vehicles for check. See invoice notes for cell phone number if have issues.'],
  ['ED MORSE CBG NORTHEAST', false, 'Drive to receiving door eastside clear overhead door. Drop tires in front of receiving desk, get handheld signed.'],
  ['HARRYS FARM SERVICE DEWITT', false, 'Drop off by back walk-in door. Get checked in and have handheld signed.'],
  ['THEISEN SUPPLY 03 DEWITT', false, 'Drop product inside receiving door facing Dollar General.'],
  ['HARRYS FARM TIRE WHEATLAND', false, 'Drop tires off inside east outdoor shed. Get checked in and have handheld signed.'],
  ['MIDWEST AUTO SALES & SERVICE, LLC', false, 'Drop tires off inside back shop.'],
  ['THRUSTON AUTO', true, 'Call or text Zach (563) 357-6977 when you are on the way.'],
];

const STORE_KEY = 'usaf_route_notes_v1';

/* ============================== State ============================== */

let routes = loadRoutes();
let currentRouteId = null;
let expandedStop = null;

/* ============================== Storage ============================== */

function loadRoutes() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch (e) { return []; }
}

function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(routes)); }
  catch (e) { toast('Storage is full. Export and delete old routes.'); }
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

function maqRoute() {
  return newRoute('Maq Route', MAQ_ROUTE_TEMPLATE.map(([n, c, i]) => makeStop(n, c, i)));
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

  const head = el('div', { class: 'page-head' }, [
    el('h2', { class: 'page-title' }, ['Your Routes (' + routes.length + ')']),
    el('button', { class: 'btn ghost small', onclick: exportAll }, ['Backup JSON']),
  ]);
  view.appendChild(head);

  const actions = el('div', { class: 'route-actions' });
  const form = el('div', { class: 'new-route' });
  const nameInput = el('input', { type: 'text', placeholder: 'Route name (e.g. Tuesday Maq)', id: 'newRouteName' });
  actions.appendChild(el('button', { class: 'btn primary', onclick: () => createRoute(nameInput.value) }, ['+ New Route']));
  actions.appendChild(el('button', { class: 'btn ghost', onclick: addMaqTemplate }, ['+ From Maq Template']));
  form.appendChild(nameInput);
  form.appendChild(actions);
  view.appendChild(form);

  if (!routes.length) {
    view.appendChild(el('div', { class: 'empty' }, [
      'No routes yet. Tap \u201C+ From Maq Template\u201D to load your 41-stop Maq route.',
    ]));
    return;
  }

  const list = el('div', { class: 'rec-list' });
  const sorted = [...routes].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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

function createRoute(name) {
  if (name && routes.some((r) => r.name.toLowerCase() === name.toLowerCase())) { toast('A route with that name already exists.'); return; }
  const r = newRoute(name);
  routes.push(r);
  persist();
  currentRouteId = r.id;
  renderRoute();
}

function addMaqTemplate() {
  if (routes.some((r) => r.name === 'Maq Route')) { toast('Maq Route already loaded.'); return; }
  const r = maqRoute();
  routes.push(r);
  persist();
  currentRouteId = r.id;
  renderRoute();
  toast('Maq Route loaded (' + r.stops.length + ' stops).');
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
  expandedStop = null;
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
  const open = expandedStop === stop;
  const body = [];
  body.push(el('div', {
    class: 'stop-head',
    onclick: () => { expandedStop = open ? null : stop; renderRoute(); },
  }, [
    el('span', { class: 'stop-num' }, [String(idx + 1)]),
    el('span', { class: 'stop-name' }, [stop.name || '(unnamed stop)']),
    stop.cod ? el('span', { class: 'cod' }, ['C.O.D.']) : null,
    el('span', { class: 'chev' }, [open ? '\u25B2' : '\u25BC']),
  ]));

  if (open) {
    const controls = el('div', { class: 'stop-controls' }, [
      el('button', { class: 'btn ghost small', disabled: idx === 0, onclick: () => moveStop(r, idx, -1) }, ['\u2191']),
      el('button', { class: 'btn ghost small', disabled: idx === r.stops.length - 1, onclick: () => moveStop(r, idx, 1) }, ['\u2193']),
      el('button', { class: 'btn ghost small danger', onclick: () => deleteStop(r, idx) }, ['Delete stop']),
    ]);
    body.push(el('div', { class: 'stop-body' }, [
      el('div', { class: 'field' }, [
        el('span', { class: 'field-label' }, ['Stop Name']),
        el('input', { type: 'text', value: stop.name, onchange: (e) => { stop.name = e.target.value; persist(); } }),
      ]),
      el('div', { class: 'field' }, [
        el('span', { class: 'field-label' }, ['Instructions']),
        el('textarea', { class: 'instr', rows: 2, value: stop.instructions, onchange: (e) => { stop.instructions = e.target.value; persist(); } }),
      ]),
      el('label', { class: 'cod-toggle', onclick: (e) => e.stopPropagation() }, [
        el('input', { type: 'checkbox', checked: stop.cod, onchange: (e) => { stop.cod = e.target.checked; persist(); renderRoute(); } }),
        el('span', {}, ['This stop is C.O.D.']),
      ]),
      el('div', { class: 'field' }, [
        el('span', { class: 'field-label' }, ['Ride-along Notes (this run)']),
        el('textarea', {
          class: 'notes', rows: 3,
          placeholder: 'Type notes here…',
          value: stop.notes,
          oninput: (e) => { stop.notes = e.target.value; persist(); updateProgress(r); },
        }),
      ]),
      controls,
    ]));
  }
  return el('div', { class: 'card stop-card' }, body);
}

function addStop(r) {
  r.stops.push(makeStop());
  persist();
  expandedStop = r.stops[r.stops.length - 1];
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

if (!routes.length) {
  routes.push(maqRoute());
  persist();
}

renderHome();
registerSW();
