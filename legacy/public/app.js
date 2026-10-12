// Stepwise — single-page app (vanilla JS, no build step)
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '£' + Number(n || 0).toFixed(2);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const initials = (n) => String(n || '?').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const LETTERS = 'ABCDEFGH';
const TERMS = ['Autumn', 'Spring', 'Summer'];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

// ---------- API ----------
async function api(method, url, body) {
  const r = await fetch(url, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; }
  return j;
}

// ---------- state ----------
const S = { me: null, children: [], wallet: null, cur: null, childId: store.get('childId', null), subject: store.get('subject', 'maths'), timers: [] };
const theme = store.get('theme', null);
if (theme) document.documentElement.dataset.theme = theme;

async function loadMe() {
  try { const r = await api('GET', '/api/me'); S.me = r.user; S.children = r.children; S.wallet = r.wallet; }
  catch { S.me = null; S.children = []; S.wallet = null; }
  if (S.me?.role === 'student') S.childId = S.me.id;
  else if (S.children.length && !S.children.some((c) => c.id === S.childId)) S.childId = S.children[0].id;
  else if (!S.children.length) S.childId = null;
  store.set('childId', S.childId);
}
async function loadCurriculum() { if (!S.cur) S.cur = await api('GET', '/api/curriculum'); return S.cur; }
const child = () => S.children.find((c) => c.id === S.childId) || null;
const subjects = () => S.cur.subjects;
const subjectInfo = (id) => S.cur.subjects.find((s) => s.id === id) || S.cur.subjects[0];
const enrolled = (c) => { const ids = c?.subjects?.length ? c.subjects : S.cur.subjects.map((s) => s.id); return S.cur.subjects.filter((s) => ids.includes(s.id)); };
function curSubject() {
  const c = child(); const list = c ? enrolled(c) : S.cur.subjects;
  if (!list.some((s) => s.id === S.subject)) S.subject = list[0]?.id || 'maths';
  return subjectInfo(S.subject);
}
const strand = (id) => S.cur.strands.find((s) => s.id === id) || { color: '#3b6cf6', name: id, icon: '•' };
const topicOfStyle = (styleId) => S.cur.topics.find((t) => t.styles.some((s) => s.id === styleId));
const topicsOf = (subject) => S.cur.topics.filter((t) => t.subject === subject);
const shortName = (n) => String(n).split(/[,&(]/)[0].replace(/^The /, '').trim().split(' ').slice(0, 2).join(' ');
const tierOn = (subj) => subjectInfo(subj)?.tiers;
const targetOf = (c, subj) => (c.targets && c.targets[subj]) || c.targetGrade || 7;

// ---------- UI helpers ----------
function toast(msg, kind = '') {
  const el = document.createElement('div'); el.className = `toast ${kind}`; el.textContent = msg;
  $('#toast-root').appendChild(el); setTimeout(() => el.remove(), 3600);
}
function modal(html, { wide = false, onMount, onClose } = {}) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-bg"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  const bg = $('.modal-bg', root);
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', close));
  onMount && onMount($('.modal', root), close);
  return close;
}
function confirmBox(title, body, { ok = 'Confirm', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    modal(`<h2>${title}</h2><p class="muted">${body}</p><div class="row" style="justify-content:flex-end;margin-top:22px">
      <button class="btn ghost" data-close>Cancel</button><button class="btn ${danger ? 'danger' : ''}" id="cf-ok">${ok}</button></div>`, {
      onMount: (m, close) => { $('#cf-ok', m).onclick = () => { done = true; close(); resolve(true); }; },
      onClose: () => { if (!done) resolve(false); },
    });
  });
}
function confetti(n = 90) {
  const colors = ['#3b6cf6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; c.style.animationDelay = Math.random() * .4 + 's';
    c.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}
function xpPop(n) { const el = document.createElement('div'); el.className = 'xp-pop'; el.textContent = `+${n} XP`; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
const SHOP_EMOJI = {};
function avatar(u, cls = '') {
  const eq = u?.equipped || {};
  const em = eq.avatar && SHOP_EMOJI[eq.avatar];
  const bg = eq.background && SHOP_EMOJI[eq.background];
  return `<span class="avatar ${cls}" style="background:${bg || esc(u?.avatarColor || '#3b6cf6')}">${em ? `<span style="font-size:1.25em">${em}</span>` : esc(initials(u?.name))}</span>`;
}
const gradeLabel = (g) => (g == null ? '–' : g);
const coin = (n) => `<span class="coin">${n}</span>`;

// Reward celebrations — shown one after another.
let rewardQueue = []; let rewardOpen = false;
function celebrate(events) {
  if (!events || !events.length) return;
  rewardQueue.push(...events);
  if (!rewardOpen) nextReward();
}
function nextReward() {
  const ev = rewardQueue.shift(); if (!ev) { rewardOpen = false; return; }
  rewardOpen = true; confetti(ev.type === 'badge' ? 60 : 110);
  modal(`<div class="reward-modal"><div class="big">${ev.icon || '🎉'}</div><h2 style="margin-top:14px">${esc(ev.title)}</h2><p class="muted">${esc(ev.text || '')}</p>
    <div class="row" style="justify-content:center;margin-top:20px">${ev.certId ? `<a class="btn ghost" href="#/app/certificate/${ev.certId}" data-close>View certificate</a>` : ''}<button class="btn" data-close>${rewardQueue.length ? 'Next' : 'Awesome!'}</button></div></div>`,
  { onClose: () => setTimeout(nextReward, 150) });
}

const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  map: '<path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15"/>',
  chart: '<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  exam: '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM8 6H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2M9 13l2 2 4-4"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  repeat: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  ticket: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4zM13 5v2M13 17v2M13 11v2"/>',
  report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
  gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
};
const icon = (n, size = 19) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const logo = () => `<a class="logo" href="#/"><span class="logo-mark"><svg viewBox="0 0 32 32" width="20" height="20"><path d="M6 24h6v-6h6v-6h7" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Stepwise</a>`;

// ---------- charts (SVG) ----------
function donut(pct, color = '#3b6cf6', size = 120, label = '') {
  const r = 46, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct || 0));
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${v}%">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--panel-2)" stroke-width="12"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(c * v) / 100} ${c}" transform="rotate(-90 60 60)" style="transition:stroke-dasharray .8s"/>
    <text x="60" y="${label ? 60 : 67}" text-anchor="middle" font-size="24" font-weight="800" fill="currentColor">${label ? esc(label) : v + '%'}</text>
    ${label ? `<text x="60" y="80" text-anchor="middle" font-size="11" fill="var(--ink-3)">${v}%</text>` : ''}</svg>`;
}
function ringLevel(level) {
  const r = 30, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 76 76" width="76" height="76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="7"/>
    <circle cx="38" cy="38" r="${r}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * level.pct) / 100} ${c}" transform="rotate(-90 38 38)"/>
    <text x="38" y="35" text-anchor="middle" font-size="10" fill="#dbe5ff" font-weight="600">LEVEL</text><text x="38" y="52" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">${level.level}</text></svg>`;
}
function radar(items) {
  if (items.length < 3) return bars(items);
  const n = items.length, cx = 160, cy = 150, R = 100;
  const pt = (i, f) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
  const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${items.map((_, i) => pt(i, f).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
  const axes = items.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="var(--line)"/>`).join('');
  const poly = items.map((it, i) => pt(i, Math.max(0.04, (it.value || 0) / 100)).join(',')).join(' ');
  const labels = items.map((it, i) => { const [x, y] = pt(i, 1.2); const anchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
    return `<text x="${x}" y="${y + 4}" text-anchor="${anchor}" font-size="11" fill="var(--ink-2)" font-weight="600">${esc(it.short)}</text>`; }).join('');
  const dots = items.map((it, i) => { const [x, y] = pt(i, Math.max(0.04, (it.value || 0) / 100)); return `<circle cx="${x}" cy="${y}" r="4.5" fill="${it.color}" stroke="var(--panel)" stroke-width="2"><title>${esc(it.name)}: ${it.value == null ? 'no data' : it.value + '%'}</title></circle>`; }).join('');
  return `<svg viewBox="-20 0 360 300" width="100%" style="max-width:400px">${rings}${axes}<polygon points="${poly}" fill="rgba(59,108,246,.18)" stroke="#3b6cf6" stroke-width="2.5" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}
function bars(items) {
  return `<div style="width:100%">${items.map((x) => `<div style="margin:10px 0"><div class="row spread small"><b>${esc(x.name)}</b><span class="muted">${x.value == null ? '–' : x.value + '%'}</span></div><div class="bar"><i style="width:${x.value || 0}%;background:${x.color}"></i></div></div>`).join('')}</div>`;
}
function lineChart(points, { h = 200, max = 100, color = '#3b6cf6', suffix = '%' } = {}) {
  if (!points.length) return `<div class="empty small"><div class="e">📈</div>No exam results yet — take a checkpoint to see your trend.</div>`;
  const W = 560, H = h, pl = 36, pr = 16, pt = 18, pb = 30;
  const xs = (i) => pl + (points.length === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (points.length - 1));
  const ys = (v) => pt + (1 - v / max) * (H - pt - pb);
  const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${pl - 8}" y="${ys(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)">${v}</text>`).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(p.value)}`).join(' ');
  const area = `${path} L${xs(points.length - 1)},${ys(0)} L${xs(0)},${ys(0)} Z`;
  const dots = points.map((p, i) => `<circle cx="${xs(i)}" cy="${ys(p.value)}" r="5" fill="${color}" stroke="var(--panel)" stroke-width="2.5"><title>${esc(p.title || p.label)}: ${p.value}${suffix}</title></circle>
    ${points.length <= 12 ? `<text x="${xs(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${esc(p.label)}</text>` : ''}
    ${p.tag != null ? `<text x="${xs(i)}" y="${ys(p.value) - 12}" text-anchor="middle" font-size="12" font-weight="800" fill="${color}">${esc(p.tag)}</text>` : ''}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#lg)"/><path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
}
function barChart(data, { h = 200, color = '#3b6cf6', fmt = (v) => v } = {}) {
  const W = 600, H = h, pl = 40, pb = 26, pt = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pl - 10) / data.length;
  const bs = data.map((d, i) => { const bh = (d.value / max) * (H - pb - pt); const x = pl + i * bw + bw * 0.18;
    return `<rect x="${x}" y="${H - pb - bh}" width="${bw * 0.64}" height="${Math.max(bh, d.value ? 2 : 0)}" rx="3" fill="${color}"><title>${esc(d.label)}: ${esc(fmt(d.value))}</title></rect>
      ${i % Math.ceil(data.length / 8) === 0 ? `<text x="${x + bw * 0.32}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--ink-3)">${esc(d.short || d.label)}</text>` : ''}`; }).join('');
  const grid = [0, .5, 1].map((f) => `<line x1="${pl}" x2="${W}" y1="${H - pb - f * (H - pb - pt)}" y2="${H - pb - f * (H - pb - pt)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${pl - 6}" y="${H - pb - f * (H - pb - pt) + 4}" font-size="10.5" text-anchor="end" fill="var(--ink-3)">${esc(fmt(Math.round(max * f * 100) / 100))}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${bs}</svg>`;
}
function heatmap(days) {
  const max = Math.max(1, ...days.map((d) => d.n));
  const first = new Date(days[0].date).getUTCDay(); const pad = (first + 6) % 7;
  const cells = Array(pad).fill('<i style="visibility:hidden"></i>').concat(days.map((d) => {
    const f = d.n ? 0.25 + 0.75 * (d.n / max) : 0;
    return `<i title="${fmtDate(d.date)}: ${d.n} question${d.n === 1 ? '' : 's'}" style="${f ? `background:rgba(59,108,246,${f.toFixed(2)})` : ''}"></i>`;
  }));
  return `<div class="heatmap">${cells.join('')}</div>`;
}

// ---------- Answer widget (typed answers, multiple choice, multi-select, ordering) ----------
function answerWidget(q, { compact = false, value = '' } = {}) {
  if (q.options) {
    return `<div class="choices" data-kind="${q.ordering ? 'order' : q.multi ? 'multi' : 'single'}">${q.options.map((o, i) => `<button type="button" class="choice" data-i="${i}"><span class="l">${LETTERS[i]}</span><span class="grow">${o}</span><span class="ord"></span></button>`).join('')}</div>
      <input type="hidden" class="answer-value" value="${esc(value)}">${q.format ? `<div class="fmt">${esc(q.format)}</div>` : ''}`;
  }
  return `<div class="answer-row" ${compact ? 'style="margin-top:12px"' : ''}>${q.answerLabel ? `<span class="lbl">${q.answerLabel}</span>` : ''}<input class="answer-input answer-value" autocomplete="off" spellcheck="false" placeholder="Your answer" aria-label="Your answer" value="${esc(value)}">${q.unit ? `<span class="lbl">${esc(q.unit)}</span>` : ''}<span class="slot"></span></div>
    ${q.subjectMaths !== false ? `<div class="keypad">${['√', '²', '³', '^', '/', '(', ')', 'π', '×', '−', '≤', '≥', ':'].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div>` : ''}
    ${q.format ? `<div class="fmt">${esc(q.format)}</div>` : ''}`;
}
function bindAnswerWidget(root, onChange = () => {}) {
  const val = $('.answer-value', root);
  const box = $('.choices', root);
  if (box) {
    const kind = box.dataset.kind; let picked = val.value ? val.value.split('') : [];
    const paint = () => $$('.choice', box).forEach((b) => { const L = LETTERS[b.dataset.i]; const k = picked.indexOf(L); b.classList.toggle('sel', k >= 0); $('.ord', b).textContent = kind === 'order' && k >= 0 ? k + 1 : ''; });
    $$('.choice', box).forEach((b) => (b.onclick = () => {
      const L = LETTERS[b.dataset.i];
      if (kind === 'single') picked = [L];
      else if (picked.includes(L)) picked = picked.filter((x) => x !== L);
      else picked.push(L);
      val.value = kind === 'multi' ? picked.slice().sort().join('') : picked.join('');
      paint(); onChange(val.value);
    }));
    paint();
  } else {
    $$('[data-k]', root).forEach((b) => (b.onclick = () => { const k = b.dataset.k === '²' ? '^2' : b.dataset.k === '³' ? '^3' : b.dataset.k; const p = val.selectionStart ?? val.value.length; val.value = val.value.slice(0, p) + k + val.value.slice(val.selectionEnd ?? p); val.focus(); val.setSelectionRange(p + k.length, p + k.length); onChange(val.value); }));
    val.addEventListener('input', () => onChange(val.value));
  }
  return { get: () => val.value, focus: () => (box ? null : val.focus()), lock: () => { val.disabled = true; $$('.choice', root).forEach((b) => (b.disabled = true)); $('.keypad', root)?.classList.add('hidden'); }, el: val };
}
function markChoices(root, given, answer) {
  const right = String(answer || '').replace(/[^A-H]/g, ''); const g = String(given || '').toUpperCase();
  $$('.choice', root).forEach((b) => { const L = LETTERS[b.dataset.i]; if (right.includes(L)) b.classList.add('right'); else if (g.includes(L)) b.classList.add('wrong'); });
}

// ---------- Voice ----------
function speakable(html) {
  const d = document.createElement('div'); d.innerHTML = html;
  $$('svg', d).forEach((x) => x.remove());
  $$('.frac', d).forEach((f) => { const [a, b] = f.children; f.replaceWith(` ${a?.textContent} over ${b?.textContent} `); });
  $$('sup', d).forEach((s) => s.replaceWith(s.textContent === '2' ? ' squared ' : s.textContent === '3' ? ' cubed ' : ` to the power ${s.textContent} `));
  $$('.sqrt', d).forEach((s) => s.replaceWith(` root ${s.textContent} `));
  return d.textContent.replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/[−–]/g, ' minus ').replace(/=/g, ' equals ').replace(/π/g, ' pi ').replace(/√/g, ' root ').replace(/\s+/g, ' ').trim();
}
function speak(texts, onEach) {
  const synth = window.speechSynthesis; if (!synth) return toast('Voice is not supported in this browser');
  synth.cancel();
  const voice = synth.getVoices().find((v) => /en-GB/i.test(v.lang)) || synth.getVoices().find((v) => /^en/i.test(v.lang));
  texts.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t); if (voice) u.voice = voice; u.rate = 0.95; u.onstart = () => onEach && onEach(i); synth.speak(u); });
}

// ---------- Payments (Stripe Elements; demo mode without keys) ----------
let stripeLoad = null;
function loadStripe() {
  return (stripeLoad ||= new Promise((res, rej) => {
    if (window.Stripe) return res();
    const s = document.createElement('script'); s.src = 'https://js.stripe.com/v3/'; s.onload = res; s.onerror = () => { stripeLoad = null; rej(new Error('Could not load the payment form. Check your connection.')); };
    document.head.appendChild(s);
  }));
}
const stripeAppearance = () => {
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  return { theme: dark ? 'night' : 'stripe', variables: { colorPrimary: '#3b6cf6', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' } };
};

// £0 card check before the free trial lesson.
function cardCheck({ then } = {}) {
  return new Promise(async (resolve) => {
    if (S.me.role !== 'parent') { toast('Ask your parent to sign in and start the free lesson.', 'bad'); return resolve(false); }
    const cfg = await api('GET', '/api/billing/config');
    const finish = async (r, close) => { close(); await loadMe(); toast(r.message, r.trialAvailable ? 'good' : ''); resolve(true); then && then(r); };
    const head = `<div class="tiny" style="color:var(--brand);letter-spacing:.14em">Free first lesson</div><h2 style="margin-top:8px">Pay £0 to start your child’s first lesson</h2>
      <p class="muted">This quick check helps us prevent bots and misuse of free trials. Your card won’t be charged.</p>`;
    if (!cfg.live) {
      modal(`${head}<div class="demo-note" style="margin:16px 0">🧪 <b>Demo mode:</b> Stripe keys are not configured, so no card form is shown and nothing is collected. Set <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_PUBLISHABLE_KEY</code> to switch on the real £0 card check (Apple Pay, Link and cards).</div>
        <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="sim">Simulate card check</button></div>`, {
        onMount: (m, close) => { $('#sim', m).onclick = async () => { try { finish(await api('POST', '/api/billing/verify-card', { demo: true }), close); } catch (e) { toast(e.message, 'bad'); } }; },
        onClose: () => resolve(false),
      });
      return;
    }
    modal(`${head}<div id="xc" style="margin-top:16px"></div><div class="pay-or" id="xc-or">OR</div>
      <h3 style="margin-bottom:10px">Enter payment details</h3><div id="la"></div>
      <h3 style="margin:18px 0 10px">Save payment information</h3><div id="pe"><div class="spinner" style="margin:20px auto"></div></div>
      <div class="error" id="pe-err" style="margin-top:10px"></div>
      <button class="btn lg block" id="pe-go" style="margin-top:12px">Continue to start your free trial lesson</button>
      <p class="pay-small">Your card won’t be charged. It’s checked once so the free first lesson can only be claimed once per card. No subscription, no ongoing charges.</p>`, {
      onMount: async (m, close) => {
        try {
          await loadStripe();
          const stripe = window.Stripe(cfg.publishableKey);
          const elements = stripe.elements({ mode: 'setup', currency: 'gbp', appearance: stripeAppearance() });
          const xc = elements.create('expressCheckout', { buttonHeight: 50 });
          xc.mount($('#xc', m));
          xc.on('ready', ({ availablePaymentMethods }) => { if (!availablePaymentMethods) { $('#xc', m).classList.add('hidden'); $('#xc-or', m).classList.add('hidden'); } });
          elements.create('linkAuthentication', { defaultValues: { email: cfg.email || '' } }).mount($('#la', m));
          $('#pe', m).innerHTML = ''; elements.create('payment', { layout: 'tabs' }).mount($('#pe', m));
          store.set('pendingHash', location.hash);
          const run = async () => {
            const btn = $('#pe-go', m); btn.disabled = true; $('#pe-err', m).textContent = '';
            try {
              const sub = await elements.submit(); if (sub.error) throw sub.error;
              const { clientSecret } = await api('POST', '/api/billing/setup-intent');
              const { error, setupIntent } = await stripe.confirmSetup({ elements, clientSecret, confirmParams: { return_url: location.origin + '/' }, redirect: 'if_required' });
              if (error) throw error;
              finish(await api('POST', '/api/billing/verify-card', { setupIntentId: setupIntent.id }), close);
            } catch (e) { $('#pe-err', m).textContent = e.message; btn.disabled = false; }
          };
          xc.on('confirm', run); $('#pe-go', m).onclick = run;
        } catch (e) { $('#pe', m).innerHTML = `<div class="error">${esc(e.message)}</div>`; }
      },
      onClose: () => resolve(false),
    });
  });
}

function payForPack(pack) {
  return new Promise(async (resolve) => {
    const cfg = await api('GET', '/api/billing/config');
    const done = async (credits, close) => { close(); confetti(); toast(`Payment successful — ${pack.credits + pack.bonus} credits added`, 'good'); await loadMe(); resolve(true); render(); };
    const head = `<h2>Checkout</h2><p class="muted">${esc(pack.label)} · ${pack.credits + pack.bonus} lesson credits</p>
      <div class="card" style="box-shadow:none;background:var(--panel-2);border:0;margin:14px 0"><div class="row spread"><span>Total</span><b style="font-size:24px">${money(pack.price)}</b></div></div>`;
    if (!cfg.live) {
      modal(`${head}<div class="demo-note">🧪 <b>Demo mode:</b> no real payment is taken. Add your Stripe keys to accept cards, Apple Pay and Link.</div>
        <div class="row" style="justify-content:flex-end;margin-top:20px"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="confirm">Pay ${money(pack.price)} (demo)</button></div>`, {
        onMount: (m, close) => { $('#confirm', m).onclick = async (e) => { e.target.disabled = true; try { const r = await api('POST', '/api/billing/checkout', { packId: pack.id }); done(r.credits, close); } catch (err) { toast(err.message, 'bad'); e.target.disabled = false; } }; },
        onClose: () => resolve(false),
      });
      return;
    }
    modal(`${head}<div id="xc"></div><div class="pay-or" id="xc-or">OR</div><div id="la"></div><div id="pe" style="margin-top:12px"><div class="spinner" style="margin:20px auto"></div></div>
      <div class="error" id="pe-err" style="margin-top:10px"></div><button class="btn lg block" id="pe-go" style="margin-top:12px">Pay ${money(pack.price)}</button>
      <p class="pay-small">Payments are processed securely by Stripe. Card details never reach Stepwise.</p>`, {
      onMount: async (m, close) => {
        try {
          await loadStripe();
          const stripe = window.Stripe(cfg.publishableKey);
          const elements = stripe.elements({ mode: 'payment', amount: Math.round(pack.price * 100), currency: 'gbp', appearance: stripeAppearance() });
          const xc = elements.create('expressCheckout', { buttonHeight: 50 }); xc.mount($('#xc', m));
          xc.on('ready', ({ availablePaymentMethods }) => { if (!availablePaymentMethods) { $('#xc', m).classList.add('hidden'); $('#xc-or', m).classList.add('hidden'); } });
          elements.create('linkAuthentication', { defaultValues: { email: cfg.email || '' } }).mount($('#la', m));
          $('#pe', m).innerHTML = ''; elements.create('payment', { layout: 'tabs' }).mount($('#pe', m));
          store.set('pendingHash', location.hash);
          const run = async () => {
            const btn = $('#pe-go', m); btn.disabled = true; $('#pe-err', m).textContent = '';
            try {
              const sub = await elements.submit(); if (sub.error) throw sub.error;
              const { clientSecret } = await api('POST', '/api/billing/payment-intent', { packId: pack.id });
              const { error, paymentIntent } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: location.origin + '/' }, redirect: 'if_required' });
              if (error) throw error;
              const r = await api('POST', '/api/billing/confirm', { paymentIntentId: paymentIntent.id }); done(r.credits, close);
            } catch (e) { $('#pe-err', m).textContent = e.message; btn.disabled = false; }
          };
          xc.on('confirm', run); $('#pe-go', m).onclick = run;
        } catch (e) { $('#pe', m).innerHTML = `<div class="error">${esc(e.message)}</div>`; }
      },
      onClose: () => resolve(false),
    });
  });
}

// Returning from a Stripe redirect (e.g. 3-D Secure / bank app)
async function handleStripeReturn() {
  const p = new URLSearchParams(location.search);
  const si = p.get('setup_intent'), pi = p.get('payment_intent');
  if (!si && !pi) return;
  const hash = store.get('pendingHash', '#/app'); store.del('pendingHash');
  history.replaceState(null, '', '/' + hash);
  try {
    if (si) { const r = await api('POST', '/api/billing/verify-card', { setupIntentId: si }); toast(r.message, 'good'); }
    if (pi) { await api('POST', '/api/billing/confirm', { paymentIntentId: pi }); toast('Payment successful — credits added', 'good'); confetti(); }
  } catch (e) { toast(e.message, 'bad'); }
}

// ---------- Router ----------
const routes = [];
const on = (re, fn, opts = {}) => routes.push({ re, fn, ...opts });
async function render() {
  S.timers.forEach(clearInterval); S.timers = [];
  window.speechSynthesis?.cancel();
  if (!rewardOpen) $('#modal-root').innerHTML = '';
  const hash = location.hash.replace(/^#/, '') || '/';
  for (const r of routes) {
    const m = hash.match(r.re); if (!m) continue;
    if (r.auth && !S.me) { location.hash = '#/login'; return; }
    if (r.roles && !r.roles.includes(S.me.role)) { location.hash = S.me.role === 'admin' ? '#/admin' : '#/app'; return; }
    try { await loadCurriculum(); await r.fn(...m.slice(1)); }
    catch (e) { console.error(e); $('#app').innerHTML = `<div class="empty"><div class="e">⚠️</div>${esc(e.message)}<br><br><a href="#/app" class="btn">Back to dashboard</a></div>`; }
    window.scrollTo(0, 0);
    return;
  }
  location.hash = '#/';
}
window.addEventListener('hashchange', render);

// ---------- Public site ----------
on(/^\/$/, async () => {
  const styleCount = S.cur.topics.reduce((t, x) => t + x.styles.length, 0);
  const grads = ['linear-gradient(140deg,#0ea5a4,#2dd4bf)', 'linear-gradient(140deg,#3b6cf6,#5b8cff)', 'linear-gradient(140deg,#7c3aed,#a78bfa)', 'linear-gradient(140deg,#e2557d,#f59e0b)', 'linear-gradient(140deg,#0f172a,#334155)'];
  const goApp = S.me ? (S.me.role === 'admin' ? '#/admin' : '#/app') : '#/register';
  const yrs = S.cur.years.map((y) => ({ y, topics: S.cur.topics.filter((t) => t.year === y) }));
  $('#app').innerHTML = `
  <header class="site-nav">${logo()}
    <nav class="nav-links"><a href="#subjects" data-scroll>Subjects</a><a href="#journey" data-scroll>Programme</a><a href="#how" data-scroll>How it works</a><a href="#pricing" data-scroll>Pricing</a></nav>
    <div class="grow"></div>
    ${S.me ? `<a href="${goApp}">Dashboard</a>${avatar(S.me)}` : `<a href="#/login">Sign in</a><a class="btn sm" href="#/register" style="color:#fff;text-transform:none;letter-spacing:0">Start free</a>`}
  </header>
  <section class="hero"><div class="hero-inner">
    <div>
      <span class="pill" style="background:rgba(255,255,255,.1);color:#c7d2fe">Year 7 → GCSE · ${S.cur.subjects.length} subjects · Edexcel Maths & AQA</span>
      <h1 style="margin-top:18px">Start early.<br><span class="accent">Finish strong.</span></h1>
      <p class="lead">A five-year, step-by-step programme from Year 7 to the GCSE exams. Clear topic explanations, spoken worked examples, endless practice, spaced review of past questions, checkpoints, mock exams — and rewards that keep children coming back.</p>
      <div class="row wrap"><a class="btn lg" href="${goApp}">${S.me ? 'Go to dashboard' : 'Start your free lesson'}</a><a class="btn lg ghost" href="#subjects" data-scroll>See the subjects</a></div>
      <div class="hero-badges"><div><b>${S.cur.subjects.length}</b>subjects</div><div><b>${S.cur.topics.length}</b>topics</div><div><b>${styleCount}</b>question styles</div><div><b>£1</b>per lesson</div></div>
    </div>
    <div class="hero-card" id="hero-demo"><div class="spinner"></div></div>
  </div></section>

  <section class="section" id="subjects"><div class="section-inner">
    <h2>Every core GCSE subject</h2><p class="sub">Maths follows Edexcel 1MA1; the other subjects follow the AQA specifications. Years 7–9 build the foundations, Years 10–11 cover the full GCSE.</p>
    <div class="subject-grid">${S.cur.subjects.map((s) => `<div class="subject-card" style="background:linear-gradient(140deg,${s.color},color-mix(in srgb,${s.color} 55%,#0f172a))"><span class="e">${s.icon}</span><div><b>${esc(s.name)}</b><div class="small" style="opacity:.85">${esc(s.board)} ${esc(s.spec || '')} · ${topicsOf(s.id).length} topics</div></div></div>`).join('')}</div>
  </div></section>

  <section class="section alt" id="features"><div class="section-inner">
    <h2>Everything a GCSE year needs</h2><p class="sub">Built around the exam specifications and the way good tutors actually teach.</p>
    <div class="feature-grid">
      ${[
        ['📖', '#e8eeff', 'Clear topic explanations', 'Every topic has a full teaching page: key words, step-by-step methods, worked examples, common mistakes and exam tips.'],
        ['🎧', '#f3e8ff', 'Voice-led lessons', 'Each lesson opens with a spoken worked example, then ten questions with hints and full solutions.'],
        ['🔁', '#dcfce7', 'Spaced review', 'Past questions come back at the right time, and every mistake goes into a bank to retry until it sticks.'],
        ['📝', '#fef3c7', 'Tests, checkpoints & mocks', 'Topic tests, termly checkpoints and full GCSE mocks — with every wrong answer explained afterwards.'],
        ['🏆', '#fee2e2', 'Rewards that motivate', 'XP, levels, coins, a reward shop, badges, certificates, free lessons at milestones and goals set by parents.'],
        ['👨‍👩‍👧', '#e0f2fe', 'One family account', 'Up to six children, each with their own login, year, subjects and targets. One shared wallet at £1 per lesson.'],
      ].map(([e, bg, t, d]) => `<div class="feature"><div class="ic" style="background:${bg}">${e}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div></div></section>

  <section class="section" id="journey"><div class="section-inner">
    <h2>The Stepwise programme</h2><p class="sub">Each year has three terms of topics and ends with an exam. Students can always revisit earlier years.</p>
    <div class="journey" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${yrs.map(({ y, topics }, i) => `<div class="journey-card" style="background:${grads[i % grads.length]}">
      <div class="tag">${{ 7: 'First steps', 8: 'Foundations', 9: 'Building blocks', 10: 'GCSE core', 11: 'Exam year' }[y] || ''}</div><h3>Year ${y}</h3>
      <div class="small" style="opacity:.85">${topics.length} topics · ${new Set(topics.map((t) => t.subject)).size} subjects</div>
      <ul>${topics.filter((t) => t.subject === 'maths').slice(0, 4).map((t) => `<li>${esc(t.name)}</li>`).join('')}<li>+ ${Math.max(0, topics.length - 4)} more</li></ul></div>`).join('')}</div>
  </div></section>

  <section class="section alt" id="how"><div class="section-inner">
    <h2>How it works</h2><p class="sub">From sign-up to the first lesson in under two minutes.</p>
    <div class="steps3">
      <div><div class="n">1</div><h3>Create a parent account</h3><p>Add your child with their year group, subjects and target grades. They get their own login.</p></div>
      <div><div class="n">2</div><h3>Start a free trial lesson</h3><p>Your child jumps straight into a real lesson, completely free. A card is needed to sign up, but it won’t be charged.</p></div>
      <div><div class="n">3</div><h3>Keep learning, at your pace</h3><p>Carry on at £1 per lesson whenever it suits you. No subscription, credits never expire.</p></div>
    </div></div></section>

  <section class="section" id="pricing"><div class="section-inner">
    <h2>Simple pricing</h2><p class="sub">Every lesson, topic test and checkpoint costs £1. Review sessions are free. Every 10 lessons completed earns a free one.</p>
    <div class="price-grid">${S.cur.pricing.packs.map((p, i) => `<div class="price ${i === 1 ? 'featured' : ''}">${p.tag ? `<span class="pill brand ribbon">${esc(p.tag)}</span>` : ''}
      <div class="tiny muted">${esc(p.label)}</div><div class="amt">${money(p.price)}</div><div class="muted small">${p.credits + p.bonus} lesson credits</div>
      <ul><li>Any subject, any child in the family</li><li>Topic explanation + 10 questions per lesson</li><li>Free spaced-review sessions</li><li>Credits never expire</li></ul>
      <a class="btn block ${i === 1 ? '' : 'ghost'}" href="${goApp}">${S.me ? 'Go to dashboard' : 'Start with a free lesson'}</a></div>`).join('')}</div>
  </div></section>
  <footer class="footer"><div class="section-inner"><div>${logo()}<div style="margin-top:10px">GCSE success, one step at a time.</div></div><div>© ${new Date().getFullYear()} Stepwise · Maths: Edexcel 1MA1 · Other subjects: AQA</div></div></footer>`;
  $$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' }); }));
  const demoStyles = S.cur.topics.filter((t) => t.subject === 'maths' && t.year >= 9).flatMap((t) => t.styles.map((s) => s.id));
  const sid = demoStyles[Math.floor(Math.random() * demoStyles.length)];
  try {
    const d = await api('GET', `/api/curriculum/sample/${sid}`);
    const t = topicOfStyle(sid);
    $('#hero-demo').innerHTML = `<div class="row spread"><span class="tiny" style="color:#93c5fd">Worked example</span><span class="pill" style="background:rgba(255,255,255,.1);color:#cbd5e1">${esc(t.name)}</span></div>
      <div class="q">${d.example.html}</div>${d.example.diagram ? `<div class="diagram" style="color:#e2e8f0">${d.example.diagram}</div>` : ''}
      ${d.example.steps.slice(0, 4).map((s, i) => `<div class="step" style="animation-delay:${0.4 + i * 0.5}s"><i>${i + 1}</i><div>${s}</div></div>`).join('')}`;
  } catch { $('#hero-demo')?.remove(); }
});

function authPage(mode) {
  $('#app').innerHTML = `<div class="auth-wrap">
    <div class="auth-art">${logo()}
      <div><h2 style="font-size:40px;font-weight:800;line-height:1.1;letter-spacing:-.03em">Five years.<br>One clear path<br>to top grades.</h2>
      <p style="color:#a5b4fc;max-width:420px;font-size:17px">Lessons, reviews, tests and mocks from Year 7 to the GCSE exam hall.</p></div>
      <div class="small" style="color:#64748b">Students: sign in with the username your parent created.</div></div>
    <div class="auth-form"><div class="auth-card">
      <h1>${mode === 'login' ? 'Welcome back' : 'Create a parent account'}</h1>
      <p class="muted">${mode === 'login' ? 'Parents sign in with email; students with their username.' : 'Your child’s first lesson is free.'}</p>
      <div class="tabs"><button class="${mode === 'login' ? 'on' : ''}" onclick="location.hash='#/login'">Sign in</button><button class="${mode === 'register' ? 'on' : ''}" onclick="location.hash='#/register'">Create account</button></div>
      <form id="auth" class="stack">
        ${mode === 'register' ? '<label class="field"><span>Your name</span><input class="input" name="name" autocomplete="name" required></label>' : ''}
        <label class="field"><span>${mode === 'login' ? 'Email or username' : 'Email'}</span><input class="input" name="${mode === 'login' ? 'login' : 'email'}" autocomplete="${mode === 'login' ? 'username' : 'email'}" required></label>
        <label class="field"><span>Password</span><input class="input" type="password" name="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" minlength="${mode === 'login' ? 1 : 8}" required></label>
        <div class="error" id="auth-err"></div>
        <button class="btn block lg">${mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p class="small faint" style="margin-top:18px"><a href="#/">← Back to home</a></p>
    </div></div></div>`;
  $('#auth').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const btn = e.target.querySelector('button'); btn.disabled = true;
    try {
      await api('POST', mode === 'login' ? '/api/auth/login' : '/api/auth/register', body);
      await loadMe();
      location.hash = S.me.role === 'admin' ? '#/admin' : mode === 'register' ? '#/app/family?new=1' : '#/app';
    } catch (err) { $('#auth-err').textContent = err.message; btn.disabled = false; }
  });
}
on(/^\/login$/, () => (S.me ? (location.hash = S.me.role === 'admin' ? '#/admin' : '#/app') : authPage('login')));
on(/^\/register$/, () => (S.me ? (location.hash = '#/app') : authPage('register')));

// ---------- App shell ----------
function shell(active, title, inner, { admin = false, subjectBar = false } = {}) {
  const c = child();
  const isParent = S.me.role === 'parent', isStudent = S.me.role === 'student', isAdmin = S.me.role === 'admin';
  const nav = admin ? [
    ['admin', '#/admin', 'chart', 'Overview'], ['users', '#/admin/users', 'users', 'Users'], ['payments', '#/admin/payments', 'card', 'Payments'], ['tickets', '#/admin/tickets', 'ticket', 'Gift tickets'], ['curriculum', '#/admin/curriculum', 'book', 'Curriculum'],
  ] : [
    ['dashboard', '#/app', 'home', 'Dashboard'], ['planner', '#/app/planner', 'calendar', 'Planner & Tasks'], ['report', '#/app/report', 'report', 'Report & Plan'], ['roadmap', '#/app/roadmap', 'map', 'Roadmap & Learn'], ['progress', '#/app/progress', 'chart', 'Progress'],
    ['review', '#/app/review', 'repeat', 'Review'], ['exams', '#/app/exams', 'exam', 'Tests & Mocks'], ['rewards', '#/app/rewards', 'gift', 'Rewards'],
  ];
  const nav2 = admin ? [['settings', '#/app/settings', 'cog', 'Settings']] : [
    ...(isParent ? [['family', '#/app/family', 'users', 'Family'], ['billing', '#/app/billing', 'wallet', 'Billing']] : []),
    ['help', '#/app/help', 'help', 'Help'],
    ...(isAdmin ? [['admin', '#/admin', 'shield', 'Admin']] : []),
  ];
  const subj = subjectBar && c ? curSubject() : null;
  $('#app').innerHTML = `<div class="shell">
    <aside class="side" id="side">${logo()}
      <nav>${nav.map(([k, h, i, l]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${icon(i)}${l}</a>`).join('')}</nav>
      <div class="nav-label">${admin ? 'Switch' : 'Account'}</div>
      <nav>${nav2.map(([k, h, i, l]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${icon(i)}${l}</a>`).join('')}</nav>
      <div class="bottom">
        ${S.wallet ? `<div class="wallet">${S.wallet.freeAccess ? '<div class="tiny" style="color:#86efac">Free access</div><div style="color:#fff;font-weight:700;margin-top:4px">✨ Unlimited lessons</div>' : `<div class="tiny" style="color:#a5b4fc">Lesson credits</div><div class="row spread"><b>${S.wallet.credits}</b>${isParent ? '<a class="btn sm" href="#/app/billing">Top up</a>' : ''}</div>
          ${S.wallet.freeLessonAvailable ? '<div class="small" style="color:#86efac;margin-top:4px">🎁 First lesson free</div>' : ''}`}</div>` : ''}
        ${!admin && (isParent || isStudent) ? `<button class="child-switch" id="child-switch">${c ? avatar(c) : '<span class="avatar" style="background:#334155">+</span>'}
          <div class="grow"><div style="color:#fff;font-weight:600">${c ? esc(c.name) : 'Add a child'}</div><div class="small" style="color:#64748b">${c ? `Year ${c.yearGroup} · ${c.tier === 'F' ? 'Foundation' : 'Higher'}` : 'Get started'}${isParent ? ' · switch' : ''}</div></div>${isParent ? '›' : ''}</button>` : ''}
      </div>
    </aside>
    <div class="main">
      <header class="topbar"><button class="menu-btn" id="menu-btn" aria-label="Menu">${icon('menu', 22)}</button><h2>${esc(title)}</h2><div class="grow"></div>
        ${c && !admin ? `<a class="pill" href="#/app/rewards" title="Coins">${coin(c.coins || 0)}</a>` : ''}
        <div class="dropdown"><button class="row link" id="me-btn" style="color:var(--ink)">${avatar(S.me)}<span class="small" style="font-weight:600">${esc(S.me.name.split(' ')[0])}</span> ▾</button></div></header>
      <main class="content" id="content">${subj ? `<div class="subject-bar">${enrolled(c).map((s) => `<button class="subject-pill ${s.id === subj.id ? 'on' : ''}" style="--c:${s.color}" data-subject="${s.id}"><span class="e">${s.icon}</span>${esc(s.name)}</button>`).join('')}</div>` : ''}<div id="page">${inner}</div></main>
    </div></div>`;
  $$('[data-subject]').forEach((b) => (b.onclick = () => { S.subject = b.dataset.subject; store.set('subject', S.subject); render(); }));
  $('#menu-btn').onclick = () => { $('#side').classList.add('open'); const s = document.createElement('div'); s.className = 'scrim'; s.onclick = () => { $('#side').classList.remove('open'); s.remove(); }; document.body.appendChild(s); };
  $('#me-btn').onclick = (e) => {
    e.stopPropagation();
    const dd = $('#me-btn').parentElement; const ex = $('.dropdown-menu', dd); if (ex) return ex.remove();
    const t = document.documentElement.dataset.theme;
    dd.insertAdjacentHTML('beforeend', `<div class="dropdown-menu"><div style="padding:10px 12px"><b>${esc(S.me.name)}</b><div class="small muted">${esc(S.me.email || '@' + S.me.username)} · ${S.me.role}</div></div><hr>
      <a href="#/app/settings">${icon('cog', 16)} Settings</a>${isParent ? `<a href="#/app/billing">${icon('wallet', 16)} Billing</a>` : ''}
      <button id="theme-btn">🌓 Theme: ${t === 'dark' ? 'Dark' : t === 'light' ? 'Light' : 'System'}</button><hr><button id="logout-btn">↩ Sign out</button></div>`);
    $('#theme-btn').onclick = () => { const next = t === 'dark' ? 'light' : t === 'light' ? null : 'dark'; if (next) { document.documentElement.dataset.theme = next; store.set('theme', next); } else { delete document.documentElement.dataset.theme; store.del('theme'); } render(); };
    $('#logout-btn').onclick = async () => { await api('POST', '/api/auth/logout'); S.me = null; location.hash = '#/'; };
    setTimeout(() => document.addEventListener('click', function h() { $('.dropdown-menu')?.remove(); document.removeEventListener('click', h); }), 0);
  };
  const cs = $('#child-switch');
  if (cs && isParent) cs.onclick = () => childPicker();
}
const page = () => $('#page');

function childPicker() {
  modal(`<h2>Switch child</h2><p class="muted">Choose whose learning to view.</p><div class="stack" style="margin-top:18px">
    ${S.children.map((c) => `<button class="rec" data-id="${c.id}">${avatar(c)}<div class="grow"><b>${esc(c.name)}</b><div class="small muted">Year ${c.yearGroup} · ${c.tier === 'F' ? 'Foundation' : 'Higher'} · ${enrolled(c).length} subjects</div></div>${c.id === S.childId ? '<span class="pill good">Active</span>' : ''}</button>`).join('')}
    <button class="btn ghost block" id="add-c">+ Add a child</button></div>`, {
    onMount: (m, close) => {
      $$('[data-id]', m).forEach((b) => (b.onclick = () => { S.childId = b.dataset.id; store.set('childId', S.childId); close(); render(); }));
      $('#add-c', m).onclick = () => { close(); childForm(); };
    },
  });
}

function needChild() {
  if (child()) return false;
  if (S.me.role === 'admin') { location.hash = '#/admin'; return true; }
  shell('dashboard', 'Welcome', `<div class="card pad-lg empty"><div class="e">👋</div><h2 style="margin-bottom:8px">Add your first child</h2>
    <p class="muted" style="max-width:440px;margin:0 auto 20px">Tell us their year group, subjects and target grade — we’ll build their roadmap from Year 7 to the GCSE exams. Their first lesson is free.</p>
    <button class="btn lg" id="add-first">+ Add a child</button></div>`);
  $('#add-first').onclick = () => childForm();
  return true;
}

// ---------- Dashboard ----------
on(/^\/app$/, async () => {
  if (needChild()) return;
  const c = child(); const subj = curSubject();
  shell('dashboard', 'Dashboard', '<div class="spinner"></div>', { subjectBar: true });
  const o = await api('GET', `/api/students/${c.id}/overview?subject=${subj.id}`);
  Object.assign(c, o.student);
  const s = o.summary;
  const nextExam = o.exams.find((e) => e.recommended && !e.best && e.hasContent);
  const earned = s.badges.filter((b) => b.got).length;
  const gradeColor = s.predicted == null ? 'var(--ink)' : s.predicted >= s.targetGrade ? 'var(--good)' : 'var(--warn)';
  const trial = S.wallet && S.wallet.freeLessonAvailable && S.wallet.cardCheckRequired && !S.wallet.freeAccess && S.wallet.credits < 1 && s.lessonsCompleted === 0;
  const rec0 = o.recommendations[0];
  page().innerHTML = `
    ${trial && S.me.role === 'parent' ? `<div class="card trial-card" style="margin:0 0 22px;max-width:none"><div class="row wrap spread"><div style="max-width:620px"><div class="tiny">Free first lesson</div>
      <p style="font-size:17px;margin:8px 0 0">Pay £0 to start ${esc(c.name)}’s first lesson. This quick check helps us prevent bots and misuse of free trials. Your card won’t be charged.</p></div>
      <button class="btn lg" id="trial-go">Continue to start your free trial lesson</button></div></div>` : ''}
    <div class="card welcome" style="margin-bottom:22px;background:radial-gradient(600px 300px at 100% 0, rgba(255,255,255,.18), transparent 60%), linear-gradient(120deg, color-mix(in srgb, ${subj.color} 70%, #0f172a), ${subj.color})">
      <div class="level-ring">${ringLevel(s.level)}<div><h2>${S.me.role === 'student' ? 'Hi' : 'Learning for'} ${esc(c.name)} 👋</h2>
        <p>${subj.icon} ${esc(subj.name)} · Year ${c.yearGroup} · ${s.level.xp} XP · ${s.level.next - s.level.xp} XP to level ${s.level.level + 1}</p>
        <div class="row wrap" style="margin-top:10px;gap:18px"><span>🔥 <b>${s.streak}</b> day streak</span><span>📘 <b>${s.lessonsCompleted}</b> lessons</span><span>🏅 <b>${earned}</b> badges</span><span>🪙 <b>${s.coins}</b> coins</span></div></div></div>
      ${rec0 ? `<button class="btn lg" data-start="${rec0.styleId}">▶ ${rec0.reason === 'Needs practice' ? 'Practise' : 'Start'}: ${esc(rec0.name)}</button>` : ''}
    </div>
    <div id="approvals"></div><div id="missions" style="margin-bottom:22px"></div>
    ${o.review.dueCount || o.review.mistakeCount ? `<div class="card" style="margin-bottom:22px;border-left:4px solid #8b5cf6"><div class="row wrap spread"><div class="row"><span style="font-size:30px">🔁</span><div><b>Time to review!</b><div class="small muted">${o.review.dueCount} topic${o.review.dueCount === 1 ? '' : 's'} due for review · ${o.review.mistakeCount} past mistake${o.review.mistakeCount === 1 ? '' : 's'} to fix · review sessions are free</div></div></div>
      <div class="row"><a class="btn ghost" href="#/app/review">See all</a><button class="btn" id="quick-review">Start review</button></div></div></div>` : ''}
    <div class="kpis">
      <div class="card kpi"><div class="ico" style="background:var(--good-soft)">✅</div><div class="v">${s.correct}</div><div class="l">Correct answers</div></div>
      <div class="card kpi"><div class="ico" style="background:var(--brand-soft)">🎯</div><div class="v">${s.accuracy == null ? '–' : s.accuracy + '%'}</div><div class="l">Accuracy (in scope)</div></div>
      <div class="card kpi"><div class="ico" style="background:var(--warn-soft)">🧩</div><div class="v">${s.mastered}</div><div class="l">Styles mastered · ${s.coverage}% covered</div></div>
      <div class="card kpi"><div class="ico" style="background:#f3e8ff">🎓</div><div class="v" style="color:${gradeColor}">${gradeLabel(s.predicted)} <span class="faint" style="font-size:18px">/ target ${s.targetGrade}</span></div><div class="l">Predicted ${esc(subj.name)} grade</div></div>
    </div>
    <div class="grid-main">
      <div class="stack">
        <div class="card"><div class="card-head"><h3>${esc(subj.name)} exam results</h3><a href="#/app/exams" class="small">All tests →</a></div>
          ${lineChart(s.exams.map((e, i) => ({ label: `#${i + 1}`, title: e.name, value: e.pct, tag: e.grade })))}</div>
        <div class="card"><div class="card-head"><h3>All subjects</h3></div>${bars(o.overall.strands.filter((x) => enrolled(c).some((e) => e.id === x.id)).map((x) => ({ name: `${x.icon} ${x.name}`, value: x.accuracy, color: x.color })))}</div>
        <div class="card"><div class="card-head"><h3>Activity · last 12 weeks</h3><span class="small muted">${o.activity.reduce((t, d) => t + d.n, 0)} questions</span></div>${heatmap(o.activity)}</div>
      </div>
      <div class="stack">
        <div class="card"><div class="card-head"><h3>Recommended next</h3></div><div class="stack">
          ${o.recommendations.length ? o.recommendations.map((r) => { const t = topicOfStyle(r.styleId); const st = strand(t.strand);
            return `<button class="rec" data-start="${r.styleId}"><span class="dot" style="background:${st.color}">${esc(st.icon || '#')}</span><div class="grow"><b>${esc(r.name)}</b><div class="small muted">${esc(r.topic)} · Y${t.year}</div></div><span class="pill ${r.reason === 'Needs practice' ? 'warn' : 'brand'}">${r.reason}</span></button>`; }).join('')
            : '<div class="empty small">All caught up! Explore the roadmap.</div>'}</div></div>
        <div class="card"><div class="card-head"><h3>Strength by area</h3></div><div style="display:flex;justify-content:center">${radar(s.strands.map((x) => ({ name: x.name, short: shortName(x.name), value: x.accuracy, color: x.color })))}</div></div>
        ${o.goals.filter((g) => !g.achievedAt).length ? `<div class="card"><div class="card-head"><h3>🎯 Reward goals</h3><a class="small" href="#/app/rewards">View</a></div>${o.goals.filter((g) => !g.achievedAt).map((g) => `<div style="margin:10px 0"><div class="row spread small"><b>${esc(g.label)} ${g.target}</b><span class="muted">${g.progress}/${g.target}</span></div><div class="bar"><i style="width:${g.pct}%;background:#f59e0b"></i></div><div class="small muted" style="margin-top:4px">🎁 ${esc(g.reward)}</div></div>`).join('')}</div>` : ''}
        <div class="card"><div class="card-head"><h3>Next free lesson</h3>🎁</div><div class="small muted">Complete <b>${s.nextReward}</b> more lesson${s.nextReward === 1 ? '' : 's'} to earn a free lesson for the family wallet.</div>
          <div class="bar" style="margin-top:10px"><i style="width:${((10 - s.nextReward) / 10) * 100}%;background:var(--good)"></i></div></div>
        ${nextExam ? `<div class="card" style="border-left:4px solid var(--warn)"><div class="tiny" style="color:#b45309">Next checkpoint</div><h3 style="margin:6px 0">${esc(nextExam.name)}</h3>
          <p class="small muted" style="margin:0 0 14px">${nextExam.questions} questions · ${nextExam.minutes} minutes · 1 credit</p><a class="btn sm" href="#/app/exams">View exams</a></div>` : ''}
      </div>
    </div>`;
  bindStart();
  $('#quick-review')?.addEventListener('click', () => startReview({}));
  renderMissions($('#missions'), c); if (S.me.role === 'parent') renderApprovals($('#approvals'));
  $('#trial-go')?.addEventListener('click', async () => { if (await cardCheck()) { await loadMe(); if (rec0) startLesson(rec0.styleId); else render(); } });
  celebrate(o.rewards);
});

function bindStart(root = document) { $$('[data-start]', root).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); startLesson(b.dataset.start); })); }

async function startLesson(styleId) {
  const c = child(); if (!c) return childForm();
  const t = topicOfStyle(styleId); const st = t.styles.find((x) => x.id === styleId); const sub = subjectInfo(t.subject);
  const w = S.wallet || { credits: 0 };
  const freeAccess = w.freeAccess;
  const trial = !freeAccess && w.freeLessonAvailable && w.credits < 1;
  const can = freeAccess || w.credits >= 1 || trial;
  const priceLine = freeAccess ? '<span class="pill good">Free access</span>' : trial ? '<span class="pill good">FREE trial lesson</span>' : `1 credit · ${money(1)}`;
  modal(`<div class="tiny" style="color:${strand(t.strand).color}">${sub.icon} ${esc(sub.name)} · ${esc(strand(t.strand).name)} · Year ${t.year}</div><h2 style="margin-top:6px">${esc(st.name)}</h2>
    <p class="muted">${esc(t.name)} — a worked example${sub.id === 'maths' ? ' read aloud' : ''}, then 10 practice questions (plus 2 quick review questions from earlier topics). Up to 3 tries each, with hints and full explanations.</p>
    <div class="card" style="box-shadow:none;background:var(--panel-2);border:0;margin:18px 0"><div class="row spread"><span>Lesson for <b>${esc(c.name)}</b></span><b>${priceLine}</b></div>
      ${!freeAccess && !trial ? `<div class="small muted" style="margin-top:6px">Balance: ${w.credits} credit${w.credits === 1 ? '' : 's'}</div>` : ''}</div>
    ${can ? '' : `<div class="demo-note">${S.me.role === 'parent' ? 'You’re out of credits. Top up your wallet to start this lesson.' : 'Out of lesson credits — ask your parent to top up.'}</div>`}
    <div class="row wrap" style="justify-content:space-between;margin-top:22px"><a class="btn ghost" href="#/app/learn/${t.id}">📖 Read the topic first</a><div class="row"><button class="btn ghost" data-close>Cancel</button>
    ${can ? '<button class="btn" id="go">Start lesson</button>' : S.me.role === 'parent' ? '<a class="btn" href="#/app/billing">Top up</a>' : ''}</div></div>`, {
    onMount: (m, close) => {
      const go = $('#go', m); if (!go) return;
      go.onclick = async () => {
        go.disabled = true;
        try { const r = await api('POST', '/api/lessons', { studentId: c.id, styleId }); await loadMe(); close(); location.hash = `#/app/lesson/${r.lesson.id}`; }
        catch (e) {
          if (e.status === 428) { close(); if (await cardCheck()) startLesson(styleId); return; }
          toast(e.message, 'bad'); go.disabled = false;
        }
      };
    },
  });
}

async function startReview(opts) {
  const c = child();
  try { const r = await api('POST', '/api/reviews', { studentId: c.id, ...opts }); location.hash = `#/app/lesson/${r.lesson.id}`; }
  catch (e) { toast(e.message, 'bad'); }
}

// ---------- Roadmap ----------
on(/^\/app\/roadmap$/, async () => {
  if (needChild()) return;
  const c = child(); const subj = curSubject();
  shell('roadmap', 'Roadmap & Learn', '<div class="spinner"></div>', { subjectBar: true });
  const [{ styles, topicTests }, ex] = await Promise.all([api('GET', `/api/students/${c.id}/progress?subject=${subj.id}`), api('GET', `/api/students/${c.id}/exams?subject=${subj.id}`)]);
  const years = S.cur.years.filter((y) => topicsOf(subj.id).some((t) => t.year === y));
  const yKey = `roadmapYear:${subj.id}`;
  let year = Number(store.get(yKey, c.yearGroup)); if (!years.includes(year)) year = years.includes(c.yearGroup) ? c.yearGroup : years[0];
  const pctTopic = (t) => Math.round((t.styles.reduce((s, x) => s + Math.min(10, styles[x.id]?.done || 0), 0) / (t.styles.length * 10)) * 100);
  const yearPct = (y) => { const ts = topicsOf(subj.id).filter((t) => t.year === y); return ts.length ? Math.round(ts.reduce((s, t) => s + pctTopic(t), 0) / ts.length) : 0; };
  const examsY = ex.exams.filter((e) => e.year === year);
  page().innerHTML = `<div class="page-head"><h1>${subj.icon} ${esc(subj.name)} roadmap</h1><p>${esc(subj.board)} ${esc(subj.spec || '')} · Topics in teaching order, term by term. Tap a topic to read the explanation, start a lesson or take its test.</p></div>
    <div class="year-tabs">${years.map((y) => `<button class="year-tab ${y === year ? 'on' : ''}" data-y="${y}"><span class="tiny ${y === c.yearGroup ? '' : 'faint'}" style="${y === c.yearGroup ? 'color:var(--brand)' : ''}">${y === c.yearGroup ? 'Current year' : y < c.yearGroup ? 'Revisit' : 'Stretch'}</span><b>Year ${y}</b>
      <div class="bar thin" style="margin-top:8px"><i style="width:${yearPct(y)}%;background:${subj.color}"></i></div><span class="small muted">${yearPct(y)}% complete</span></button>`).join('')}</div>
    <div class="terms">${[1, 2, 3].map((term) => {
      const ts = topicsOf(subj.id).filter((t) => t.year === year && t.term === term);
      const exm = examsY.filter((e) => e.term === term);
      return `<div class="term-col"><h4><span>${TERMS[term - 1]} term</span><span>${ts.length} topics</span></h4>
        ${ts.map((t) => { const st = strand(t.strand); const p = pctTopic(t); const tt = topicTests[t.id];
          return `<button class="topic-card" style="--c:${st.color}" data-topic="${t.id}"><div class="row spread"><span class="tiny" style="color:${st.color}">${esc(shortName(st.name))}</span><span class="row" style="gap:6px">${tt?.best ? `<span class="pill good" title="Topic test">✓ ${tt.best.pct}%</span>` : ''}${t.tier === 'H' && tierOn(t.subject) ? '<span class="pill" title="Higher tier">H</span>' : ''}</span></div>
            <div class="t" style="margin:6px 0 10px">${esc(t.name)}</div><div class="bar thin"><i style="width:${p}%;background:${st.color}"></i></div>
            <div class="row spread small muted" style="margin-top:6px"><span>📖 ${t.styles.length} styles</span><span>${p}%</span></div></button>`; }).join('') || '<div class="faint small">No topics</div>'}
        ${exm.map((e) => `<a class="milestone" href="#/app/exams"><span style="font-size:22px">${e.kind === 'mock' ? '🎓' : '🏁'}</span><div class="grow"><b>${esc(e.name)}</b><div class="small muted">${e.questions} Qs · ${e.minutes} min</div></div>
          ${e.best ? `<span class="pill good">Grade ${e.best.grade}</span>` : '<span class="pill warn">Not taken</span>'}</a>`).join('')}</div>`; }).join('')}</div>`;
  $$('[data-y]').forEach((b) => (b.onclick = () => { store.set(yKey, Number(b.dataset.y)); render(); }));
  $$('[data-topic]').forEach((b) => (b.onclick = () => topicModal(b.dataset.topic, styles, topicTests)));
});

function topicModal(topicId, styles, topicTests = {}) {
  const t = S.cur.topics.find((x) => x.id === topicId); const st = strand(t.strand); const tt = topicTests[t.id];
  modal(`<div class="tiny" style="color:${st.color}">${esc(st.name)} · Year ${t.year} · ${TERMS[t.term - 1]} term ${t.tier === 'H' && tierOn(t.subject) ? '· Higher' : ''}</div>
    <h2 style="margin-top:6px">${esc(t.name)}</h2><p class="muted">${esc(t.summary || '')}</p>
    <div class="row wrap" style="margin:14px 0"><a class="btn" href="#/app/learn/${t.id}">📖 Learn this topic</a><button class="btn ghost" data-test="${t.id}">📝 Topic test · 15 Qs · 1 credit${tt?.best ? ` (best ${tt.best.pct}%)` : ''}</button></div>
    <div>${t.styles.map((s, i) => styleRow(s, i, styles[s.id])).join('')}</div>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-close>Close</button></div>`, { wide: true, onMount: (m) => { bindStart(m); bindTopicTest(m); } });
}
function bindTopicTest(root) { $$('[data-test]', root).forEach((b) => (b.onclick = () => startExam(`topic:${b.dataset.test}`, `${topicName(b.dataset.test)} — Topic Test`, 15, 25))); }
const topicName = (id) => S.cur.topics.find((t) => t.id === id)?.name || id;

function styleRow(s, i, r) {
  const status = r?.status || 'new';
  const sym = { new: i + 1, started: '◐', completed: '✓', mastered: '★' }[status];
  return `<div class="style-row"><div class="row"><span class="status-dot ${status}" title="${status}">${sym}</span><div class="nm"><span class="k">Style ${i + 1}:</span> ${esc(s.name)}</div></div>
    <div class="small muted">${Math.min(10, r?.done || 0)}/10 done, ${r?.correct || 0} correct, ${r?.skipped || 0} skipped</div>
    <button class="btn sm ${status === 'new' ? '' : 'soft'}" data-start="${s.id}">${status === 'new' ? 'Start' : status === 'started' ? 'Continue' : 'Practise again'}</button></div>`;
}

// ---------- Learn (topic explanation) ----------
on(/^\/app\/learn\/([\w-]+)$/, async (topicId) => {
  const t = S.cur.topics.find((x) => x.id === topicId); if (!t) throw new Error('Topic not found');
  if (child() && S.subject !== t.subject) { S.subject = t.subject; store.set('subject', t.subject); }
  const sub = subjectInfo(t.subject); const st = strand(t.strand);
  shell('roadmap', t.name, '<div class="spinner"></div>');
  const d = await api('GET', `/api/learn/${t.id}`);
  const L = d.content;
  const secs = L ? L.sections : [];
  page().innerHTML = `<div class="learn">
    <a class="small" href="#/app/roadmap">← ${esc(sub.name)} roadmap</a>
    <div class="learn-hero" style="margin-top:12px;background:linear-gradient(130deg,color-mix(in srgb,${st.color} 75%,#0f172a),${st.color})">
      <div class="tiny" style="opacity:.85">${sub.icon} ${esc(sub.name)} · ${esc(st.name)} · Year ${t.year} · ${TERMS[t.term - 1]} term${t.tier === 'H' && tierOn(t.subject) ? ' · Higher tier' : ''}</div>
      <h1>${esc(t.name)}</h1><div style="color:rgba(255,255,255,.9)" class="prose">${L ? L.overview : esc(t.summary || '')}</div>
      <div class="row wrap" style="margin-top:18px;position:relative;z-index:1"><button class="btn" style="background:#fff;color:#0f172a" id="listen">🔊 Listen</button>${L?.specRef || t.specRef ? `<span class="pill" style="background:rgba(255,255,255,.18);color:#fff">${esc(L?.specRef || t.specRef)}</span>` : ''}</div>
    </div>
    ${L ? `<div class="learn-toc">${['Objectives', 'Key words', ...secs.map((s) => s.title), 'Common mistakes', 'Exam tips', 'Practise'].map((x, i) => `<a href="javascript:void 0" data-go="sec-${i}">${esc(x)}</a>`).join('')}</div>
    <div class="grid-main" style="grid-template-columns:1fr 1fr;margin-bottom:18px">
      <div class="card learn-section" id="sec-0"><h3 style="margin-bottom:10px">🎯 By the end you can…</h3><ul class="tick-list">${L.objectives.map((o) => `<li>${o}</li>`).join('')}</ul></div>
      <div class="card learn-section" id="sec-1"><h3 style="margin-bottom:10px">🔑 Key words</h3><div class="kw-grid" style="grid-template-columns:1fr">${L.keyWords.map((k) => `<div class="kw"><b>${esc(k.term)}</b>${k.def}</div>`).join('')}</div></div>
    </div>
    ${secs.map((s, i) => `<div class="card learn-section" id="sec-${i + 2}"><h2><span class="n">${i + 1}</span>${esc(s.title)}</h2><div class="prose">${s.html}</div></div>`).join('')}
    <div class="grid-main" style="grid-template-columns:1fr 1fr">
      <div class="card learn-section" id="sec-${secs.length + 2}"><h3 style="margin-bottom:10px">⚠️ Common mistakes</h3><ul class="tick-list warn-list">${L.mistakes.map((o) => `<li>${o}</li>`).join('')}</ul></div>
      <div class="card learn-section" id="sec-${secs.length + 3}"><h3 style="margin-bottom:10px">⭐ Exam tips</h3><ul class="tick-list tip-list">${L.examTips.map((o) => `<li>${o}</li>`).join('')}</ul></div>
    </div>
    ${L.realLife ? `<div class="card" style="margin-top:18px"><b>🌍 In real life:</b> <span class="muted">${L.realLife}</span></div>` : ''}`
    : `<div class="card" style="margin-bottom:18px"><p class="muted" style="margin:0">The full explanation for this topic is being written. Meanwhile, here are the methods and live worked examples.</p></div>`}
    <h2 style="margin:28px 0 14px" id="sec-${secs.length + 4}">✍️ Live examples</h2>
    ${d.examples.map((x) => `<div class="card learn-section"><div class="tiny" style="color:${st.color}">${esc(x.styleName)}</div><p class="muted">${esc(x.intro)}</p>
      <div class="worked"><div class="wq">${x.html}${x.diagram ? `<div class="diagram">${x.diagram}</div>` : ''}${x.options ? `<ol type="A" style="margin:8px 0 0">${x.options.map((o) => `<li>${o}</li>`).join('')}</ol>` : ''}</div>
      <ol>${x.steps.map((s) => `<li>${s}</li>`).join('')}</ol><div class="wa">Answer: ${x.answerHtml}</div></div></div>`).join('')}
    <div class="card pad-lg" style="margin-top:20px;text-align:center"><h2>Ready to practise?</h2><p class="muted">Each lesson: worked example + 10 questions (1 credit). The topic test mixes every style (1 credit).</p>
      <div style="text-align:left;margin-top:12px">${t.styles.map((s, i) => styleRow(s, i, null)).join('')}</div>
      <button class="btn lg" style="margin-top:16px" data-test="${t.id}">📝 Take the topic test</button></div>
  </div>`;
  bindStart(page()); bindTopicTest(page());
  $$('[data-go]').forEach((a) => (a.onclick = () => document.getElementById(a.dataset.go)?.scrollIntoView({ behavior: 'smooth' })));
  $('#listen').onclick = () => speak([t.name, ...(L ? [speakable(L.overview), ...secs.map((s) => `${s.title}. ${speakable(s.html)}`)] : [])]);
  // fill progress into style rows
  if (child()) {
    const pr = await api('GET', `/api/students/${child().id}/progress?subject=${t.subject}`).catch(() => null);
    if (pr) { const box = page().querySelector('.card.pad-lg > div'); box.innerHTML = t.styles.map((s, i) => styleRow(s, i, pr.styles[s.id])).join(''); bindStart(box); }
  }
});

// ---------- Progress ----------
on(/^\/app\/progress$/, async () => {
  if (needChild()) return;
  const c = child(); const subj = curSubject();
  shell('progress', 'Progress', '<div class="spinner"></div>', { subjectBar: true });
  const { styles, summary: s, topicTests } = await api('GET', `/api/students/${c.id}/progress?subject=${subj.id}`);
  const f = store.get('progFilter', { year: c.yearGroup, status: 'all' });
  const years = S.cur.years.filter((y) => topicsOf(subj.id).some((t) => t.year === y));
  const draw = () => {
    const topics = topicsOf(subj.id).filter((t) => (f.year === 'all' || t.year === f.year));
    const match = (sid) => f.status === 'all' || (styles[sid]?.status || 'new') === f.status;
    $('#topics').innerHTML = S.cur.strands.filter((x) => x.subject === subj.id).map((st) => {
      const ts = topics.filter((t) => t.strand === st.id && t.styles.some((x) => match(x.id)));
      if (!ts.length) return '';
      return `<div class="strand-head"><i style="background:${st.color}"></i>${esc(st.name)}</div>` + ts.map((t) => {
        const done = t.styles.reduce((a, x) => a + Math.min(10, styles[x.id]?.done || 0), 0); const tt = topicTests[t.id];
        return `<div class="topic"><div class="topic-top"><div><h3>${esc(t.name)}</h3><span class="small muted">Year ${t.year} · ${TERMS[t.term - 1]} ${t.tier === 'H' && tierOn(t.subject) ? '· Higher' : ''}</span></div>
          <div class="row wrap"><span class="muted small">${done}/${t.styles.length * 10} questions</span><a class="btn sm ghost" href="#/app/learn/${t.id}">📖 Learn</a><button class="btn sm ghost" data-test="${t.id}">📝 Test${tt?.best ? ` · ${tt.best.pct}%` : ''}</button></div></div>
          <div class="bar"><i style="width:${(done / (t.styles.length * 10)) * 100}%;background:${st.color}"></i></div>
          <div style="margin-top:8px">${t.styles.map((x, i) => (match(x.id) ? styleRow(x, i, styles[x.id]) : '')).join('')}</div></div>`;
      }).join('');
    }).join('') || '<div class="empty"><div class="e">🔍</div>Nothing matches these filters.</div>';
    $$('[data-fy]').forEach((b) => b.classList.toggle('on', String(f.year) === b.dataset.fy));
    $$('[data-fs]').forEach((b) => b.classList.toggle('on', f.status === b.dataset.fs));
    bindStart($('#topics')); bindTopicTest($('#topics'));
  };
  page().innerHTML = `<div class="page-head"><h1>${S.me.role === 'student' ? 'Your' : esc(c.name) + '’s'} ${esc(subj.name)} progress</h1><p>Each topic is split into styles of question. A style is completed once 10 questions are done; mastered at 80%+ accuracy.</p></div>
    <div class="kpis">
      <div class="card kpi"><div class="v">${s.correct}</div><div class="l">Correct answers</div></div>
      <div class="card kpi"><div class="v">${s.incorrect}</div><div class="l">Incorrect attempts</div></div>
      <div class="card kpi"><div class="v" style="color:var(--brand)">${s.mastered}</div><div class="l">Styles mastered</div></div>
      <div class="card kpi"><div class="row">${donut(s.coverage, subj.color, 64)}<div class="l">of Year ${c.yearGroup} scope started</div></div></div>
    </div>
    <div class="filters"><span class="small muted" style="font-weight:600">Year</span>${['all', ...years].map((y) => `<button class="chip" data-fy="${y}">${y === 'all' ? 'All' : 'Y' + y}</button>`).join('')}
      <span style="width:12px"></span><span class="small muted" style="font-weight:600">Status</span>${[['all', 'All'], ['new', 'Not started'], ['started', 'In progress'], ['completed', 'Completed'], ['mastered', 'Mastered']].map(([k, l]) => `<button class="chip" data-fs="${k}">${l}</button>`).join('')}</div>
    <div id="topics"></div>`;
  $$('[data-fy]').forEach((b) => (b.onclick = () => { f.year = b.dataset.fy === 'all' ? 'all' : Number(b.dataset.fy); store.set('progFilter', f); draw(); }));
  $$('[data-fs]').forEach((b) => (b.onclick = () => { f.status = b.dataset.fs; store.set('progFilter', f); draw(); }));
  if (f.year !== 'all' && !years.includes(f.year)) f.year = 'all';
  draw();
});

// ---------- Review (spaced repetition + mistakes bank) ----------
on(/^\/app\/review$/, async () => {
  if (needChild()) return;
  const c = child();
  shell('review', 'Review', '<div class="spinner"></div>');
  const r = await api('GET', `/api/students/${c.id}/review`);
  const maxBox = Math.max(1, ...r.boxes);
  const boxNames = ['1 day', '2 days', '4 days', '1 week', '2 weeks', '1 month', '2 months'];
  page().innerHTML = `<div class="page-head"><h1>🔁 Review & retry</h1><p>Topics come back for a quick review just before you’d forget them, and every question you got wrong waits in your mistakes bank until you fix it. Review sessions are always free.</p></div>
    <div class="kpis">
      <div class="card kpi"><div class="v" style="color:#8b5cf6">${r.dueCount}</div><div class="l">Topics due for review</div></div>
      <div class="card kpi"><div class="v" style="color:var(--bad)">${r.mistakeCount}</div><div class="l">Mistakes to fix</div></div>
      <div class="card kpi"><div class="v">${r.tracked}</div><div class="l">Styles in your memory schedule</div></div>
      <div class="card kpi"><div class="v" style="color:var(--good)">${S.children.find((x) => x.id === c.id)?.mistakesFixed || 0}</div><div class="l">Mistakes fixed</div></div>
    </div>
    <div class="card pad-lg" style="margin-bottom:22px;background:linear-gradient(120deg,#7c3aed,#3b6cf6);color:#fff;border:0"><div class="row wrap spread"><div><h2 style="font-size:24px">Daily review</h2><p style="margin:6px 0 0;color:#e0e7ff">10 questions: your past mistakes first, then topics due for review, then a recap of earlier work. +3 XP bonus for every remembered answer.</p></div>
      <div class="row wrap"><button class="btn lg" style="background:#fff;color:#4c1d95" id="rv-mixed">▶ Start review</button>${r.mistakeCount ? '<button class="btn lg ghost" style="color:#fff;border-color:rgba(255,255,255,.4)" id="rv-mis">Fix my mistakes</button>' : ''}</div></div></div>
    <div class="grid-main">
      <div class="card"><div class="card-head"><h3>Mistakes bank</h3><span class="small muted">${r.mistakeCount} to fix</span></div>
        ${r.mistakes.length ? r.mistakes.slice(0, 40).map((m) => `<div class="mistake"><div><div class="small muted">${esc(subjectInfo(topicOfStyle(m.styleId)?.subject)?.icon || '')} ${esc(m.topic)} · ${esc(m.name)} · from ${esc(m.source)} · ${fmtDate(m.at)}${m.tries ? ` · tried ${m.tries}×` : ''}</div><div class="q">${m.html}</div></div><button class="btn sm soft" data-mis="${m.id}">Retry</button></div>`).join('') : '<div class="empty small"><div class="e">🎉</div>No mistakes waiting — brilliant!</div>'}</div>
      <div class="stack">
        <div class="card"><div class="card-head"><h3>Memory boxes</h3></div><p class="small muted" style="margin-top:0">Each correct review moves a style to a longer gap. A mistake sends it back to box 1.</p>
          <div class="boxes">${r.boxes.map((n, i) => `<div><span class="small" style="font-weight:700">${n}</span><i style="height:${(n / maxBox) * 100}%"></i><span class="tiny faint" style="font-size:9px;text-align:center">${boxNames[i]}</span></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>Due now</h3></div>${r.due.length ? r.due.slice(0, 12).map((d) => `<div class="row spread small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(d.name)} <span class="muted">· ${esc(d.topic)}</span></span><span class="pill">box ${d.box + 1}</span></div>`).join('') : '<div class="small muted">Nothing due right now.</div>'}</div>
        <div class="card"><div class="card-head"><h3>Coming up</h3></div>${r.upcoming.length ? r.upcoming.map((d) => `<div class="row spread small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(d.name)}</span><span class="muted">${fmtDate(d.due)}</span></div>`).join('') : '<div class="small muted">Complete lessons to build your schedule.</div>'}</div>
      </div>
    </div>`;
  $('#rv-mixed').onclick = () => startReview({});
  $('#rv-mis')?.addEventListener('click', () => startReview({ mode: 'mistakes' }));
  $$('[data-mis]').forEach((b) => (b.onclick = () => startReview({ mistakeId: b.dataset.mis })));
});

// ---------- Lesson / review player ----------
on(/^\/app\/lesson\/(\w+)$/, async (lid) => {
  let { lesson: L } = await api('GET', `/api/lessons/${lid}`);
  const isReview = L.kind === 'review';
  const t = L.styleId ? topicOfStyle(L.styleId) : null; const st = t ? strand(t.strand) : { color: '#8b5cf6', name: 'Review' };
  shell(isReview ? 'review' : 'progress', isReview ? 'Review session' : `${t.name} · ${L.styleName}`, '');
  const content = page();
  let phase = L.status === 'completed' ? 'done' : !isReview && L.idx === 0 && !L.results.length && L.example ? 'intro' : 'question';
  let voiceOn = store.get('voice', true);
  const dots = () => `<div class="qdots">${Array.from({ length: L.total }, (_, i) => `<i class="${L.results[i]?.outcome || (i === L.idx && phase !== 'intro' ? 'cur' : '')}" ${L.reviewSlots[i] ? 'style="outline:2px solid #c4b5fd;outline-offset:1px"' : ''}></i>`).join('')}</div>`;
  const top = () => `<div class="lesson-top"><a class="btn sm ghost" href="${isReview ? '#/app/review' : '#/app/progress'}">✕</a>${dots()}<span class="small muted" style="font-weight:600">${phase === 'intro' ? 'Example' : `${Math.min(L.idx + 1, L.total)}/${L.total}`}</span><span class="pill brand" id="xp-pill">⚡ ${L.xp} XP</span></div>`;

  function intro() {
    content.innerHTML = `<div class="lesson">${top()}
      <div class="qcard example"><div class="row spread wrap"><div><span class="tiny" style="color:${st.color}">${esc(st.name)} · Year ${t.year}</span><h2 style="font-size:26px;margin-top:4px">${esc(L.styleName)}</h2></div>
        <button class="speak ${voiceOn ? 'on' : ''}" id="voice">🔊 ${voiceOn ? 'Voice on' : 'Voice off'}</button></div>
        <div class="intro-box" style="margin-top:18px">💡 ${esc(L.intro)} <a href="#/app/learn/${t.id}" class="small">Read the full topic →</a></div>
        <div class="tiny muted">Worked example</div><div class="qtext" style="margin-top:6px">${L.example.html}</div>
        ${L.example.diagram ? `<div class="diagram">${L.example.diagram}</div>` : ''}
        <div class="solution"><ol id="ex-steps">${L.example.steps.map((s, i) => `<li data-i="${i}" style="${i ? 'display:none' : ''}">${s}</li>`).join('')}</ol>
        <div class="feedback info hidden" id="ex-ans"><b>Answer:</b> ${L.example.answerHtml}</div></div>
        <div class="row" style="justify-content:flex-end;margin-top:24px;gap:10px"><button class="btn ghost" id="next-step">Next step ↓</button><button class="btn" id="begin">I’m ready — start questions →</button></div></div></div>`;
    let shown = 1; const steps = L.example.steps;
    const reveal = (n) => { shown = Math.max(shown, n); $$('#ex-steps li').forEach((li) => (li.style.display = Number(li.dataset.i) < shown ? '' : 'none')); if (shown >= steps.length) { $('#ex-ans').classList.remove('hidden'); $('#next-step').classList.add('hidden'); } };
    const narrate = () => speak([speakable(L.intro), 'Here is a worked example. ' + speakable(L.example.html), ...steps.map(speakable), 'So the answer is ' + speakable(L.example.answerHtml)], (i) => { if (i >= 2) reveal(Math.min(steps.length, i - 1)); if (i === steps.length + 2) reveal(steps.length); });
    $('#next-step').onclick = () => reveal(shown + 1);
    $('#voice').onclick = () => { voiceOn = !voiceOn; store.set('voice', voiceOn); if (voiceOn) narrate(); else window.speechSynthesis?.cancel(); $('#voice').classList.toggle('on', voiceOn); $('#voice').textContent = `🔊 ${voiceOn ? 'Voice on' : 'Voice off'}`; };
    $('#begin').onclick = () => { window.speechSynthesis?.cancel(); phase = 'question'; question(); };
    if (voiceOn) narrate();
  }

  let W = null;
  function question() {
    const q = L.question;
    if (!q) return finish();
    const qt = topicOfStyle(q.styleId) || t;
    const tag = q.review ? `<span class="review-tag">🔁 ${{ mistake: 'Past mistake — try again', due: 'Review: due today', practice: 'Recap' }[q.review] || 'Review'} · ${esc(q.topicName || '')}</span>` : '';
    const isMaths = (qt?.subject || 'maths') === 'maths';
    content.innerHTML = `<div class="lesson">${top()}
      <div class="qcard"><div class="row spread wrap"><span class="row">${tag || `<span class="tiny muted">Question ${L.idx + 1}</span>`}</span><button class="speak" id="read">🔊 Read</button></div>
        <div class="qtext" style="margin-top:10px">${q.html}</div>${q.diagram ? `<div class="diagram">${q.diagram}</div>` : ''}
        <form id="af">${answerWidget({ ...q, subjectMaths: isMaths && !q.options })}<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn lg" id="check">Check</button></div></form>
        <div id="fb">${q.hint ? `<div class="feedback info"><b>Hint:</b> ${q.hint}</div>` : ''}</div>
        <div class="row" style="justify-content:space-between;margin-top:22px" id="actions"><div class="row"><button class="btn ghost sm" id="hint">💡 Hint</button><button class="btn ghost sm" id="skip">Skip</button></div><span class="small faint" id="tries">${3 - (q.attempts || 0)} tries left</span></div>
      </div></div>`;
    W = bindAnswerWidget(content); W.focus();
    $('#read').onclick = () => speak([speakable(q.html), ...(q.options || []).map((o, i) => `${LETTERS[i]}: ${speakable(o)}`)]);
    $('#hint').onclick = async () => { const r = await api('POST', `/api/lessons/${L.id}/hint`); $('#fb').innerHTML = `<div class="feedback info"><b>Hint:</b> ${r.hint}</div>`; };
    $('#skip').onclick = async () => { const r = await api('POST', `/api/lessons/${L.id}/skip`); L.results[L.idx] = { outcome: 'skipped' }; reveal(false, r, 'Skipped — here’s how to do it', q); };
    $('#af').onsubmit = async (e) => {
      e.preventDefault(); const input = W.get(); if (!input.trim()) return toast(q.options ? 'Choose an answer first' : 'Type an answer first');
      $('#check').disabled = true;
      try {
        const r = await api('POST', `/api/lessons/${L.id}/answer`, { input });
        if (r.correct) { L.results[L.idx] = { outcome: 'correct', attempts: 3 - r.attemptsLeft }; L.xp += r.xp; W.el.classList.add('ok'); xpPop(r.xp); reveal(true, r, ['Brilliant!', 'Correct!', 'Spot on!', 'Nailed it!', 'Great work!'][Math.floor(Math.random() * 5)], q, input); }
        else if (r.done) { L.results[L.idx] = { outcome: 'incorrect' }; L.xp += r.xp; reveal(false, r, 'Not this time — let’s look at why', q, input); }
        else {
          W.el.classList.remove('shake'); void W.el.offsetWidth; W.el.classList.add('shake');
          $$('.choice.sel', content).forEach((b) => { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 700); });
          $('#fb').innerHTML = `<div class="feedback bad"><h4>Not quite — try again</h4>${r.attemptsLeft} ${r.attemptsLeft === 1 ? 'try' : 'tries'} left.${r.hint ? `<div style="margin-top:8px"><b>Hint:</b> ${r.hint}</div>` : ''}</div>`;
          $('#tries').textContent = `${r.attemptsLeft} tries left`;
          $('#check').disabled = false;
        }
        celebrate(r.rewards);
      } catch (err) { toast(err.message, 'bad'); $('#check').disabled = false; }
    };
  }

  function reveal(good, r, title, q, given) {
    $('.qdots').outerHTML = dots();
    $('#xp-pill').textContent = `⚡ ${L.xp} XP`;
    W.lock(); $('#check').classList.add('hidden');
    if (q.options) markChoices(content, given, r.answerHtml && q.options ? (r.answerHtml.match(/^([A-H])\)/gm) || []).join('') || '' : '');
    $('#fb').innerHTML = `<div class="feedback ${good ? 'good' : 'bad'}"><h4>${good ? '✅' : '📘'} ${title}</h4>${good ? '' : `<div>The answer is <b>${r.answerHtml}</b></div>`}
      <div class="solution">${good ? '<button class="link small" id="show-sol">Show the explanation</button>' : ''}<ol class="${good ? 'hidden' : ''}" id="sol">${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>
      ${!good ? '<div class="small muted" style="margin-top:8px">🔁 Saved to your mistakes bank — it will come back in a review.</div>' : ''}</div>`;
    $('#show-sol')?.addEventListener('click', (e) => { $('#sol').classList.remove('hidden'); e.target.remove(); });
    $('#actions').innerHTML = `<button class="speak" id="read-sol">🔊 Explain aloud</button><button class="btn lg" id="next">${L.idx + 1 >= L.total ? 'Finish' : 'Next question →'}</button>`;
    $('#read-sol').onclick = () => speak(r.steps.map(speakable));
    const nx = $('#next'); nx.focus();
    nx.onclick = async () => {
      nx.disabled = true;
      const res = await api('POST', `/api/lessons/${L.id}/next`); L = res.lesson; L.bonus = res.bonus;
      if (L.status === 'completed') { finish(); celebrate(res.rewards); } else question();
    };
  }

  function finish() {
    phase = 'done';
    const correct = L.results.filter((r) => r?.outcome === 'correct').length;
    const pct = Math.round((correct / L.total) * 100);
    if (pct >= 80) confetti();
    content.innerHTML = `<div class="lesson">${top()}<div class="qcard result-hero">
      <div style="font-size:54px">${pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 50 ? '💪' : '📘'}</div>
      <h2 style="font-size:30px;margin:8px 0">${pct === 100 ? 'Perfect!' : pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!'}</h2>
      <p class="muted">${isReview ? 'Review session' : `${esc(L.styleName)} · ${esc(t.name)}`}</p>
      <div class="row" style="justify-content:center;gap:40px;margin:26px 0;flex-wrap:wrap">
        <div>${donut(pct, pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', 120)}<div class="small muted">${correct}/${L.total} correct</div></div>
        <div style="text-align:left"><div class="v" style="font-size:40px;font-weight:800">+${L.xp}</div><div class="muted">XP earned${L.bonus ? ` (incl. +${L.bonus} bonus)` : ''}</div><div class="muted small">+${Math.round(L.xp / 2)} coins</div></div></div>
      <div class="row wrap" style="justify-content:center">${isReview ? '<a class="btn ghost" href="#/app/review">Back to review</a><button class="btn" id="again-rv">Another review</button>' : `<a class="btn ghost" href="#/app/progress">Back to progress</a><button class="btn" data-start="${L.styleId}">Practise again (1 credit)</button><a class="btn soft" href="#/app/learn/${t.id}">📖 Topic page</a>`}<a class="btn soft" href="#/app">Dashboard</a></div></div></div>`;
    bindStart(content);
    $('#again-rv')?.addEventListener('click', () => startReview({}));
    loadMe();
  }

  phase === 'intro' ? intro() : phase === 'done' ? finish() : question();
});

// ---------- Exams & topic tests ----------
async function startExam(examId, name, questions, minutes) {
  const c = child();
  const free = S.wallet?.freeAccess;
  const ok = await confirmBox(`Start ${esc(name)}?`, `${questions} questions, ${minutes} minutes. The timer starts immediately and it auto-submits at the end. Afterwards every wrong answer is explained step by step. ${free ? 'Free access.' : `Uses 1 credit (balance: ${S.wallet?.credits ?? 0}).`}`, { ok: 'Start' });
  if (!ok) return;
  try { const r = await api('POST', '/api/exams', { studentId: c.id, examId }); await loadMe(); location.hash = `#/app/exam/${r.attempt.id}`; }
  catch (err) { toast(err.message, 'bad'); if (err.status === 402 && S.me.role === 'parent') location.hash = '#/app/billing'; }
}

on(/^\/app\/exams$/, async () => {
  if (needChild()) return;
  const c = child(); const subj = curSubject();
  shell('exams', 'Tests & Mocks', '<div class="spinner"></div>', { subjectBar: true });
  const { exams, attempts } = await api('GET', `/api/students/${c.id}/exams?subject=${subj.id}`);
  const kindIcon = { checkpoint: '🏁', 'end-of-year': '📅', mock: '🎓', topic: '📝' };
  const card = (e) => `<div class="card exam-card" style="${e.recommended ? 'border-color:var(--brand)' : ''}">
    <div class="row spread"><span style="font-size:28px">${kindIcon[e.kind]}</span>${e.recommended ? '<span class="pill brand">Your year</span>' : ''}</div>
    <div class="ttl">${esc(e.name)}</div><div class="small muted">${e.questions} questions · ${e.minutes} minutes · ${e.kind === 'mock' ? 'full GCSE content' : e.kind === 'end-of-year' ? `everything up to Year ${e.year}` : `${e.termName} term content`}</div>
    <div class="row spread" style="margin-top:auto">${e.best ? `<a class="pill good" href="#/app/exam/${e.best.id}">Best: Grade ${e.best.grade} · ${e.best.pct}%</a>` : `<span class="pill">${e.attempts ? e.attempts + ' attempts' : 'Not attempted'}</span>`}
      ${e.activeId ? `<a class="btn sm" href="#/app/exam/${e.activeId}">Resume</a>` : e.hasContent ? `<button class="btn sm ${e.best ? 'soft' : ''}" data-exam="${e.id}">${e.best ? 'Retake' : 'Start'}</button>` : '<span class="small faint">Coming soon</span>'}</div></div>`;
  const years = [c.yearGroup, ...S.cur.years.filter((y) => y !== c.yearGroup)].filter((y) => exams.some((e) => e.year === y && e.kind !== 'mock'));
  page().innerHTML = `<div class="page-head"><h1>${subj.icon} ${esc(subj.name)} tests &amp; mock exams</h1><p>Timed, mixed-topic exams marked instantly with a grade — then every wrong answer is explained step by step, with a similar question to try straight away. Topic tests are on each topic’s page.</p></div>
    <div class="grid-main" style="margin-bottom:26px"><div class="card"><div class="card-head"><h3>Results over time</h3></div>${lineChart(attempts.filter((a) => a.kind !== 'topic').slice().reverse().map((a, i) => ({ label: `#${i + 1}`, title: a.name, value: a.pct, tag: a.grade })))}</div>
      <div class="card"><div class="card-head"><h3>Recent attempts</h3></div>${attempts.length ? `<div class="stack">${attempts.slice(0, 6).map((a) => `<a class="rec" href="#/app/exam/${a.id}"><span class="dot" style="background:linear-gradient(135deg,#3b6cf6,#8b5cf6)">${a.grade}</span><div class="grow"><b>${esc(a.name)}</b><div class="small muted">${fmtDate(a.at)} · ${a.score}/${a.max} marks</div></div><b>${a.pct}%</b></a>`).join('')}</div>` : '<div class="empty small">No attempts yet.</div>'}</div></div>
    ${years.map((y) => `<div class="strand-head">Year ${y}${y === c.yearGroup ? ' · current' : ''}</div><div class="exam-grid">${exams.filter((e) => e.year === y && e.kind !== 'mock').map(card).join('')}</div>`).join('')}
    ${exams.some((e) => e.kind === 'mock') ? `<div class="strand-head">Full GCSE mocks</div><div class="exam-grid">${exams.filter((e) => e.kind === 'mock').map(card).join('')}</div>` : ''}`;
  $$('[data-exam]').forEach((b) => (b.onclick = () => { const e = exams.find((x) => x.id === b.dataset.exam); startExam(e.id, e.name, e.questions, e.minutes); }));
});

on(/^\/app\/exam\/(\w+)$/, async (aid) => {
  const { attempt: A } = await api('GET', `/api/exams/${aid}`);
  if (A.submittedAt) return examResult(A);
  shell('exams', A.name, '');
  const key = `exam:${A.id}`; const saved = store.get(key, {});
  page().innerHTML = `<div class="lesson"><div class="card" style="position:sticky;top:80px;z-index:5;margin-bottom:18px;padding:14px 20px"><div class="row spread"><div><b>${esc(A.name)}</b><div class="small muted"><span id="answered">0</span>/${A.questions.length} answered</div></div>
      <div class="row"><span class="timer" id="timer">--:--</span><button class="btn" id="submit">Submit</button></div></div></div>
    <div class="qcard">${A.questions.map((q, i) => `<div class="exam-q" data-q="${i}"><div class="row" style="align-items:flex-start;gap:14px"><span class="num">${i + 1}</span><div class="grow">
      <div class="row spread"><span class="small faint">${esc(q.topic)}</span><span class="small faint">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span></div>
      <div class="qtext">${q.html}</div>${q.diagram ? `<div class="diagram">${q.diagram}</div>` : ''}
      ${answerWidget({ ...q, subjectMaths: !q.options && (topicOfStyle(q.styleId)?.subject || 'maths') === 'maths' }, { compact: true, value: saved[i] || '' })}</div></div></div>`).join('')}
      <div class="row" style="justify-content:flex-end;margin-top:20px"><button class="btn lg" id="submit2">Submit</button></div></div></div>`;
  const widgets = $$('[data-q]').map((el) => bindAnswerWidget(el, (v) => { saved[el.dataset.q] = v; store.set(key, saved); count(); }));
  const count = () => ($('#answered').textContent = widgets.filter((w) => w.get().trim()).length);
  count();
  let sent = false;
  const submit = async (auto) => {
    if (sent) return;
    if (!auto) { const left = widgets.filter((w) => !w.get().trim()).length; if (!(await confirmBox('Submit?', left ? `You have ${left} unanswered question${left > 1 ? 's' : ''}.` : 'All questions answered. Ready to see your grade?', { ok: 'Submit' }))) return; }
    sent = true;
    const r = await api('POST', `/api/exams/${A.id}/submit`, { answers: widgets.map((w) => w.get()) });
    store.del(key); toast(`Submitted · +${r.xp} XP`, 'good');
    examResult(r.attempt); celebrate(r.rewards);
  };
  $('#submit').onclick = () => submit(false); $('#submit2').onclick = () => submit(false);
  const end = Date.parse(A.deadline);
  const tick = () => { const ms = end - Date.now(); if (ms <= 0) { $('#timer').textContent = '00:00'; clearInterval(iv); toast('Time’s up — submitting'); submit(true); return; }
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000); $('#timer').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; $('#timer').classList.toggle('low', ms < 120000); };
  const iv = setInterval(tick, 1000); S.timers.push(iv); tick();
});

// Post-exam: explain every wrong answer, then offer a similar question to try straight away.
function examResult(A) {
  S.timers.forEach(clearInterval); S.timers = [];
  shell('exams', A.name, '');
  if (A.pct >= 70) confetti();
  const wrong = A.questions.filter((q) => !q.correct);
  const right = A.questions.filter((q) => q.correct);
  const strandLabel = (k) => strand(k).name || k;
  page().innerHTML = `<div class="lesson">
    <div class="card result-hero"><div class="tiny muted">${esc(A.name)} · ${fmtDateTime(A.submittedAt)}</div>
      <div class="row" style="justify-content:center;gap:48px;margin:22px 0;flex-wrap:wrap"><div><div class="grade-big">${A.grade}</div><div class="muted">Grade${A.tier === 'F' ? ' (Foundation)' : ''}</div></div>
      <div>${donut(A.pct, A.pct >= 65 ? '#10b981' : A.pct >= 45 ? '#f59e0b' : '#ef4444', 130)}<div class="muted">${A.score}/${A.max} marks</div></div></div>
      <div style="max-width:520px;margin:0 auto;text-align:left">${Object.entries(A.byStrand || {}).map(([k, v]) => `<div style="margin:10px 0"><div class="row spread small"><b>${esc(strandLabel(k))}</b><span class="muted">${v.score}/${v.max}</span></div><div class="bar"><i style="width:${(v.score / v.max) * 100}%;background:${strand(k).color}"></i></div></div>`).join('')}</div>
      <div class="row wrap" style="justify-content:center;margin-top:20px"><a class="btn ghost" href="#/app/exams">All tests</a>${wrong.length ? '<button class="btn" id="go-walk">Go through my mistakes ↓</button>' : ''}<a class="btn soft" href="#/app/review">Review centre</a></div></div>
    ${wrong.length ? `<h2 style="margin:30px 0 6px" id="walk">📘 Let’s go through the ${wrong.length} question${wrong.length > 1 ? 's' : ''} you missed</h2>
      <p class="muted" style="margin:0 0 16px">For each one: what you wrote, the correct answer, why, and the full method. Then try a similar question to lock it in (+8 XP each). These questions are also saved to your mistakes bank.</p>
      ${wrong.map((q) => walkCard(q)).join('')}` : '<div class="card pad-lg empty" style="margin-top:22px"><div class="e">🏆</div><h2>Full marks — every answer correct!</h2></div>'}
    ${right.length ? `<details class="card" style="margin-top:22px"><summary style="cursor:pointer;font-weight:700">✅ Questions you got right (${right.length})</summary>${right.map((q) => `<div class="exam-q"><div class="row" style="align-items:flex-start;gap:14px"><span class="num" style="background:var(--good-soft);color:var(--good)">${q.n}</span><div class="grow"><div class="qtext">${q.html}</div><div class="small" style="margin-top:6px">Your answer: <b>${esc(q.given)}</b> ✓</div>
      <details style="margin-top:6px"><summary class="small link">Method</summary><div class="solution"><ol>${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div></details></div></div></div>`).join('')}</details>` : ''}
  </div>`;
  $('#go-walk')?.addEventListener('click', () => $('#walk').scrollIntoView({ behavior: 'smooth' }));
  $$('[data-listen]').forEach((b) => (b.onclick = () => { const q = A.questions[b.dataset.listen]; speak([`Question ${q.n}.`, speakable(q.html), `The correct answer is ${speakable(q.answerHtml)}.`, ...q.steps.map(speakable)]); }));
  $$('[data-similar]').forEach((b) => (b.onclick = () => similarQuestion(A, Number(b.dataset.similar), b.closest('.walk'))));
}
function walkCard(q) {
  const i = q.n - 1;
  const given = q.given ? (q.options ? q.given.split('').map((L) => `${L}) ${q.options[LETTERS.indexOf(L)] || ''}`).join('<br>') : esc(q.given)) : '<span class="faint">(left blank)</span>';
  return `<div class="walk"><div class="row spread wrap"><div class="row"><span class="num" style="background:var(--bad-soft);color:var(--bad)">${q.n}</span><span class="small muted">${esc(q.topic)} · ${esc(q.styleName || '')}</span></div><button class="speak" data-listen="${i}">🔊 Explain aloud</button></div>
    <div class="qtext" style="margin-top:12px;font-size:19px">${q.html}</div>${q.diagram ? `<div class="diagram">${q.diagram}</div>` : ''}
    ${q.options ? `<ol type="A" class="small" style="margin:8px 0">${q.options.map((o) => `<li>${o}</li>`).join('')}</ol>` : ''}
    <div class="ans-compare"><div class="yours"><div class="tiny" style="color:var(--bad)">Your answer</div><div style="margin-top:4px;font-weight:600">${given}</div></div>
      <div class="right"><div class="tiny" style="color:var(--good)">Correct answer</div><div style="margin-top:4px;font-weight:700">${q.answerHtml}</div></div></div>
    ${q.intro ? `<div class="why"><b>💡 The key idea:</b> ${esc(q.intro)}</div>` : ''}
    ${q.hint ? `<div class="small muted" style="margin:6px 0"><b>Where it usually goes wrong:</b> ${q.hint}</div>` : ''}
    <div class="solution"><div class="tiny muted" style="margin-top:10px">Step-by-step solution</div><ol>${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>
    <div class="similar">${q.similarDone ? '<span class="pill good">✓ Similar question done</span>' : `<button class="btn soft" data-similar="${i}">✍️ Try a similar question</button>`}
      ${topicOfStyle(q.styleId) ? `<a class="btn ghost" style="margin-left:8px" href="#/app/learn/${topicOfStyle(q.styleId).id}">📖 Revise the topic</a>` : ''}</div></div>`;
}
async function similarQuestion(A, n, card) {
  const box = $('.similar', card);
  box.innerHTML = '<div class="spinner" style="margin:10px auto"></div>';
  const { question: q } = await api('GET', `/api/exams/${A.id}/similar/${n}`);
  const isMaths = (topicOfStyle(A.questions[n].styleId)?.subject || 'maths') === 'maths';
  box.innerHTML = `<div class="tiny" style="color:var(--brand)">Your turn — a similar question</div><div class="qtext" style="margin-top:8px;font-size:18px">${q.html}</div>${q.diagram ? `<div class="diagram">${q.diagram}</div>` : ''}
    <form class="sim-f">${answerWidget({ ...q, subjectMaths: isMaths && !q.options }, { compact: true })}<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn">Check</button></div></form><div class="sim-fb"></div>`;
  const w = bindAnswerWidget(box);
  $('.sim-f', box).onsubmit = async (e) => {
    e.preventDefault(); const input = w.get(); if (!input.trim()) return;
    const btn = $('.sim-f button.btn', box); btn.disabled = true;
    const r = await api('POST', `/api/exams/${A.id}/similar/${n}`, { input });
    if (r.done) {
      w.lock(); btn.classList.add('hidden');
      if (q.options) markChoices(box, input, (r.answerHtml.match(/^([A-H])\)/gm) || []).join(''));
      $('.sim-fb', box).innerHTML = `<div class="feedback ${r.correct ? 'good' : 'bad'}"><h4>${r.correct ? '✅ You’ve got it now! +8 XP' : '📘 Still tricky — here’s the method'}</h4>${r.correct ? '' : `<div>Answer: <b>${r.answerHtml}</b></div>`}<div class="solution"><ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div></div>`;
      if (r.correct) { xpPop(8); celebrate(r.rewards); }
    } else {
      btn.disabled = false;
      $('.sim-fb', box).innerHTML = `<div class="feedback bad"><b>Not quite — one more try.</b>${r.hint ? ` Hint: ${r.hint}` : ''}</div>`;
    }
  };
}

// ---------- Rewards ----------
on(/^\/app\/rewards$/, async () => {
  if (needChild()) return;
  const c = child(); const isParent = S.me.role !== 'student';
  shell('rewards', 'Rewards', '<div class="spinner"></div>');
  const R = await api('GET', `/api/students/${c.id}/rewards`);
  R.shop.forEach((it) => (SHOP_EMOJI[it.id] = it.emoji || it.css));
  const earned = R.badges.filter((b) => b.got);
  page().innerHTML = `<div class="page-head"><h1>🏆 Rewards</h1><p>Every correct answer earns XP and coins. Level up, collect badges and certificates, unlock avatars in the shop — and earn a free lesson every ${R.rewardEvery} lessons.</p></div>
    <div class="kpis">
      <div class="card kpi"><div class="v">${coin(R.coins)}</div><div class="l">Coins to spend</div></div>
      <div class="card kpi"><div class="v">Lv ${R.level.level}</div><div class="l">${R.level.xp} XP · ${R.level.next - R.level.xp} to next level</div><div class="bar thin" style="margin-top:8px"><i style="width:${R.level.pct}%"></i></div></div>
      <div class="card kpi"><div class="v">${earned.length}<span class="faint" style="font-size:18px"> / ${R.badges.length}</span></div><div class="l">Badges earned</div></div>
      <div class="card kpi"><div class="v">🎁 ${R.nextReward}</div><div class="l">lessons until a free lesson</div><div class="bar thin" style="margin-top:8px"><i style="width:${((R.rewardEvery - R.nextReward) / R.rewardEvery) * 100}%;background:var(--good)"></i></div></div>
    </div>
    <div class="grid-main">
      <div class="stack">
        <div class="card"><div class="card-head"><h3>🎯 Reward goals ${isParent ? '' : 'from your parent'}</h3>${isParent ? '<button class="btn sm" id="new-goal">+ New goal</button>' : ''}</div>
          ${R.goals.length ? `<div class="stack">${R.goals.slice().reverse().map((g) => `<div class="goal ${g.achievedAt ? 'done' : ''}"><div class="row spread"><b>${esc(g.label)} ${g.target}</b>${g.achievedAt ? (g.deliveredAt ? '<span class="pill good">Reward given ✓</span>' : '<span class="pill warn">Achieved! 🎉</span>') : `<span class="small muted">${g.progress}/${g.target}</span>`}</div>
            <div class="bar"><i style="width:${g.pct}%;background:${g.achievedAt ? 'var(--good)' : '#f59e0b'}"></i></div><div class="row spread"><span>🎁 ${esc(g.reward)}</span>
            ${isParent ? `<span class="row">${g.achievedAt && !g.deliveredAt ? `<button class="btn sm good" data-deliver="${g.id}">Mark reward given</button>` : ''}<button class="btn sm ghost" data-delgoal="${g.id}">Remove</button></span>` : ''}</div></div>`).join('')}</div>`
            : `<div class="empty small"><div class="e">🎯</div>${isParent ? 'Set a goal with a real-world reward — e.g. “Complete 20 lessons → cinema trip”. It’s tracked automatically and your child is notified when they hit it.' : 'No goals yet — ask your parent to set one!'}</div>`}</div>
        <div class="card" id="gifts"><div class="spinner"></div></div>
        <div class="card"><div class="card-head"><h3>🛍️ Reward shop</h3><span>${coin(R.coins)}</span></div>
          <div class="tiny muted" style="margin:6px 0 10px">Avatars</div><div class="shop-grid">${R.shop.filter((x) => x.kind === 'avatar').map((it) => shopItem(it, R)).join('')}</div>
          <div class="tiny muted" style="margin:18px 0 10px">Backgrounds</div><div class="shop-grid">${R.shop.filter((x) => x.kind === 'background').map((it) => shopItem(it, R)).join('')}</div>
          <div class="tiny muted" style="margin:18px 0 10px">Power-ups</div><div class="shop-grid">${R.shop.filter((x) => x.kind === 'consumable').map((it) => shopItem(it, R)).join('')}</div></div>
      </div>
      <div class="stack">
        <div class="card"><div class="card-head"><h3>📜 Certificates</h3></div>${R.certificates.length ? R.certificates.map((ct) => `<a class="rec" href="#/app/certificate/${ct.id}" style="margin-bottom:8px"><span class="dot" style="background:linear-gradient(135deg,#f59e0b,#b45309)">${ct.kind === 'year' ? '🎓' : ct.kind === 'exam' ? '🌟' : '📜'}</span><div class="grow"><b>${esc(ct.title)}</b><div class="small muted">${esc(ct.subtitle || '')} · ${fmtDate(ct.at)}</div></div></a>`).join('') : '<div class="empty small"><div class="e">📜</div>Master every style in a topic to earn its certificate.</div>'}</div>
        <div class="card"><div class="card-head"><h3>🏅 Badges</h3></div><div class="badges">${R.badges.map((b) => `<div class="badge ${b.got ? '' : 'off'}" title="${esc(b.desc)}${b.at ? ' · ' + fmtDate(b.at) : ''}"><div class="e">${b.icon}</div><div class="n">${esc(b.name)}</div></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>🔔 Recent rewards</h3></div>${R.inbox.length ? R.inbox.slice(0, 12).map((e) => `<div class="inbox-row"><span style="font-size:22px">${e.icon || '🎉'}</span><div class="grow"><b class="small">${esc(e.title)}</b><div class="small muted">${esc(e.text || '')}</div></div><span class="tiny faint">${fmtDate(e.at)}</span></div>`).join('') : '<div class="small muted">Nothing yet — start a lesson!</div>'}</div>
      </div>
    </div>`;
  $$('[data-buy]').forEach((b) => (b.onclick = async () => {
    const it = R.shop.find((x) => x.id === b.dataset.buy);
    try { await api('POST', `/api/students/${c.id}/shop`, { itemId: it.id, action: b.dataset.act }); if (b.dataset.act !== 'equip') { confetti(40); toast(`Unlocked ${it.name}!`, 'good'); } await loadMe(); render(); }
    catch (e) { toast(e.message, 'bad'); }
  }));
  $('#new-goal')?.addEventListener('click', () => goalForm(c, R.goalTypes));
  renderGifts($('#gifts'), c);
  $$('[data-deliver]').forEach((b) => (b.onclick = async () => { await api('PATCH', `/api/students/${c.id}/goals/${b.dataset.deliver}`, { delivered: true }); toast('Marked as given 🎁', 'good'); render(); }));
  $$('[data-delgoal]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Remove goal?', 'This removes the goal and its progress.', { ok: 'Remove', danger: true })) { await api('DELETE', `/api/students/${c.id}/goals/${b.dataset.delgoal}`); render(); } }));
});
function shopItem(it, R) {
  const owned = R.owned.includes(it.id) || (it.kind === 'consumable' && false);
  const eq = R.equipped[it.kind] === it.id;
  const art = it.kind === 'background' ? `<span class="art" style="background:${it.css}"></span>` : `<span class="art">${it.emoji}</span>`;
  const btn = it.kind === 'consumable' ? `<button class="btn sm" data-buy="${it.id}">${coin(it.price)}</button><span class="tiny faint">You have ${R.freezes}</span>`
    : owned ? `<button class="btn sm ${eq ? 'good' : 'ghost'}" data-buy="${it.id}" data-act="equip">${eq ? 'Equipped ✓' : 'Equip'}</button>`
      : `<button class="btn sm ${R.coins >= it.price ? '' : 'ghost'}" data-buy="${it.id}" ${R.coins >= it.price ? '' : 'disabled'}>${coin(it.price)}</button>`;
  return `<div class="shop-item ${owned ? 'owned' : ''} ${eq ? 'eq' : ''}" title="${esc(it.desc || '')}">${art}<b class="small">${esc(it.name)}</b>${btn}</div>`;
}
function goalForm(c, types) {
  modal(`<h2>New reward goal for ${esc(c.name)}</h2><p class="muted">Progress is tracked automatically from today. ${esc(c.name)} gets a celebration the moment it’s achieved.</p>
    <form id="gf" class="stack" style="margin-top:16px"><div class="grid2"><label class="field"><span>Goal</span><select class="input" name="type">${Object.entries(types).map(([k, v]) => `<option value="${k}">${esc(v)}…</option>`).join('')}</select></label>
      <label class="field"><span>Target</span><input class="input" type="number" name="target" min="1" value="10" required></label></div>
      <label class="field"><span>Reward</span><input class="input" name="reward" maxlength="120" placeholder="e.g. Cinema trip, new football, £10 pocket money" required></label>
      <div class="error" id="gf-err"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Create goal</button></div></form>`, {
    onMount: (m, close) => { $('#gf', m).onsubmit = async (e) => { e.preventDefault(); try { await api('POST', `/api/students/${c.id}/goals`, Object.fromEntries(new FormData(e.target))); close(); toast('Goal created 🎯', 'good'); render(); } catch (err) { $('#gf-err', m).textContent = err.message; } }; },
  });
}

on(/^\/app\/certificate\/(\w+)$/, async (cid) => {
  if (needChild()) return;
  const c = child();
  shell('rewards', 'Certificate', '<div class="spinner"></div>');
  const { certificate: ct, student } = await api('GET', `/api/students/${c.id}/certificates/${cid}`);
  page().innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:16px"><a href="#/app/rewards" class="small">← Rewards</a><button class="btn" id="print-cert">🖨️ Print / save as PDF</button></div>
    <div class="cert"><div class="cert-inner"><div class="seal">${ct.kind === 'year' ? '🎓' : ct.kind === 'exam' ? '🌟' : '📜'}</div>
      <div style="letter-spacing:.3em;font-size:12px;color:#b45309;font-weight:700">STEPWISE · CERTIFICATE OF ACHIEVEMENT</div>
      <h1 style="margin-top:12px">Certificate of ${ct.kind === 'year' ? 'Completion' : 'Mastery'}</h1>
      <div style="margin-top:20px;color:#64748b">This certifies that</div><div class="who">${esc(student.name)}</div>
      <div style="color:#64748b">has ${ct.kind === 'year' ? 'completed every topic in' : ct.kind === 'exam' ? 'achieved their target in' : 'mastered every question style in'}</div>
      <div class="what">${esc(ct.title)}</div><div style="color:#64748b;margin-top:6px">${esc(ct.subtitle || '')}</div>
      <div class="foot"><span>Awarded ${fmtDate(ct.at)}</span><span>Year ${student.yearGroup}</span><span>stepwise · GCSE programme</span></div></div></div>`;
  $('#print-cert').onclick = () => printAs('print-cert');
});
function printAs(cls) { document.body.classList.add(cls); const done = () => { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); window.print(); setTimeout(done, 1500); }

// ---------- Student report & personal roadmap ----------
on(/^\/app\/report(?:\/(\w+))?$/, async (sid) => {
  const isAdmin = S.me.role === 'admin';
  if (!sid && needChild()) return;
  const id = sid || child().id;
  shell(isAdmin ? 'users' : 'report', 'Report & Plan', '<div class="spinner"></div>', { admin: isAdmin && !child() });
  const r = await api('GET', `/api/students/${id}/report`);
  const st = r.student; const o = r.overall;
  const canAct = !isAdmin && child() && child().id === st.id;
  const trend = o.questions4w - o.questionsPrev4w;
  const gx = (g) => `${((Math.max(1, Math.min(9, g)) - 1) / 8) * 100}%`;
  const toneColor = { good: 'var(--good)', warn: '#f59e0b', bad: 'var(--bad)', '': 'var(--ink-3)' };
  const kindIcon = { review: '🔁', practise: '🎯', learn: '📘', test: '📝', exam: '🏁' };
  const kindLabel = { review: 'Review', practise: 'Practise', learn: 'New', test: 'Topic test', exam: 'Checkpoint' };
  page().innerHTML = `<div class="report">
    <div class="row spread no-print" style="margin-bottom:14px">${isAdmin ? `<a class="small" href="#/admin/users/${st.id}">← ${esc(st.name)}</a>` : '<span></span>'}<button class="btn" id="print-report">🖨️ Print / save as PDF</button></div>
    <div class="report-head">${avatar(st, 'lg')}<div><div class="tiny" style="color:#a5b4fc">Progress report & personal plan</div><h1>${esc(st.name)}</h1>
      <div class="meta">Year ${st.yearGroup} · ${st.tier === 'F' ? 'Foundation' : 'Higher'} tier · ${r.term} term · generated ${fmtDate(r.generatedAt)}</div></div>
      <div class="count"><b>${r.weeksToExam}</b><span class="meta">weeks to GCSE exams<br>(from ${fmtDate(r.examDate)})</span></div></div>

    <div class="kpis">
      <div class="card kpi"><div class="v">${o.lessons}</div><div class="l">Lessons completed · ${o.reviews} reviews</div></div>
      <div class="card kpi"><div class="v">${o.questions4w}</div><div class="l">Questions in the last 4 weeks <b style="color:${trend >= 0 ? 'var(--good)' : 'var(--bad)'}">${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)}</b> vs previous 4</div></div>
      <div class="card kpi"><div class="v">${o.activeDays4w}<span class="faint" style="font-size:18px">/28</span></div><div class="l">Active days · 🔥 ${o.streak}-day streak</div></div>
      <div class="card kpi"><div class="v">Lv ${o.level.level}</div><div class="l">🏅 ${o.badges} badges · 📜 ${o.certificates} certificates</div></div>
    </div>

    <h2 style="margin:6px 0 14px">📊 Subject by subject</h2>
    <div class="grid-3" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${r.subjects.map((x) => `<div class="card subj-report" style="--c:${x.color}">
      <div class="row spread"><div class="row"><span style="font-size:24px">${x.icon}</span><div><h3>${esc(x.name)}</h3><div class="small muted">${esc(x.board)}</div></div></div><span class="pill" style="background:color-mix(in srgb, ${toneColor[x.status.tone]} 15%, transparent);color:${toneColor[x.status.tone]}">${x.status.label}</span></div>
      <div class="grade-scale"><div class="track"></div>${[1, 3, 5, 7, 9].map((g) => `<span class="tick" style="left:${gx(g)}">${g}</span>`).join('')}
        <span class="mk target" style="left:${gx(x.target)}" title="Target grade">${x.target}</span>
        ${typeof x.predicted === 'number' ? `<span class="mk" style="left:${gx(x.predicted)};background:${toneColor[x.status.tone]}" title="Predicted grade">${x.predicted}</span>` : ''}</div>
      <div class="row small muted" style="gap:14px;margin-top:-6px"><span>● predicted ${gradeLabel(x.predicted)}</span><span>■ target ${x.target}</span><span>🎯 ${x.accuracy ?? '–'}%</span><span>⏱ pace ${x.schedulePct}%</span></div>
      <div class="bar thin" style="margin:8px 0 14px" title="Topics expected by now that have been started"><i style="width:${x.schedulePct}%;background:${x.color}"></i></div>
      <div class="comment">${x.comment.map(esc).join(' ')}</div>
      ${x.weak.length ? `<div class="tiny muted" style="margin-top:14px">Areas to improve</div><ul class="mini-list">${x.weak.slice(0, 3).map((w) => `<li><span>${esc(w.name)} <span class="faint">· ${esc(w.topic)}</span></span><b style="color:var(--bad)">${w.acc}%</b></li>`).join('')}</ul>` : ''}
      ${x.strongAreas.length ? `<div class="tiny muted" style="margin-top:14px">Strengths</div><div class="small" style="margin-top:6px">💪 ${x.strongAreas.map(esc).join(' · ')}</div>` : ''}
      ${x.exams.length ? `<div class="tiny muted" style="margin-top:14px">Recent exams</div><div class="row wrap" style="gap:6px;margin-top:6px">${x.exams.map((e) => `<span class="pill" title="${esc(e.name)}">Grade ${e.grade} · ${e.pct}%</span>`).join('')}</div>` : ''}
    </div>`).join('')}</div>

    <h2 style="margin:30px 0 6px">🗺️ Personal roadmap — next 6 weeks</h2>
    <p class="muted" style="margin:0 0 14px">Built from ${esc(st.name)}’s results: weakest skills first, then the next topics in teaching order, weighted towards subjects furthest from target. About <b>${r.plan.perWeek} lessons a week</b> plus a free review session.</p>
    <div class="card">${r.plan.weeks.map((w) => `<div class="week"><div><div class="week-n">Week ${w.n}</div><div class="small muted">from ${fmtDate(w.from)}</div><div class="small muted">≈ ${Math.round(w.minutes / 60 * 10) / 10} hours</div></div>
      <div>${w.items.map((it) => `<div class="plan-item"><span class="ic" style="background:${it.color || '#8b5cf6'}">${kindIcon[it.kind]}</span><div class="grow"><div><span class="tiny" style="color:${it.color || '#8b5cf6'}">${kindLabel[it.kind]}${it.subjectName ? ' · ' + esc(it.subjectName) : ''}</span></div><b class="small">${esc(it.name)}</b>${it.topic && it.kind !== 'test' ? `<span class="small muted"> · ${esc(it.topic)}</span>` : ''}<div class="plan-why">${esc(it.why || '')}</div></div>
        ${canAct ? (it.styleId ? `<button class="btn sm soft no-print" data-start="${it.styleId}">Start</button>` : it.kind === 'review' ? `<button class="btn sm soft no-print" data-review="${it.mode}">Start</button>` : `<button class="btn sm soft no-print" data-exam="${esc(it.examId)}" data-name="${esc(it.name)}" data-kind="${it.kind}">Start</button>`) : ''}</div>`).join('')}</div></div>`).join('')}</div>

    <h2 style="margin:30px 0 14px">🎓 Road to the GCSE exams</h2>
    <div class="card"><div class="timeline">${r.milestones.map((m) => `<div class="tl-step ${m.current ? 'now' : ''} ${m.items.some((i) => /GCSE exams/.test(i)) ? 'exam' : ''}"><b>${esc(m.label)}${m.current ? ' · now' : ''}</b>${m.items.map((i) => `<span>${esc(i)}</span>`).join('')}</div>`).join('')}</div></div>
    <p class="small faint" style="margin-top:18px">Predicted grades combine practice accuracy (weighted by how much of the year has been covered) with recent exam results, mapped to GCSE grade boundaries. They become more reliable as more work is completed. “Pace” is the share of topics expected by this point in Year ${st.yearGroup} that have been started.</p>
  </div>`;
  $('#print-report').onclick = () => printAs('print-report');
  bindStart(page());
  $$('[data-review]').forEach((b) => (b.onclick = () => startReview(b.dataset.review === 'mistakes' ? { mode: 'mistakes' } : {})));
  $$('[data-exam]').forEach((b) => (b.onclick = () => startExam(b.dataset.exam, b.dataset.name, b.dataset.kind === 'test' ? 15 : 12, 25)));
}, { auth: true });


// ---------- Daily missions (dashboard) ----------
const todayStr = () => new Date().toISOString().slice(0, 10);
async function renderMissions(el, c) {
  if (!el) return;
  const [m, t] = await Promise.all([api('GET', `/api/students/${c.id}/missions`), api('GET', `/api/students/${c.id}/tasks`)]);
  const doneN = m.missions.filter((x) => x.done).length;
  const todays = t.today.filter((x) => x.state !== 'done');
  el.innerHTML = `<div class="card"><div class="card-head"><div><h3>🎯 Today’s missions</h3><div class="small muted">${doneN}/${m.missions.length} done · mission streak 🔥 ${m.streak} · resets at midnight</div></div>
      ${m.coinsAvailable ? `<button class="btn sm good" id="claim-all">Claim ${coin(m.coinsAvailable)}</button>` : ''}</div>
    <div class="missions">${m.missions.map((x) => `<div class="mission ${x.done ? 'done' : ''}"><div class="top"><span class="ic">${x.icon}</span><div class="grow"><b class="small">${esc(x.title)}</b><div class="small muted">${x.progress}/${x.target} · ${coin(x.coins)}</div></div>${x.claimed ? '<span class="pill good">✓</span>' : x.done ? `<button class="btn sm good" data-claim="${x.id}">Claim</button>` : ''}</div>
      <div class="bar thin"><i style="width:${(x.progress / x.target) * 100}%;background:${x.done ? 'var(--good)' : 'var(--brand)'}"></i></div></div>`).join('')}</div>
    <div class="chest"><span style="font-size:28px">🧰</span><div class="grow"><b>Treasure chest</b><div class="small">Finish all ${m.missions.length} missions for +${m.bonus} bonus coins</div></div>${m.bonusClaimed ? '<span class="pill good">Opened ✓</span>' : m.allDone ? '<button class="btn sm" id="claim-all2">Open!</button>' : `<span class="small">${doneN}/${m.missions.length}</span>`}</div>
    ${todays.length ? `<div class="tiny muted" style="margin:16px 0 8px">Today’s tasks</div>${todays.slice(0, 5).map((x) => `<div class="row spread small" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span>${x.state === 'missed' ? '⚠️' : x.state === 'waiting' ? '⏳' : '📌'} <b>${esc(x.title)}</b> <span class="muted">${x.dueTime ? '· ' + x.dueTime : ''} ${x.coins ? '· ' + x.coins + ' coins' : ''}</span></span><a href="#/app/planner?tasks">Open</a></div>`).join('')}` : ''}
  </div>`;
  const claim = async (missionId) => { try { const r = await api('POST', `/api/students/${c.id}/missions/claim`, missionId ? { missionId } : {}); toast(`+${r.coins} coins 🪙`, 'good'); celebrate(r.rewards); await loadMe(); renderMissions(el, c); } catch (e) { toast(e.message, 'bad'); } };
  $$('[data-claim]', el).forEach((b) => (b.onclick = () => claim(b.dataset.claim)));
  $('#claim-all', el)?.addEventListener('click', () => claim());
  $('#claim-all2', el)?.addEventListener('click', () => claim());
}
async function renderApprovals(el) {
  if (!el) return;
  const a = await api('GET', '/api/approvals');
  if (!a.count) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="card approvals" style="margin-bottom:22px"><div class="card-head"><h3>⏳ Waiting for your approval (${a.count})</h3></div>
    ${a.tasks.map((t) => `<div class="ticket"><span style="font-size:22px">📌</span><div class="grow"><b>${esc(t.studentName)}</b> finished <b>${esc(t.title)}</b><div class="small muted">${fmtDate(t.date)}${t.coins ? ` · ${t.coins} coins on approval` : ''}</div></div>
      <button class="btn sm good" data-ok-task="${t.id}" data-sid="${t.studentId}" data-date="${t.date}">Approve</button><button class="btn sm ghost" data-no-task="${t.id}" data-sid="${t.studentId}" data-date="${t.date}">Send back</button></div>`).join('')}
    ${a.tickets.map((t) => `<div class="ticket"><span style="font-size:22px">${t.icon}</span><div class="grow"><b>${esc(t.studentName)}</b> wants a <b>£${t.value} ${esc(t.cardName)}</b> gift card<div class="small muted">${t.coins} coins · ${fmtDate(t.createdAt)} · ${t.status}${t.note ? ' · “' + esc(t.note) + '”' : ''}</div></div>
      <a class="btn sm" href="#/app/rewards" data-kid="${t.studentId}">Review</a></div>`).join('')}</div>`;
  $$('[data-ok-task]', el).forEach((b) => (b.onclick = async () => { await api('POST', `/api/students/${b.dataset.sid}/tasks/${b.dataset.okTask}/approve`, { date: b.dataset.date }); toast('Approved — coins sent', 'good'); renderApprovals(el); }));
  $$('[data-no-task]', el).forEach((b) => (b.onclick = async () => { await api('POST', `/api/students/${b.dataset.sid}/tasks/${b.dataset.noTask}/approve`, { date: b.dataset.date, reject: true }); toast('Sent back'); renderApprovals(el); }));
  $$('[data-kid]', el).forEach((b) => b.addEventListener('click', () => { S.childId = b.dataset.kid; store.set('childId', S.childId); }));
}

// ---------- Planner: calendar + task board ----------
on(/^\/app\/planner(\?tasks)?$/, async (tasksTab) => {
  if (needChild()) return;
  const c = child();
  let tab = tasksTab ? 'tasks' : store.get('plannerTab', 'calendar');
  shell('planner', 'Planner & Tasks', `<div class="page-head row spread wrap"><div><h1>🗓️ Planner</h1><p>Reviews, planned lessons, tasks and exams in one place. Tasks set by a parent can earn coins.</p></div>
    <div class="row"><div class="tabs" style="margin:0"><button data-tab="calendar">Calendar</button><button data-tab="tasks">Tasks</button></div><button class="btn" id="new-task">+ New task</button></div></div><div id="pl"></div>`);
  const draw = () => { $$('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); store.set('plannerTab', tab); (tab === 'calendar' ? drawCalendar : drawBoard)($('#pl'), c); };
  $$('[data-tab]').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; draw(); }));
  $('#new-task').onclick = () => taskForm(c, null, draw);
  draw();
});

let calMonth = null; let calSel = null;
async function drawCalendar(el, c) {
  const T = todayStr();
  if (!calMonth) calMonth = T.slice(0, 7);
  const [y, m] = calMonth.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)); const startPad = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first); gridStart.setUTCDate(1 - startPad);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setUTCDate(gridStart.getUTCDate() + i); return d.toISOString().slice(0, 10); });
  el.innerHTML = '<div class="spinner"></div>';
  const cal = await api('GET', `/api/students/${c.id}/calendar?from=${cells[0]}&to=${cells[41]}`);
  const byDate = Object.fromEntries(cal.days.map((d) => [d.date, d]));
  calSel = calSel && calSel >= cells[0] && calSel <= cells[41] ? calSel : (T.slice(0, 7) === calMonth ? T : cells[startPad]);
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const legend = [['review', 'Review due'], ['plan', 'Planned lesson'], ['task', 'Task'], ['done', 'Completed'], ['school', 'School dates']];
  el.innerHTML = `<div class="grid-main" style="grid-template-columns:1.7fr 1fr"><div class="card">
    <div class="cal-head"><button class="btn sm ghost" id="prev">‹</button><h3 style="min-width:160px;text-align:center">${label}</h3><button class="btn sm ghost" id="next">›</button><button class="btn sm ghost" id="tday">Today</button>
      <div class="legend" style="margin-left:auto">${legend.map(([k, l]) => `<span><i class="ev-${k}" style="width:10px;height:10px;display:inline-block;border-radius:3px;margin-right:4px"></i>${l}</span>`).join('')}</div></div>
    <div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div class="dow">${d}</div>`).join('')}
      ${cells.map((k) => { const d = byDate[k]; const evs = d ? d.events : [];
        return `<button class="cal-day ${k.slice(0, 7) !== calMonth ? 'out' : ''} ${k === T ? 'today' : ''} ${k === calSel ? 'sel' : ''}" data-day="${k}"><span class="num">${Number(k.slice(8))}${d && d.questions ? `<i>✏️${d.questions}</i>` : ''}</span>
          <span class="evs">${evs.slice(0, 3).map((e) => `<span class="chip-ev ev-${e.kind} ${e.state ? 'state-' + e.state : ''}" title="${esc(e.title)}">${esc(e.title)}</span>`).join('')}${evs.length > 3 ? `<span class="tiny faint">+${evs.length - 3}</span>` : ''}</span></button>`; }).join('')}</div></div>
    <div class="card day-panel" id="day-panel"></div></div>`;
  const panel = (k) => {
    const d = byDate[k] || { events: [], questions: 0 };
    const dotColor = { review: '#8b5cf6', plan: '#3b6cf6', task: '#0284c7', done: '#10b981', 'exam-done': '#10b981', school: '#f59e0b', missions: '#f97316' };
    $('#day-panel').innerHTML = `<div class="card-head"><h3>${new Date(k + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</h3><button class="btn sm ghost" id="add-on-day">+ Task</button></div>
      ${d.questions ? `<div class="small muted" style="margin-bottom:8px">✏️ ${d.questions} questions answered</div>` : ''}
      ${d.events.length ? d.events.map((e) => `<div class="ev"><span class="dot" style="background:${e.color || dotColor[e.kind] || '#94a3b8'}"></span><div class="grow"><b class="small">${esc(e.title)}</b>${e.detail ? `<div class="small muted">${esc(e.detail)}</div>` : ''}</div>
        ${e.kind === 'review' && k <= T ? '<button class="btn sm soft" data-rv>Review</button>' : ''}
        ${e.kind === 'plan' && e.styleId ? `<button class="btn sm soft" data-start="${e.styleId}">Start</button>` : ''}
        ${e.kind === 'plan' && e.examId ? `<button class="btn sm soft" data-ex="${esc(e.examId)}" data-name="${esc(e.title)}">Start</button>` : ''}
        ${e.kind === 'task' ? `<span class="pill ${e.state === 'done' ? 'good' : e.state === 'missed' ? 'bad' : e.state === 'waiting' ? 'warn' : ''}">${e.state}</span>` : ''}
        ${e.kind === 'exam-done' ? `<a class="btn sm ghost" href="#/app/exam/${e.ref}">View</a>` : ''}</div>`).join('') : '<div class="empty small"><div class="e">🌤️</div>Nothing planned.</div>'}`;
    bindStart($('#day-panel'));
    $$('[data-rv]', $('#day-panel')).forEach((b) => (b.onclick = () => startReview({})));
    $$('[data-ex]', $('#day-panel')).forEach((b) => (b.onclick = () => startExam(b.dataset.ex, b.dataset.name, b.dataset.ex.startsWith('topic:') ? 15 : 12, 25)));
    $('#add-on-day').onclick = () => taskForm(c, { dueDate: k }, () => drawCalendar(el, c));
  };
  $$('[data-day]', el).forEach((b) => (b.onclick = () => { calSel = b.dataset.day; $$('.cal-day', el).forEach((x) => x.classList.toggle('sel', x === b)); panel(calSel); }));
  const shift = (n) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); calMonth = d.toISOString().slice(0, 7); drawCalendar(el, c); };
  $('#prev').onclick = () => shift(-1); $('#next').onclick = () => shift(1);
  $('#tday').onclick = () => { calMonth = T.slice(0, 7); calSel = T; drawCalendar(el, c); };
  panel(calSel);
}

async function drawBoard(el, c) {
  el.innerHTML = '<div class="spinner"></div>';
  const { tasks } = await api('GET', `/api/students/${c.id}/tasks`);
  const isParent = S.me.role !== 'student';
  const cols = [['todo', '📋 To do'], ['doing', '⚙️ In progress'], ['waiting', '⏳ Waiting approval'], ['done', '✅ Done']];
  const colOf = (t) => (t.recurrence !== 'none' ? (t.state === 'done' ? 'done' : t.state === 'waiting' ? 'waiting' : 'todo') : t.state === 'missed' ? 'todo' : t.state);
  const rec = { none: '', daily: '🔁 daily', weekdays: '🔁 weekdays', weekly: '🔁 weekly' };
  const card = (t) => `<div class="task p-${t.priority}"><div class="row spread"><span class="t">${esc(t.title)}</span>${t.coins ? `<span class="pill">${coin(t.coins)}</span>` : ''}</div>
    ${t.notes ? `<div class="small muted" style="margin-top:4px">${esc(t.notes)}</div>` : ''}
    <div class="meta"><span>${t.state === 'missed' ? '⚠️ overdue · ' : ''}📅 ${fmtDate(t.date)}${t.dueTime ? ' ' + t.dueTime : ''}</span>${rec[t.recurrence] ? `<span>${rec[t.recurrence]}</span>` : ''}${t.subjectName ? `<span>${t.icon} ${esc(t.subjectName)}</span>` : ''}${t.refName ? `<span>🔗 ${esc(t.refName)}</span>` : ''}${t.kind !== 'custom' ? '<span>✨ auto-completes</span>' : t.requiresApproval ? '<span>👍 needs approval</span>' : ''}<span>by ${t.createdByRole === 'student' ? (isParent ? esc(c.name) : 'me') : 'parent'}</span></div>
    <div class="acts">
      ${t.state !== 'done' && t.state !== 'waiting' && t.recurrence === 'none' && t.state !== 'doing' ? `<button class="btn sm ghost" data-doing="${t.id}">Start</button>` : ''}
      ${t.kind === 'lesson' && t.ref && t.state !== 'done' ? `<button class="btn sm soft" data-start="${t.ref}">Open lesson</button>` : ''}
      ${t.kind === 'review' && t.state !== 'done' ? '<button class="btn sm soft" data-rv>Start review</button>' : ''}
      ${(t.kind === 'custom' || isParent) && t.state !== 'done' && t.state !== 'waiting' ? `<button class="btn sm good" data-done="${t.id}" data-date="${t.date}">✓ Done</button>` : ''}
      ${isParent && t.state === 'waiting' ? `<button class="btn sm good" data-approve="${t.id}" data-date="${t.date}">Approve</button><button class="btn sm ghost" data-reject="${t.id}" data-date="${t.date}">Send back</button>` : ''}
      ${isParent || t.createdByRole === 'student' ? `<button class="btn sm ghost" data-edit="${t.id}">Edit</button><button class="btn sm ghost" data-del="${t.id}" style="color:var(--bad)">✕</button>` : ''}
    </div></div>`;
  el.innerHTML = `<div class="board">${cols.map(([k, l]) => { const list = tasks.filter((t) => colOf(t) === k); return `<div class="col"><h4><span>${l}</span><span>${list.length}</span></h4>${list.map(card).join('') || '<div class="small faint" style="padding:8px">Nothing here</div>'}</div>`; }).join('')}</div>`;
  const redraw = () => drawBoard(el, c);
  bindStart(el);
  $$('[data-rv]', el).forEach((b) => (b.onclick = () => startReview({})));
  $$('[data-doing]', el).forEach((b) => (b.onclick = async () => { await api('PATCH', `/api/students/${c.id}/tasks/${b.dataset.doing}`, { status: 'doing' }); redraw(); }));
  $$('[data-done]', el).forEach((b) => (b.onclick = async () => { try { const r = await api('POST', `/api/students/${c.id}/tasks/${b.dataset.done}/complete`, { date: b.dataset.date }); if (r.waiting) toast('Sent to your parent for approval ⏳'); else { confetti(40); celebrate(r.rewards); } await loadMe(); redraw(); } catch (e) { toast(e.message, 'bad'); } }));
  $$('[data-approve]', el).forEach((b) => (b.onclick = async () => { await api('POST', `/api/students/${c.id}/tasks/${b.dataset.approve}/approve`, { date: b.dataset.date }); toast('Approved — coins sent', 'good'); redraw(); }));
  $$('[data-reject]', el).forEach((b) => (b.onclick = async () => { await api('POST', `/api/students/${c.id}/tasks/${b.dataset.reject}/approve`, { date: b.dataset.date, reject: true }); toast('Sent back'); redraw(); }));
  $$('[data-edit]', el).forEach((b) => (b.onclick = () => taskForm(c, tasks.find((t) => t.id === b.dataset.edit), redraw)));
  $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete task?', 'This removes the task and its history.', { ok: 'Delete', danger: true })) { await api('DELETE', `/api/students/${c.id}/tasks/${b.dataset.del}`); redraw(); } }));
}

function taskForm(c, existing, after) {
  const t = { title: '', notes: '', dueDate: todayStr(), dueTime: '', recurrence: 'none', priority: 'normal', kind: 'custom', subject: '', ref: '', coins: 0, requiresApproval: true, ...(existing || {}) };
  const isParent = S.me.role !== 'student';
  const subs = enrolled(c);
  const editing = existing && existing.id;
  modal(`<h2>${editing ? 'Edit task' : 'New task'}${isParent ? ` for ${esc(c.name)}` : ''}</h2><p class="muted">${isParent ? 'Tasks linked to app work complete themselves. Custom tasks (homework, reading, revision) can need your approval before coins are paid.' : 'Plan your own study — homework, revision, reading.'}</p>
    <form id="tf" class="stack" style="margin-top:14px">
      <label class="field"><span>Title</span><input class="input" name="title" maxlength="120" value="${esc(t.title)}" placeholder="e.g. Science homework p.42, Revise Macbeth Act 1" required></label>
      <div class="grid2"><label class="field"><span>Type</span><select class="input" name="kind" id="tk">${[['custom', '✍️ Custom task'], ['lesson', '📘 Lesson in the app'], ['topic', '📖 Any lesson in a topic'], ['review', '🔁 Review session'], ['test', '📝 Topic test']].map(([k, l]) => `<option value="${k}" ${t.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Subject</span><select class="input" name="subject" id="ts"><option value="">— any —</option>${subs.map((x) => `<option value="${x.id}" ${t.subject === x.id ? 'selected' : ''}>${x.icon} ${esc(x.name)}</option>`).join('')}</select></label></div>
      <label class="field" id="ref-wrap"><span id="ref-l">Lesson / topic</span><select class="input" name="ref" id="tr"></select></label>
      <div class="grid2"><label class="field"><span>Date</span><input class="input" type="date" name="dueDate" value="${t.dueDate}"></label><label class="field"><span>Time (optional)</span><input class="input" type="time" name="dueTime" value="${t.dueTime || ''}"></label></div>
      <div class="grid2"><label class="field"><span>Repeat</span><select class="input" name="recurrence">${[['none', 'Once'], ['daily', 'Every day'], ['weekdays', 'Weekdays (Mon–Fri)'], ['weekly', 'Every week']].map(([k, l]) => `<option value="${k}" ${t.recurrence === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Priority</span><select class="input" name="priority">${['high', 'normal', 'low'].map((k) => `<option ${t.priority === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <label class="field"><span>Notes</span><input class="input" name="notes" maxlength="500" value="${esc(t.notes || '')}"></label>
      ${isParent ? `<div class="grid2"><label class="field"><span>Coin reward</span><input class="input" type="number" min="0" max="500" name="coins" value="${t.coins || 0}"></label>
        <label class="row small" style="margin-top:26px"><input type="checkbox" name="requiresApproval" ${t.requiresApproval ? 'checked' : ''}> I approve it before coins are paid (custom tasks)</label></div>` : ''}
      <div class="error" id="tf-err"></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">${editing ? 'Save' : 'Add task'}</button></div></form>`, {
    onMount: (m, close) => {
      const fillRef = () => {
        const kind = $('#tk', m).value; const sub = $('#ts', m).value;
        const wrap = $('#ref-wrap', m); wrap.classList.toggle('hidden', !['lesson', 'topic', 'test'].includes(kind));
        const topics = S.cur.topics.filter((x) => (!sub || x.subject === sub) && x.year <= c.yearGroup && (sub || x.subject === S.subject));
        const opts = kind === 'lesson' ? topics.flatMap((x) => x.styles.map((st) => [st.id, `${x.name} — ${st.name}`])) : topics.map((x) => [x.id, `Y${x.year} · ${x.name}`]);
        $('#ref-l', m).textContent = kind === 'lesson' ? 'Lesson (question style)' : 'Topic';
        $('#tr', m).innerHTML = `${kind === 'lesson' ? '<option value="">— any lesson in this subject —</option>' : ''}${opts.slice(-400).map(([id, l]) => `<option value="${id}" ${t.ref === id ? 'selected' : ''}>${esc(l)}</option>`).join('')}`;
      };
      $('#tk', m).onchange = fillRef; $('#ts', m).onchange = fillRef; fillRef();
      $('#tf', m).onsubmit = async (e) => {
        e.preventDefault(); const b = Object.fromEntries(new FormData(e.target));
        if (isParent) b.requiresApproval = !!b.requiresApproval;
        if (!['lesson', 'topic', 'test'].includes(b.kind)) b.ref = '';
        try {
          if (editing) await api('PATCH', `/api/students/${c.id}/tasks/${existing.id}`, b); else await api('POST', `/api/students/${c.id}/tasks`, b);
          close(); toast(editing ? 'Task saved' : 'Task added 📌', 'good'); after && after();
        } catch (err) { $('#tf-err', m).textContent = err.message; }
      };
    },
  });
}

// ---------- Gift-card reward tickets ----------
async function renderGifts(el, c) {
  if (!el) return;
  const g = await api('GET', `/api/students/${c.id}/gifts`);
  const isParent = S.me.role !== 'student';
  const st = { pending: ['warn', '⏳ waiting for parent'], approved: ['brand', '👍 approved'], delivered: ['good', '🎁 delivered'], declined: ['bad', 'declined · refunded'], cancelled: ['', 'cancelled · refunded'] };
  el.innerHTML = `<div class="card-head"><div><h3>🎟️ Game & gift-card tickets</h3><div class="small muted">Swap coins for a real reward — your parent approves and buys the card. Limit £${g.settings.monthlyLimit}/month (used £${g.spentThisMonth}).</div></div>${isParent ? '<button class="btn sm ghost" id="gift-set">Settings</button>' : ''}</div>
    ${!g.settings.enabled ? '<div class="demo-note">Gift-card tickets are switched off.</div>' : `<div class="gift-grid">${g.catalogue.map((cd) => `<div class="gift"><span class="ic">${cd.icon}</span><b class="small">${esc(cd.name)}</b>
      <select class="input" data-val="${cd.id}">${cd.options.map((o) => `<option value="${o.value}">£${o.value} · ${o.coins.toLocaleString()} coins</option>`).join('')}</select>
      <button class="btn sm block" data-req="${cd.id}">Request</button></div>`).join('')}</div>`}
    <div class="tiny muted" style="margin:18px 0 6px">Tickets</div>
    ${g.tickets.length ? g.tickets.map((t) => `<div class="ticket"><span style="font-size:24px">${t.icon}</span><div class="grow"><b>£${t.value} ${esc(t.cardName)}</b> <span class="pill ${st[t.status][0]}">${st[t.status][1]}</span>
      <div class="small muted">${t.coins.toLocaleString()} coins · ${fmtDate(t.createdAt)}${t.note ? ' · “' + esc(t.note) + '”' : ''}${t.reply ? ' · Parent: ' + esc(t.reply) : ''}</div>
      ${t.code ? `<div class="small" style="margin-top:6px">Code: <span class="code">${esc(t.code)}</span></div>` : ''}</div>
      ${isParent && ['pending', 'approved'].includes(t.status) ? `${t.status === 'pending' ? `<button class="btn sm good" data-tact="approve" data-t="${t.id}">Approve</button>` : ''}<button class="btn sm" data-tact="deliver" data-t="${t.id}">Mark delivered</button><button class="btn sm ghost" data-tact="decline" data-t="${t.id}">Decline</button>` : ''}
      ${!isParent && t.status === 'pending' ? `<button class="btn sm ghost" data-tact="cancel" data-t="${t.id}">Cancel</button>` : ''}</div>`).join('') : '<div class="small muted">No tickets yet.</div>'}`;
  const redraw = () => renderGifts(el, c);
  $$('[data-req]', el).forEach((b) => (b.onclick = async () => {
    const cd = g.catalogue.find((x) => x.id === b.dataset.req); const value = Number($(`[data-val="${cd.id}"]`, el).value); const coins = value * g.settings.coinsPerPound;
    modal(`<h2>${cd.icon} £${value} ${esc(cd.name)}</h2><p class="muted">This uses <b>${coins.toLocaleString()} coins</b> (you have ${g.coins.toLocaleString()}). Your parent gets a ticket to approve. If they decline, your coins come back.</p>
      <label class="field" style="margin-top:12px"><span>Message for your parent (optional)</span><input class="input" id="gnote" maxlength="140" placeholder="e.g. For the new Roblox game!"></label>
      <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="gok" ${g.coins < coins ? 'disabled' : ''}>${g.coins < coins ? `Need ${(coins - g.coins).toLocaleString()} more coins` : 'Send ticket 🎟️'}</button></div>`, {
      onMount: (m, close) => { $('#gok', m).onclick = async () => { try { await api('POST', `/api/students/${c.id}/gifts`, { cardId: cd.id, value, note: $('#gnote', m).value }); close(); confetti(50); toast('Ticket sent to your parent 🎟️', 'good'); await loadMe(); redraw(); } catch (e) { toast(e.message, 'bad'); } }; },
    });
  }));
  $$('[data-tact]', el).forEach((b) => (b.onclick = async () => {
    const act = b.dataset.tact;
    if (act === 'deliver' || act === 'decline') {
      modal(`<h2>${act === 'deliver' ? 'Mark as delivered' : 'Decline ticket'}</h2><p class="muted">${act === 'deliver' ? 'Buy the gift card yourself (shop, app store or online), then optionally paste the code so your child can see it on their Rewards page.' : 'The coins are refunded to your child.'}</p>
        ${act === 'deliver' ? '<label class="field" style="margin-top:12px"><span>Gift-card code (optional)</span><input class="input" id="gcode" maxlength="80" autocomplete="off"></label>' : ''}
        <label class="field" style="margin-top:12px"><span>Message (optional)</span><input class="input" id="greply" maxlength="200"></label>
        <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn ghost" data-close>Cancel</button><button class="btn ${act === 'decline' ? 'danger' : 'good'}" id="gdo">${act === 'deliver' ? 'Delivered 🎁' : 'Decline'}</button></div>`, {
        onMount: (m, close) => { $('#gdo', m).onclick = async () => { await api('PATCH', `/api/students/${c.id}/gifts/${b.dataset.t}`, { action: act, code: $('#gcode', m)?.value || '', reply: $('#greply', m).value }); close(); toast('Updated', 'good'); redraw(); }; },
      });
      return;
    }
    await api('PATCH', `/api/students/${c.id}/gifts/${b.dataset.t}`, { action: act }); toast(act === 'cancel' ? 'Cancelled — coins refunded' : 'Approved 👍', 'good'); await loadMe(); redraw();
  }));
  $('#gift-set', el)?.addEventListener('click', () => modal(`<h2>Gift-card settings for ${esc(c.name)}</h2><form id="gs" class="stack" style="margin-top:14px">
      <label class="row"><input type="checkbox" name="enabled" ${g.settings.enabled ? 'checked' : ''}> Allow gift-card tickets</label>
      <div class="grid2"><label class="field"><span>Coins per £1</span><input class="input" type="number" min="50" max="5000" name="coinsPerPound" value="${g.settings.coinsPerPound}"></label>
        <label class="field"><span>Monthly limit (£)</span><input class="input" type="number" min="0" max="200" name="monthlyLimit" value="${g.settings.monthlyLimit}"></label></div>
      <div class="field"><span>Allowed cards</span><div class="check-grid">${g.allCards.map((cd) => `<label><input type="checkbox" name="allowed" value="${cd.id}" ${g.settings.allowed.includes(cd.id) ? 'checked' : ''}> ${cd.icon} ${esc(cd.name)}</label>`).join('')}</div></div>
      <p class="small faint" style="margin:0">Stepwise never buys cards or takes payment for them — you decide and buy the card yourself.</p>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Save</button></div></form>`, {
    wide: true,
    onMount: (m, close) => { $('#gs', m).onsubmit = async (e) => { e.preventDefault(); const fd = new FormData(e.target); await api('PUT', `/api/students/${c.id}/gifts/settings`, { enabled: !!fd.get('enabled'), coinsPerPound: fd.get('coinsPerPound'), monthlyLimit: fd.get('monthlyLimit'), allowed: fd.getAll('allowed') }); close(); toast('Saved', 'good'); redraw(); }; },
  }));
}

on(/^\/admin\/tickets$/, async () => {
  shell('tickets', 'Gift tickets', '<div class="spinner"></div>', { admin: true });
  const { tickets } = await api('GET', '/api/admin/tickets');
  page().innerHTML = `<div class="page-head"><h1>Gift-card tickets</h1><p>Children redeem coins for gift-card tickets; parents approve and buy the cards themselves. ${tickets.length} tickets.</p></div>
    <div class="card"><div class="table-wrap"><table class="data"><tr><th>Date</th><th>Student</th><th>Card</th><th>Value</th><th>Coins</th><th>Status</th></tr>
    ${tickets.map((t) => `<tr><td class="small">${fmtDateTime(t.createdAt)}</td><td><a href="#/admin/users/${t.studentId}">${esc(t.studentName)}</a></td><td>${t.icon} ${esc(t.cardName)}</td><td>£${t.value}</td><td>${t.coins}</td><td><span class="pill">${t.status}</span></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No tickets yet</td></tr>'}</table></div></div>`;
}, { auth: true, roles: ['admin'] });

// ---------- Family (parent) ----------
function childForm(existing) {
  const c = existing || { yearGroup: 9, tier: 'H', targetGrade: 7, subjects: S.cur.subjects.map((s) => s.id) };
  const subs = c.subjects?.length ? c.subjects : S.cur.subjects.map((s) => s.id);
  modal(`<h2>${existing ? 'Edit ' + esc(c.name) : 'Add a child'}</h2><p class="muted">${existing ? 'Update details, subjects or login.' : 'Each child gets their own roadmap and login.'}</p>
    <form id="cf" class="stack" style="margin-top:18px">
      <label class="field"><span>First name</span><input class="input" name="name" value="${esc(c.name || '')}" required></label>
      <div class="grid2"><label class="field"><span>Year group (this school year)</span><select class="input" name="yearGroup">${S.cur.years.map((y) => `<option ${c.yearGroup === y ? 'selected' : ''} value="${y}">Year ${y}</option>`).join('')}</select></label>
      <label class="field"><span>Tier (Maths & Science)</span><select class="input" name="tier"><option value="H" ${c.tier !== 'F' ? 'selected' : ''}>Higher (grades 4–9)</option><option value="F" ${c.tier === 'F' ? 'selected' : ''}>Foundation (grades 1–5)</option></select></label></div>
      <div class="field"><span>Subjects</span><div class="check-grid">${S.cur.subjects.map((s) => `<label><input type="checkbox" name="subjects" value="${s.id}" ${subs.includes(s.id) ? 'checked' : ''}> ${s.icon} ${esc(s.name)}</label>`).join('')}</div></div>
      <label class="field"><span>Target grade: <b id="tg">${c.targetGrade}</b></span><input type="range" min="1" max="9" name="targetGrade" value="${c.targetGrade}" style="width:100%" oninput="document.getElementById('tg').textContent=this.value"></label>
      <div class="grid2"><label class="field"><span>Student username ${existing ? '' : '(optional)'}</span><input class="input" name="username" value="${esc(c.username || '')}" placeholder="auto-generated" autocomplete="off"></label>
      <label class="field"><span>${existing ? 'New password (optional)' : 'Student password (optional)'}</span><input class="input" name="password" type="password" minlength="8" autocomplete="new-password" placeholder="min 8 characters"></label></div>
      <p class="small faint" style="margin:0">Set a username and password so your child can sign in on their own device.</p>
      <div class="error" id="cf-err"></div>
      <div class="row spread">${existing ? '<button type="button" class="btn ghost" id="del-child" style="color:var(--bad)">Delete child</button>' : '<span></span>'}<div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">${existing ? 'Save' : 'Add child'}</button></div></div>
    </form>`, {
    wide: true,
    onMount: (m, close) => {
      $('#cf', m).onsubmit = async (e) => {
        e.preventDefault(); const fd = new FormData(e.target); const body = Object.fromEntries(fd); body.subjects = fd.getAll('subjects');
        if (!body.subjects.length) { $('#cf-err', m).textContent = 'Choose at least one subject'; return; }
        if (!body.password) delete body.password; if (!body.username) delete body.username;
        try {
          const r = existing ? await api('PATCH', `/api/children/${c.id}`, body) : await api('POST', '/api/children', body);
          if (!existing) { S.childId = r.child.id; store.set('childId', S.childId); }
          await loadMe(); close(); toast(existing ? 'Saved' : `${r.child.name} added — username: ${r.child.username}`, 'good'); render();
        } catch (err) { $('#cf-err', m).textContent = err.message; }
      };
      $('#del-child', m)?.addEventListener('click', async () => {
        close();
        if (await confirmBox(`Delete ${esc(c.name)}?`, 'This permanently removes their profile, progress, lessons and exam results. Unused credits stay in your wallet.', { ok: 'Delete', danger: true })) {
          await api('DELETE', `/api/children/${c.id}`); await loadMe(); toast('Child removed'); render();
        }
      });
    },
  });
}

on(/^\/app\/family(\?new=1)?$/, async (isNew) => {
  shell('family', 'Family', '<div class="spinner"></div>');
  const overviews = await Promise.all(S.children.map((c) => api('GET', `/api/students/${c.id}/overview?subject=maths`)));
  page().innerHTML = `<div class="page-head row spread wrap"><div><h1>Your family</h1><p>Manage children, subjects and logins, and see everyone’s progress at a glance.</p></div><button class="btn" id="add">+ Add a child</button></div>
    ${S.children.length ? `<div class="grid-3">${overviews.map(({ student: c, overall: s }) => `<div class="card">
      <div class="row">${avatar(c, 'lg')}<div class="grow"><h3 style="font-size:19px">${esc(c.name)}</h3><div class="small muted">Year ${c.yearGroup} · ${c.tier === 'F' ? 'Foundation' : 'Higher'} · @${esc(c.username)}</div></div></div>
      <div class="row" style="margin:18px 0 8px;gap:18px">${donut(s.coverage, '#3b6cf6', 86)}<div class="small" style="line-height:1.9"><div>✅ <b>${s.correct}</b> correct · 🎯 ${s.accuracy ?? '–'}%</div><div>🔥 ${s.streak}-day streak · Lv ${s.level.level}</div><div>🪙 ${s.coins} coins · 📜 ${s.certificates} certificates</div></div></div>
      <div style="margin-bottom:14px">${bars(s.strands.filter((x) => enrolled(c).some((e) => e.id === x.id)).slice(0, 5).map((x) => ({ name: `${x.icon} ${x.name}`, value: x.accuracy, color: x.color })))}</div>
      <div class="row"><button class="btn sm grow" data-view="${c.id}">View dashboard</button><button class="btn sm ghost" data-report="${c.id}">📄 Report</button><button class="btn sm ghost" data-goals="${c.id}">🎯 Goals</button><button class="btn sm ghost" data-edit="${c.id}">Edit</button></div></div>`).join('')}</div>`
    : '<div class="card empty"><div class="e">👨‍👩‍👧</div>No children yet. Add one to start their free lesson.</div>'}`;
  $('#add').onclick = () => childForm();
  $$('[data-view]').forEach((b) => (b.onclick = () => { S.childId = b.dataset.view; store.set('childId', S.childId); location.hash = '#/app'; }));
  $$('[data-report]').forEach((b) => (b.onclick = () => { S.childId = b.dataset.report; store.set('childId', S.childId); location.hash = '#/app/report'; }));
  $$('[data-goals]').forEach((b) => (b.onclick = () => { S.childId = b.dataset.goals; store.set('childId', S.childId); location.hash = '#/app/rewards'; }));
  $$('[data-edit]').forEach((b) => (b.onclick = () => childForm(S.children.find((c) => c.id === b.dataset.edit))));
  if (isNew && !S.children.length) childForm();
}, { auth: true, roles: ['parent'] });

// ---------- Billing ----------
on(/^\/app\/billing$/, async () => {
  shell('billing', 'Billing', '<div class="spinner"></div>');
  const b = await api('GET', '/api/billing');
  page().innerHTML = `<div class="page-head"><h1>Wallet &amp; billing</h1><p>£1 per lesson, topic test or checkpoint. Review sessions are free. Credits are shared by the whole family and never expire.</p></div>
    ${b.freeAccess ? '<div class="card" style="margin-bottom:22px;border-left:4px solid var(--good)"><b>✨ Your family has free access.</b> <span class="muted">Lessons and tests don’t use credits.</span></div>' : ''}
    <div class="grid-main"><div class="stack">
      <div class="card welcome"><div><div class="tiny" style="color:#c7d2fe">Available credits</div><div style="font-size:56px;font-weight:900;line-height:1.1">${b.credits}</div><p>${b.freeLessonAvailable ? '🎁 Your free trial lesson is still available.' : `≈ ${b.credits} lessons`} · Every 10 completed lessons earns a free one.</p></div></div>
      <div class="card"><div class="card-head"><h3>Top up</h3>${b.live ? '<span class="pill good">Secure card payments by Stripe</span>' : '<span class="pill warn">Demo mode</span>'}</div><div class="stack">${b.packs.map((p, i) => `<button class="pack ${i === 1 ? 'on' : ''}" data-pack="${p.id}"><div><b style="font-size:17px">${esc(p.label)}</b>${p.tag ? ` <span class="pill brand">${esc(p.tag)}</span>` : ''}<div class="small muted">${p.credits + p.bonus} credits · ${money(p.price / (p.credits + p.bonus))} per lesson</div></div><div class="p">${money(p.price)}</div></button>`).join('')}</div>
        <button class="btn lg block" style="margin-top:18px" id="pay">Continue to payment</button></div>
      <div class="card"><div class="card-head"><h3>Card on file</h3></div>${b.cardVerified ? `<div class="row"><span style="font-size:26px">💳</span><div><b>${esc((b.card.brand || '').toUpperCase())} •••• ${esc(b.card.last4 || '')}</b><div class="small muted">Checked with a £0 verification</div></div></div>` : '<div class="small muted">No card checked yet. A £0 check is needed for the free trial lesson.</div><button class="btn sm ghost" style="margin-top:10px" id="check-card">Check a card (£0)</button>'}</div>
    </div><div class="stack">
      <div class="card"><div class="card-head"><h3>Payments</h3></div>${b.payments.length ? `<div class="table-wrap"><table class="data"><tr><th>Date</th><th>Item</th><th>Amount</th></tr>${b.payments.map((p) => `<tr><td>${fmtDate(p.createdAt)}</td><td>${esc(p.label)}</td><td><b>${money(p.amount)}</b></td></tr>`).join('')}</table></div>` : '<div class="empty small">No payments yet.</div>'}</div>
      <div class="card"><div class="card-head"><h3>Credit history</h3></div>${b.ledger.length ? `<div class="table-wrap"><table class="data">${b.ledger.map((l) => `<tr><td class="small muted">${fmtDateTime(l.at)}</td><td>${esc(l.reason)}</td><td style="text-align:right"><b style="color:${l.delta > 0 ? 'var(--good)' : l.delta < 0 ? 'var(--ink)' : 'var(--ink-3)'}">${l.delta > 0 ? '+' : ''}${l.delta}</b></td></tr>`).join('')}</table></div>` : '<div class="empty small">No activity yet.</div>'}</div>
    </div></div>`;
  let sel = b.packs[1].id;
  $$('[data-pack]').forEach((x) => (x.onclick = () => { sel = x.dataset.pack; $$('[data-pack]').forEach((y) => y.classList.toggle('on', y === x)); }));
  $('#pay').onclick = () => payForPack(b.packs.find((x) => x.id === sel));
  $('#check-card')?.addEventListener('click', async () => { if (await cardCheck()) render(); });
}, { auth: true, roles: ['parent'] });

// ---------- Settings & help ----------
on(/^\/app\/settings$/, async () => {
  shell('settings', 'Settings', `<div class="page-head"><h1>Settings</h1></div>
    <div style="max-width:720px" class="stack">
      <div class="card"><div class="tiny muted" style="margin-bottom:12px">Your account</div><form id="pf" class="stack"><div class="grid2"><label class="field"><span>Name</span><input class="input" name="name" value="${esc(S.me.name)}"></label>
        <label class="field"><span>${S.me.email ? 'Email' : 'Username'}</span><input class="input" value="${esc(S.me.email || S.me.username)}" disabled></label></div><div><button class="btn">Save</button></div></form></div>
      <div class="card"><div class="tiny muted" style="margin-bottom:12px">Change password</div><form id="pw" class="stack"><div class="grid2"><label class="field"><span>Current password</span><input class="input" type="password" name="currentPassword" autocomplete="current-password" required></label>
        <label class="field"><span>New password</span><input class="input" type="password" name="newPassword" minlength="8" autocomplete="new-password" required></label></div><div class="error" id="pw-err"></div><div><button class="btn">Update password</button></div></form></div>
      ${S.me.role === 'parent' ? `<div class="card"><div class="tiny muted" style="margin-bottom:12px">Children</div><p class="small muted" style="margin-top:0">Deleting a child removes their profile, progress and lesson history. Unused credits stay on your account.</p>
        ${S.children.map((c) => `<div class="row spread" style="padding:10px 0;border-top:1px solid var(--line)"><div class="row">${avatar(c)}<div><b>${esc(c.name)}</b><div class="small muted">Year ${c.yearGroup}</div></div></div><button class="btn sm ghost" data-edit="${c.id}">Manage</button></div>`).join('')}</div>
      <div class="card" style="border-color:color-mix(in srgb,var(--bad) 40%,var(--line))"><div class="tiny" style="color:var(--bad);margin-bottom:12px">Delete account</div><p style="margin-top:0">Permanently delete your account, children and all progress. This can’t be undone.</p><button class="btn danger" id="del-acc">Delete my account</button></div>` : ''}
    </div>`, { admin: S.me.role === 'admin' });
  $('#pf').onsubmit = async (e) => { e.preventDefault(); await api('PATCH', '/api/me', Object.fromEntries(new FormData(e.target))); await loadMe(); toast('Saved', 'good'); render(); };
  $('#pw').onsubmit = async (e) => { e.preventDefault(); try { await api('PATCH', '/api/me', Object.fromEntries(new FormData(e.target))); e.target.reset(); toast('Password updated', 'good'); } catch (err) { $('#pw-err').textContent = err.message; } };
  $$('[data-edit]').forEach((b) => (b.onclick = () => childForm(S.children.find((c) => c.id === b.dataset.edit))));
  $('#del-acc')?.addEventListener('click', async () => { if (await confirmBox('Delete your account?', 'All children, progress, exam results and remaining credits will be permanently removed.', { ok: 'Delete everything', danger: true })) { await api('DELETE', '/api/me'); S.me = null; location.hash = '#/'; } });
});

on(/^\/app\/help$/, async () => {
  const faq = [
    ['How does a lesson work?', 'Each lesson covers one question style. It starts with a short explanation and a worked example (read aloud in Maths), then 10 practice questions plus 2 quick review questions from earlier topics. You get 3 tries per question, a hint, and the full explanation afterwards.'],
    ['Where are the topic explanations?', 'Open the Roadmap & Learn page, tap any topic and choose “Learn this topic”. Each page has objectives, key words, step-by-step teaching with worked examples, common mistakes and exam tips.'],
    ['How does review work?', 'After each lesson the style is scheduled for review (1 day, 2 days, 4 days, a week… later). Every wrong or skipped answer goes into the mistakes bank. Review sessions are free and mix your mistakes with topics that are due.'],
    ['What happens after a test?', 'You get a grade and a breakdown by area. Then the app walks through every question you missed: your answer, the correct answer, the key idea, the full method (read aloud if you like) and a similar question to try straight away.'],
    ['How do rewards work?', 'Correct answers earn XP and coins. Levels, badges and certificates unlock as you progress. Coins buy avatars, backgrounds and streak freezes. Every 10 completed lessons earns a free lesson. Parents can also set goals with real-world rewards.'],
    ['What does it cost?', 'Every lesson, topic test and checkpoint/mock costs 1 credit (£1). Review sessions are free. The first lesson is free after a £0 card check (your card is not charged). Credits never expire.'],
    ['How do I type answers?', 'Multiple-choice: tap an option (or several, if asked). Ordering: tap the options in order. Maths: use the keypad for symbols — fractions 3/4, mixed numbers 1 3/4, powers x^2, two answers separated by a comma.'],
    ['Which exam boards?', 'Maths follows Pearson Edexcel 1MA1. Biology, Chemistry, Physics, English Language, English Literature, Computer Science, Geography and History follow the AQA specifications. Years 7–9 build the foundations.'],
  ];
  shell('help', 'Help', `<div class="page-head"><h1>Help &amp; FAQ</h1><p>Everything you need to get the most out of Stepwise.</p></div>
    <div class="stack" style="max-width:820px">${faq.map(([q, a]) => `<details class="card"><summary style="font-weight:700;cursor:pointer">${q}</summary><p class="muted" style="margin:12px 0 0">${a}</p></details>`).join('')}</div>`);
});

// ---------- Admin ----------
const roleBadge = (r) => `<span class="pill ${r === 'admin' ? 'bad' : r === 'parent' ? 'brand' : 'good'}">${r}</span>`;
const statusBadge = (s) => `<span class="pill ${s === 'active' ? 'good' : 'warn'}">${s}</span>`;
const freeBadge = '<span class="pill" style="background:#dcfce7;color:#047857">✨ free access</span>';

on(/^\/admin$/, async () => {
  shell('admin', 'Admin overview', '<div class="spinner"></div>', { admin: true });
  const s = await api('GET', '/api/admin/stats');
  const yTotal = Math.max(1, s.yearMix.reduce((t, y) => t + y.n, 0));
  page().innerHTML = `<div class="page-head"><h1>Platform overview</h1><p>${s.curriculum.subjects} subjects · ${s.curriculum.topics} topics · ${s.curriculum.styles} question styles · ${s.curriculum.learn} topic explanations.</p></div>
    <div class="kpis">
      <div class="card kpi"><div class="ico" style="background:var(--good-soft)">💷</div><div class="v">${money(s.revenue)}</div><div class="l">Total revenue · ${s.payments} payments</div></div>
      <div class="card kpi"><div class="ico" style="background:var(--brand-soft)">👪</div><div class="v">${s.parents}</div><div class="l">Parents · ${s.students} students · ${s.freeAccess} free access</div></div>
      <div class="card kpi"><div class="ico" style="background:var(--warn-soft)">📘</div><div class="v">${s.lessons}</div><div class="l">Lessons started · ${s.lessonsCompleted} completed</div></div>
      <div class="card kpi"><div class="ico" style="background:#f3e8ff">📝</div><div class="v">${s.exams}</div><div class="l">Tests taken · ${s.creditsOutstanding} credits unspent</div></div>
    </div>
    <div class="grid-main"><div class="stack">
      <div class="card"><div class="card-head"><h3>Revenue · last 30 days</h3><span class="small muted">${money(s.days.reduce((t, d) => t + d.revenue, 0))}</span></div>${barChart(s.days.map((d) => ({ label: fmtDate(d.date), short: d.date.slice(8), value: d.revenue })), { color: '#10b981', fmt: (v) => '£' + v })}</div>
      <div class="card"><div class="card-head"><h3>Lessons started · last 30 days</h3></div>${barChart(s.days.map((d) => ({ label: fmtDate(d.date), short: d.date.slice(8), value: d.lessons })), { color: '#3b6cf6' })}</div>
    </div><div class="stack">
      <div class="card"><div class="card-head"><h3>Students by year</h3></div>${s.yearMix.map((y, i) => `<div style="margin:12px 0"><div class="row spread small"><b>Year ${y.year}</b><span class="muted">${y.n}</span></div><div class="bar"><i style="width:${(y.n / yTotal) * 100}%;background:${['#0ea5a4', '#3b6cf6', '#8b5cf6', '#f59e0b', '#ec4899'][i % 5]}"></i></div></div>`).join('')}</div>
      <div class="card"><div class="card-head"><h3>Popular topics</h3></div>${s.topTopics.length ? s.topTopics.map((t) => `<div class="row spread small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(t.name)}</span><b>${t.n}</b></div>`).join('') : '<div class="empty small">No lessons yet</div>'}</div>
      <div class="card"><div class="card-head"><h3>Recent activity</h3></div><div style="max-height:320px;overflow:auto">${s.audit.map((a) => `<div class="small" style="padding:7px 0;border-bottom:1px solid var(--line)"><b>${esc(a.actorName)}</b> <span class="muted">${esc(a.action)}</span> ${esc(a.detail || '')}<div class="faint">${fmtDateTime(a.at)}</div></div>`).join('')}</div></div>
    </div></div>`;
}, { auth: true, roles: ['admin'] });

on(/^\/admin\/users$/, async () => {
  shell('users', 'Users', '<div class="spinner"></div>', { admin: true });
  const { users } = await api('GET', '/api/admin/users');
  const f = { q: '', role: 'all', status: 'all' };
  page().innerHTML = `<div class="page-head row spread wrap"><div><h1>User management</h1><p>${users.length} accounts · ${users.filter((u) => u.freeAccess).length} with free access</p></div><button class="btn" id="new-user">+ New user</button></div>
    <div class="card"><div class="filters" style="margin-bottom:14px"><input class="input" id="q" placeholder="Search name, email, username…" style="max-width:300px">
      ${['all', 'parent', 'student', 'admin', 'free'].map((r) => `<button class="chip ${r === 'all' ? 'on' : ''}" data-role="${r}">${r === 'all' ? 'All roles' : r === 'free' ? '✨ free access' : r + 's'}</button>`).join('')}
      <select class="input" id="st" style="max-width:160px"><option value="all">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
    <div class="table-wrap"><table class="data"><thead><tr><th>User</th><th>Role</th><th>Details</th><th>Access</th><th>Status</th><th>Joined</th><th>Last login</th></tr></thead><tbody id="rows"></tbody></table></div></div>`;
  const draw = () => {
    const q = f.q.toLowerCase();
    const list = users.filter((u) => (f.role === 'all' || (f.role === 'free' ? u.freeAccess || u.parentFree : u.role === f.role)) && (f.status === 'all' || u.status === f.status) && (!q || [u.name, u.email, u.username, u.parentName].some((x) => x && x.toLowerCase().includes(q))));
    $('#rows').innerHTML = list.map((u) => `<tr class="click" data-u="${u.id}"><td><div class="row">${avatar(u)}<div><b>${esc(u.name)}</b><div class="small muted">${esc(u.email || '@' + u.username)}</div></div></div></td><td>${roleBadge(u.role)}</td>
      <td class="small">${u.role === 'parent' ? `${u.childCount} child${u.childCount === 1 ? '' : 'ren'} · ${u.credits || 0} credits · ${money(u.spent)} spent` : u.role === 'student' ? `Y${u.yearGroup} ${u.tier} · ${u.lessons} lessons · parent: ${esc(u.parentName || '–')}` : '—'}</td>
      <td>${u.freeAccess ? freeBadge : u.parentFree ? '<span class="pill">via parent ✨</span>' : u.role === 'admin' ? '—' : '<span class="pill">£1 / lesson</span>'}</td>
      <td>${statusBadge(u.status)}</td><td class="small muted">${fmtDate(u.createdAt)}</td><td class="small muted">${u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '—'}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No users match.</td></tr>';
    $$('[data-u]').forEach((r) => (r.onclick = () => (location.hash = `#/admin/users/${r.dataset.u}`)));
  };
  $('#q').oninput = (e) => { f.q = e.target.value; draw(); };
  $('#st').onchange = (e) => { f.status = e.target.value; draw(); };
  $$('[data-role]').forEach((b) => (b.onclick = () => { f.role = b.dataset.role; $$('[data-role]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
  $('#new-user').onclick = () => modal(`<h2>Create user</h2><form id="nu" class="stack" style="margin-top:16px">
      <div class="grid2"><label class="field"><span>Name</span><input class="input" name="name" required></label><label class="field"><span>Role</span><select class="input" name="role"><option value="parent">Parent</option><option value="admin">Admin</option></select></label></div>
      <label class="field"><span>Email</span><input class="input" name="email" type="email" required></label><label class="field"><span>Temporary password</span><input class="input" name="password" type="password" minlength="8" autocomplete="new-password" required></label>
      <label class="row small"><input type="checkbox" name="freeAccess"> ✨ Free access — this family’s lessons and tests don’t use credits</label>
      <div class="error" id="nu-err"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Create</button></div></form>`, {
    onMount: (m, close) => { $('#nu', m).onsubmit = async (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); b.freeAccess = !!b.freeAccess; try { const r = await api('POST', '/api/admin/users', b); close(); toast('User created', 'good'); location.hash = `#/admin/users/${r.user.id}`; } catch (err) { $('#nu-err', m).textContent = err.message; } }; },
  });
  draw();
}, { auth: true, roles: ['admin'] });

on(/^\/admin\/users\/(\w+)$/, async (uid) => {
  shell('users', 'User detail', '<div class="spinner"></div>', { admin: true });
  const d = await api('GET', `/api/admin/users/${uid}`); const u = d.user;
  const isSelf = u.id === S.me.id;
  const viaParent = u.role === 'student' && d.parent?.freeAccess;
  page().innerHTML = `<a href="#/admin/users" class="small">← All users</a>
    <div class="card pad-lg" style="margin:14px 0 22px"><div class="row wrap spread"><div class="row">${avatar(u, 'lg')}<div><h1 style="font-size:26px">${esc(u.name)}</h1><div class="muted">${esc(u.email || '@' + u.username)} · joined ${fmtDate(u.createdAt)}</div>
      <div class="row wrap" style="margin-top:8px">${roleBadge(u.role)}${statusBadge(u.status)}${u.freeAccess ? freeBadge : ''}${viaParent ? '<span class="pill">free access via parent</span>' : ''}${u.role === 'parent' ? `<span class="pill">${u.credits || 0} credits</span>${u.freeLessonUsed ? '' : '<span class="pill good">free lesson unused</span>'}${u.cardVerified ? `<span class="pill">💳 ${esc(u.cardBrand || '')} ${esc(u.cardLast4 || '')}</span>` : ''}` : ''}${u.role === 'student' ? `<span class="pill">Year ${u.yearGroup} · ${u.tier}</span><span class="pill">🪙 ${u.coins || 0}</span>` : ''}</div></div></div>
      <div class="row wrap">${!isSelf ? `<button class="btn sm ${u.status === 'active' ? 'ghost' : 'good'}" id="toggle">${u.status === 'active' ? 'Suspend' : 'Reactivate'}</button>` : ''}
        ${u.role !== 'student' && !isSelf ? `<button class="btn sm ghost" id="role">Make ${u.role === 'admin' ? 'parent' : 'admin'}</button>` : ''}
        ${u.role === 'parent' ? '<button class="btn sm ghost" id="credits">Adjust credits</button>' : ''}
        ${u.role === 'student' ? `<a class="btn sm" href="#/app/report/${u.id}">📄 Report & plan</a>` : ''}${u.role === 'student' ? '<button class="btn sm ghost" id="edit-stu">Edit student</button><button class="btn sm ghost" id="coins">Gift coins</button>' : ''}
        <button class="btn sm ghost" id="pwd">Reset password</button>${!isSelf ? '<button class="btn sm danger" id="del">Delete</button>' : ''}</div></div>
      ${u.role !== 'admin' ? `<div class="card" style="box-shadow:none;background:var(--panel-2);border:0;margin-top:18px"><div class="row wrap spread"><div><b>✨ Free access</b><div class="small muted">${u.role === 'parent' ? 'Every child in this family can take lessons, topic tests and exams without using credits.' : 'This student can take lessons and tests without using the family’s credits.'}</div></div>
        <label class="row" style="cursor:pointer"><input type="checkbox" id="free-toggle" ${u.freeAccess ? 'checked' : ''} style="width:20px;height:20px"> <b>${u.freeAccess ? 'On' : 'Off'}</b></label></div></div>` : ''}</div>
    ${u.role === 'student' && d.summary ? `<div class="kpis"><div class="card kpi"><div class="v">${d.summary.correct}</div><div class="l">Correct answers</div></div><div class="card kpi"><div class="v">${d.summary.accuracy ?? '–'}%</div><div class="l">Accuracy</div></div><div class="card kpi"><div class="v">${d.summary.lessonsCompleted}</div><div class="l">Lessons completed</div></div><div class="card kpi"><div class="v">Lv ${d.summary.level.level}</div><div class="l">${d.summary.level.xp} XP · ${d.summary.certificates} certificates</div></div></div>
      <div class="card"><div class="card-head"><h3>By subject</h3></div>${bars(d.summary.strands.map((x) => ({ name: `${x.icon} ${x.name}`, value: x.accuracy, color: x.color })))}</div>` : ''}
    ${u.role === 'parent' ? `<div class="grid-main"><div class="card"><div class="card-head"><h3>Children</h3></div>${d.children.length ? `<table class="data"><tr><th>Name</th><th>Year</th><th>Lessons</th><th>Access</th><th></th></tr>${d.children.map((c) => `<tr><td><div class="row">${avatar(c)}<b>${esc(c.name)}</b></div></td><td>Y${c.yearGroup} ${c.tier}</td><td>${c.summary.lessonsCompleted}</td><td>${c.freeAccess || u.freeAccess ? freeBadge : '£1'}</td><td><a class="btn sm ghost" href="#/admin/users/${c.id}">Open</a></td></tr>`).join('')}</table>` : '<div class="empty small">No children</div>'}</div>
      <div class="card"><div class="card-head"><h3>Payments &amp; credits</h3></div>${d.ledger.length ? `<table class="data">${d.ledger.map((l) => `<tr><td class="small muted">${fmtDateTime(l.at)}</td><td class="small">${esc(l.reason)}</td><td><b>${l.delta > 0 ? '+' : ''}${l.delta}</b></td></tr>`).join('')}</table>` : '<div class="empty small">No activity</div>'}</div></div>` : ''}
    ${u.role === 'student' ? `<div class="card" style="margin-top:22px"><div class="card-head"><h3>Parent</h3></div><a href="#/admin/users/${u.parentId}" class="btn sm ghost">Open parent account</a></div>` : ''}`;
  const patch = async (body, msg) => { try { await api('PATCH', `/api/admin/users/${uid}`, body); toast(msg, 'good'); render(); } catch (e) { toast(e.message, 'bad'); } };
  $('#free-toggle')?.addEventListener('change', (e) => patch({ freeAccess: e.target.checked }, e.target.checked ? 'Free access turned on ✨' : 'Free access turned off'));
  $('#toggle')?.addEventListener('click', async () => { if (await confirmBox(u.status === 'active' ? 'Suspend user?' : 'Reactivate user?', u.status === 'active' ? 'They will be signed out and unable to log in.' : 'They will be able to sign in again.')) patch({ status: u.status === 'active' ? 'suspended' : 'active' }, 'Status updated'); });
  $('#role')?.addEventListener('click', async () => { const r = u.role === 'admin' ? 'parent' : 'admin'; if (await confirmBox(`Change role to ${r}?`, r === 'admin' ? 'Admins have full access to all users, payments and settings.' : 'They will lose admin access.')) patch({ role: r }, 'Role updated'); });
  $('#credits')?.addEventListener('click', () => modal(`<h2>Adjust credits</h2><p class="muted">Current balance: ${u.credits || 0}. Use a negative number to remove credits.</p><form id="cr" class="stack" style="margin-top:14px">
      <label class="field"><span>Change</span><input class="input" type="number" name="creditDelta" step="1" required></label><label class="field"><span>Reason</span><input class="input" name="reason" placeholder="e.g. Goodwill, refund"></label>
      <label class="row small"><input type="checkbox" name="resetFreeLesson"> Restore free trial lesson</label>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Apply</button></div></form>`, {
    onMount: (m, close) => { $('#cr', m).onsubmit = (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); b.resetFreeLesson = !!b.resetFreeLesson; if (Number(b.creditDelta) === 0) delete b.creditDelta; close(); patch(b, 'Credits updated'); }; },
  }));
  $('#coins')?.addEventListener('click', () => modal(`<h2>Gift coins</h2><form id="co" class="stack" style="margin-top:14px"><label class="field"><span>Coins (negative to remove)</span><input class="input" type="number" name="coinDelta" required value="100"></label>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Apply</button></div></form>`, {
    onMount: (m, close) => { $('#co', m).onsubmit = (e) => { e.preventDefault(); close(); patch(Object.fromEntries(new FormData(e.target)), 'Coins updated'); }; },
  }));
  $('#edit-stu')?.addEventListener('click', () => modal(`<h2>Edit student</h2><form id="es" class="stack" style="margin-top:14px"><label class="field"><span>Name</span><input class="input" name="name" value="${esc(u.name)}"></label>
      <div class="grid2"><label class="field"><span>Year</span><select class="input" name="yearGroup">${S.cur.years.map((y) => `<option ${u.yearGroup === y ? 'selected' : ''}>${y}</option>`).join('')}</select></label><label class="field"><span>Tier</span><select class="input" name="tier"><option value="H" ${u.tier === 'H' ? 'selected' : ''}>Higher</option><option value="F" ${u.tier === 'F' ? 'selected' : ''}>Foundation</option></select></label></div>
      <div class="grid2"><label class="field"><span>Target grade</span><input class="input" type="number" min="1" max="9" name="targetGrade" value="${u.targetGrade}"></label><label class="field"><span>Username</span><input class="input" name="username" value="${esc(u.username)}"></label></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Save</button></div></form>`, {
    onMount: (m, close) => { $('#es', m).onsubmit = (e) => { e.preventDefault(); close(); patch(Object.fromEntries(new FormData(e.target)), 'Student updated'); }; },
  }));
  $('#pwd').onclick = () => modal(`<h2>Reset password</h2><p class="muted">Set a new temporary password for ${esc(u.name)}. They will be signed out everywhere.</p><form id="rp" class="stack" style="margin-top:14px"><label class="field"><span>New password</span><input class="input" type="password" name="password" minlength="8" autocomplete="new-password" required></label><div class="error" id="rp-err"></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Reset</button></div></form>`, {
    onMount: (m, close) => { $('#rp', m).onsubmit = async (e) => { e.preventDefault(); try { await api('POST', `/api/admin/users/${uid}/password`, Object.fromEntries(new FormData(e.target))); close(); toast('Password reset', 'good'); } catch (err) { $('#rp-err', m).textContent = err.message; } }; },
  });
  $('#del')?.addEventListener('click', async () => { if (await confirmBox(`Delete ${esc(u.name)}?`, u.role === 'parent' ? 'This permanently deletes the parent, all their children and all progress.' : 'This permanently deletes this account and its data.', { ok: 'Delete', danger: true })) { await api('DELETE', `/api/admin/users/${uid}`); toast('User deleted'); location.hash = '#/admin/users'; } });
}, { auth: true, roles: ['admin'] });

on(/^\/admin\/payments$/, async () => {
  shell('payments', 'Payments', '<div class="spinner"></div>', { admin: true });
  const { payments, ledger } = await api('GET', '/api/admin/payments');
  const total = payments.reduce((t, p) => t + p.amount, 0);
  page().innerHTML = `<div class="page-head"><h1>Payments</h1><p>${payments.length} payments · ${money(total)} total</p></div>
    <div class="card" style="margin-bottom:22px"><div class="table-wrap"><table class="data"><tr><th>Date</th><th>Customer</th><th>Item</th><th>Credits</th><th>Amount</th><th>Provider</th></tr>
      ${payments.map((p) => `<tr><td class="small">${fmtDateTime(p.createdAt)}</td><td><a href="#/admin/users/${p.parentId}">${esc(p.parentName)}</a></td><td>${esc(p.label)}</td><td>${p.credits}</td><td><b>${money(p.amount)}</b></td><td><span class="pill ${p.provider === 'stripe' ? 'good' : ''}">${esc(p.provider)}</span></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No payments yet</td></tr>'}</table></div></div>
    <div class="card"><div class="card-head"><h3>Credit ledger</h3></div><div class="table-wrap"><table class="data"><tr><th>Date</th><th>Reason</th><th>Change</th><th>Balance</th></tr>
      ${ledger.map((l) => `<tr><td class="small">${fmtDateTime(l.at)}</td><td class="small">${esc(l.reason)}</td><td><b>${l.delta > 0 ? '+' : ''}${l.delta}</b></td><td>${l.balance}</td></tr>`).join('')}</table></div></div>`;
}, { auth: true, roles: ['admin'] });

on(/^\/admin\/curriculum$/, async () => {
  shell('curriculum', 'Curriculum', '', { admin: true });
  const learn = new Set(S.cur.learnAvailable);
  let sub = store.get('adminSubject', 'maths'); if (!subjectInfo(sub)) sub = 'maths';
  const ts = topicsOf(sub);
  page().innerHTML = `<div class="page-head"><h1>Curriculum map</h1><p>${S.cur.subjects.length} subjects · ${S.cur.topics.length} topics · ${S.cur.topics.reduce((t, x) => t + x.styles.length, 0)} styles · ${learn.size} topic explanations. Click a style to preview a generated question.</p></div>
    <div class="subject-bar">${S.cur.subjects.map((s) => `<button class="subject-pill ${s.id === sub ? 'on' : ''}" style="--c:${s.color}" data-as="${s.id}"><span class="e">${s.icon}</span>${esc(s.name)} <span class="small" style="opacity:.7">${topicsOf(s.id).length}</span></button>`).join('')}</div>
    ${S.cur.years.filter((y) => ts.some((t) => t.year === y)).map((y) => `<div class="strand-head">Year ${y}</div><div class="card"><div class="table-wrap"><table class="data"><tr><th>Term</th><th>Area</th><th>Topic</th><th>Tier</th><th>Explanation</th><th>Styles</th></tr>
      ${ts.filter((t) => t.year === y).sort((a, b) => a.term - b.term).map((t) => `<tr><td>${TERMS[t.term - 1]}</td><td><span class="pill" style="background:${strand(t.strand).color}22;color:${strand(t.strand).color}">${esc(shortName(strand(t.strand).name))}</span></td><td><b>${esc(t.name)}</b></td><td>${t.tier}</td>
        <td>${learn.has(t.id) ? `<a class="pill good" href="#/app/learn/${t.id}">✓ view</a>` : '<span class="pill warn">pending</span>'}</td>
        <td class="small">${t.styles.map((s) => `<button class="link small" data-prev="${s.id}">${esc(s.name)}</button>`).join(' · ')}</td></tr>`).join('')}</table></div></div>`).join('')}`;
  $$('[data-as]').forEach((b) => (b.onclick = () => { store.set('adminSubject', b.dataset.as); render(); }));
  $$('[data-prev]').forEach((b) => (b.onclick = async () => {
    const d = await api('GET', `/api/curriculum/sample/${b.dataset.prev}`);
    modal(`<div class="tiny muted">Preview · ${esc(b.textContent)}</div><div class="intro-box" style="margin-top:10px">💡 ${esc(d.intro)}</div><div class="qtext">${d.example.html}</div>${d.example.diagram ? `<div class="diagram">${d.example.diagram}</div>` : ''}
      <div class="solution"><ol>${d.example.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div><div class="feedback info"><b>Answer:</b> ${d.example.answerHtml}</div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-close>Close</button></div>`, { wide: true });
  }));
}, { auth: true, roles: ['admin'] });

// mark app routes as authenticated
routes.forEach((r) => { if (/\\\/app|\\\/admin/.test(r.re.source)) r.auth = true; });

// ---------- boot ----------
(async () => {
  await loadMe();
  await loadCurriculum().catch(() => {});
  if (S.me && S.childId) { try { const R = await api('GET', `/api/students/${S.childId}/rewards`); R.shop.forEach((it) => (SHOP_EMOJI[it.id] = it.emoji || it.css)); } catch {} }
  if (S.me) await handleStripeReturn();
  render();
})();
