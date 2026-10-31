/* =========================================================
   RED — sincroniza las computadoras de los equipos.
   · Modo "firebase": Realtime Database (computadoras en distintos lugares).
   · Modo "local": varias pestañas de la MISMA computadora (para ensayar).
   Ambos exponen la misma API sobre la sala rooms/<CÓDIGO>/...
   ========================================================= */
const Net = (() => {
  const cfg = window.FIREBASE_CONFIG || {};
  const fbReady = !!(window.firebase && cfg.apiKey && cfg.databaseURL);
  let db = null, offset = 0;
  if (fbReady) {
    try {
      firebase.initializeApp(cfg);
      db = firebase.database();
      db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
    } catch (e) { console.error('Firebase no pudo iniciar', e); db = null; }
  }
  const mode = db ? 'firebase' : 'local';
  const now = () => Date.now() + offset;
  const norm = p => String(p || '').replace(/^\/+|\/+$/g, '');

  /* ---------------- Firebase ---------------- */
  function fbRoom(code) {
    const r = p => db.ref(`rooms/${code}${norm(p) ? '/' + norm(p) : ''}`);
    return {
      set: (p, v) => r(p).set(v === undefined ? null : v),
      update: (p, v) => r(p).update(v),
      push: (p, v) => { const ref = r(p).push(); ref.set(v); return ref.key; },
      remove: p => r(p).remove(),
      get: p => r(p).once('value').then(s => s.val()),
      on(p, cb) { const ref = r(p); const h = s => cb(s.val()); ref.on('value', h); return () => ref.off('value', h); },
      onAdded(p, cb) { const ref = r(p); const h = s => cb(s.key, s.val()); ref.on('child_added', h); return () => ref.off('child_added', h); },
      presence(p) {
        const ref = r(p);
        db.ref('.info/connected').on('value', s => { if (s.val()) { ref.onDisconnect().remove(); ref.set(true); } });
      },
    };
  }

  /* ---------------- Local (localStorage + evento storage) ---------------- */
  function localRoom(code) {
    const pre = `nxr|${code}|`;
    const subs = new Set();
    const keys = () => { const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre)) out.push(k.slice(pre.length)); } return out; };
    const getIn = (o, parts) => parts.reduce((a, k) => (a == null ? undefined : a[k]), o);
    const setIn = (o, parts, v) => {
      if (!parts.length) return v;
      let cur = o;
      for (let i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}; cur = cur[parts[i]]; }
      if (v === null || v === undefined) delete cur[parts[parts.length - 1]]; else cur[parts[parts.length - 1]] = v;
      return o;
    };
    function tree() {
      let t = {};
      keys().sort((a, b) => a.length - b.length).forEach(k => {
        let v; try { v = JSON.parse(localStorage.getItem(pre + k)); } catch (e) { return; }
        t = k ? setIn(t, k.split('/'), v) : v;
      });
      return t;
    }
    const clean = v => (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length ? null : v);
    function get(p) { p = norm(p); const t = tree(); const v = p ? getIn(t, p.split('/')) : t; return v === undefined ? null : clean(JSON.parse(JSON.stringify(v))); }
    function write(p, v, silent) {
      p = norm(p);
      const ks = keys();
      const anc = ks.filter(k => k && p.startsWith(k + '/')).sort((a, b) => b.length - a.length)[0];
      if (anc) {
        const obj = JSON.parse(localStorage.getItem(pre + anc));
        const updated = setIn(obj && typeof obj === 'object' ? obj : {}, p.slice(anc.length + 1).split('/'), v);
        localStorage.setItem(pre + anc, JSON.stringify(updated));
      } else {
        ks.filter(k => k === p || k.startsWith(p + '/') || (!p)).forEach(k => localStorage.removeItem(pre + k));
        if (v !== null && v !== undefined) localStorage.setItem(pre + p, JSON.stringify(v));
      }
      if (!silent) fire();
    }
    function fire() {
      subs.forEach(s => {
        const v = get(s.p);
        if (s.type === 'value') {
          const j = JSON.stringify(v);
          if (j !== s.last) { s.last = j; s.cb(v); }
        } else {
          Object.keys(v || {}).sort().forEach(k => { if (!s.seen.has(k)) { s.seen.add(k); s.cb(k, v[k]); } });
        }
      });
    }
    addEventListener('storage', e => { if (!e.key || e.key.startsWith(pre)) fire(); });
    setInterval(fire, 600);
    let n = 0;
    return {
      set: (p, v) => Promise.resolve(write(p, v)),
      update: (p, obj) => { Object.entries(obj).forEach(([k, v]) => write(norm(p) + '/' + k, v, true)); fire(); return Promise.resolve(); },
      push: (p, v) => { const k = Date.now().toString(36).padStart(9, '0') + (n++).toString(36).padStart(3, '0') + Math.random().toString(36).slice(2, 5); write(norm(p) + '/' + k, v); return k; },
      remove: p => Promise.resolve(write(p, null)),
      get: p => Promise.resolve(get(p)),
      on(p, cb) { const s = { p, cb, type: 'value', last: undefined }; subs.add(s); setTimeout(() => { s.last = JSON.stringify(get(p)); cb(get(p)); }, 0); return () => subs.delete(s); },
      onAdded(p, cb) { const s = { p, cb, type: 'added', seen: new Set() }; subs.add(s); setTimeout(fire, 0); return () => subs.delete(s); },
      presence(p) { write(p, true); addEventListener('beforeunload', () => write(p, null)); },
    };
  }

  const room = code => (mode === 'firebase' ? fbRoom(code) : localRoom(code));
  const makeCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
  async function roomExists(code) {
    if (mode === 'firebase') return (await db.ref(`rooms/${code}/meta`).once('value')).exists();
    return localStorage.getItem(`nxr|${code}|meta`) != null || Object.keys(localStorage).some(k => k.startsWith(`nxr|${code}|meta/`));
  }
  return { mode, now, room, makeCode, roomExists };
})();
