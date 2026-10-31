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
   Cada juego devuelve { stop(), onEnd?() }.
   ========================================================= */
const Games = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pol = id => POLICIES.find(p => p.id === id);

  function loop(fn) {
    let alive = true, last = performance.now();
    (function f(now) {
      if (!alive) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      fn(dt, now); requestAnimationFrame(f);
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
    A.innerHTML = `<div class="feed-wrap">${btn('remove')}<div class="feed-col"><div class="feed-stack"></div></div>${btn('noviolation')}<div class="feed-bottom">${btn('disturbing')}</div></div>`;
    const stack = A.querySelector('.feed-stack');
    const deck = shuffle(FEED_POSTS);
    let i = 0, combo = 0, cur = null;

    function spawn() {
      const p = deck[i++ % deck.length];
      const el = document.createElement('div');
      el.className = 'fcard';
      el.innerHTML = `<div class="fh"><span class="fav">${p.av}</span><div><b>@${p.u}</b><small>hace ${Math.ceil(rnd(1, 59))} min · 🌎</small></div><span class="fdots">⋯</span></div>
        <div class="ftxt">${p.t}</div><div class="freact"><span>👍 Me gusta</span><span>💬 Comentar</span><span>↗ Compartir</span></div><div class="fbar"><i></i></div>`;
      stack.appendChild(el);
      cur = { p, el, bar: el.querySelector('.fbar i'), age: 0, life: Math.max(3.4, 6.5 - combo * .3 - api.progress() * 1.5) };
    }
    function resolve(dec) {
      if (!cur) return;
      const { p, el } = cur; cur = null;
      const [x, y] = relPos(A, el);
      const ok = dec === p.d;
      el.classList.add('out', 'out-' + (dec || 'timeout'), ok ? 'ok' : 'bad');
      if (ok) {
        combo++;
        const pts = Math.min(100, 40 + (combo - 1) * 10);
        const label = p.policy ? `✔ ${pol(p.policy).en}` : '✔ NO VIOLATION';
        api.add(pts, x, y - 60, `+${pts}<small>${label}</small>`, DECISIONS[p.d].color);
        burst(A, x, y, DECISIONS[p.d].color);
        api.sfx.pop(combo);
      } else {
        combo = 0;
        const why = `Era <b>${DECISIONS[p.d].label}</b>${p.policy ? ` · ${pol(p.policy).en}` : ''}`;
        api.add(dec ? -30 : -20, x, y - 60, `${dec ? '✘' : '⏰ ¡Lento!'}<small>${why}</small>`, '#ff4d6d');
        api.shake(); api.sfx.err();
        api.log({ text: p.t, right: p.d, policy: p.policy, chose: dec });
      }
      api.combo(combo);
      setTimeout(() => el.remove(), 600);
      setTimeout(spawn, 230);
    }
    const keyMap = { ArrowLeft: 'remove', a: 'remove', A: 'remove', ArrowRight: 'noviolation', d: 'noviolation', D: 'noviolation', ArrowDown: 'disturbing', s: 'disturbing', S: 'disturbing' };
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
    return { stop() { stopLoop(); document.removeEventListener('keydown', onKey); cur = null; } };
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
    const scams = shuffle(SEA_MSGS.scam), legit = shuffle(SEA_MSGS.legit);
    let si = 0, li = 0, spawnT = .6, combo = 0;
    const alive = new Set();

    function spawn() {
      const free = slots.filter(s => !s.busy); if (!free.length) return;
      const slot = free[Math.floor(Math.random() * free.length)]; slot.busy = true;
      const isScam = Math.random() < .58;
      const m = isScam ? scams[si++ % scams.length] : legit[li++ % legit.length];
      const el = document.createElement('button');
      el.className = 'bottle ' + (isScam ? 'scam' : 'legit');
      el.style.left = `${4 + slot.c * 24 + rnd(0, 4)}%`; el.style.top = `${10 + slot.r * 25 + rnd(0, 6)}%`;
      el.style.animationDelay = `${rnd(0, 1)}s`;
      el.innerHTML = `<div class="bm"><b>${m.from}</b><span>${m.text}</span></div>${isScam ? '<i class="hook">🪝</i>' : ''}`;
      const life = lerp(3.8, 2.5, api.progress());
      const item = { el, slot, m, isScam, t: 0, life, done: false };
      el.onclick = () => hit(item);
      layer.appendChild(el); alive.add(item);
    }
    function kill(item, cls) {
      item.done = true; alive.delete(item); item.slot.busy = false;
      item.el.classList.add(cls); setTimeout(() => item.el.remove(), 450);
    }
    function hit(item) {
      if (item.done) return;
      const [x, y] = relPos(A, item.el);
      if (item.isScam) {
        combo++;
        const pts = 40 + Math.min(4, combo - 1) * 5;
        api.add(pts, x, y - 40, `+${pts}<small>✔ ${pol(item.m.policy).en}</small>`, '#25d366');
        burst(A, x, y, '#ffd23f', 20); api.sfx.pop(combo); kill(item, 'caught');
      } else {
        combo = 0;
        api.add(-40, x, y - 40, `✘ ¡Era real!<small>${item.m.from}</small>`, '#ff4d6d');
        api.shake(); api.sfx.err(); kill(item, 'wrong');
        api.log({ text: `${item.m.from}: ${item.m.text}`, right: 'legit' });
      }
      api.combo(combo);
    }
    spawn(); spawn(); spawn();
    const stopLoop = loop(dt => {
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = lerp(.7, .38, api.progress()); }
      for (const it of [...alive]) {
        it.t += dt;
        if (it.t >= it.life) {
          if (it.isScam) {
            const [x, y] = relPos(A, it.el);
            combo = 0; api.combo(0);
            api.add(-15, x, y - 30, '🎣 ¡Se escapó!', '#ff8a3d');
            api.log({ text: `${it.m.from}: ${it.m.text}`, right: 'scam', policy: it.m.policy });
          }
          kill(it, 'sink');
        }
      }
    });
    return { stop() { stopLoop(); } };
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
        ctx.strokeStyle = na.s === 1 && nb.s === 1 ? 'rgba(255,77,109,.6)' : 'rgba(255,255,255,.14)';
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
        ctx.fillStyle = n.s === 0 ? '#e2e8f0' : n.s === 1 ? '#ff4d6d' : '#22d3ee';
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
        spreadT = lerp(1.15, .55, api.progress());
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
    const A = api.arena;
    A.innerHTML = `<div class="scan"><div class="scan-layer dark">${profileHTML}</div><div class="scan-layer lit">${profileHTML}</div>
      <div class="lens"></div><div class="scan-found"></div></div>`;
    const sc = A.querySelector('.scan'), lit = A.querySelector('.lit'), foundBox = A.querySelector('.scan-found');
    const total = Object.keys(PRIVACY.riskLabels).length, found = new Set();
    const move = e => { const r = sc.getBoundingClientRect(); sc.style.setProperty('--mx', `${e.clientX - r.left}px`); sc.style.setProperty('--my', `${e.clientY - r.top}px`); };
    sc.addEventListener('pointermove', move);
    sc.style.setProperty('--mx', '50%'); sc.style.setProperty('--my', '40%');
    lit.addEventListener('click', e => {
      const el = e.target.closest('[data-risk]'); if (!el) return;
      const [x, y] = relPos(A, el);
      const id = el.dataset.risk;
      if (!id) { api.add(-15, x, y, '✘<small>Eso no es riesgoso</small>', '#ff4d6d'); api.sfx.err(); return; }
      if (found.has(id)) return;
      found.add(id);
      A.querySelectorAll(`[data-risk="${id}"]`).forEach(n => n.classList.add('captured'));
      api.add(100, x, y - 30, `+100<small>💎 ${PRIVACY.riskLabels[id]}</small>`, '#ffd23f');
      burst(A, x, y, '#ffd23f', 22); api.sfx.pop(found.size);
      foundBox.insertAdjacentHTML('beforeend', `<span>💎 ${PRIVACY.riskLabels[id]}</span>`);
      if (found.size === total) {
        const bonus = Math.round((1 - api.progress()) * 300);
        api.add(bonus, A.clientWidth / 2, A.clientHeight / 2, `¡Perfil completo!<small>+${bonus} por tiempo</small>`, '#7ddf64', true);
        setTimeout(api.end, 900);
      }
    });
    return { stop() { sc.removeEventListener('pointermove', move); } };
  }

  return { feed, sea, chain, scanner, burst, floatText };
})();
