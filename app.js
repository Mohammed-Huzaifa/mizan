'use strict';
/* Mizan: a personal routine, habit and dhikr tracker. Data lives in this browser (localStorage)
   and, if sync is on, in one private JSON document on Vercel + Upstash. */

const KEY = 'mizan.v1';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, String(v)); } catch (e) {} };

/* ---------- icons ---------- */
const P = {
  today: '<path d="M3 18h18"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M12 5v2.5M5.3 8.6l1.6 1.6M18.7 8.6l-1.6 1.6"/>',
  dhikr: '<circle cx="12" cy="4.8" r="1.7"/><circle cx="17.1" cy="7.1" r="1.7"/><circle cx="18.2" cy="12.4" r="1.7"/><circle cx="6.9" cy="7.1" r="1.7"/><circle cx="5.8" cy="12.4" r="1.7"/><circle cx="8.6" cy="16.6" r="1.7"/><circle cx="15.4" cy="16.6" r="1.7"/><path d="M12 18.4v3.1"/>',
  progress: '<path d="M5 20v-7M12 20V5M19 20v-10"/>',
  you: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>', chevL: '<path d="M15 5l-7 7 7 7"/>', chevD: '<path d="M5 9l7 7 7-7"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  ext: '<path d="M7 17L17 7M9 7h8v8"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18Z"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', ul: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7"/><path d="M4 4v4.7h4.7"/>',
  play: '<path d="M8 5.5v13l10.5-6.5Z"/>', archive: '<path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
};
const icon = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.3 2.2c.5 2.9-.8 4.6-2.3 6.3-1.6 1.8-3.4 3.7-3.4 6.6A5.4 5.4 0 0 0 12 20.6a5.4 5.4 0 0 0 5.4-5.7c-.2-2.4-1.4-4-2.7-5.3.1 1.6-.5 2.8-1.5 3.3.5-4.1-.2-7.9-.9-10.7Z"/></svg>';
// The mark: a mihrab arch with the sun resting on the horizon, which is also the beam of the scale (mizan).
const MARK = (ink = 'currentColor') => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18.5 51.2V31.3C18.5 21.9 24.5 16.4 32 12.8C39.5 16.4 45.5 21.9 45.5 31.3V51.2" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="36.5" r="4.8" fill="#EDA845"/><path d="M24 43.8H40" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></svg>`;

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = dateOf(k); d.setDate(d.getDate() + n); return keyOf(d); };
const dow = k => dateOf(k).getDay();
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtDay = (k, o = {weekday: 'long', day: 'numeric', month: 'short'}) => dateOf(k).toLocaleDateString('en-GB', o);
function clock(d, ampm) {
  if (!d || isNaN(d)) return '–';
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}:${pad(m)}${ampm ? (h < 12 ? ' AM' : ' PM') : ''}`;
}
function dur(ms) {
  const m = Math.max(1, Math.round(ms / 6e4)), h = Math.floor(m / 60);
  return h ? `${h}h ${pad(m % 60)}m` : `${m}m`;
}

/* ---------- state ---------- */
function freshState(o = {}) {
  const t = keyOf(new Date()), now = Date.now();
  return {
    v: 4, name: o.name || '', start: t, foods: [],
    areas: clone(DEFAULT_AREAS).map(a => ({...a, u: now})),
    habits: DEFAULT_HABITS.map(h => ({...h, created: t, u: now})),
    azkar: DEFAULT_AZKAR.map(s => slimSet(s, now)),
    log: {}, tasks: [], quran: {pos: 0, from: t},
    set: {goal: 80, weight: o.weight || 62, theme: 'light', nut: {kcal: 2200, c: 250, f: 65}, view: 'time', hijri: 0, tr: true, en: true,
      prayer: {lat: 12.9716, lng: 77.5946, city: 'Bengaluru', method: 'karachi', asr: 'hanafi', ...(o.prayer || {})}},
    del: {}, updatedAt: now,
  };
}
// Built-in dhikr is stored as a reference (k) so its text stays correct; custom dhikr is stored in full.
function slimSet(s, now) {
  return {id: s.id, name: s.name, hint: s.hint, slot: s.slot, rounds: s.rounds, u: now, items: s.items.map(i => {
    const base = Z[i.k] || {}, it = {id: uid(), k: i.k, n: i.n};
    if (i.why && i.why !== base.why) it.why = i.why;
    if (i.src && i.src !== base.src) it.src = i.src;
    return it;
  })};
}
const zItem = i => ({...(Z[i.k] || {}), ...i});
function migrate(s) {
  s.del = s.del || {}; s.tasks = s.tasks || []; s.log = s.log || {};
  s.set = {goal: 80, weight: 62, theme: 'auto', view: 'time', hijri: 0, tr: true, en: true, ...(s.set || {})};
  delete s.set.dayStart;
  s.set.prayer = {lat: 12.9716, lng: 77.5946, city: 'Bengaluru', method: 'karachi', asr: 'hanafi', ...(s.set.prayer || {})};
  s.quran = s.quran || {pos: 0, from: s.start};
  s.foods = s.foods || [];
  s.set.nut = {kcal: 2200, c: 250, f: 65, ...(s.set.nut || {})};
  if (s.set.theme === 'dark') s.set.theme = 'dim';
  if ((s.v || 1) < 2) {   // v2: food log, in-app surahs, lighter default theme
    const now = Date.now(), patch = {yaseen: {surah: 36}, kahf: {surah: 18}, waqiah: {surah: 56}, mulk: {surah: 67}, water: {food: 'w'}, protein: {food: 'p', step: 5}, fruit: {food: 'fruit'}, veg: {food: 'veg'}, junk: {food: 'junk'}, sugar: {food: 'sugar'}, read: {book: {t: '', total: 0, page: 0, from: ''}}};
    s.habits.forEach(h => { if (!patch[h.id]) return; Object.assign(h, patch[h.id]); if (h.surah) delete h.link; if (h.id === 'protein') delete h.quick; h.u = now; });
    if (!s.habits.some(h => h.id === 'fiber') && !s.del.fiber) {
      const i = s.habits.findIndex(h => h.id === 'protein');
      s.habits.splice(i < 0 ? s.habits.length : i + 1, 0, {...DEFAULT_HABITS.find(h => h.id === 'fiber'), created: keyOf(new Date()), u: now});
    }
    if (s.set.theme === 'auto') s.set.theme = 'light';
    s.v = 2;
  }
  if (s.v < 3) {   // v3: duas for health, debt, rizq, spouse, parents and akhirah
    const now = Date.now();
    if (!s.azkar.some(x => x.id === 'life') && !s.del.life) { const i = s.azkar.findIndex(x => x.id === 'daily'); s.azkar.splice(i < 0 ? s.azkar.length : i, 0, slimSet(DEFAULT_AZKAR.find(x => x.id === 'life'), now)); }
    if (!s.habits.some(h => h.id === 'life-duas') && !s.del['life-duas']) { const i = s.habits.findIndex(h => h.id === 'daily-dhikr'); s.habits.splice(i < 0 ? s.habits.length : i + 1, 0, {...DEFAULT_HABITS.find(h => h.id === 'life-duas'), created: keyOf(new Date()), u: now}); }
    s.v = 3;
  }
  if (s.v < 4) {   // v4: daily dhikr gets Kalima, Salawat and Rabbi inni lima anzalta at 100 each
    const set = s.azkar.find(x => x.id === 'daily');
    if (set) {
      const has = k => set.items.find(i => i.k === k);
      const at = k => set.items.findIndex(i => i.k === k);
      if (!has('kalima')) set.items.splice(Math.max(0, at('waking') + 1), 0, {id: uid(), k: 'kalima', n: 100});
      if (has('istighfar100')) has('istighfar100').n = 100; else set.items.push({id: uid(), k: 'istighfar100', n: 100});
      if (has('salawat')) has('salawat').n = 100; else set.items.push({id: uid(), k: 'salawat', n: 100});
      if (!has('faqir')) set.items.splice(at('salawat') + 1, 0, {id: uid(), k: 'faqir', n: 100});
      set.u = Date.now();
    }
    s.v = 4;
  }
  return s;
}
function load() {
  try { const s = JSON.parse(lsGet(KEY)); if (s && Array.isArray(s.habits) && s.log) return migrate(s); } catch (e) {}
  return null;
}
function writeLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Couldn’t save. Storage is blocked in this browser.'); }
}
function save() { S.updatedAt = Date.now(); writeLocal(); if (sync.key) schedulePush(); }

let S = load();
const ui = {tab: 'today', date: null, area: null, sheets: [], prev: {}, prevScore: null, open: {}, metric: null, cal: null, rd: null, tasbihN: 33, zx: {}};

/* ---------- prayer times ---------- */
const ptCache = new Map();
function ptimes(dk) {
  const p = S ? S.set.prayer : {lat: 12.9716, lng: 77.5946, method: 'karachi', asr: 'hanafi'};
  const ck = `${dk}|${p.lat}|${p.lng}|${p.method}|${p.asr}`;
  if (!ptCache.has(ck)) ptCache.set(ck, Prayer.times(dateOf(dk), p.lat, p.lng, p.method, p.asr));
  return ptCache.get(ck);
}
// The day always starts at midnight.
const todayKey = () => keyOf(new Date());
const PRAYERS = [['fajr', 'Fajr', 'sunrise'], ['dhuhr', 'Dhuhr', 'asr'], ['asr', 'Asr', 'maghrib'], ['maghrib', 'Maghrib', 'isha'], ['isha', 'Isha', 'lastThird']];
function hijri(dk, plusOne) {
  const d = dateOf(dk); d.setDate(d.getDate() + (+S.set.hijri || 0) + (plusOne ? 1 : 0));
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {day: 'numeric', month: 'long', year: 'numeric'}).formatToParts(d);
    const g = t => (parts.find(p => p.type === t) || {}).value || '';
    return `${g('day')} ${g('month')} ${g('year')}`.replace(/ AH$/, '');
  } catch (e) { return ''; }
}

/* ---------- habits, progress, streaks ---------- */
const area = id => S.areas.find(a => a.id === id) || {id, name: 'Other', c: 'clay'};
const habit = id => S.habits.find(h => h.id === id);
const dayLog = dk => S.log[dk] || {};
const raw = (h, dk) => dayLog(dk)[h.id];
// Some habits also take from the food log: protein, fibre and water add up, fruit and veg tick, junk and sugar slip.
function val(h, dk) {
  const v = raw(h, dk);
  if (!h.food) return v;
  const f = foodSum(dk); if (!f.n) return v;
  if (h.type === 'check' || h.type === 'avoid') return v || (f.tags[h.food] ? 1 : v);
  if (h.type === 'count') { const x = Math.max(0, (+v || 0) + foodPart(h, dk)); return x ? Math.round(x * 10) / 10 : undefined; }
  return v;
}
const bits = v => { let n = 0; for (let i = 0; i < 5; i++) if (v & (1 << i)) n++; return n; };
function scheduled(h, dk) {
  if (h.created && dk < h.created) return false;
  if (h.archived && (!h.archivedOn || dk >= h.archivedOn)) return false;
  if (h.days && h.days.length && h.days.length < 7 && !h.days.includes(dow(dk))) return false;
  return true;
}
function prog(h, dk) {
  const v = val(h, dk);
  switch (h.type) {
    case 'check': return v ? 1 : 0;
    case 'count': return clamp((+v || 0) / (h.target || 1), 0, 1);
    case 'limit': return v == null ? 0 : (+v <= h.target ? 1 : 0);
    case 'avoid': return v ? 0 : 1;
    case 'prayer': return bits(+v || 0) / 5;
  }
  return 0;
}
const active = dk => S.habits.filter(h => scheduled(h, dk));
function score(dk, areaId) {
  const hs = active(dk).filter(h => !areaId || h.area === areaId);
  if (!hs.length) return null;
  return hs.reduce((s, h) => s + prog(h, dk), 0) / hs.length;
}
const hit = dk => { const s = score(dk); return s != null && s * 100 >= S.set.goal - 1e-9; };
function dayStreak() {
  const t = todayKey(); let k = hit(t) ? t : addDays(t, -1), n = 0;
  while (k >= S.start && hit(k)) { n++; k = addDays(k, -1); }
  return {n, today: hit(t)};
}
function bestDayStreak() {
  let best = 0, run = 0;
  for (let k = S.start, t = todayKey(); k <= t; k = addDays(k, 1)) { run = hit(k) ? run + 1 : 0; best = Math.max(best, run); }
  return best;
}
function habitStreak(h) {
  const t = todayKey(); let k = t, n = 0, guard = 0;
  if (h.type === 'avoid' && val(h, t)) return 0;
  if (scheduled(h, t) && prog(h, t) < 1) k = addDays(t, -1);
  while (k >= (h.created || S.start) && guard++ < 1500) {
    if (scheduled(h, k)) { if (prog(h, k) < 1) break; n++; }
    k = addDays(k, -1);
  }
  return n;
}
function habitBest(h) {
  let best = 0, run = 0;
  for (let k = h.created || S.start, t = todayKey(); k <= t; k = addDays(k, 1)) {
    if (!scheduled(h, k)) continue;
    if (prog(h, k) >= 1) { run++; best = Math.max(best, run); } else if (k !== t) run = 0;
  }
  return best;
}
function habitRate(h, days = 30) {
  let n = 0, s = 0; const t = todayKey();
  for (let i = 0; i < days; i++) { const k = addDays(t, -i); if (k < (h.created || S.start)) break; if (!scheduled(h, k)) continue; n++; s += prog(h, k); }
  return n ? s / n : null;
}
function quranPos(dk) {
  const q = S.habits.find(h => h.quran);
  let pos = S.quran.pos || 0;
  if (q) for (let k = S.quran.from; k < dk; k = addDays(k, 1)) if (val(q, k)) pos++;
  return pos;
}
const quranLabel = pos => { const i = pos % 60; return {para: Math.floor(i / 2) + 1, half: i % 2, khatam: Math.floor(pos / 60), text: `Para ${Math.floor(i / 2) + 1} · ${i % 2 ? 'second' : 'first'} half`}; };

function fmtVal(h, v) {
  v = +v || 0;
  if (h.unit === 'ml') return `${+(v / 1000).toFixed(2)} L`;
  if (h.unit === 'steps') return v.toLocaleString('en-IN');
  return `${v}${h.unit ? ' ' + h.unit : ''}`;
}
const fmtStep = (h, v) => h.unit === 'ml' ? `${v} ml` : h.unit === 'steps' ? `${v >= 1000 ? +(v / 1000).toFixed(1) + 'k' : v} steps` : fmtVal(h, v);
const fmtTarget = h => h.unit === 'ml' ? `${+(h.target / 1000).toFixed(2)} L` : h.unit === 'steps' ? `${(+h.target).toLocaleString('en-IN')}` : `${h.target} ${h.unit || ''}`.trim();
function compact(h, v) {
  v = +v || 0;
  if (h.unit === 'ml') return +(v / 1000).toFixed(1) + '';
  if (v >= 10000) return Math.round(v / 1000) + 'k';
  if (v >= 1000) return +(v / 1000).toFixed(1) + 'k';
  return String(v);
}
function quickList(h) {
  return String(h.quick || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?):\s*(-?\d+(?:\.\d+)?)$/);
    if (m) return {label: m[1].trim(), v: +m[2]};
    const v = +s; return isNaN(v) ? null : {label: h.type === 'limit' ? fmtVal(h, v) : '+' + fmtStep(h, v), v};
  }).filter(Boolean);
}

/* ---------- writing to the log ---------- */
function setVal(h, dk, v) {
  const before = {p: prog(h, dk), score: score(dk)};
  const l = S.log[dk] = {...(S.log[dk] || {})};
  if (h.food && h.type === 'count' && typeof v === 'number') v = Math.round((v - foodPart(h, dk)) * 10) / 10;
  if (v == null || v === 0 || v === false) delete l[h.id]; else l[h.id] = v;
  l._u = Date.now();
  ui.prev[h.id] = before.p; ui.prevScore = before.score;
  save();
  afterChange(dk, before.score);
}
function afterChange(dk, prevScore) {
  buzz();
  const now = score(dk), goal = S.set.goal / 100;
  if (dk === todayKey() && prevScore != null && prevScore < goal - 1e-9 && now >= goal - 1e-9) setTimeout(celebrate, 380);
}
function zState(dk, setId) { return (dayLog(dk)['z:' + setId]) || {c: {}, r: 0}; }
function setZ(dk, setId, z) {
  const l = S.log[dk] = {...(S.log[dk] || {})};
  l['z:' + setId] = z; l._u = Date.now(); save();
}

/* ---------- haptics ---------- */
let hapticEl = null;
function buzz() {
  try {
    if (navigator.vibrate) { navigator.vibrate(12); return; }
    if (!hapticEl) {   // iOS 18+: toggling a native switch gives a light tap
      hapticEl = document.createElement('label');
      hapticEl.innerHTML = '<input type="checkbox" switch>';
      hapticEl.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden';
      document.body.append(hapticEl);
    }
    hapticEl.click();
  } catch (e) {}
}

/* ---------- small UI helpers ---------- */
function ring(size, sw, p, o0, cls = '') {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(p, 0, 1));
  const anim = o0 != null && Math.abs(o0 - p) > 1e-3;
  return `<svg class="rg ${cls}${anim ? ' anim' : ''}" viewBox="0 0 ${size} ${size}"${anim ? ` style="--o0:${c * (1 - clamp(o0, 0, 1))}"` : ''}><circle class="tr" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"/><circle class="pr" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}" stroke-dasharray="${c}" stroke-dashoffset="${off}"${p <= 0 && !anim ? ' stroke-opacity="0"' : ''}/></svg>`;
}
let toastT;
function toast(msg, undo) {
  $('.toast')?.remove(); clearTimeout(toastT);
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Undo</button>' : ''}`;
  if (undo) t.querySelector('button').onclick = () => { t.remove(); undo(); };
  document.body.append(t);
  toastT = setTimeout(() => t.remove(), undo ? 5000 : 2600);
}

/* ---------- sheets ---------- */
function openSheet(render, {title, cls = ''} = {}) {
  const bd = document.createElement('div'); bd.className = 'backdrop';
  const el = document.createElement('div'); el.className = 'sheet ' + cls; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  const sh = {el, bd, render, title};
  ui.sheets.push(sh);
  el.innerHTML = `<div class="sh-grab"><i></i></div><div class="sh-head"><h2></h2><button class="icon-btn" data-act="close" aria-label="Close">${icon('x', 18)}</button></div><div class="sh-body"></div>`;
  bd.onclick = closeSheet;
  document.body.append(bd, el);
  paintSheet(sh);
  dragToClose(el);
  return sh;
}
function paintSheet(sh = ui.sheets[ui.sheets.length - 1]) {
  if (!sh) return;
  const body = $('.sh-body', sh.el), top = body.scrollTop;
  const out = sh.render();
  $('.sh-head h2', sh.el).textContent = typeof sh.title === 'function' ? sh.title() : (sh.title || '');
  body.innerHTML = out;
  body.scrollTop = top;
}
function closeSheet() {
  const sh = ui.sheets.pop(); if (!sh) return;
  sh.el.classList.add('out'); sh.bd.classList.add('out');
  setTimeout(() => { sh.el.remove(); sh.bd.remove(); }, 240);
  if (sh.onClose) sh.onClose();
  render();
}
function dragToClose(el) {
  const grab = $('.sh-grab', el); let y0 = null, dy = 0;
  grab.addEventListener('pointerdown', e => { y0 = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); el.style.transition = 'none'; });
  grab.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; el.style.transition = 'transform .25s'; el.style.transform = ''; if (dy > 90) closeSheet(); };
  grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
}

/* ---------- celebration ---------- */
function celebrate() {
  const st = dayStreak();
  const wrap = document.createElement('div'); wrap.className = 'celebrate';
  wrap.innerHTML = `<canvas></canvas><div class="cel-card"><div class="big">${FLAME}<span>${st.n}</span></div><h3>Balanced day</h3><p>${st.n > 1 ? `${st.n} days in a row. Keep it steady.` : 'Day one of your streak. Bismillah.'}</p></div>`;
  document.body.append(wrap); buzz();
  const cv = $('canvas', wrap), ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--deen', '--body', '--mind', '--work', '--self', '--sun'].map(v => cs.getPropertyValue(v).trim());
  const ps = Array.from({length: 110}, () => ({x: innerWidth / 2, y: innerHeight / 2 - 20, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 4 + 3, c: cols[Math.floor(Math.random() * cols.length)], s: Math.random() < .5, a: Math.random() * 6, va: (Math.random() - .5) * .3}));
  const t0 = performance.now();
  (function frame(t) {
    const el = t - t0; ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.a += p.va;
      ctx.globalAlpha = clamp(1 - (el - 1400) / 700, 0, 1); ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      if (p.s) ctx.fillRect(-p.r, -p.r / 2.4, p.r * 2, p.r / 1.2); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.4, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (el < 2100) requestAnimationFrame(frame);
  })(t0);
  const close = () => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 300); };
  wrap.querySelector('.cel-card').onclick = close;
  setTimeout(close, 2600);
}

/* ================= TODAY ================= */
const SKIES = {
  night: ['linear-gradient(170deg,#2C3168 0%,#4B4C8C 55%,#7D6AA8 100%)', .8],
  fajr: ['linear-gradient(175deg,#3A4782 0%,#7F76A8 50%,#EBA88C 100%)', .3],
  morning: ['linear-gradient(175deg,#79B4E4 0%,#B6D8F1 55%,#F3E3C9 100%)', 0, 1],
  dhuhr: ['linear-gradient(175deg,#2A78C2 0%,#5C9FDD 55%,#9CC8EE 100%)', 0],
  asr: ['linear-gradient(175deg,#E2A24B 0%,#EFC37E 55%,#F7E3BC 100%)', 0, 1],
  maghrib: ['linear-gradient(175deg,#4A3A7A 0%,#B65A78 55%,#F09265 100%)', .12],
  isha: ['linear-gradient(170deg,#263274 0%,#3A4892 60%,#5C66AE 100%)', .6],
};
function period(T, now) {
  if (now < T.fajr) return {id: 'night', name: 'Isha', slot: 'night'};   // after midnight, until Fajr
  if (now < T.sunrise) return {id: 'fajr', name: 'Fajr', slot: 'morning', pr: 0};
  if (now < T.dhuhr) return {id: 'morning', name: 'Duha', slot: 'morning'};
  if (now < T.asr) return {id: 'dhuhr', name: 'Dhuhr', slot: 'day', pr: 1};
  if (now < T.maghrib) return {id: 'asr', name: 'Asr', slot: 'evening', pr: 2};
  if (now < T.isha) return {id: 'maghrib', name: 'Maghrib', slot: 'evening', pr: 3};
  return {id: 'isha', name: 'Isha', slot: 'sleep', pr: 4};
}
function nextEvent(T, now) {
  const ev = [[T.fajr, 'Fajr'], [T.sunrise, 'Sunrise'], [T.dhuhr, 'Dhuhr'], [T.asr, 'Asr'], [T.maghrib, 'Maghrib'], [T.isha, 'Isha'], [T.lastThird, 'Last third of the night']];
  const n = ev.find(e => e[0] > now);
  return n ? `${n[1]} in ${dur(n[0] - now)} · ${clock(n[0], true)}` : '';
}
function skyArc(T, now, live) {
  const W = 300, cx = 150, rx = 122, hz = 70, up = 58, dn = 20;
  const dayPt = f => [cx - rx * Math.cos(Math.PI * f), hz - up * Math.sin(Math.PI * f)];
  const nightPt = g => [cx + rx * Math.cos(Math.PI * g), hz + dn * Math.sin(Math.PI * g)];
  const dayLen = T.maghrib - T.sunrise, prevSet = T.maghrib - 864e5, nextRise = T.sunrise.getTime() + 864e5;
  const at = t => {
    if (t >= T.sunrise && t <= T.maghrib) return dayPt((t - T.sunrise) / dayLen);
    if (t < T.sunrise) return nightPt((t - prevSet) / (T.sunrise - prevSet));
    return nightPt((t - T.maghrib) / (nextRise - T.maghrib));
  };
  const tick = (t, on) => { const [x, y] = at(t); return `<circle class="tick${on ? ' on' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 3.2 : 2.4}"/>`; };
  const v = dayLog(todayKey()).salah || 0;
  let marker = '';
  if (live) {
    const [x, y] = at(now), isDay = now >= T.sunrise && now <= T.maghrib;
    marker = isDay ? `<circle class="sun" cx="${x}" cy="${y}" r="7.5"/>`
      : `<mask id="mm"><rect x="0" y="-20" width="${W}" height="140" fill="#fff"/><circle cx="${x + 3.4}" cy="${y - 2.6}" r="6" fill="#000"/></mask><circle class="moon" cx="${x}" cy="${y}" r="6.5" mask="url(#mm)"/>`;
  }
  const dayFrac = clamp((now - T.sunrise) / dayLen, 0, 1);
  return `<svg class="sky-arc" viewBox="0 0 ${W} 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <line class="hz" x1="10" y1="${hz}" x2="${W - 10}" y2="${hz}"/>
    <path class="path" d="M${cx - rx} ${hz} A ${rx} ${up} 0 0 1 ${cx + rx} ${hz}"/>
    <path class="path" d="M${cx + rx} ${hz} A ${rx} ${dn} 0 0 1 ${cx - rx} ${hz}" style="stroke-opacity:.2"/>
    ${live && dayFrac > 0 ? (() => { const [x, y] = dayPt(dayFrac); return `<path d="M${cx - rx} ${hz} A ${rx} ${up} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>`; })() : ''}
    ${PRAYERS.map(([k], i) => tick(T[k], v & (1 << i))).join('')}
    <text x="${cx - rx}" y="${hz + 16}" text-anchor="middle">${clock(T.sunrise)}</text>
    <text x="${cx + rx}" y="${hz + 16}" text-anchor="middle">${clock(T.maghrib)}</text>
    ${marker}
  </svg>`;
}
function renderSky(dk) {
  const sal = S.habits.find(h => h.type === 'prayer' && scheduled(h, dk));
  const T = ptimes(dk), now = new Date(), live = dk === todayKey();
  const v = sal ? (+val(sal, dk) || 0) : 0;
  const per = live ? period(T, now) : null;
  const btns = PRAYERS.map(([k, name, end], i) => {
    const started = !live || now >= T[k], ended = !live || now >= T[end];
    const cls = [(v & (1 << i)) && 'done', live && per && per.pr === i && 'now', !started && 'wait', started && ended && 'late'].filter(Boolean).join(' ');
    return `<button class="pr-btn ${cls}" data-act="prayer" data-i="${i}" aria-pressed="${!!(v & (1 << i))}" aria-label="${name} ${clock(T[k], true)}"><span class="pc">${icon('check', 13)}</span><span class="pn">${name}</span><span class="pt">${clock(T[k])}</span></button>`;
  }).join('');
  if (!sal) return '';
  if (!live) return `<section class="sky sky-plain card"><div class="card-h"><h2>Salah</h2><span class="sub">${bits(v)} of 5 · ${esc(hijri(dk))}</span></div><div class="prayers">${btns}</div></section>`;
  const sky = SKIES[per.id];
  const hij = now >= T.maghrib ? hijri(dk, true) : hijri(dk);
  return `<section class="sky${sky[2] ? ' light' : ''}" style="--sky:${sky[0]};--stars:${sky[1]}">
    <div class="stars"></div>
    <div class="sky-head"><div><div class="sky-now">${per.name}</div><div class="sky-next">${nextEvent(T, now)}</div></div>
    <div class="sky-hijri">${esc(hij)}<br><span style="opacity:.8">${esc(S.set.prayer.city || '')}</span></div></div>
    ${skyArc(T, now, true)}
    <div class="prayers">${btns}</div>
  </section>`;
}
function renderWeek(sel) {
  const t = todayKey(); let html = '';
  for (let i = 6; i >= 0; i--) {
    const k = addDays(t, -i), s = k >= S.start ? score(k) : null;
    html += `<button class="wd${k === sel ? ' sel' : ''}${s == null ? ' future' : ''}${s != null && hit(k) ? ' hit' : ''}" data-act="day" data-k="${k}" aria-label="${fmtDay(k)}">
      <span class="dn">${k === t ? 'Today' : DOW[dow(k)]}</span>
      <span class="ring c-deen">${ring(34, 3.5, s || 0)}<span>${dateOf(k).getDate()}</span></span></button>`;
  }
  return `<div class="week">${html}</div>`;
}
function renderBalance(dk) {
  const s = score(dk) || 0, goal = S.set.goal;
  const areas = S.areas.map(a => ({a, s: score(dk, a.id)})).filter(x => x.s != null);
  const hs = active(dk), sum = hs.reduce((x, h) => x + prog(h, dk), 0);
  const need = Math.max(0, Math.ceil(goal / 100 * hs.length - sum - 1e-9));
  const isHit = hit(dk);
  return `<section class="card">
    <div class="balance">
      <div class="bal-ring c-deen">${ring(112, 10, s, ui.prevScore)}<div class="val"><b class="num">${Math.round(s * 100)}<small>%</small></b><span>Balance</span></div></div>
      <div class="areas">${areas.map(({a, s}) => `<button class="ab c-${a.c}${ui.area === a.id ? ' sel' : ''}" data-act="area" data-id="${a.id}"><span class="name">${esc(a.name)}</span><span class="bar"><i style="--w:${Math.round(s * 100)}%"></i></span><span class="pct">${Math.round(s * 100)}</span></button>`).join('')}</div>
    </div>
    <div class="goal-line">${isHit ? `<span><b>Balanced day.</b> Your streak is safe.</span>` : `<span><b>${need} more</b> to reach ${goal}% today</span>`}<span>${hs.length} habits</span></div>
  </section>`;
}
function metaFor(h, dk, box) {
  const v = val(h, dk), bits_ = [];
  if (h.type === 'count' && !box) bits_.push(`<span class="tag">${fmtVal(h, v)}</span> of ${fmtTarget(h)}`);
  if (h.type === 'limit' && !box) bits_.push(v == null ? `Max ${fmtTarget(h)} · log tonight` : `<span class="tag">${fmtVal(h, v)}</span> of ${fmtTarget(h)} max`);
  if (h.food && (h.type === 'check' || h.type === 'avoid') && !raw(h, dk) && foodSum(dk).tags[h.food]) bits_.push(`<span class="tag">${esc(foodSum(dk).tags[h.food].slice(0, 2).join(', '))}</span>`);
  if (h.book && h.book.t) { const pg = bookPage(h, dk); bits_.push(`${esc(h.book.t)}${pg != null ? ` · p. ${pg}${h.book.total ? ` of ${h.book.total}` : ''}` : ''}`); }
  if (h.type === 'avoid') { const st = habitStreak(h); bits_.push(v ? '<span class="tag">Slipped today</span>' : `Clean${st ? ` · ${st} day${st > 1 ? 's' : ''}` : ''}`); }
  if (h.quran) bits_.push(quranLabel(quranPos(dk)).text);
  if (h.azkar) {
    const set = S.azkar.find(s => s.id === h.azkar);
    if (set) {
      const z = zState(dk, set.id), done = set.items.filter(i => (z.c[i.id] || 0) >= i.n).length;
      if (h.type === 'check' && !v) bits_.push(set.rounds ? `${z.r || 0} of ${set.rounds} rounds` : `${done} of ${set.items.length} done`);
    }
  }
  if (h.type === 'avoid' && h.food && !v) {} else if (h.note && bits_.length < 2 && !(h.book && h.book.t)) bits_.push(esc(h.note));
  if (h.days && h.days.length && h.days.length < 7) bits_.push(h.days.map(d => DOW[d]).join(', '));
  return bits_.join('<span class="dot"></span>');
}
function renderRow(h, dk) {
  const p = prog(h, dk), v = val(h, dk), a = area(h.area), ok = p >= 1, just = h.id in ui.prev;
  const o0 = just ? ui.prev[h.id] : null;
  let ctrl, act = '';
  if (h.type === 'check') ctrl = `<span class="fill"></span><svg class="mk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>${ok ? '' : ring(40, 2.5, 0)}`;
  else if (h.type === 'avoid') ctrl = v ? `<svg class="mk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>` : `<span class="fill"></span><svg class="mk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>`;
  else ctrl = `${ring(40, 3, p, o0)}<span class="fill"></span><svg class="mk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg><span class="lbl">${h.type === 'limit' && v == null ? '–' : compact(h, v)}</span>`;
  if (h.type === 'limit' && v != null && +v > h.target) ctrl = `${ring(40, 3, 1)}<span class="lbl" style="color:var(--bad)">${compact(h, v)}</span>`;
  const set = h.azkar ? S.azkar.find(s => s.id === h.azkar) : null, box = (h.type === 'count' || h.type === 'limit') && !h.azkar;
  if (set && !ok) act = `<button class="act" data-act="read" data-id="${h.azkar}">Count</button>`;
  else if (h.surah && !ok) act = `<button class="act" data-act="surah" data-n="${h.surah}" data-id="${h.id}">Read</button>`;
  else if (h.quran && !ok) act = `<button class="act" data-act="hizb" data-id="${h.id}">Read</button>`;
  else if (h.link && !ok) act = `<button class="act" data-act="link" data-url="${esc(h.link)}">Open</button>`;
  else if (h.food && h.type === 'count' && h.food !== 'w' && !ok) act = `<button class="act" data-act="food-focus">Log food</button>`;
  else if (h.type === 'count' && !ok) act = `<button class="act" data-act="inc" data-id="${h.id}">+${esc(fmtStep(h, h.step || 1))}</button>`;
  const st = habitStreak(h);
  const cls = ['row', `c-${a.c}`, ok && 'ok', just && 'just', h.type === 'avoid' && v && 'slipped', set && 'zrow'].filter(Boolean).join(' ');
  const zopen = set && zOpen(set, dk);
  return `<div class="${cls}" data-hid="${h.id}">
    <button class="ck${h.type === 'avoid' ? (v ? ' slip' : ' avoid') : ''}" data-act="tick" data-id="${h.id}" aria-label="${esc(h.name)}">${ctrl}</button>
    <div class="mid"><button class="tap" data-act="${set ? 'zx' : 'detail'}" data-id="${set ? set.id : h.id}"${set ? ` aria-expanded="${zopen}"` : ''}><span class="nm">${esc(h.name)}${set ? icon('chevD', 16).replace('<svg', '<svg class="zchev"') : ''}</span><span class="mt">${metaFor(h, dk, box)}</span></button>
    ${box ? amtBox(h, v) : ''}</div>
    ${act || `<span class="sk${st >= 3 ? ' hot' : ''}">${st ? FLAME + st : ''}</span>`}
  </div>${zopen ? zList(set, dk) : ''}`;
}
// The amount box: type what you did, e.g. 3000 steps, 1.5 L water, 1h 20m scrolling.
function amtStr(h, v) {
  if (v == null || v === '') return '';
  if (h.unit === 'ml') return String(+(v / 1000).toFixed(2));
  return String(+(+v).toFixed(1));
}
const tgtLabel = h => h.unit === 'steps' ? `${fmtTarget(h)} steps` : fmtTarget(h);
function amtBox(h, v) {
  return `<label class="amt"><input data-amt="${h.id}" inputmode="decimal" enterkeyhint="done" autocomplete="off" value="${esc(amtStr(h, v))}" placeholder="0" aria-label="${esc(h.name)}, amount done"><span>${h.unit === 'ml' ? 'L ' : ''}of ${esc(tgtLabel(h))}${h.type === 'limit' ? ' max' : ''}</span></label>`;
}
function parseAmt(h, str) {
  const s = String(str).trim().toLowerCase().replace(/,/g, '');
  if (!s) return 0;
  const hm = s.match(/^(\d+)\s*h(?:r|rs|ours?)?\s*(\d+)\s*m?(?:in|ins)?$/) || s.match(/^(\d+):(\d{2})$/);
  if (hm && h.unit === 'min') return +hm[1] * 60 + +hm[2];
  const m = s.match(/^(\d*\.?\d+)\s*([a-z]*)$/); if (!m) return null;
  let x = +m[1]; const u = m[2];
  if (u === 'k') x *= 1000;
  if (h.unit === 'ml') { if (u !== 'ml' && (u.startsWith('l') || (!u && x <= 20))) x *= 1000; }
  if (h.unit === 'min' && u.startsWith('h')) x *= 60;
  return Math.round(x * 100) / 100;
}
function bookPage(h, dk) {
  const b = h.book; if (!b || !b.from) return null;
  let p = +b.page || 0;
  for (let k = b.from; k <= dk; k = addDays(k, 1)) p += +val(h, k) || 0;
  return b.total ? Math.min(p, b.total) : p;
}
function slotWindow(id, T, now) {
  const w = {night: [T.lastThirdPrev, T.fajr], morning: [T.fajr, T.dhuhr], evening: [T.asr, T.isha], sleep: [T.isha, T.lastThird]}[id];
  return w && now >= w[0] && now < w[1];
}
function slotHint(id, T) {
  return {night: `From ${clock(T.lastThirdPrev, true)}`, morning: `Fajr ${clock(T.fajr, true)}`, day: 'Whenever it fits', evening: `Asr ${clock(T.asr, true)} · Maghrib ${clock(T.maghrib, true)}`, sleep: `Isha ${clock(T.isha, true)}`}[id];
}
function renderList(dk) {
  const live = dk === todayKey(), T = ptimes(dk), now = new Date();
  let hs = active(dk).filter(h => h.type !== 'prayer');
  if (ui.area) hs = hs.filter(h => h.area === ui.area);
  const byTime = S.set.view !== 'area';
  const groups = byTime
    ? SLOTS.map(s => ({id: s.id, name: s.name, hint: slotHint(s.id, T), hs: hs.filter(h => (h.slot || 'day') === s.id), now: live && slotWindow(s.id, T, now)}))
    : S.areas.map(a => ({id: 'a-' + a.id, name: a.name, hint: '', hs: hs.filter(h => h.area === a.id), c: a.c}));
  const known = new Set(groups.flatMap(g => g.hs.map(h => h.id)));
  const rest = hs.filter(h => !known.has(h.id));
  if (rest.length) groups.push({id: 'other', name: 'Other', hint: '', hs: rest});
  const head = `<div class="list-h"><h2>${ui.area ? esc(area(ui.area).name) : 'Routine'}</h2><div class="seg-switch" role="group" aria-label="Group by">
    <button data-act="view" data-v="time" aria-pressed="${byTime}">By time</button><button data-act="view" data-v="area" aria-pressed="${!byTime}">By area</button></div></div>
    ${ui.area ? `<button class="chip" data-act="area" data-id="${ui.area}" style="margin:-2px 0 12px">Showing ${esc(area(ui.area).name)} only ${icon('x', 14)}</button>` : ''}`;
  return head + groups.filter(g => g.hs.length).map(g => {
    const done = g.hs.filter(h => prog(h, dk) >= 1).length, all = done === g.hs.length;
    const closed = g.id in ui.open ? !ui.open[g.id] : (all && !g.now && live);
    return `<section class="slot${g.now ? ' now' : ''}${all ? ' alldone' : ''}${closed ? ' closed' : ''}">
      <button class="slot-h" data-act="slot" data-id="${g.id}" aria-expanded="${!closed}"><span><span class="st">${esc(g.name)}</span>${g.hint ? `<br><span class="sh">${esc(g.hint)}</span>` : ''}</span>
      <span class="sc">${all ? icon('check', 15) : ''}${done}/${g.hs.length}${icon('chevD', 16).replace('<svg', '<svg class="chev"')}</span></button>
      <div class="rows">${g.hs.map(h => renderRow(h, dk)).join('')}</div>
    </section>`;
  }).join('');
}
function tasksFor(dk) {
  const live = dk === todayKey();
  return S.tasks.filter(t => live ? (!t.done && t.d <= dk) || t.done === dk : t.done === dk || (t.d === dk && !t.done))
    .sort((a, b) => (!!a.done - !!b.done) || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || (a.u - b.u));
}
function renderTasks(dk) {
  const ts = tasksFor(dk), open = ts.filter(t => !t.done).length;
  return `<section class="card">
    <div class="card-h"><h2>Tasks</h2><span class="sub">${ts.length ? `${ts.length - open} of ${ts.length} done` : 'One-off things for today'}</span></div>
    <form class="task-add" data-form="task"><input name="t" placeholder="Add a task…" enterkeyhint="done" autocomplete="off" maxlength="140"><button type="submit" aria-label="Add task">${icon('plus', 18)}</button></form>
    <div class="tasks-list">${ts.map(t => `<div class="task${t.done ? ' done' : ''}">
      <button class="tb" data-act="task" data-id="${t.id}" aria-label="Mark ${esc(t.t)} ${t.done ? 'not done' : 'done'}">${icon('check', 14)}</button>
      <span class="tt">${esc(t.t)}${!t.done && t.d < dk ? `<span class="tf">From ${fmtDay(t.d, {weekday: 'short', day: 'numeric', month: 'short'})}</span>` : ''}</span>
      <button class="tx" data-act="task-del" data-id="${t.id}" aria-label="Delete task">${icon('x', 15)}</button></div>`).join('')}</div>
  </section>`;
}
function renderToday() {
  const t = todayKey(), dk = ui.date || t, live = dk === t, st = dayStreak();
  const greet = (() => { const h = new Date().getHours(); return h < 4 ? 'Peaceful night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const quote = HADITH[(dateOf(dk).getTime() / 864e5 | 0) % HADITH.length];
  $('#v-today').innerHTML = `
    <header class="top">
      <div><div class="eyebrow">${live ? `${fmtDay(dk)}` : `<b>${fmtDay(dk)}</b> · <button class="link-btn" data-act="day" data-k="${t}" style="padding:0;color:var(--ink)">Back to today</button>`}</div>
      <h1>${live ? `${greet}${S.name ? ', ' + esc(S.name.split(' ')[0]) : ''}` : 'Looking back'}</h1></div>
      <div class="top-actions"><span class="streak-pill${st.n ? '' : ' cold'}" title="Day streak">${FLAME}<span class="num">${st.n}</span></span>
      <button class="icon-btn" data-act="new-habit" aria-label="Add habit">${icon('plus', 20)}</button></div>
    </header>
    ${renderWeek(dk)}
    <div class="today-grid">
      <div class="col-a">${renderSky(dk)}${renderBalance(dk)}${renderFood(dk)}<div class="hide-m">${renderTasks(dk)}</div></div>
      <div class="col-b">${renderList(dk)}<div class="hide-d">${renderTasks(dk)}</div>
      <div class="quote"><q>${esc(quote[0])}</q><small>${esc(quote[1])}</small></div></div>
    </div>`;
  ui.prev = {}; ui.prevScore = null;
}

/* ================= DHIKR ================= */
function setProgress(set, dk) {
  const z = zState(dk, set.id), done = set.items.filter(i => (z.c[i.id] || 0) >= i.n).length;
  return {z, done, total: set.items.length, p: set.rounds ? clamp((z.r || 0) / set.rounds, 0, 1) : done / (set.items.length || 1), complete: set.rounds ? (z.r || 0) >= set.rounds : done === set.items.length && done > 0};
}
function renderDhikr() {
  const dk = todayKey(), tas = +dayLog(dk)['z:tasbih'] || 0, n = ui.tasbihN;
  const cur = n ? tas % n : tas, rounds = n ? Math.floor(tas / n) : 0;
  $('#v-dhikr').innerHTML = `
    <header class="top"><div><div class="eyebrow">${esc(hijri(dk, new Date() >= ptimes(dk).maghrib))}</div><h1>Dhikr</h1></div>
    <button class="icon-btn" data-act="new-set" aria-label="New dhikr set">${icon('plus', 20)}</button></header>
    <p class="lede-s">Tick each dhikr once you’ve said it, or tap <b>Count</b> to count along with the beads.</p>
    <div class="zsets">${S.azkar.map(set => {
      const pr = setProgress(set, dk), open = zOpen(set, dk, true);
      return `<section class="zcard${pr.complete ? ' done' : ''}${open ? ' open' : ''}"><div class="zset">
        <button class="zhead" data-act="zx" data-id="${set.id}" aria-expanded="${open}">
        <span class="zr">${ring(52, 4, pr.p)}<span class="ic">${pr.complete ? icon('check', 22) : set.slot === 'sleep' || set.slot === 'evening' ? icon('moon', 22) : set.slot === 'morning' ? icon('sun', 22) : icon('dhikr', 22)}</span></span>
        <span class="zt"><b>${esc(set.name)}</b><span>${esc(set.hint || '')} · ${set.rounds ? `${pr.z.r || 0} of ${set.rounds} rounds` : `${pr.done} of ${pr.total}`}</span></span>
        ${icon('chevD', 18).replace('<svg', '<svg class="zchev"')}</button>
        <button class="act" data-act="read" data-id="${set.id}">Count</button></div>
        ${open ? zList(set, dk) : ''}</section>`;
    }).join('')}</div>
    <section class="card tasbih" style="margin-top:14px">
      <div class="card-h" style="width:100%;margin:0"><h2>Tasbih</h2><span class="sub">${tas} today${rounds ? ` · ${rounds} round${rounds > 1 ? 's' : ''}` : ''}</span></div>
      <button class="tasbih-btn" data-act="tasbih" aria-label="Count">${ring(188, 7, n ? cur / n : 0)}<span class="in"><b>${cur}</b><span>${n ? `of ${n}` : 'free count'}</span></span></button>
      <div class="chips">${[33, 99, 100, 0].map(x => `<button class="chip" data-act="tasbih-n" data-n="${x}" aria-pressed="${n === x}">${x || '∞'}</button>`).join('')}<button class="chip" data-act="tasbih-reset">${icon('reset', 14)} Reset</button></div>
    </section>`;
}
function openReader(setId, at) {
  const set = S.azkar.find(s => s.id === setId); if (!set) return;
  const dk = todayKey(), z = zState(dk, set.id);
  let idx = at != null ? at : set.items.findIndex(i => (z.c[i.id] || 0) < i.n);
  ui.rd = {setId, idx: idx < 0 ? 0 : idx, done: idx < 0 && set.items.length > 0 && !set.rounds};
  const el = document.createElement('div'); el.className = 'reader'; el.id = 'reader'; el.setAttribute('role', 'dialog');
  document.body.append(el); document.body.style.overflow = 'hidden';
  paintReader();
}
function closeReader() { $('#reader')?.remove(); document.body.style.overflow = ''; ui.rd = null; render(); }
function paintReader() {
  const el = $('#reader'); if (!el || !ui.rd) return;
  const set = S.azkar.find(s => s.id === ui.rd.setId), dk = todayKey(), z = zState(dk, set.id);
  if (!set.items.length) ui.rd.done = false;
  const it = set.items[ui.rd.idx] ? zItem(set.items[ui.rd.idx]) : null, c = it ? (z.c[it.id] || 0) : 0;
  const prog = set.items.map((i, j) => `<i class="${j === ui.rd.idx && !ui.rd.done ? 'cur' : (z.c[i.id] || 0) >= i.n ? 'on' : ''}"></i>`).join('');
  const body = ui.rd.done ? `<div class="rd-done"><div class="big">${icon('check', 44)}</div><h2>${set.rounds ? `Round ${z.r} of ${set.rounds}` : esc(set.name)} complete</h2>
      <p>${set.rounds && z.r < set.rounds ? 'See you after the next salah.' : 'May Allah accept it from you.'}</p>
      <div class="btn-row" style="max-width:360px;margin:0 auto"><button class="btn ghost" data-act="rd-again">${set.rounds ? 'Start again' : 'Read again'}</button><button class="btn" data-act="rd-close">Done</button></div></div>`
    : !it ? `<div class="rd-done"><p>This set is empty. Tap Edit to add dhikr.</p></div>`
    : `<div class="rd-title">${esc(it.t || '')}${it.n > 1 ? ` · ${it.n}×` : ''}${it.f ? `<span class="zi-for" style="margin-left:8px">${esc(it.f)}</span>` : ''}</div>
      ${it.ar ? `<p class="ar${it.ar.length < 60 ? ' lg' : ''}" lang="ar" dir="rtl">${esc(arText(it))}</p>` : ''}
      ${S.set.tr && it.tr ? `<p class="tr">${esc(it.tr)}</p>` : ''}
      ${S.set.en && it.en ? `<p class="en">${esc(it.en)}</p>` : ''}
      ${it.why ? `<p class="why"><b>Why we read it</b>${esc(it.why)}</p>` : ''}
      ${it.surah ? `<p><button class="chip" data-act="surah" data-n="${it.surah}">${icon('book', 14)} Read the full surah</button></p>` : it.link ? `<p><button class="chip" data-act="link" data-url="${esc(it.link)}">${icon('book', 14)} Open full surah</button></p>` : ''}
      <div class="src">${esc(it.src || '')}</div>`;
  el.innerHTML = `
    <div class="rd-top"><button class="icon-btn" data-act="rd-close" aria-label="Close">${icon('x', 18)}</button>
      <div class="tt"><b>${esc(set.name)}</b><span>${set.rounds ? `Round ${Math.min((z.r || 0) + 1, set.rounds)} of ${set.rounds} · ` : ''}${ui.rd.done ? 'Complete' : it ? `${ui.rd.idx + 1} of ${set.items.length}` : ''}</span></div>
      <button class="link-btn" data-act="z-edit" data-id="${set.id}" style="color:var(--ink)">Edit</button></div>
    <div class="rd-prog">${prog}</div>
    <div class="rd-body">${body}</div>
    ${ui.rd.done || !it ? '' : `<div class="rd-bot">
      <button class="rd-nav" data-act="rd-prev" aria-label="Previous" ${ui.rd.idx === 0 ? 'disabled' : ''}>${icon('chevL', 22)}</button>
      <div style="display:grid;justify-items:center;gap:8px">
        <button class="rd-count${c >= it.n ? ' full' : ''}" data-act="rd-tap" aria-label="Count">${ring(112, 5, c / it.n)}<span class="in"><b>${c}</b><span>of ${it.n}</span></span></button>
        <div style="display:flex;gap:14px"><button class="link-btn" data-act="rd-reset">Reset</button>${it.n > 1 ? `<button class="link-btn" data-act="rd-fill">Count all</button>` : ''}</div>
      </div>
      <button class="rd-nav" data-act="rd-next" aria-label="Next">${icon('chevR', 22)}</button></div>`}`;
}
function readerCount(fill) {
  const set = S.azkar.find(s => s.id === ui.rd.setId), dk = todayKey(), it = set.items[ui.rd.idx]; if (!it) return;
  const z = clone(zState(dk, set.id)); z.c = z.c || {};
  const c = z.c[it.id] || 0;
  if (c >= it.n) { if (ui.rd.idx < set.items.length - 1) { ui.rd.idx++; paintReader(); } return; }
  z.c[it.id] = fill ? it.n : c + 1;
  buzz();
  const nowDone = z.c[it.id] >= it.n;
  const allDone = set.items.every(i => (z.c[i.id] || 0) >= i.n);
  if (nowDone && allDone) {
    if (set.rounds) { z.r = (z.r || 0) + 1; z.c = {}; }
    setZ(dk, set.id, z);
    linkAzkarHabit(set, dk, z);
    ui.rd.done = true; paintReader(); return;
  }
  setZ(dk, set.id, z); paintReader();
  if (nowDone) setTimeout(() => { if (!ui.rd) return; const nxt = set.items.findIndex((i, j) => j > ui.rd.idx && (zState(dk, set.id).c[i.id] || 0) < i.n); const any = nxt < 0 ? set.items.findIndex(i => (zState(dk, set.id).c[i.id] || 0) < i.n) : nxt; if (any >= 0) { ui.rd.idx = any; paintReader(); } }, 420);
}
function linkAzkarHabit(set, dk, z) {
  const h = S.habits.find(x => x.azkar === set.id && scheduled(x, dk)); if (!h) return;
  if (h.type === 'check' && !val(h, dk)) setVal(h, dk, 1);
  else if (h.type === 'count' && set.rounds) setVal(h, dk, z.r || 0);
}

/* ================= PROGRESS ================= */
function renderProgress() {
  const t = todayKey(), st = dayStreak(), best = Math.max(bestDayStreak(), st.n);
  let wk = 0, wn = 0; for (let i = 0; i < 7; i++) { const s = score(addDays(t, -i)); if (s != null && addDays(t, -i) >= S.start) { wk += s; wn++; } }
  // heatmap: 20 weeks, columns are weeks starting Sunday
  const weeks = 20, end = addDays(t, 6 - dow(t)), first = addDays(end, -(weeks * 7 - 1));
  let heat = '';
  for (let k = first; k <= end; k = addDays(k, 1)) {
    const s = k >= S.start && k <= t ? score(k) : null;
    const l = s == null ? (k < S.start ? 'pre' : '') : s >= .95 ? 'l4' : s >= .75 ? 'l3' : s >= .5 ? 'l2' : s > 0 ? 'l1' : '';
    heat += `<i class="${l}${k === t ? ' today' : ''}" title="${fmtDay(k)}${s != null ? ` · ${Math.round(s * 100)}%` : ''}"></i>`;
  }
  // prayers, last 30 days
  const sal = S.habits.find(h => h.type === 'prayer');
  let prayHtml = '';
  if (sal) {
    const per = [0, 0, 0, 0, 0]; let days = 0;
    for (let i = 0; i < 30; i++) { const k = addDays(t, -i); if (k < (sal.created || S.start)) break; days++; const v = +val(sal, k) || 0; for (let j = 0; j < 5; j++) if (v & (1 << j)) per[j]++; }
    const total = per.reduce((a, b) => a + b, 0);
    prayHtml = `<section class="card"><div class="card-h"><h2>Salah</h2><span class="sub">${total} of ${days * 5} · last ${days} day${days === 1 ? '' : 's'}</span></div>
      <div class="pbars c-deen">${PRAYERS.map(([, name], j) => `<div class="pbar"><span>${name}</span><span class="bar"><i style="width:${days ? per[j] / days * 100 : 0}%"></i></span><span class="v">${per[j]}/${days}</span></div>`).join('')}</div></section>`;
  }
  // areas, this week vs last week
  const avg = (aid, from, n) => { let s = 0, c = 0; for (let i = 0; i < n; i++) { const k = addDays(from, -i); if (k < S.start) break; const x = score(k, aid); if (x != null) { s += x; c++; } } return c ? s / c : null; };
  const areaHtml = S.areas.map(a => {
    const now = avg(a.id, t, 7); if (now == null) return '';
    const prev = avg(a.id, addDays(t, -7), 7), d = prev == null ? null : Math.round((now - prev) * 100);
    return `<div class="pbar c-${a.c}"><span>${esc(a.name)}</span><span class="bar"><i style="width:${now * 100}%"></i></span><span class="v">${Math.round(now * 100)}%${d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</em>` : ''}</span></div>`;
  }).join('');
  // metrics chart
  const metrics = S.habits.filter(h => (h.type === 'count' || h.type === 'limit') && !h.archived && !h.azkar);
  if (!metrics.find(h => h.id === ui.metric)) ui.metric = metrics[0]?.id;
  const m = habit(ui.metric);
  let chart = '';
  if (m) {
    const n = 14, W = 320, H = 110, bw = W / n, mx = Math.max(m.target * 1.15, ...Array.from({length: n}, (_, i) => +val(m, addDays(t, -i)) || 0));
    const ty = H - m.target / mx * H;
    chart = `<svg class="chart c-${area(m.area).c}" viewBox="0 0 ${W} ${H + 16}">${Array.from({length: n}, (_, i) => {
      const k = addDays(t, -(n - 1 - i)), v = +val(m, k) || 0, h = v / mx * H, good = prog(m, k) >= 1;
      return `<rect class="b${good ? '' : ' miss'}" x="${i * bw + 3}" y="${H - h}" width="${bw - 6}" height="${Math.max(h, v ? 2 : 0)}" rx="3"><title>${fmtDay(k)} · ${fmtVal(m, v)}</title></rect><text x="${i * bw + bw / 2}" y="${H + 13}" text-anchor="middle">${i % 2 === (n - 1) % 2 ? dateOf(k).getDate() : ''}</text>`;
    }).join('')}<line class="tg" x1="0" x2="${W}" y1="${ty}" y2="${ty}"/></svg>`;
  }
  // quran
  const q = S.habits.find(h => h.quran && !h.archived);
  let qHtml = '';
  if (q) {
    const pos = quranPos(addDays(t, 1)), L = quranLabel(pos), left = 60 - (pos % 60), rate = habitRate(q, 30) || 1;
    qHtml = `<section class="card"><div class="card-h"><h2>Quran khatam</h2><span class="sub">${L.khatam ? `${L.khatam} complete · ` : ''}Next: ${L.text}</span></div>
      <div class="khatam"><span class="kv">${Math.floor((pos % 60) / 2)}<small style="font-size:15px;color:var(--ink2)">/30 paras</small></span><span class="sub" style="font-size:13px;color:var(--ink2);margin-left:auto">About ${Math.ceil(left / Math.max(rate, .1))} days to go</span></div>
      <div class="track"><i style="width:${(pos % 60) / 60 * 100}%"></i></div></section>`;
  }
  // habits
  const habitsHtml = S.areas.map(a => {
    const hs = S.habits.filter(h => h.area === a.id && !h.archived && h.type !== 'prayer'); if (!hs.length) return '';
    return `<div class="group-t" style="margin-top:14px">${esc(a.name)}</div>` + hs.map(h => {
      const dots = Array.from({length: 14}, (_, i) => { const k = addDays(t, -(13 - i)); if (k < (h.created || S.start) || !scheduled(h, k)) return '<i class="na"></i>'; const p = prog(h, k); return `<i class="${p >= 1 ? 'on' : p > 0 ? 'half' : ''}"></i>`; }).join('');
      const r = habitRate(h, 30);
      return `<button class="hstat c-${a.c}" data-act="detail" data-id="${h.id}"><span class="hn"><b>${esc(h.name)}</b><span class="dots">${dots}</span></span>
        <span class="hv"><b>${habitStreak(h)}</b>streak · ${r == null ? '–' : Math.round(r * 100) + '%'}</span></button>`;
    }).join('');
  }).join('');
  $('#v-progress').innerHTML = `
    <header class="top"><div><div class="eyebrow">Since ${fmtDay(S.start, {day: 'numeric', month: 'short', year: 'numeric'})}</div><h1>Progress</h1></div></header>
    <div class="stats">
      <div class="stat"><b>${st.n}<small>d</small></b><span>Day streak</span></div>
      <div class="stat"><b>${best}<small>d</small></b><span>Best streak</span></div>
      <div class="stat"><b>${wn ? Math.round(wk / wn * 100) : 0}<small>%</small></b><span>7-day balance</span></div>
    </div>
    <div class="grid-2">
      <div>
        <section class="card"><div class="card-h"><h2>Consistency</h2><span class="sub">Last 20 weeks</span></div>
          <div class="heat" style="grid-template-columns:repeat(${weeks},1fr)">${heat}</div>
          <div class="heat-legend"><span>Goal ${S.set.goal}% keeps the streak</span><span class="sc">Less <i style="background:var(--line)"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> More</span></div>
        </section>
        ${prayHtml}
        <section class="card"><div class="card-h"><h2>Areas</h2><span class="sub">This week vs last</span></div><div class="pbars">${areaHtml}</div></section>
        ${qHtml}
      </div>
      <div>
        ${m ? `<section class="card"><div class="card-h"><h2>${esc(m.name)}</h2><span class="sub">Last 14 days · ${m.type === 'limit' ? 'max' : 'goal'} ${fmtTarget(m)}</span></div>
          <div class="chips metric-tabs">${metrics.map(h => `<button class="chip" data-act="metric" data-id="${h.id}" aria-pressed="${h.id === m.id}">${esc(h.name)}</button>`).join('')}</div>${chart}</section>` : ''}
        <section class="card" style="padding-top:4px">${habitsHtml}</section>
      </div>
    </div>`;
}

/* ================= YOU / SETTINGS ================= */
function renderYou() {
  const p = S.set.prayer;
  const habitsByArea = S.areas.map(a => {
    const hs = S.habits.filter(h => h.area === a.id);
    return `<div class="group-t">${esc(a.name)}<button data-act="edit-area" data-id="${a.id}">Edit area</button></div><div class="group">${hs.map((h, i) => `
      <div class="hab-row c-${a.c}${h.archived ? ' arch' : ''}"><button class="hn" data-act="edit-habit" data-id="${h.id}"><b>${esc(h.name)}</b><span>${habitSummary(h)}</span></button>
      <button class="mini-btn" data-act="move" data-id="${h.id}" data-d="-1" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${icon('up', 16)}</button>
      <button class="mini-btn" data-act="move" data-id="${h.id}" data-d="1" aria-label="Move down" ${i === hs.length - 1 ? 'disabled style="opacity:.3"' : ''}>${icon('down', 16)}</button></div>`).join('') || '<div class="srow"><span class="lab" style="color:var(--ink3)">No habits yet</span></div>'}
      <button class="srow" data-act="new-habit" data-area="${a.id}"><span class="ic">${icon('plus', 17)}</span><span class="lab">Add to ${esc(a.name)}</span></button></div>`;
  }).join('');
  $('#v-you').innerHTML = `
    <header class="top"><div><div class="eyebrow">Settings</div><h1>${S.name ? esc(S.name) : 'You'}</h1></div></header>
    <div class="grid-2"><div>
    <div class="group-t">Profile</div>
    <div class="group">
      <label class="srow"><span class="lab">Name</span><input class="inp" style="max-width:52%;padding:8px 10px;font-size:14px;text-align:right;border:0;background:var(--bg)" data-set="name" value="${esc(S.name)}" placeholder="Your name"></label>
      <label class="srow"><span class="lab">Weight<small>Sets protein to 1.6 g per kg</small></span><input type="number" inputmode="decimal" data-set="weight" value="${S.set.weight}" min="30" max="200"> <span class="val">kg</span></label>
    </div>
    <div class="group-t">Food goals</div>
    <div class="group">
      <label class="srow"><span class="lab">Calories<small>About 35 kcal per kg for an active day</small></span><input type="number" inputmode="numeric" data-set="nut-kcal" value="${S.set.nut.kcal}"> <span class="val">kcal</span></label>
      <label class="srow"><span class="lab">Carbs</span><input type="number" inputmode="numeric" data-set="nut-c" value="${S.set.nut.c}"> <span class="val">g</span></label>
      <label class="srow"><span class="lab">Fat</span><input type="number" inputmode="numeric" data-set="nut-f" value="${S.set.nut.f}"> <span class="val">g</span></label>
      <div class="srow"><span class="lab">Protein and fibre<small>Set on their habits: ${(habit('protein') || {}).target || 100} g and ${(habit('fiber') || {}).target || 30} g</small></span></div>
      ${S.foods.filter(f => !f.gone).length ? `<button class="srow" data-act="my-foods"><span class="lab">My foods<small>${S.foods.filter(f => !f.gone).length} added by you</small></span><span class="chev">${icon('chevR', 16)}</span></button>` : ''}
    </div>
    <div class="group-t">Prayer times</div>
    <div class="group">
      <button class="srow" data-act="location"><span class="ic">${icon('pin', 17)}</span><span class="lab">Location<small>${esc(p.city || 'Custom')} · ${(+p.lat).toFixed(2)}, ${(+p.lng).toFixed(2)}</small></span><span class="chev">${icon('chevR', 16)}</span></button>
      <label class="srow"><span class="lab">Method</span><select data-set="method">${Object.entries(Prayer.METHODS).map(([k, m]) => `<option value="${k}"${p.method === k ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
      <label class="srow"><span class="lab">Asr</span><select data-set="asr"><option value="hanafi"${p.asr === 'hanafi' ? ' selected' : ''}>Hanafi (later)</option><option value="standard"${p.asr !== 'hanafi' ? ' selected' : ''}>Shafi‘i, Maliki, Hanbali</option></select></label>
      <label class="srow"><span class="lab">Hijri date<small>Adjust for local moon sighting</small></span><select data-set="hijri">${[-2, -1, 0, 1, 2].map(x => `<option value="${x}"${+S.set.hijri === x ? ' selected' : ''}>${x > 0 ? '+' : ''}${x} day${Math.abs(x) === 1 ? '' : 's'}</option>`).join('')}</select></label>
    </div>
    <div class="group-t">Day</div>
    <div class="group">
      <label class="srow"><span class="lab">Daily goal<small>A balanced day keeps your streak</small></span><select data-set="goal">${[50, 60, 70, 75, 80, 85, 90, 100].map(x => `<option value="${x}"${S.set.goal === x ? ' selected' : ''}>${x}%</option>`).join('')}</select></label>
    </div>
    <div class="group-t">Appearance</div>
    <div class="group">
      <div class="srow"><span class="lab">Theme</span><div class="seg" style="width:220px">${[['light', 'Light'], ['dim', 'Dim'], ['auto', 'Auto']].map(([x, l]) => `<button data-act="theme" data-v="${x}" aria-pressed="${S.set.theme === x}">${l}</button>`).join('')}</div></div>
      <label class="srow"><span class="lab">Show transliteration</span><input type="checkbox" switch data-set="tr" ${S.set.tr ? 'checked' : ''}></label>
      <label class="srow"><span class="lab">Show meaning</span><input type="checkbox" switch data-set="en" ${S.set.en ? 'checked' : ''}></label>
    </div>
    <div class="group-t">Your data</div>
    <div class="group">${sync.key ? `
      <button class="srow" data-act="sync-now"><span class="ic">${icon('cloud', 17)}</span><span class="lab">Sync now<small>${syncLabel()}</small></span></button>
      <button class="srow" data-act="sync-off"><span class="ic">${icon('x', 17)}</span><span class="lab">Turn off sync on this device</span></button>` : `
      <button class="srow" data-act="sync-open"><span class="ic">${icon('cloud', 17)}</span><span class="lab">Turn on sync<small>Same data on your phone and laptop</small></span><span class="chev">${icon('chevR', 16)}</span></button>`}
      <button class="srow" data-act="export"><span class="ic">${icon('dl', 17)}</span><span class="lab">Export backup</span></button>
      <button class="srow" data-act="import"><span class="ic">${icon('ul', 17)}</span><span class="lab">Import backup</span></button>
      <button class="srow danger" data-act="erase"><span class="ic" style="color:var(--bad)">${icon('trash', 17)}</span><span class="lab">Erase everything</span></button>
    </div>
    </div><div>
    <div class="group-t">Habits<button data-act="new-area">Add area</button></div>
    ${habitsByArea}
    </div></div>
    <div class="brand-foot">${MARK('var(--ink)')}<b style="color:var(--ink);font-family:var(--display);font-size:15px">Mizan</b><br>The most beloved deeds are the most consistent, even if small.</div>`;
}
function habitSummary(h) {
  const t = {check: 'Daily check', count: `Goal ${fmtTarget(h)}`, limit: `Max ${fmtTarget(h)}`, avoid: 'Stay clean', prayer: '5 daily prayers'}[h.type];
  const slot = (SLOTS.find(s => s.id === h.slot) || {}).name;
  return [t, h.type !== 'prayer' && slot, h.days && h.days.length && h.days.length < 7 && h.days.map(d => DOW[d]).join(', '), h.archived && 'Paused'].filter(Boolean).join(' · ');
}

/* ================= DETAIL + EDIT SHEETS ================= */
function openDetail(id) {
  const h = habit(id); if (!h) return;
  ui.cal = null;
  openSheet(() => detailBody(id), {title: () => (habit(id) || {}).name || ''});
}
function detailBody(id) {
  const h = habit(id); if (!h) return '';
  const dk = ui.date || todayKey(), a = area(h.area), v = val(h, dk), p = prog(h, dk);
  let hero = '';
  if (h.type === 'count' || h.type === 'limit') {
    const qs = quickList(h);
    hero = `<div class="dt-hero c-${a.c}"><div class="dt-ring">${ring(168, 12, h.type === 'limit' ? clamp((+v || 0) / h.target, 0, 1) : p)}<div class="val"><b>${h.type === 'limit' && v == null ? '–' : esc(fmtVal(h, v).replace(/ (L|g|steps|pages|min|ml|blocks|prayers|rak‘ahs)$/, ''))}</b><span>${h.type === 'limit' ? `max ${fmtTarget(h)}` : `of ${fmtTarget(h)}`}</span></div></div></div>
      <div class="stepper c-${a.c}"><button data-act="dec" data-id="${h.id}" aria-label="Less">${icon('minus', 22)}</button><button class="main" data-act="inc" data-id="${h.id}">+${esc(fmtStep(h, h.step || 1))}</button></div>
      ${qs.length ? `<div class="quick c-${a.c}">${qs.map(q => `<button data-act="${h.type === 'limit' ? 'setv' : 'addv'}" data-id="${h.id}" data-v="${q.v}">${esc(q.label)}${/:/.test(h.quick) ? `<em>${q.v}${h.unit === 'g' ? 'g' : ''}</em>` : ''}</button>`).join('')}</div>` : ''}
      <div class="field"><label for="exact">Set exact amount</label><form data-form="exact" data-id="${h.id}" style="display:flex;gap:8px"><input id="exact" class="inp" type="number" inputmode="decimal" placeholder="${v ?? 0}"><button class="btn" style="width:96px">Set</button></form></div>`;
  } else if (h.type === 'prayer') {
    hero = `<div class="dt-hero"><div class="sky-plain" style="width:100%"><div class="prayers">${PRAYERS.map(([k, name], i) => `<button class="pr-btn${(v & (1 << i)) ? ' done' : ''}" data-act="prayer" data-i="${i}"><span class="pc">${icon('check', 13)}</span><span class="pn">${name}</span><span class="pt">${clock(ptimes(dk)[k])}</span></button>`).join('')}</div></div></div>`;
  } else {
    const label = h.type === 'avoid' ? (v ? 'Undo slip' : 'I slipped today') : (v ? 'Done' : 'Mark done');
    hero = `<div class="dt-hero c-${a.c}" style="padding-bottom:8px"><button class="btn${h.type === 'avoid' ? ' ghost' : ''}" style="${h.type === 'check' && v ? 'background:var(--a);color:#fff' : ''}" data-act="tick" data-id="${h.id}">${h.type === 'check' && v ? icon('check', 18) : ''}${label}</button></div>`;
  }
  if (h.azkar) hero += `<button class="btn ghost" style="margin-bottom:12px" data-act="read" data-id="${h.azkar}">${icon('dhikr', 18)} Open ${esc((S.azkar.find(s => s.id === h.azkar) || {}).name || 'dhikr')}</button>`;
  if (h.link) hero += `<button class="btn ghost" style="margin-bottom:12px" data-act="link" data-url="${esc(h.link)}">${icon('ext', 18)} Open link</button>`;
  if (h.surah) hero += `<button class="btn ghost" style="margin-bottom:12px" data-act="surah" data-n="${h.surah}" data-id="${h.id}">${icon('book', 18)} Read Surah ${esc(SURAH[h.surah] ? SURAH[h.surah].n : h.surah)}</button>`;
  if (h.food && h.type === 'count') { const fp = foodPart(h, dk); if (fp) hero += `<p class="help" style="text-align:center;margin:-4px 0 14px">${esc(fmtVal(h, Math.round(fp * 10) / 10))} from your food log${raw(h, dk) ? ` · ${esc(fmtVal(h, raw(h, dk)))} added by hand` : ''}</p>`; }
  if (h.book) {
    const pg = bookPage(h, dk);
    hero += `<form class="book" data-form="book" data-id="${h.id}"><div class="fl">Current book</div>
      <input class="inp" name="t" placeholder="Book title" value="${esc(h.book.t || '')}" maxlength="80">
      <div class="inp-row" style="grid-template-columns:1fr 1fr auto;margin-top:8px"><div><label>I’m on page</label><input class="inp" name="page" type="number" inputmode="numeric" value="${pg ?? ''}"></div><div><label>Total pages</label><input class="inp" name="total" type="number" inputmode="numeric" value="${h.book.total || ''}"></div><div style="align-self:end"><button class="btn" style="width:84px">Save</button></div></div>
      ${pg != null && h.book.total ? `<div class="track"><i style="width:${clamp(pg / h.book.total, 0, 1) * 100}%"></i></div><p class="help">${pg >= h.book.total ? 'Finished. Pick your next book.' : `${h.book.total - pg} pages to go`}</p>` : ''}</form>`;
  }
  if (h.quran) {
    const L = quranLabel(quranPos(dk));
    hero += `<div class="pos-line"><span>${dk === todayKey() ? 'Today' : fmtDay(dk)}: <b>${L.text}</b></span><button class="link-btn" style="color:var(--ink)" data-act="quran-set">Change</button></div>
      <button class="btn ghost" style="margin-bottom:12px" data-act="hizb" data-id="${h.id}">${icon('book', 18)} Read para ${L.para}, ${L.half ? 'second' : 'first'} half</button>`;
  }
  const r = habitRate(h, 30);
  // month calendar
  const base = ui.cal || dk.slice(0, 7) + '-01', first = dateOf(base), y = first.getFullYear(), mo = first.getMonth();
  const daysIn = new Date(y, mo + 1, 0).getDate(), t = todayKey();
  let cal = DOW.map(d => `<div class="dh">${d[0]}</div>`).join('') + '<div></div>'.repeat(first.getDay());
  for (let d = 1; d <= daysIn; d++) {
    const k = keyOf(new Date(y, mo, d)), inRange = k >= (h.created || S.start) && k <= t && scheduled(h, k);
    const pp = inRange ? prog(h, k) : null;
    const c = !inRange ? 'h' : h.type === 'avoid' && pp < 1 ? 'bad' : pp >= 1 ? 'on' : pp > 0 ? 'part' : '';
    cal += `<button class="cd ${c}${k === t ? ' today' : ''}" ${inRange ? `data-act="cal-day" data-k="${k}" data-id="${h.id}"` : 'disabled'}>${d}</button>`;
  }
  return `${h.note ? `<p class="help" style="margin:-6px 0 14px">${esc(h.note)}</p>` : ''}${hero}
    <div class="dt-stats"><div><b>${habitStreak(h)}</b><span>Streak</span></div><div><b>${habitBest(h)}</b><span>Best</span></div><div><b>${r == null ? '–' : Math.round(r * 100) + '%'}</b><span>Last 30 days</span></div></div>
    <div class="card-h"><h2 style="font-size:16px">${first.toLocaleDateString('en-GB', {month: 'long', year: 'numeric'})}</h2><span style="display:flex;gap:6px"><button class="mini-btn" data-act="cal-mo" data-d="-1" aria-label="Previous month">${icon('chevL', 16)}</button><button class="mini-btn" data-act="cal-mo" data-d="1" aria-label="Next month">${icon('chevR', 16)}</button></span></div>
    <div class="cal c-${a.c}">${cal}</div>
    <p class="help">${h.type === 'check' || h.type === 'avoid' ? 'Tap a day to fix a missed entry.' : 'Tap a day to open it.'}</p>
    <div class="dt-actions"><button class="btn ghost" data-act="edit-habit" data-id="${h.id}">${icon('edit', 18)} Edit habit</button></div>`;
}

const TYPES = [['check', 'Do it'], ['count', 'Reach'], ['limit', 'Stay under'], ['avoid', 'Avoid']];
function openEdit(id, preset) {
  const h = id ? habit(id) : null;
  ui.ed = h ? clone(h) : {id: null, name: '', area: S.areas[0]?.id, type: 'check', slot: 'day', target: 10, unit: '', step: 1, days: [], ...(preset || {})};
  openSheet(editBody, {title: h ? 'Edit habit' : 'New habit'});
  if (!h) setTimeout(() => $('#edName')?.focus(), 350);
}
function editBody() {
  const e = ui.ed, isNew = !e.id, a = area(e.area);
  const ideas = isNew ? IDEAS.filter(i => !S.habits.some(h => h.name === i.name)) : [];
  const days = e.days && e.days.length ? e.days : [0, 1, 2, 3, 4, 5, 6];
  return `${ideas.length ? `<div class="fl" style="font-size:12.5px;font-weight:600;color:var(--ink2);margin-bottom:8px">Ideas, tap one to start from it</div><div class="ideas">${ideas.map((i, n) => `<button class="idea c-${area(i.area).c}" data-act="idea" data-n="${IDEAS.indexOf(i)}"><b>${esc(i.name)}</b><span>${esc(area(i.area).name)}</span></button>`).join('')}</div>` : ''}
    <div class="field"><label for="edName">Name</label><input id="edName" class="inp" data-f="name" value="${esc(e.name)}" placeholder="e.g. Read Surah Al-Kahf" maxlength="60"></div>
    ${e.type === 'prayer' ? '' : `<div class="field"><span class="fl">Type</span><div class="seg">${TYPES.map(([k, l]) => `<button data-act="ed" data-k="type" data-v="${k}" aria-pressed="${e.type === k}">${l}</button>`).join('')}</div>
      <p class="help">${{check: 'Tick it off once a day.', count: 'Build up to a daily goal, like water or pages.', limit: 'Stay at or under a daily maximum, like screen time.', avoid: 'Every day counts as clean unless you log a slip.'}[e.type]}</p></div>`}
    ${e.type === 'count' || e.type === 'limit' ? `<div class="field"><div class="inp-row">
      <div><label>${e.type === 'limit' ? 'Max' : 'Goal'}</label><input class="inp" type="number" inputmode="decimal" data-f="target" value="${e.target ?? ''}"></div>
      <div><label>Unit</label><input class="inp" data-f="unit" value="${esc(e.unit || '')}" placeholder="pages"></div>
      <div><label>Step</label><input class="inp" type="number" inputmode="decimal" data-f="step" value="${e.step ?? 1}"></div></div>
      <label style="margin-top:10px">Quick buttons <span style="font-weight:400;color:var(--ink3)">e.g. “250, 500” or “Egg:6, Dal:9”</span></label><input class="inp" data-f="quick" value="${esc(e.quick || '')}"></div>` : ''}
    <div class="field"><span class="fl">Area</span><div class="chips">${S.areas.map(x => `<button class="chip c-a c-${x.c}" data-act="ed" data-k="area" data-v="${x.id}" aria-pressed="${e.area === x.id}"><span class="sw"></span>${esc(x.name)}</button>`).join('')}</div></div>
    ${e.type === 'prayer' ? '' : `<div class="field"><span class="fl">When</span><div class="chips">${SLOTS.map(s => `<button class="chip" data-act="ed" data-k="slot" data-v="${s.id}" aria-pressed="${(e.slot || 'day') === s.id}">${esc(s.name)}</button>`).join('')}</div></div>`}
    <div class="field"><span class="fl">Days</span><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button data-act="ed-day" data-d="${d}" aria-pressed="${days.includes(d)}" aria-label="${DOW[d]}">${DOW[d][0]}</button>`).join('')}</div></div>
    <div class="field"><label for="edNote">Note <span style="font-weight:400;color:var(--ink3)">optional</span></label><input id="edNote" class="inp" data-f="note" value="${esc(e.note || '')}" placeholder="Why it matters, or when" maxlength="80"></div>
    <div class="field"><label for="edLink">Link <span style="font-weight:400;color:var(--ink3)">optional</span></label><input id="edLink" class="inp" type="url" data-f="link" value="${esc(e.link || '')}" placeholder="https://quran.com/18"></div>
    ${e.type !== 'prayer' ? `<div class="field"><span class="fl">Linked dhikr <span style="font-weight:400;color:var(--ink3)">completes this habit</span></span><div class="chips"><button class="chip" data-act="ed" data-k="azkar" data-v="" aria-pressed="${!e.azkar}">None</button>${S.azkar.map(s => `<button class="chip" data-act="ed" data-k="azkar" data-v="${s.id}" aria-pressed="${e.azkar === s.id}">${esc(s.name)}</button>`).join('')}</div></div>` : ''}
    <button class="btn" data-act="ed-save">${isNew ? 'Add habit' : 'Save'}</button>
    ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button class="btn ghost" data-act="ed-archive">${icon('archive', 18)} ${e.archived ? 'Resume' : 'Pause'}</button><button class="btn ghost" style="color:var(--bad)" data-act="ed-delete">${icon('trash', 18)} Delete</button></div>
      <p class="help" style="text-align:center">Pausing keeps its history. Deleting removes it everywhere.</p>`}`;
}
function saveEdit() {
  const e = ui.ed, name = (e.name || '').trim();
  if (!name) { $('#edName')?.focus(); toast('Give it a name'); return; }
  const h = {...e, name, u: Date.now()};
  ['target', 'step'].forEach(k => { if (h[k] !== undefined && h[k] !== '') h[k] = Math.max(0, +h[k]) || (k === 'step' ? 1 : 1); });
  if ((h.type === 'count' || h.type === 'limit') && !h.target) h.target = 1;
  if (h.days && (h.days.length === 7 || !h.days.length)) delete h.days;
  if (!h.azkar) delete h.azkar;
  if (!h.id) {
    h.id = uid(); h.created = todayKey();
    const last = S.habits.map((x, i) => x.area === h.area ? i : -1).filter(i => i >= 0).pop();
    S.habits.splice(last == null ? S.habits.length : last + 1, 0, h);
  } else S.habits = S.habits.map(x => x.id === h.id ? h : x);
  save(); closeSheet();
  if (ui.sheets.length) paintSheet();
  toast(e.id ? 'Saved' : `Added ${name}`);
}

function openAreaEdit(id) {
  const a = id ? S.areas.find(x => x.id === id) : null;
  ui.ae = a ? clone(a) : {id: null, name: '', c: AREA_COLORS.find(c => !S.areas.some(x => x.c === c)) || 'teal'};
  openSheet(() => `<div class="field"><label for="arName">Name</label><input id="arName" class="inp" data-af="name" value="${esc(ui.ae.name)}" placeholder="e.g. Family" maxlength="24"></div>
    <div class="field"><span class="fl">Colour</span><div class="chips">${AREA_COLORS.map(c => `<button class="chip c-a c-${c}" data-act="ae-c" data-v="${c}" aria-pressed="${ui.ae.c === c}" aria-label="${c}"><span class="sw"></span></button>`).join('')}</div></div>
    <button class="btn" data-act="ae-save">${a ? 'Save' : 'Add area'}</button>
    ${a ? `<button class="btn danger" style="margin-top:8px" data-act="ae-del">Delete area</button><p class="help" style="text-align:center">Habits in it move to ${esc((S.areas.find(x => x.id !== a.id) || {}).name || 'another area')}.</p>` : ''}`, {title: a ? 'Edit area' : 'New area'});
}

/* ---------- dhikr set editing ---------- */
function openZEdit(setId) {
  ui.zs = setId;
  openSheet(() => {
    const set = S.azkar.find(s => s.id === ui.zs); if (!set) return '';
    const isDefault = DEFAULT_AZKAR.some(d => d.id === set.id);
    return `<div class="field"><label for="zsName">Set name</label><input id="zsName" class="inp" data-zf="name" value="${esc(set.name)}" maxlength="40"></div>
      <div class="field"><label for="zsHint">Subtitle</label><input id="zsHint" class="inp" data-zf="hint" value="${esc(set.hint || '')}" maxlength="50"></div>
      <div class="field"><span class="fl">Dhikr in this set</span>${set.items.map((i, j) => { const it = zItem(i); return `<div class="zedit-row"><div class="zn"><b>${esc(it.t || it.tr || 'Dhikr')}</b><span>${it.n}× · ${esc(it.src || 'Custom')}</span></div>
        <button class="mini-btn" data-act="zi-n" data-j="${j}" aria-label="Change count">${it.n}</button>
        <button class="mini-btn" data-act="zi-move" data-j="${j}" data-d="-1" aria-label="Move up" ${j === 0 ? 'disabled style="opacity:.3"' : ''}>${icon('up', 16)}</button>
        <button class="mini-btn danger" data-act="zi-del" data-j="${j}" aria-label="Remove">${icon('trash', 16)}</button></div>`; }).join('')}</div>
      <button class="btn ghost" data-act="zi-add">${icon('plus', 18)} Add dhikr</button>
      ${isDefault ? `<button class="btn danger" style="margin-top:8px" data-act="zs-reset">Restore the original list</button>` : `<button class="btn danger" style="margin-top:8px" data-act="zs-del">Delete this set</button>`}`;
  }, {title: 'Edit dhikr'});
}
function openZAdd() {
  ui.zn = {t: '', ar: '', tr: '', en: '', n: 1, src: ''};
  openSheet(() => {
    const lib = Object.entries(Z);
    return `<div class="fl" style="font-size:12.5px;font-weight:600;color:var(--ink2);margin-bottom:8px">From the library</div>
      <div class="ideas">${lib.map(([k, z]) => `<button class="idea c-deen" data-act="zi-lib" data-k="${k}"><b>${esc(z.t)}</b><span>${esc(z.src)}</span></button>`).join('')}</div>
      <div class="fl" style="font-size:12.5px;font-weight:600;color:var(--ink2);margin:4px 0 10px">Or write your own</div>
      <div class="field"><label>Title</label><input class="inp" data-zn="t" placeholder="e.g. Dua for parents" maxlength="60"></div>
      <div class="field"><label>Arabic <span style="font-weight:400;color:var(--ink3)">optional</span></label><textarea class="inp ar-in" data-zn="ar" lang="ar"></textarea></div>
      <div class="field"><label>Transliteration</label><textarea class="inp" data-zn="tr"></textarea></div>
      <div class="field"><label>Meaning</label><textarea class="inp" data-zn="en"></textarea></div>
      <div class="field"><div class="inp-row" style="grid-template-columns:1fr 2fr"><div><label>Times</label><input class="inp" type="number" inputmode="numeric" data-zn="n" value="1" min="1"></div><div><label>Source</label><input class="inp" data-zn="src" placeholder="optional"></div></div></div>
      <button class="btn" data-act="zi-save">Add to set</button>`;
  }, {title: 'Add dhikr'});
}

/* ================= ARABIC (Indo-Pak script) ================= */
// Duas are stored in standard Arabic spelling. Shown the way South Asian books print them:
// Allah with the standing alif (اللّٰه), plain alif with a vowel for أ/إ at the start of a word, and Farsi ya.
function indo(s) {
  return String(s || '')
    .replace(/(لِ?ل)[َّ]{2}ه/g, '$1ّٰه')
    .replace(/إ/g, 'ا')
    .replace(/(^|[\s،,(]|[وفبل][َِ])أ(?=[َُ])/g, '$1ا')
    .replace(/[يى]/g, 'ی');
}
const arText = it => it.q ? it.ar : indo(it.ar);

/* ================= ADHKAR CHECKLIST ================= */
function curSlot(dk) { return dk === todayKey() ? period(ptimes(dk), new Date()).slot : null; }
function zOpen(set, dk, onDhikrTab) {
  if (set.id in ui.zx) return ui.zx[set.id];
  const pr = setProgress(set, dk), slot = curSlot(dk);
  return !pr.complete && set.slot === slot && (onDhikrTab || slot !== 'day');
}
function zList(set, dk) {
  const z = zState(dk, set.id), r = z.r || 0;
  const rounds = set.rounds ? `<div class="zrounds">${Array.from({length: set.rounds}, (_, i) => `<button class="zround${i < r ? ' on' : ''}${i === r ? ' cur' : ''}" data-act="zr" data-id="${set.id}" data-i="${i}" aria-pressed="${i < r}">${icon('check', 12)}<span>${set.rounds === 5 ? PRAYERS[i][1] : `Round ${i + 1}`}</span></button>`).join('')}</div>` : '';
  const full = set.rounds && r >= set.rounds;
  const items = full ? `<div class="zi-done">All ${set.rounds} rounds done today. Alhamdulillah.</div>` : set.items.map((i0, j) => {
    const it = zItem(i0), c = z.c[it.id] || 0, done = c >= it.n;
    return `<div class="zi${done ? ' on' : ''}">
      <button class="zck" data-act="zi-tick" data-id="${set.id}" data-j="${j}" aria-pressed="${done}" aria-label="${esc(it.t || 'Dhikr')} ${it.n} times">${icon('check', 15)}</button>
      <button class="zi-t" data-act="zi-open" data-id="${set.id}" data-j="${j}">${it.f ? `<span class="zi-for">${esc(it.f)}</span>` : ''}<b>${esc(it.t || 'Dhikr')}</b>${it.ar ? `<span class="zi-ar" lang="ar" dir="rtl">${esc(arText(it).replace(BISMILLAH + ' ', ''))}</span>` : ''}${it.why ? `<span class="zi-why">${esc(it.why)}</span>` : ''}</button>
      <span class="zn${it.n >= 10 ? ' big' : ''}">${!done && c ? `<small>${c}/</small>` : ''}${it.n}<small>×</small></span>
    </div>`;
  }).join('');
  return `<div class="zlist">${rounds}${items}</div>`;
}
function zTick(setId, j, dk) {
  const set = S.azkar.find(s => s.id === setId), it = set && set.items[j]; if (!it) return;
  const z = clone(zState(dk, setId)); z.c = z.c || {};
  const was = (z.c[it.id] || 0) >= it.n;
  if (was) delete z.c[it.id]; else z.c[it.id] = it.n;
  buzz();
  const all = set.items.every(i => (z.c[i.id] || 0) >= i.n);
  if (!was && all) {
    if (set.rounds) { z.r = Math.min(set.rounds, (z.r || 0) + 1); z.c = {}; }
    setZ(dk, setId, z); linkAzkarHabit(set, dk, z);
    toast(set.rounds ? `${set.rounds === 5 ? PRAYERS[z.r - 1][1] : 'Round'} done · ${z.r} of ${set.rounds}` : `${set.name} complete. May Allah accept it.`);
  } else {
    setZ(dk, setId, z);
    if (was && !set.rounds) { const h = S.habits.find(x => x.azkar === set.id && x.type === 'check'); if (h && raw(h, dk)) setVal(h, dk, 0); }
  }
  render();
}
function zRound(setId, i, dk) {
  const set = S.azkar.find(s => s.id === setId); if (!set) return;
  const z = clone(zState(dk, setId)), r = z.r || 0;
  z.r = i < r ? i : i + 1; z.c = {};
  setZ(dk, setId, z); buzz();
  const h = S.habits.find(x => x.azkar === set.id && scheduled(x, dk));
  if (h && h.type === 'count') setVal(h, dk, z.r); else if (h && h.type === 'check') setVal(h, dk, z.r >= set.rounds ? 1 : 0);
  render();
}

/* ================= QURAN READER ================= */
function quranShell(title, sub, body, doneBtn) {
  closeQuran(true);
  const el = document.createElement('div'); el.className = 'reader qreader'; el.id = 'qreader'; el.setAttribute('role', 'dialog');
  el.style.setProperty('--qs', (ui.qsize || 30) + 'px');
  el.innerHTML = `<div class="rd-top"><button class="icon-btn" data-act="q-close" aria-label="Close">${icon('x', 18)}</button>
      <div class="tt"><b>${esc(title)}</b><span>${esc(sub)}</span></div>
      <div class="qsz"><button class="mini-btn" data-act="q-size" data-d="-1" aria-label="Smaller text">A</button><button class="mini-btn" data-act="q-size" data-d="1" aria-label="Larger text" style="font-size:19px">A</button></div></div>
    <div class="rd-body q-body">${body}</div>
    ${doneBtn ? `<div class="rd-bot q-bot">${doneBtn}</div>` : ''}`;
  document.body.append(el); document.body.style.overflow = 'hidden';
  return el;
}
function closeQuran(silent) { const el = $('#qreader'); if (!el) return; el.remove(); document.body.style.overflow = ''; if (!silent) render(); }
const ayat = arr => arr.map(a => `<span class="ay">${esc(a)}</span>`).join(' ');
function openSurah(n, hid) {
  const s = SURAH[n]; if (!s) return;
  const h = hid ? habit(hid) : S.habits.find(x => x.surah === n && scheduled(x, todayKey()));
  const done = h && val(h, todayKey());
  quranShell(`Surah ${s.n}`, `${s.en} · ${s.a.length} ayat`,
    `${n !== 9 ? `<p class="q-bism" lang="ar" dir="rtl">${esc(BISMILLAH)}</p>` : ''}<p class="q-text" lang="ar" dir="rtl">${ayat(s.a)}</p>`,
    h ? `<button class="btn${done ? ' ghost' : ''}" data-act="q-done" data-id="${h.id}">${done ? icon('check', 18) + ' Already done today' : icon('check', 18) + ' Mark as read'}</button>` : '');
}
const hizbCache = {};
async function openHizb(hid) {
  const h = habit(hid) || S.habits.find(x => x.quran), dk = ui.date || todayKey(), pos = quranPos(dk), L = quranLabel(pos), hz = pos % 60 + 1;
  const done = h && val(h, dk);
  const el = quranShell(`Para ${L.para}, ${L.half ? 'second' : 'first'} half`, `Half para ${hz} of 60${L.khatam ? ` · khatam ${L.khatam + 1}` : ''}`,
    `<div class="q-load">Loading…</div>`,
    h ? `<button class="btn${done ? ' ghost' : ''}" data-act="q-done" data-id="${h.id}">${icon('check', 18)} ${done ? 'Already done today' : 'Mark as read'}</button>` : '');
  let vs = hizbCache[hz];
  if (!vs) { try { vs = JSON.parse(lsGet('mizan.hizb.' + hz)); } catch (e) {} }
  if (!vs) {
    try {
      const r = await fetch(`https://api.quran.com/api/v4/quran/verses/indopak_nastaleeq?hizb_number=${hz}`);
      vs = (await r.json()).verses.map(v => [v.verse_key, v.text_indopak_nastaleeq]);
      lsSet('mizan.hizb.' + hz, JSON.stringify(vs));
    } catch (e) { vs = null; }
  }
  if (!document.body.contains(el)) return;
  const body = $('.q-body', el);
  if (!vs) { body.innerHTML = `<div class="q-load">Couldn’t load the text. Check your connection.<br><br><button class="btn ghost" style="max-width:280px;margin:0 auto" data-act="link" data-url="https://quran.com/juz/${L.para}">${icon('ext', 18)} Open on Quran.com</button></div>`; return; }
  hizbCache[hz] = vs;
  let html = '', cur = null, buf = [];
  const flush = () => { if (buf.length) html += `<p class="q-text" lang="ar" dir="rtl">${ayat(buf)}</p>`; buf = []; };
  for (const [key, text] of vs) {
    const [sn, an] = key.split(':').map(Number);
    if (sn !== cur) {
      flush(); cur = sn;
      if (an === 1) html += `<div class="q-sh"><span>Surah ${esc(SURAH_NAMES[sn - 1] || sn)}</span></div>${sn !== 1 && sn !== 9 ? `<p class="q-bism" lang="ar" dir="rtl">${esc(BISMILLAH)}</p>` : ''}`;
      else html += `<div class="q-sh small"><span>${esc(SURAH_NAMES[sn - 1] || sn)} · from ayah ${an}</span></div>`;
    }
    buf.push(text);
  }
  flush();
  body.innerHTML = html;
}

/* ================= FOOD LOG ================= */
const NUTK = ['kcal', 'p', 'c', 'f', 'fib'];
const EMPTY_FS = {n: 0, kcal: 0, p: 0, c: 0, f: 0, fib: 0, w: 0, tags: {}};
const fsCache = new WeakMap();
function foodSum(dk) {
  const fl = dayLog(dk).food; if (!fl || !fl.length) return EMPTY_FS;
  if (fsCache.has(fl)) return fsCache.get(fl);
  const s = {n: fl.length, kcal: 0, p: 0, c: 0, f: 0, fib: 0, w: 0, tags: {}};
  for (const e of fl) {
    NUTK.forEach((k, i) => { s[k] += e.n[i] || 0; });
    s.w += e.w || 0;
    String(e.tg || '').split(',').filter(Boolean).forEach(t => { (s.tags[t] = s.tags[t] || []).includes(e.nm) || s.tags[t].push(e.nm); });
  }
  fsCache.set(fl, s); return s;
}
function foodPart(h, dk) {
  if (!h.food || h.type !== 'count') return 0;
  const f = foodSum(dk);
  return h.food === 'w' ? f.w : typeof f[h.food] === 'number' ? f[h.food] : 0;
}
function nutTargets() { return {kcal: S.set.nut.kcal, p: (habit('protein') || {}).target || 100, c: S.set.nut.c, f: S.set.nut.f, fib: (habit('fiber') || {}).target || 30}; }

let FOOD_DB = null;
const UNIT_ALIAS = {};
for (const [u, ws] of Object.entries(UNIT_WORDS)) ws.split(',').forEach(w => { UNIT_ALIAS[w.trim()] = u; });
const sing = w => w.length < 4 ? w : w.endsWith('ies') ? w.slice(0, -3) + 'y' : /(oes|ches|shes|sses)$/.test(w) ? w.slice(0, -2) : w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
const fkey = str => str.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).map(sing).join(' ');
function foodDb() {
  const custom = ((S && S.foods) || []).filter(f => !f.gone).map(f => ({k: 'c:' + f.id, n: f.n, a: [f.n], d: f.d, u: {[f.un || 'serving']: 100}, du: f.un || 'serving', tg: f.tg || '', custom: 1}));
  const sig = custom.map(f => f.k + f.n).join('|');
  if (FOOD_DB && FOOD_DB.sig === sig) return FOOD_DB;
  const list = [...custom, ...FOODS_RAW.map(([k, n, a, d, u, tg]) => ({k, n, a: [n, ...a.split(',')], d, u: Object.fromEntries(u.split(',').map(x => { const [uu, g] = x.split(':'); return [uu, +g]; })), du: u.split(':')[0], tg}))];
  const idx = new Map();
  for (const f of list) for (const a of f.a) { const key = fkey(a); if (key && !idx.has(key)) idx.set(key, f); }
  FOOD_DB = {sig, list, idx, byKey: new Map(list.map(f => [f.k, f]))};
  return FOOD_DB;
}
const foodByKey = k => foodDb().byKey.get(k);
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}
function matchFood(name) {
  const db = foodDb(), key = fkey(name); if (!key) return null;
  if (db.idx.has(key)) return {food: db.idx.get(key), exact: true};
  // longest known name inside what was typed, e.g. "homemade chicken biryani"
  const toks = key.split(' '); let best = null;
  for (let len = Math.min(toks.length, 4); len >= 1 && !best; len--)
    for (let i = 0; i + len <= toks.length; i++) { const sub = toks.slice(i, i + len).join(' '); if (db.idx.has(sub)) { best = db.idx.get(sub); break; } }
  if (best) return {food: best};
  // small typos: "chapathi", "bannana"
  let bd = 9;
  for (const [k, f] of db.idx) {
    if (k.length < 4) continue;
    const d = lev(key, k), lim = k.length >= 7 ? 2 : 1;
    if (d <= lim && d < bd) { bd = d; best = f; }
  }
  return best ? {food: best, fuzzy: true} : null;
}
const NUMW = {a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, couple: 2, few: 3, ek: 1, do: 2, teen: 3, char: 4};
const SIZEW = {small: .7, chota: .7, medium: 1, regular: 1, large: 1.3, big: 1.3, bada: 1.3, huge: 1.6, mini: .5, full: 1};
const isNum = t => /^\d*\.?\d+$/.test(t);
function parseOne(src) {
  let s = ' ' + src.toLowerCase().replace(/[½¼¾⅓⅔]/g, m => ' ' + {'½': .5, '¼': .25, '¾': .75, '⅓': .33, '⅔': .67}[m] + ' ') + ' ';
  s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, (m, a, b, c) => String(+a + b / c)).replace(/(\d+)\/(\d+)/g, (m, a, b) => String(+(a / b).toFixed(3)));
  s = s.replace(/(\d)\s*[x×*]\s/g, '$1 ').replace(/\s[x×*]\s*(\d)/g, ' $1').replace(/[^a-z0-9.\s']/g, ' ');
  s = s.replace(/(\d*\.?\d+)([a-z]+)/g, (m, n, u) => UNIT_ALIAS[u] || u === 'k' ? `${n} ${u}` : m);
  const toks = s.trim().split(/\s+/).filter(Boolean);
  let q = null, unit = null, size = 1, i = 0, j = toks.length;
  const eat = (t, lead) => {
    if (isNum(t)) { q = (q == null ? 1 : q) * +t; return true; }
    if (lead && t in NUMW && q == null) { q = NUMW[t]; return true; }
    if (t === 'half' || t === 'aadha') { q = (q == null ? 1 : q) * .5; return true; }
    if (t === 'quarter') { q = (q == null ? 1 : q) * .25; return true; }
    if (t === 'dozen') { q = (q == null ? 1 : q) * 12; return true; }
    if (UNIT_ALIAS[t] && !unit) { unit = UNIT_ALIAS[t]; return true; }
    if (t in SIZEW) { size = SIZEW[t]; return true; }
    return lead && (t === 'of' || t === 'some' || t === 'and');
  };
  while (i < j && eat(toks[i], true)) i++;
  const rest = toks.slice(i, j).join(' ');
  let m = matchFood(rest);
  if (!(m && m.exact)) {   // trailing amount: "rice 2 cups", "milk 200 ml"
    const save = {q, unit, size}; let jj = j;
    while (jj > i + 1 && eat(toks[jj - 1], false)) jj--;
    if (jj < j) { const m2 = matchFood(toks.slice(i, jj).join(' ')); if (m2 && (!m || m2.exact || !m.fuzzy)) { m = m2; j = jj; } else ({q, unit, size} = save); }
  }
  if (!m) return {ok: false, src: src.trim()};
  return {ok: true, food: m.food, q: q == null ? 1 : q, unit, size, fuzzy: m.fuzzy, exact: m.exact, src: src.trim()};
}
function parseFood(text) {
  return text.split(/[,;\n+&]|\band\b|\baur\b/i).map(x => x.trim()).filter(Boolean).flatMap(part => {
    const r = parseOne(part);
    // "oats with milk" → oats + milk
    if ((!r.ok || !r.exact) && /\swith\s/i.test(part)) { const sub = part.split(/\swith\s/i).map(parseOne); if (sub.every(x => x.ok)) return sub; }
    return [r];
  });
}
function gramsFor(food, unit, q) {
  let u = unit || food.du, g = food.u[u];
  if (g == null) {
    if (food.custom || u === 'piece' || u === 'serving') { g = food.u[food.du]; u = food.du; }
    else g = UNIT_G[u] ?? food.u[food.du];
  }
  return {u, g: g * q};
}
function mkEntry(food, q, unit, size = 1, keep) {
  const {u, g} = gramsFor(food, unit, q), grams = g * (size || 1);
  return {id: keep ? keep.id : uid(), k: food.k, nm: food.n, q, un: u, g: Math.round(grams),
    n: food.d.map(x => Math.round(x * grams / 100 * 10) / 10), w: /(^|,)w(,|$)/.test(food.tg) ? Math.round(grams) : 0,
    tg: String(food.tg || '').split(',').filter(t => t && t !== 'w').join(','), t: keep ? keep.t : Date.now(), m: keep ? keep.m : mealNow()};
}
function mealNow() { const h = new Date().getHours(); return h < 4 ? 'd' : h < 11 ? 'b' : h < 16 ? 'l' : h < 19 ? 's' : 'd'; }
const MEALS = [['b', 'Breakfast'], ['l', 'Lunch'], ['s', 'Snacks'], ['d', 'Dinner']];
const nfmt = x => { x = +x || 0; return x >= 100 ? String(Math.round(x)) : String(+x.toFixed(1)); };
const unitWord = (u, q) => ({g: 'g', ml: 'ml', l: 'L', kg: 'kg', tbsp: 'tbsp', tsp: 'tsp', katori: q === 1 ? 'katori' : 'katoris', glass: q === 1 ? 'glass' : 'glasses', bunch: 'bunch'}[u] || (q === 1 ? u : u + 's'));
const qtyText = e => `${nfmt(e.q)} ${unitWord(e.un, e.q)}${e.un !== 'g' && e.un !== 'ml' && !String(e.k).startsWith('c:') ? ` · ${e.g} ${e.w ? 'ml' : 'g'}` : ''}`;
function foodAdd(items, dk = ui.date || todayKey()) {
  items = items.filter(x => x.food); if (!items.length) return;
  const before = score(dk), prevP = {};
  S.habits.filter(h => h.food && scheduled(h, dk)).forEach(h => { prevP[h.id] = prog(h, dk); });
  const l = S.log[dk] = {...(S.log[dk] || {})};
  const added = items.map(x => mkEntry(x.food, x.q, x.unit, x.size));
  l.food = [...(l.food || []), ...added]; l._u = Date.now();
  Object.assign(ui.prev, prevP); ui.prevScore = before;
  save(); afterChange(dk, before);
  const sum = added.reduce((a, e) => ({p: a.p + e.n[1], kcal: a.kcal + e.n[0]}), {p: 0, kcal: 0});
  const slips = [...new Set(added.flatMap(e => e.tg.split(',')).filter(t => t === 'junk' || t === 'sugar'))];
  toast(`Added ${added.length === 1 ? added[0].nm : added.length + ' items'} · ${nfmt(sum.p)} g protein, ${Math.round(sum.kcal)} kcal${slips.length ? ` · counts as ${slips.join(' and ')}` : ''}`, () => {
    const L = S.log[dk] = {...dayLog(dk)}; L.food = (L.food || []).filter(e => !added.some(a => a.id === e.id)); L._u = Date.now(); save(); render();
  });
  render();
}
function foodDel(dk, id) {
  const l = S.log[dk] = {...dayLog(dk)}, i = (l.food || []).findIndex(e => e.id === id); if (i < 0) return;
  const e = l.food[i]; l.food = l.food.filter(x => x.id !== id); l._u = Date.now(); save(); render();
  toast(`Removed ${e.nm}`, () => { const L = S.log[dk] = {...dayLog(dk)}; const f = [...(L.food || [])]; f.splice(i, 0, e); L.food = f; L._u = Date.now(); save(); render(); });
}
function foodSubmit() {
  const inp = $('#foodIn'); if (!inp || !inp.value.trim()) return;
  const parts = parseFood(inp.value), ok = parts.filter(p => p.ok), bad = parts.filter(p => !p.ok);
  foodAdd(ok);
  const inp2 = $('#foodIn');
  if (inp2) { inp2.value = bad.map(b => b.src).join(', '); foodPreview(); if (bad.length) inp2.focus(); }
}
function foodPreview() {
  const inp = $('#foodIn'), box = $('#foodPrev'); if (!inp || !box) return;
  const txt = inp.value.trim();
  if (!txt) { box.innerHTML = ''; return; }
  const parts = parseFood(txt);
  box.innerHTML = parts.map((p, j) => {
    if (!p.ok) return `<div class="fp bad"><span><b>“${esc(p.src)}”</b> isn’t in the list yet</span><button type="button" class="act" data-act="food-custom" data-name="${esc(p.src)}">Add it</button></div>`;
    const e = mkEntry(p.food, p.q, p.unit, p.size);
    return `<div class="fp"><span><b>${esc(e.nm)}</b> · ${esc(qtyText(e))}</span><span class="fpn">${nfmt(e.n[1])} g protein · ${Math.round(e.n[0])} kcal</span></div>`;
  }).join('') + (parts.some(p => p.ok) ? `<p class="fp-hint">Press Enter to add${parts.length > 1 ? ' all' : ''}</p>` : '');
}
function recentFoods(dk) {
  const seen = new Set(), out = [];
  for (let i = 0; i < 21 && out.length < 8; i++) {
    const k = addDays(dk, -i), fl = (dayLog(k).food || []).slice().reverse();
    for (const e of fl) { const key = `${e.k}|${e.q}|${e.un}`; if (seen.has(key) || !foodByKey(e.k)) continue; seen.add(key); out.push(e); if (out.length >= 8) break; }
  }
  return out;
}
// "To reach 100%": a short list of everyday foods that closes today's remaining calories, protein, fibre and carbs.
// [food key, unit, servings per step, most servings, group (one food per group), flags: m = my own food, r = only if eaten recently]
const PLAN_FOODS = [
  ['yogabar', 'serving', 1, 2, 'oats', 'm'], ['egg', 'piece', 2, 4, 'egg'], ['chicken', 'serving', 1, 2, 'meat'],
  ['dal', 'katori', 1, 2, 'dal'], ['chole', 'katori', 1, 1, 'pulse'], ['rajma', 'katori', 1, 1, 'pulse'], ['sprouts', 'katori', 1, 1, 'pulse'],
  ['curd', 'katori', 1, 2, 'dairy'], ['milk', 'glass', 1, 2, 'milk'], ['paneer', 'serving', 1, 1, 'vprot'], ['soya', 'serving', 1, 1, 'vprot'],
  ['roti', 'piece', 2, 6, 'roti'], ['rice', 'katori', 1, 2, 'rice'], ['sabzi', 'katori', 1, 2, 'sabzi'], ['salad', 'bowl', 1, 1, 'salad'],
  ['cucumber', 'piece', 1, 1, 'salad'], ['guava', 'piece', 1, 1, 'fruit1'], ['apple', 'piece', 1, 1, 'fruit1'], ['banana', 'piece', 1, 2, 'fruit2'],
  ['papaya', 'bowl', 1, 1, 'fruit2'], ['almonds', 'handful', 1, 1, 'nuts'], ['peanuts', 'handful', 1, 1, 'nuts'], ['chana', 'handful', 1, 1, 'nuts'],
  ['whey', 'scoop', 1, 1, 'whey', 'r'],
];
function foodPlan(dk) {
  const T = nutTargets(), f = foodSum(dk), I = {kcal: 0, p: 1, c: 2, f: 3, fib: 4};
  const g = {kcal: T.kcal - f.kcal, p: T.p - f.p, c: T.c - f.c, f: T.f - f.f, fib: T.fib - f.fib};
  const usual = new Set();
  for (let i = 0; i < 21; i++) (dayLog(addDays(dk, -i)).food || []).forEach(e => usual.add(e.k));
  const eatenToday = new Set((dayLog(dk).food || []).map(e => e.k));
  const cands = PLAN_FOODS.map(([k, u, step, max, grp, fl = '']) => {
    const food = foodByKey(k); if (!food || (fl.includes('r') && !usual.has(k))) return null;
    const e = mkEntry(food, step, u);
    return {k, u, step, max, grp, food, n: e.n, tg: e.tg, cnt: 0, like: fl.includes('m') ? 1.35 : usual.has(k) ? 1.2 : 1};
  }).filter(Boolean);
  const used = new Map();   // group → chosen food
  const pick = [];
  const take = c => { c.cnt += c.step; NUTK.forEach((k, i) => { g[k] -= c.n[i]; }); used.set(c.grp, c.k); if (!pick.includes(c)) pick.push(c); };
  const W = [['kcal', 1.6], ['p', 2.5], ['fib', 1.5], ['c', .8], ['f', .7]];
  const score = c => {
    if (c.cnt + c.step > c.max || (used.has(c.grp) && used.get(c.grp) !== c.k)) return -1;
    let s = 0;
    for (const [k, w] of W) if (g[k] > 0) s += w * Math.min(c.n[I[k]], g[k]) / T[k];
    s -= Math.max(0, c.n[0] - Math.max(g.kcal, 0)) / T.kcal * 4;
    s -= Math.max(0, c.n[3] - Math.max(g.f, 0)) / T.f * 1.5;
    s -= Math.max(0, c.n[2] - Math.max(g.c, 0)) / T.c;
    s -= Math.max(0, c.n[1] - Math.max(g.p, 0)) / T.p * 1.5;
    return s * Math.pow(.75, c.cnt / c.step) * c.like * (eatenToday.has(c.k) ? .7 : 1);
  };
  // A fruit and a vegetable first, if those habits aren't done yet today.
  for (const tag of ['fruit', 'veg']) {
    const h = S.habits.find(x => x.food === tag && !x.archived);
    if (!h || !scheduled(h, dk) || (f.tags[tag] || []).length) continue;
    const best = cands.filter(c => c.tg.split(',').includes(tag)).sort((a, b) => score(b) - score(a))[0];
    if (best) take(best);
  }
  for (let i = 0; i < 18; i++) {
    if (g.p <= T.p * .03 && g.fib <= T.fib * .05 && g.kcal <= T.kcal * .06) break;
    let best = null, bs = .02;
    for (const c of cands) { const sc = score(c); if (sc > bs) { bs = sc; best = c; } }
    if (!best) break;
    take(best);
  }
  const items = pick.map(c => ({k: c.k, u: c.u, q: c.cnt, e: mkEntry(c.food, c.cnt, c.u)})).sort((a, b) => b.e.n[1] - a.e.n[1]);
  return {items, T, after: {kcal: T.kcal - g.kcal, p: T.p - g.p, c: T.c - g.c, f: T.f - g.f, fib: T.fib - g.fib},
    met: f.p >= T.p * .97 && f.fib >= T.fib * .95 && f.kcal >= T.kcal * .94};
}
function renderPlan(dk) {
  if (dk !== todayKey()) return '';
  const P = foodPlan(dk), f = foodSum(dk), pct = (k) => Math.round(P.after[k] / P.T[k] * 100);
  if (P.met || !P.items.length) return `<div class="plan"><div class="plan-h"><b>Today’s needs</b></div><p class="help">Protein, fibre and calories are covered for today. Alhamdulillah.</p></div>`;
  return `<div class="plan">
    <div class="plan-h"><b>${f.n ? 'Still to eat for 100%' : 'Eat this today for 100%'}</b><span>Tap + to log it</span></div>
    ${P.items.map(x => `<div class="pl">
      <span class="pl-t"><b>${esc(x.e.nm)}</b><span>${esc(qtyText(x.e))}</span></span>
      <span class="pl-n"><b>${nfmt(x.e.n[1])}<small> g P</small></b><span>${nfmt(x.e.n[4])} g fibre · ${Math.round(x.e.n[0])} kcal</span></span>
      <button class="pl-add" data-act="food-again" data-k="${esc(x.k)}" data-q="${x.q}" data-u="${esc(x.u)}" aria-label="Log ${esc(x.e.nm)}">${icon('plus', 16)}</button>
    </div>`).join('')}
    <p class="plan-f">With these: protein ${pct('p')}%, fibre ${pct('fib')}%, carbs ${pct('c')}%, fat ${pct('f')}%, ${Math.round(P.after.kcal)} of ${P.T.kcal} kcal.</p>
  </div>`;
}
function renderFood(dk) {
  const f = foodSum(dk), T = nutTargets(), fl = dayLog(dk).food || [];
  const mac = [['p', 'Protein', T.p], ['c', 'Carbs', T.c], ['f', 'Fat', T.f], ['fib', 'Fibre', T.fib]];
  const rec = recentFoods(dk).filter(e => !fl.some(x => x.k === e.k && x.q === e.q && x.un === e.un)).slice(0, 6);
  const meals = MEALS.map(([m, name]) => {
    const es = fl.filter(e => (e.m || 'l') === m); if (!es.length) return '';
    return `<div class="meal"><div class="meal-h"><span>${name}</span><span>${Math.round(es.reduce((a, e) => a + e.n[0], 0))} kcal</span></div>${es.map(e => `
      <div class="fe"><button class="fe-t" data-act="food-edit" data-id="${e.id}"><b>${esc(e.nm)}</b><span>${esc(qtyText(e))}</span></button>
      <span class="fe-n">${e.w && !e.n[0] ? `<b>${e.w}<small> ml</small></b><span>water</span>` : `<b>${nfmt(e.n[1])}<small> g P</small></b><span>${Math.round(e.n[0])} kcal</span>`}</span>
      <button class="tx" data-act="food-del" data-id="${e.id}" aria-label="Remove ${esc(e.nm)}">${icon('x', 15)}</button></div>`).join('')}</div>`;
  }).join('');
  return `<section class="card food" id="foodCard">
    <div class="card-h"><h2>Food</h2><span class="sub">${fl.length ? `${fl.length} item${fl.length > 1 ? 's' : ''} today` : 'Type what you ate, I’ll do the maths'}</span></div>
    <div class="food-top">
      <div class="kcal c-work">${ring(96, 8, f.kcal / T.kcal)}<div class="val"><b class="num">${Math.round(f.kcal)}</b><span>of ${T.kcal}<br>kcal</span></div></div>
      <div class="macros">${mac.map(([k, l, t]) => `<div class="mac m-${k}"><div class="ml"><span>${l}</span><b class="num">${nfmt(f[k])}<small> / ${t} g</small></b></div><span class="bar"><i style="width:${clamp(f[k] / t, 0, 1) * 100}%"></i></span></div>`).join('')}</div>
    </div>
    <form class="food-add" data-form="food"><input id="foodIn" placeholder="3 eggs, 2 roti, 1 katori dal…" autocomplete="off" autocapitalize="off" enterkeyhint="done" aria-label="What did you eat or drink?"><button type="submit" aria-label="Add food">${icon('plus', 18)}</button></form>
    <div class="food-prev" id="foodPrev" aria-live="polite"></div>
    ${rec.length ? `<div class="chips food-rec">${rec.map(e => `<button class="chip" data-act="food-again" data-k="${esc(e.k)}" data-q="${e.q}" data-u="${esc(e.un)}">${icon('plus', 13)} ${esc(e.nm)} <em>${nfmt(e.q)} ${esc(unitWord(e.un, e.q))}</em></button>`).join('')}</div>` : ''}
    ${meals ? `<div class="meals">${meals}</div>` : `<p class="help" style="margin-top:12px">Try “2 glasses water”, “1 cucumber”, “200 g chicken” or “1 oats with milk”. Protein, fibre and water fill in their habits; fruit and veg tick themselves; junk and sugar count as a slip.</p>`}
    ${renderPlan(dk)}
  </section>`;
}
function openFoodEdit(dk, id) {
  const e = (dayLog(dk).food || []).find(x => x.id === id); if (!e) return;
  ui.fe = {dk, id, q: e.q, un: e.un, m: e.m || 'l'};
  const food = foodByKey(e.k);
  openSheet(() => {
    const units = food ? [...new Set([...Object.keys(food.u), ...(food.custom ? [] : ['g'])])] : [e.un];
    return `<div class="field"><label for="feQ">How much</label><div style="display:flex;gap:8px"><input id="feQ" class="inp" type="number" inputmode="decimal" step="any" data-fe="q" value="${ui.fe.q}" style="width:110px"><div class="chips" style="align-items:center">${units.map(u => `<button class="chip" data-act="fe-unit" data-v="${u}" aria-pressed="${ui.fe.un === u}">${esc(unitWord(u, 2))}</button>`).join('')}</div></div></div>
      <div class="field"><span class="fl">Meal</span><div class="seg">${MEALS.map(([m, n]) => `<button type="button" data-act="fe-meal" data-v="${m}" aria-pressed="${ui.fe.m === m}">${n}</button>`).join('')}</div></div>
      <div class="fe-sum" id="feSum"></div>
      <form data-form="fedit"><button class="btn">Save</button></form>
      <button class="btn danger" style="margin-top:8px" data-act="fe-del">Remove</button>`;
  }, {title: e.nm});
  foodEditPreview();
}
function foodEditEntry() {
  const fe = ui.fe, e = (dayLog(fe.dk).food || []).find(x => x.id === fe.id); if (!e) return null;
  const q = parseFloat(($('#feQ') || {}).value); fe.q = q > 0 ? q : e.q;
  const food = foodByKey(e.k);
  if (food) return {...mkEntry(food, fe.q, fe.un, 1, e), m: fe.m};
  const r = fe.q / e.q; return {...e, q: fe.q, g: Math.round(e.g * r), n: e.n.map(x => Math.round(x * r * 10) / 10), w: Math.round((e.w || 0) * r), m: fe.m};
}
function foodEditPreview() {
  const n = foodEditEntry(), box = $('#feSum'); if (!n || !box) return;
  box.innerHTML = [['Calories', Math.round(n.n[0]), 'kcal'], ['Protein', nfmt(n.n[1]), 'g'], ['Carbs', nfmt(n.n[2]), 'g'], ['Fat', nfmt(n.n[3]), 'g'], ['Fibre', nfmt(n.n[4]), 'g']].map(([l, v, u]) => `<div><b>${v}<small> ${u}</small></b><span>${l}</span></div>`).join('');
}
function foodEditSave() {
  const n = foodEditEntry(); if (!n) return;
  const dk = ui.fe.dk, l = S.log[dk] = {...dayLog(dk)};
  l.food = l.food.map(x => x.id === n.id ? n : x); l._u = Date.now(); save(); closeSheet();
}
function openFoodCustom(name) {
  ui.fc = {n: name.replace(/^[\d.\s]+/, '').trim(), tg: []};
  openSheet(() => `<p class="help" style="margin:-4px 0 14px">Add it once and Mizan will know it next time. Check the packet, or use your best estimate for one serving.</p>
    <form data-form="fcustom">
    <div class="field"><label>Name</label><input class="inp" name="n" value="${esc(ui.fc.n)}" maxlength="50" required></div>
    <div class="field"><label>One serving is a…</label><input class="inp" name="un" value="serving" maxlength="20" placeholder="serving, piece, bowl"></div>
    <div class="field"><span class="fl">Per serving</span><div class="inp-row" style="grid-template-columns:repeat(5,1fr)">${[['kcal', 'kcal'], ['p', 'Protein g'], ['c', 'Carbs g'], ['f', 'Fat g'], ['fib', 'Fibre g']].map(([k, l]) => `<div><label>${l}</label><input class="inp" name="${k}" type="number" inputmode="decimal" step="any" min="0" placeholder="0"></div>`).join('')}</div></div>
    <div class="field"><span class="fl">It counts as</span><div class="chips">${[['fruit', 'Fruit'], ['veg', 'Vegetable'], ['junk', 'Junk'], ['sugar', 'Added sugar'], ['w', 'Water']].map(([v, l]) => `<button type="button" class="chip" data-act="fc-tag" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>
    <button class="btn">Save and add 1 serving</button></form>`, {title: 'New food'});
}
function foodCustomSave() {
  const f = $('[data-form="fcustom"]'), fd = new FormData(f), n = String(fd.get('n') || '').trim();
  if (!n) { toast('Give it a name'); return; }
  const food = {id: uid(), n, un: (String(fd.get('un') || 'serving').trim().toLowerCase() || 'serving').replace(/\s+/g, ' '), d: ['kcal', 'p', 'c', 'f', 'fib'].map(k => Math.max(0, parseFloat(fd.get(k)) || 0)), tg: ui.fc.tg.join(','), u: Date.now()};
  S.foods.push(food); save(); closeSheet();
  const inp = $('#foodIn');
  if (inp) { inp.value = parseFood(inp.value).filter(p => !p.ok && fkey(p.src.replace(/^[\d.\s]+/, '')) !== fkey(n)).map(p => p.src).join(', '); }
  foodAdd([{food: foodByKey('c:' + food.id), q: 1}]);
  foodPreview();
}
function openMyFoods() {
  openSheet(() => `${S.foods.filter(f => !f.gone).map(f => `<div class="zedit-row"><div class="zn"><b>${esc(f.n)}</b><span>Per ${esc(f.un)}: ${Math.round(f.d[0])} kcal · ${nfmt(f.d[1])} g protein · ${nfmt(f.d[4])} g fibre</span></div><button class="mini-btn danger" data-act="mf-del" data-id="${f.id}" aria-label="Remove">${icon('trash', 16)}</button></div>`).join('') || '<p class="help">No foods of your own yet.</p>'}`, {title: 'My foods'});
}

/* ================= RENDER ================= */
function render() {
  if (!S) return;
  if (ui.tab === 'today') renderToday();
  if (ui.tab === 'dhikr') renderDhikr();
  if (ui.tab === 'progress') renderProgress();
  if (ui.tab === 'you') renderYou();
  if (ui.sheets.length) paintSheet();
  if (ui.rd) paintReader();
}
function go(tab) {
  ui.tab = tab;
  $$('.view').forEach(v => { v.hidden = v.id !== 'v-' + tab; });
  $$('.tab').forEach(t => t.dataset.tab === tab ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'));
  scrollTo(0, 0); render();
}
function applyTheme() {
  const t = S ? S.set.theme : 'light';
  document.documentElement.dataset.theme = t;
  lsSet('mizan.theme', t);
  const dim = t === 'dim' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('#themeColor').content = dim ? '#25282D' : '#F7F5F0';
}

/* ================= ACTIONS ================= */
function tick(id, dk) {
  const h = habit(id); if (!h) return;
  dk = dk || ui.date || todayKey();
  const v = val(h, dk);
  if (h.food && (h.type === 'check' || h.type === 'avoid') && !raw(h, dk) && v) {
    const from = foodSum(dk).tags[h.food].join(', ');
    toast(h.type === 'avoid' ? `Counted from your food log: ${from}. Remove it there to undo.` : `Done from your food log: ${from}`);
    return;
  }
  if (h.type === 'check') setVal(h, dk, v ? 0 : 1);
  else if (h.type === 'avoid') {
    setVal(h, dk, v ? 0 : 1);
    if (!v) toast(`Logged a slip on ${h.name}. Tomorrow is a fresh start.`, () => setVal(h, dk, 0));
  } else if (h.type === 'count') {
    if (prog(h, dk) >= 1) { const old = v; setVal(h, dk, 0); toast(`${h.name} reset`, () => setVal(h, dk, old)); }
    else setVal(h, dk, (+v || 0) + (+h.step || 1));
  } else if (h.type === 'limit') openDetail(id);
  render();
}
function togglePrayer(i) {
  const dk = ui.date || todayKey(), h = S.habits.find(x => x.type === 'prayer' && scheduled(x, dk)); if (!h) return;
  const T = ptimes(dk), k = PRAYERS[i][0];
  if (dk === todayKey() && new Date() < T[k] && !(val(h, dk) & (1 << i))) { toast(`${PRAYERS[i][1]} begins at ${clock(T[k], true)}`); return; }
  const v = (+val(h, dk) || 0) ^ (1 << i);
  setVal(h, dk, v);
  if (bits(v) === 5 && !(bits(v ^ (1 << i)) === 5)) toast('All five prayers today. Alhamdulillah.');
  render();
}
// The Tasks card renders twice (laptop column and phone column), so always use the form that was submitted.
function addTask(f) {
  const text = f.t.value.trim(); if (!text) return;
  const inPhone = !!f.closest('.hide-d');
  S.tasks.push({id: uid(), t: text, d: ui.date || todayKey(), done: null, u: Date.now()});
  save(); render(); buzz();
  setTimeout(() => $(`${inPhone ? '.hide-d' : '.hide-m'} .task-add input`)?.focus(), 0);
}

document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'task') addTask(f);
  if (f.dataset.form === 'food') foodSubmit();
  if (f.dataset.form === 'book') {
    const h = habit(f.dataset.id), fd = new FormData(f), dkk = ui.date || todayKey(), pg = parseInt(fd.get('page'), 10);
    h.book = {t: String(fd.get('t') || '').trim(), total: parseInt(fd.get('total'), 10) || 0, page: isNaN(pg) ? 0 : pg - (+val(h, dkk) || 0), from: dkk};
    h.u = Date.now(); save(); render(); toast('Book saved');
  }
  if (f.dataset.form === 'fcustom') foodCustomSave();
  if (f.dataset.form === 'fedit') foodEditSave();
  if (f.dataset.form === 'exact') {
    const h = habit(f.dataset.id), x = parseFloat($('#exact', f).value);
    if (h && !isNaN(x)) { setVal(h, ui.date || todayKey(), Math.max(0, x)); render(); }
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'foodIn') { foodPreview(); return; }
  if (t.dataset.fe != null) { foodEditPreview(); return; }
  if (t.dataset.f && ui.ed) ui.ed[t.dataset.f] = t.type === 'number' ? (t.value === '' ? '' : +t.value) : t.value;
  if (t.dataset.af && ui.ae) ui.ae[t.dataset.af] = t.value;
  if (t.dataset.zn && ui.zn) ui.zn[t.dataset.zn] = t.type === 'number' ? +t.value : t.value;
  if (t.dataset.zf) { const set = S.azkar.find(s => s.id === ui.zs); if (set) { set[t.dataset.zf] = t.value; set.u = Date.now(); save(); } }
});
document.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.amt) setTimeout(() => e.target.select(), 0); });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.amt) {
    const h = habit(t.dataset.amt), x = parseAmt(h, t.value);
    if (x == null) { toast(`Type a number, like ${h.unit === 'ml' ? '1.5 (litres) or 500 ml' : h.unit === 'min' ? '45 or 1h 20m' : h.unit === 'steps' ? '6500 or 6.5k' : '12'}`); t.value = amtStr(h, val(h, ui.date || todayKey())); return; }
    setVal(h, ui.date || todayKey(), x); render(); return;
  }
  const k = t.dataset.set; if (!k) return;
  const p = S.set.prayer;
  if (k === 'name') S.name = t.value.trim();
  else if (k === 'weight') {
    const w = +t.value; if (!(w > 20 && w < 300)) return;
    S.set.weight = w;
    const pro = S.habits.find(h => h.id === 'protein');
    if (pro) { pro.target = Math.round(w * 1.6 / 5) * 5; pro.u = Date.now(); toast(`Protein goal set to ${pro.target} g`); }
  }
  else if (k === 'method' || k === 'asr') p[k] = t.value;
  else if (k === 'hijri') S.set.hijri = +t.value;
  else if (k === 'goal') S.set.goal = +t.value;
  else if (k === 'tr' || k === 'en') S.set[k] = t.checked;
  else if (k.startsWith('nut-')) { const x = +t.value; if (!(x > 0)) return; S.set.nut[k.slice(4)] = x; }
  ptCache.clear(); save(); render();
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, dk = ui.date || todayKey();
  switch (act) {
    case 'close': closeSheet(); break;
    case 'tab': go(b.dataset.tab); break;
    case 'day': ui.date = b.dataset.k === todayKey() ? null : b.dataset.k; render(); break;
    case 'tick': tick(id); break;
    case 'inc': { const h = habit(id); setVal(h, dk, (+val(h, dk) || 0) + (+h.step || 1)); render(); break; }
    case 'dec': { const h = habit(id); setVal(h, dk, Math.max(0, (+val(h, dk) || 0) - (+h.step || 1))); render(); break; }
    case 'addv': { const h = habit(id); setVal(h, dk, (+val(h, dk) || 0) + +b.dataset.v); render(); break; }
    case 'setv': { const h = habit(id); setVal(h, dk, +b.dataset.v); render(); break; }
    case 'prayer': togglePrayer(+b.dataset.i); break;
    case 'detail': openDetail(id); break;
    case 'link': window.open(b.dataset.url, '_blank', 'noopener'); break;
    case 'surah': openSurah(+b.dataset.n, id); break;
    case 'hizb': openHizb(id); break;
    case 'q-close': closeQuran(); break;
    case 'q-size': ui.qsize = clamp((ui.qsize || 30) + +b.dataset.d * 3, 21, 45); lsSet('mizan.qsize', ui.qsize); $('#qreader')?.style.setProperty('--qs', ui.qsize + 'px'); break;
    case 'q-done': { const h = habit(id); if (h && !val(h, todayKey())) setVal(h, todayKey(), 1); closeQuran(); toast(`${h ? h.name : 'Reading'} done. May Allah accept it.`); break; }
    case 'zx': { const set = S.azkar.find(s => s.id === id); ui.zx[id] = !zOpen(set, dk, ui.tab === 'dhikr'); render(); break; }
    case 'zi-tick': zTick(id, +b.dataset.j, todayKey()); break;
    case 'zi-open': openReader(id, +b.dataset.j); break;
    case 'zr': zRound(id, +b.dataset.i, todayKey()); break;
    case 'food-focus': { if (ui.tab !== 'today') go('today'); const c = $('#foodCard'); c?.scrollIntoView({behavior: 'smooth', block: 'center'}); setTimeout(() => $('#foodIn')?.focus({preventScroll: true}), 350); break; }
    case 'food-again': foodAdd([{food: foodByKey(b.dataset.k), q: +b.dataset.q, unit: b.dataset.u}]); break;
    case 'food-pick': { const inp = $('#foodIn'); const parts = inp.value.split(','); parts[+b.dataset.j] = ' ' + b.dataset.v; inp.value = parts.join(',').trim(); foodPreview(); inp.focus(); break; }
    case 'food-del': foodDel(dk, id); break;
    case 'food-edit': openFoodEdit(dk, id); break;
    case 'food-custom': openFoodCustom(b.dataset.name || ''); break;
    case 'fc-tag': { ui.fc.tg = ui.fc.tg.includes(b.dataset.v) ? ui.fc.tg.filter(x => x !== b.dataset.v) : [...ui.fc.tg, b.dataset.v]; b.setAttribute('aria-pressed', ui.fc.tg.includes(b.dataset.v)); break; }
    case 'fe-unit': ui.fe.un = b.dataset.v; $$('[data-act="fe-unit"]').forEach(x => x.setAttribute('aria-pressed', x === b)); foodEditPreview(); break;
    case 'fe-del': foodDel(ui.fe.dk, ui.fe.id); closeSheet(); break;
    case 'fe-meal': ui.fe.m = b.dataset.v; $$('[data-act="fe-meal"]').forEach(x => x.setAttribute('aria-pressed', x === b)); break;
    case 'my-foods': openMyFoods(); break;
    case 'mf-del': { const f = S.foods.find(x => x.id === id); f.gone = 1; f.u = Date.now(); save(); paintSheet(); toast(`${f.n} removed from your foods`); break; }
    case 'area': ui.area = ui.area === id ? null : id; render(); break;
    case 'view': S.set.view = b.dataset.v; save(); render(); break;
    case 'slot': { const sec = b.closest('.slot'); ui.open[id] = sec.classList.contains('closed'); sec.classList.toggle('closed'); b.setAttribute('aria-expanded', ui.open[id]); break; }
    case 'task': { const t = S.tasks.find(x => x.id === id); t.done = t.done ? null : todayKey(); t.u = Date.now(); save(); buzz(); render(); break; }
    case 'task-del': { const i = S.tasks.findIndex(x => x.id === id), t = S.tasks[i]; S.tasks.splice(i, 1); S.del[id] = Date.now(); save(); render(); toast('Task deleted', () => { S.tasks.splice(i, 0, t); delete S.del[id]; save(); render(); }); break; }
    case 'new-habit': openEdit(null, b.dataset.area ? {area: b.dataset.area} : ui.area ? {area: ui.area} : null); break;
    case 'edit-habit': openEdit(id); break;
    case 'ed': ui.ed[b.dataset.k] = b.dataset.v; if (b.dataset.k === 'type' && (b.dataset.v === 'count' || b.dataset.v === 'limit') && !ui.ed.target) ui.ed.target = 10; paintSheet(); break;
    case 'ed-day': { const d = +b.dataset.d; let ds = ui.ed.days && ui.ed.days.length ? [...ui.ed.days] : [0, 1, 2, 3, 4, 5, 6]; ds = ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]; if (!ds.length) { toast('Pick at least one day'); break; } ui.ed.days = ds.sort(); paintSheet(); break; }
    case 'idea': { const i = IDEAS[+b.dataset.n]; ui.ed = {...ui.ed, ...clone(i)}; paintSheet(); break; }
    case 'ed-save': saveEdit(); break;
    case 'ed-archive': { const h = habit(ui.ed.id); h.archived = !h.archived; h.archivedOn = h.archived ? todayKey() : null; h.u = Date.now(); save(); closeSheet(); if (ui.sheets.length) closeSheet(); toast(h.archived ? `${h.name} paused` : `${h.name} resumed`); break; }
    case 'ed-delete': {
      const i = S.habits.findIndex(x => x.id === ui.ed.id), h = S.habits[i];
      S.habits.splice(i, 1); S.del[h.id] = Date.now(); save();
      closeSheet(); if (ui.sheets.length) closeSheet();
      toast(`${h.name} deleted`, () => { S.habits.splice(i, 0, h); delete S.del[h.id]; save(); render(); });
      break;
    }
    case 'move': {
      const h = habit(id), same = S.habits.filter(x => x.area === h.area), j = same.indexOf(h), o = same[j + +b.dataset.d]; if (!o) break;
      const a = S.habits.indexOf(h), c = S.habits.indexOf(o); [S.habits[a], S.habits[c]] = [S.habits[c], S.habits[a]];
      h.u = o.u = Date.now(); save(); render(); break;
    }
    case 'cal-mo': { const base = dateOf(ui.cal || dk.slice(0, 7) + '-01'); base.setMonth(base.getMonth() + +b.dataset.d); ui.cal = keyOf(base); paintSheet(); break; }
    case 'cal-day': { const h = habit(id); if (h.type === 'check' || h.type === 'avoid') { tick(id, b.dataset.k); paintSheet(); } else { ui.date = b.dataset.k === todayKey() ? null : b.dataset.k; while (ui.sheets.length) closeSheet(); if (ui.tab !== 'today') go('today'); } break; }
    case 'quran-set': {
      const cur = quranLabel(quranPos(dk)), ans = prompt('Which para are you on? (1–30). Add “b” for the second half, e.g. 7b', `${cur.para}${cur.half ? 'b' : ''}`);
      const m = ans && ans.trim().match(/^(\d{1,2})\s*(b)?$/i);
      if (m && +m[1] >= 1 && +m[1] <= 30) { S.quran = {pos: (+m[1] - 1) * 2 + (m[2] ? 1 : 0), from: dk}; save(); render(); }
      break;
    }
    case 'metric': ui.metric = id; render(); break;
    // dhikr
    case 'read': openReader(id); break;
    case 'rd-close': closeReader(); break;
    case 'rd-tap': readerCount(); break;
    case 'rd-fill': readerCount(true); break;
    case 'rd-reset': { const set = S.azkar.find(s => s.id === ui.rd.setId), z = clone(zState(todayKey(), set.id)); delete z.c[set.items[ui.rd.idx].id]; setZ(todayKey(), set.id, z); paintReader(); break; }
    case 'rd-prev': ui.rd.idx = Math.max(0, ui.rd.idx - 1); paintReader(); $('.rd-body')?.scrollTo(0, 0); break;
    case 'rd-next': { const set = S.azkar.find(s => s.id === ui.rd.setId); if (ui.rd.idx < set.items.length - 1) ui.rd.idx++; paintReader(); $('.rd-body')?.scrollTo(0, 0); break; }
    case 'rd-again': { const set = S.azkar.find(s => s.id === ui.rd.setId); if (!set.rounds) setZ(todayKey(), set.id, {c: {}, r: 0}); ui.rd.done = false; ui.rd.idx = 0; paintReader(); break; }
    case 'tasbih': { const l = S.log[todayKey()] = {...dayLog(todayKey())}; l['z:tasbih'] = (+l['z:tasbih'] || 0) + 1; l._u = Date.now(); save(); const n = ui.tasbihN; if (n && l['z:tasbih'] % n === 0) { buzz(); setTimeout(buzz, 120); } else buzz(); renderDhikr(); break; }
    case 'tasbih-n': ui.tasbihN = +b.dataset.n; lsSet('mizan.tasbihN', ui.tasbihN); renderDhikr(); break;
    case 'tasbih-reset': { const l = S.log[todayKey()] = {...dayLog(todayKey())}, old = l['z:tasbih']; delete l['z:tasbih']; l._u = Date.now(); save(); renderDhikr(); if (old) toast('Counter reset', () => { S.log[todayKey()]['z:tasbih'] = old; save(); renderDhikr(); }); break; }
    case 'z-edit': openZEdit(id); break;
    case 'new-set': { const set = {id: uid(), name: 'My dhikr', hint: 'Custom set', slot: 'day', items: [], u: Date.now()}; S.azkar.push(set); save(); render(); openZEdit(set.id); setTimeout(() => $('#zsName')?.select(), 350); break; }
    case 'zi-del': { const set = S.azkar.find(s => s.id === ui.zs); set.items.splice(+b.dataset.j, 1); set.u = Date.now(); save(); paintSheet(); break; }
    case 'zi-move': { const set = S.azkar.find(s => s.id === ui.zs), j = +b.dataset.j; [set.items[j - 1], set.items[j]] = [set.items[j], set.items[j - 1]]; set.u = Date.now(); save(); paintSheet(); break; }
    case 'zi-n': { const set = S.azkar.find(s => s.id === ui.zs), it = set.items[+b.dataset.j], n = parseInt(prompt('How many times?', it.n), 10); if (n > 0 && n < 10000) { it.n = n; set.u = Date.now(); save(); paintSheet(); } break; }
    case 'zi-add': openZAdd(); break;
    case 'zi-lib': { const set = S.azkar.find(s => s.id === ui.zs); set.items.push({id: uid(), k: b.dataset.k, n: 1}); set.u = Date.now(); save(); closeSheet(); toast(`Added ${Z[b.dataset.k].t}`); break; }
    case 'zi-save': { const n = ui.zn; if (!(n.t || n.tr || n.ar)) { toast('Add a title or the words'); break; } const set = S.azkar.find(s => s.id === ui.zs); set.items.push({id: uid(), t: n.t || (n.tr || '').slice(0, 40), ar: n.ar, tr: n.tr, en: n.en, n: Math.max(1, +n.n || 1), src: n.src}); set.u = Date.now(); save(); closeSheet(); break; }
    case 'zs-reset': { if (!confirm('Restore the original dhikr in this set? Your changes to it will be lost.')) break; const d = DEFAULT_AZKAR.find(x => x.id === ui.zs), i = S.azkar.findIndex(s => s.id === ui.zs); S.azkar[i] = slimSet(d, Date.now()); save(); paintSheet(); break; }
    case 'zs-del': { if (!confirm('Delete this dhikr set?')) break; S.azkar = S.azkar.filter(s => s.id !== ui.zs); S.del[ui.zs] = Date.now(); save(); closeSheet(); if (ui.rd) closeReader(); break; }
    // areas
    case 'edit-area': openAreaEdit(id); break;
    case 'new-area': openAreaEdit(null); break;
    case 'ae-c': ui.ae.c = b.dataset.v; paintSheet(); break;
    case 'ae-save': {
      const a = ui.ae; a.name = (a.name || '').trim(); if (!a.name) { toast('Give it a name'); break; }
      a.u = Date.now();
      if (a.id) S.areas = S.areas.map(x => x.id === a.id ? a : x); else S.areas.push({...a, id: uid()});
      save(); closeSheet(); break;
    }
    case 'ae-del': {
      if (S.areas.length < 2) { toast('Keep at least one area'); break; }
      const a = ui.ae, to = S.areas.find(x => x.id !== a.id);
      if (!confirm(`Delete ${a.name}? Its habits move to ${to.name}.`)) break;
      S.habits.forEach(h => { if (h.area === a.id) { h.area = to.id; h.u = Date.now(); } });
      S.areas = S.areas.filter(x => x.id !== a.id); S.del[a.id] = Date.now(); if (ui.area === a.id) ui.area = null;
      save(); closeSheet(); break;
    }
    // settings
    case 'theme': S.set.theme = b.dataset.v; save(); applyTheme(); render(); break;
    case 'location': openLocation(); break;
    case 'city': { const c = Prayer.CITIES[+b.dataset.n]; Object.assign(S.set.prayer, {lat: c.lat, lng: c.lng, city: c.name}); ptCache.clear(); save(); closeSheet(); toast(`Prayer times for ${c.name}`); break; }
    case 'geo': locate(() => { closeSheet(); }); break;
    case 'export': exportData(); break;
    case 'import': $('#file').click(); break;
    case 'erase': {
      if (!confirm(sync.key ? 'Erase everything on this device AND the online copy? Export a backup first if you might need it.' : 'Erase everything on this device? Export a backup first if you might need it.')) break;
      if (sync.key) { api('DELETE').catch(() => {}); }
      lsSet(KEY, null); lsSet(RKEY, null); lsSet(DKEY, null); lsSet(SKEY, null); location.reload(); break;
    }
    case 'sync-open': openSync(); break;
    case 'sync-go': syncGo(); break;
    case 'sync-now': sync.state === 'badkey' ? openSync() : syncNow(); break;
    case 'sync-off': syncOff(); break;
    // onboarding
    case 'onb-city': ui.onbCity = +b.dataset.n; $$('[data-act="onb-city"]').forEach(x => x.setAttribute('aria-pressed', x === b)); break;
    case 'onb-geo': locate(null, true); break;
    case 'onb-go': finishOnboarding(); break;
    case 'onb-sync': openSync(); break;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.amt) { e.preventDefault(); e.target.blur(); return; }
  if (e.key === 'Escape' && $('#qreader')) { closeQuran(); return; }
  if (e.target.matches('input, textarea, select')) return;
  if (ui.rd && !ui.sheets.length) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!ui.rd.done) readerCount(); }
    else if (e.key === 'ArrowRight') $('[data-act="rd-next"]')?.click();
    else if (e.key === 'ArrowLeft') $('[data-act="rd-prev"]')?.click();
    else if (e.key === 'Escape') closeReader();
    return;
  }
  if (e.key === 'Escape' && ui.sheets.length) closeSheet();
  if (ui.tab === 'today' && !ui.sheets.length && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const t = todayKey(), cur = ui.date || t, nx = addDays(cur, e.key === 'ArrowLeft' ? -1 : 1);
    if (nx <= t && nx >= S.start) { ui.date = nx === t ? null : nx; render(); }
  }
});

/* ---------- location ---------- */
function openLocation() {
  openSheet(() => `<p class="help" style="margin:-4px 0 16px">Prayer times are calculated on your device from your location. Nothing is sent anywhere.</p>
    <button class="btn" data-act="geo">${icon('pin', 18)} Use my current location</button>
    <div class="fl" style="font-size:12.5px;font-weight:600;color:var(--ink2);margin:18px 0 8px">Or pick a city</div>
    <div class="chips">${Prayer.CITIES.map((c, n) => `<button class="chip" data-act="city" data-n="${n}" aria-pressed="${S.set.prayer.city === c.name}">${esc(c.name)}</button>`).join('')}</div>`, {title: 'Location'});
}
function locate(done, onb) {
  if (!navigator.geolocation) { toast('Location isn’t available in this browser'); return; }
  toast('Finding you…');
  navigator.geolocation.getCurrentPosition(pos => {
    const loc = {lat: +pos.coords.latitude.toFixed(4), lng: +pos.coords.longitude.toFixed(4), city: 'My location'};
    if (onb) { ui.onbLoc = loc; ui.onbCity = -1; $$('[data-act="onb-city"]').forEach(x => x.setAttribute('aria-pressed', 'false')); const g = $('[data-act="onb-geo"]'); if (g) { g.setAttribute('aria-pressed', 'true'); g.lastChild.textContent = ' Using my location'; } toast('Got it'); return; }
    Object.assign(S.set.prayer, loc); ptCache.clear(); save(); render(); toast('Prayer times updated for your location'); done && done();
  }, () => toast('Couldn’t get your location. Pick a city instead.'), {timeout: 12000, maximumAge: 6e5});
}

/* ---------- backup ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 1)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mizan-backup-${todayKey()}.json`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup saved');
}
$('#file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!s || !Array.isArray(s.habits) || !s.log) throw 0;
    if (!confirm('Replace everything here with this backup?')) return;
    S = migrate(s); save(); ptCache.clear(); applyTheme(); render(); toast('Backup restored');
  } catch (err) { toast('That file isn’t a Mizan backup'); }
});

/* ---------- onboarding ---------- */
function showOnboarding() {
  ui.onbCity = 0;
  const el = document.createElement('div'); el.className = 'onb'; el.id = 'onb';
  el.innerHTML = `<div class="onb-in">
    <div class="onb-mark">${MARK('var(--ink)')}</div>
    <h1>Mizan</h1>
    <p class="lede">A quiet tracker for the whole of you: salah and dhikr, body, mind, work and character. Small, steady deeds, kept in balance.</p>
    <div class="field"><label for="onbName">What should I call you?</label><input id="onbName" class="inp" placeholder="Your name" autocomplete="given-name"></div>
    <div class="field"><label for="onbW">Your weight <span style="font-weight:400;color:var(--ink3)">sets your protein goal</span></label><div style="display:flex;gap:8px;align-items:center"><input id="onbW" class="inp" type="number" inputmode="decimal" value="62" style="width:110px"><span style="color:var(--ink2)">kg</span></div></div>
    <div class="field"><span class="fl">Where are you? <span style="font-weight:400;color:var(--ink3)">for prayer times</span></span>
      <div class="chips city-chips"><button class="chip" data-act="onb-geo" aria-pressed="false">${icon('pin', 14)} Use my location</button>${Prayer.CITIES.map((c, n) => `<button class="chip" data-act="onb-city" data-n="${n}" aria-pressed="${n === 0}">${esc(c.name)}</button>`).join('')}</div></div>
    <button class="btn" data-act="onb-go" style="margin-top:26px">Begin, bismillah</button>
    <button class="btn ghost" data-act="onb-sync" style="margin-top:10px">${icon('cloud', 18)} I already use Mizan on another device</button>
    <p class="help" style="text-align:center;margin-top:18px">Everything stays on this device unless you turn on sync. You can change every habit later.</p>
  </div>`;
  document.body.append(el);
}
function finishOnboarding() {
  const name = $('#onbName').value.trim(), w = +$('#onbW').value || 62;
  const city = ui.onbCity >= 0 ? Prayer.CITIES[ui.onbCity] : null;
  const prayer = ui.onbLoc || (city ? {lat: city.lat, lng: city.lng, city: city.name} : {});
  S = freshState({name, weight: w, prayer});
  const pro = S.habits.find(h => h.id === 'protein'); if (pro) pro.target = Math.round(w * 1.6 / 5) * 5;
  save(); $('#onb').remove(); start();
}

/* ---------- cloud sync (api/sync.js) ---------- */
const SKEY = 'mizan.key', RKEY = 'mizan.rev', DKEY = 'mizan.dirty';
const sync = {key: lsGet(SKEY), rev: +lsGet(RKEY) || 0, state: 'off', at: 0, busy: false, again: false, ver: 0, timer: null};
const isDirty = () => lsGet(DKEY) === '1';
function markDirty() { sync.ver++; lsSet(DKEY, '1'); }
function schedulePush() { markDirty(); clearTimeout(sync.timer); sync.timer = setTimeout(syncNow, 800); }
async function api(method, body) {
  const r = await fetch('api/sync', {method, cache: 'no-store', headers: {'Content-Type': 'application/json', 'x-mizan-key': sync.key}, body: body ? JSON.stringify(body) : undefined});
  let json = null; try { json = await r.json(); } catch (e) {}
  if (!json) throw new Error('unavailable');
  return {status: r.status, json};
}
// Combine two copies: newest version of each item wins, per-day logs merge by the newer day, deletions stick.
function merge(a, b) {
  a = migrate(clone(a)); b = migrate(clone(b));
  const cutoff = Date.now() - 180 * 864e5, del = {};
  for (const [id, t] of Object.entries({...a.del, ...b.del})) if (t > cutoff) del[id] = t;
  const newer = (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
  const byId = (xs, ys, order) => {
    const m = new Map(xs.map(x => [x.id, x]));
    for (const y of ys) { const x = m.get(y.id); if (!x || (y.u || 0) > (x.u || 0)) m.set(y.id, y); }
    const ord = order.map(x => x.id);
    return [...m.values()].filter(x => !del[x.id]).sort((x, y) => { const i = ord.indexOf(x.id), j = ord.indexOf(y.id); return (i < 0 ? 1e9 : i) - (j < 0 ? 1e9 : j); });
  };
  const log = {...a.log};
  for (const [k, d] of Object.entries(b.log)) if (!log[k] || (d._u || 0) > (log[k]._u || 0)) log[k] = d;
  return {...newer, habits: byId(a.habits, b.habits, newer.habits), areas: byId(a.areas, b.areas, newer.areas), azkar: byId(a.azkar, b.azkar, newer.azkar),
    tasks: byId(a.tasks, b.tasks, newer.tasks), foods: byId(a.foods, b.foods, newer.foods), log, del, start: a.start < b.start ? a.start : b.start, updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0)};
}
async function syncNow() {
  if (!sync.key) return;
  if (sync.busy) { sync.again = true; return; }
  sync.busy = true; setSync('syncing');
  try {
    for (let i = 0; i < 3; i++) {
      const g = await api('GET');
      if (g.status === 401) return setSync('badkey');
      if (g.status === 503) return setSync('nostore');
      if (g.status !== 200 && g.status !== 404) throw new Error('server');
      const remote = g.status === 200 ? g.json : null;
      if (remote && remote.rev !== sync.rev) {
        S = S && isDirty() ? merge(S, remote.data) : migrate(remote.data);
        writeLocal(); sync.rev = remote.rev; lsSet(RKEY, sync.rev); ptCache.clear();
        if (!ui.rd && !ui.sheets.length) { applyTheme(); render(); }
      }
      if (!S || !isDirty()) break;
      const sent = sync.ver;
      const p = await api('PUT', {base: remote ? remote.rev : 0, data: S});
      if (p.status === 409) continue;
      if (p.status === 401) return setSync('badkey');
      if (p.status !== 200) throw new Error('server');
      sync.rev = p.json.rev; lsSet(RKEY, sync.rev);
      if (sync.ver === sent) lsSet(DKEY, null);
      break;
    }
    sync.at = Date.now(); setSync('ok');
  } catch (e) {
    setSync(e.message === 'unavailable' ? 'nostore' : 'offline');
  } finally {
    sync.busy = false;
    if (sync.again) { sync.again = false; syncNow(); }
  }
}
function setSync(s) { sync.state = s; if (S && ui.tab === 'you' && !ui.sheets.length) renderYou(); }
function syncLabel() {
  const ago = () => { const s = (Date.now() - sync.at) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : clock(new Date(sync.at), true); };
  return {ok: `Synced ${ago()}`, syncing: 'Syncing…', offline: 'Offline. Syncs when you’re back online', badkey: 'Passcode doesn’t match. Tap to fix', nostore: 'Cloud storage isn’t connected yet', off: 'Off'}[sync.state];
}
function openSync() {
  openSheet(() => `<p class="help" style="margin:-4px 0 16px">Choose a passcode (6+ characters). Enter the same one on your phone and laptop and they’ll share the same data.</p>
    <div class="field"><input id="syncKey" class="inp" type="password" placeholder="Passcode" autocomplete="current-password" minlength="6"></div>
    <p class="help" id="syncMsg" style="min-height:18px;margin:-6px 0 12px"></p>
    <button class="btn" id="syncBtn" data-act="sync-go">Turn on sync</button>`, {title: 'Sync'});
  setTimeout(() => $('#syncKey')?.focus(), 350);
}
function syncMsg(t, err) { const m = $('#syncMsg'); if (m) { m.textContent = t; m.style.color = err ? 'var(--bad)' : ''; } }
async function syncGo() {
  const k = $('#syncKey').value.trim();
  if (k.length < 6) { syncMsg('Use at least 6 characters.', true); return; }
  const btn = $('#syncBtn'); btn.disabled = true; syncMsg('Connecting…');
  sync.key = k; sync.rev = 0;
  if (S) markDirty();
  await syncNow();
  btn.disabled = false;
  if (sync.state === 'ok' && S) {
    lsSet(SKEY, k); lsSet(RKEY, sync.rev);
    closeSheet(); if ($('#onb')) { $('#onb').remove(); start(); }
    toast('Sync is on'); return;
  }
  const st = sync.state;
  sync.key = null; sync.state = 'off'; lsSet(RKEY, null);
  syncMsg({ok: 'Nothing is saved with this passcode yet. Set up Mizan on one device first, then turn on sync there.', badkey: 'That passcode doesn’t match.', nostore: 'Cloud storage isn’t connected on Vercel yet.', offline: 'Couldn’t reach the server. Check your connection.'}[st] || 'Something went wrong. Try again.', true);
}
function syncOff() {
  if (!confirm('Turn off sync on this device? Your data stays here and online.')) return;
  sync.key = null; sync.state = 'off'; lsSet(SKEY, null); lsSet(RKEY, null); lsSet(DKEY, null);
  renderYou(); toast('Sync is off on this device');
}

/* ---------- boot ---------- */
let lastKey = null;
function heartbeat() {
  if (!S) return;
  const k = todayKey();
  if (lastKey && k !== lastKey && !ui.date) { render(); }
  else if (ui.tab === 'today' && !ui.sheets.length && !ui.rd && !$('.row.just')) { const sy = $('.sky'); if (sy && !ui.date) { const tmp = document.createElement('div'); tmp.innerHTML = renderSky(k); if (tmp.firstElementChild) sy.replaceWith(tmp.firstElementChild); } }
  lastKey = k;
}
function start() {
  applyTheme();
  ui.tasbihN = lsGet('mizan.tasbihN') != null ? +lsGet('mizan.tasbihN') : 33;
  ui.qsize = +lsGet('mizan.qsize') || 30;
  $('.tabbar').hidden = false;
  go('today'); lastKey = todayKey();
  setInterval(heartbeat, 30000);
}
document.querySelector('.rail-brand').innerHTML = MARK('var(--ink)');
$$('.tab').forEach(t => { t.innerHTML = icon(t.dataset.tab, 24) + `<span>${t.dataset.label}</span>`; t.dataset.act = 'tab'; });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => S && applyTheme());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S) { heartbeat(); if (sync.key) syncNow(); } });
window.addEventListener('online', () => { if (sync.key) syncNow(); });
if (S) { start(); if (sync.key) syncNow(); } else { $('.tabbar').hidden = true; showOnboarding(); }
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
