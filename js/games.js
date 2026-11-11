/* =========================================================
   MINIJUEGOS ARCADE — se juegan por turnos, un representante
   por equipo frente a la pantalla. Cada juego recibe un "api":
     api.arena            contenedor del juego
     api.add(pts,x,y,txt,color)  suma puntos + texto flotante
     api.combo(n)         muestra el combo
     api.shake()          sacude la pantalla
     api.sfx              efectos de sonido
     api.log(obj)         guarda errores para el repaso
     api.progress()       0 → 1 según el tiempo transcurrido
     api.end()            termina el turno antes de tiempo
     api.tempo            factor de ritmo (1 = normal, >1 = más tiempo para leer)
     api.rec({ok, policy, ms})  registra cada decisión para el reporte
     api.focus            políticas del distrito (para el generador de contenido)
     api.privacy          perfil del escáner (igual para toda la sala)
   Cada juego devuelve { stop(), onEnd?() }.
   ========================================================= */
const Games = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pol = id => POLICIES.find(p => p.id === id);

  /* Pausa global: se usa durante el "¡CAMBIO!" de integrante */
  let paused = false;
  const pause = v => { paused = !!v; };
  function loop(fn) {
    let alive = true, last = performance.now();
    (function f(now) {
      if (!alive) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!paused) fn(dt, now);
      requestAnimationFrame(f);
    })(last);
    return () => (alive = false);
  }
  function relPos(arena, el) {
    const a = arena.getBoundingClientRect(), r = el.getBoundingClientRect();
    return [r.left - a.left + r.width / 2, r.top - a.top + r.height / 2];
  }
  function burst(arena, x, y, color, n = 16) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      const a = Math.random() * Math.PI * 2, d = rnd(40, 120);
      p.className = 'pt';
      p.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;width:${rnd(6, 12)}px;height:${rnd(6, 12)}px`;
      arena.appendChild(p); setTimeout(() => p.remove(), 800);
    }
  }
  function floatText(arena, x, y, text, color = '#fff', big = false) {
    const el = document.createElement('div');
    el.className = 'ftx' + (big ? ' big' : '');
    el.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
    el.innerHTML = text; arena.appendChild(el); setTimeout(() => el.remove(), 1300);
  }

  /* ------------------------------------------------------------------
     1. FEED FRENÉTICO — moderar publicaciones con las flechas
     ------------------------------------------------------------------ */
  function feed(api) {
    const A = api.arena;
    const btn = k => `<button class="dec-btn" data-d="${k}" style="--dc:${DECISIONS[k].color}"><span class="kc">${DECISIONS[k].key}</span><b>${DECISIONS[k].label}</b></button>`;
    A.innerHTML = `<div class="feed-wrap two">${btn('delete')}<div class="feed-col"><div class="feed-stack"></div></div>${btn('noaction')}</div>`;
    const stack = A.querySelector('.feed-stack');
    const deck = Content.deck(70, { focus: api.focus || [] });
    let i = 0, combo = 0, cur = null;
    const st = { ok: 0, bad: 0, maxCombo: 0, ai: 0 };
    const others = d => Object.keys(DECISIONS).filter(k => k !== d);

    function spawn() {
      const p = deck[i++ % deck.length];
      const el = document.createElement('div');
      el.className = 'fcard';
      const showAi = Math.random() < .55, aiOk = Math.random() < .7;
      const aiDec = aiOk ? p.d : others(p.d)[0];
      el.innerHTML = `${p.appeal ? `<div class="fappeal">${icon('megaphone')} APELACIÓN DEL USUARIO: “${p.appeal}”</div>` : ''}
        <div class="fh"><span class="fav">${p.av}</span><div><b>@${p.u}</b><small>hace ${Math.ceil(rnd(1, 59))} min · reportado ${Math.ceil(rnd(2, 40))} veces</small></div><span class="fcase">CASO #${1000 + Math.floor(rnd(0, 8999))}</span></div>
        <div class="ftxt">${p.t}</div>
        ${showAi ? `<div class="fai">${icon('robot-antennas')} La IA asistente sugiere: <b>${DECISIONS[aiDec].label}</b> <small>(${Math.round(rnd(71, 97))}% segura)</small></div>` : ''}
        <div class="fbar"><i></i></div>`;
      stack.appendChild(el);
      cur = { p, el, bar: el.querySelector('.fbar i'), age: 0, life: Math.max(4.5, 9 - combo * .3 - api.progress() * 1.5) * (api.tempo || 1), showAi, aiDec };
    }
    function resolve(dec) {
      if (!cur || (dec && paused)) return;
      const { p, el, showAi, aiDec } = cur;
      api.rec({ ok: dec === p.d, policy: p.policy || 'none', ms: Math.round(cur.age * 1000) });
      cur = null;
      const [x, y] = relPos(A, el);
      const ok = dec === p.d;
      if (dec) {
        el.insertAdjacentHTML('beforeend', `<div class="fstamp" style="--dc:${DECISIONS[dec].color}">${DECISIONS[dec].label}</div>`);
        api.sfx.stamp();
      }
      el.classList.add(ok ? 'ok' : 'bad');
      setTimeout(() => el.classList.add('out', 'out-' + (dec || 'timeout')), dec ? 420 : 0);
      if (ok) {
        combo++; st.ok++; st.maxCombo = Math.max(st.maxCombo, combo);
        if (showAi && aiDec !== p.d) { st.ai++; floatText(A, x, y + 70, '🤖 ¡Le ganaste a la IA!', '#ffcf33'); }
        const pts = Math.min(100, 40 + (combo - 1) * 10);
        const label = p.d === 'delete' ? `✔ ${pol(p.policy).en}` : '✔ NO ACTION';
        api.add(pts, x, y - 60, `+${pts}<small>${label}</small>`, DECISIONS[p.d].color);
        burst(A, x, y, DECISIONS[p.d].color);
        api.sfx.pop(combo);
      } else {
        combo = 0; st.bad++;
        const why = `Era <b>${DECISIONS[p.d].label}</b>${p.d === 'delete' ? ` · ${pol(p.policy).en}` : ''}`;
        api.add(dec ? -30 : -20, x, y - 60, `${dec ? '✘' : '⏰ ¡Lento!'}<small>${why}</small>`, '#ff4d6d');
        api.shake(); api.sfx.err();
        api.log({ kind: 'post', text: p.t, right: p.d, policy: p.policy, why: p.why });
      }
      api.combo(combo);
      setTimeout(() => el.remove(), 1100);
      setTimeout(spawn, dec ? 650 : 250);
    }
    const keyMap = { ArrowLeft: 'delete', a: 'delete', A: 'delete', ArrowRight: 'noaction', d: 'noaction', D: 'noaction' };
    const onKey = e => {
      const k = keyMap[e.key]; if (!k) return;
      e.preventDefault();
      const b = A.querySelector(`.dec-btn[data-d="${k}"]`); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
      resolve(k);
    };
    document.addEventListener('keydown', onKey);
    A.querySelectorAll('.dec-btn').forEach(b => (b.onclick = () => resolve(b.dataset.d)));
    spawn();
    const stopLoop = loop(dt => {
      if (!cur) return;
      cur.age += dt;
      const f = cur.age / cur.life;
      cur.bar.style.transform = `scaleX(${Math.max(0, 1 - f)})`;
      cur.bar.style.background = f > .7 ? '#ff4d6d' : f > .45 ? '#ffd23f' : '#25d366';
      if (f >= 1) resolve(null);
    });
    return {
      stop() { stopLoop(); document.removeEventListener('keydown', onKey); cur = null; },
      stats: () => ({ ...st, badges: [st.bad === 0 && st.ok >= 8 && 'ojo', st.maxCombo >= 6 && 'racha', st.ai >= 3 && 'antiia'].filter(Boolean) }),
    };
  }

  /* ------------------------------------------------------------------
     2. CAZA DE ANZUELOS — tocar solo los mensajes de estafa
     ------------------------------------------------------------------ */
  function sea(api) {
    const A = api.arena;
    A.innerHTML = `<div class="sea">
      <div class="sea-sun"></div>
      <div class="sea-ship">🏴‍☠️<span>⛵</span></div>
      <div class="sea-layer"></div>
      <svg class="waves" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path class="w1" d="M0 80 Q150 40 300 80 T600 80 T900 80 T1200 80 V200 H0Z"/>
        <path class="w2" d="M0 110 Q150 70 300 110 T600 110 T900 110 T1200 110 V200 H0Z"/>
        <path class="w3" d="M0 140 Q150 105 300 140 T600 140 T900 140 T1200 140 V200 H0Z"/>
      </svg></div>`;
    const layer = A.querySelector('.sea-layer');
    const slots = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) slots.push({ r, c, busy: false });
    const pool = Content.sea(), scams = pool.scam, legit = pool.legit;
    let si = 0, li = 0, spawnT = .6, combo = 0;
    const alive = new Set();
    const st = { caught: 0, wrong: 0, escaped: 0 };

    function spawn() {
      const free = slots.filter(s => !s.busy); if (!free.length) return;
      const slot = free[Math.floor(Math.random() * free.length)]; slot.busy = true;
      const isScam = Math.random() < .55;
      const m = isScam ? scams[si++ % scams.length] : legit[li++ % legit.length];
      const el = document.createElement('button');
      el.className = 'bottle ' + (isScam ? 'scam' : 'legit');
      el.style.left = `${4 + slot.c * 24 + rnd(0, 4)}%`; el.style.top = `${10 + slot.r * 25 + rnd(0, 6)}%`;
      el.style.animationDelay = `${rnd(0, 1)}s`;
      el.innerHTML = `<div class="bm"><b>${icon('envelope')} ${m.from}</b><span>${m.text}</span></div>`;
      const life = lerp(6, 4.2, api.progress()) * (api.tempo || 1);
      const item = { el, slot, m, isScam, t: 0, life, done: false };
      el.onclick = () => hit(item);
      layer.appendChild(el); alive.add(item);
    }
    function kill(item, cls) {
      item.done = true; alive.delete(item); item.slot.busy = false;
      item.el.classList.add(cls); setTimeout(() => item.el.remove(), 450);
    }
    function hit(item) {
      if (item.done || paused) return;
      api.rec({ ok: item.isScam, policy: item.isScam ? item.m.policy : 'legit' });
      const [x, y] = relPos(A, item.el);
      if (item.isScam) {
        combo++; st.caught++;
        const pts = 40 + Math.min(4, combo - 1) * 5;
        api.add(pts, x, y - 40, `+${pts}<small>✔ ${pol(item.m.policy).en}</small>`, '#25d366');
        burst(A, x, y, '#ffd23f', 20); api.sfx.pop(combo); kill(item, 'caught');
      } else {
        combo = 0; st.wrong++;
        api.add(-40, x, y - 40, `✘ ¡Era real!<small>${item.m.from}</small>`, '#ff4d6d');
        api.shake(); api.sfx.err(); kill(item, 'wrong');
        api.log({ kind: 'msg', text: `${item.m.from}: ${item.m.text}`, right: 'legit' });
      }
      api.combo(combo);
    }
    spawn(); spawn();
    const stopLoop = loop(dt => {
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = lerp(1.25, .8, api.progress()) * (api.tempo || 1); }
      for (const it of [...alive]) {
        it.t += dt;
        if (it.t >= it.life) {
          if (it.isScam) {
            const [x, y] = relPos(A, it.el);
            combo = 0; api.combo(0); st.escaped++;
            api.rec({ ok: false, policy: it.m.policy });
            api.add(-15, x, y - 30, '🎣 ¡Se escapó!', '#ff8a3d');
            api.log({ kind: 'msg', text: `${it.m.from}: ${it.m.text}`, right: 'scam', policy: it.m.policy });
          }
          kill(it, 'sink');
        }
      }
    });
    return { stop() { stopLoop(); }, stats: () => ({ ...st, badges: st.caught >= 8 && !st.wrong ? ['pescador'] : [] }) };
  }

  /* ------------------------------------------------------------------
     3. ROMPE LA CADENA — frenar un rumor que se propaga por la red
     ------------------------------------------------------------------ */
  function chain(api) {
    const A = api.arena;
    A.innerHTML = `<canvas class="chain-cv"></canvas>
      <div class="chain-hud"><div class="energy"><span>🔋</span><div class="cells"></div></div>
      <div class="health">Red sana <b>100%</b></div></div>`;
    const cv = A.querySelector('canvas'), ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.width = A.clientWidth * dpr, H = cv.height = A.clientHeight * dpr;
    const cells = A.querySelector('.cells'), healthEl = A.querySelector('.health b');
    const N = 34, R = 17 * dpr, MAXE = 5;
    // nodos separados
    const nodes = [];
    let guard = 0;
    while (nodes.length < N && guard++ < 5000) {
      const x = rnd(70 * dpr, W - 70 * dpr), y = rnd(90 * dpr, H - 50 * dpr);
      if (nodes.every(n => Math.hypot(n.x - x, n.y - y) > 95 * dpr)) nodes.push({ x, y, s: 0, pulse: 0, nb: [] });
    }
    // aristas: 3 vecinos más cercanos
    const edges = new Set();
    nodes.forEach((n, i) => {
      nodes.map((m, j) => [j, Math.hypot(m.x - n.x, m.y - n.y)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([j]) => { const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!edges.has(k)) { edges.add(k); n.nb.push(j); nodes[j].nb.push(i); } });
    });
    const edgeList = [...edges].map(k => k.split('-').map(Number));
    let energy = MAXE, regen = 0, spreadT = 1.2;
    let pulses = [];
    const infect = i => { nodes[i].s = 1; nodes[i].pulse = 1; };
    const seed = () => { const clean = nodes.map((n, i) => i).filter(i => nodes[i].s === 0); if (clean.length) infect(clean[Math.floor(Math.random() * clean.length)]); };
    seed(); seed();
    const paintCells = () => { cells.innerHTML = Array.from({ length: MAXE }, (_, k) => `<i class="${k < energy ? 'on' : ''}"></i>`).join(''); };
    paintCells();

    const onClick = e => {
      if (paused) return;
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
      let best = -1, bd = 40 * dpr;
      nodes.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = i; } });
      if (best < 0) return;
      const n = nodes[best];
      if (n.s === 2) return;
      const px = n.x / dpr, py = n.y / dpr;
      if (energy < 1) { floatText(A, px, py - 30, '🔋 ¡Sin energía!', '#ffd23f'); api.sfx.err(); cells.classList.remove('flash'); void cells.offsetWidth; cells.classList.add('flash'); return; }
      energy--; paintCells();
      if (n.s === 1) { api.add(25, px, py - 34, '+25<small>✔ Corregido</small>', '#22d3ee'); burst(A, px, py, '#22d3ee', 18); }
      else { api.add(10, px, py - 34, '+10<small>🛡️ Verificado</small>', '#a5f3fc'); burst(A, px, py, '#a5f3fc', 10); }
      n.s = 2; n.pulse = 1; api.sfx.pop(2);
    };
    cv.addEventListener('pointerdown', onClick);

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      for (const [a, b] of edgeList) {
        const na = nodes[a], nb = nodes[b];
        ctx.strokeStyle = na.s === 1 && nb.s === 1 ? 'rgba(215,38,61,.9)' : na.s === 1 || nb.s === 1 ? 'rgba(215,38,61,.45)' : 'rgba(242,232,208,.22)';
        ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
      }
      for (const p of pulses) {
        const a = nodes[p.a], b = nodes[p.b], x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 18 * dpr; ctx.fillStyle = '#ff6b85';
        ctx.beginPath(); ctx.arc(x, y, 6 * dpr, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const n of nodes) {
        const wob = n.s === 1 ? Math.sin(now / 120 + n.x) * 2 * dpr : 0;
        if (n.s === 1) { ctx.fillStyle = 'rgba(255,77,109,.18)'; ctx.beginPath(); ctx.arc(n.x, n.y, R * (1.7 + .25 * Math.sin(now / 200)), 0, 7); ctx.fill(); }
        if (n.pulse > 0) { ctx.strokeStyle = n.s === 2 ? `rgba(34,211,238,${n.pulse})` : `rgba(255,77,109,${n.pulse})`; ctx.lineWidth = 3 * dpr; ctx.beginPath(); ctx.arc(n.x, n.y, R * (1 + (1 - n.pulse) * 2), 0, 7); ctx.stroke(); }
        ctx.fillStyle = n.s === 0 ? '#f2e8d0' : n.s === 1 ? '#d7263d' : '#2ec4b6';
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3 * dpr; ctx.beginPath(); ctx.arc(n.x + wob, n.y, R + 1.5 * dpr, 0, 7); ctx.stroke();
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = (n.s ? 16 : 6) * dpr;
        ctx.beginPath(); ctx.arc(n.x + wob, n.y, R, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.font = `${R * 1.1}px sans-serif`;
        ctx.fillText(n.s === 0 ? '🙂' : n.s === 1 ? '😱' : '✅', n.x + wob, n.y + dpr);
      }
    }
    const stopLoop = loop((dt, now) => {
      regen += dt;
      if (regen >= .8) { regen = 0; if (energy < MAXE) { energy++; paintCells(); } }
      nodes.forEach(n => { if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - dt * 1.5); });
      spreadT -= dt;
      if (spreadT <= 0) {
        spreadT = lerp(1.25, .65, api.progress()) * (api.tempo || 1);
        nodes.forEach((n, i) => { if (n.s === 1) n.nb.forEach(j => { if (nodes[j].s === 0 && Math.random() < .5 && !pulses.some(p => p.b === j)) pulses.push({ a: i, b: j, t: 0 }); }); });
      }
      pulses = pulses.filter(p => {
        p.t += dt * 1.6;
        if (p.t < 1) return true;
        const tgt = nodes[p.b];
        if (tgt.s === 0) { infect(p.b); api.sfx.tick(); }
        else if (tgt.s === 2) floatText(A, tgt.x / dpr, tgt.y / dpr - 30, '🛡️', '#22d3ee');
        return false;
      });
      if (!nodes.some(n => n.s === 1) && !pulses.length) {
        api.add(100, W / dpr / 2, H / dpr / 2, '¡Rumor contenido!<small>+100</small>', '#22d3ee', true);
        burst(A, W / dpr / 2, H / dpr / 2, '#22d3ee', 30);
        seed();
      }
      const healthy = nodes.filter(n => n.s !== 1).length / nodes.length;
      healthEl.textContent = `${Math.round(healthy * 100)}%`;
      healthEl.style.color = healthy > .66 ? '#7ddf64' : healthy > .4 ? '#ffd23f' : '#ff4d6d';
      draw(now);
    });
    return {
      stop() { stopLoop(); cv.removeEventListener('pointerdown', onClick); },
      stats: () => { const hp = nodes.filter(n => n.s !== 1).length / nodes.length; return { health: Math.round(hp * 100), badges: hp >= .75 ? ['cortafuego'] : [] }; },
      onEnd() {
        const healthy = nodes.filter(n => n.s !== 1).length;
        const pts = healthy * 10;
        api.add(pts, W / dpr / 2, H / dpr / 2, `Red sana: ${Math.round(healthy / nodes.length * 100)}%<small>+${pts} de bonus</small>`, '#7ddf64', true);
      },
    };
  }

  /* ------------------------------------------------------------------
     4. ESCÁNER DE PRIVACIDAD — linterna sobre un perfil oculto
     ------------------------------------------------------------------ */
  function scanner(api, profileHTML) {
    const A = api.arena, PV = api.privacy;
    A.innerHTML = `<div class="scan"><div class="scan-layer dark">${profileHTML}</div><div class="scan-layer lit">${profileHTML}</div>
      <div class="lens"></div><div class="scan-found"></div></div>`;
    const sc = A.querySelector('.scan'), lit = A.querySelector('.lit'), foundBox = A.querySelector('.scan-found');
    const total = Object.keys(PV.riskLabels).length, found = new Set();
    const move = e => { const r = sc.getBoundingClientRect(); sc.style.setProperty('--mx', `${e.clientX - r.left}px`); sc.style.setProperty('--my', `${e.clientY - r.top}px`); };
    sc.addEventListener('pointermove', move);
    sc.style.setProperty('--mx', '50%'); sc.style.setProperty('--my', '40%');
    lit.addEventListener('click', e => {
      const el = e.target.closest('[data-risk]'); if (!el || paused) return;
      const [x, y] = relPos(A, el);
      const id = el.dataset.risk;
      if (!id) { api.add(-15, x, y, '✘<small>Eso no es riesgoso</small>', '#ff4d6d'); api.sfx.err(); return; }
      if (found.has(id)) return;
      found.add(id);
      A.querySelectorAll(`[data-risk="${id}"]`).forEach(n => n.classList.add('captured'));
      api.add(100, x, y - 30, `+100<small>💎 ${PV.riskLabels[id]}</small>`, '#ffd23f');
      burst(A, x, y, '#ffd23f', 22); api.sfx.pop(found.size);
      foundBox.insertAdjacentHTML('beforeend', `<span>💎 ${PV.riskLabels[id]}</span>`);
      if (found.size === total) {
        const bonus = Math.round((1 - api.progress()) * 300);
        api.add(bonus, A.clientWidth / 2, A.clientHeight / 2, `¡Perfil completo!<small>+${bonus} por tiempo</small>`, '#7ddf64', true);
        setTimeout(api.end, 900);
      }
    });
    return { stop() { sc.removeEventListener('pointermove', move); }, stats: () => ({ found: found.size, missing: Object.keys(PV.riskLabels).filter(k => !found.has(k)).map(k => PV.riskLabels[k]), badges: found.size === total ? ['linterna'] : [] }) };
  }


  /* Tarjeta de publicación compacta (para los juegos nuevos) */
  const miniCard = (p, cls = '') => `<div class="mcard ${cls}"><div class="mh"><span class="fav">${p.av}</span><b>@${p.u}</b></div><div class="mt">${p.t}</div></div>`;
  const stampOn = (el, k) => el.insertAdjacentHTML('beforeend', `<div class="fstamp" style="--dc:${DECISIONS[k].color}">${DECISIONS[k].label}</div>`);

  /* ------------------------------------------------------------------
     5. CINTA TRANSPORTADORA — sellar DELETE en la zona roja
     ------------------------------------------------------------------ */
  function belt(api) {
    const A = api.arena;
    A.innerHTML = `<div class="belt">
      <div class="belt-zone"><span>ZONA DE SELLADO</span></div>
      <div class="belt-track"><div class="belt-rollers"></div><div class="belt-cards"></div></div>
      <button class="dec-btn belt-btn" style="--dc:${DECISIONS.delete.color}"><span class="kc">␣</span><b>DELETE</b><small>Espacio · ↓ · clic</small></button>
      <div class="belt-help">Si está bien, <b>déjenla pasar</b> (NO ACTION)</div></div>`;
    const lane = A.querySelector('.belt-cards'), zone = A.querySelector('.belt-zone'), bbtn = A.querySelector('.belt-btn');
    const deck = Content.deck(80, { focus: api.focus || [] });
    let i = 0, combo = 0, spawnT = 0;
    const cards = [];
    const st = { ok: 0, bad: 0, maxCombo: 0 };
    const W = () => A.clientWidth;
    function spawn() {
      const p = deck[i++ % deck.length];
      const el = document.createElement('div');
      el.className = 'bcard'; el.innerHTML = miniCard(p);
      lane.appendChild(el);
      cards.push({ p, el, x: -el.offsetWidth - 10, done: false, enter: null });
    }
    const zoneBox = () => { const a = A.getBoundingClientRect(), z = zone.getBoundingClientRect(); return [z.left - a.left, z.right - a.left]; };
    const inZone = c => { const [z0, z1] = zoneBox(), w = c.el.offsetWidth, mid = c.x + w / 2; return mid > z0 && mid < z1; };
    function good(c, txt, color) {
      combo++; st.ok++; st.maxCombo = Math.max(st.maxCombo, combo);
      const pts = Math.min(90, 30 + (combo - 1) * 10);
      const [x, y] = relPos(A, c.el);
      api.add(pts, x, y - 70, `+${pts}<small>${txt}</small>`, color); burst(A, x, y, color); api.sfx.pop(combo); api.combo(combo);
    }
    function badHit(c, txt) {
      combo = 0; st.bad++; api.combo(0);
      const [x, y] = relPos(A, c.el);
      api.add(-30, x, y - 70, `✘<small>${txt}</small>`, '#ff4d6d'); api.shake(); api.sfx.err();
      api.log({ kind: 'post', text: c.p.t, right: c.p.d, policy: c.p.policy, why: c.p.why });
    }
    function stamp() {
      if (paused) return;
      bbtn.classList.remove('hit'); void bbtn.offsetWidth; bbtn.classList.add('hit');
      const c = cards.find(k => !k.done && inZone(k));
      if (!c) { api.sfx.err(); floatText(A, W() * .66, 60, 'Nada en la zona', '#ffcf33'); return; }
      c.done = true; stampOn(c.el, 'delete'); api.sfx.stamp();
      api.rec({ ok: c.p.d === 'delete', policy: c.p.policy || 'none' });
      if (c.p.d === 'delete') { c.el.classList.add('ok'); good(c, `✔ ${pol(c.p.policy).en}`, DECISIONS.delete.color); setTimeout(() => c.el.classList.add('drop'), 250); }
      else { c.el.classList.add('bad'); badHit(c, 'Era NO ACTION'); }
    }
    const onKey = e => { if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); stamp(); } };
    document.addEventListener('keydown', onKey);
    bbtn.onclick = stamp;
    lane.addEventListener('click', e => { if (e.target.closest('.bcard')) stamp(); });
    spawn();
    const stopLoop = loop(dt => {
      const v = (W() * .12 + api.progress() * W() * .07) / (api.tempo || 1);
      spawnT -= dt;
      const last = cards[cards.length - 1];
      if (!last || last.x > last.el.offsetWidth * .35) { if (spawnT <= 0) { spawn(); spawnT = .6; } }
      for (const c of [...cards]) {
        c.x += v * dt; c.el.style.transform = `translateX(${c.x}px)`;
        if (!c.done && c.x > W()) {
          c.done = true;
          api.rec({ ok: c.p.d === 'noaction', policy: c.p.policy || 'none' });
          if (c.p.d === 'delete') badHit(c, `¡Se coló! Era DELETE · ${pol(c.p.policy).en}`);
          else { combo++; st.ok++; st.maxCombo = Math.max(st.maxCombo, combo); api.add(15, W() - 80, 120, '+15<small>✔ NO ACTION</small>', DECISIONS.noaction.color); api.combo(combo); }
        }
        if (c.x > W() + 40) { c.el.remove(); cards.splice(cards.indexOf(c), 1); }
      }
    });
    return {
      stop() { stopLoop(); document.removeEventListener('keydown', onKey); },
      stats: () => ({ ...st, badges: [st.bad === 0 && st.ok >= 8 && 'ojo', st.maxCombo >= 6 && 'racha'].filter(Boolean) }),
    };
  }

  /* ------------------------------------------------------------------
     6. ARCHIVO EXPRESS — archivar cada caso en su política
     ------------------------------------------------------------------ */
  function sort(api) {
    const A = api.arena;
    A.innerHTML = `<div class="sort"><div class="sort-case"></div><div class="sort-drawers"></div></div>`;
    const box = A.querySelector('.sort-case'), drawers = A.querySelector('.sort-drawers');
    const deck = Content.deck(70, { focus: api.focus || [], ratio: .75 });
    const realPols = POLICIES.map(x => x.id);
    let i = 0, combo = 0, cur = null;
    const st = { ok: 0, bad: 0, maxCombo: 0 };
    function spawn() {
      const p = deck[i++ % deck.length];
      const right = p.d === 'delete' ? p.policy : 'none';
      const near = POLICIES.filter(x => x.id !== p.policy && (p.policy ? x.district === pol(p.policy).district : true)).map(x => x.id);
      const far = realPols.filter(x => x !== p.policy && !near.includes(x));
      const opts = p.policy ? [...new Set([p.policy, ...shuffle(near).slice(0, 2), ...shuffle(far)])].slice(0, 3) : shuffle(realPols).slice(0, 3);
      const list = [...shuffle(opts), 'none'];
      box.innerHTML = `<div class="fcard sort-card">${p.d === 'noaction' && Math.random() < .3 ? `<div class="fappeal">${icon('megaphone')} REPORTADO POR VARIOS USUARIOS</div>` : ''}
        <div class="fh"><span class="fav">${p.av}</span><div><b>@${p.u}</b><small>caso reportado · ¿qué política viola?</small></div><span class="fcase">CASO #${1000 + Math.floor(rnd(0, 8999))}</span></div>
        <div class="ftxt">${p.t}</div><div class="fbar"><i></i></div></div>`;
      drawers.innerHTML = list.map((k, n) => `<button class="drawer ${k === 'none' ? 'none' : ''}" data-k="${k}"><span class="kc">${n + 1}</span><b>${k === 'none' ? 'NO ACTION' : pol(k).en}</b><small>${k === 'none' ? 'No viola ninguna política' : 'DELETE por esta política'}</small></button>`).join('');
      drawers.querySelectorAll('.drawer').forEach(b => (b.onclick = () => choose(b.dataset.k, b)));
      cur = { p, right, list, age: 0, life: Math.max(6, 11 - api.progress() * 3) * (api.tempo || 1), bar: box.querySelector('.fbar i') };
    }
    function choose(k, b) {
      if (!cur || paused) return;
      const c = cur; cur = null;
      const ok = k === c.right, card = box.querySelector('.fcard');
      api.rec({ ok, policy: c.p.policy || 'none', ms: k ? Math.round(c.age * 1000) : undefined });
      const rightBtn = drawers.querySelector(`.drawer[data-k="${c.right}"]`);
      const [x, y] = relPos(A, card);
      if (ok) {
        combo++; st.ok++; st.maxCombo = Math.max(st.maxCombo, combo);
        const pts = Math.min(110, 50 + Math.round((1 - c.age / c.life) * 30) + (combo - 1) * 5);
        api.add(pts, x, y - 50, `+${pts}<small>✔ ${c.right === 'none' ? 'NO ACTION' : pol(c.right).en}</small>`, '#2ec4b6');
        burst(A, x, y, '#2ec4b6'); api.sfx.pop(combo); b.classList.add('ok');
      } else {
        combo = 0; st.bad++;
        api.add(k ? -30 : -20, x, y - 50, `${k ? '✘' : '⏰ ¡Lento!'}<small>Era ${c.right === 'none' ? 'NO ACTION' : pol(c.right).en}</small>`, '#ff4d6d');
        api.shake(); api.sfx.err(); if (b) b.classList.add('bad'); if (rightBtn) rightBtn.classList.add('ok');
        api.log({ kind: 'post', text: c.p.t, right: c.p.d, policy: c.p.policy, why: c.p.why });
      }
      api.combo(combo);
      card.classList.add('out', ok ? 'out-noaction' : 'out-timeout');
      setTimeout(spawn, ok ? 550 : 1100);
    }
    const onKey = e => { const n = +e.key; if (n >= 1 && n <= 4 && cur) { e.preventDefault(); const b = drawers.querySelectorAll('.drawer')[n - 1]; if (b) choose(b.dataset.k, b); } };
    document.addEventListener('keydown', onKey);
    spawn();
    const stopLoop = loop(dt => {
      if (!cur) return;
      cur.age += dt; const f = cur.age / cur.life;
      cur.bar.style.transform = `scaleX(${Math.max(0, 1 - f)})`;
      cur.bar.style.background = f > .7 ? '#ff4d6d' : f > .45 ? '#ffd23f' : '#25d366';
      if (f >= 1) choose(null, null);
    });
    return {
      stop() { stopLoop(); document.removeEventListener('keydown', onKey); cur = null; },
      stats: () => ({ ...st, badges: [st.ok >= 8 && 'archivero', st.maxCombo >= 6 && 'racha'].filter(Boolean) }),
    };
  }

  /* ------------------------------------------------------------------
     7. DUELO DE PUBLICACIONES — dos publicaciones, una se va
     ------------------------------------------------------------------ */
  function duel(api) {
    const A = api.arena;
    A.innerHTML = `<div class="duel"><div class="duel-q">¿Cuál es <b>DELETE</b>? La otra queda en <b>NO ACTION</b></div>
      <div class="duel-row"><div class="duel-side" data-s="0"></div><div class="duel-vs">VS</div><div class="duel-side" data-s="1"></div></div>
      <div class="duel-bar"><i></i></div><div class="duel-keys"><span class="kc">←</span> izquierda · derecha <span class="kc">→</span></div></div>`;
    const sides = A.querySelectorAll('.duel-side'), bar = A.querySelector('.duel-bar i');
    const pairs = Content.duelPairs(40, { focus: api.focus || [] });
    let i = 0, combo = 0, cur = null;
    const st = { ok: 0, bad: 0, maxCombo: 0 };
    function spawn() {
      const [bad, good] = pairs[i++ % pairs.length];
      const badSide = Math.random() < .5 ? 0 : 1;
      const posts = badSide === 0 ? [bad, good] : [good, bad];
      sides.forEach((el, n) => { el.innerHTML = miniCard(posts[n], 'big'); el.className = 'duel-side in'; });
      cur = { bad, good, badSide, age: 0, life: Math.max(5, 9 - api.progress() * 2.5) * (api.tempo || 1) };
    }
    function choose(side) {
      if (!cur || paused) return;
      const c = cur; cur = null;
      const ok = side === c.badSide;
      api.rec({ ok, policy: c.bad.policy || 'none', ms: side != null ? Math.round(c.age * 1000) : undefined });
      sides.forEach((el, n) => stampOn(el.querySelector('.mcard'), n === (side == null ? c.badSide : side) ? 'delete' : 'noaction'));
      api.sfx.stamp();
      const el = sides[c.badSide], [x, y] = relPos(A, el);
      if (ok) {
        combo++; st.ok++; st.maxCombo = Math.max(st.maxCombo, combo);
        const pts = Math.min(110, 50 + Math.round((1 - c.age / c.life) * 40) + (combo - 1) * 5);
        api.add(pts, x, y - 80, `+${pts}<small>✔ ${pol(c.bad.policy).en}</small>`, '#2ec4b6'); burst(A, x, y, '#2ec4b6'); api.sfx.pop(combo);
        sides[c.badSide].classList.add('ok');
      } else {
        combo = 0; st.bad++;
        api.add(side == null ? -20 : -30, x, y - 80, `${side == null ? '⏰ ¡Lento!' : '✘'}<small>La que se iba: ${pol(c.bad.policy).en}</small>`, '#ff4d6d');
        api.shake(); api.sfx.err(); sides[c.badSide].classList.add('ok'); if (side != null) sides[side].classList.add('bad');
        api.log({ kind: 'post', text: c.bad.t, right: 'delete', policy: c.bad.policy, why: c.bad.why });
        api.log({ kind: 'post', text: c.good.t, right: 'noaction', policy: c.good.policy, why: c.good.why });
      }
      api.combo(combo);
      setTimeout(spawn, ok ? 700 : 1400);
    }
    const onKey = e => { const k = { ArrowLeft: 0, a: 0, A: 0, ArrowRight: 1, d: 1, D: 1 }[e.key]; if (k != null) { e.preventDefault(); choose(k); } };
    document.addEventListener('keydown', onKey);
    sides.forEach(el => (el.onclick = () => choose(+el.dataset.s)));
    spawn();
    const stopLoop = loop(dt => {
      if (!cur) return;
      cur.age += dt; const f = cur.age / cur.life;
      bar.style.transform = `scaleX(${Math.max(0, 1 - f)})`;
      bar.style.background = f > .7 ? '#ff4d6d' : f > .45 ? '#ffd23f' : '#25d366';
      if (f >= 1) choose(null);
    });
    return {
      stop() { stopLoop(); document.removeEventListener('keydown', onKey); cur = null; },
      stats: () => ({ ...st, badges: [st.bad === 0 && st.ok >= 8 && 'ojo', st.maxCombo >= 6 && 'racha'].filter(Boolean) }),
    };
  }

  return { feed, sea, chain, scanner, belt, sort, duel, burst, floatText, pause };
})();
