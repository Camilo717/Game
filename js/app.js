/* =========================================================
   EL CASO DEL CRISTAL ROBADO — Motor del juego
   ========================================================= */
(() => {
  'use strict';

  /* ================= Utilidades ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const suspect = id => SUSPECTS.find(s => s.id === id);
  const district = id => DISTRICTS.find(d => d.id === id);
  const team = id => S.teams.find(t => t.id === id);
  const policy = id => POLICIES.find(p => p.id === id);
  const polChips = ids => `<div class="pol-chips">${ids.map(policy).map(p => `<span class="pol-chip" title="${p.es}">${p.icon} ${p.en}</span>`).join('')}</div>`;
  const fmt = s => { s = Math.max(0, Math.round(s)); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}`; };
  const focus = el => el && setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  const later = (fn, ms) => { const h = setTimeout(fn, ms); timers.push({ stop: () => clearTimeout(h) }); };

  /* ================= Estado ================= */
  const KEY = 'cristal-robado-v1';
  const EMOJIS = ['👾', '🚀', '🔔', '⚡', '✈️', '🦄', '🐙', '🦊', '🐸', '🌮', '🎧', '🔥', '🍕', '🐼', '🌈', '🤖', '🧠', '💎'];
  const COLORS = ['#ff4fa3', '#22d3ee', '#ffd23f', '#7ddf64', '#ff8a3d', '#a78bfa', '#2f7bff', '#f43f5e'];

  function fresh(teams) {
    return {
      teams: (teams || TEAM_PRESETS.slice(0, 4)).map((t, i) => ({ id: 't' + i + Math.random().toString(36).slice(2, 6), name: t.name, emoji: t.emoji, color: t.color, score: 0 })),
      culprit: null, clues: [], done: [], mpts: {}, accus: {}, crossed: [], revealed: false,
      startedAt: null, screen: { name: 'title', p: {} }, sound: S ? S.sound : true,
    };
  }
  let S = null;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || !S.teams) S = fresh();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };

  function setupMystery() {
    const ids = shuffle(SUSPECTS.map(s => s.id));
    S.culprit = ids[0];
    const types = shuffle(['accessory', 'alibi', 'habit', 'color', shuffle(['accessory', 'alibi', 'habit', 'color'])[0]]);
    S.clues = ids.slice(1).map((sid, i) => ({ sid, type: types[i], mission: null, holders: [] }));
    S.done = []; S.mpts = {}; S.accus = {}; S.crossed = []; S.revealed = false;
    S.teams.forEach(t => (t.score = 0));
    S.startedAt = Date.now();
  }
  const clueText = c => CLUE_TEMPLATES[c.type](suspect(c.sid));

  /* ================= Sonido (Web Audio) ================= */
  let AC = null;
  function tone(f, d = .15, type = 'sine', v = .15, when = 0, f2 = null) {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .05);
    } catch (e) { /* sin audio */ }
  }
  const sfx = {
    click: () => tone(700, .07, 'triangle', .07),
    good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, 'triangle', .12, i * .07)),
    bad: () => { tone(260, .25, 'sawtooth', .08, 0, 140); tone(180, .35, 'sawtooth', .08, .14, 90); },
    tick: () => tone(1300, .05, 'square', .04),
    alarm: () => [0, .22, .44, .66].forEach(w => tone(880, .16, 'square', .07, w)),
    whoosh: () => tone(200, .5, 'sine', .1, 0, 1400),
    reveal: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .45, 'sine', .09, i * .08)),
    drum: () => { tone(110, .18, 'triangle', .25, 0, 50); },
    stamp: () => { tone(90, .25, 'square', .18, 0, 40); tone(1200, .08, 'triangle', .05); },
    fanfare: () => { const n = [523, 523, 523, 659, 784, 659, 784, 1047], d = [0, .14, .28, .42, .7, .9, 1.04, 1.25]; n.forEach((f, i) => tone(f, i === 7 ? .8 : .3, 'triangle', .13, d[i])); },
  };

  /* ================= Fondo estrellado ================= */
  (function sky() {
    const c = $('#sky'), ctx = c.getContext('2d');
    let W, H, stars = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function init() {
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      stars = Array.from({ length: 170 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.5 + .3) * dpr, p: Math.random() * 6.28, s: .01 + Math.random() * .03, vy: Math.random() * .12 * dpr }));
    }
    init(); addEventListener('resize', init);
    const orbs = Array.from({ length: 12 }, () => ({ x: Math.random(), y: Math.random(), r: 30 + Math.random() * 70, c: ['#2f7bff', '#ff4fa3', '#22d3ee', '#a855f7', '#ffd23f'][Math.floor(Math.random() * 5)], vx: (Math.random() - .5) * .0003, vy: -.0002 - Math.random() * .0004 }));
    (function frame() {
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        for (const o of orbs) {
          o.x += o.vx; o.y += o.vy; if (o.y < -.15) { o.y = 1.15; o.x = Math.random(); }
          const R = o.r * dpr, g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, R);
          g.addColorStop(0, o.c + '40'); g.addColorStop(1, o.c + '00');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x * W, o.y * H, R, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#fff';
        for (const s of stars) {
          s.p += s.s; s.y -= s.vy; if (s.y < 0) s.y = H;
          ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(s.p));
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    })();
  })();

  /* ================= Confeti ================= */
  const confetti = (() => {
    const c = $('#confetti'), ctx = c.getContext('2d');
    let parts = [], running = false;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const cols = ['#ff4fa3', '#ffd23f', '#22d3ee', '#7ddf64', '#a855f7', '#2f7bff', '#ff8a3d'];
    function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      parts = parts.filter(p => p.life-- > 0 && p.y < c.height + 40);
      for (const p of parts) {
        p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.heart) { ctx.font = `${p.s * 2.4}px sans-serif`; ctx.fillText('♥', -p.s, p.s); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * (1 + Math.sin(p.r * 3)));
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, c.width, c.height); }
    }
    return (n = 160, x = innerWidth / 2, y = innerHeight / 3) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 11;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 7, g: .22 + Math.random() * .1, s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length], life: 220 + Math.random() * 80, heart: Math.random() < .25 });
      }
      if (!running) { running = true; requestAnimationFrame(tick); }
    };
  })();

  /* ================= Temporizador ================= */
  let timers = [];
  const clearTimers = () => { timers.forEach(t => t.stop()); timers = []; };

  function makeTimer(el, secs, { onEnd, size = 170, autostart = true, ticks = true } = {}) {
    let left = secs, total = secs, iv = null, ended = false;
    const R = 44, C = 2 * Math.PI * R;
    el.innerHTML = `
      <div class="timer" style="--ts:${size}px">
        <svg viewBox="0 0 100 100"><defs><linearGradient id="tgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a855f7"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient></defs>
          <circle class="track" cx="50" cy="50" r="${R}" fill="none" stroke-width="9"/>
          <circle class="prog" cx="50" cy="50" r="${R}" fill="none" stroke-width="9" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <div class="val">${fmt(left)}</div>
      </div>
      <div class="timer-ctrls"><button data-t="toggle" title="Pausar / reanudar">⏯</button><button data-t="add">+15s</button><button data-t="end" title="Terminar ya">⏭</button></div>`;
    const box = $('.timer', el), val = $('.val', el), prog = $('.prog', el);
    const paint = () => {
      val.textContent = fmt(left);
      prog.style.strokeDashoffset = C * (1 - left / total);
      box.classList.toggle('danger', left <= 5 && left > 0);
      box.classList.toggle('done', left <= 0);
    };
    const step = () => {
      left--; paint();
      if (ticks && left <= 5 && left > 0) sfx.tick();
      if (left <= 0) finish();
    };
    const finish = () => { if (ended) return; ended = true; left = 0; paint(); stop(); sfx.alarm(); onEnd && onEnd(); };
    const start = () => { if (iv || ended) return; iv = setInterval(step, 1000); };
    const stop = () => { clearInterval(iv); iv = null; };
    el.querySelector('[data-t="toggle"]').onclick = () => (iv ? stop() : start());
    el.querySelector('[data-t="add"]').onclick = () => { left += 15; total = Math.max(total, left); if (ended) { ended = false; start(); } paint(); };
    el.querySelector('[data-t="end"]').onclick = finish;
    const api = { start, stop, finish, get left() { return left; } };
    timers.push(api);
    paint();
    if (autostart) start();
    return api;
  }

  /* ================= Interfaz común ================= */
  function toast(msg, ms = 2400) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
    $('#toast-root').appendChild(t); setTimeout(() => t.remove(), ms);
  }
  function modal(html, { small = false } = {}) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal glass ${small ? 'small' : ''}"><button class="icon-btn x" data-close>✕</button>${html}</div>`;
    root.classList.add('open');
    root.onclick = e => { if (e.target === root || e.target.closest('[data-close]')) closeModal(); };
    return root.firstElementChild;
  }
  const closeModal = () => { const r = $('#modal-root'); r.classList.remove('open'); r.innerHTML = ''; };

  function pickTeam(title, cb, { none = true, sub = '' } = {}) {
    const m = modal(`<h2 class="h-md">${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}
      <div class="team-pick-grid">${S.teams.map(t => `<button class="team-pick" style="--tc:${t.color}" data-id="${t.id}"><span class="em">${t.emoji}</span>${esc(t.name)}</button>`).join('')}
      ${none ? '<button class="team-pick" style="--tc:#555" data-id="">🙅 Nadie</button>' : ''}</div>`, { small: true });
    $$('.team-pick', m).forEach(b => (b.onclick = () => { closeModal(); cb(b.dataset.id || null); }));
  }

  function award(teamId, pts, mid) {
    const t = team(teamId); if (!t || !pts) return;
    t.score += pts;
    if (mid) { S.mpts[mid] = S.mpts[mid] || {}; S.mpts[mid][teamId] = (S.mpts[mid][teamId] || 0) + pts; }
    save(); renderScorebar(); pts > 0 ? sfx.good() : sfx.bad();
    const chip = $(`.team-chip[data-team="${teamId}"]`);
    if (!chip) return;
    chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
    const r = chip.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'float-pts'; el.style.left = r.left + r.width / 2 + 'px'; el.style.top = r.top - 10 + 'px';
    el.style.color = pts > 0 ? '#7ddf64' : '#ff4d6d'; el.textContent = `${pts > 0 ? '+' : ''}${pts} ❤️`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 1700);
  }

  function renderScorebar() {
    $('#scorebar').innerHTML = S.teams.map(t => `
      <button class="team-chip" data-team="${t.id}" style="--tc:${t.color}" title="Ajustar puntos">
        <span class="em">${t.emoji}</span><span class="nm">${esc(t.name)}</span><span class="sc">${t.score} ❤️</span>
      </button>`).join('');
    $$('.team-chip').forEach(c => (c.onclick = () => editScore(c.dataset.team)));
  }
  function editScore(tid) {
    const t = team(tid);
    const m = modal(`<h2 class="h-md">${t.emoji} ${esc(t.name)}</h2><p class="muted">Ajuste manual de Likes (bonos, penalizaciones, ventas de pistas...)</p>
      <div class="counter-big center mt-s" id="es">${t.score} ❤️</div>
      <div class="row center mt">${[-100, -50, -10, 10, 50, 100].map(v => `<button class="btn sm ${v < 0 ? 'red' : 'green'}" data-v="${v}">${v > 0 ? '+' : ''}${v}</button>`).join('')}</div>`, { small: true });
    $$('[data-v]', m).forEach(b => (b.onclick = () => { award(tid, +b.dataset.v); $('#es', m).textContent = `${t.score} ❤️`; }));
  }

  function renderTop() {
    $('#facets').innerHTML = DISTRICTS.map(d => `<i class="${S.done.includes(d.id) ? 'on' : ''}" style="${S.done.includes(d.id) ? `background:${d.color};color:${d.color}` : ''}" title="${d.value}"></i>`).join('');
    $('#snd').textContent = S.sound ? '🔊' : '🔇';
    $('#btn-codex').innerHTML = `📚 Políticas <b>${unlockedCount()}/${POLICIES.length}</b>`;
  }
  setInterval(() => {
    const el = $('#clock'); if (!el) return;
    if (!S.startedAt) { el.textContent = '⏱ 0:00'; return; }
    const sec = Math.floor((Date.now() - S.startedAt) / 1000);
    el.textContent = `⏱ ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    el.classList.toggle('over', sec > 45 * 60);
    el.title = 'Duración objetivo: 45 minutos';
  }, 1000);

  /* ================= Router ================= */
  const screens = {};
  function view(html, { full = false, scores = true } = {}) {
    clearTimers();
    const stage = $('#stage');
    stage.classList.toggle('full', full);
    $('#topbar').classList.toggle('hidden', full);
    $('#scorebar').classList.toggle('hidden', full || !scores);
    stage.innerHTML = `<div class="screen">${html}</div>`;
    stage.scrollTop = 0;
    renderTop();
    return stage.firstElementChild;
  }
  function go(name, p = {}) {
    S.screen = { name, p }; save(); closeModal();
    (screens[name] || screens.title)(p);
  }
  const started = () => !!(S.startedAt && S.culprit);

  /* ================= Sospechosos (line-up) ================= */
  function lineupHTML({ cross = false } = {}) {
    return `<div class="lineup">${SUSPECTS.map((s, i) => `
      <div class="suspect ${cross && S.crossed.includes(s.id) ? 'crossed' : ''}" style="--sc:${s.color}" data-sid="${s.id}">
        <div class="inner">
          <div class="face"><span class="tag">#${i + 1}</span>${Art.avatar(s)}
            <div class="name">${s.name}</div><div class="role">${s.title}</div>
            <div class="role" style="font-style:italic;margin-top:6px">${s.quote}</div>
            <div class="flip-hint">👆 toca para ver su ficha</div></div>
          <div class="back"><div class="name" style="text-align:center">${s.name}</div>
            <div class="trait"><small>Color de ropa</small>${cap(s.colorName)}</div>
            <div class="trait"><small>Accesorio</small>${cap(s.accessory)}</div>
            <div class="trait"><small>Coartada · 23:00</small>Dice que estaba ${s.alibi}</div>
            <div class="trait"><small>Manía</small>${cap(s.habit)}</div>
            <div class="trait"><small>Posible motivo</small>${s.motive}</div>
            <div class="trait"><small>Políticas que suele romper</small>${s.policies.map(id => policy(id).en).join(' · ')}</div></div>
        </div>
        ${cross ? `<button class="cross-btn" data-cross="${s.id}" title="Descartar / restaurar">✕</button>` : ''}
      </div>`).join('')}</div>`;
  }
  function bindLineup(root) {
    $$('.suspect', root).forEach(el => (el.onclick = e => {
      const cb = e.target.closest('[data-cross]');
      if (cb) {
        const id = cb.dataset.cross;
        S.crossed = S.crossed.includes(id) ? S.crossed.filter(x => x !== id) : [...S.crossed, id];
        el.classList.toggle('crossed'); save(); sfx.click(); return;
      }
      el.classList.toggle('flipped'); sfx.whoosh();
    }));
  }
  function openSuspects() {
    const m = modal(`<div class="kicker">Expediente</div><h2 class="h-lg">🕵️ Los 6 sospechosos</h2>
      <p class="muted">Toquen una carta para ver su ficha. Usen ✕ para descartar sospechosos.</p><div class="mt">${lineupHTML({ cross: true })}</div>
      <div class="row center mt"><button class="btn sm ghost" id="pr">🖨️ Imprimir hoja del detective</button></div>`);
    bindLineup(m); $('#pr', m).onclick = printSheet;
  }
  function printSheet() {
    $('#print-sheet').innerHTML = `<div class="ps-title">🕵️ Hoja del Detective — El Caso del Cristal Robado</div>
      <p style="text-align:center">Equipo: ______________________________</p>
      <div class="ps-grid">${SUSPECTS.map(s => `<div class="ps-card">${Art.avatar(s)}<h3><span class="ps-box"></span>${s.name}</h3>
        <p><b>Color:</b> ${s.colorName}</p><p><b>Accesorio:</b> ${s.accessory}</p><p><b>Coartada:</b> ${s.alibi}</p><p><b>Manía:</b> ${s.habit}</p><p><b>Políticas:</b> ${s.policies.map(id => policy(id).en).join(', ')}</p></div>`).join('')}</div>
      <h3 style="margin-top:12pt">Nuestras pistas</h3><div class="ps-clues">${[1, 2, 3, 4, 5].map(i => `<div>${i}.</div>`).join('')}</div>
      <h3 style="margin-top:14pt">Nuestra acusación: ______________________________</h3>`;
    window.print();
  }

  /* ================= Archivo de Políticas ================= */
  function polCard(p, locked, delay = 0) {
    const d = district(p.district);
    return `<div class="pol-card ${locked ? 'locked' : ''} ${p.sensitive ? 'sensitive' : ''}" style="--pc:${d.color};animation-delay:${delay}s">
      <div class="pi">${locked ? '🔒' : p.icon}</div><div class="pen">${p.en}</div><div class="pes">${p.es}</div>
      ${locked ? `<div class="pd muted">Se desbloquea en ${d.icon} ${d.name}</div>` : `<div class="pd">${p.desc}</div>`}
      ${p.sensitive && !locked ? '<div class="psens">🛡️ Protección especial</div>' : ''}</div>`;
  }
  const unlockedCount = () => POLICIES.filter(p => S.done.includes(p.district)).length;
  function openCodex(showAll = false) {
    const m = modal(`<div class="kicker">Normas Comunitarias de Meta</div>
      <h2 class="h-lg">📚 Archivo de Políticas <span class="pill">${unlockedCount()} / ${POLICIES.length} desbloqueadas</span></h2>
      <p class="muted">Cada misión completada desbloquea las políticas de su distrito. Las marcadas con 🛡️ son de <b>protección especial</b>: no se juegan, pero es clave conocerlas.</p>
      ${DISTRICTS.map(d => `<h3 class="h-md mt" style="color:${d.color}">${d.icon} ${d.name} · ${d.value}</h3>
        <div class="codex mt-s">${POLICIES.filter(p => p.district === d.id).map(p => polCard(p, !showAll && !S.done.includes(d.id))).join('')}</div>`).join('')}
      ${showAll ? '' : '<div class="row center mt"><button class="btn sm ghost" id="all">👁️ Mostrar todas (moderador)</button></div>'}`);
    const a = $('#all', m); if (a) a.onclick = () => openCodex(true);
  }
  $('#btn-codex').onclick = () => openCodex();

  /* ================= Menú ================= */
  function openMenu() {
    const m = modal(`<h2 class="h-md">☰ Menú del moderador</h2><div class="menu-list">
      <button class="btn ghost" data-m="map">🗺️ Ir al mapa</button>
      <button class="btn ghost" data-m="sus">🕵️ Ver sospechosos</button>
      <button class="btn ghost" data-m="codex">📚 Archivo de políticas</button>
      <button class="btn ghost" data-m="rules">📜 Ver reglas</button>
      <button class="btn ghost" data-m="print">🖨️ Imprimir hoja del detective</button>
      <button class="btn ghost" data-m="market">⏩ Saltar al Mercado de Pistas</button>
      <button class="btn ghost" data-m="fs">⛶ Pantalla completa</button>
      <button class="btn red" data-m="reset">🔄 Nueva partida (borra el progreso)</button></div>`, { small: true });
    $$('[data-m]', m).forEach(b => (b.onclick = () => {
      const a = b.dataset.m; closeModal();
      if (a === 'map') started() ? go('map') : toast('Primero creen la partida 🙂');
      if (a === 'sus') openSuspects();
      if (a === 'codex') openCodex();
      if (a === 'rules') go('rules');
      if (a === 'print') printSheet();
      if (a === 'market') started() ? go('market') : toast('Primero creen la partida 🙂');
      if (a === 'fs') toggleFS();
      if (a === 'reset' && confirm('¿Seguro? Se perderán los puntos y las pistas.')) { S = fresh(S.teams); save(); go('title'); }
    }));
  }
  const toggleFS = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); };

  /* =========================================================
     PANTALLAS
     ========================================================= */

  /* ---------- Portada ---------- */
  screens.title = () => {
    const root = view(`
      <div class="title-screen">
        <div class="kicker">Un misterio interactivo sobre las políticas de Meta</div>
        <div class="title-crystal">${Art.crystal([], 210, { cracked: true })}</div>
        <h1 class="mega">El Caso del<br>Cristal Robado</h1>
        <p class="subtitle">Alguien robó el Cristal de la Confianza de Nexópolis. Recuperen sus 5 fragmentos, ganen pistas secretas
          y desenmascaren al culpable... antes de que la ciudad caiga en manos de estafadores, bulos y trolls.</p>
        <div class="title-suspects">${SUSPECTS.map(s => Art.avatar(s, { silhouette: true })).join('')}</div>
        <div class="row center mt">
          <button class="btn big pink pulse" id="new">🕵️ Nueva partida</button>
          ${started() ? '<button class="btn ghost" id="cont">▶ Continuar partida</button>' : ''}
        </div>
        <div class="row center"><span class="pill">👥 2–6 equipos</span><span class="pill">⏱ ~45 minutos</span><span class="pill">📝 Papel y lápiz por equipo</span><span class="pill">📽️ Ideal en proyector</span></div>
        <p class="disclaimer">Juego educativo de ficción: Nexópolis, sus personajes y sus casos son inventados. Las ideas sobre políticas se basan en las Normas
          Comunitarias públicas de Meta; para la versión oficial y actualizada consulta el Centro de Transparencia de Meta (transparency.meta.com).</p>
      </div>`, { full: true });
    $('#new', root).onclick = () => { sfx.reveal(); S = fresh(S.teams); save(); go('setup'); };
    const c = $('#cont', root); if (c) c.onclick = () => go('map');
  };

  /* ---------- Equipos ---------- */
  screens.setup = () => {
    const draw = () => {
      const root = view(`
        <div class="center"><div class="kicker">Paso 1 de 3</div><h1 class="h-xl">Formen la <span class="grad-text">Liga de Guardianes</span></h1>
        <p class="muted h-md mt-s">Recomendado: 3 a 5 equipos de 3–6 personas. Toquen el emoji para cambiarlo.</p></div>
        <div class="setup-grid mt">
          ${S.teams.map((t, i) => `
            <div class="team-card" style="--tc:${t.color};animation-delay:${i * .07}s" data-i="${i}">
              ${S.teams.length > 2 ? '<button class="rm" title="Quitar equipo">✕</button>' : ''}
              <div class="row"><div class="big-em" title="Cambiar emoji">${t.emoji}</div>
                <div style="flex:1" class="col"><input value="${esc(t.name)}" maxlength="22" aria-label="Nombre del equipo">
                  <div class="swatches">${COLORS.map(c => `<button style="background:${c}" class="${c === t.color ? 'sel' : ''}" data-c="${c}"></button>`).join('')}</div></div></div>
            </div>`).join('')}
          ${S.teams.length < 6 ? '<button class="add-team">＋ Agregar equipo</button>' : ''}
        </div>
        <div class="row center mt-l"><button class="btn ghost" id="back">← Inicio</button><button class="btn big pink" id="next">Comenzar la historia ✨</button></div>`, { scores: false });
      $$('.team-card', root).forEach(card => {
        const t = S.teams[+card.dataset.i];
        $('input', card).oninput = e => { t.name = e.target.value || 'Equipo'; save(); };
        $('.big-em', card).onclick = () => { t.emoji = EMOJIS[(EMOJIS.indexOf(t.emoji) + 1) % EMOJIS.length]; save(); sfx.click(); draw(); };
        $$('[data-c]', card).forEach(b => (b.onclick = () => { t.color = b.dataset.c; save(); sfx.click(); draw(); }));
        const rm = $('.rm', card); if (rm) rm.onclick = () => { S.teams.splice(+card.dataset.i, 1); save(); draw(); };
      });
      const add = $('.add-team', root);
      if (add) add.onclick = () => {
        const used = S.teams.map(t => t.name);
        const p = TEAM_PRESETS.find(x => !used.includes(x.name)) || { name: 'Equipo ' + (S.teams.length + 1), emoji: '🐙', color: '#2f7bff' };
        S.teams.push({ id: 't' + Math.random().toString(36).slice(2, 8), ...p, score: 0 }); save(); sfx.click(); draw();
      };
      $('#back', root).onclick = () => go('title');
      $('#next', root).onclick = () => { setupMystery(); save(); go('story', { i: 0 }); };
    };
    draw();
  };

  /* ---------- Historia ---------- */
  const STORY = [
    'Bienvenidos a Nexópolis, la ciudad flotante donde viven miles de millones de conversaciones. Cinco distritos la mantienen unida: la Plaza Azul, el Puerto Verde, la Isla Gradiente, la Torre Espiral y la Nebulosa Horizon.',
    'En el centro de la ciudad brillaba el Cristal de la Confianza. Sus cinco caras representan los valores que protegen a la comunidad: VOZ, SEGURIDAD, DIGNIDAD, AUTENTICIDAD y PRIVACIDAD.',
    'Pero anoche, a las 23:00, en pleno Festival de la Comunidad... ¡alguien robó el Cristal! Se rompió en cinco fragmentos que cayeron en cada distrito. Desde entonces, estafas, bulos y trolls invaden la ciudad.',
    'Ustedes son la Liga de Guardianes. Su misión: superar los desafíos de cada distrito, recuperar los fragmentos, ganar pistas secretas... y desenmascarar al culpable entre seis sospechosos.',
  ];
  function storyArt(i) {
    if (i === 0) return `<div class="mini-map">${DISTRICTS.map((d, k) => `<div class="center"><svg viewBox="-160 -215 320 370" class="bob d${k}">${Art.island(d)}</svg><div class="pill" style="border-color:${d.color}">${d.name}</div></div>`).join('')}</div>`;
    if (i === 1) return `<div class="center"><div class="title-crystal">${Art.crystal([], 280, { all: true })}</div>
      <div class="values">${DISTRICTS.map(d => `<div style="background:${d.color}33;border:1px solid ${d.color}">${d.value}</div>`).join('')}</div></div>`;
    if (i === 2) return `<div class="shards">${DISTRICTS.map((d, k) => { const a = k / 5 * Math.PI * 2; return `<span style="background:${d.color};--x:${Math.cos(a) * 140}px;--y:${Math.sin(a) * 140}px;animation-delay:${k * .2}s"></span>`; }).join('')}
      <div class="alarm" style="position:absolute;inset:0;display:grid;place-items:center">${Art.crystal([], 220, { cracked: true })}</div></div>`;
    return `<div class="lineup" style="grid-template-columns:repeat(3,1fr);max-width:520px">${SUSPECTS.map(s => `<div>${Art.avatar(s, { silhouette: true })}</div>`).join('')}</div>
      <div class="row center mt">${S.teams.map(t => `<span class="pill" style="border-color:${t.color}">${t.emoji} ${esc(t.name)}</span>`).join('')}</div>`;
  }
  screens.story = ({ i = 0 }) => {
    const root = view(`
      <div class="story">
        <div class="story-art">${storyArt(i)}</div>
        <div class="col">
          <div class="kicker">Capítulo ${i + 1} de ${STORY.length}</div>
          <div class="story-text glass"><span id="tw"></span><span class="caret"></span></div>
          <div class="dots">${STORY.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
          <div class="row center"><button class="btn ghost sm" id="prev">←</button><button class="btn pink" id="nx">Siguiente ➜</button></div>
        </div>
      </div>`, { scores: false });
    if (i === 2) sfx.alarm(); else sfx.whoosh();
    const tw = $('#tw', root), txt = STORY[i];
    let k = 0, done = false;
    const iv = setInterval(() => { k += 2; tw.textContent = txt.slice(0, k); if (k >= txt.length) { clearInterval(iv); done = true; } }, 28);
    timers.push({ stop: () => clearInterval(iv) });
    $('#prev', root).onclick = () => (i > 0 ? go('story', { i: i - 1 }) : go('setup'));
    $('#nx', root).onclick = () => {
      if (!done) { clearInterval(iv); tw.textContent = txt; done = true; return; }
      i < STORY.length - 1 ? go('story', { i: i + 1 }) : go('suspects');
    };
  };

  /* ---------- Sospechosos ---------- */
  screens.suspects = () => {
    const root = view(`
      <div class="center"><div class="kicker">Paso 2 de 3 · Rueda de reconocimiento</div>
        <h1 class="h-xl">Seis sospechosos. <span class="warm-text">Un culpable.</span></h1>
        <p class="muted h-md mt-s">Todos estaban en Nexópolis anoche a las 23:00. Lean bien sus fichas: <b>cada detalle puede ser una pista</b>.</p></div>
      <div class="mt">${lineupHTML()}</div>
      <div class="row center mt"><button class="btn ghost" id="all">🔄 Voltear todas</button><button class="btn ghost" id="pr">🖨️ Imprimir hoja del detective</button>
        <button class="btn pink big" id="nx">¿Cómo se gana? ➜</button></div>`, { scores: false });
    bindLineup(root);
    $('#all', root).onclick = () => { $$('.suspect', root).forEach(s => s.classList.toggle('flipped')); sfx.whoosh(); };
    $('#pr', root).onclick = printSheet;
    $('#nx', root).onclick = () => go('rules');
  };

  /* ---------- Reglas ---------- */
  screens.rules = () => {
    const root = view(`
      <div class="center"><div class="kicker">Paso 3 de 3 · Cómo se juega</div><h1 class="h-xl">Las reglas de la <span class="grad-text">Liga</span></h1></div>
      <div class="rules-grid mt">
        <div class="glass rule-card"><span class="ic">❤️</span><h3>Ganen Likes</h3><p>Cada distrito tiene un desafío distinto: hablar, cazar, debatir, susurrar, hackear. Cada logro suma <b>Likes</b> y desbloquea <b>políticas</b> en el 📚 Archivo.</p></div>
        <div class="glass rule-card"><span class="ic" style="animation-delay:-1s">🔒</span><h3>Pistas secretas</h3><p>El equipo con más Likes en cada misión recibe una <b>pista secreta</b> sobre el culpable. Los demás... ¡de espaldas!</p></div>
        <div class="glass rule-card"><span class="ic" style="animation-delay:-2s">🕵️</span><h3>Acusen</h3><p>Al final, en el <b>Mercado de Pistas</b> pueden compartir, negociar... o mentir. Acertar al culpable da <b>+300 Likes</b>.</p></div>
      </div>
      <div class="glass mt"><h3 class="h-md">⏱ Plan de la partida (~45 min)</h3>
        <div class="timeline">
          <div style="--m:4;--c:#ffd23f">Historia 4'</div>
          ${DISTRICTS.map(d => `<div style="--m:${d.minutes};--c:${d.color}">${d.icon} ${d.mission} ${d.minutes}'</div>`).join('')}
          <div style="--m:5;--c:#ff4fa3">🕵️ Mercado + Acusación 5'</div>
        </div></div>
      <div class="row center mt"><button class="btn big pink pulse" id="nx">🗺️ ¡Al mapa de Nexópolis!</button></div>`, { scores: false });
    $('#nx', root).onclick = () => (started() ? go('map') : go('setup'));
  };

  /* ---------- Mapa ---------- */
  const MAP_POS = { plaza: [230, 215], puerto: [970, 215], isla: [200, 610], torre: [1000, 610], nebulosa: [600, 660] };
  screens.map = () => {
    if (!started()) return go('title');
    const allDone = S.done.length === DISTRICTS.length;
    const next = DISTRICTS.find(d => !S.done.includes(d.id));
    const root = view(`
      <div class="map-wrap">
        <svg class="map-svg" viewBox="0 0 1200 860" preserveAspectRatio="xMidYMid meet">
          <defs><linearGradient id="br" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient></defs>
          ${DISTRICTS.map(d => { const [x, y] = MAP_POS[d.id]; return `<path class="bridge" d="M600 330 Q ${(600 + x) / 2} ${Math.min(330, y) - 60} ${x} ${y}" stroke="${S.done.includes(d.id) ? d.color : 'url(#br)'}" stroke-width="5" fill="none" opacity="${S.done.includes(d.id) ? .9 : .45}"/>`; }).join('')}
          <g class="map-center" transform="translate(500 210)"><g class="bob">${Art.crystal(S.done, 200, { cracked: !allDone })}</g></g>
          ${DISTRICTS.map((d, k) => { const [x, y] = MAP_POS[d.id]; const done = S.done.includes(d.id); return `
            <g class="isl ${done ? 'done' : ''}" data-id="${d.id}" style="--ic:${d.color}" transform="translate(${x} ${y}) scale(.82)">
              <g class="bob d${k}">${Art.island(d, { done })}</g>
              <g class="map-label" transform="translate(0 168)" text-anchor="middle">
                <text y="0" font-size="34" font-weight="700" fill="#fff" stroke="#0b0f2e" stroke-width="7" paint-order="stroke">${k + 1}. ${d.name}</text>
                <text y="36" font-size="24" font-weight="600" fill="${d.color2}" stroke="#0b0f2e" stroke-width="6" paint-order="stroke">${d.icon} ${d.mission} · ${d.app}</text>
              </g>
            </g>`; }).join('')}
        </svg>
      </div>
      <div class="row center">
        ${allDone ? '<button class="btn big pink pulse" id="mk">🕵️ ¡Fragmentos completos! Ir al Mercado de Pistas</button>'
        : `<span class="pill">👆 Toquen un distrito para empezar su misión · Sugerido: <b style="color:${next.color}">${next.name}</b></span>
           <button class="btn sm ghost" id="sus">🕵️ Sospechosos</button>`}
      </div>`);
    $$('.isl', root).forEach(g => (g.onclick = () => {
      const d = district(g.dataset.id);
      if (S.done.includes(d.id) && !confirm(`"${d.mission}" ya está completada. ¿Jugarla otra vez? (No da una pista nueva)`)) return;
      sfx.whoosh(); go('mission', { id: d.id });
    }));
    $('.map-center', root).onclick = () => (allDone ? go('market') : toast(`💎 Fragmentos recuperados: ${S.done.length} de 5`));
    const mk = $('#mk', root); if (mk) mk.onclick = () => go('market');
    const sus = $('#sus', root); if (sus) sus.onclick = openSuspects;
  };

  /* ---------- Introducción de misión ---------- */
  const islandSVG = d => `<svg viewBox="-170 -215 340 380">${Art.island(d)}</svg>`;
  const mstyle = d => `--mc:${d.color};--mc2:${d.color2}`;
  const mhead = (d, right = '') => `
    <div class="mission-head"><div class="badge">${d.icon}</div>
      <div><div class="row" style="gap:10px"><span class="value-tag">${d.value}</span><span class="sub">${d.name} · ${d.app}</span></div>
      <h1 class="h-xl">${d.mission}</h1></div><div class="top-spacer"></div>${right}</div>`;
  const mview = (d, html, opts) => view(`<div style="${mstyle(d)}">${mhead(d, opts && opts.right)}${html}</div>`, opts);

  screens.mission = ({ id }) => {
    const d = district(id);
    if (!d || !started()) return go('map');
    const root = mview(d, `
      <div class="intro-grid">
        <div class="intro-island bob">${islandSVG(d)}</div>
        <div class="col">
          <p class="h-md" style="font-weight:700">${d.tagline}</p>
          <ul class="rule-list">${d.rules.map((r, i) => `<li style="animation-delay:${i * .1}s"><span class="n">${i + 1}</span><span>${r}</span></li>`).join('')}</ul>
          <div class="row"><span class="pill">⏱ ~${d.minutes} min</span><span class="pill">🔒 Pista secreta para el equipo ganador</span></div>
          <div class="row mt-s"><button class="btn ghost" id="bk">← Mapa</button><button class="btn big pink pulse" id="go">¡Empezar misión! 🚀</button></div>
        </div>
      </div>`);
    $('#bk', root).onclick = () => go('map');
    $('#go', root).onclick = () => { sfx.reveal(); MISSIONS[id](d); };
  };

  function finishMission(id) {
    if (!S.done.includes(id)) {
      const c = S.clues.find(x => !x.mission); if (c) c.mission = id;
      S.done.push(id); save();
    }
    go('missionEnd', { id });
  }
  const finishBtn = (label = '🏁 Terminar misión') => `<button class="btn yellow" id="fin">${label}</button>`;

  /* =========================================================
     MISIONES
     ========================================================= */
  const MISSIONS = {};

  /* ---------- 1. TABÚ COMUNITARIO ---------- */
  MISSIONS.plaza = d => {
    const deck = shuffle(TABOO_CARDS);
    let ci = 0, turn = 0;
    const order = S.teams.map(t => t.id);
    const draw = () => deck[ci++ % deck.length];

    function pre() {
      const t = team(order[turn]);
      const root = mview(d, `
        <div class="glass center">
          <div class="turn-banner" style="--tc:${t.color};justify-content:center">${t.emoji} Turno de ${esc(t.name)} <span class="muted" style="font-size:.6em">(${turn + 1} de ${order.length})</span></div>
          <h2 class="h-lg">Elijan a quien va a explicar 🎤</h2>
          <div class="rules-grid mt" style="text-align:left">
            <div class="fact"><b>🔄 ${esc(t.name)}</b>Todos menos quien explica: ¡de espaldas a la pantalla!</div>
            <div class="fact"><b>👮 Los demás equipos</b>Son moderadores: miren la pantalla y griten ¡INFRACCIÓN! si escuchan una palabra prohibida.</div>
            <div class="fact"><b>🚫 Prohibido</b>Decir la palabra, partes de ella, traducirla o hacer mímica con letras.</div>
          </div>
          <button class="btn big pink pulse mt" id="go">▶ ¡Arrancan 60 segundos!</button>
        </div>`, { right: finishBtn() });
      $('#go', root).onclick = () => play(t);
      $('#fin', root).onclick = () => finishMission(d.id);
    }

    function play(t) {
      const played = [];
      let card = draw();
      const root = mview(d, `
        <div class="turn-banner" style="--tc:${t.color}">${t.emoji} ${esc(t.name)} explicando · <span class="mini-count" id="cnt">✅ 0</span></div>
        <div class="taboo-layout">
          <div id="cardbox"></div>
          <div class="taboo-side">
            <div id="tm"></div>
            <button class="btn green big" id="ok">✅ ¡Adivinó! +100</button>
            <button class="btn red" id="bad">⛔ ¡Infracción! −50</button>
            <button class="btn ghost" id="skip">⏭ Pasar</button>
          </div>
        </div>`);
      const paint = () => {
        $('#cardbox', root).innerHTML = `<div class="taboo-card"><div class="kicker" style="color:#bfdbfe">Expliquen sin decir...</div>
          <div class="word">${card.word}</div>${card.policy ? `<div class="pol-en">${policy(card.policy).en}</div>` : ''}<div class="bn-title">🚫 PALABRAS PROHIBIDAS</div>
          <div class="banned">${card.banned.map(b => `<span>${b}</span>`).join('')}</div></div>`;
        $('#cnt', root).textContent = `✅ ${played.filter(p => p.r === 'ok').length}`;
      };
      const next = r => { played.push({ card, r }); card = draw(); paint(); };
      paint();
      makeTimer($('#tm', root), 60, { size: 190, onEnd: () => summary(t, played) });
      $('#ok', root).onclick = () => { award(t.id, 100, d.id); next('ok'); };
      $('#bad', root).onclick = () => { award(t.id, -50, d.id); next('bad'); };
      $('#skip', root).onclick = () => { sfx.click(); next('skip'); };
    }

    function summary(t, played) {
      const ok = played.filter(p => p.r === 'ok').length;
      const last = turn >= order.length - 1;
      const root = mview(d, `
        <div class="center"><div class="turn-banner" style="--tc:${t.color};justify-content:center">⏰ ¡Tiempo! ${t.emoji} ${esc(t.name)} adivinó ${ok} ${ok === 1 ? 'palabra' : 'palabras'}</div>
        <h2 class="h-md">💡 Lo que aprendimos en este turno</h2></div>
        <div class="fact-list mt">${played.length ? played.map(p => `<div class="fact ${p.r}"><b>${p.r === 'ok' ? '✅' : p.r === 'bad' ? '⛔' : '⏭'} ${p.card.word}</b>${p.card.fact}</div>`).join('') : '<p class="muted center">No alcanzaron a jugar cartas.</p>'}</div>
        <div class="row center mt">${last ? finishBtn('🏁 Ver resultados de la misión') : '<button class="btn pink big" id="nx">Siguiente equipo ➜</button>'}</div>`);
      if (last) $('#fin', root).onclick = () => finishMission(d.id);
      else $('#nx', root).onclick = () => { turn++; pre(); };
    }
    pre();
  };

  /* ---------- 2. CAZADORES DE ANZUELOS ---------- */
  MISSIONS.puerto = d => {
    let si = 0;
    function itemHTML(it, sc) {
      const fl = it.flag ? `flaggable" data-flag="${it.flag}` : '';
      if (it.type === 'banner') return `<div class="sys-banner ${fl}">${it.text}</div>`;
      if (it.type === 'forward') return `<div class="fwd ${fl}">${it.text}</div>`;
      if (it.type === 'link') return `<div class="link-card ${fl}"><div class="li">🎁</div><div class="lt">${it.title}</div><div class="lu">${it.url}</div></div>`;
      return `<div class="bub ${it.from} ${fl}">${it.name ? `<span class="who">${it.name}</span>` : ''}${it.text}<span class="tm">${it.time || ''}${it.from === 'me' ? ' ✓✓' : ''}</span></div>`;
    }
    function scenario() {
      const sc = SCAM_SCENARIOS[si];
      const total = Object.keys(sc.flags).length;
      const found = {};
      const root = mview(d, `
        <div class="scam-layout">
          <div class="phone" style="--pbg:${sc.bg};--bt:${sc.bubbleThem};--bm:${sc.bubbleMe}"><div class="notch"></div>
            <div class="scr">
              <div class="hdr ${sc.contactFlag ? `flaggable" data-flag="${sc.contactFlag}` : ''}"><span>←</span><div class="av">${sc.avatar}</div>
                <div><div class="cn">${sc.contact}</div><div class="cs">${sc.contactSub}</div></div><div class="top-spacer"></div><span>📞 ⋮</span></div>
              <div class="msgs">${sc.items.map(it => itemHTML(it, sc)).join('')}</div>
              <div class="hdr" style="padding:10px 12px"><div style="flex:1;background:rgba(255,255,255,.08);border-radius:20px;padding:8px 14px;opacity:.6;font-size:.85em">Mensaje</div><span>🎤</span></div>
            </div></div>
          <div class="col">
            <div class="row"><div><div class="kicker">Chat ${si + 1} de ${SCAM_SCENARIOS.length} · ${sc.app}</div><h2 class="h-lg">${sc.title}</h2>${polChips(sc.policies)}</div>
              <div class="top-spacer"></div><div id="tm"></div></div>
            <div class="glass" style="padding:18px"><div class="row"><span class="counter-big"><span id="fc">0</span>/${total}</span>
              <span class="h-md">anzuelos encontrados 🎣</span></div>
              <p class="muted" style="margin:6px 0 0">¿Ven algo sospechoso? Griten <b>¡ANZUELO!</b> y expliquen por qué. Moderador: toque el elemento en el teléfono.</p></div>
            <div class="flag-feed" id="feed"></div>
            <div class="row"><button class="btn ghost sm" id="rev">👀 Revelar los que faltan</button>
              <button class="btn pink" id="nx">${si < SCAM_SCENARIOS.length - 1 ? 'Siguiente chat ➜' : 'Ver el escudo anti-anzuelos 🛡️'}</button></div>
          </div>
        </div>`);
      makeTimer($('#tm', root), 90, { size: 120, onEnd: () => toast('⏰ ¡Tiempo! Revelen los anzuelos que faltan') });
      const addFeed = (key, tid, missed) => {
        const f = sc.flags[key], t = tid && team(tid);
        $('#feed', root).insertAdjacentHTML('afterbegin', `<div class="flag-item ${missed ? 'missed' : ''}"><span style="font-size:1.6em">${missed ? '⚠️' : '🎣'}</span>
          <div><b>${f.title}</b><br>${f.text}</div><span class="fi-team">${t ? t.emoji : missed ? '' : '🙅'}</span></div>`);
        $('#fc', root).textContent = Object.keys(found).length;
      };
      $$('.flaggable', root).forEach(el => (el.onclick = () => {
        const key = el.dataset.flag;
        if (key in found) return;
        el.classList.add('found'); sfx.stamp();
        pickTeam(`🎣 ${sc.flags[key].title}`, tid => { found[key] = tid; if (tid) award(tid, 50, d.id); addFeed(key, tid); },
          { sub: '¿Qué equipo lo encontró primero? (+50 ❤️)' });
      }));
      $('#rev', root).onclick = () => {
        $$('.flaggable', root).forEach(el => { const k = el.dataset.flag; if (!(k in found)) { found[k] = null; el.classList.add('missed'); addFeed(k, null, true); } });
      };
      $('#nx', root).onclick = () => { si++; si < SCAM_SCENARIOS.length ? scenario() : shield(); };
    }
    function shield() {
      const tips = [
        ['⏸️', 'Pausa', 'Si hay prisa, miedo o un premio increíble, detente. La urgencia es la carnada.'],
        ['📞', 'Verifica por otro canal', 'Llama al número que ya conoces o entra a la app oficial, nunca por el enlace del mensaje.'],
        ['🔑', 'Nunca compartas códigos', 'Ni contraseñas ni códigos de verificación. Nadie legítimo te los pedirá.'],
        ['🛡️', 'Activa la verificación en dos pasos', 'En WhatsApp y en el Centro de cuentas de Meta. Es tu candado extra.'],
        ['🚩', 'Reporta y bloquea', 'Ayudas a proteger a toda la comunidad, no solo a ti.'],
      ];
      const root = mview(d, `
        <div class="center"><h2 class="h-lg">🛡️ El escudo anti-anzuelos</h2><p class="muted h-md">Cinco reflejos que la Capitana Phishy odia</p><div class="row center">${polChips(['cyber', 'spam'])}</div></div>
        <div class="lessons mt">${tips.map((t, i) => `<div style="--c:${['#25d366', '#22d3ee', '#ffd23f', '#a78bfa', '#ff4fa3'][i]}"><div style="font-size:2.4em">${t[0]}</div><h4>${t[1]}</h4>${t[2]}</div>`).join('')}</div>
        <div class="row center mt">${finishBtn('🏁 Ver resultados de la misión')}</div>`);
      $('#fin', root).onclick = () => finishMission(d.id);
    }
    scenario();
  };

  /* ---------- 3. EL CONSEJO DE LA ISLA ---------- */
  MISSIONS.isla = d => {
    const played = new Set();
    let k = 0;
    const postHTML = c => `
      <div class="post">
        <div class="ph"><div class="pa"><span>${c.avatar}</span></div>${c.user}<div class="top-spacer"></div>⋯</div>
        <div class="pimg" style="background:${c.image.bg}"><span class="pe">${c.image.emoji}</span><span class="pcap">${c.image.caption}</span></div>
        <div class="pact">♡ 💬 ↗<div class="top-spacer"></div>🔖</div>
        <div class="plikes">${c.likes} Me gusta</div>
        <div class="ptxt"><b>${c.user}</b>${c.caption}</div>
      </div>`;

    function list() {
      const root = mview(d, `
        <div class="center"><h2 class="h-lg">📂 Casos pendientes del Consejo</h2>
          <p class="muted h-md">Elijan un caso. Recomendado: <b>3 casos</b> (~3 minutos cada uno). Llevan ${played.size}.</p></div>
        <div class="case-grid mt">${COUNCIL_CASES.map(c => `<div class="case-tile ${played.has(c.id) ? 'played' : ''}" data-id="${c.id}">
          <div class="ce">${c.image.emoji}</div><h4>${c.title}</h4><div class="muted">@${c.user}</div>${played.has(c.id) ? '<div class="pill mt-s">✅ Juzgado</div>' : ''}</div>`).join('')}</div>
        <div class="row center mt">${played.size ? finishBtn('🏁 Cerrar sesión del Consejo') : ''}</div>`, { right: '' });
      $$('.case-tile', root).forEach(el => (el.onclick = () => caseView(COUNCIL_CASES.find(c => c.id === el.dataset.id))));
      const f = $('#fin', root); if (f) f.onclick = () => finishMission(d.id);
    }

    function caseView(c) {
      const n = S.teams.length;
      let keepT = S.teams[(2 * k) % n], remT = S.teams[(2 * k + 1) % n];
      if (n === 2 && k % 2) [keepT, remT] = [remT, keepT];
      const council = S.teams.filter(t => t !== keepT && t !== remT);
      const root = mview(d, `
        <div class="council-layout">
          <div>${postHTML(c)}</div>
          <div class="col">
            <div><div class="kicker">Caso: ${c.title}</div><h2 class="h-lg">¿Esta publicación se queda o se va?</h2></div>
            <div class="versus">
              <div class="side keep" id="sk" style="color:#25d366"><div class="sl">🟢 MANTENER</div><div class="st" style="color:#fff">${keepT.emoji} ${esc(keepT.name)}</div></div>
              <div class="vs">VS</div>
              <div class="side remove" id="sr" style="color:#ff4d6d"><div class="sl">🔴 ELIMINAR</div><div class="st" style="color:#fff">${remT.emoji} ${esc(remT.name)}</div></div>
            </div>
            <div class="council-strip">⚖️ <b>El Consejo:</b> ${council.length ? council.map(t => `${t.emoji} ${esc(t.name)}`).join(' · ') : 'el moderador decide'}</div>
            <div class="glass" id="phase" style="padding:20px"></div>
          </div>
        </div>`);
      const ph = $('#phase', root), sk = $('#sk', root), sr = $('#sr', root);
      const hl = w => { sk.classList.toggle('active', w === 'k'); sr.classList.toggle('active', w === 'r'); sk.classList.toggle('dim', w === 'r'); sr.classList.toggle('dim', w === 'k'); };

      const phases = {
        prep() {
          hl(null);
          ph.innerHTML = `<div class="row"><div id="tm"></div><div style="flex:1"><h3 class="h-md">🧠 Preparen sus argumentos</h3>
            <p>Abogados: piensen qué dirían. Consejo: lean bien el caso. ¿Qué valor está en juego: <b>voz, seguridad, dignidad, autenticidad o privacidad</b>?</p>
            <button class="btn pink" id="go">🎤 ¡Que hable MANTENER!</button></div></div>`;
          makeTimer($('#tm', ph), 30, { size: 120 });
          $('#go', ph).onclick = phases.keep;
        },
        keep() {
          hl('k'); sfx.whoosh();
          ph.innerHTML = `<div class="row"><div id="tm"></div><div style="flex:1"><h3 class="h-md">🟢 ${keepT.emoji} ${esc(keepT.name)} defiende MANTENER</h3>
            <p>45 segundos para convencer al Consejo. ¡Con pasión y argumentos!</p><button class="btn red" id="go">🎤 Turno de ELIMINAR</button></div></div>`;
          makeTimer($('#tm', ph), 45, { size: 120 });
          $('#go', ph).onclick = phases.remove;
        },
        remove() {
          hl('r'); sfx.whoosh();
          ph.innerHTML = `<div class="row"><div id="tm"></div><div style="flex:1"><h3 class="h-md">🔴 ${remT.emoji} ${esc(remT.name)} defiende ELIMINAR</h3>
            <p>45 segundos. ¡Rebatan a la defensa!</p><button class="btn yellow" id="go">🗳️ ¡A votar!</button></div></div>`;
          makeTimer($('#tm', ph), 45, { size: 120 });
          $('#go', ph).onclick = phases.vote;
        },
        vote() {
          hl(null);
          ph.innerHTML = `<h3 class="h-md">🗳️ ${council.length ? 'Consejo: ¡voten levantando la mano!' : 'Moderador: ¿quién argumentó mejor?'}</h3>
            <p>¿Quién <b>convenció</b> más? (No importa lo que diga la norma: aquí se premia la argumentación) <b>+150 ❤️</b></p>
            <div class="row"><button class="btn green" id="wk">🟢 Ganó MANTENER</button><button class="btn red" id="wr">🔴 Ganó ELIMINAR</button></div>`;
          $('#wk', ph).onclick = () => { award(keepT.id, 150, d.id); phases.verdict(); };
          $('#wr', ph).onclick = () => { award(remT.id, 150, d.id); phases.verdict(); };
        },
        verdict() {
          hl(null); sfx.stamp(); confetti(60);
          ph.innerHTML = `<div class="center"><div class="kicker">¿Qué dicen las Normas Comunitarias?</div>
            <div class="mt-s"><span class="stamp ${c.verdict}">${c.verdictLabel}</span></div>
            <div class="row center mt-s">${polChips(c.policies)}</div></div>
            <p class="mt" style="font-size:1.1em;line-height:1.45">${c.explain}</p>
            ${council.length ? `<p class="muted">¿Qué equipos del Consejo votaron como dice la norma? (+50 ❤️ cada uno)</p>
              <div class="row">${council.map(t => `<button class="opt" style="--tc:${t.color}" data-t="${t.id}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div>` : ''}
            <div class="row mt"><button class="btn pink" id="nx">📂 Volver a los casos</button></div>`;
          focus(ph);
          $$('[data-t]', ph).forEach(b => (b.onclick = () => { if (b.classList.contains('sel')) return; b.classList.add('sel'); award(b.dataset.t, 50, d.id); }));
          $('#nx', ph).onclick = () => { played.add(c.id); k++; list(); };
        },
      };
      phases.prep();
    }
    list();
  };

  /* ---------- 4. TELÉFONO VIRAL ---------- */
  MISSIONS.torre = d => {
    let mi = Math.floor(Math.random() * PHONE_MESSAGES.length);
    const breaking = msg => `<div class="breaking"><div class="bh"><i></i> ÚLTIMA HORA · NEXÓPOLIS NOTICIAS</div><div class="bt">${msg}</div>
      <div class="ticker"><span>📡 EN VIVO desde la Torre Espiral · Compartido 12.408 veces · #Nexópolis · Verifica antes de compartir · </span></div></div>`;

    function setup() {
      const root = mview(d, `
        <div class="rules-grid">
          <div class="glass rule-card"><span class="ic">🚶‍♀️🚶🚶‍♂️</span><h3>1. Formen filas</h3><p>Cada equipo en una fila, lejos de los otros equipos.</p></div>
          <div class="glass rule-card"><span class="ic" style="animation-delay:-1s">👀</span><h3>2. Primera persona</h3><p>La primera de cada fila se acerca a la pantalla. ¡El resto, <b>de espaldas</b>!</p></div>
          <div class="glass rule-card"><span class="ic" style="animation-delay:-2s">🤫</span><h3>3. Susurren</h3><p>Una sola vez por persona. Nada de repetir ni escribir.</p></div>
        </div>
        <div class="row center mt"><button class="btn big pink pulse" id="go">📡 ¡Listos! Mostrar la noticia</button></div>`, { right: '' });
      $('#go', root).onclick = countdown;
    }
    function countdown() {
      let n = 3;
      const tick = () => {
        if (n === 0) return show();
        const root = view(`<div class="countdown-big warm-text">${n}</div><p class="center h-md">Primeras personas: ¡atentas! 👀 · Todos los demás: ¡de espaldas! 🙈</p>`, { full: true });
        sfx.drum(); n--; later(tick, 1000);
      };
      tick();
    }
    function show() {
      const root = view(`<div style="${mstyle(d)}"><div class="row" style="justify-content:space-between;margin-bottom:20px">
        <h2 class="h-lg">📡 Memoricen la noticia</h2><div id="tm"></div></div>${breaking(PHONE_MESSAGES[mi])}</div>`, { full: true });
      sfx.reveal();
      makeTimer($('#tm', root), 15, { size: 130, onEnd: whisper });
    }
    function whisper() {
      const root = mview(d, `
        <div class="center"><div class="hidden-msg">🤫 ¡Noticia oculta!<br><span class="grad-text">Pásenla susurrando</span></div>
        <div class="whisper-waves">${Array.from({ length: 14 }, (_, i) => `<i style="animation-delay:${i * .08}s"></i>`).join('')}</div>
        <div class="row center"><div id="tm"></div></div>
        <p class="muted h-md">Una sola vez por persona. ¡La última persona de cada fila guarda el mensaje!</p>
        <button class="btn pink big mt-s" id="go">🎤 Todos terminaron</button></div>`);
      makeTimer($('#tm', root), 90, { size: 150 });
      $('#go', root).onclick = tell;
    }
    function tell() {
      const root = mview(d, `
        <div class="center"><h2 class="h-lg">🎤 Últimas personas: ¡digan la noticia en voz alta!</h2>
        <p class="muted h-md">Un equipo a la vez. El resto escucha... y se ríe.</p></div>
        <div class="score-rows mt">${S.teams.map((t, i) => `<div class="score-row" style="--tc:${t.color};animation:screenIn .5s ${i * .1}s both"><div class="tn">${t.emoji} ${esc(t.name)}</div><span class="muted">🎤 Turno ${i + 1}</span></div>`).join('')}</div>
        <div class="row center mt"><button class="btn big yellow pulse" id="go">📰 Revelar la noticia original</button></div>`);
      $('#go', root).onclick = reveal;
    }
    function reveal() {
      const opts = [['🎯 Idéntica', 200], ['👍 Casi igual', 150], ['🤏 Más o menos', 100], ['🐉 ¡Inventaron todo!', 50]];
      const given = {};
      const root = mview(d, `
        ${breaking(PHONE_MESSAGES[mi])}
        <h3 class="h-md mt">🏅 ¿Qué tan fiel llegó la noticia?</h3>
        <div class="score-rows mt-s">${S.teams.map(t => `<div class="score-row" style="--tc:${t.color}"><div class="tn">${t.emoji} ${esc(t.name)}</div>
          <div class="opts">${opts.map(([l, p]) => `<button class="opt" data-t="${t.id}" data-p="${p}">${l} +${p}</button>`).join('')}</div></div>`).join('')}</div>
        <div class="glass mt"><div class="row" style="align-items:flex-start">
          <div style="flex:1.2;min-width:300px"><h3 class="h-md">🔥 Lo falso corre más rápido</h3>${polChips(['misinfo', 'spam'])}
            <p>Un estudio del MIT publicado en <i>Science</i> (2018) encontró que en redes sociales las noticias falsas llegaban a más personas y más rápido que las verdaderas.
            Cada vez que alguien comparte sin verificar, el mensaje cambia un poquito... como acaban de vivir.</p>
            <p><b>Antes de compartir:</b> ⏸️ haz una pausa · 🔎 busca la fuente original y la fecha · 🏷️ fíjate en las etiquetas de contexto (verificación, Notas de la Comunidad, "Reenviado muchas veces") · 😱 si te genera una emoción extrema, sospecha.</p></div>
          <div style="flex:1;min-width:300px"><canvas class="network" id="net"></canvas>
            <div class="row center"><span class="pill" style="border-color:#ff4fa3">🔥 Rumor</span><span class="pill" style="border-color:#22d3ee">✅ Corrección</span></div></div>
        </div></div>
        <div class="row center mt"><button class="btn ghost" id="ch">🔁 Jugar otra ronda con otra noticia</button>${finishBtn('🏁 Ver resultados de la misión')}</div>`);
      $$('.opt', root).forEach(b => (b.onclick = () => {
        const tid = b.dataset.t, p = +b.dataset.p, prev = given[tid] || 0;
        $$(`.opt[data-t="${tid}"]`, root).forEach(x => x.classList.remove('sel')); b.classList.add('sel');
        b.style.setProperty('--tc', team(tid).color);
        given[tid] = p; award(tid, p - prev, d.id);
      }));
      $('#ch', root).onclick = () => { mi = (mi + 1) % PHONE_MESSAGES.length; setup(); };
      $('#fin', root).onclick = () => finishMission(d.id);
      network($('#net', root));
    }
    setup();
  };

  function network(cv) {
    const ctx = cv.getContext('2d');
    const W = cv.width = cv.clientWidth * 2, H = cv.height = cv.clientHeight * 2;
    const mk = (cx, col, rate) => ({ col, rate, nodes: [{ x: cx, y: H / 2, p: null, t: 0 }] });
    const nets = [mk(W * .3, '#ff4fa3', .5), mk(W * .75, '#22d3ee', .14)];
    let f = 0, alive = true;
    timers.push({ stop: () => (alive = false) });
    (function step() {
      if (!alive || !document.body.contains(cv)) return;
      f++;
      ctx.clearRect(0, 0, W, H);
      for (const n of nets) {
        if (n.nodes.length < 140 && Math.random() < n.rate) {
          const par = n.nodes[Math.floor(Math.random() * n.nodes.length)];
          const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 40;
          const x = Math.max(10, Math.min(W - 10, par.x + Math.cos(a) * r)), y = Math.max(10, Math.min(H - 10, par.y + Math.sin(a) * r));
          n.nodes.push({ x, y, p: par, t: f });
        }
        ctx.strokeStyle = n.col + '88'; ctx.lineWidth = 2;
        for (const nd of n.nodes) if (nd.p) { ctx.beginPath(); ctx.moveTo(nd.p.x, nd.p.y); ctx.lineTo(nd.x, nd.y); ctx.stroke(); }
        for (const nd of n.nodes) {
          const age = Math.min(1, (f - nd.t) / 20);
          ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(nd.x, nd.y, (nd.p ? 6 : 12) * age + 1, 0, 7); ctx.fill();
        }
      }
      requestAnimationFrame(step);
    })();
  }

  /* ---------- 5. LA CONTRASEÑA DELATORA ---------- */
  MISSIONS.nebulosa = d => {
    const P = PRIVACY;
    const profileHTML = () => `
      <div class="profile">
        <div class="top"><div class="pav">${P.avatar}</div>
          <div><div class="h-md" style="font-family:var(--font-head)">@${P.user}</div>
            <div class="stats mt-s"><div><b>238</b>publicaciones</div><div><b>1.204</b>seguidores</div><div><b>980</b>seguidos</div></div></div></div>
        <div class="bio"><b>${P.name}</b>${P.bio.map(b => `<span class="${b.risk ? 'risk' : ''}" data-risk="${b.risk || ''}">${b.text}</span>`).join('')}<span class="pill" style="align-self:flex-start;margin-top:6px">🌍 Perfil público</span></div>
        <div class="grid">${P.posts.map(p => `<div class="gp ${p.risk ? 'risk' : ''}" data-risk="${p.risk || ''}" style="background:${p.bg}"><div class="ge">${p.emoji}</div><div class="gc">${p.caption}</div></div>`).join('')}</div>
      </div>`;

    function hack() {
      let solved = false;
      const root = mview(d, `
        <div class="priv-layout">
          <div>${profileHTML()}</div>
          <div class="glass vault">
            <div class="row" style="justify-content:space-between"><div style="text-align:left"><div class="kicker">Bóveda de Toño Turbo</div><h2 class="h-md">Fragmento de PRIVACIDAD</h2></div><div id="tm"></div></div>
            <div class="vault-door mt" id="door"><div class="dial"></div></div>
            <div class="hint-box">🔑 Pista de recuperación de Toño:<br><span style="font-size:1.15em;color:#f0abfc">${P.hint}</span></div>
            <p class="muted">Equipos: escríbanla en papel y díganla al moderador. (Sin espacios)</p>
            <input class="pw-input" id="pw" placeholder="••••••••" autocomplete="off" spellcheck="false">
            <div class="row center mt-s"><button class="btn pink" id="try">🔓 Probar contraseña</button><button class="btn ghost sm" id="give">🏳️ Revelar</button></div>
            <div id="after"></div>
          </div>
        </div>`);
      makeTimer($('#tm', root), 180, { size: 110 });
      const door = $('#door', root), pw = $('#pw', root);
      const open = () => {
        solved = true; clearTimers();
        door.classList.add('open'); sfx.reveal(); confetti(120);
        pw.value = 'Pelusa1995*'; pw.disabled = true;
        $('#after', root).innerHTML = `<div class="mt"><div class="fragment">💎</div><h3 class="h-md">¡Bóveda abierta!</h3>
          <p>Toño usó <b>datos que él mismo publicó</b>. Cualquiera con 2 minutos podía adivinarla... 😬</p>
          <div class="row center"><button class="btn green sm" id="first">🥇 Primer equipo +250</button><button class="btn sm ghost" id="also">👏 Otros que la tenían +100</button></div>
          <button class="btn yellow mt" id="nx">🔎 Siguiente: auditoría de privacidad ➜</button></div>`;
        focus($('#after', root));
        $('#first', root).onclick = () => pickTeam('🥇 ¿Qué equipo la descifró primero?', tid => tid && award(tid, 250, d.id));
        $('#also', root).onclick = () => pickTeam('👏 ¿Otro equipo que también la tenía?', tid => tid && award(tid, 100, d.id));
        $('#nx', root).onclick = audit;
      };
      const tryIt = () => {
        if (solved) return;
        const v = pw.value.trim().toLowerCase().replace(/\s+/g, '');
        if (!v) return;
        if (v === P.answer) open();
        else { door.classList.remove('shake'); void door.offsetWidth; door.classList.add('shake'); sfx.bad(); toast('🚫 ACCESO DENEGADO'); pw.select(); }
      };
      $('#try', root).onclick = tryIt;
      pw.onkeydown = e => { if (e.key === 'Enter') tryIt(); };
      $('#give', root).onclick = () => confirm('¿Revelar la contraseña sin que nadie la adivine?') && open();
    }

    function audit() {
      const root = mview(d, `
        <div class="priv-layout">
          <div>${profileHTML()}</div>
          <div class="col">
            <div class="glass"><div class="row"><div id="tm"></div><div style="flex:1"><h2 class="h-md">🔎 Auditoría de privacidad</h2>
              <p>En <b>60 segundos</b>, anoten en su papel <b>todos los datos riesgosos</b> que Toño expone en su perfil. ¡Gana quien encuentre más!</p></div></div></div>
            <div class="flag-feed" id="feed"></div>
            <div class="row"><button class="btn pink" id="rev">👀 Revelar riesgos</button></div>
          </div>
        </div>`);
      makeTimer($('#tm', root), 60, { size: 120 });
      $('#rev', root).onclick = () => {
        const seen = new Set();
        const feed = $('#feed', root);
        Object.entries(P.risks).forEach(([k, txt], i) => later(() => {
          $$(`[data-risk="${k}"]`, root).forEach(el => el.classList.add('found'));
          if (!seen.has(k)) { seen.add(k); feed.insertAdjacentHTML('beforeend', `<div class="flag-item missed"><span style="font-size:1.5em">⚠️</span><div>${txt}</div></div>`); sfx.tick(); }
        }, i * 450));
        later(() => {
          $('#rev', root).outerHTML = `<button class="btn green" id="best">🏆 ¿Quién encontró más? +150</button><button class="btn yellow" id="les">🛡️ Cómo protegerse ➜</button>`;
          $('#best', root).onclick = () => pickTeam('🏆 ¿Qué equipo encontró más riesgos?', tid => tid && award(tid, 150, d.id));
          $('#les', root).onclick = lessons;
        }, Object.keys(P.risks).length * 450 + 200);
      };
    }

    function lessons() {
      const tips = [
        ['🔍', 'Revisión de privacidad', 'Elige quién ve tus publicaciones, tu información y quién puede encontrarte.'],
        ['👥', 'Audiencia', 'Cada publicación puede ser Pública, Amigos o una lista personalizada. Tú decides.'],
        ['🔑', 'Contraseñas únicas', 'Largas, distintas en cada cuenta y sin datos que publiques (mascota, cumpleaños...).'],
        ['🛡️', 'Dos pasos', 'Activa la verificación en dos pasos desde el Centro de cuentas.'],
        ['✈️', 'Publica después', 'Comparte el viaje cuando vuelvas, no mientras tu casa está sola.'],
      ];
      const root = mview(d, `
        <div class="center"><h2 class="h-lg">🛡️ Escudo de privacidad</h2><p class="muted h-md">Lo que Toño Turbo debió hacer</p><div class="row center">${polChips(['privacy'])}</div></div>
        <div class="lessons mt">${tips.map((t, i) => `<div style="--c:${['#a78bfa', '#22d3ee', '#ffd23f', '#25d366', '#ff4fa3'][i]}"><div style="font-size:2.4em">${t[0]}</div><h4>${t[1]}</h4>${t[2]}</div>`).join('')}</div>
        <div class="row center mt">${finishBtn('🏁 Ver resultados de la misión')}</div>`);
      $('#fin', root).onclick = () => finishMission(d.id);
    }

    const root = mview(d, `
      <div class="intro-grid">
        <div class="center"><div style="font-size:9em" class="bob">🧑‍🎤</div></div>
        <div class="glass"><div class="kicker">Informe de inteligencia</div><h2 class="h-lg mt-s">Conozcan a Toño Turbo</h2>
          <p class="h-md" style="line-height:1.4">El cómplice del ladrón escondió el fragmento de <b>PRIVACIDAD</b> en una bóveda digital.
          La buena noticia: Toño publica <b>absolutamente todo</b> en su perfil público... incluso lo que no debería. 🙈</p>
          <button class="btn big pink pulse mt" id="go">🔓 Hackear la bóveda (éticamente)</button></div>
      </div>`);
    $('#go', root).onclick = hack;
  };

  /* ---------- Fin de misión + pista secreta ---------- */
  screens.missionEnd = ({ id }) => {
    const d = district(id);
    const clue = S.clues.find(c => c.mission === id);
    const pts = S.mpts[id] || {};
    const ranked = [...S.teams].sort((a, b) => (pts[b.id] || 0) - (pts[a.id] || 0));
    const max = Math.max(0, ...S.teams.map(t => pts[t.id] || 0));
    const sel = new Set(clue && clue.holders.length ? clue.holders : (max > 0 ? S.teams.filter(t => (pts[t.id] || 0) === max).map(t => t.id) : []));
    const medals = ['🥇', '🥈', '🥉'];
    const root = mview(d, `
      <div class="intro-grid">
        <div class="facet-restore">${Art.crystal(S.done, 280)}<h2 class="h-lg mt-s">💎 ¡Fragmento de <span style="color:${d.color}">${d.value}</span> recuperado!</h2></div>
        <div class="col">
          <h3 class="h-md">Likes ganados en esta misión</h3>
          <div class="result-list">${ranked.map((t, i) => `<div class="result-row ${sel.has(t.id) ? 'sel' : ''}" data-id="${t.id}" style="border-left:6px solid ${t.color}">
            <span class="rk">${medals[i] || '·'}</span><span style="font-size:1.6em">${t.emoji}</span><span class="rn">${esc(t.name)}</span>
            <span class="rp">${pts[t.id] || 0} ❤️</span><span class="ck">${sel.has(t.id) ? '🔒' : ''}</span></div>`).join('')}</div>
          <p class="muted">Los equipos marcados con 🔒 recibirán la <b>pista secreta</b>. (Toquen para cambiar en caso de empate o decisión del moderador.)</p>
          <div class="row">${clue ? '<button class="btn big pink pulse" id="give">🔒 Entregar pista secreta</button>' : ''}<button class="btn ghost" id="skip">${clue ? 'Saltar' : 'Volver al mapa'}</button></div>
        </div>
      </div>`);
    if (!clue) sfx.reveal(); else { sfx.fanfare(); confetti(90); }
    $$('.result-row', root).forEach(r => (r.onclick = () => {
      const tid = r.dataset.id;
      sel.has(tid) ? sel.delete(tid) : sel.add(tid);
      r.classList.toggle('sel'); $('.ck', r).textContent = sel.has(tid) ? '🔒' : ''; sfx.click();
    }));
    $('#skip', root).onclick = () => afterClue(d);
    const g = $('#give', root);
    if (g) g.onclick = () => {
      if (!sel.size) return toast('Elijan al menos un equipo 🔒');
      clue.holders = [...sel]; save();
      turnAway(d, clue);
    };
  };

  function turnAway(d, clue) {
    const holders = clue.holders.map(team);
    const root = view(`
      <div class="turn-away">
        <span class="em">🙈</span>
        <h1 class="h-xl">¡Todos <span class="warm-text">de espaldas</span>!</h1>
        <p class="h-md mt-s">...excepto:</p>
        <div class="row center mt-s">${holders.map(t => `<span class="pill" style="font-size:1.5em;border:2px solid ${t.color}">${t.emoji} ${esc(t.name)}</span>`).join('')}</div>
        <p class="muted h-md mt">Pista secreta #${S.clues.indexOf(clue) + 1} · ${d.name}</p>
        <button class="btn big yellow mt" id="show">👁️ Ya están de espaldas · Mostrar pista</button>
      </div>`, { full: true });
    sfx.whoosh();
    $('#show', root).onclick = () => {
      const r2 = view(`
        <div class="envelope">
          <div class="clue-card" id="card"><div class="seal">🔒</div>
            <div class="ct">PISTA SECRETA · ${d.name.toUpperCase()}</div>
            <div class="cx">${clueText(clue)}</div>
            <p style="margin-top:22px;font-weight:800;opacity:.75">📝 Anótenla en su hoja... ¡y guarden el secreto (por ahora)!</p></div>
          <div class="row center mt"><div id="tm"></div><button class="btn ghost" id="hide">🔥 Ocultar pista</button></div>
        </div>`, { full: true });
      sfx.reveal();
      const burn = () => { clearTimers(); $('#card', r2).classList.add('burn'); sfx.whoosh(); setTimeout(() => afterClue(d), 900); };
      makeTimer($('#tm', r2), 20, { size: 110, onEnd: burn });
      $('#hide', r2).onclick = burn;
    };
  }

  function afterClue(d) {
    const all = S.done.length === DISTRICTS.length;
    const root = mview(d, `
      <div class="facet-restore">
        <div class="row center" style="gap:30px"><div>${Art.crystal(S.done, 150)}</div>
          <div style="text-align:left"><h2 class="h-xl">✅ ¡Ya pueden voltearse!</h2>
          <p class="h-md">Cristal restaurado: <b>${S.done.length} / ${DISTRICTS.length}</b></p></div></div>
        <div class="lesson-box"><b style="color:${d.color}">${LESSONS[d.id].value}:</b> ${LESSONS[d.id].text}</div>
        <h3 class="h-md mt">📚 Nuevas políticas en su Archivo <span class="pill">${unlockedCount()} / ${POLICIES.length}</span></h3>
        <div class="codex unlock mt-s">${POLICIES.filter(p => p.district === d.id).map((p, i) => polCard(p, false, .3 + i * .25)).join('')}</div>
        <div class="row center mt">${all ? '<button class="btn big pink pulse" id="nx">🕵️ ¡Cristal completo! Al Mercado de Pistas</button>' : '<button class="btn big pink" id="nx">🗺️ Volver al mapa</button>'}</div>
      </div>`);
    $('#nx', root).onclick = () => go(all ? 'market' : 'map');
  }

  /* ---------- Mercado de Pistas ---------- */
  screens.market = () => {
    if (!started()) return go('title');
    const holdersList = S.clues.filter(c => c.mission).map(c => {
      const d = district(c.mission);
      return `<span class="pill" style="border-color:${d.color}">${d.icon} Pista de ${d.name}: ${c.holders.length ? c.holders.map(id => team(id) ? team(id).emoji : '').join(' ') : '🙅 nadie'}</span>`;
    }).join('');
    const opts = S.teams.map(t => `<option value="${t.id}">${t.emoji} ${esc(t.name)}</option>`).join('');
    const root = view(`
      <div class="center"><div class="kicker">Fase final · Parte 1</div><h1 class="h-xl">🤝 Mercado de <span class="warm-text">Pistas</span></h1>
        <p class="muted h-md">Nadie tiene todas las pistas... ¿o sí? Es hora de negociar.</p></div>
      <div class="market-grid mt">
        <div class="market-rules">
          <div><span class="mi">🗣️</span><b>Compartan</b><br>Pueden contarle sus pistas a otros equipos... si quieren.</div>
          <div><span class="mi">💱</span><b>Negocien</b><br>Intercambien pistas o véndanlas por Likes (el moderador hace la transferencia).</div>
          <div><span class="mi">🤥</span><b>¿Mentir?</b><br>Está permitido. Por eso mismo: <b>¡verifiquen sus fuentes!</b> Igual que en las redes.</div>
          <div><span class="mi">✕</span><b>Descarten</b><br>Crucen sospechosos en su hoja. Solo puede quedar uno.</div>
        </div>
        <div class="center"><div id="tm"></div><p class="muted">Tiempo de mercado</p></div>
      </div>
      <div class="glass mt" style="padding:18px"><div class="row center">${holdersList || '<span class="muted">Aún no se han entregado pistas.</span>'}</div></div>
      <div class="glass mt" style="padding:18px"><h3 class="h-md center">💱 Transferir Likes</h3>
        <div class="transfer mt-s"><select id="tf">${opts}</select> ➜ <select id="tt">${opts}</select>
          <input id="ta" type="number" value="50" step="10" min="10" style="width:110px"> ❤️ <button class="btn sm green" id="tx">Transferir</button></div></div>
      <div class="row center mt"><button class="btn ghost" id="sus">🕵️ Ver sospechosos</button><button class="btn big pink pulse" id="nx">⚖️ ¡Hora de acusar!</button></div>`);
    makeTimer($('#tm', root), 180, { size: 190 });
    $('#tt', root).selectedIndex = Math.min(1, S.teams.length - 1);
    $('#tx', root).onclick = () => {
      const f = $('#tf', root).value, t = $('#tt', root).value, a = Math.abs(+$('#ta', root).value || 0);
      if (f === t || !a) return toast('Elijan dos equipos distintos y una cantidad');
      award(f, -a); setTimeout(() => award(t, a), 350);
      toast(`💱 ${team(f).emoji} ➜ ${team(t).emoji} · ${a} ❤️`);
    };
    $('#sus', root).onclick = openSuspects;
    $('#nx', root).onclick = () => go('accuse');
  };

  /* ---------- Acusación ---------- */
  screens.accuse = () => {
    if (!started()) return go('title');
    const root = view(`
      <div class="center"><div class="kicker">Fase final · Parte 2</div><h1 class="h-xl">⚖️ La <span class="warm-text">Acusación</span></h1>
        <p class="muted h-md">Cada equipo escribe en secreto el nombre del culpable y se lo entrega al moderador. Moderador: regístrenlo aquí.</p></div>
      <div class="accuse-rows mt">${S.teams.map(t => `
        <div class="accuse-row" style="--tc:${t.color}"><div class="tn">${t.emoji} ${esc(t.name)}</div>
          <div class="picks">${SUSPECTS.map(s => `<button class="pick ${S.accus[t.id] === s.id ? 'sel' : ''}" data-t="${t.id}" data-s="${s.id}" title="${s.name}">${Art.avatar(s)}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="row center mt"><button class="btn ghost" id="bk">← Mercado</button><button class="btn big red pulse" id="go">🎭 ¡Desenmascarar al culpable!</button></div>`);
    $$('.pick', root).forEach(b => (b.onclick = () => {
      S.accus[b.dataset.t] = b.dataset.s; save(); sfx.click();
      $$(`.pick[data-t="${b.dataset.t}"]`, root).forEach(x => x.classList.toggle('sel', x === b));
    }));
    $('#bk', root).onclick = () => go('market');
    $('#go', root).onclick = () => {
      const missing = S.teams.filter(t => !S.accus[t.id]);
      if (missing.length && !confirm(`${missing.map(t => t.name).join(', ')} aún no acusa. ¿Revelar de todos modos?`)) return;
      go('reveal');
    };
  };

  /* ---------- Revelación ---------- */
  screens.reveal = () => {
    if (!started()) return go('title');
    const culprit = suspect(S.culprit);
    const root = view(`
      <div class="center"><h1 class="h-xl" id="rt">🥁 El ladrón del Cristal es...</h1></div>
      <div class="reveal-lineup mt-l">${SUSPECTS.map(s => `<div class="rv" data-s="${s.id}" style="--sc:${s.color}">${Art.avatar(s)}
        <div class="h-md" style="margin-top:8px">${s.name}</div>
        <div class="rv-votes row center mt-s" style="gap:4px">${S.teams.filter(t => S.accus[t.id] === s.id).map(t => `<span title="${esc(t.name)}">${t.emoji}</span>`).join('')}</div></div>`).join('')}</div>
      <div id="conf"></div>`, { full: true });
    const spot = document.createElement('div'); spot.className = 'spotlight'; document.body.appendChild(spot);
    timers.push({ stop: () => spot.remove() });
    const order = shuffle(SUSPECTS.filter(s => s.id !== S.culprit).map(s => s.id));
    order.forEach((sid, i) => later(() => {
      const el = $(`.rv[data-s="${sid}"]`, root);
      el.classList.add('innocent'); el.insertAdjacentHTML('beforeend', '<span class="rvs stamp keep">INOCENTE</span>'); sfx.drum();
    }, 1400 + i * 1300));
    later(() => {
      const el = $(`.rv[data-s="${S.culprit}"]`, root), r = el.getBoundingClientRect();
      spot.style.setProperty('--sx', `${r.left + r.width / 2}px`); spot.classList.add('on');
      el.classList.add('guilty'); el.insertAdjacentHTML('beforeend', '<span class="rvs stamp remove">¡CULPABLE!</span>');
      $('#rt', root).innerHTML = `¡<span style="color:${culprit.color}">${culprit.name}</span>!`;
      sfx.stamp(); setTimeout(sfx.fanfare, 300); confetti(220);
    }, 1400 + order.length * 1300 + 1200);
    later(() => {
      spot.classList.remove('on');
      const winners = S.teams.filter(t => S.accus[t.id] === S.culprit);
      $('#conf', root).innerHTML = `
        <div class="glass confession">💬 "${culprit.confession}"</div>
        <div class="center mt"><h3 class="h-md">${winners.length ? `🎉 Acertaron: ${winners.map(t => `${t.emoji} ${esc(t.name)}`).join(' · ')} <span style="color:#7ddf64">+300 ❤️</span>` : '😱 ¡Nadie acertó! El culpable casi se sale con la suya...'}</h3>
        <button class="btn big pink pulse mt" id="fin">🏆 Ver ranking final</button></div>`;
      focus($('#fin', root));
      if (!S.revealed) { S.revealed = true; save(); winners.forEach((t, i) => setTimeout(() => award(t.id, 300), i * 300)); }
      $('#fin', root).onclick = () => go('final');
    }, 1400 + order.length * 1300 + 3600);
  };

  /* ---------- Final ---------- */
  screens.final = () => {
    const ranked = [...S.teams].sort((a, b) => b.score - a.score);
    const pod = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
    const H = { 0: 300, 1: 220, 2: 160 };
    const root = view(`
      <div class="center"><div class="title-crystal" style="display:inline-block">${Art.crystal([], 170, { all: true })}</div>
        <h1 class="mega" style="font-size:clamp(36px,5.5vw,90px)">¡Nexópolis está a salvo!</h1>
        <p class="muted h-md">El Cristal de la Confianza brilla otra vez gracias a la Liga de Guardianes.</p></div>
      <div class="podium mt">${pod.map(t => { const r = ranked.indexOf(t); return `<div class="pl" style="--tc:${t.color}"><div class="pe">${t.emoji}</div><div class="pn">${esc(t.name)}</div><div class="ps">${t.score} ❤️</div>
        <div class="bar" style="height:${H[r]}px;animation-delay:${(2 - r) * .3}s">${['🥇', '🥈', '🥉'][r]}</div></div>`; }).join('')}</div>
      ${ranked.length > 3 ? `<div class="row center mt">${ranked.slice(3).map((t, i) => `<span class="pill" style="border-color:${t.color}">${i + 4}. ${t.emoji} ${esc(t.name)} · ${t.score} ❤️</span>`).join('')}</div>` : ''}
      <div class="glass mt-l"><h3 class="h-md center">💎 Los 5 valores que hoy defendimos</h3>
        <div class="lessons mt">${DISTRICTS.map(d => `<div style="--c:${d.color}"><h4>${d.icon} ${LESSONS[d.id].value}</h4>${LESSONS[d.id].text}</div>`).join('')}</div></div>
      <div class="glass mt"><h3 class="h-md center">📚 Las ${POLICIES.length} políticas que protegen a Nexópolis</h3>
        <div class="final-pols mt">${DISTRICTS.map(d => `<div style="--c:${d.color}"><h4>${d.icon} ${d.name}</h4>${polChips(POLICIES.filter(p => p.district === d.id).map(p => p.id))}</div>`).join('')}</div>
        <div class="row center mt"><button class="btn sm ghost" id="cx">📚 Abrir el Archivo completo</button></div></div>
      <div class="row center mt"><button class="btn ghost" id="home">🏠 Inicio</button><button class="btn pink" id="again">🔄 Nueva partida</button></div>
      <p class="disclaimer">Para conocer las políticas oficiales y actualizadas visita el Centro de Transparencia de Meta: transparency.meta.com</p>`, { scores: false });
    sfx.fanfare();
    [0, 700, 1400].forEach(t => later(() => confetti(150, innerWidth * (.25 + Math.random() * .5), innerHeight * .3), t));
    $('#cx', root).onclick = () => openCodex(true);
    $('#home', root).onclick = () => go('title');
    $('#again', root).onclick = () => { S = fresh(S.teams); save(); go('setup'); };
  };

  /* ================= Arranque ================= */
  $('#brand').onclick = () => (started() ? go('map') : go('title'));
  $('#btn-sus').onclick = openSuspects;
  $('#btn-menu').onclick = openMenu;
  $('#btn-fs').onclick = toggleFS;
  $('#snd').onclick = () => { S.sound = !S.sound; save(); renderTop(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  renderScorebar();
  const resumable = ['title', 'setup', 'story', 'suspects', 'rules', 'map', 'mission', 'missionEnd', 'market', 'accuse', 'reveal', 'final'];
  const sc = S.screen && resumable.includes(S.screen.name) ? S.screen : { name: 'title', p: {} };
  go(sc.name, sc.p);
})();
