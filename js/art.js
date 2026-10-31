/* =========================================================
   ARTE — Personajes, islas y cristal dibujados en SVG
   ========================================================= */
const Art = (() => {
  let uid = 0;
  const id = p => `${p}${++uid}`;

  const eyes = (x1 = 84, x2 = 116, y = 96) => `
    <ellipse cx="${x1}" cy="${y}" rx="5.5" ry="7" fill="#231942"/>
    <ellipse cx="${x2}" cy="${y}" rx="5.5" ry="7" fill="#231942"/>
    <circle cx="${x1 + 2}" cy="${y - 3}" r="2" fill="#fff"/>
    <circle cx="${x2 + 2}" cy="${y - 3}" r="2" fill="#fff"/>`;
  const blush = (y = 109) => `
    <ellipse cx="74" cy="${y}" rx="7" ry="4" fill="#ff6b9d" opacity=".45"/>
    <ellipse cx="126" cy="${y}" rx="7" ry="4" fill="#ff6b9d" opacity=".45"/>`;
  const heart = (x, y, s = 1, fill = '#ff2d87') => `
    <path transform="translate(${x} ${y}) scale(${s})" d="M0 9 C-16 -2 -10 -14 0 -6 C10 -14 16 -2 0 9 Z" fill="${fill}" stroke="#fff" stroke-width="1.6"/>`;

  const body = (fill, extra = '') => `
    <path d="M38 210 C38 158 66 140 100 140 C134 140 162 158 162 210 Z" fill="${fill}"/>
    <path d="M38 210 C38 158 66 140 100 140 C134 140 162 158 162 210 Z" fill="url(#shine)" opacity=".35"/>
    ${extra}`;

  const parts = {
    lola: () => `
      <path d="M52 100 C44 50 76 36 100 38 C130 36 158 54 148 104 C152 140 140 160 128 162 L72 162 C58 160 46 140 52 100Z" fill="#6b2c55"/>
      ${body('#ff4fa3', `<path d="M86 140 L100 160 L114 140" fill="#ffd1e8"/>`)}
      <rect x="92" y="122" width="16" height="22" rx="6" fill="#ffd2bf"/>
      <circle cx="100" cy="94" r="40" fill="#ffd8c4"/>
      <path d="M60 88 C62 52 90 46 104 52 C118 46 142 56 140 88 C130 70 112 62 98 66 C86 70 70 72 60 88Z" fill="#7e3466"/>
      <circle cx="100" cy="42" r="15" fill="#7e3466"/>
      <circle cx="94" cy="38" r="5" fill="#a54a86"/>
      ${blush()}
      <path d="M88 112 Q100 124 112 112" stroke="#b03a6b" stroke-width="3.5" fill="#fff" stroke-linecap="round"/>
      ${heart(83, 96, 1.25)} ${heart(117, 96, 1.25)}
      <path d="M95 94 Q100 90 105 94" stroke="#ff2d87" stroke-width="3" fill="none"/>
      <circle cx="78" cy="91" r="2.5" fill="#fff" opacity=".9"/><circle cx="112" cy="91" r="2.5" fill="#fff" opacity=".9"/>
      <g transform="translate(150 150) rotate(15)"><rect x="-10" y="-18" width="20" height="34" rx="5" fill="#2d1b4e"/><rect x="-7" y="-14" width="14" height="24" rx="2" fill="#7fe3ff"/></g>`,

    bot: () => `
      ${body('#9fb0d6', `<rect x="76" y="160" width="48" height="30" rx="8" fill="#6b7aa6"/>
        <circle cx="88" cy="175" r="4" fill="#7ddf64"/><circle cx="100" cy="175" r="4" fill="#ffd23f"/><circle cx="112" cy="175" r="4" fill="#ff4fa3"/>
        <path d="M96 142 L104 142 L108 168 L100 176 L92 168Z" fill="#e63946"/>`)}
      <rect x="92" y="124" width="16" height="20" fill="#7d8bb3"/>
      <line x1="100" y1="54" x2="100" y2="28" stroke="#c7d2ee" stroke-width="4"/>
      <circle cx="100" cy="24" r="9" fill="#ff4fa3" class="led"/>
      <circle cx="97" cy="21" r="3" fill="#fff" opacity=".8"/>
      <rect x="56" y="52" width="88" height="80" rx="22" fill="#cfd8f0"/>
      <rect x="56" y="52" width="88" height="80" rx="22" fill="url(#shine)" opacity=".5"/>
      <circle cx="54" cy="92" r="8" fill="#9fb0d6"/><circle cx="146" cy="92" r="8" fill="#9fb0d6"/>
      <rect x="66" y="66" width="68" height="50" rx="12" fill="#1b2340"/>
      <rect x="78" y="80" width="12" height="14" rx="3" fill="#5ef2ff" class="led"/>
      <rect x="110" y="80" width="12" height="14" rx="3" fill="#5ef2ff" class="led"/>
      <path d="M84 120 C90 112 96 116 100 118 C104 116 110 112 116 120 C108 118 104 124 100 122 C96 124 92 118 84 120Z" fill="#4a2c1d"/>
      <path d="M88 104 L94 108 L100 104 L106 108 L112 104" stroke="#5ef2ff" stroke-width="2.5" fill="none"/>`,

    doctora: () => `
      ${body('#f4f7ff', `<path d="M78 146 L100 186 L122 146" fill="#7ddf64"/><path d="M100 150 L100 210" stroke="#cfd6e8" stroke-width="2"/>
        <rect x="114" y="168" width="18" height="6" rx="2" fill="#7ddf64"/>`)}
      <rect x="92" y="122" width="16" height="22" rx="6" fill="#b97a57"/>
      <circle cx="100" cy="94" r="40" fill="#c98d6b"/>
      <g fill="#3fae4a"><circle cx="66" cy="72" r="16"/><circle cx="84" cy="56" r="18"/><circle cx="106" cy="50" r="19"/><circle cx="128" cy="60" r="17"/><circle cx="138" cy="80" r="14"/><circle cx="62" cy="92" r="12"/><circle cx="140" cy="98" r="11"/></g>
      <g fill="#7ddf64" opacity=".6"><circle cx="90" cy="52" r="6"/><circle cx="118" cy="54" r="5"/></g>
      ${eyes()}
      <path d="M78 84 L92 86 M108 86 L122 82" stroke="#2b5b2f" stroke-width="3.5" stroke-linecap="round"/>
      ${blush()}
      <path d="M90 114 Q102 120 112 110" stroke="#5c2c1d" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <g transform="translate(152 158)">
        <path d="M-6 -24 L6 -24 L6 -10 L18 14 C20 20 16 24 10 24 L-10 24 C-16 24 -20 20 -18 14 L-6 -10Z" fill="#e8fff0" stroke="#fff" stroke-width="2"/>
        <path d="M-14 6 L14 6 L18 14 C20 20 16 24 10 24 L-10 24 C-16 24 -20 20 -18 14Z" fill="#7ddf64"/>
        <circle cx="-4" cy="-30" r="4" fill="#b6ffbf" class="bubble"/><circle cx="5" cy="-40" r="3" fill="#b6ffbf" class="bubble b2"/><circle cx="-2" cy="-48" r="2.5" fill="#b6ffbf" class="bubble b3"/>
      </g>`,

    baron: () => `
      ${body('#7c3aed', `<path d="M82 142 L100 176 L118 142Z" fill="#fff"/>
        <path d="M88 150 L100 158 L88 166Z M112 150 L100 158 L112 166Z" fill="#ffd23f"/><circle cx="100" cy="158" r="3.5" fill="#e0b000"/>`)}
      <rect x="92" y="122" width="16" height="22" rx="6" fill="#e8bd99"/>
      <circle cx="100" cy="96" r="40" fill="#f1c9a5"/>
      <path d="M62 92 C60 72 70 64 80 66 L120 66 C132 64 142 74 138 92 C132 80 120 76 100 76 C82 76 68 80 62 92Z" fill="#3a2a4a"/>
      <rect x="54" y="60" width="92" height="10" rx="5" fill="#2e1065"/>
      <rect x="68" y="12" width="64" height="52" rx="6" fill="#4c1d95"/>
      <rect x="68" y="46" width="64" height="11" fill="#c084fc"/>
      <rect x="72" y="16" width="10" height="44" rx="5" fill="#fff" opacity=".12"/>
      ${eyes(84, 116, 98)}
      <circle cx="116" cy="98" r="11" fill="none" stroke="#ffd23f" stroke-width="3"/>
      <path d="M127 101 Q136 120 128 140" stroke="#ffd23f" stroke-width="1.5" fill="none"/>
      ${blush(111)}
      <path d="M100 112 C92 104 78 106 74 116 C82 112 90 114 100 116 C110 114 118 112 126 116 C122 106 108 104 100 112Z" fill="#3a2a4a"/>
      <path d="M94 124 Q100 128 106 124" stroke="#8a4b3a" stroke-width="3" fill="none" stroke-linecap="round"/>`,

    phishy: () => `
      <path d="M58 92 C50 120 58 150 70 160 L130 160 C142 150 150 120 142 92Z" fill="#c2410c"/>
      ${body('#ff8a3d', `<g stroke="#fff" stroke-width="5" opacity=".85"><path d="M60 170 L140 170"/><path d="M50 188 L150 188"/><path d="M44 206 L156 206"/></g>`)}
      <rect x="92" y="122" width="16" height="22" rx="6" fill="#7a4a2f"/>
      <circle cx="100" cy="94" r="40" fill="#8d5a3b"/>
      <path d="M44 64 C70 50 130 50 156 64 C150 40 128 22 100 22 C72 22 50 40 44 64Z" fill="#1f2937"/>
      <path d="M36 66 C70 52 130 52 164 66 C156 74 44 74 36 66Z" fill="#111827"/>
      <path d="M86 40 L114 40 L108 52 L92 52Z" fill="#ffd23f"/>
      <circle cx="100" cy="36" r="5" fill="#fff"/>
      <path d="M60 78 L140 84" stroke="#111827" stroke-width="3"/>
      <ellipse cx="84" cy="96" rx="12" ry="11" fill="#111827"/>
      <path d="M84 90 L84 99 C84 103 80 103 79 100" stroke="#ffd23f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="84" cy="89" r="1.8" fill="#ffd23f"/>
      <ellipse cx="116" cy="96" rx="5.5" ry="7" fill="#231942"/><circle cx="118" cy="93" r="2" fill="#fff"/>
      <ellipse cx="126" cy="110" rx="7" ry="4" fill="#ff6b9d" opacity=".45"/>
      <path d="M86 112 Q102 124 116 110" stroke="#3b1d10" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M140 106 L140 118 C140 124 134 124 133 120" stroke="#ffd23f" stroke-width="3" fill="none" stroke-linecap="round"/>`,

    sombra: () => `
      ${body('#2b2f45', `<path d="M86 146 L92 200 M114 146 L108 200" stroke="#9aa3d1" stroke-width="3" stroke-linecap="round"/>`)}
      <path d="M48 120 C40 60 70 30 100 30 C130 30 160 60 152 120 C150 140 140 150 130 152 L70 152 C60 150 50 140 48 120Z" fill="#383d5c"/>
      <path d="M62 116 C58 70 80 52 100 52 C120 52 142 70 138 116 C136 132 124 142 100 142 C76 142 64 132 62 116Z" fill="#0d0f1c"/>
      <path d="M72 82 C72 70 128 70 128 82 L126 114 C124 128 112 134 100 134 C88 134 76 128 74 114Z" fill="#f4f1ff"/>
      <path d="M80 92 Q88 84 96 94 Q88 98 80 92Z" fill="#0d0f1c"/><path d="M120 92 Q112 84 104 94 Q112 98 120 92Z" fill="#0d0f1c"/>
      <circle cx="88" cy="92" r="2.5" fill="#c084fc" class="led"/><circle cx="112" cy="92" r="2.5" fill="#c084fc" class="led"/>
      <path d="M84 110 Q100 126 116 110" stroke="#0d0f1c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M78 106 L86 102 M122 106 L114 102" stroke="#ff4fa3" stroke-width="2" opacity=".6"/>`,
  };

  function avatar(s, opts = {}) {
    const g = id('bg'), f = id('ink'), h = id('ht'), m = id('hm');
    const sil = opts.silhouette;
    const rays = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2; return `<path d="M100 100 L${100 + Math.cos(a) * 160} ${100 + Math.sin(a) * 160} L${100 + Math.cos(a + .09) * 160} ${100 + Math.sin(a + .09) * 160}Z"/>`; }).join('');
    return `<svg class="avatar ${sil ? 'silhouette' : ''}" viewBox="0 0 200 200" aria-label="${s.name}">
      <defs>
        <radialGradient id="${g}" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="${s.color}"/><stop offset="100%" stop-color="${s.color}" stop-opacity=".55"/></radialGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <pattern id="${h}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="1.7" fill="#111"/></pattern>
        <linearGradient id="${m}g" x1="0" y1="0" x2="1" y2="1"><stop offset=".45" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
        <mask id="${m}"><rect width="200" height="200" fill="url(#${m}g)"/></mask>
        <filter id="${f}" x="-15%" y="-15%" width="130%" height="130%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="d"/>
          <feFlood flood-color="#111"/><feComposite in2="d" operator="in" result="o"/>
          <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="200" height="200" fill="#151515"/>
      <rect width="200" height="200" fill="url(#${g})"/>
      <g fill="#fff" opacity=".18">${rays}</g>
      <rect width="200" height="200" fill="url(#${h})" opacity=".22"/>
      <g class="avatar-figure" filter="url(#${f})">${parts[s.id]()}</g>
      <rect width="200" height="200" fill="url(#${h})" mask="url(#${m})" opacity=".35"/>
    </svg>`;
  }

  /* ---------- Cristal ---------- */
  function crystal(restored = [], size = 220, opts = {}) {
    const ids = DISTRICTS.map(d => d.id);
    const g = id('cg');
    // 5 facetas alrededor de un núcleo
    const facets = [
      'M100 10 L130 70 L100 100 L70 70Z',
      'M130 70 L180 90 L150 150 L100 100Z',
      'M150 150 L110 200 L100 100Z',
      'M90 200 L50 150 L100 100 L110 200Z',
      'M50 150 L20 90 L70 70 L100 100Z',
    ];
    const shapes = facets.map((p, i) => {
      const d = DISTRICTS[i];
      const on = restored.includes(ids[i]) || opts.all;
      return `<path d="${p}" class="facet ${on ? 'on' : ''}" fill="${on ? d.color : '#3b3b44'}" stroke="#111" stroke-width="5" stroke-linejoin="round"/>`;
    }).join('');
    const glow = (opts.all ? 5 : restored.length) / 5;
    return `<svg class="crystal" viewBox="0 0 200 210" width="${size}" height="${size}">
      <defs><radialGradient id="${g}"><stop offset="0" stop-color="#fff" stop-opacity="${.25 + glow * .6}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <circle cx="100" cy="105" r="${80 + glow * 25}" fill="url(#${g})" class="crystal-glow"/>
      ${shapes}
      <path d="M100 10 L130 70 L100 100 L70 70Z" fill="#fff" opacity=".12"/>
      <path d="M78 40 L92 22" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      ${opts.cracked ? '<path d="M60 40 L95 95 L80 120 L120 160" stroke="#ff4fa3" stroke-width="3" fill="none" stroke-dasharray="4 3"/>' : ''}
    </svg>`;
  }

  /* ---------- Islas ---------- */
  const landmarks = {
    plaza: c => `
      <rect x="-48" y="-62" width="96" height="46" rx="4" fill="#e9f1ff"/>
      <path d="M-58 -62 L0 -96 L58 -62Z" fill="${c}"/>
      <g fill="#c4d8ff">${[-36, -18, 0, 18, 36].map(x => `<rect x="${x - 4}" y="-58" width="8" height="40" rx="3"/>`).join('')}</g>
      <rect x="-12" y="-36" width="24" height="20" rx="10" fill="#1d4ed8"/>
      <g transform="translate(0 -128)" class="float-sm">
        <path d="M-30 -20 Q-30 -34 -16 -34 L16 -34 Q30 -34 30 -20 L30 0 Q30 14 16 14 L-2 14 L-14 26 L-12 14 L-16 14 Q-30 14 -30 0Z" fill="#fff"/>
        <circle cx="-12" cy="-10" r="4" fill="${c}"/><circle cx="0" cy="-10" r="4" fill="${c}"/><circle cx="12" cy="-10" r="4" fill="${c}"/>
      </g>`,
    puerto: c => `
      <path d="M-14 -16 L-8 -110 L8 -110 L14 -16Z" fill="#fff"/>
      <g fill="${c}"><path d="M-12.6 -40 L12.6 -40 L11.4 -56 L-11.4 -56Z"/><path d="M-10.2 -72 L10.2 -72 L9 -88 L-9 -88Z"/></g>
      <rect x="-12" y="-124" width="24" height="16" rx="3" fill="#fff59d" class="beacon"/>
      <path d="M-14 -124 L0 -140 L14 -124Z" fill="#14532d"/>
      <path d="M12 -116 L70 -132 L70 -100Z" fill="#fff59d" opacity=".35" class="beam"/>
      <g transform="translate(-62 -24)"><path d="M-22 0 L22 0 L14 12 L-14 12Z" fill="#fff"/><path d="M0 0 L0 -30 L18 -4Z" fill="${c}"/></g>
      <g transform="translate(58 -20)"><rect x="-16" y="-24" width="32" height="24" rx="3" fill="#bbf7d0"/><path d="M-20 -24 L0 -38 L20 -24Z" fill="#15803d"/><rect x="-5" y="-14" width="10" height="14" fill="#14532d"/></g>`,
    isla: c => `
      <defs><linearGradient id="igr" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffb36b"/><stop offset=".5" stop-color="#ff4f8b"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      <rect x="-44" y="-104" width="88" height="88" rx="26" fill="url(#igr)"/>
      <rect x="-44" y="-104" width="88" height="88" rx="26" fill="none" stroke="#fff" stroke-width="4"/>
      <circle cx="0" cy="-60" r="22" fill="none" stroke="#fff" stroke-width="7"/>
      <circle cx="28" cy="-88" r="5" fill="#fff"/>
      <g transform="translate(-74 -20)"><rect x="-4" y="-6" width="8" height="10" fill="#8b5a2b"/><circle cx="0" cy="-16" r="14" fill="#ff8fb8"/></g>
      <g transform="translate(70 -20)"><rect x="-4" y="-6" width="8" height="10" fill="#8b5a2b"/><circle cx="0" cy="-18" r="16" fill="#ffb36b"/></g>`,
    torre: c => `
      <path d="M-22 -16 L-14 -150 L14 -150 L22 -16Z" fill="#e0fbff"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${-20 + i * 1.2} ${-30 - i * 20} Q0 ${-22 - i * 20} ${20 - i * 1.2} ${-40 - i * 20}" stroke="${c}" stroke-width="6" fill="none"/>`).join('')}
      <circle cx="0" cy="-168" r="20" fill="#0f172a" stroke="${c}" stroke-width="4"/>
      <text x="0" y="-160" text-anchor="middle" font-size="26" font-weight="800" fill="#fff" font-family="Fredoka, sans-serif">@</text>
      <g class="signal"><path d="M-36 -186 Q-46 -168 -36 -150" stroke="${c}" stroke-width="3" fill="none"/><path d="M36 -186 Q46 -168 36 -150" stroke="${c}" stroke-width="3" fill="none"/></g>
      <g transform="translate(-64 -18)"><rect x="-14" y="-30" width="28" height="30" rx="3" fill="#a5f3fc"/><rect x="-8" y="-24" width="6" height="6" fill="#0e7490"/><rect x="2" y="-24" width="6" height="6" fill="#0e7490"/></g>
      <g transform="translate(62 -18)"><rect x="-12" y="-44" width="24" height="44" rx="3" fill="#cffafe"/><rect x="-6" y="-36" width="12" height="5" fill="#0e7490"/><rect x="-6" y="-24" width="12" height="5" fill="#0e7490"/></g>`,
    nebulosa: c => `
      <path d="M-56 -16 A56 56 0 0 1 56 -16Z" fill="#c4b5fd" opacity=".45"/>
      <path d="M-56 -16 A56 56 0 0 1 56 -16" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M-30 -60 A40 40 0 0 1 10 -70" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/>
      <g transform="translate(0 -46)">
        <rect x="-30" y="-14" width="60" height="28" rx="12" fill="#1e1b4b"/>
        <rect x="-26" y="-10" width="52" height="20" rx="9" fill="url(#vr)"/>
        <defs><linearGradient id="vr" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      </g>
      <g transform="translate(64 -120)" class="float-sm"><circle r="16" fill="#f0abfc"/><ellipse rx="28" ry="7" fill="none" stroke="#fff" stroke-width="3" transform="rotate(-20)"/></g>
      <g fill="#fff"><circle cx="-70" cy="-90" r="2.5"/><circle cx="-40" cy="-120" r="1.8"/><circle cx="30" cy="-100" r="2"/></g>`,
  };

  function island(d, opts = {}) {
    const g = id('rock'), t = id('top');
    return `
      <defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4b8a"/><stop offset="1" stop-color="#1c1440"/></linearGradient>
        <linearGradient id="${t}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.color2}"/><stop offset="1" stop-color="${d.color}"/></linearGradient>
      </defs>
      <ellipse cx="0" cy="150" rx="90" ry="14" fill="${d.color}" opacity=".18" class="shadow-pulse"/>
      <path d="M-140 0 C-120 40 -60 70 -30 120 C-16 140 16 140 30 118 C60 70 120 40 140 0Z" fill="url(#${g})"/>
      <path d="M-100 20 C-80 40 -60 50 -50 70 M60 30 C70 50 80 50 90 30 M-10 70 L0 110" stroke="#fff" stroke-opacity=".08" stroke-width="6" fill="none"/>
      <ellipse cx="0" cy="0" rx="142" ry="34" fill="url(#${t})"/>
      <ellipse cx="0" cy="-4" rx="132" ry="27" fill="#fff" opacity=".12"/>
      <g transform="translate(0 4)">${landmarks[d.id](d.color)}</g>
      ${opts.done ? `<g transform="translate(110 -70)"><circle r="22" fill="#7ddf64" stroke="#fff" stroke-width="4"/><path d="M-9 0 L-2 8 L11 -8" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></g>` : ''}`;
  }

  return { avatar, crystal, island, heart };
})();
