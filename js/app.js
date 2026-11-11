/* =========================================================
   EL CASO DEL CRISTAL ROBADO — Juego en red
   Rol "host"  = moderador: crea la sala y dirige el ritmo.
   Rol "team"  = cada equipo en su propia computadora.
   El host es la autoridad: escribe el estado público (st) y los puntajes.
   ========================================================= */
(() => {
  'use strict';

  /* ================= Utilidades ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = (a, seed) => {
    a = [...a]; let x = seed || 0;
    const rnd = () => (seed ? ((x = (x * 9301 + 49297) % 233280) / 233280) : Math.random());
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const suspect = id => SUSPECTS.find(s => s.id === id);
  /* Cada distrito recibe el minijuego que le tocó en el sorteo de esta partida */
  const district = id => {
    const b = DISTRICTS.find(d => d.id === id); if (!b) return null;
    const plan = { ...Content.DEFAULT_PLAN, ...((D.st || {}).plan || {}) }, g = Content.GAMES[plan[id]] ? plan[id] : Content.DEFAULT_PLAN[id];
    return { ...b, ...Content.GAMES[g], game: g, focus: POLICIES.filter(p => p.district === id).map(p => p.id) };
  };
  const seedOf = () => (D.st || {}).seed || 1;
  let profCache = null;
  const prof = () => { const sd = seedOf(); if (!profCache || profCache.seed !== sd) profCache = { seed: sd, p: Content.profile(sd) }; return profCache.p; };
  const policy = id => POLICIES.find(p => p.id === id);
  const polChips = ids => `<div class="pol-chips">${ids.map(policy).map(p => `<span class="pol-chip">${p.icon} ${p.en}</span>`).join('')}</div>`;
  const dchip = k => `<span class="dchip" style="--dc:${DECISIONS[k].color}">${DECISIONS[k].label}</span>`;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  /* Identidad del equipo: en modo prueba cada pestaña es un equipo distinto (sessionStorage) */
  const idStore = {
    get(k) { try { return JSON.parse((Net.mode === 'local' ? sessionStorage : localStorage).getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { (Net.mode === 'local' ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const later = (fn, ms) => { const h = setTimeout(fn, ms); timers.push({ stop: () => clearTimeout(h) }); };
  const focus = el => el && setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);

  /* ================= Sonido ================= */
  let AC = null, soundOn = store.get('nx-sound') !== false;
  function tone(f, d = .15, type = 'sine', v = .15, when = 0, f2 = null) {
    if (!soundOn) return;
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
    pop: (c = 1) => { const f = 520 * Math.pow(1.06, Math.min(12, c)); tone(f, .09, 'triangle', .12); tone(f * 1.5, .12, 'sine', .08, .05); },
    err: () => tone(150, .2, 'square', .08, 0, 90),
    good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, 'triangle', .12, i * .07)),
    bad: () => { tone(260, .25, 'sawtooth', .08, 0, 140); tone(180, .35, 'sawtooth', .08, .14, 90); },
    tick: () => tone(1300, .05, 'square', .04),
    alarm: () => [0, .22, .44].forEach(w => tone(880, .16, 'square', .07, w)),
    whoosh: () => tone(200, .45, 'sine', .08, 0, 1200),
    reveal: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .45, 'sine', .09, i * .08)),
    drum: () => tone(110, .18, 'triangle', .25, 0, 50),
    stamp: () => { tone(90, .22, 'square', .2, 0, 40); tone(60, .3, 'sine', .25, .02, 30); },
    fanfare: () => { const n = [523, 523, 523, 659, 784, 659, 784, 1047], d = [0, .14, .28, .42, .7, .9, 1.04, 1.25]; n.forEach((f, i) => tone(f, i === 7 ? .8 : .3, 'triangle', .13, d[i])); },
    thunder: () => { tone(60, 1.2, 'sawtooth', .06, 0, 30); tone(45, 1.5, 'sine', .1, .1, 25); },
  };

  /* ================= Lluvia noir de fondo ================= */
  (function rain() {
    const c = $('#sky'), ctx = c.getContext('2d');
    let W, H, drops = [];
    const init = () => {
      W = c.width = innerWidth; H = c.height = innerHeight;
      drops = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 10 + Math.random() * 22, v: 9 + Math.random() * 9 }));
    };
    init(); addEventListener('resize', init);
    let flash = 0, nextFlash = performance.now() + 9000 + Math.random() * 12000;
    (function frame(now) {
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(190,205,230,.22)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (const d of drops) {
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .25, d.y + d.l);
          d.y += d.v; d.x -= d.v * .25;
          if (d.y > H) { d.y = -30; d.x = Math.random() * (W + 200); }
        }
        ctx.stroke();
        if (now > nextFlash) { flash = 1; nextFlash = now + 12000 + Math.random() * 18000; }
        if (flash > 0) { ctx.fillStyle = `rgba(230,240,255,${flash * .18})`; ctx.fillRect(0, 0, W, H); flash -= .04; }
      }
      requestAnimationFrame(frame);
    })(performance.now());
  })();

  /* ================= Confeti (papelitos de cómic) ================= */
  const confetti = (() => {
    const c = $('#confetti'), ctx = c.getContext('2d');
    let parts = [], running = false;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const cols = ['#ffcf33', '#d7263d', '#f2e8d0', '#3a86ff', '#2ec4b6', '#ff5d8f'];
    function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      parts = parts.filter(p => p.life-- > 0 && p.y < c.height + 40);
      for (const p of parts) {
        p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(-p.s / 2, -p.s / 3, p.s, p.s / 1.5 * Math.abs(Math.sin(p.r * 2) + .2)); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, c.width, c.height); }
    }
    return (n = 140, x = innerWidth / 2, y = innerHeight / 3) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 11;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 7, g: .24, s: 9 + Math.random() * 9, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length], life: 220 + Math.random() * 80 });
      }
      if (!running) { running = true; requestAnimationFrame(tick); }
    };
  })();

  /* ================= Temporizadores ================= */
  let timers = [];
  const clearTimers = () => { timers.forEach(t => t.stop()); timers = []; };
  /* Reloj sincronizado: cuenta hacia endsAt (hora del servidor) */
  function clock(el, endsAt, total, { onEnd, size = 120 } = {}) {
    const R = 44, C = 2 * Math.PI * R;
    el.innerHTML = `<div class="timer" style="--ts:${size}px"><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="${R}"/><circle class="prog" cx="50" cy="50" r="${R}" stroke-dasharray="${C}"/></svg><div class="val"></div></div>`;
    const box = $('.timer', el), val = $('.val', el), prog = $('.prog', el);
    let done = false, lastS = null;
    const paint = () => {
      const left = Math.max(0, (endsAt - Net.now()) / 1000), s = Math.ceil(left);
      val.textContent = s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : s;
      prog.style.strokeDashoffset = C * (1 - Math.min(1, left / total));
      box.classList.toggle('danger', left <= 5 && left > 0);
      if (s !== lastS) { lastS = s; if (s <= 5 && s > 0) sfx.tick(); }
      if (left <= 0 && !done) { done = true; box.classList.add('done'); onEnd && onEnd(); }
    };
    paint();
    const iv = setInterval(paint, 250);
    timers.push({ stop: () => clearInterval(iv) });
  }

  /* ================= Interfaz común ================= */
  function toast(msg, ms = 2600) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
    $('#toast-root').appendChild(t); setTimeout(() => t.remove(), ms);
  }
  function modal(html, { small = false } = {}) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal panel ${small ? 'small' : ''}"><button class="x-btn" data-close>✕</button>${html}</div>`;
    root.classList.add('open');
    root.onclick = e => { if (e.target === root || e.target.closest('[data-close]')) closeModal(); };
    return root.firstElementChild;
  }
  const closeModal = () => { const r = $('#modal-root'); r.classList.remove('open'); r.innerHTML = ''; };
  function ask(msg, onYes, yesLabel = 'Sí, continuar') {
    const m = modal(`<h2 class="comic-h">${msg}</h2><div class="row center mt"><button class="btn ghost" data-close>Cancelar</button><button class="btn red" id="yes">${yesLabel}</button></div>`, { small: true });
    $('#yes', m).onclick = () => { closeModal(); onYes(); };
  }
  const caption = (t, cls = '') => `<div class="caption ${cls}">${t}</div>`;
  const burst = (t, color = '#ffcf33', cls = '') => `<div class="burst ${cls}" style="--bc:${color}"><span>${t}</span></div>`;
  const teamTag = (t, extra = '') => t ? `<span class="ttag" style="--tc:${t.color}"><i>${t.emoji}</i>${esc(t.name)}${extra}</span>` : '';
  const view = (html, { wide = false } = {}) => {
    const stage = $('#stage');
    stage.innerHTML = `<div class="screen ${wide ? 'wide' : ''}">${html}</div>`;
    stage.scrollTop = 0;
    return stage.firstElementChild;
  };
  const shake = () => { const s = $('#stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); };

  /* ================= Estado compartido ================= */
  const params = new URLSearchParams(location.search);
  let ROLE = null, CODE = null, R = null, D = {}, ME = null, H = null;
  let lastKey = null, refresh = null;
  const st = () => D.st || {};
  const teamsList = () => Object.entries(D.teams || {}).map(([id, t]) => ({ id, ...t })).sort((a, b) => (a.joined || 0) - (b.joined || 0));
  const team = id => (D.teams || {})[id] ? { id, ...D.teams[id] } : null;
  const score = id => (D.scores || {})[id] || 0;
  const myTeam = () => ME && team(ME);
  const unlocked = () => POLICIES.filter(p => (st().done || []).includes(p.district));
  /* Libreta: 'won' = ganada en una misión (real) · 'decoy' = señuelo falso sellado · 'bought' = comprada (¿real?) */
  const LUPAS = 2;
  const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  const entryOf = (k, v) => (typeof v === 'string' ? { key: k, text: v, kind: 'won', mid: k } : v && v.text ? { key: k, ...v } : null);
  const notebook = tid => Object.entries((D.private || {})[tid] || {}).map(([k, v]) => entryOf(k, v)).filter(Boolean).sort((a, b) => ({ won: 0, bought: 1, decoy: 2 }[a.kind] - { won: 0, bought: 1, decoy: 2 }[b.kind]) || (a.at || 0) - (b.at || 0));
  const myClues = () => notebook(ME);
  const lupasLeft = () => Math.max(0, LUPAS - ((D.lupas || {})[ME] || 0));
  const fakeSet = () => new Set(ROLE === 'host' && H ? Object.keys(H.refs || {}).filter(r => H.refs[r] === false) : (((D.st || {}).reveal || {}).fakes || []));
  const boardSig = () => `${myClues().length}|${myClues().map(c => c.check || '').join()}|${lupasLeft()}|${[...pendingVerify].join()}`;
  const pendingVerify = new Set();
  const badgesOf = id => Object.keys((D.badges || {})[id] || {});
  /* Ajustes de la partida (los fija el moderador en la sala de espera) */
  const TEMPOS = { 1.35: 'Tranquilo', 1: 'Normal', 0.8: 'Rápido' };
  const cfg = () => ({ tempo: 1, rotate: true, ...(st().cfg || {}) });
  /* Integrantes, capitán y rotación de quien está en los controles */
  const membersOf = id => { const m = ((D.teams || {})[id] || {}).members; return (Array.isArray(m) ? m : Object.values(m || {})).filter(Boolean); };
  const capOf = id => ((D.teams || {})[id] || {}).captain || null;
  const rotOf = id => ((D.teams || {})[id] || {}).rot || 0;
  const playerAt = (id, k = 0) => { const ms = membersOf(id); return ms.length ? ms[(rotOf(id) + k) % ms.length] : null; };
  const who = (name, id) => (name ? `${name === capOf(id) ? '⭐ ' : ''}${esc(name)}` : '');
  const rotating = id => cfg().rotate && membersOf(id).length > 1;
  const bumpRot = n => { if (ME && membersOf(ME).length) R.set(`teams/${ME}/rot`, rotOf(ME) + n); };

  /* ================= Barra superior y dock ================= */
  function renderTop() {
    const s = st();
    $('#room-badge').innerHTML = CODE ? `SALA <b>${CODE}</b>` : '';
    $('#role-badge').innerHTML = ROLE === 'host' ? `${icon('police-badge')} MODERADOR` : ROLE === 'team' && myTeam() ? teamTag(myTeam()) : '';
    $('#facets').innerHTML = CODE ? DISTRICTS.map(d => `<i class="${(s.done || []).includes(d.id) ? 'on' : ''}" style="--fc:${d.color}" title="${d.value}"></i>`).join('') : '';
    $('#btn-codex').innerHTML = `${icon('files')} Archivo <b>${unlocked().length}/${POLICIES.length}</b>`;
    $('#btn-codex').style.display = CODE ? '' : 'none';
    $('#btn-board').style.display = CODE ? '' : 'none';
    $('#btn-menu').style.display = ROLE === 'host' ? '' : 'none';
    $('#snd').innerHTML = soundOn ? '🔊' : '🔇';
  }
  function scoreStrip() {
    const ts = teamsList().sort((a, b) => score(b.id) - score(a.id));
    return ts.map((t, i) => `<span class="sc-chip ${t.id === ME ? 'me' : ''} ${(D.online || {})[t.id] ? '' : 'off'}" style="--tc:${t.color}"><b class="rk">${i + 1}</b><i>${t.emoji}</i><span class="nm">${esc(t.name)}</span><b>${score(t.id)}</b>❤</span>`).join('');
  }
  let dockHTML = '', bindDock = null;
  function renderDock() {
    const dock = $('#dock');
    if (!CODE) { dock.classList.add('hidden'); return; }
    dock.classList.remove('hidden');
    dock.innerHTML = `<div class="dock-scores">${scoreStrip()}</div>${ROLE === 'host' && dockHTML ? `<div class="dock-ctrl">${dockHTML}</div>` : ''}`;
    if (ROLE === 'host' && bindDock) bindDock(dock);
  }
  const hostCtrl = (html, bind) => { if (ROLE !== 'host') return; bindDock = bind; dockHTML = html; renderDock(); };

  /* ================= Archivo de políticas / tablero ================= */
  function polCard(p, locked, delay = 0) {
    const d = district(p.district);
    return `<div class="pol-card ${locked ? 'locked' : ''} ${p.sensitive ? 'sensitive' : ''}" style="--pc:${d.color};animation-delay:${delay}s">
      <div class="pi">${locked ? '🔒' : p.icon}</div><div class="pen">${p.en}</div>
      ${locked ? `<div class="pd">Se desbloquea en ${d.name}</div>` : `<div class="pd">${p.desc}</div>`}
      ${p.sensitive && !locked ? '<div class="psens">Protección especial</div>' : ''}</div>`;
  }
  function openCodex(all = false) {
    const done = st().done || [];
    const m = modal(`<div class="kicker">Normas Comunitarias de Meta</div><h2 class="comic-h">${icon('files')} Archivo de Políticas · ${unlocked().length}/${POLICIES.length}</h2>
      <p>Cada misión resuelta desbloquea las políticas de su distrito. Las de <b>protección especial</b> aparecen en el juego solo como descripción del caso, sin contenido explícito.</p>
      ${DISTRICTS.map(d => `<h3 class="dist-h" style="--dc:${d.color}">${d.name} · ${d.value}</h3>
        <div class="codex">${POLICIES.filter(p => p.district === d.id).map(p => polCard(p, !all && !done.includes(d.id))).join('')}</div>`).join('')}
      ${!all && ROLE === 'host' ? '<div class="row center mt"><button class="btn sm ghost" id="all">Mostrar todas (moderador)</button></div>' : ''}`);
    const a = $('#all', m); if (a) a.onclick = () => openCodex(true);
  }
  /* Tablero de evidencias: polaroids de sospechosos + pistas del equipo */
  const crossed = () => store.get(`nx-cross-${CODE}-${ME}`) || [];
  function polaroid(s, { cross = false, mini = false, silhouette = false, i = 0 } = {}) {
    const isX = cross && crossed().includes(s.id);
    return `<div class="polaroid ${mini ? 'mini' : ''} ${isX ? 'crossed' : ''}" data-sid="${s.id}" style="--rot:${[-3, 2, -1.5, 3, -2.5, 1.5][i % 6]}deg">
      <span class="pin"></span>${Art.avatar(s, { silhouette })}<div class="pname">${silhouette ? '¿?' : s.name}</div></div>`;
  }
  function dossier(s) {
    return `<div class="dossier"><div class="dtab">EXPEDIENTE</div><h4>${s.name}</h4><p class="drole">${s.title}</p>
      <dl><dt>Ropa</dt><dd>${cap(s.colorName)}</dd><dt>Accesorio</dt><dd>${cap(s.accessory)}</dd>
      <dt>Coartada (23:00)</dt><dd>Dice que estaba ${s.alibi}</dd><dt>Manía</dt><dd>${cap(s.habit)}</dd>
      <dt>Motivo</dt><dd>${s.motive}</dd><dt>Suele romper</dt><dd>${s.policies.map(id => policy(id).en).join(' · ')}</dd></dl></div>`;
  }
  function boardHTML() {
    const clues = ROLE === 'team' ? myClues() : [];
    return `<div class="cork">
      <div class="cork-suspects">${SUSPECTS.map((s, i) => `<div class="suspect-slot">${polaroid(s, { cross: ROLE === 'team', i })}${dossier(s)}</div>`).join('')}</div>
      ${ROLE === 'team' ? `<div class="cork-clues"><div class="note-title">${icon('notebook')} Libreta de pistas</div>
        ${clues.length ? clues.map((c, i) => noteHTML(c, i)).join('') : '<div class="clue-note empty">Aún no tienen pistas. ¡Ganen misiones!</div>'}
        ${clues.some(c => c.kind === 'bought') ? `<div class="lupa-left">🔎 Lupas disponibles: <b>${lupasLeft()}</b> de ${LUPAS}</div>` : ''}</div>` : ''}
    </div>`;
  }
  function noteHTML(c, i) {
    const rot = `--rot:${[-2, 1.5, -1, 2, -1.5][i % 5]}deg`;
    if (c.kind === 'decoy') return `<div class="clue-note decoy" style="${rot}"><span class="pin"></span><small>🎭 Señuelo · pista FALSA sellada</small><i>Contenido sellado. Véndanla para despistar a otros equipos.</i></div>`;
    const truth = c.check === 'real' ? '<span class="truth ok">VERDADERA</span>' : c.check === 'fake' ? '<span class="truth no">FALSA</span>' : '';
    const canCheck = c.kind === 'bought' && !c.check && ['market', 'accuse'].includes(st().scene);
    const btn = canCheck ? (pendingVerify.has(c.key) ? '<button class="lupa-btn" disabled>Verificando…</button>' : lupasLeft() > 0 ? `<button class="lupa-btn" data-verify="${c.key}">🔎 Verificar con la lupa</button>` : '<span class="small">Sin lupas</span>') : '';
    const where = c.kind === 'won' ? `✅ Ganada en ${district(c.mid) ? district(c.mid).name : '—'}` : `🛒 Comprada a ${team(c.from) ? esc(team(c.from).name) : 'otro equipo'}${c.check ? '' : ' · ¿será verdadera?'}`;
    return `<div class="clue-note ${c.kind} ${c.check || ''}" style="${rot}"><span class="pin"></span><small>${where}</small>${c.text}${truth}${btn}</div>`;
  }
  function bindBoard(root) {
    $$('[data-verify]', root).forEach(b => (b.onclick = e => {
      e.stopPropagation();
      if (lupasLeft() <= 0) return toast('Ya usaron sus lupas');
      pendingVerify.add(b.dataset.verify); R.push('in', { k: 'verify', by: ME, key: b.dataset.verify });
      b.disabled = true; b.textContent = 'Verificando…'; sfx.whoosh();
    }));
    $$('.polaroid[data-sid]', root).forEach(p => (p.onclick = () => {
      if (ROLE !== 'team' || p.closest('.acc')) return;
      const id = p.dataset.sid, c = crossed();
      store.set(`nx-cross-${CODE}-${ME}`, c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
      p.classList.toggle('crossed'); sfx.stamp();
    }));
  }
  let modalBoardSig = null;
  function openBoard() {
    modalBoardSig = boardSig();
    const m = modal(`<div class="kicker">${ROLE === 'team' ? 'Toquen una foto para tacharla' : 'Sospechosos'}</div><h2 class="comic-h">${icon('magnifying-glass')} Tablero de evidencias</h2>${boardHTML()}`);
    bindBoard(m);
  }

  /* ================= Escenas ================= */
  const SC = {};
  function sceneKey() {
    const s = st(), m = s.m || {};
    return [s.scene, s.i, m.id, m.phase, m.round, m.step, m.sub, m.caseId, s.clue && s.clue.mission, s.reveal && s.reveal.culprit, ROLE].join('|');
  }
  function sync() {
    renderTop();
    if (!CODE) return;
    const key = sceneKey();
    if (key !== lastKey) {
      lastKey = key; clearTimers(); refresh = null; bindDock = null; dockHTML = '';
      (SC[st().scene] || SC.lobby)();
    } else if (refresh) refresh();
    if (ROLE === 'team') {
      myClues().forEach(c => { if (c.check) pendingVerify.delete(c.key); });
      if (modalBoardSig !== null && $('#modal-root.open .cork')) { if (boardSig() !== modalBoardSig) { const sc = $('.modal').scrollTop; openBoard(); $('.modal').scrollTop = sc; } } else modalBoardSig = null;
    }
    renderDock();
    if (ROLE === 'host') hostWatch();
  }

  /* ---------------- PORTADA ---------------- */
  function home() {
    ROLE = null; CODE = null;
    renderTop(); $('#dock').classList.add('hidden');
    const saved = store.get('nx-host');
    const root = view(`
      <div class="cover">
        <div class="tape t1">ESCENA DEL CRIMEN · NO PASAR · ESCENA DEL CRIMEN · NO PASAR · ESCENA DEL CRIMEN · NO PASAR ·</div>
        <div class="cover-issue">N.º 1 · NEXÓPOLIS · 23:00 H</div>
        <div class="cover-crystal">${Art.crystal([], 200, { cracked: true })}</div>
        <h1 class="cover-title"><span>El caso del</span>Cristal Robado</h1>
        ${caption('Un misterio por equipos sobre las Normas Comunitarias de Meta. Cada equipo juega desde su propia computadora.')}
        <div class="cover-suspects">${SUSPECTS.map((s, i) => polaroid(s, { silhouette: true, mini: true, i })).join('')}</div>
        <div class="cover-actions">
          <div class="panel act">
            <h3>${icon('police-badge')} Soy el moderador</h3><p>Creo la sala, dirijo la partida y reparto las pistas.</p>
            <button class="btn red big" id="host">Crear sala</button>
            ${saved && saved.code ? `<button class="btn ghost sm mt-s" id="resume">Volver a la sala ${saved.code}</button>` : ''}
          </div>
          <div class="panel act">
            <h3>${icon('three-friends')} Somos un equipo</h3><p>Escriban el código que les dio el moderador.</p>
            <div class="row"><input class="code-in" id="code" maxlength="4" placeholder="ABCD" autocomplete="off"><button class="btn big" id="join">Unirse</button></div>
          </div>
        </div>
        ${Net.mode === 'local' ? `<div class="mode-note">${icon('hazard-sign')} <b>Modo prueba:</b> Firebase no está configurado, así que la sala solo funciona entre pestañas de esta computadora (ideal para ensayar). Para jugar desde varias computadoras, configura Firebase (ver README).</div>` : ''}
        <p class="disclaimer">Juego educativo de ficción. Para las políticas oficiales consulta el Centro de Transparencia de Meta (transparency.meta.com). Íconos: game-icons.net (CC BY 3.0).</p>
      </div>`, { wide: true });
    $('#host', root).onclick = createRoom;
    const rs = $('#resume', root); if (rs) rs.onclick = () => enterHost(saved.code);
    const codeIn = $('#code', root);
    codeIn.oninput = () => { codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z]/g, ''); };
    const join = async () => {
      const c = codeIn.value.trim().toUpperCase();
      if (c.length !== 4) return toast('El código tiene 4 letras');
      if (!(await Net.roomExists(c))) return toast('No encontramos esa sala');
      location.search = `?sala=${c}`;
    };
    $('#join', root).onclick = join;
    codeIn.onkeydown = e => { if (e.key === 'Enter') join(); };
  }

  /* ---------------- CREAR SALA (host) ---------------- */
  async function createRoom() {
    let code = Net.makeCode(), tries = 0;
    while (await Net.roomExists(code) && tries++ < 10) code = Net.makeCode();
    const ids = shuffle(SUSPECTS.map(s => s.id));
    const types = shuffle(['accessory', 'alibi', 'habit', 'color', shuffle(['accessory', 'alibi', 'habit', 'color'])[0]]);
    H = { code, culprit: ids[0], clues: ids.slice(1).map((sid, i) => ({ sid, type: types[i], mission: null })), mpts: {}, awarded: {}, council: {}, councilPlayed: {}, created: Date.now() };
    store.set('nx-host', H);
    const room = Net.room(code);
    await room.set('meta', { created: Net.now(), v: 2 });
    const seed = 1 + Math.floor(Math.random() * 2e9);
    await room.set('st', { scene: 'lobby', done: [], seed, plan: Content.plan() });
    enterHost(code);
  }
  function enterHost(code) {
    H = store.get('nx-host');
    if (!H || H.code !== code) return home();
    ROLE = 'host'; CODE = code; R = Net.room(code);
    history.replaceState(null, '', location.pathname + `?moderador=${code}`);
    R.on('', tree => { D = tree || {}; sync(); });
    R.onAdded('in', (k, ev) => { hostEvent(ev); R.remove(`in/${k}`); });
  }
  const saveH = () => store.set('nx-host', H);

  /* ---------------- UNIRSE (equipo) ---------------- */
  const EMOJIS = ['🕵️', '🦊', '🐙', '🦉', '🐺', '🦄', '🐸', '🐼', '🦁', '🐝', '🤖', '👾'];
  const COLORS = ['#ffcf33', '#d7263d', '#3a86ff', '#2ec4b6', '#ff5d8f', '#9b5de5', '#ff8c42', '#7bd389'];
  function enterTeam(code) {
    ROLE = 'team'; CODE = code; R = Net.room(code);
    ME = idStore.get(`nx-team-${code}`);
    let present = false;
    R.on('', tree => {
      D = tree || {};
      if (!ME || !(D.teams || {})[ME]) { if (!$('#join-form')) { lastKey = null; clearTimers(); joinForm(); } renderTop(); return; }
      if (!present) { present = true; R.presence(`online/${ME}`); }
      sync();
    });
  }
  function joinForm() {
    let emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)], color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const root = view(`
      <div class="join" id="join-form">
        <div class="kicker">Sala ${CODE}</div>
        <h1 class="comic-title">Registren a su equipo</h1>
        <div class="panel join-card">
          <label>Nombre del equipo</label>
          <input id="tname" maxlength="20" placeholder="Los Sabuesos" autocomplete="off">
          <label>Capitán o capitana ⭐</label>
          <input id="tcap" maxlength="18" placeholder="Quien lidera al equipo" autocomplete="off">
          <label>Demás integrantes <small>(separados por comas)</small></label>
          <input id="tmem" maxlength="140" placeholder="Ana, Luis, Sofi" autocomplete="off">
          <p class="small" style="margin:0">El juego irá pidiendo que roten en los controles, empezando por el capitán.</p>
          <label>Insignia</label>
          <div class="emoji-pick">${EMOJIS.map(e => `<button class="${e === emoji ? 'sel' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
          <label>Color</label>
          <div class="color-pick">${COLORS.map(c => `<button style="background:${c}" class="${c === color ? 'sel' : ''}" data-c="${c}"></button>`).join('')}</div>
          <button class="btn red big mt" id="go">¡Entrar al caso!</button>
        </div>
      </div>`);
    $$('[data-e]', root).forEach(b => (b.onclick = () => { emoji = b.dataset.e; $$('[data-e]', root).forEach(x => x.classList.toggle('sel', x === b)); sfx.click(); }));
    $$('[data-c]', root).forEach(b => (b.onclick = () => { color = b.dataset.c; $$('[data-c]', root).forEach(x => x.classList.toggle('sel', x === b)); sfx.click(); }));
    const go = async () => {
      const name = $('#tname', root).value.trim();
      if (!name) return toast('Escriban un nombre');
      if (teamsList().some(t => t.name.toLowerCase() === name.toLowerCase())) return toast('Ese nombre ya está en uso');
      const clean = v => v.replace(/[<>]/g, '').trim().slice(0, 18);
      const captain = clean($('#tcap', root).value);
      const members = [...new Set([captain, ...$('#tmem', root).value.split(/[,;\n]/).map(clean)].filter(Boolean))].slice(0, 8);
      ME = 't' + Math.random().toString(36).slice(2, 8);
      idStore.set(`nx-team-${CODE}`, ME);
      await R.set(`teams/${ME}`, { name, emoji, color, joined: Net.now(), captain: captain || null, members, rot: 0 });
      sfx.reveal();
    };
    $('#go', root).onclick = go;
    ['#tname', '#tcap', '#tmem'].forEach(q => ($(q, root).onkeydown = e => { if (e.key === 'Enter') go(); }));
    $('#tname', root).focus();
  }

  /* ---------------- LOBBY ---------------- */
  SC.lobby = () => {
    const url = `${location.origin}${location.pathname}?sala=${CODE}`;
    if (ROLE === 'host') {
      let qr = '';
      try { const q = qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch (e) { /* sin QR */ }
      const root = view(`
        <div class="lobby">
          <div class="panel lobby-code">
            <div class="kicker">Código de la sala</div>
            <div class="big-code">${CODE.split('').map(c => `<span>${c}</span>`).join('')}</div>
            <div class="qr">${qr}</div>
            <p class="small">Cada equipo abre este enlace en su computadora:</p>
            <div class="link-box"><code>${esc(url)}</code><button class="btn sm" id="copy">Copiar</button></div>
            ${Net.mode === 'local' ? '<p class="small warn">Modo prueba: abre el enlace en otras pestañas de este mismo navegador.</p>' : ''}
          </div>
          <div class="col">
            <h1 class="comic-title">Sala de espera</h1>
            ${caption('Esperando a los equipos... Con 2 o más pueden empezar. Recomendado: de 3 a 6 equipos.')}
            <div class="lobby-teams" id="lt"></div>
            <div class="panel settings" id="settings"></div>
          </div>
        </div>`, { wide: true });
      $('#copy', root).onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch (e) { toast('Copia el enlace a mano'); } };
      const paint = () => {
        const ts = teamsList();
        $('#lt', root).innerHTML = ts.length ? ts.map((t, i) => `<div class="lobby-team" style="--tc:${t.color};animation-delay:${i * .05}s"><i>${t.emoji}</i><div class="lt-info"><b>${esc(t.name)}</b><small>${capOf(t.id) ? `⭐ ${esc(capOf(t.id))} · ` : ''}${membersOf(t.id).length || '?'} integrante(s)</small></div><span class="${(D.online || {})[t.id] ? 'on' : 'off'}">${(D.online || {})[t.id] ? 'conectado' : 'desconectado'}</span><button class="mini-x" data-rm="${t.id}" title="Quitar">✕</button></div>`).join('') : '<div class="empty-note">Todavía no se ha unido nadie.</div>';
        const c = cfg();
        $('#settings', root).innerHTML = `<h3 class="comic-h">${icon('stopwatch')} Ajustes de la partida</h3>
          <div class="set-row"><span>Ritmo de los minijuegos</span><div class="seg">${Object.entries(TEMPOS).sort((a, b) => b[0] - a[0]).map(([v, l]) => `<button class="${+v === c.tempo ? 'sel' : ''}" data-tempo="${v}">${l}</button>`).join('')}</div></div>
          <div class="set-row"><span>Rotación de integrantes en los controles</span><div class="seg"><button class="${c.rotate ? 'sel' : ''}" data-rot="1">Sí</button><button class="${c.rotate ? '' : 'sel'}" data-rot="0">No</button></div></div>
          <div class="set-row"><span>Minijuegos de esta partida</span><button class="btn sm" id="reroll">🎲 Sortear otros</button></div>
          <div class="plan-list">${DISTRICTS.map(x => { const dd = district(x.id); return `<span class="plan-chip" style="--dc:${x.color}">${icon(dd.gi)}<b>${dd.mission}</b><small>${x.name}</small></span>`; }).join('')}</div>
          <p class="small" style="margin:6px 0 0"><b>Tranquilo</b> da más tiempo para leer y buscar. Con <b>rotación</b>, el juego pide cambiar de persona a mitad de cada misión y mide a cada integrante.</p>`;
        $$('[data-tempo]', root).forEach(b => (b.onclick = () => pub({ cfg: { ...cfg(), tempo: +b.dataset.tempo } })));
        $$('[data-rot]', root).forEach(b => (b.onclick = () => pub({ cfg: { ...cfg(), rotate: b.dataset.rot === '1' } })));
        $('#reroll', root).onclick = () => { let pl; do { pl = Content.plan(); } while (JSON.stringify(pl) === JSON.stringify(st().plan)); sfx.whoosh(); pub({ plan: pl, seed: 1 + Math.floor(Math.random() * 2e9) }); };
        $$('[data-rm]', root).forEach(b => (b.onclick = () => ask(`¿Quitar a ${esc(team(b.dataset.rm).name)}?`, () => { R.remove(`teams/${b.dataset.rm}`); R.remove(`scores/${b.dataset.rm}`); }, 'Quitar')));
        hostCtrl(`<span class="ctrl-label">${ts.length} equipos</span><button class="btn red" id="h-start" ${ts.length < 2 ? 'disabled' : ''}>Empezar la historia ▶</button>`,
          dock => { $('#h-start', dock).onclick = () => pub({ scene: 'story', i: 0 }); });
      };
      paint(); refresh = paint;
    } else {
      const root = view(`
        <div class="waiting">
          <div class="big-badge" style="--tc:${myTeam().color}">${myTeam().emoji}</div>
          <h1 class="comic-title">¡${esc(myTeam().name)} está dentro!</h1>
          ${caption('Esperen a que el moderador empiece el caso. Mientras tanto... miren quién más llegó.')}
          <div class="lobby-teams" id="lt"></div>
        </div>`);
      const paint = () => { $('#lt', root).innerHTML = teamsList().map(t => `<div class="lobby-team" style="--tc:${t.color}"><i>${t.emoji}</i><div class="lt-info"><b>${esc(t.name)}</b><small>${capOf(t.id) ? `⭐ ${esc(capOf(t.id))}` : ''}</small></div></div>`).join(''); };
      paint(); refresh = paint;
    }
  };

  /* ---------------- HISTORIA (página de cómic) ---------------- */
  const skyline = () => `<svg class="skyline" viewBox="0 0 1200 300" preserveAspectRatio="none">
    <circle cx="980" cy="70" r="46" fill="#f2e8d0" opacity=".9"/>
    <path d="M0 300 V190 h60 v-60 h40 v-40 h50 v100 h40 v-130 h70 v170 h30 v-90 h60 v-50 h30 v140 h50 v-180 h20 v-30 h20 v30 h20 v180 h60 v-110 h80 v80 h40 v-150 h70 v150 h50 v-70 h60 v-40 h50 v120 h40 v-90 h70 v130 h50 V300Z" fill="#0b0d14" stroke="#000" stroke-width="3"/>
    ${Array.from({ length: 60 }, (_, i) => `<rect x="${(i * 97) % 1180 + 10}" y="${200 + (i * 53) % 80}" width="8" height="10" fill="#ffcf33" opacity="${.3 + (i % 5) * .14}"/>`).join('')}
  </svg>`;
  const SCENES = [
    { cap: '<b>Nexópolis, 22:45.</b> La ciudad flotante donde viven millones de conversaciones. Cinco distritos la mantienen unida.',
      art: () => `<div class="page"><div class="pnl wide night">${skyline()}${burst('NEXÓPOLIS', '#ffcf33', 'title-burst')}</div>
        <div class="pnl-row">${DISTRICTS.map((d, k) => `<div class="pnl dist" style="--dc:${d.color};animation-delay:${.3 + k * .15}s">${icon(d.ico)}<b>${d.name}</b></div>`).join('')}</div></div>` },
    { cap: 'En el Museo central brillaba el <b>Cristal de la Confianza</b>. Sus cinco caras protegían a la comunidad.',
      art: () => `<div class="page"><div class="pnl wide spot"><div class="pedestal">${Art.crystal([], 230, { all: true })}</div>
        ${DISTRICTS.map((d, k) => `<div class="balloon b${k}" style="--dc:${d.color};animation-delay:${.4 + k * .2}s">${d.value}</div>`).join('')}</div></div>` },
    { cap: 'Pero a las 23:00 en punto... <b>¡alguien robó el Cristal!</b>', fx: 'heist',
      art: () => `<div class="page heist"><div class="pnl-row three">
        <div class="pnl night p1">${icon('clock-tower')}<div class="tag-time">23:00</div></div>
        <div class="pnl red p2">${icon('hooded-figure')}${burst('¡CRASH!', '#ffcf33')}</div>
        <div class="pnl p3">${icon('shattered-glass')}<div class="shards">${DISTRICTS.map((d, k) => { const a = k / 5 * Math.PI * 2 - Math.PI / 2; return `<span style="background:${d.color};--x:${Math.cos(a) * 130}px;--y:${Math.sin(a) * 100}px"></span>`; }).join('')}</div></div>
      </div></div>` },
    { cap: 'La policía detuvo a <b>6 sospechosos</b>. Los 5 fragmentos cayeron en los distritos. Solo uno de ellos es culpable.',
      art: () => `<div class="page"><div class="pnl wide lineup-pnl"><div class="height-lines"></div>${SUSPECTS.map((s, i) => `<div class="lu" style="animation-delay:${.2 + i * .18}s">${Art.avatar(s, { silhouette: true })}<span>?</span></div>`).join('')}</div></div>` },
    { cap: 'Ustedes son la <b>Liga de Guardianes</b>. Recuperen los fragmentos, ganen pistas secretas... y atrapen al culpable.',
      art: () => `<div class="page"><div class="pnl wide night guardians"><div class="badge-big">${icon('police-badge')}</div>
        <div class="g-teams">${teamsList().map((t, k) => `<span class="g-team" style="--tc:${t.color};animation-delay:${.3 + k * .15}s"><i>${t.emoji}</i>${esc(t.name)}</span>`).join('')}</div></div></div>` },
  ];
  SC.story = () => {
    const i = Math.min(st().i || 0, SCENES.length - 1), sc = SCENES[i];
    view(`<div class="scene ${sc.fx || ''}">${sc.art()}${caption(sc.cap, 'scene-cap')}
      <div class="dots">${SCENES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      ${ROLE === 'team' ? '<p class="small center muted">El moderador avanza la historia</p>' : ''}</div>`, { wide: true });
    sfx.whoosh();
    if (sc.fx === 'heist') { later(sfx.tick, 300); later(sfx.tick, 800); later(() => { sfx.stamp(); sfx.thunder(); shake(); }, 1500); later(sfx.alarm, 2300); }
    hostCtrl(`<button class="btn ghost" id="h-prev">◀</button><span class="ctrl-label">Historia ${i + 1}/${SCENES.length}</span><button class="btn red" id="h-next">${i < SCENES.length - 1 ? 'Siguiente ▶' : 'Ver sospechosos ▶'}</button>`, dock => {
      $('#h-prev', dock).onclick = () => (i > 0 ? pub({ i: i - 1 }) : pub({ scene: 'lobby' }));
      $('#h-next', dock).onclick = () => (i < SCENES.length - 1 ? pub({ i: i + 1 }) : pub({ scene: 'suspects' }));
    });
  };

  /* ---------------- SOSPECHOSOS ---------------- */
  SC.suspects = () => {
    const root = view(`<h1 class="comic-title center">Seis sospechosos. <span class="red-ink">Un culpable.</span></h1>
      ${caption('Todos estaban en Nexópolis a las 23:00. Lean bien cada expediente: cada detalle puede ser una pista.')}
      <div class="mt">${boardHTML()}</div>`, { wide: true });
    bindBoard(root);
    hostCtrl(`<span class="ctrl-label">Sospechosos</span><button class="btn red" id="h-next">Cómo se juega ▶</button>`, dock => { $('#h-next', dock).onclick = () => pub({ scene: 'rules' }); });
  };

  /* ---------------- REGLAS ---------------- */
  SC.rules = () => {
    view(`<h1 class="comic-title center">Cómo se resuelve el caso</h1>
      <div class="rules3">
        <div class="pnl rule"><div class="num">1</div>${icon('stopwatch')}<h3>Jueguen las misiones</h3><p>En cada distrito hay un minijuego. <b>Todos los equipos juegan a la vez</b>, cada uno en su computadora.</p></div>
        <div class="pnl rule"><div class="num">2</div>${icon('love-letter')}<h3>Ganen pistas secretas</h3><p>El mejor equipo de cada misión recibe una <b>pista privada</b> en su pantalla. Queda en su libreta.</p></div>
        <div class="pnl rule"><div class="num">3</div>${icon('handcuffs')}<h3>Atrapen al culpable</h3><p>En el <b>Mercado de Pistas</b> se venden sobres con pistas... y hay <b>señuelos falsos</b>. Usen la lupa y la lógica. Acusar bien da <b>+500 ❤</b>.</p></div>
      </div>
      ${caption('Consejo de detective: usen el botón «Tablero» (arriba) para tachar sospechosos y ver sus pistas en cualquier momento.')}`, { wide: true });
    hostCtrl(`<span class="ctrl-label">Reglas</span><button class="btn red" id="h-next">Al mapa de la ciudad ▶</button>`, dock => { $('#h-next', dock).onclick = () => pub({ scene: 'map' }); });
  };

  /* ---------------- MAPA ---------------- */
  const MAP = { plaza: [280, 210], puerto: [960, 200], isla: [230, 560], torre: [950, 560], nebulosa: [600, 620] };
  function mapSVG(done) {
    const streets = [];
    for (let x = 60; x < 1200; x += 110) streets.push(`<path d="M${x} 0 L${x + 40} 760"/>`);
    for (let y = 60; y < 760; y += 95) streets.push(`<path d="M0 ${y} L1200 ${y + 20}"/>`);
    const crystalInner = Art.crystal(done, 200, { cracked: done.length < 5 }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return `<svg class="map-svg" viewBox="0 0 1200 760">
      <defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#111" stroke-width="2" opacity=".18"/></pattern></defs>
      <rect width="1200" height="760" fill="url(#hatch)"/>
      <g class="streets">${streets.join('')}</g>
      <path class="river" d="M-20 420 C200 360 350 480 520 430 S820 300 1000 380 S1180 520 1240 470"/>
      <g class="route-lines">${DISTRICTS.map(d => { const [x, y] = MAP[d.id]; return `<path class="route ${done.includes(d.id) ? 'done' : ''}" d="M600 360 Q ${(600 + x) / 2} ${(360 + y) / 2 - 80} ${x} ${y}"/>`; }).join('')}</g>
      <g class="museum" transform="translate(600 360)"><circle r="80" fill="#f2e8d0" stroke="#111" stroke-width="6"/><svg x="-62" y="-66" width="124" height="130" viewBox="0 0 200 210">${crystalInner}</svg>
        <g transform="translate(0 108)"><rect x="-100" y="-20" width="200" height="34" fill="#111"/><text y="5" text-anchor="middle" class="m-label" fill="#f2e8d0">MUSEO DEL CRISTAL</text></g></g>
      ${DISTRICTS.map((d, k) => { const [x, y] = MAP[d.id]; const ok = done.includes(d.id); return `
        <g class="dist ${ok ? 'done' : ''} ${ROLE === 'host' ? 'clickable' : ''}" data-id="${d.id}" transform="translate(${x} ${y})">
          <g class="dist-inner">
          <circle r="74" fill="${d.color}" stroke="#111" stroke-width="7"/>
          <circle r="74" fill="url(#hatch)"/>
          <svg x="-46" y="-50" width="92" height="92" viewBox="0 0 512 512" style="color:#111">${ICONS[d.ico]}</svg>
          <g transform="translate(0 106) rotate(${k % 2 ? 2 : -2})"><rect x="-130" y="-28" width="260" height="66" fill="#f2e8d0" stroke="#111" stroke-width="4"/>
            <text y="2" text-anchor="middle" class="d-name">${k + 1}. ${d.name}</text><text y="28" text-anchor="middle" class="d-mis">${district(d.id).mission}</text></g>
          ${ok ? `<g transform="translate(40 -62) rotate(-14)"><rect x="-74" y="-22" width="148" height="42" fill="#f2e8d0" stroke="#d7263d" stroke-width="5"/><text text-anchor="middle" y="11" class="solved-t">RESUELTO</text></g>` : ''}
          <circle cx="0" cy="-74" r="11" fill="#d7263d" stroke="#111" stroke-width="3"/>
          </g>
        </g>`; }).join('')}
      <g transform="translate(40 30) rotate(-3)"><rect width="340" height="66" fill="#111"/><text x="170" y="45" text-anchor="middle" class="map-title">NEXÓPOLIS · PLANO</text></g>
    </svg>`;
  }
  SC.map = () => {
    const s = st(), done = s.done || [];
    const allDone = done.length === DISTRICTS.length;
    const root = view(`<div class="map-wrap paper">${mapSVG(done)}</div>
      ${caption(ROLE === 'host' ? (allDone ? '¡Los 5 fragmentos están recuperados! Es hora del Mercado de Pistas.' : 'Moderador: toque un distrito para lanzar su misión.') : (allDone ? '¡Cristal completo! Esperen al moderador...' : 'El moderador elegirá el próximo distrito...'))}`, { wide: true });
    if (ROLE === 'host') {
      $$('.dist', root).forEach(g => (g.onclick = () => {
        const d = district(g.dataset.id);
        const launch = () => { sfx.whoosh(); pub({ scene: 'mission', m: { id: d.id, phase: 'intro', round: Date.now() } }); };
        done.includes(d.id) ? ask(`"${d.mission}" ya está resuelta. ¿Jugarla otra vez? (No da otra pista)`, launch, 'Jugar otra vez') : launch();
      }));
      hostCtrl(allDone ? `<button class="btn ghost" id="h-acc">Saltar a la acusación</button><button class="btn red" id="h-mk">Ir al Mercado de Pistas ▶</button>` : `<span class="ctrl-label">Elijan un distrito en el mapa</span>`, dock => {
        const b = $('#h-mk', dock); if (b) b.onclick = () => pub({ scene: 'market', endsAt: Net.now() + MARKET_SECS * 1000 });
        const a = $('#h-acc', dock); if (a) a.onclick = () => pub({ scene: 'accuse' });
      });
    }
  };

  /* ---------------- MISIÓN: cabecera e intro ---------------- */
  const mhead = d => `<div class="mhead" style="--dc:${d.color}"><div class="mbadge">${icon(d.gi)}</div><div><div class="mmeta"><span class="mval">${d.value}</span>${d.name} · ${d.app}</div><h1 class="comic-title">${d.mission}</h1></div></div>`;
  function controlsHTML(type) {
    const two = `<div class="ctrl-row">${Object.keys(DECISIONS).map(k => `<div class="ctrl" style="--dc:${DECISIONS[k].color}"><span class="kc big">${DECISIONS[k].key}</span><b>${DECISIONS[k].label}</b></div>`).join('')}</div>`;
    if (type === 'two') return `${two}<p class="small center">Flechas del teclado o botones en pantalla</p>`;
    if (type === 'duel') return `<div class="ctrl-row"><div class="ctrl" style="--dc:${DECISIONS.delete.color}"><span class="kc big">←</span><b>La de la izquierda es DELETE</b></div><div class="ctrl" style="--dc:${DECISIONS.delete.color}"><span class="kc big">→</span><b>La de la derecha es DELETE</b></div></div>`;
    if (type === 'belt') return `<div class="ctrl-row"><div class="ctrl" style="--dc:${DECISIONS.delete.color}"><span class="kc big">␣</span><b>DELETE (espacio o clic)</b></div><div class="ctrl" style="--dc:${DECISIONS.noaction.color}"><span class="kc big">→</span><b>NO ACTION = dejarla pasar</b></div></div>`;
    if (type === 'sort') return `<div class="ctrl-row"><div class="ctrl" style="--dc:#ffcf33"><span class="kc big">1–4</span><b>Cajón de la política (o NO ACTION)</b></div></div>`;
    if (type === 'write') return `<div class="ctrl-row"><div class="ctrl" style="--dc:#ffcf33"><span class="kc big">✍</span><b>Escribir y votar</b></div></div>`;
    return `<div class="ctrl-row"><div class="ctrl" style="--dc:#2ec4b6"><span class="kc big">🖱</span><b>Clic en pantalla</b></div></div>`;
  }
  SC.mission = () => {
    const m = st().m || {}, d = district(m.id);
    if (!d) return;
    const phase = m.phase || 'intro';
    if (phase === 'intro') return missionIntro(d);
    if (d.kind === 'council') return council(d, m);
    if (phase === 'play') return arcadePlay(d, m);
    if (phase === 'results') return arcadeResults(d, m);
    if (phase === 'vault') return vault(d, m);
    if (phase === 'vaultdone') return vaultDone(d, m);
    if (phase === 'chain') return chainStep(d, m);
    if (phase === 'chainreveal') return chainReveal(d, m);
  };
  function missionIntro(d) {
    const c = cfg(), isArcade = d.kind !== 'council';
    const shifts = isArcade && c.rotate ? (d.shifts || 2) : 1;
    const secs = Math.round((d.seconds || 0) * c.tempo);
    let turn = '';
    if (ROLE === 'team' && membersOf(ME).length) {
      const order = Array.from({ length: rotating(ME) ? shifts : 1 }, (_, k) => who(playerAt(ME, k), ME));
      turn = isArcade
        ? `<div class="turn-box">${icon('three-friends')}<div><small>EN LOS CONTROLES${order.length > 1 ? ' (EN ESTE ORDEN)' : ''}</small><b>${order.join(' <i>→</i> ')}</b></div></div>`
        : `<div class="turn-box">${icon('notebook')}<div><small>ESCRIBE EN EL PRIMER CASO</small><b>${who(playerAt(ME), ME)}</b></div></div>`;
    }
    const hostInfo = ROLE === 'host' && isArcade
      ? `<p class="ready-note">${secs} segundos de juego · ritmo ${TEMPOS[c.tempo] || 'Normal'}${shifts > 1 ? ` · ${shifts} turnos por equipo (cambio de integrante cada ${Math.round(secs / shifts)} s)` : ''}</p>` : '';
    view(`${mhead(d)}
      <div class="intro">
        <div class="pnl intro-art" style="--dc:${d.color}">${icon(d.gi)}${burst(d.value, d.color)}</div>
        <div class="col">
          ${caption(d.tagline)}
          <div class="steps">${d.steps.map(([ic, t], i) => `<div class="step" style="animation-delay:${.15 + i * .15}s"><div class="sn">${i + 1}</div>${icon(ic)}<b>${t}</b></div>`).join('')}</div>
          ${controlsHTML(d.controls)}
          ${turn}${hostInfo}
          ${ROLE === 'team' ? `<p class="ready-note">${d.kind === 'council' ? 'Esperen a que el moderador elija el caso.' : '¡Prepárense! Todos los equipos juegan al mismo tiempo cuando el moderador dé la señal.'}</p>` : ''}
        </div>
      </div>`, { wide: true });
    hostCtrl(`<button class="btn ghost" id="h-back">◀ Mapa</button><span class="ctrl-label">${d.mission}</span><button class="btn red" id="h-go">${d.kind === 'council' ? 'Elegir caso ▶' : '¡Empezar! (todos a la vez) ▶'}</button>`, dock => {
      $('#h-back', dock).onclick = () => pub({ scene: 'map', m: null });
      $('#h-go', dock).onclick = () => {
        if (d.kind === 'council') return pub({ m: { ...st().m, phase: 'pick' } });
        pub({ m: { ...st().m, phase: 'play', startAt: Net.now() + 5500, seconds: secs, tempo: c.tempo, swaps: shifts - 1, pause: 4 } });
      };
    });
  }

  /* ---------------- ARCADE SIMULTÁNEO (con rotación de integrantes) ---------------- */
  const MYLOG = {};
  const roundKey = m => `${m.id}-${m.round}`;
  const resOf = key => (D.res || {})[key] || {};
  /* La ronda se divide en turnos iguales, con una pausa de "¡CAMBIO!" entre ellos.
     Todo se calcula desde startAt (hora del servidor), así todos los equipos van a la par. */
  const wallEnd = m => m.startAt + (m.seconds + (m.swaps || 0) * (m.pause || 0)) * 1000;
  function roundClock(m) {
    const now = Net.now(), sw = m.swaps || 0, P = m.pause || 0, L = m.seconds / (sw + 1);
    if (now < m.startAt) return { phase: 'pre', pre: (m.startAt - now) / 1000 };
    const w = (now - m.startAt) / 1000, k = Math.floor(w / (L + P)), r = w - k * (L + P);
    if (k > sw || (k === sw && r >= L)) return { phase: 'done', shift: sw, playElapsed: m.seconds };
    if (r < L) return { phase: 'play', shift: k, playElapsed: k * L + r };
    return { phase: 'swap', shift: k + 1, playElapsed: (k + 1) * L, swapLeft: L + P - r };
  }
  /* Indicadores: precisión y tiempo medio por decisión */
  const accOf = s => { const d = (s || {}).detail; return d && d.n ? Math.round(d.ok / d.n * 100) : null; };
  const ahtOf = s => { const d = (s || {}).detail; return d && d.nms ? d.ms / d.nms / 1000 : null; };
  const fmtS = v => `${v.toFixed(1).replace('.', ',')} s`;
  const kpiHTML = s => {
    const a = accOf(s), h = ahtOf(s);
    return a == null ? '' : `<div class="kpis"><span><small>PRECISIÓN</small><b>${a}%</b></span>${h != null ? `<span><small>TIEMPO POR DECISIÓN</small><b>${fmtS(h)}</b></span>` : ''}</div>`;
  };
  const memHTML = (s, tid) => {
    const mem = (((s || {}).detail || {}).mem || []).filter(x => x && x.name && x.n);
    return mem.length > 1 ? `<table class="mini-table"><tr><th>Integrante</th><th>Decisiones</th><th>Precisión</th><th>Tiempo</th></tr>${mem.map(x => `<tr><td>${who(x.name, tid)}</td><td>${x.n}</td><td>${Math.round(x.ok / x.n * 100)}%</td><td>${x.nms ? fmtS(x.ms / x.nms / 1000) : '—'}</td></tr>`).join('')}</table>` : '';
  };

  function arcadePlay(d, m) {
    const endAt = wallEnd(m);
    if (ROLE === 'host') return arcadeHostLive(d, m, endAt);
    const mine = resOf(roundKey(m))[ME];
    if (mine || Net.now() > endAt - 2000) return arcadeWaiting(d, m, mine);
    const t = myTeam(), nShifts = (m.swaps || 0) + 1;
    const names = Array.from({ length: nShifts }, (_, k) => playerAt(ME, k) || '');
    const root = view(`
      <div class="arcade" style="--tc:${t.color};--dc:${d.color}">
        <div class="hud">
          <div class="hud-team">${teamTag(t)}</div>
          <div class="hud-who" id="hw"></div>
          <div class="hud-combo" id="cb"></div>
          <div class="hud-score"><span id="sc">0</span> ❤</div>
        </div>
        <div class="tbar"><i id="tb"></i><span id="tl">${m.seconds}</span>${Array.from({ length: m.swaps || 0 }, (_, k) => `<em style="left:${(k + 1) / nShifts * 100}%"></em>`).join('')}</div>
        <div class="arena" id="arena"></div>
        <div class="overlay on" id="ov"></div>
      </div>`, { wide: true });
    const arena = $('#arena', root), ov = $('#ov', root), scEl = $('#sc', root), cbEl = $('#cb', root), tb = $('#tb', root), tl = $('#tl', root), hw = $('#hw', root);
    let score = 0, ctl = null, ended = false, lastSec = null, ovKey = null, shift = 0, playEl = 0, wasSwap = false;
    const log = [];
    const det = { n: 0, ok: 0, ms: 0, nms: 0, pol: {}, mem: names.map(name => ({ name, n: 0, ok: 0, ms: 0, nms: 0 })) };
    const api = {
      arena, sfx, log: e => log.push(e), tempo: m.tempo || 1, focus: d.focus, privacy: prof(),
      add(n, x, y, txt, color, big) {
        score += n; scEl.textContent = score;
        scEl.parentElement.classList.remove('bump'); void scEl.offsetWidth; scEl.parentElement.classList.add('bump');
        if (txt) Games.floatText(arena, x, y, txt, color, big);
      },
      rec(e) {
        const k = e.policy || 'none', s = det.mem[shift] || det.mem[0];
        det.n++; s.n++;
        if (e.ok) { det.ok++; s.ok++; }
        if (e.ms) { det.ms += e.ms; det.nms++; s.ms += e.ms; s.nms++; }
        det.pol[k] = det.pol[k] || [0, 0]; det.pol[k][e.ok ? 0 : 1]++;
      },
      combo(n) { cbEl.innerHTML = n >= 2 ? `COMBO x${n}` : ''; cbEl.classList.remove('pop'); void cbEl.offsetWidth; if (n >= 2) cbEl.classList.add('pop'); },
      shake() { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); },
      progress: () => Math.min(1, Math.max(0, playEl / m.seconds)),
      end: () => finish(),
    };
    const setOv = (key, html) => { if (ovKey === key) return false; ovKey = key; ov.innerHTML = html; ov.classList.toggle('on', !!html); return true; };
    const finish = () => {
      if (ended) return; ended = true;
      Games.pause(false);
      if (ctl && ctl.onEnd) ctl.onEnd();
      const stats = { ...(ctl && ctl.stats ? ctl.stats() : {}), detail: det, game: d.game };
      if (ctl) ctl.stop();
      setOv('end', burst('¡TIEMPO!', '#ffcf33', 'big')); sfx.alarm();
      MYLOG[roundKey(m)] = log;
      setTimeout(() => {
        R.set(`res/${roundKey(m)}/${ME}`, { score: Math.max(0, score), stats, at: Net.now() });
        (stats.badges || []).forEach(b => R.set(`badges/${ME}/${b}`, true));
        bumpRot(nShifts);
      }, 1200);
    };
    timers.push({ stop: () => { Games.pause(false); if (ctl && !ended) { ended = true; ctl.stop(); } } });
    (function tick() {
      if (ended || !document.body.contains(root)) return;
      const c = roundClock(m);
      if (c.phase === 'pre') {
        const n = Math.ceil(c.pre);
        if (setOv('pre' + n, `<div class="ov-wait">${n > 3 ? caption(names[0] ? `Empieza en los controles: <b>${who(names[0], ME)}</b>` : '¡Atentos! La misión empieza en...') : ''}<div class="ov-big">${n}</div></div>`) && n <= 3) sfx.drum();
      } else {
        if (!ctl) { setOv('', ''); ctl = Games[d.game](api, d.game === 'scanner' ? profileHTML(true) : undefined); sfx.reveal(); }
        if (c.phase === 'done') return finish();
        if (c.phase === 'swap') {
          if (!wasSwap) { wasSwap = true; Games.pause(true); sfx.alarm(); }
          const n = Math.ceil(c.swapLeft), next = names[c.shift];
          setOv(`swap${c.shift}-${n}`, `<div class="ov-wait swap">${burst('¡CAMBIO!', '#ffcf33', 'big')}
            <div class="swap-next">${next ? `Ahora juega: <b>${who(next, ME)}</b>` : 'Que pase <b>otra persona</b> del equipo'}</div><div class="swap-n">${n}</div></div>`);
        } else {
          if (wasSwap) { wasSwap = false; Games.pause(false); setOv('', ''); sfx.reveal(); }
          shift = c.shift;
        }
        playEl = c.playElapsed;
        const left = Math.max(0, m.seconds - playEl);
        tb.style.transform = `scaleX(${left / m.seconds})`;
        tb.classList.toggle('low', left < 6);
        const s = Math.ceil(left); tl.textContent = s;
        if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0 && c.phase === 'play') sfx.tick(); }
        const label = names[shift] ? `En los controles: <b>${who(names[shift], ME)}</b>` : (nShifts > 1 ? `Turno <b>${shift + 1}</b> de ${nShifts}` : `${icon(d.gi)} ${d.mission}`);
        if (hw.dataset.k !== String(shift)) { hw.dataset.k = String(shift); hw.innerHTML = label; }
      }
      requestAnimationFrame(tick);
    })();
  }
  function liveBoard(m) {
    const res = resOf(roundKey(m));
    const rows = teamsList().map(t => ({ t, r: res[t.id] })).sort((a, b) => (b.r ? b.r.score : -1) - (a.r ? a.r.score : -1));
    const max = Math.max(1, ...rows.map(x => (x.r ? x.r.score : 0)));
    return `<div class="bars">${rows.map(({ t, r }) => `<div class="bar-row" style="--tc:${t.color}">${teamTag(t)}
      <div class="bar"><i style="width:${r ? Math.max(3, r.score / max * 100) : 0}%"></i></div><b>${r ? r.score : '<span class="playing">jugando…</span>'}</b></div>`).join('')}</div>`;
  }
  function reviewHTML(d, log) {
    if (!log || !log.length) return '';
    const items = log.slice(0, 4).map(e => {
      if (e.kind === 'post') return `<div class="rv-item">${dchip(e.right)}${e.policy ? `<span class="pol-chip">${policy(e.policy).en}</span>` : ''}<span>${e.text}${e.why ? `<em class="why">${e.why}</em>` : ''}</span></div>`;
      if (e.kind === 'msg') return `<div class="rv-item">${e.right === 'legit' ? '<span class="dchip" style="--dc:#2ec4b6">Era real</span>' : `<span class="dchip" style="--dc:#d7263d">Estafa</span><span class="pol-chip">${policy(e.policy).en}</span>`}<span>${e.text}</span></div>`;
      return '';
    }).join('');
    return items ? `<div class="review"><h4>Para repasar</h4>${items}</div>` : '';
  }
  function arcadeWaiting(d, m, mine) {
    const root = view(`${mhead(d)}<div class="wait-grid">
      <div class="pnl center res-me">
        ${mine ? `<div class="kicker">Su puntaje</div><div class="res-score">${mine.score} ❤</div>${kpiHTML(mine.stats)}${memHTML(mine.stats, ME)}` : '<div class="kicker">Esta ronda ya terminó</div>'}
        ${mine && ((mine.stats || {}).badges || []).length ? `<div class="badges-row">${mine.stats.badges.map(b => badgeHTML(b)).join('')}</div>` : ''}
        ${reviewHTML(d, MYLOG[roundKey(m)])}
      </div>
      <div class="col">${caption('Esperando a que terminen los demás equipos...')}<div id="lb">${liveBoard(m)}</div></div>
    </div>`, { wide: true });
    refresh = () => { $('#lb', root).innerHTML = liveBoard(m); };
  }
  function arcadeHostLive(d, m, endAt) {
    const total = (endAt - m.startAt) / 1000;
    const root = view(`${mhead(d)}<div class="host-live">
      <div class="col center"><div id="ck"></div>${caption(`Todos los equipos están jugando en sus computadoras.${m.swaps ? ` El juego pedirá <b>${m.swaps} cambio(s) de integrante</b> durante la ronda.` : ''}`)}</div>
      <div class="col"><h3 class="comic-h">Marcador en vivo</h3><div id="lb">${liveBoard(m)}</div></div></div>`, { wide: true });
    const ck = $('#ck', root);
    if (Net.now() < m.startAt) {
      const iv = setInterval(() => { const n = Math.ceil((m.startAt - Net.now()) / 1000); if (n > 0) ck.innerHTML = `<div class="ov-big">${n}</div>`; else { clearInterval(iv); clock(ck, endAt, total, { size: 160 }); } }, 200);
      timers.push({ stop: () => clearInterval(iv) });
    } else clock(ck, endAt, total, { size: 160 });
    refresh = () => { $('#lb', root).innerHTML = liveBoard(m); };
    hostCtrl(`<span class="ctrl-label">Jugando…</span><button class="btn red" id="h-res">Ver resultados ▶</button>`, dock => { $('#h-res', dock).onclick = () => goResults(d, m); });
  }
  function goResults(d, m) {
    const key = roundKey(m);
    if (!H.awarded[key]) {
      H.awarded[key] = true;
      Object.entries(resOf(key)).forEach(([tid, r]) => award(tid, r.score, d.id));
      saveH();
    }
    pub({ m: { ...m, phase: 'results' } });
  }
  const badgeHTML = (b, mini) => BADGES[b] ? `<span class="badge ${mini ? 'mini' : ''}" title="${BADGES[b].desc}">${icon(BADGES[b].icon)}<b>${BADGES[b].name}</b></span>` : '';
  function arcadeResults(d, m) {
    const res = resOf(roundKey(m));
    const ranked = teamsList().map(t => ({ t, r: res[t.id], s: res[t.id] ? res[t.id].score : 0, b: res[t.id] ? (res[t.id].stats || {}).badges || [] : [] })).sort((a, b) => b.s - a.s);
    const mineRes = ROLE === 'team' ? res[ME] : null;
    view(`${mhead(d)}
      <div class="podium-row">${ranked.map((x, i) => { const a = accOf(x.r && x.r.stats), h = ahtOf(x.r && x.r.stats); return `<div class="res-card ${i === 0 ? 'first' : ''}" style="--tc:${x.t.color};animation-delay:${i * .12}s">
        <div class="pos">#${i + 1}</div><div class="big-badge sm" style="--tc:${x.t.color}">${x.t.emoji}</div><b>${esc(x.t.name)}</b><div class="res-score sm">${x.s} ❤</div>
        ${a != null ? `<div class="res-kpi">${a}% de precisión${h != null ? ` · ${fmtS(h)}` : ''}</div>` : ''}
        <div class="badges-row">${x.b.map(b => badgeHTML(b, true)).join('')}</div></div>`; }).join('')}</div>
      ${mineRes ? `<div class="pnl center my-round">${kpiHTML(mineRes.stats)}${memHTML(mineRes.stats, ME)}</div>` : ''}
      ${ROLE === 'team' ? reviewHTML(d, MYLOG[roundKey(m)]) : ''}
      ${caption(ranked[0] && ranked[0].s > 0 ? `¡${esc(ranked[0].t.name)} gana la misión y la pista secreta!` : 'Ronda terminada.')}`, { wide: true });
    sfx.fanfare(); confetti(120);
    const btns = [];
    if (d.bonus === 'chain') btns.push('<button class="btn ghost" id="h-chain">Bonus: teléfono en cadena</button>');
    btns.push(d.vault ? '<button class="btn red" id="h-vault">Siguiente: ¡la bóveda! ▶</button>' : '<button class="btn red" id="h-clue">Entregar pista secreta ▶</button>');
    hostCtrl(`<span class="ctrl-label">Resultados</span>${btns.join('')}`, dock => {
      const c = $('#h-clue', dock); if (c) c.onclick = () => deliverClue(d);
      const v = $('#h-vault', dock); if (v) v.onclick = () => pub({ m: { ...m, phase: 'vault', endsAt: Net.now() + 150000 } });
      const ch = $('#h-chain', dock); if (ch) ch.onclick = () => pub({ m: { ...m, phase: 'chain', step: 0, sub: 'read', endsAt: Net.now() + 18000, order: teamsList().map(t => t.id) } });
    });
  }

  /* ---------------- BÓVEDA (Nebulosa) ---------------- */
  function profileHTML(shuffled) {
    const P = prof();
    const posts = shuffled ? shuffle(P.posts) : P.posts;
    return `<div class="profile">
      <div class="top"><div class="pav">${P.avatar}</div>
        <div><div class="puser">@${P.user}</div>
          <div class="stats"><div><b>238</b>publicaciones</div><div><b>1.204</b>seguidores</div><div><b>980</b>seguidos</div></div></div></div>
      <div class="bio"><b>${P.name}</b>${P.bio.map(b => `<span class="risk" data-risk="${b.risk || ''}">${b.text}</span>`).join('')}</div>
      <div class="grid">${posts.map(p => `<div class="gp risk" data-risk="${p.risk || ''}" style="background:${p.bg}"><div class="ge">${p.emoji}</div><div class="gc">${p.caption}</div></div>`).join('')}</div>
    </div>`;
  }
  const vaultOrder = m => Object.entries((D.vault || {})[roundKey(m)] || {}).sort((a, b) => a[1] - b[1]).map(([tid]) => tid);
  function vault(d, m) {
    if (ROLE === 'host') {
      const root = view(`${mhead(d)}<div class="host-live"><div class="col center"><div id="ck"></div>${caption(`Todos los equipos intentan abrir la bóveda de <b>${esc(prof().name)}</b> con lo que publicó en su perfil.`)}</div>
        <div class="col"><h3 class="comic-h">Orden de apertura</h3><div id="vo"></div></div></div>`, { wide: true });
      const paint = () => { const o = vaultOrder(m); $('#vo', root).innerHTML = teamsList().map(t => `<div class="bar-row" style="--tc:${t.color}">${teamTag(t)}<b>#${o.includes(t.id) ? `${o.indexOf(t.id) + 1} abierta` : '<span class="playing">intentando…</span>'}</b></div>`).join(''); };
      paint(); refresh = paint;
      clock($('#ck', root), m.endsAt, 150, { onEnd: () => vaultEnd(d, m), size: 160 });
      hostCtrl(`<span class="ctrl-label">Bóveda</span><button class="btn red" id="h-end">Cerrar la bóveda ▶</button>`, dock => { $('#h-end', dock).onclick = () => vaultEnd(d, m); });
      return;
    }
    const mineOpen = ((D.vault || {})[roundKey(m)] || {})[ME];
    const root = view(`${mhead(d)}
      <div class="vault-layout">
        <div class="paper-profile">${profileHTML(false)}</div>
        <div class="pnl vault ${mineOpen ? 'open' : ''}">
          <div class="row" style="justify-content:space-between"><h2 class="comic-h">${icon('combination-lock')} Bóveda de ${esc(prof().name)}</h2><div id="ck"></div></div>
          ${rotating(ME) && !mineOpen ? `<div class="turn-box">${icon('key')}<div><small>EN EL TECLADO (TODOS AYUDAN A BUSCAR)</small><b>${who(playerAt(ME), ME)}</b></div></div>` : ''}
          <div class="vault-door" id="door"><div class="dial">${icon(mineOpen ? 'padlock-open' : 'padlock')}</div></div>
          <div class="hint-box">${icon('key')} Pista de su contraseña:<br><b>${prof().hint}</b></div>
          ${mineOpen ? `<div class="vault-ok">${burst('¡ABIERTA!', '#2ec4b6')}<p>${esc(prof().name)} usó <b>datos que publicó en su propio perfil</b>.</p>${polChips(['privacy'])}</div>`
          : `<input class="pw-input" id="pw" placeholder="Contraseña" autocomplete="off" spellcheck="false"><button class="btn red big mt-s" id="try">Probar</button>`}
        </div>
      </div>`, { wide: true });
    clock($('#ck', root), m.endsAt, 150, { size: 80 });
    if (!mineOpen) {
      const pw = $('#pw', root), door = $('#door', root);
      const tryIt = () => {
        const v = pw.value.trim().toLowerCase().replace(/\s+/g, '');
        if (!v) return;
        if (v === prof().answer) { R.set(`vault/${roundKey(m)}/${ME}`, Net.now()); sfx.reveal(); confetti(150); }
        else { door.classList.remove('shake'); void door.offsetWidth; door.classList.add('shake'); sfx.bad(); toast('ACCESO DENEGADO'); pw.select(); }
      };
      $('#try', root).onclick = tryIt;
      pw.onkeydown = e => { if (e.key === 'Enter') tryIt(); };
      pw.focus();
      refresh = () => { if (((D.vault || {})[roundKey(m)] || {})[ME]) { lastKey = null; sync(); } };
    }
  }
  function vaultEnd(d, m) {
    const cur = st().m; if (!cur || cur.phase !== 'vault') return;
    const key = roundKey(m) + '-vault';
    if (!H.awarded[key]) {
      H.awarded[key] = true;
      const o = vaultOrder(m);
      o.forEach((tid, i) => award(tid, [300, 200][i] || 100, d.id));
      if (o[0]) R.set(`badges/${o[0]}/hacker`, true);
      saveH();
    }
    pub({ m: { ...cur, phase: 'vaultdone' } });
  }
  function vaultDone(d, m) {
    const o = vaultOrder(m);
    const lessons = [['magnifying-glass', 'Revisión de privacidad'], ['three-friends', 'Elige la audiencia'], ['key', 'Contraseñas únicas'], ['checked-shield', 'Verificación en dos pasos'], ['house', 'Publica el viaje al volver']];
    view(`${mhead(d)}
      <div class="podium-row">${o.length ? o.map((tid, i) => { const t = team(tid); return t ? `<div class="res-card ${i === 0 ? 'first' : ''}" style="--tc:${t.color}"><div class="pos">#${i + 1}</div><div class="big-badge sm" style="--tc:${t.color}">${t.emoji}</div><b>${esc(t.name)}</b><div class="res-score sm">+${[300, 200][i] || 100}</div></div>` : ''; }).join('') : caption('Nadie abrió la bóveda a tiempo...')}</div>
      <h3 class="comic-h center mt">${icon('checked-shield')} Escudo de privacidad</h3>
      <div class="shield-row">${lessons.map(([ic, t], i) => `<div class="shield-tip" style="animation-delay:${i * .12}s">${icon(ic)}<b>${t}</b></div>`).join('')}</div>`, { wide: true });
    sfx.fanfare();
    hostCtrl(`<span class="ctrl-label">Bóveda cerrada</span><button class="btn red" id="h-clue">Entregar pista secreta ▶</button>`, dock => { $('#h-clue', dock).onclick = () => deliverClue(d); });
  }

  /* ---------------- TELÉFONO EN CADENA (bonus Torre, estilo Gartic Phone) ---------------- */
  const chainData = m => (D.chain || {})[roundKey(m)] || {};
  function chainText(m, c, step) {
    if (step === 0) return PHONE_MESSAGES[c % PHONE_MESSAGES.length];
    const prev = (chainData(m)[c] || {})[step - 1];
    return prev ? prev.text : '(el equipo anterior no escribió nada... ¡inventen!)';
  }
  function chainStep(d, m) {
    const order = m.order || [], n = order.length, steps = Math.min(n, 4);
    if (ROLE === 'host') {
      const root = view(`${mhead(d)}<div class="host-live"><div class="col center"><div id="ck"></div>
        ${caption(`Teléfono en cadena · ronda ${m.step + 1} de ${steps} · ${m.sub === 'read' ? 'los equipos están leyendo' : 'los equipos escriben de memoria'}`)}</div>
        <div class="col"><h3 class="comic-h">Equipos</h3><div id="stt"></div></div></div>`, { wide: true });
      const paint = () => {
        $('#stt', root).innerHTML = order.map((tid, i) => { const t = team(tid); const c = (i - m.step + n) % n; const w = (chainData(m)[c] || {})[m.step]; return t ? `<div class="bar-row" style="--tc:${t.color}">${teamTag(t)}<b>${m.sub === 'write' ? (w ? '✔ enviado' : '<span class="playing">escribiendo…</span>') : 'leyendo…'}</b></div>` : ''; }).join('');
        if (m.sub === 'write' && order.every((tid, i) => (chainData(m)[(i - m.step + n) % n] || {})[m.step])) later(() => chainNext(m, steps), 800);
      };
      paint(); refresh = paint;
      clock($('#ck', root), m.endsAt, m.sub === 'read' ? 18 : 60, { size: 160, onEnd: () => later(() => chainNext(m, steps), m.sub === 'write' ? 1500 : 0) });
      hostCtrl(`<span class="ctrl-label">Teléfono en cadena</span><button class="btn red" id="h-n">Avanzar ▶</button>`, dock => { $('#h-n', dock).onclick = () => chainNext(m, steps); });
      return;
    }
    const idx = order.indexOf(ME);
    if (idx < 0) return view(`${mhead(d)}${caption('Esta ronda empezó antes de que llegaran. ¡Miren cómo se deforma el rumor al final!')}`);
    const c = (idx - m.step + n) % n;
    if (m.sub === 'read') {
      const root = view(`${mhead(d)}
        <div class="chain-read">${caption(`Ronda ${m.step + 1} de ${steps}: <b>memoricen</b> este mensaje. En unos segundos desaparecerá y tendrán que escribirlo de memoria.`)}
          <div class="newspaper"><div class="np-head">EL VIGÍA DE NEXÓPOLIS · ÚLTIMA HORA</div><div class="np-body">${esc(chainText(m, c, m.step))}</div></div><div id="ck" class="center"></div></div>`, { wide: true });
      clock($('#ck', root), m.endsAt, 18, { size: 100 });
    } else {
      const sent = (chainData(m)[c] || {})[m.step];
      const root = view(`${mhead(d)}
        <div class="chain-write">${caption('¿Qué decía el mensaje? Escríbanlo <b>de memoria</b>, lo más fiel posible. El siguiente equipo solo verá lo que ustedes escriban.')}
          <div class="pnl">${sent ? '<p class="center">✔ Enviado. Esperando a los demás equipos…</p>' : '<textarea id="tx" maxlength="260" placeholder="Escriban aquí la noticia..."></textarea><button class="btn red big mt-s" id="send">Enviar a la cadena</button>'}</div><div id="ck" class="center"></div></div>`, { wide: true });
      const submit = () => { const tx = $('#tx', root); if (tx && !(chainData(m)[c] || {})[m.step]) R.set(`chain/${roundKey(m)}/${c}/${m.step}`, { by: ME, text: tx.value.trim() || '…' }); };
      clock($('#ck', root), m.endsAt, 60, { size: 100, onEnd: submit });
      if (!sent) {
        $('#tx', root).focus();
        $('#send', root).onclick = () => { submit(); sfx.pop(); };
        refresh = () => { if ((chainData(m)[c] || {})[m.step]) { lastKey = null; sync(); } };
      }
    }
  }
  function chainNext(m, steps) {
    const cur = st().m; if (!cur || cur.phase !== 'chain' || cur.step !== m.step || cur.sub !== m.sub) return;
    if (m.sub === 'read') return pub({ m: { ...cur, sub: 'write', endsAt: Net.now() + 60000 } });
    if (m.step + 1 < steps) return pub({ m: { ...cur, step: m.step + 1, sub: 'read', endsAt: Net.now() + 18000 } });
    pub({ m: { ...cur, phase: 'chainreveal' } });
  }
  function chainReveal(d, m) {
    const order = m.order || [], steps = Math.min(order.length, 4);
    view(`${mhead(d)}${caption('Así viajaron los rumores de equipo en equipo. ¿Cuánto sobrevivió la verdad?')}
      <div class="chains">${order.map((_, c) => `<div class="chain-col">
        <div class="newspaper sm"><div class="np-head">ORIGINAL</div><div class="np-body">${esc(PHONE_MESSAGES[c % PHONE_MESSAGES.length])}</div></div>
        ${Array.from({ length: steps }, (_, s) => { const e = (chainData(m)[c] || {})[s]; const t = e && team(e.by); return `<div class="chain-link" style="animation-delay:${s * .3}s">${t ? teamTag(t) : ''}<p>${esc(e ? e.text : '—')}</p></div>`; }).join('')}
      </div>`).join('')}</div>
      <div class="lesson-strip">${polChips(['misinfo', 'spam'])}<p>Un estudio del MIT (2018) encontró que, en redes sociales, las noticias falsas llegaban a más personas y más rápido que las verdaderas. <b>Verifica antes de compartir.</b></p></div>`, { wide: true });
    hostCtrl(`<span class="ctrl-label">Bonus terminado</span><button class="btn red" id="h-clue">Entregar pista secreta ▶</button>`, dock => { $('#h-clue', dock).onclick = () => deliverClue(d); });
  }

  /* ---------------- EL CONSEJO (escribir + votar, estilo Quiplash) ---------------- */
  const cKey = m => `${m.round}-${m.caseId}`;
  const cData = m => (D.council || {})[cKey(m)] || {};
  const postHTML = c => `
    <div class="post">
      <div class="ph"><div class="pa">${c.avatar}</div><b>${c.user}</b><span class="ptag">REPORTADO</span></div>
      <div class="pimg" style="background:${c.image.bg}"><span class="pe">${c.image.emoji}</span><span class="pcap">${c.image.caption}</span></div>
      <div class="ptxt"><b>${c.user}</b> ${c.caption}</div>
    </div>`;
  function council(d, m) {
    if (m.phase === 'pick') {
      if (ROLE === 'host') {
        const played = (H.councilPlayed || {})[m.round] || [];
        const root = view(`${mhead(d)}${caption('Elijan el próximo caso. Recomendado: 3 casos.')}
          <div class="case-grid">${Content.casesFor(seedOf()).map((c, i) => `<button class="case-tile ${played.includes(c.id) ? 'played' : ''}" data-id="${c.id}" style="animation-delay:${i * .05}s"><span class="ce">${c.image.emoji}</span><b>${c.title}</b>${played.includes(c.id) ? dchip(c.verdict) : ''}</button>`).join('')}</div>`, { wide: true });
        $$('.case-tile', root).forEach(b => (b.onclick = () => {
          H.councilPlayed = H.councilPlayed || {}; H.councilPlayed[m.round] = [...played, b.dataset.id]; saveH();
          pub({ m: { ...m, phase: 'write', caseId: b.dataset.id, endsAt: Net.now() + 80000 } });
        }));
        hostCtrl(`<span class="ctrl-label">Casos jugados: ${played.length}</span>${played.length ? '<button class="btn red" id="h-clue">Cerrar el Consejo y entregar pista ▶</button>' : ''}`, dock => {
          const b = $('#h-clue', dock); if (b) b.onclick = () => { councilJudge(m.round); deliverClue(d); };
        });
      } else view(`${mhead(d)}<div class="waiting">${icon('gavel', 'huge')}${caption('El Consejo se reúne... el moderador está eligiendo el caso.')}</div>`, { wide: true });
      return;
    }
    const c = Content.CASES.find(x => x.id === m.caseId);
    const ans = () => cData(m).ans || {}, votes = () => cData(m).votes || {};
    if (m.phase === 'write') {
      if (ROLE === 'host') {
        const root = view(`${mhead(d)}<div class="council-host"><div>${postHTML(c)}</div><div class="col"><div id="ck" class="center"></div>${caption('Cada equipo elige la decisión y escribe por qué.')}<div id="stt"></div></div></div>`, { wide: true });
        const toVote = () => { const cur = st().m; if (cur && cur.phase === 'write' && cur.caseId === m.caseId) pub({ m: { ...cur, phase: 'vote', endsAt: Net.now() + 45000 } }); };
        const paint = () => {
          $('#stt', root).innerHTML = teamsList().map(t => `<div class="bar-row" style="--tc:${t.color}">${teamTag(t)}<b>${ans()[t.id] ? '✔ listo' : '<span class="playing">escribiendo…</span>'}</b></div>`).join('');
          if (teamsList().length && teamsList().every(t => ans()[t.id])) later(toVote, 1200);
        };
        paint(); refresh = paint;
        clock($('#ck', root), m.endsAt, 80, { size: 130, onEnd: () => later(toVote, 1500) });
        hostCtrl(`<span class="ctrl-label">Escribiendo</span><button class="btn red" id="h-n">A votar ▶</button>`, dock => { $('#h-n', dock).onclick = toVote; });
        return;
      }
      const mine = ans()[ME];
      let pick = null;
      const root = view(`${mhead(d)}<div class="council-team"><div>${postHTML(c)}</div>
        <div class="col"><div class="row" style="justify-content:space-between"><h2 class="comic-h">${c.title}</h2><div id="ck"></div></div>
        ${mine ? `<div class="pnl center"><p>✔ Decisión enviada:</p>${dchip(mine.dec)}<p class="argue">“${esc(mine.text)}”</p><p class="small">Esperando a los demás equipos…</p></div>`
        : `${rotating(ME) ? `<div class="turn-box">${icon('notebook')}<div><small>ESCRIBE EN ESTE CASO (EL EQUIPO DICTA)</small><b>${who(playerAt(ME), ME)}</b></div></div>` : ''}
          ${caption('1) Elijan la decisión. 2) Escriban un argumento corto y convincente: ¡los demás equipos lo votarán!')}
          <div class="stamp-pick">${Object.keys(DECISIONS).map(k => `<button class="stamp-btn" data-k="${k}" style="--dc:${DECISIONS[k].color}">${DECISIONS[k].label}</button>`).join('')}</div>
          <textarea id="tx" maxlength="140" placeholder="Porque..."></textarea><div class="small right" id="cnt">0/140</div>
          <button class="btn red big" id="send" disabled>Enviar al Consejo</button>`}</div></div>`, { wide: true });
      let sent = false;
      const submit = () => {
        if (sent || ans()[ME] || !pick) return;
        sent = true;
        R.set(`council/${cKey(m)}/ans/${ME}`, { dec: pick, text: ($('#tx', root).value.trim() || '(sin argumento)') });
        if (rotating(ME)) bumpRot(1);
      };
      clock($('#ck', root), m.endsAt, 80, { size: 90, onEnd: submit });
      if (!mine) {
        const send = $('#send', root), tx = $('#tx', root);
        const upd = () => { $('#cnt', root).textContent = `${tx.value.length}/140`; send.disabled = !pick || tx.value.trim().length < 3; };
        $$('.stamp-btn', root).forEach(b => (b.onclick = () => { pick = b.dataset.k; $$('.stamp-btn', root).forEach(x => x.classList.toggle('sel', x === b)); sfx.stamp(); upd(); }));
        tx.oninput = upd;
        send.onclick = () => { submit(); sfx.pop(); };
        refresh = () => { if (ans()[ME]) { lastKey = null; sync(); } };
      }
      return;
    }
    if (m.phase === 'vote') {
      const entries = shuffle(Object.entries(ans()), (m.round % 1000) + m.caseId.length + 3);
      if (ROLE === 'host') {
        const root = view(`${mhead(d)}<div class="council-host"><div class="args">${entries.map(([, a]) => `<div class="arg">${dchip(a.dec)}<p>“${esc(a.text)}”</p></div>`).join('')}</div>
          <div class="col"><div id="ck" class="center"></div>${caption('Los equipos votan el argumento más convincente (no pueden votarse a sí mismos).')}<div id="stt"></div></div></div>`, { wide: true });
        const toVerdict = () => councilVerdict(d, m);
        const paint = () => {
          $('#stt', root).innerHTML = teamsList().map(t => `<div class="bar-row" style="--tc:${t.color}">${teamTag(t)}<b>${votes()[t.id] ? '✔ votó' : '<span class="playing">pensando…</span>'}</b></div>`).join('');
          const voters = teamsList().filter(t => Object.keys(ans()).some(id => id !== t.id));
          if (voters.length && voters.every(t => votes()[t.id])) later(toVerdict, 1200);
        };
        paint(); refresh = paint;
        clock($('#ck', root), m.endsAt, 45, { size: 130, onEnd: toVerdict });
        hostCtrl(`<span class="ctrl-label">Votación</span><button class="btn red" id="h-n">Ver veredicto ▶</button>`, dock => { $('#h-n', dock).onclick = toVerdict; });
        return;
      }
      const myVote = votes()[ME];
      const root = view(`${mhead(d)}${caption(myVote ? '✔ Voto enviado. Esperando a los demás...' : '¿Qué argumento es el más convincente? Toquen uno para votarlo (el suyo no cuenta).')}
        <div class="args vote">${entries.map(([tid, a], i) => `<button class="arg ${tid === ME ? 'own' : ''} ${myVote === tid ? 'sel' : ''}" data-t="${tid}" ${tid === ME || myVote ? 'disabled' : ''} style="--rot:${[-1.5, 1, -.5, 1.5, -1][i % 5]}deg">${dchip(a.dec)}<p>“${esc(a.text)}”</p>${tid === ME ? '<small>(el suyo)</small>' : ''}</button>`).join('') || '<p>Nadie envió argumentos.</p>'}</div><div id="ck" class="center"></div>`, { wide: true });
      clock($('#ck', root), m.endsAt, 45, { size: 80 });
      $$('.arg[data-t]', root).forEach(b => (b.onclick = () => { if (b.disabled) return; R.set(`council/${cKey(m)}/votes/${ME}`, b.dataset.t); sfx.stamp(); }));
      refresh = () => { if (votes()[ME] && !myVote) { lastKey = null; sync(); } };
      return;
    }
    if (m.phase === 'verdict') {
      const count = {}; Object.values(votes()).forEach(t => (count[t] = (count[t] || 0) + 1));
      const entries = Object.entries(ans()).sort((a, b) => (count[b[0]] || 0) - (count[a[0]] || 0));
      const dec = DECISIONS[c.verdict];
      view(`${mhead(d)}<div class="council-team"><div>${postHTML(c)}</div>
        <div class="col center"><div class="kicker">La decisión correcta</div><div class="big-stamp" style="--dc:${dec.color}">${dec.label}</div>
          ${polChips(c.policies)}<p class="verdict-txt">${c.explain}</p></div></div>
        <div class="args">${entries.map(([tid, a]) => { const t = team(tid); const ok = a.dec === c.verdict; return `<div class="arg reveal ${ok ? 'right' : 'wrong'}">${teamTag(t)}${dchip(a.dec)}<p>“${esc(a.text)}”</p>
          <div class="arg-pts"><span>${count[tid] || 0} voto(s)${ok ? ' · decisión correcta' : ''}</span><b>+${(count[tid] || 0) * 100 + (ok ? 150 : 0)}</b></div></div>`; }).join('')}</div>`, { wide: true });
      sfx.stamp(); confetti(80);
      hostCtrl(`<span class="ctrl-label">Veredicto</span><button class="btn ghost" id="h-more">Otro caso</button><button class="btn red" id="h-clue">Cerrar el Consejo y entregar pista ▶</button>`, dock => {
        $('#h-more', dock).onclick = () => pub({ m: { ...m, phase: 'pick', caseId: null } });
        $('#h-clue', dock).onclick = () => { councilJudge(m.round); deliverClue(d); };
      });
    }
  }
  function councilVerdict(d, m) {
    const cur = st().m; if (!cur || cur.phase !== 'vote' || cur.caseId !== m.caseId) return;
    const key = 'c' + cKey(m);
    if (!H.awarded[key]) {
      H.awarded[key] = true;
      const c = Content.CASES.find(x => x.id === m.caseId);
      const data = cData(m), count = {};
      Object.values(data.votes || {}).forEach(t => (count[t] = (count[t] || 0) + 1));
      H.council[m.round] = H.council[m.round] || {};
      Object.entries(data.ans || {}).forEach(([tid, a]) => {
        const ok = a.dec === c.verdict;
        award(tid, (count[tid] || 0) * 100 + (ok ? 150 : 0), d.id);
        const rec = H.council[m.round][tid] = H.council[m.round][tid] || { ok: 0, n: 0 };
        rec.n++; if (ok) rec.ok++;
      });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
      if (top) R.set(`badges/${top[0]}/orador`, true);
      saveH();
    }
    pub({ m: { ...cur, phase: 'verdict' } });
  }
  function councilJudge(round) {
    Object.entries((H.council || {})[round] || {}).forEach(([tid, r]) => { if (r.n >= 2 && r.ok === r.n) R.set(`badges/${tid}/juez`, true); });
  }

  /* ---------------- PISTA SECRETA ---------------- */
  function deliverClue(d) {
    const pts = H.mpts[d.id] || {};
    const max = Math.max(0, ...teamsList().map(t => pts[t.id] || 0));
    const sel = new Set(max > 0 ? teamsList().filter(t => (pts[t.id] || 0) === max).map(t => t.id) : []);
    const m = modal(`<h2 class="comic-h">${icon('love-letter')} ¿Quién recibe la pista secreta?</h2><p>Por defecto, el equipo con más puntos en esta misión. Pueden elegir varios si hay empate.</p>
      <div class="pick-list">${teamsList().sort((a, b) => (pts[b.id] || 0) - (pts[a.id] || 0)).map(t => `<button class="pick-row ${sel.has(t.id) ? 'sel' : ''}" data-t="${t.id}" style="--tc:${t.color}">${teamTag(t)}<b>${pts[t.id] || 0} ❤</b><span class="ck">${sel.has(t.id) ? '✔' : ''}</span></button>`).join('')}</div>
      <div class="row center mt"><button class="btn red big" id="ok">Entregar pista</button></div>`, { small: true });
    $$('.pick-row', m).forEach(b => (b.onclick = () => { const t = b.dataset.t; sel.has(t) ? sel.delete(t) : sel.add(t); b.classList.toggle('sel'); $('.ck', b).textContent = sel.has(t) ? '✔' : ''; }));
    $('#ok', m).onclick = () => {
      if (!sel.size) return toast('Elijan al menos un equipo');
      closeModal();
      let clue = H.clues.find(c => c.mission === d.id);
      if (!clue) { clue = H.clues.find(c => !c.mission); if (clue) clue.mission = d.id; }
      const done = [...new Set([...(st().done || []), d.id])];
      if (clue) {
        clue.ref = clue.ref || rid(); H.refs = H.refs || {}; H.refs[clue.ref] = true;
        [...sel].forEach(tid => R.set(`private/${tid}/${d.id}`, { text: CLUE_TEMPLATES[clue.type](suspect(clue.sid)), kind: 'won', mid: d.id, ref: clue.ref, at: Net.now() }));
      }
      saveH();
      pub({ scene: 'clue', clue: { mission: d.id, holders: [...sel] }, done, m: null });
    };
  }
  SC.clue = () => {
    const c = st().clue || {}, d = district(c.mission);
    if (!d) return;
    const holders = (c.holders || []).map(team).filter(Boolean);
    const mine = ROLE === 'team' && (c.holders || []).includes(ME);
    const root = view(`<div class="clue-scene">
      <div id="cbox"></div>
      <div class="restored"><div class="mini-crystal">${Art.crystal(st().done || [], 120)}</div><div>
        <h3 class="comic-h">¡Fragmento de ${d.value} recuperado!</h3><p>${LESSONS[d.id].text}</p></div></div>
      <h3 class="comic-h mt">${icon('files')} Nuevas políticas en el Archivo</h3>
      <div class="codex unlock">${POLICIES.filter(p => p.district === d.id).map((p, i) => polCard(p, false, .4 + i * .2)).join('')}</div></div>`, { wide: true });
    const paint = () => {
      const e = mine ? entryOf(c.mission, ((D.private || {})[ME] || {})[c.mission]) : null, text = e && e.text;
      $('#cbox', root).innerHTML = mine ? `<div class="envelope-wrap"><div class="env">${icon('love-letter')}</div>
          <div class="clue-card"><div class="cc-head">PISTA SECRETA · SOLO PARA ${esc(myTeam().name.toUpperCase())}</div><div class="cc-text">${text || 'Abriendo el sobre…'}</div>
          <div class="cc-foot">${icon('notebook')} Guardada en su libreta (botón «Tablero»). ¡No se la cuenten a nadie... todavía!</div></div></div>`
        : `<div class="pnl center other-clue">${icon('love-letter', 'huge')}<h2 class="comic-h">La pista secreta fue para</h2><div class="row center">${holders.map(t => teamTag(t)).join('')}</div>
          ${caption(ROLE === 'team' ? 'En el Mercado de Pistas podrán negociarla... o descubrir si les mienten.' : 'Cada equipo ganador la ve solo en su pantalla.')}</div>`;
    };
    paint();
    if (mine) refresh = () => { if (!$('.cc-text', root).textContent.startsWith('Abriendo') ) return; paint(); };
    mine ? (sfx.reveal(), confetti(160)) : sfx.whoosh();
    const all = (st().done || []).length === DISTRICTS.length;
    hostCtrl(`<span class="ctrl-label">Pista entregada</span>${all ? '<button class="btn ghost" id="h-acc">Saltar a la acusación</button>' : ''}<button class="btn red" id="h-n">${all ? 'Ir al Mercado de Pistas ▶' : 'Volver al mapa ▶'}</button>`, dock => {
      $('#h-n', dock).onclick = () => (all ? pub({ scene: 'market', endsAt: Net.now() + MARKET_SECS * 1000, clue: null }) : pub({ scene: 'map', clue: null }));
      const a = $('#h-acc', dock); if (a) a.onclick = () => pub({ scene: 'accuse', clue: null });
    });
  };

  /* ---------------- MERCADO DE PISTAS ----------------
     Se venden SOBRES con una pista: el comprador nunca sabe si es verdadera.
     Cada equipo recibe 2 SEÑUELOS (pistas falsas selladas) para vender o engañar.
     Para descubrir una falsa: la LUPA (2 por equipo) o la lógica:
     una pista falsa siempre descarta al verdadero culpable. */
  const MSG_CAP = 3, MARKET_SECS = 180, PRICES = [0, 50, 100, 150, 200, 300];
  const OFFER_STATUS = { open: 'PENDIENTE', accepted: 'VENDIDA', rejected: 'RECHAZADA', nofunds: 'SIN FONDOS', failed: 'NO DISPONIBLE' };
  const pendingAcc = new Set();
  const marketItems = () => {
    const mk = D.market || {};
    return [
      ...Object.entries(mk.msgs || {}).map(([k, v]) => ({ k, type: 'msg', ...v })),
      ...Object.entries(mk.offers || {}).map(([k, v]) => ({ k, type: 'offer', ...v })),
    ].sort((a, b) => (a.at || 0) - (b.at || 0));
  };
  /* El moderador reparte los señuelos al abrir el mercado (una sola vez por sala) */
  function makeDecoys() {
    if (ROLE !== 'host' || !H || H.decoysDone) return;
    H.refs = H.refs || {};
    const culprit = suspect(H.culprit);
    teamsList().forEach(t => shuffle(Object.keys(CLUE_TEMPLATES)).slice(0, 2).forEach((type, n) => {
      const ref = rid(); H.refs[ref] = false;
      R.set(`private/${t.id}/s${n + 1}`, { text: CLUE_TEMPLATES[type](culprit), kind: 'decoy', ref, at: Net.now() });
    }));
    H.decoysDone = true; saveH();
  }
  function itemHTML(x) {
    const head = `<div class="msg-head">${teamTag(team(x.from))} → ${teamTag(team(x.to))}</div>`;
    if (x.type === 'msg') return `<div class="msg text ${x.from === ME ? 'out' : ''}">${head}<p>${esc(x.text)}</p></div>`;
    let body = `<p>${icon('love-letter')} Ofrece un <b>sobre con una pista</b> por <b>${x.price ? `${x.price} ❤` : 'nada: es un regalo'}</b>.</p>`;
    if (ROLE === 'host') {
      const e = entryOf(x.key, ((D.private || {})[x.from] || {})[x.key]);
      body += e ? `<p class="small">Vista del moderador: ${e.kind === 'decoy' ? '🎭 señuelo FALSO' : e.kind === 'won' ? '✅ pista real ganada' : `🛒 pista comprada (${(H.refs || {})[e.ref] === false ? 'falsa' : 'real'})`}</p>` : '';
    }
    if (x.status === 'accepted' && ROLE === 'team' && x.to === ME) {
      const e = entryOf(`b${x.k}`, ((D.private || {})[ME] || {})[`b${x.k}`]);
      body += e ? `<p class="offer-clue">${e.text}</p><p class="small">Guardada en su libreta. ¿Será verdadera? 🔎</p>` : '<p class="small">Abriendo el sobre…</p>';
    } else if (x.status === 'accepted') {
      body += `<p class="small">Sobre entregado${x.price ? ` y ${x.price} ❤ cobrados` : ''}.</p>`;
    } else if (x.status === 'open' && ROLE === 'team' && x.to === ME) {
      const poor = score(ME) < (x.price || 0), wait = pendingAcc.has(x.k);
      body += `<div class="row"><button class="btn sm red" data-acc="${x.k}" ${poor || wait ? 'disabled' : ''}>${wait ? 'Procesando…' : 'Comprar'}</button><button class="btn sm ghost" data-rej="${x.k}" ${wait ? 'disabled' : ''}>Rechazar</button>${poor ? '<span class="small warn">No les alcanzan los corazones</span>' : ''}</div>`;
    }
    return `<div class="msg offer ${x.from === ME ? 'out' : ''}">${head}<div class="msg-stamp ${x.status === 'accepted' ? 'ok' : x.status === 'open' ? 'pay' : 'no'}">${OFFER_STATUS[x.status] || ''}</div>${body}</div>`;
  }
  const QUIET = `<b>Mercado en silencio:</b> se negocia <b>por escrito</b>, sin hablar de mesa a mesa. Se venden <b>sobres con pistas</b>: nadie sabe si son verdaderas. Cada equipo tiene ${MSG_CAP} mensajes libres y 🔎 ${LUPAS} lupas.`;
  SC.market = () => {
    const endsAt = st().endsAt || Net.now() + MARKET_SECS * 1000;
    if (ROLE === 'host') {
      makeDecoys();
      const root = view(`<h1 class="comic-title center">${icon('shaking-hands')} Mercado de Pistas</h1>
        <div class="host-live"><div class="col center"><div id="ck"></div>${caption(`${icon('silence')} ${QUIET}`)}
          ${caption('Cada equipo recibió <b>2 señuelos</b>: sobres con pistas <b>falsas</b> para vender. Una pista falsa siempre descarta al verdadero culpable: si al tachar no queda nadie, alguna es falsa.')}</div>
        <div class="col"><h3 class="comic-h">Lo que circula (vista del moderador)</h3><div class="msg-feed" id="mf"></div></div></div>`, { wide: true });
      const paint = () => { const all = marketItems(); $('#mf', root).innerHTML = all.length ? all.slice(-40).reverse().map(itemHTML).join('') : '<p class="muted">Aún no hay movimientos.</p>'; };
      paint(); refresh = paint;
      clock($('#ck', root), endsAt, MARKET_SECS, { size: 160 });
      hostCtrl(`<span class="ctrl-label">Mercado</span><button class="btn red" id="h-n">¡Hora de acusar! ▶</button>`, dock => { $('#h-n', dock).onclick = () => pub({ scene: 'accuse' }); });
      return;
    }
    const others = teamsList().filter(t => t.id !== ME);
    const root = view(`<h1 class="comic-title center">${icon('shaking-hands')} Mercado de Pistas</h1>
      ${caption(`${icon('silence')} ${QUIET}`)}
      <div class="market">
        <div class="col" id="bd">${boardHTML()}</div>
        <div class="col">
          <div class="pnl send-box"><div class="row" style="justify-content:space-between"><h3 class="comic-h">Negociar con otro equipo</h3><div id="ck"></div></div>
            <div class="to-pick">${others.map((t, i) => `<button class="to ${i === 0 ? 'sel' : ''}" data-t="${t.id}" style="--tc:${t.color}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div>
            <div class="tabs"><button class="tab sel" data-tab="offer">${icon('love-letter')} Vender un sobre</button><button class="tab" data-tab="text">${icon('chat-bubble')} Mensaje libre (<span id="left">${MSG_CAP}</span>)</button></div>
            <div class="tab-body" id="tb"></div>
          </div>
          ${caption('🧠 <b>Para detectar una falsa:</b> usen la lupa en las pistas compradas, o crucen datos: una pista falsa siempre descarta al verdadero culpable.', 'small-cap')}
          <h3 class="comic-h">Bandeja</h3><div class="msg-feed" id="mf"></div>
        </div>
      </div>`, { wide: true });
    bindBoard(root);
    clock($('#ck', root), endsAt, MARKET_SECS, { size: 70 });
    let to = others[0] && others[0].id, tab = 'offer', sel = 0, price = 100;
    const msgsLeft = () => MSG_CAP - marketItems().filter(x => x.type === 'msg' && x.from === ME).length;
    const label = c => (c.kind === 'decoy' ? '🎭 Señuelo (pista FALSA sellada)' : c.kind === 'won' ? `✅ Pista ganada en ${district(c.mid) ? district(c.mid).name : '—'}` : `🛒 Pista comprada a ${team(c.from) ? esc(team(c.from).name) : '—'}`);
    const paintTab = () => {
      const tb = $('#tb', root);
      if (tab === 'offer') {
        const cl = myClues(); sel = Math.min(sel, Math.max(0, cl.length - 1));
        tb.innerHTML = cl.length ? `<p class="small">Elijan qué sobre vender y a qué precio. El otro equipo <b>no sabrá</b> si es verdadera o un señuelo hasta abrirla (y quizá ni así).</p>
          ${cl.map((c, i) => `<button class="clue-share ${i === sel ? 'sel' : ''}" data-i="${i}"><small>${label(c)}</small>${c.kind === 'decoy' ? '<i>Contenido sellado</i>' : c.text}</button>`).join('')}
          <div class="row"><span>Precio:</span><div class="seg">${PRICES.map(p => `<button class="${p === price ? 'sel' : ''}" data-p="${p}">${p || 'Gratis'}</button>`).join('')}</div></div>
          <button class="btn red" id="of">Ofrecer el sobre</button>`
          : '<p class="small">Todavía no tienen pistas. Esperen ofertas o pídanlas con un mensaje libre.</p>';
        $$('.clue-share', tb).forEach(b => (b.onclick = () => { sel = +b.dataset.i; paintTab(); }));
        $$('[data-p]', tb).forEach(b => (b.onclick = () => { price = +b.dataset.p; paintTab(); }));
        const of = $('#of', tb);
        if (of) of.onclick = () => {
          if (!to) return toast('No hay otros equipos');
          const c = cl[sel];
          if (marketItems().some(x => x.type === 'offer' && x.from === ME && x.to === to && x.key === c.key && x.status === 'open')) return toast('Ya le ofrecieron ese sobre a ese equipo');
          R.push('market/offers', { from: ME, to, key: c.key, price, status: 'open', at: Net.now() });
          sfx.pop(); toast('Sobre ofrecido');
        };
      } else {
        const left = msgsLeft();
        tb.innerHTML = left > 0 ? `<p class="small">Pidan, propongan, presuman... o mientan. Les quedan <b>${left}</b>.</p>
          <textarea id="mt" maxlength="160" placeholder="Tenemos la pista que descarta a la Dra. Viral. ¿150 ❤?"></textarea><button class="btn red" id="ms">Enviar mensaje</button>`
          : '<p class="small warn">Ya usaron sus mensajes libres. Sigan negociando con sobres.</p>';
        const ms = $('#ms', tb);
        if (ms) ms.onclick = () => {
          const v = $('#mt', tb).value.trim(); if (!v) return;
          if (!to) return toast('No hay otros equipos');
          if (msgsLeft() <= 0) return paintTab();
          R.push('market/msgs', { from: ME, to, text: v.slice(0, 160), at: Net.now() });
          sfx.pop(); toast('Mensaje enviado'); setTimeout(paintTab, 300);
        };
      }
    };
    $$('.to', root).forEach(b => (b.onclick = () => { to = b.dataset.t; $$('.to', root).forEach(x => x.classList.toggle('sel', x === b)); }));
    $$('.tab', root).forEach(b => (b.onclick = () => { tab = b.dataset.tab; $$('.tab', root).forEach(x => x.classList.toggle('sel', x === b)); paintTab(); }));
    paintTab();
    let seen = -1, sigBoard = boardSig(), sig = '';
    const paint = () => {
      const mine = marketItems().filter(x => x.to === ME || x.from === ME);
      mine.forEach(x => { if (x.type === 'offer' && x.status !== 'open') pendingAcc.delete(x.k); });
      const inbound = mine.filter(x => x.to === ME).length;
      if (seen >= 0 && inbound > seen) sfx.pop();
      seen = inbound;
      $('#left', root).textContent = Math.max(0, msgsLeft());
      const s2 = JSON.stringify(mine.map(x => [x.k, x.status])) + [...pendingAcc].join() + score(ME) + myClues().length;
      if (s2 !== sig) {
        sig = s2;
        $('#mf', root).innerHTML = mine.length ? mine.slice().reverse().map(itemHTML).join('') : '<p class="muted">Aún no hay movimientos.</p>';
        $$('[data-acc]', root).forEach(b => (b.onclick = () => { pendingAcc.add(b.dataset.acc); R.push('in', { k: 'accept', offer: b.dataset.acc, by: ME }); sfx.stamp(); paint(); }));
        $$('[data-rej]', root).forEach(b => (b.onclick = () => { R.set(`market/offers/${b.dataset.rej}/status`, 'rejected'); sfx.click(); }));
      }
      const sb = boardSig();
      if (sb !== sigBoard) {
        const more = sb.split('|')[0] > sigBoard.split('|')[0];
        sigBoard = sb; if (more) sfx.reveal();
        $('#bd', root).innerHTML = boardHTML(); bindBoard($('#bd', root));
        if (tab === 'offer') paintTab();
      }
    };
    paint(); refresh = paint;
  };

  /* ---------------- ACUSACIÓN ---------------- */
  SC.accuse = () => {
    if (ROLE === 'host') {
      const root = view(`<h1 class="comic-title center">${icon('handcuffs')} La acusación</h1>${caption('Cada equipo elige en secreto al culpable desde su computadora.')}<div id="stt" class="mt"></div>`);
      const paint = () => { $('#stt', root).innerHTML = teamsList().map(t => `<div class="bar-row" style="--tc:${t.color}">${teamTag(t)}<b>${(D.accus || {})[t.id] ? '✔ acusó' : '<span class="playing">deliberando…</span>'}</b></div>`).join(''); };
      paint(); refresh = paint;
      hostCtrl(`<span class="ctrl-label">Acusación</span><button class="btn red" id="h-n">Desenmascarar al culpable ▶</button>`, dock => {
        $('#h-n', dock).onclick = () => {
          const missing = teamsList().filter(t => !(D.accus || {})[t.id]);
          const go = () => pub({ scene: 'reveal', reveal: { culprit: H.culprit, at: Net.now(), fakes: [...fakeSet()] } });
          missing.length ? ask(`${missing.map(t => esc(t.name)).join(', ')} aún no acusa. ¿Revelar igual?`, go, 'Revelar') : go();
        };
      });
      return;
    }
    const mine = (D.accus || {})[ME];
    const root = view(`<h1 class="comic-title center">${icon('handcuffs')} ¿Quién robó el Cristal?</h1>
      ${caption(mine ? `Acusaron a <b>${suspect(mine).name}</b>. Pueden cambiar de opinión hasta que el moderador revele.` : `Toquen la foto del culpable. Su elección es secreta.${capOf(ME) ? ` Decide el equipo y confirma <b>⭐ ${esc(capOf(ME))}</b>.` : ''}`)}
      <div class="accuse-row">${SUSPECTS.map((s, i) => `<button class="acc ${mine === s.id ? 'sel' : ''}" data-s="${s.id}">${polaroid(s, { cross: true, i })}</button>`).join('')}</div>`, { wide: true });
    $$('.acc', root).forEach(b => (b.onclick = () => { R.set(`accus/${ME}`, b.dataset.s); sfx.stamp(); }));
    refresh = () => { if ((D.accus || {})[ME] !== mine) { lastKey = null; sync(); } };
  };

  /* ---------------- REVELACIÓN ---------------- */
  SC.reveal = () => {
    const rv = st().reveal || {}, culprit = suspect(rv.culprit), accus = D.accus || {};
    if (!culprit) return;
    const root = view(`<h1 class="comic-title center" id="rt">El ladrón del Cristal es...</h1>
      <div class="reveal-row">${SUSPECTS.map((s, i) => `<div class="rv" data-s="${s.id}">${polaroid(s, { i })}
        <div class="rv-votes">${teamsList().filter(t => accus[t.id] === s.id).map(t => `<span title="${esc(t.name)}">${t.emoji}</span>`).join('')}</div></div>`).join('')}</div>
      <div id="conf"></div>`, { wide: true });
    const order = shuffle(SUSPECTS.filter(s => s.id !== rv.culprit).map(s => s.id), 7);
    order.forEach((sid, i) => later(() => { const el = $(`.rv[data-s="${sid}"]`, root); el.classList.add('innocent'); el.insertAdjacentHTML('beforeend', '<div class="rv-stamp ok">INOCENTE</div>'); sfx.drum(); }, 1200 + i * 1100));
    later(() => {
      const el = $(`.rv[data-s="${rv.culprit}"]`, root);
      el.classList.add('guilty'); el.insertAdjacentHTML('beforeend', '<div class="rv-stamp bad">¡CULPABLE!</div>');
      $('#rt', root).innerHTML = `¡${culprit.name}!`;
      sfx.stamp(); setTimeout(sfx.fanfare, 300); confetti(220); shake();
    }, 1200 + order.length * 1100 + 900);
    later(() => {
      const winners = teamsList().filter(t => accus[t.id] === rv.culprit);
      const me = ROLE === 'team' ? `<div class="burst-line">${accus[ME] === rv.culprit ? burst('¡ACERTARON! +500', '#2ec4b6') : burst('¡FALLARON!', '#d7263d')}</div>` : '';
      const fk = fakeSet(), bought = ROLE === 'team' ? myClues().filter(c => c.kind === 'bought') : [];
      const truthHTML = bought.length ? `<div class="pnl truth-box"><h3 class="comic-h">${icon('magnifying-glass')} Las pistas que compraron</h3>${bought.map(c => `<div class="truth-row ${fk.has(c.ref) ? 'no' : 'ok'}"><span class="truth ${fk.has(c.ref) ? 'no' : 'ok'}">${fk.has(c.ref) ? 'FALSA' : 'VERDADERA'}</span><span>${c.text}</span><small>de ${team(c.from) ? esc(team(c.from).name) : '—'}</small></div>`).join('')}</div>` : '';
      $('#conf', root).innerHTML = `${me}<div class="speech">“${culprit.confession}”<span class="speech-who">— ${culprit.name}</span></div>${truthHTML}
        ${caption(winners.length ? `Acertaron: ${winners.map(t => teamTag(t)).join(' ')} <b>+500 ❤</b>` : '¡Nadie acertó! El culpable casi se sale con la suya...')}`;
      if (ROLE === 'host' && !H.revealed) {
        H.revealed = true; saveH();
        winners.forEach(t => { award(t.id, 500); R.set(`badges/${t.id}/detective`, true); });
      }
      focus($('#conf', root));
    }, 1200 + order.length * 1100 + 3200);
    hostCtrl(`<span class="ctrl-label">Revelación</span><button class="btn red" id="h-n">Ranking final ▶</button>`, dock => { $('#h-n', dock).onclick = () => pub({ scene: 'final' }); });
  };

  /* ---------------- REPORTE DE OPORTUNIDADES ----------------
     Reúne lo que midió la dinámica: precisión por política, tiempo por decisión,
     decisiones del Consejo y desempeño por integrante (si hubo rotación). */
  const polLabel = k => (k === 'none' ? 'Contenido permitido (NO ACTION)' : k === 'legit' ? 'Mensajes reales (falsos positivos)' : policy(k) ? policy(k).en : k);
  const pct = (ok, n) => (n ? Math.round(ok / n * 100) : null);
  const oppsOf = (pol, min = 2) => Object.entries(pol || {}).map(([k, v]) => ({ k, ok: v[0] || 0, bad: v[1] || 0, n: (v[0] || 0) + (v[1] || 0) }))
    .filter(x => x.n >= min && x.bad > 0).map(x => ({ ...x, acc: pct(x.ok, x.n) })).sort((a, b) => a.acc - b.acc || b.bad - a.bad);
  function teamReport(t) {
    const r = { t, pol: {}, n: 0, ok: 0, ms: 0, nms: 0, mem: {}, chain: null, scan: null, missing: [], council: [] };
    Object.entries(D.res || {}).forEach(([key, byTeam]) => {
      const res = (byTeam || {})[t.id]; if (!res) return;
      const mid = key.split('-')[0], s = res.stats || {}, d = s.detail || {};
      Object.entries(d.pol || {}).forEach(([p, v]) => { r.pol[p] = r.pol[p] || [0, 0]; r.pol[p][0] += v[0] || 0; r.pol[p][1] += v[1] || 0; });
      r.n += d.n || 0; r.ok += d.ok || 0;
      r.ms += d.ms || 0; r.nms += d.nms || 0;
      const game = s.game || (district(mid) ? district(mid).game : '');
      (Array.isArray(d.mem) ? d.mem : Object.values(d.mem || {})).forEach(m => {
        if (!m || !m.name || !m.n) return;
        const a = r.mem[m.name] = r.mem[m.name] || { n: 0, ok: 0, ms: 0, nms: 0 };
        a.n += m.n; a.ok += m.ok || 0;
        a.ms += m.ms || 0; a.nms += m.nms || 0;
      });
      if (game === 'chain' && s.health != null) r.chain = s.health;
      if (game === 'scanner' && s.found != null) { r.scan = s.found; r.missing = Array.isArray(s.missing) ? s.missing : Object.values(s.missing || {}); }
    });
    Object.entries(D.council || {}).forEach(([key, c]) => {
      const cs = Content.CASES.find(x => x.id === key.slice(key.lastIndexOf('-') + 1)), a = ((c || {}).ans || {})[t.id];
      if (cs && a) r.council.push({ title: cs.title, ok: a.dec === cs.verdict, dec: a.dec, right: cs.verdict, policies: cs.policies });
    });
    r.acc = pct(r.ok, r.n); r.aht = r.nms ? r.ms / r.nms / 1000 : null;
    const fk = fakeSet(), bought = notebook(t.id).filter(e => e.kind === 'bought');
    r.bought = bought.length; r.fakeBought = bought.filter(e => fk.has(e.ref)).length;
    r.opps = oppsOf(r.pol); if (!r.opps.length) r.opps = oppsOf(r.pol, 1);
    return r;
  }
  function reportData() {
    const teams = teamsList().map(teamReport), pol = {};
    teams.forEach(r => Object.entries(r.pol).forEach(([p, v]) => { pol[p] = pol[p] || [0, 0]; pol[p][0] += v[0]; pol[p][1] += v[1]; }));
    const council = {};
    teams.forEach(r => r.council.forEach(c => { const a = council[c.title] = council[c.title] || { ok: 0, n: 0, right: c.right, policies: c.policies }; a.n++; if (c.ok) a.ok++; }));
    return { teams, pol, opps: oppsOf(pol), council };
  }
  const accBar = a => `<span class="acc-bar"><i style="width:${a}%;background:${a >= 80 ? '#2ec4b6' : a >= 60 ? '#ffcf33' : '#d7263d'}"></i></span><b>${a}%</b>`;
  function reportHTML(data) {
    const allPol = Object.entries(data.pol).map(([k, v]) => ({ k, ok: v[0], bad: v[1], n: v[0] + v[1], acc: pct(v[0], v[0] + v[1]) })).sort((a, b) => a.acc - b.acc);
    const cases = Object.entries(data.council);
    return `<div class="report">
      <div class="kicker">Sala ${CODE} · ${new Date().toLocaleDateString('es')}</div>
      <h2 class="comic-h">${icon('files')} Reporte de oportunidades</h2>
      <p>Resumen de lo que midió la dinámica. Las políticas con <b>menor precisión</b> son las oportunidades a reforzar en el feedback. Todo el contenido del juego es ficticio.</p>
      <h3 class="dist-h" style="--dc:#ffcf33">Oportunidades del grupo, por política</h3>
      ${allPol.length ? `<table class="rep-table"><tr><th>Política</th><th>Decisiones</th><th>Errores</th><th>Precisión</th></tr>
        ${allPol.map(x => `<tr><td>${polLabel(x.k)}</td><td>${x.n}</td><td>${x.bad}</td><td class="acc-cell">${accBar(x.acc)}</td></tr>`).join('')}</table>` : '<p class="muted">Aún no hay decisiones registradas.</p>'}
      ${cases.length ? `<h3 class="dist-h" style="--dc:#ff5d8f">Casos del Consejo</h3><table class="rep-table"><tr><th>Caso</th><th>Decisión correcta</th><th>Equipos que acertaron</th></tr>
        ${cases.map(([title, c]) => `<tr><td>${title}<br><small>${c.policies.map(id => policy(id).en).join(' · ')}</small></td><td>${DECISIONS[c.right].label}</td><td>${c.ok} de ${c.n}</td></tr>`).join('')}</table>` : ''}
      <h3 class="dist-h" style="--dc:#3a86ff">Por equipo</h3>
      <div class="rep-teams">${data.teams.map(r => { const mem = Object.entries(r.mem); const cOk = r.council.filter(c => c.ok).length; return `<div class="rep-team" style="--tc:${r.t.color}">
        <div class="rep-head">${teamTag(r.t)}${capOf(r.t.id) ? `<span class="small">⭐ Capitán: <b>${esc(capOf(r.t.id))}</b></span>` : ''}<span class="small">${score(r.t.id)} ❤</span></div>
        <div class="kpis">
          <span><small>PRECISIÓN</small><b>${r.acc != null ? r.acc + '%' : '—'}</b></span>
          <span><small>TIEMPO POR DECISIÓN</small><b>${r.aht != null ? fmtS(r.aht) : '—'}</b></span>
          <span><small>CONSEJO</small><b>${r.council.length ? `${cOk}/${r.council.length}` : '—'}</b></span>
          <span><small>RED SANA</small><b>${r.chain != null ? r.chain + '%' : '—'}</b></span>
          <span><small>PISTAS FALSAS COMPRADAS</small><b>${r.bought ? `${r.fakeBought}/${r.bought}` : '—'}</b></span>
          <span><small>ESCÁNER</small><b>${r.scan != null ? `${r.scan}/${Object.keys(prof().riskLabels).length}` : '—'}</b></span>
        </div>
        ${r.opps.length ? `<p><b>A reforzar:</b> ${r.opps.slice(0, 3).map(o => `${polLabel(o.k)} (${o.acc}%, ${o.bad} error${o.bad === 1 ? '' : 'es'})`).join(' · ')}</p>` : `<p><b>A reforzar:</b> ${r.n ? 'sin errores en las políticas medidas.' : 'sin datos todavía.'}</p>`}
        ${r.council.filter(c => !c.ok).length ? `<p><b>Consejo:</b> ${r.council.filter(c => !c.ok).map(c => `«${c.title}»: eligieron ${DECISIONS[c.dec] ? DECISIONS[c.dec].label : c.dec}, era ${DECISIONS[c.right].label}`).join(' · ')}</p>` : ''}
        ${r.missing.length ? `<p><b>Privacidad, no detectaron:</b> ${r.missing.join(', ')}</p>` : ''}
        ${mem.length ? `<table class="rep-table sm"><tr><th>Integrante</th><th>Decisiones</th><th>Precisión</th><th>Tiempo por decisión</th></tr>
          ${mem.map(([name, a]) => `<tr><td>${who(name, r.t.id)}</td><td>${a.n}</td><td class="acc-cell">${accBar(pct(a.ok, a.n))}</td><td>${a.nms ? fmtS(a.ms / a.nms / 1000) : '—'}</td></tr>`).join('')}</table>` : ''}
      </div>`; }).join('')}</div>
      <p class="small muted">Precisión = decisiones correctas / decisiones tomadas en los minijuegos de moderación y en Caza de Anzuelos. El tiempo por decisión se mide en los minijuegos de moderación (Feed, Archivo y Duelo).</p>
    </div>`;
  }
  function reportText(data) {
    const L = [`REPORTE DE OPORTUNIDADES · Sala ${CODE} · ${new Date().toLocaleDateString('es')}`, '', 'OPORTUNIDADES DEL GRUPO (menor precisión primero)'];
    Object.entries(data.pol).map(([k, v]) => ({ k, n: v[0] + v[1], bad: v[1], acc: pct(v[0], v[0] + v[1]) })).sort((a, b) => a.acc - b.acc)
      .forEach(x => L.push(`- ${polLabel(x.k)}: ${x.acc}% de precisión (${x.bad} errores en ${x.n} decisiones)`));
    Object.entries(data.council).forEach(([title, c], i) => { if (!i) L.push('', 'CASOS DEL CONSEJO'); L.push(`- ${title}: correcta ${DECISIONS[c.right].label}; acertaron ${c.ok} de ${c.n} equipos`); });
    data.teams.forEach(r => {
      L.push('', `EQUIPO ${r.t.name}${capOf(r.t.id) ? ` (capitán: ${capOf(r.t.id)})` : ''} · ${score(r.t.id)} corazones`);
      L.push(`- Precisión: ${r.acc != null ? r.acc + '%' : 's/d'} · Tiempo por decisión: ${r.aht != null ? fmtS(r.aht) : 's/d'} · Consejo: ${r.council.length ? `${r.council.filter(c => c.ok).length}/${r.council.length}` : 's/d'}`);
      if (r.opps.length) L.push(`- A reforzar: ${r.opps.slice(0, 3).map(o => `${polLabel(o.k)} (${o.acc}%)`).join(', ')}`);
      if (r.missing.length) L.push(`- Privacidad, no detectaron: ${r.missing.join(', ')}`);
      Object.entries(r.mem).forEach(([name, a]) => L.push(`  · ${name}: ${a.n} decisiones, ${pct(a.ok, a.n)}% de precisión${a.nms ? `, ${fmtS(a.ms / a.nms / 1000)} por decisión` : ''}`));
    });
    return L.join('\n');
  }
  function reportCSV(data) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['seccion', 'equipo', 'nombre', 'decisiones', 'aciertos', 'precision_pct', 'tiempo_por_decision_s']];
    Object.entries(data.pol).forEach(([k, v]) => rows.push(['grupo_politica', '', polLabel(k), v[0] + v[1], v[0], pct(v[0], v[0] + v[1]), '']));
    data.teams.forEach(r => {
      rows.push(['equipo', r.t.name, '', r.n, r.ok, r.acc ?? '', r.aht != null ? r.aht.toFixed(2) : '']);
      Object.entries(r.pol).forEach(([k, v]) => rows.push(['equipo_politica', r.t.name, polLabel(k), v[0] + v[1], v[0], pct(v[0], v[0] + v[1]), '']));
      Object.entries(r.mem).forEach(([name, a]) => rows.push(['integrante', r.t.name, name, a.n, a.ok, pct(a.ok, a.n), a.nms ? (a.ms / a.nms / 1000).toFixed(2) : '']));
      r.council.forEach(c => rows.push(['consejo', r.t.name, c.title, 1, c.ok ? 1 : 0, c.ok ? 100 : 0, '']));
    });
    return '﻿' + rows.map(r => r.map(q).join(',')).join('\n');
  }
  function openReport() {
    const data = reportData();
    const m = modal(`${reportHTML(data)}<div class="row center mt report-actions">
      <button class="btn" id="rc">Copiar como texto</button><button class="btn ghost" id="rd">Descargar CSV</button><button class="btn ghost" id="rp">Imprimir / PDF</button></div>`);
    $('#rc', m).onclick = async () => { try { await navigator.clipboard.writeText(reportText(data)); toast('Reporte copiado'); } catch (e) { toast('No se pudo copiar: usen Imprimir o CSV'); } };
    $('#rd', m).onclick = () => {
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([reportCSV(data)], { type: 'text/csv;charset=utf-8' }));
        a.download = `reporte-oportunidades-${CODE}.csv`; document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { toast('No se pudo descargar'); }
    };
    $('#rp', m).onclick = () => { try { window.print(); } catch (e) { toast('No se pudo imprimir'); } };
  }

  /* ---------------- FINAL ---------------- */
  SC.final = () => {
    const ranked = teamsList().sort((a, b) => score(b.id) - score(a.id));
    const pod = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
    const mine = ROLE === 'team' ? teamReport(myTeam()) : null;
    view(`<div class="final"><div class="cover-crystal">${Art.crystal([], 150, { all: true })}</div>
      <h1 class="cover-title sm">¡Caso cerrado!</h1>
      ${caption('El Cristal de la Confianza brilla otra vez sobre Nexópolis gracias a la Liga de Guardianes.')}
      <div class="podium">${pod.map(t => { const r = ranked.indexOf(t); return `<div class="pl" style="--tc:${t.color}"><div class="big-badge sm" style="--tc:${t.color}">${t.emoji}</div><b>${esc(t.name)}</b><span>${score(t.id)} ❤</span>
        <div class="badges-row">${badgesOf(t.id).map(b => badgeHTML(b, true)).join('')}</div><div class="bar h${r}">#${r + 1}</div></div>`; }).join('')}</div>
      ${ranked.length > 3 ? `<div class="row center">${ranked.slice(3).map((t, i) => `<span class="ttag" style="--tc:${t.color}"><i>#${i + 4}</i>${esc(t.name)} · ${score(t.id)} ❤</span>`).join('')}</div>` : ''}
      ${mine ? `<div class="pnl my-opps"><h3 class="comic-h">${icon('magnifying-glass')} Sus oportunidades</h3>
        <div class="kpis"><span><small>PRECISIÓN</small><b>${mine.acc != null ? mine.acc + '%' : '—'}</b></span><span><small>TIEMPO POR DECISIÓN</small><b>${mine.aht != null ? fmtS(mine.aht) : '—'}</b></span>
          <span><small>CONSEJO</small><b>${mine.council.length ? `${mine.council.filter(c => c.ok).length}/${mine.council.length}` : '—'}</b></span></div>
        ${mine.opps.length ? `<p>Las políticas que más les costaron. ¡Repásenlas juntos!</p><div class="codex">${mine.opps.slice(0, 3).map((o, i) => (policy(o.k) ? polCard(policy(o.k), false, i * .15).replace('<div class="pd">', `<div class="psens">${o.acc}% de precisión · ${o.bad} error${o.bad === 1 ? '' : 'es'}</div><div class="pd">`) : `<div class="pol-card" style="--pc:#2ec4b6"><div class="pen">${polLabel(o.k)}</div><div class="psens">${o.acc}% de precisión</div><div class="pd">Marcaron como infracción contenido que estaba permitido. Ante la duda, relean el contexto.</div></div>`)).join('')}</div>` : '<p>¡Sin errores repetidos! Excelente criterio.</p>'}
      </div>` : ''}
      <h3 class="comic-h center mt">Los 5 valores que hoy defendimos</h3>
      <div class="values5">${DISTRICTS.map(d => `<div class="pnl" style="--dc:${d.color}">${icon(d.ico)}<h4>${LESSONS[d.id].value}</h4><p>${LESSONS[d.id].text}</p></div>`).join('')}</div>
      <p class="disclaimer">Políticas oficiales y actualizadas: Centro de Transparencia de Meta (transparency.meta.com).</p></div>`, { wide: true });
    sfx.fanfare(); [0, 700, 1400].forEach(t => later(() => confetti(150, innerWidth * (.25 + Math.random() * .5), innerHeight * .3), t));
    hostCtrl(`<span class="ctrl-label">¡Fin!</span><button class="btn red" id="h-rep">Reporte de oportunidades</button><button class="btn ghost" id="h-new">Nueva partida</button>`, dock => {
      $('#h-rep', dock).onclick = openReport;
      $('#h-new', dock).onclick = () => ask('¿Crear una sala nueva? Esta partida terminará. (Descarguen antes el reporte)', () => { store.set('nx-host', null); location.href = location.pathname; }, 'Nueva sala');
    });
  };

  /* ================= Acciones del host ================= */
  function pub(patch) { return R.update('st', patch); }
  function award(tid, pts, mid) {
    if (!pts) return;
    if (mid) { H.mpts[mid] = H.mpts[mid] || {}; H.mpts[mid][tid] = (H.mpts[mid][tid] || 0) + pts; }
    const v = Math.max(0, score(tid) + pts);
    D.scores = { ...(D.scores || {}), [tid]: v };
    R.set(`scores/${tid}`, v);
    saveH();
  }
  function hostEvent(ev) {
    if (!ev) return;
    if (ev.k === 'accept') {
      const o = ((D.market || {}).offers || {})[ev.offer];
      if (!o || o.status !== 'open' || o.to !== ev.by || !team(o.from) || !team(o.to)) return;
      const e = entryOf(o.key, ((D.private || {})[o.from] || {})[o.key]), price = Math.max(0, Math.floor(o.price) || 0);
      const status = !e ? 'failed' : score(o.to) < price ? 'nofunds' : 'accepted';
      if (status === 'accepted') {
        award(o.to, -price); award(o.from, price);
        R.set(`private/${o.to}/b${ev.offer}`, { text: e.text, kind: 'bought', from: o.from, ref: e.ref || null, at: Net.now() });
      }
      R.set(`market/offers/${ev.offer}/status`, status);
    }
    if (ev.k === 'verify') {
      const e = entryOf(ev.key, ((D.private || {})[ev.by] || {})[ev.key]);
      const used = (D.lupas || {})[ev.by] || 0;
      if (!e || e.kind !== 'bought' || e.check || used >= LUPAS) return;
      D.lupas = { ...(D.lupas || {}), [ev.by]: used + 1 };
      R.set(`lupas/${ev.by}`, used + 1);
      R.set(`private/${ev.by}/${ev.key}/check`, (H.refs || {})[e.ref] === false ? 'fake' : 'real');
    }
  }
  let watchT = null;
  function hostWatch() {
    teamsList().forEach(t => { if ((D.scores || {})[t.id] == null) R.set(`scores/${t.id}`, 0); });
    const s = st(), m = s.m;
    clearTimeout(watchT);
    if (s.scene === 'mission' && m && m.phase === 'play') {
      const all = teamsList().length && teamsList().every(t => resOf(roundKey(m))[t.id]);
      const endPlus = wallEnd(m) + 8000;
      if (all || Net.now() > endPlus) watchT = setTimeout(() => { const c = st().m; if (c && c.phase === 'play' && c.round === m.round) goResults(district(m.id), c); }, all ? 1500 : 0);
      else watchT = setTimeout(sync, Math.max(1000, endPlus - Net.now() + 200));
    }
    if (s.scene === 'mission' && m && m.phase === 'vault') {
      const o = (D.vault || {})[roundKey(m)] || {};
      if (teamsList().length && teamsList().every(t => o[t.id])) watchT = setTimeout(() => vaultEnd(district(m.id), st().m), 1500);
    }
  }
  function openMenu() {
    const m = modal(`<h2 class="comic-h">${icon('police-badge')} Menú del moderador</h2><div class="menu-list">
      <button class="btn ghost" data-m="map">Ir al mapa</button>
      <button class="btn ghost" data-m="lobby">Mostrar el código de la sala</button>
      <button class="btn ghost" data-m="market">Saltar al Mercado de Pistas</button>
      <button class="btn ghost" data-m="score">Ajustar puntos</button>
      <button class="btn ghost" data-m="report">Reporte de oportunidades</button>
      <button class="btn red" data-m="new">Crear una sala nueva</button></div>`, { small: true });
    $$('[data-m]', m).forEach(b => (b.onclick = () => {
      const a = b.dataset.m; closeModal();
      if (a === 'map') pub({ scene: 'map', m: null, clue: null });
      if (a === 'lobby') pub({ scene: 'lobby' });
      if (a === 'market') pub({ scene: 'market', endsAt: Net.now() + MARKET_SECS * 1000, m: null });
      if (a === 'report') openReport();
      if (a === 'score') scoreEditor();
      if (a === 'new') ask('¿Crear una sala nueva? Esta partida terminará.', () => { store.set('nx-host', null); location.href = location.pathname; }, 'Nueva sala');
    }));
  }
  function scoreEditor() {
    const m = modal(`<h2 class="comic-h">Ajustar puntos</h2><div class="pick-list">${teamsList().map(t => `<div class="pick-row" style="--tc:${t.color}">${teamTag(t)}<b>${score(t.id)}</b>
      <span>${[-50, 50, 100].map(v => `<button class="btn sm ${v < 0 ? 'ghost' : ''}" data-t="${t.id}" data-v="${v}">${v > 0 ? '+' : ''}${v}</button>`).join('')}</span></div>`).join('')}</div>`, { small: true });
    $$('[data-v]', m).forEach(b => (b.onclick = () => { award(b.dataset.t, +b.dataset.v); closeModal(); setTimeout(scoreEditor, 300); }));
  }

  /* ================= Arranque ================= */
  $('#brand').onclick = () => { if (!CODE) home(); };
  $('#btn-codex').onclick = () => openCodex();
  $('#btn-board').onclick = openBoard;
  $('#btn-menu').onclick = openMenu;
  $('#btn-fs').onclick = () => { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) { /* sin pantalla completa */ } };
  $('#snd').onclick = () => { soundOn = !soundOn; store.set('nx-sound', soundOn); renderTop(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  const salaParam = (params.get('sala') || '').toUpperCase(), hostParam = (params.get('moderador') || '').toUpperCase();
  if (hostParam) enterHost(hostParam);
  else if (salaParam) enterTeam(salaParam);
  else home();
})();
