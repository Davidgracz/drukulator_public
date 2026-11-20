/* Drukulator 0.26.14v — silnik generatora banerów (canvas 2D).
 * Czysta funkcja render(canvas, stan, zasoby, opcje): tło → wzór → dekor układu → logo / QR / plakietka → teksty.
 * Bez bibliotek zewnętrznych, bez sieci. Wszystko dzieje się w przeglądarce klienta.
 * Eksportuje window.Druk24BannerEngine (palety, czcionki, układy, szablony, podpowiedzi, render, narzędzia stanu). */
(() => {
  'use strict';

  const LIMITS = { headline: 46, sub: 70, contact: 70, cta: 24, badge: 14, qr: 180 };
  const SAFE_CM = 3;           // margines bezpieczny (cm) — nic ważnego nie powinno być bliżej krawędzi
  const EYELET_STEP_CM = 50;   // orientacyjny rozstaw oczek

  // ---------- kolory ----------
  const hex2rgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const contrast = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const bestOn = h => contrast(hex2rgb(h), [255, 255, 255]) >= contrast(hex2rgb(h), [17, 17, 17]) ? '#ffffff' : '#111111';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- palety ----------
  const P = (id, pl, en, bg1, bg2, text, accent, onAccent) => ({ id, name: { pl, en }, bg1, bg2, text, accent, onAccent });
  const PALETTES = [
    P('navy-gold', 'Granat i żółć', 'Navy & yellow', '#0f2747', '#1a4a82', '#ffffff', '#ffc928', '#0f2747'),
    P('red-white', 'Czerwień i biel', 'Red & white', '#d71920', '#a50f16', '#ffffff', '#ffffff', '#b3121a'),
    P('yellow-black', 'Żółty i czerń', 'Yellow & black', '#ffd60a', '#ffbf00', '#111111', '#111111', '#ffd60a'),
    P('black-orange', 'Czerń i pomarańcz', 'Black & orange', '#111111', '#2b2b2b', '#ffffff', '#ff6a13', '#111111'),
    P('white-blue', 'Biel i błękit', 'White & blue', '#ffffff', '#e8f0fb', '#12263f', '#1d6fe0', '#ffffff'),
    P('green-yellow', 'Zieleń i żółć', 'Green & yellow', '#0b6b3a', '#0e8a4b', '#ffffff', '#ffe14d', '#0b3d22'),
    P('purple-pink', 'Fiolet i róż', 'Purple & pink', '#3b1c6e', '#6a2fb0', '#ffffff', '#ff7ab8', '#2a0f4f'),
    P('teal-white', 'Turkus i biel', 'Teal & white', '#08808b', '#05606b', '#ffffff', '#ffffff', '#05606b'),
    P('cream-burgundy', 'Krem i bordo', 'Cream & burgundy', '#f7efe3', '#efe3d0', '#4a1020', '#8c1d3b', '#ffffff'),
    P('graphite-lime', 'Grafit i limonka', 'Graphite & lime', '#20252b', '#323a42', '#ffffff', '#b7f208', '#1a2000'),
    P('orange-brown', 'Pomarańcz i brąz', 'Orange & brown', '#ff7a00', '#ff9a1f', '#1a1000', '#ffffff', '#b34700'),
    P('blue-red', 'Niebieski i czerwień', 'Blue & red', '#0d47a1', '#1565c0', '#ffffff', '#ff3d3d', '#ffffff'),
    P('blush-rose', 'Pudrowy róż', 'Blush rose', '#ffe3ec', '#ffd0df', '#5b1033', '#e6155f', '#ffffff'),
    P('mint', 'Mięta', 'Mint', '#d9f5ec', '#bfeadb', '#0e3b43', '#0e8f6f', '#ffffff'),
    P('black-gold', 'Czerń i złoto', 'Black & gold', '#0b0b0c', '#1c1a14', '#f5e6b8', '#d4a017', '#0b0b0c'),
    P('burgundy-peach', 'Bordo i brzoskwinia', 'Burgundy & peach', '#6d0f2a', '#8f1b3d', '#ffffff', '#ffd6a5', '#4a0a1c'),
    P('sky', 'Niebo', 'Sky', '#4cc3ff', '#1c8fe0', '#08233f', '#ffffff', '#0d5fa8'),
    P('lavender', 'Lawenda', 'Lavender', '#ece6ff', '#d9ceff', '#2a1b5c', '#6a3df0', '#ffffff')
  ];
  const paletteById = id => PALETTES.find(p => p.id === id) || PALETTES[0];

  // ---------- czcionki (stosy systemowe; Montserrat dołącza się, jeśli strona go załadowała) ----------
  const SANS = '"Segoe UI","Helvetica Neue",Arial,"Liberation Sans",sans-serif';
  const FONTS = {
    modern: { name: { pl: 'Nowoczesna', en: 'Modern' }, head: ['"Montserrat","Segoe UI","Helvetica Neue",Arial,sans-serif', 800], body: ['"Montserrat","Segoe UI","Helvetica Neue",Arial,sans-serif', 600] },
    impact: { name: { pl: 'Mocna', en: 'Heavy' }, head: ['"Arial Black","Archivo Black","Helvetica Neue",Impact,sans-serif', 900], body: [SANS, 700] },
    serif: { name: { pl: 'Elegancka', en: 'Elegant' }, head: ['"Playfair Display",Georgia,"Times New Roman","Liberation Serif",serif', 700], body: ['Georgia,"Times New Roman","Liberation Serif",serif', 400] },
    condensed: { name: { pl: 'Wąska', en: 'Condensed' }, head: ['"Bahnschrift","Arial Narrow","Roboto Condensed","Liberation Sans Narrow","Helvetica Neue",Arial,sans-serif', 700], body: ['"Bahnschrift","Arial Narrow","Roboto Condensed","Liberation Sans Narrow",Arial,sans-serif', 500] },
    round: { name: { pl: 'Zaokrąglona', en: 'Rounded' }, head: ['"Trebuchet MS","Segoe UI",Verdana,"DejaVu Sans",sans-serif', 800], body: ['"Trebuchet MS","Segoe UI",Verdana,"DejaVu Sans",sans-serif', 600] }
  };

  const LAYOUTS = [
    { id: 'center', name: { pl: 'Wyśrodkowany', en: 'Centered' } },
    { id: 'left', name: { pl: 'Tekst z lewej', en: 'Text left' } },
    { id: 'right', name: { pl: 'Tekst z prawej', en: 'Text right' } },
    { id: 'bandBottom', name: { pl: 'Pas z kontaktem', en: 'Contact band' } },
    { id: 'bandTop', name: { pl: 'Pas nagłówka', en: 'Header band' } },
    { id: 'diagonal', name: { pl: 'Ukośny pas', en: 'Diagonal band' } },
    { id: 'frame', name: { pl: 'Ramka', en: 'Frame' } },
    { id: 'giant', name: { pl: 'Wielki nagłówek', en: 'Giant headline' } },
    { id: 'split', name: { pl: 'Podział', en: 'Split' } },
    { id: 'stripes', name: { pl: 'Pasy', en: 'Stripes' } },
    { id: 'minimal', name: { pl: 'Minimalny', en: 'Minimal' } },
    { id: 'ribbon', name: { pl: 'Wstęga', en: 'Ribbon' } }
  ];
  const PATTERNS = [
    { id: 'none', name: { pl: 'Brak', en: 'None' } }, { id: 'dots', name: { pl: 'Kropki', en: 'Dots' } },
    { id: 'lines', name: { pl: 'Ukośne linie', en: 'Diagonal lines' } }, { id: 'grid', name: { pl: 'Siatka', en: 'Grid' } }
  ];
  const ANCHORS = ['tl', 'tc', 'tr', 'bl', 'bc', 'br'];

  // ---------- stan ----------
  function defaultState() {
    return {
      v: 1, widthCm: 100, heightCm: 100, tpl: '',
      layout: 'center', pal: 'navy-gold', custom: { text: '', accent: '' }, font: 'modern',
      headline: 'TWÓJ NAGŁÓWEK', sub: 'Krótki opis oferty lub hasło reklamowe', contact: 'tel. 500 600 700 • www.twojafirma.pl', cta: 'Zadzwoń teraz', ctaOn: true,
      upper: true, align: 'auto', spacing: 0, shadow: false, outline: false,
      headScale: 100, subScale: 100, contactScale: 100,
      bg: { type: 'gradient', c1: '', c2: '', angle: 135, photo: '', dim: 45, px: 50, py: 50, zoom: 100, pattern: 'none' },
      frame: false,
      logo: { id: '', anchor: 'tl', size: 22, plate: true },
      qr: { on: false, text: '', anchor: 'br', size: 20 },
      badge: { on: false, text: '-30%', anchor: 'tr', size: 26, shape: 'burst', tilt: true }
    };
  }
  const num = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? clamp(v, a, b) : d; };
  const oneOf = (v, list, d) => list.includes(v) ? v : d;
  const col = (v, d = '') => /^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : d;
  const str = (v, max, d = '') => typeof v === 'string' ? v.slice(0, max) : d;
  function normalizeState(input) {
    const d = defaultState(), s = input && typeof input === 'object' ? input : {};
    const bg = s.bg || {}, lg = s.logo || {}, qr = s.qr || {}, bd = s.badge || {}, cu = s.custom || {};
    return {
      v: 1,
      widthCm: num(s.widthCm, 10, 1000, d.widthCm), heightCm: num(s.heightCm, 10, 1000, d.heightCm), tpl: str(s.tpl, 40),
      layout: oneOf(s.layout, LAYOUTS.map(l => l.id), d.layout), pal: PALETTES.some(p => p.id === s.pal) ? s.pal : d.pal,
      custom: { text: col(cu.text), accent: col(cu.accent) }, font: oneOf(s.font, Object.keys(FONTS), d.font),
      headline: str(s.headline, LIMITS.headline * 2, d.headline), sub: str(s.sub, LIMITS.sub * 2, d.sub), contact: str(s.contact, LIMITS.contact * 2, d.contact),
      cta: str(s.cta, LIMITS.cta * 2, d.cta), ctaOn: s.ctaOn !== false,
      upper: s.upper !== false, align: oneOf(s.align, ['auto', 'left', 'center', 'right'], 'auto'), spacing: num(s.spacing, -3, 12, 0), shadow: !!s.shadow, outline: !!s.outline,
      headScale: num(s.headScale, 40, 100, 100), subScale: num(s.subScale, 40, 100, 100), contactScale: num(s.contactScale, 40, 100, 100),
      bg: { type: oneOf(bg.type, ['solid', 'gradient', 'photo'], 'gradient'), c1: col(bg.c1), c2: col(bg.c2), angle: num(bg.angle, 0, 360, 135), photo: str(bg.photo, 24), dim: num(bg.dim, 0, 85, 45), px: num(bg.px, 0, 100, 50), py: num(bg.py, 0, 100, 50), zoom: num(bg.zoom, 100, 300, 100), pattern: oneOf(bg.pattern, PATTERNS.map(p => p.id), 'none') },
      frame: !!s.frame,
      logo: { id: str(lg.id, 24), anchor: oneOf(lg.anchor, ANCHORS, 'tl'), size: num(lg.size, 8, 60, 22), plate: lg.plate !== false },
      qr: { on: !!qr.on, text: str(qr.text, LIMITS.qr), anchor: oneOf(qr.anchor, ANCHORS, 'br'), size: num(qr.size, 8, 45, 20) },
      badge: { on: !!bd.on, text: str(bd.text, LIMITS.badge * 2, '-30%'), anchor: oneOf(bd.anchor, ANCHORS, 'tr'), size: num(bd.size, 12, 60, 26), shape: oneOf(bd.shape, ['burst', 'circle', 'ribbon'], 'burst'), tilt: bd.tilt !== false }
    };
  }
  function effPalette(st) {
    const p = paletteById(st.pal);
    const accent = st.custom.accent || p.accent;
    return {
      bg1: st.bg.c1 || p.bg1, bg2: st.bg.c2 || p.bg2, text: st.custom.text || p.text, accent,
      onAccent: st.custom.accent ? bestOn(accent) : p.onAccent
    };
  }

  // ---------- QR (cache) ----------
  const qrCache = new Map();
  function qrFor(text) {
    if (!window.Druk24QR || !text) return null;
    if (qrCache.has(text)) return qrCache.get(text);
    let q = null; try { q = window.Druk24QR.encode(text, 'M'); } catch (e) { q = null; }
    if (qrCache.size > 20) qrCache.clear();
    qrCache.set(text, q); return q;
  }

  // ---------- geometria ----------
  const R = (x, y, w, h) => ({ x, y, w, h });
  const inset = (r, d) => R(r.x + d, r.y + d, Math.max(1, r.w - 2 * d), Math.max(1, r.h - 2 * d));
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function avoid(box, rect, gap) {
    if (!hit(box, rect)) return box;
    const c = [];
    const left = rect.x - gap - box.x; if (left > 1) c.push({ ...box, w: left });
    const rx = rect.x + rect.w + gap; if (box.x + box.w - rx > 1) c.push({ ...box, x: rx, w: box.x + box.w - rx });
    const top = rect.y - gap - box.y; if (top > 1) c.push({ ...box, h: top });
    const ry = rect.y + rect.h + gap; if (box.y + box.h - ry > 1) c.push({ ...box, y: ry, h: box.y + box.h - ry });
    if (!c.length) return box;
    c.sort((a, b) => b.w * b.h - a.w * a.h);
    return c[0];
  }

  function anchorRect(I, w, h, anchor) {
    const x = anchor[1] === 'l' ? I.x : anchor[1] === 'r' ? I.x + I.w - w : I.x + (I.w - w) / 2;
    const y = anchor[0] === 't' ? I.y : I.y + I.h - h;
    return R(x, y, w, h);
  }

  // ---------- układy ----------
  const WEIGHTS = { head: 5, sub: 2.2, cta: 1.35, contact: 1.15 };
  function flow(g, rect, align, o = {}) {
    const keys = (o.keys || ['head', 'sub', 'cta', 'contact']).filter(k => g.has[k]);
    const w = { ...WEIGHTS, ...(o.weights || {}) };
    const gap = o.gap == null ? g.S * 0.02 : o.gap;
    const total = keys.reduce((s, k) => s + w[k], 0) || 1;
    const avail = rect.h - gap * Math.max(0, keys.length - 1);
    const grp = g.flowSeq = (g.flowSeq || 0) + 1;
    let y = rect.y; const out = {};
    keys.forEach(k => { const h = avail * w[k] / total; out[k] = { ...R(rect.x, y, rect.w, h), align, on: o.on || 'bg', grp }; y += h + gap; });
    return out;
  }
  const fillRect = (color, r) => c => { c.fillStyle = color; c.fillRect(r.x, r.y, r.w, r.h); };

  function frameDecor(g, thick) {
    const { pal, S, m } = g; const o = m * 0.55, t = thick || Math.max(2, S * 0.012);
    return c => {
      c.strokeStyle = pal.accent; c.lineWidth = t; c.strokeRect(o, o, g.W - 2 * o, g.H - 2 * o);
      c.lineWidth = Math.max(1, t * 0.35); c.strokeRect(o + t * 2.4, o + t * 2.4, g.W - 2 * (o + t * 2.4), g.H - 2 * (o + t * 2.4));
    };
  }

  const LAYOUT_FNS = {
    center(g) { return { decor: [], blocks: flow(g, g.I, 'center') }; },
    left(g) {
      const { I, S, mode } = g, bar = Math.max(S * 0.014, 3), gap = S * 0.04;
      const w = mode === 'tall' ? I.w - bar - gap : I.w * (mode === 'square' ? 0.74 : 0.62);
      return { decor: [fillRect(g.pal.accent, R(I.x, I.y, bar, I.h))], blocks: flow(g, R(I.x + bar + gap, I.y, w, I.h), 'left') };
    },
    right(g) {
      const { I, S, mode } = g, bar = Math.max(S * 0.014, 3), gap = S * 0.04;
      const w = mode === 'tall' ? I.w - bar - gap : I.w * (mode === 'square' ? 0.74 : 0.62);
      return { decor: [fillRect(g.pal.accent, R(I.x + I.w - bar, I.y, bar, I.h))], blocks: flow(g, R(I.x + I.w - bar - gap - w, I.y, w, I.h), 'right') };
    },
    bandBottom(g) {
      const { I, H, W, S, mode, pal, m } = g;
      const bh = H * (mode === 'tall' ? 0.2 : mode === 'wide' ? 0.2 : 0.18);
      const band = R(0, H - bh, W, bh), bi = R(I.x, band.y + bh * 0.14, I.w, bh * 0.72);
      const blocks = flow(g, R(I.x, I.y, I.w, band.y - I.y - m * 0.4), 'center', { keys: ['head', 'sub'] });
      if (mode === 'tall') Object.assign(blocks, flow(g, bi, 'center', { keys: ['cta', 'contact'], on: 'band', weights: { cta: 1.2, contact: 1 } }));
      else if (g.has.contact && g.has.cta) {
        blocks.contact = { ...R(bi.x, bi.y, bi.w * 0.6, bi.h), align: 'left', on: 'band' };
        blocks.cta = { ...R(bi.x + bi.w * 0.64, bi.y, bi.w * 0.36, bi.h), align: 'right', on: 'band' };
      } else if (g.has.contact) blocks.contact = { ...bi, align: 'center', on: 'band' };
      else if (g.has.cta) blocks.cta = { ...bi, align: 'center', on: 'band' };
      return { decor: [fillRect(pal.accent, band)], blocks };
    },
    bandTop(g) {
      const { I, H, W, mode, pal, S } = g;
      const bh = H * (mode === 'tall' ? 0.3 : mode === 'wide' ? 0.44 : 0.4);
      const blocks = {};
      if (g.has.head) blocks.head = { ...R(I.x, g.m * 0.7, I.w, bh - g.m * 1.4), align: 'center', on: 'band' };
      Object.assign(blocks, flow(g, R(I.x, bh + S * 0.04, I.w, I.y + I.h - bh - S * 0.04), 'center', { keys: ['sub', 'cta', 'contact'] }));
      return { decor: [fillRect(pal.accent, R(0, 0, W, bh))], blocks };
    },
    diagonal(g) {
      const { W, H, I, pal, mode } = g;
      const slope = Math.min(0.12 * H, W * 0.06), top = H * (mode === 'tall' ? 0.2 : 0.2), th = H * (mode === 'wide' ? 0.42 : 0.36);
      const angle = Math.atan2(-slope, W), cy = top + th / 2 - slope / 2;
      const decor = c => { c.fillStyle = pal.accent; c.beginPath(); c.moveTo(0, top); c.lineTo(W, top - slope); c.lineTo(W, top - slope + th); c.lineTo(0, top + th); c.closePath(); c.fill(); };
      const bw = W * 0.9, bhh = th * 0.74;
      const blocks = {};
      if (g.has.head) blocks.head = { ...R(W / 2 - bw / 2, cy - bhh / 2, bw, bhh), align: 'center', on: 'band', rot: angle, pivot: [W / 2, cy] };
      const below = top + th + g.S * 0.03;
      Object.assign(blocks, flow(g, R(I.x, below, I.w, I.y + I.h - below), 'center', { keys: ['sub', 'cta', 'contact'] }));
      return { decor: [decor], blocks };
    },
    frame(g) { return { decor: [frameDecor(g)], blocks: flow(g, inset(g.I, g.S * 0.07), 'center') }; },
    giant(g) {
      const { I, mode } = g;
      const blocks = {};
      const rows = [g.has.head ? 10 : 0, g.has.sub ? 2.2 : 0, (g.has.contact || g.has.cta) ? 1.7 : 0];
      const gap = g.S * 0.02, tot = rows.reduce((a, b) => a + b, 0) || 1, avail = I.h - gap * (rows.filter(Boolean).length - 1);
      let y = I.y; const hh = r => avail * r / tot;
      if (rows[0]) { blocks.head = { ...R(I.x, y, I.w, hh(rows[0])), align: 'left', on: 'bg' }; y += hh(rows[0]) + gap; }
      if (rows[1]) { blocks.sub = { ...R(I.x, y, I.w * (mode === 'tall' ? 1 : 0.7), hh(rows[1])), align: 'left', on: 'bg' }; y += hh(rows[1]) + gap; }
      if (rows[2]) {
        const r = R(I.x, y, I.w, hh(rows[2]));
        if (g.has.contact && g.has.cta && mode !== 'tall') { blocks.contact = { ...R(r.x, r.y, r.w * 0.58, r.h), align: 'left', on: 'bg' }; blocks.cta = { ...R(r.x + r.w * 0.62, r.y, r.w * 0.38, r.h), align: 'right', on: 'bg' }; }
        else Object.assign(blocks, flow(g, r, 'left', { keys: ['cta', 'contact'], gap }));
      }
      return { decor: [fillRect(g.pal.accent, R(I.x, I.y - g.S * 0.025, I.w * 0.16, Math.max(3, g.S * 0.012)))], blocks };
    },
    split(g) {
      const { W, H, I, pal, mode, S, m } = g;
      const blocks = {};
      if (mode === 'tall') {
        const ph = H * 0.4, panel = R(0, 0, W, ph);
        if (g.has.head) blocks.head = { ...R(I.x, m * 0.7, I.w, ph - m * 1.4), align: 'center', on: 'band' };
        Object.assign(blocks, flow(g, R(I.x, ph + S * 0.04, I.w, I.y + I.h - ph - S * 0.04), 'center', { keys: ['sub', 'cta', 'contact'] }));
        return { decor: [fillRect(pal.accent, panel)], blocks };
      }
      const pw = W * 0.46, panel = R(0, 0, pw, H);
      if (g.has.head) blocks.head = { ...R(I.x, I.y, pw - I.x - m * 0.8, I.h), align: 'left', on: 'band' };
      Object.assign(blocks, flow(g, R(pw + m * 0.9, I.y, W - pw - m * 0.9 - I.x, I.h), 'left', { keys: ['sub', 'cta', 'contact'] }));
      return { decor: [fillRect(pal.accent, panel)], blocks };
    },
    stripes(g) {
      const { W, H, I, pal, m } = g;
      const th = H * 0.05, bh = H * 0.14;
      const blocks = flow(g, R(I.x, th + m * 0.6, I.w, H - th - bh - m * 1.1), 'center', { keys: ['head', 'sub', 'cta'] });
      if (g.has.contact) blocks.contact = { ...R(I.x, H - bh + bh * 0.15, I.w, bh * 0.7), align: 'center', on: 'band' };
      return { decor: [fillRect(pal.accent, R(0, 0, W, th)), fillRect(pal.accent, R(0, H - bh, W, bh))], blocks };
    },
    minimal(g) {
      const { I, mode, S } = g;
      const w = I.w * (mode === 'tall' ? 1 : 0.72), top = S * 0.05;
      return { decor: [fillRect(g.pal.accent, R(I.x, I.y, Math.min(I.w * 0.14, S * 0.3), Math.max(3, S * 0.014)))], blocks: flow(g, R(I.x, I.y + top, w, I.h - top), 'left') };
    },
    ribbon(g) {
      const { W, H, I, pal, mode, S } = g;
      const rh = H * (mode === 'wide' ? 0.42 : mode === 'tall' ? 0.28 : 0.34), ry = (H - rh) / 2 - H * 0.03;
      const blocks = {};
      if (g.has.head) blocks.head = { ...R(I.x, ry + rh * 0.08, I.w, rh * 0.84), align: 'center', on: 'band' };
      if (g.has.sub) blocks.sub = { ...R(I.x, I.y, I.w, Math.max(S * 0.05, ry - I.y - S * 0.03)), align: 'center', on: 'bg' };
      const by = ry + rh + S * 0.03;
      Object.assign(blocks, flow(g, R(I.x, by, I.w, I.y + I.h - by), 'center', { keys: ['cta', 'contact'] }));
      return { decor: [fillRect(pal.accent, R(0, ry, W, rh))], blocks };
    }
  };

  // Banery bardzo wydłużone (np. 10 × 1 m): jedna linia — nagłówek | opis i kontakt | przycisk.
  function stripLayout(g, id) {
    const { W, H, I, pal, m } = g;
    const decor = []; let area = I; let headPanel = false;
    if (id === 'bandBottom' || id === 'stripes') { const bh = H * 0.14; decor.push(fillRect(pal.accent, R(0, H - bh, W, bh))); area = R(I.x, I.y, I.w, H - bh - I.y - m * 0.2); }
    else if (id === 'bandTop') { const bh = H * 0.14; decor.push(fillRect(pal.accent, R(0, 0, W, bh))); area = R(I.x, bh + m * 0.2, I.w, I.y + I.h - bh - m * 0.2); }
    else if (id === 'frame') { decor.push(frameDecor(g)); area = inset(I, H * 0.1); }
    else if (['split', 'diagonal', 'ribbon', 'giant'].includes(id)) headPanel = true;
    else { const bar = Math.max(H * 0.04, 3); decor.push(fillRect(pal.accent, R(I.x, I.y, bar, I.h))); area = R(I.x + bar * 3, I.y, I.w - bar * 3, I.h); }
    const mid = g.has.sub || g.has.contact, gap = H * 0.5;
    const cols = [g.has.head && { k: 'head', w: 5 }, mid && { k: 'mid', w: 2.7 }, g.has.cta && { k: 'cta', w: 1.5 }].filter(Boolean);
    const tw = cols.reduce((s, c) => s + c.w, 0) || 1, avail = area.w - gap * (cols.length - 1);
    let x = area.x; const blocks = {}; const align = id === 'center' ? 'center' : 'left';
    cols.forEach(c => {
      const w = avail * c.w / tw, r = R(x, area.y, w, area.h);
      if (c.k === 'head') {
        blocks.head = { ...r, align, on: headPanel ? 'band' : 'bg' };
        if (headPanel) decor.unshift(fillRect(pal.accent, R(0, 0, x + w + gap / 2, H)));
      } else if (c.k === 'mid') Object.assign(blocks, flow(g, r, align, { keys: ['sub', 'contact'], gap: H * 0.03 }));
      else blocks.cta = { ...r, align: 'right', on: 'bg' };
      x += w + gap;
    });
    return { decor, blocks };
  }

  // ---------- tekst ----------
  const setFont = (ctx, f, size) => { ctx.font = `${f[1]} ${size}px ${f[0]}`; };
  const hasSpacing = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  const setSpacing = (ctx, px) => { if (hasSpacing) ctx.letterSpacing = px ? px + 'px' : '0px'; };
  const nbsp = t => t.replace(/(^|[ \n])([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]) +/g, '$1$2 ');

  function wrap(ctx, text, maxW) {
    const lines = [];
    for (const para of text.split('\n')) {
      const words = para.split(/ +/).filter(Boolean);
      if (!words.length) { lines.push(''); continue; }
      let line = words[0];
      for (let i = 1; i < words.length; i++) {
        const t = line + ' ' + words[i];
        if (ctx.measureText(t).width <= maxW) line = t; else { lines.push(line); line = words[i]; }
      }
      lines.push(line);
    }
    return lines;
  }

  function fit(ctx, text, box, o) {
    const lh = o.lh, f = o.font;
    const attempt = size => {
      setFont(ctx, f, size); setSpacing(ctx, (o.spacing || 0) / 100 * size);
      const lines = wrap(ctx, text, box.w); let mw = 0;
      for (const l of lines) mw = Math.max(mw, ctx.measureText(l).width);
      return { lines, mw, size, h: lines.length * size * lh };
    };
    const ok = r => r.mw <= box.w + 0.5 && r.h <= box.h + 0.5 && r.lines.length <= (o.maxLines || 9);
    let hi = Math.max(4, Math.min(o.maxSize == null ? Infinity : o.maxSize, box.h)), lo = 3;
    let best = attempt(hi);
    if (!ok(best)) {
      best = attempt(lo);
      for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2, r = attempt(mid); if (ok(r)) { lo = mid; best = r; } else hi = mid; }
    }
    const overflow = !ok(best);
    const final = attempt(Math.max(3, best.size * (o.scale == null ? 1 : o.scale)));
    final.overflow = overflow;
    return final;
  }

  function paintLines(ctx, r, box, o) {
    setFont(ctx, o.font, r.size); setSpacing(ctx, (o.spacing || 0) / 100 * r.size);
    ctx.textAlign = o.align; ctx.textBaseline = 'middle'; ctx.fillStyle = o.color;
    const total = r.lines.length * r.size * o.lh;
    const y0 = o.valign === 'top' ? box.y : o.valign === 'bottom' ? box.y + box.h - total : box.y + (box.h - total) / 2;
    const x = o.align === 'left' ? box.x : o.align === 'right' ? box.x + box.w : box.x + box.w / 2;
    r.lines.forEach((line, i) => {
      const y = y0 + (i + 0.5) * r.size * o.lh;
      if (o.outline) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = r.size * 0.1; ctx.strokeStyle = o.outline; ctx.strokeText(line, x, y); ctx.restore(); }
      if (o.shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = r.size * 0.16; ctx.shadowOffsetY = r.size * 0.05; ctx.fillText(line, x, y); ctx.restore(); }
      else ctx.fillText(line, x, y);
    });
    setSpacing(ctx, 0);
    return { x, y0, total };
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function burst(ctx, cx, cy, r, points, inner) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = Math.PI * i / points - Math.PI / 2, rr = i % 2 ? r * inner : r;
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  // ---------- tło ----------
  function drawBackground(ctx, st, pal, assets, W, H, report) {
    const bg = st.bg;
    const photo = bg.type === 'photo' && assets && assets[bg.photo] ? assets[bg.photo] : null;
    if (photo) {
      const iw = photo.naturalWidth || photo.width, ih = photo.naturalHeight || photo.height;
      const sc = Math.max(W / iw, H / ih) * bg.zoom / 100, dw = iw * sc, dh = ih * sc;
      ctx.fillStyle = pal.bg1; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(photo, -(dw - W) * bg.px / 100, -(dh - H) * bg.py / 100, dw, dh);
      if (bg.dim > 0) { ctx.fillStyle = rgba(pal.bg1, bg.dim / 100); ctx.fillRect(0, 0, W, H); }
      report.photoDpi = Math.round(iw / (dw / W * st.widthCm / 2.54));
    } else if (bg.type === 'solid') { ctx.fillStyle = pal.bg1; ctx.fillRect(0, 0, W, H); }
    else {
      const th = bg.angle * Math.PI / 180, dx = Math.sin(th), dy = -Math.cos(th), len = Math.abs(W * dx) + Math.abs(H * dy);
      const g = ctx.createLinearGradient(W / 2 - dx * len / 2, H / 2 - dy * len / 2, W / 2 + dx * len / 2, H / 2 + dy * len / 2);
      g.addColorStop(0, pal.bg1); g.addColorStop(1, pal.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (bg.type === 'photo' && !photo) report.needsPhoto = true;
    // wzór
    if (bg.pattern !== 'none') {
      const S = Math.min(W, H), sp = Math.max(8, S * 0.045);
      const light = lum(hex2rgb(pal.bg1)) < 0.4;
      ctx.save(); ctx.globalAlpha = 0.09; ctx.fillStyle = ctx.strokeStyle = light ? '#ffffff' : '#000000';
      if (bg.pattern === 'dots') { for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2 + ((Math.round(y / sp) % 2) ? sp / 2 : 0); x < W; x += sp) { ctx.beginPath(); ctx.arc(x, y, sp * 0.14, 0, 6.2832); ctx.fill(); } }
      else if (bg.pattern === 'lines') { ctx.lineWidth = sp * 0.12; ctx.beginPath(); for (let x = -H; x < W; x += sp * 0.9) { ctx.moveTo(x, H); ctx.lineTo(x + H, 0); } ctx.stroke(); }
      else { ctx.lineWidth = Math.max(1, sp * 0.05); ctx.beginPath(); for (let x = 0; x < W; x += sp) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y < H; y += sp) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
      ctx.restore();
    }
  }

  // ---------- średni kontrast pod tekstem ----------
  let scratch = null;
  function sampleContrast(ctx, box, color) {
    try {
      if (!scratch) { scratch = document.createElement('canvas'); scratch.width = scratch.height = 24; }
      const sc = scratch.getContext('2d', { willReadFrequently: true });
      const x = clamp(box.x, 0, ctx.canvas.width - 1), y = clamp(box.y, 0, ctx.canvas.height - 1);
      const w = Math.max(1, Math.min(box.w, ctx.canvas.width - x)), h = Math.max(1, Math.min(box.h, ctx.canvas.height - y));
      sc.clearRect(0, 0, 24, 24); sc.drawImage(ctx.canvas, x, y, w, h, 0, 0, 24, 24);
      const d = sc.getImageData(0, 0, 24, 24).data, tc = hex2rgb(color), vals = [];
      for (let i = 0; i < d.length; i += 4) vals.push(contrast([d[i], d[i + 1], d[i + 2]], tc));
      vals.sort((a, b) => a - b);
      return vals[Math.floor(vals.length * 0.15)];
    } catch (e) { return null; }
  }

  // ---------- główny render ----------
  function render(canvas, st, assets, opts = {}) {
    st = normalizeState(st); assets = assets || {};
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
    const S = Math.min(W, H), pxCm = W / st.widthCm, pal = effPalette(st);
    const m = Math.max(SAFE_CM * pxCm, S * 0.04), mode = W / H >= 4.2 ? 'strip' : W / H >= 1.3 ? 'wide' : W / H <= 0.77 ? 'tall' : 'square';
    const I = R(m, m, W - 2 * m, H - 2 * m);
    const report = { W, H, pxCm, mode, issues: [], blocks: {}, safeCm: SAFE_CM };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent';

    drawBackground(ctx, st, pal, assets, W, H, report);

    // teksty (wielkie litery tylko w nagłówku i przycisku)
    const up = t => st.upper ? t.toLocaleUpperCase('pl') : t;
    const texts = { head: up(nbsp(st.headline.trim())), sub: nbsp(st.sub.trim()), contact: st.contact.trim(), cta: up(st.cta.trim()) };
    const has = { head: !!texts.head, sub: !!texts.sub, contact: !!texts.contact, cta: st.ctaOn && !!texts.cta };
    const g = { W, H, S, m, I, mode, pal, has, pxCm };
    const layout = (mode === 'strip' ? stripLayout(g, st.layout) : LAYOUT_FNS[st.layout](g));

    // elementy dodatkowe: logo, QR, plakietka (kotwice bez kolizji)
    const used = new Set(); const reserved = []; const place = (want, w, h) => {
      const order = [want, ...ANCHORS.filter(a => a !== want)];
      const a = order.find(k => !used.has(k)) || want; used.add(a);
      return anchorRect(I, w, h, a);
    };
    const logoImg = st.logo.id ? assets[st.logo.id] : null;
    const items = [];
    if (logoImg) {
      const iw = logoImg.naturalWidth || logoImg.width || 300, ih = logoImg.naturalHeight || logoImg.height || 300, side = S * st.logo.size / 100;
      let lw = iw >= ih ? side : side * iw / ih, lh = iw >= ih ? side * ih / iw : side;
      if (lw > I.w * 0.45) { lh *= I.w * 0.45 / lw; lw = I.w * 0.45; }
      const pad = st.logo.plate ? Math.min(lw, lh) * 0.14 : 0, r = place(st.logo.anchor, lw + 2 * pad, lh + 2 * pad);
      items.push({ k: 'logo', r, pad, lw, lh, iw }); reserved.push(r);
    }
    let qr = null;
    if (st.qr.on && st.qr.text.trim()) qr = qrFor(st.qr.text.trim());
    if (st.qr.on && st.qr.text.trim() && !qr) report.issues.push({ id: 'qr-fail', level: 'bad' });
    if (qr) {
      const side = Math.min(S * st.qr.size / 100, I.w * 0.45), r = place(st.qr.anchor, side, side);
      items.push({ k: 'qr', r, qr }); reserved.push(r);
      report.qrCm = side / pxCm; report.qrModules = qr.size;
    }
    if (st.badge.on && st.badge.text.trim()) {
      const side = Math.min(S * st.badge.size / 100, I.w * 0.45), r = place(st.badge.anchor, side * (st.badge.shape === 'ribbon' ? 1.7 : 1), side * (st.badge.shape === 'ribbon' ? 0.62 : 1));
      items.push({ k: 'badge', r }); reserved.push(r);
    }

    // dekor układu + ramka użytkownika
    layout.decor.forEach(fn => fn(ctx));
    if (st.frame && st.layout !== 'frame') frameDecor(g, Math.max(2, S * 0.01))(ctx);

    // rysowanie elementów dodatkowych
    for (const it of items) {
      const { r } = it;
      if (it.k === 'logo') {
        if (it.pad) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = S * 0.012; roundRect(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.14); ctx.fill(); ctx.restore(); }
        ctx.drawImage(logoImg, r.x + it.pad, r.y + it.pad, it.lw, it.lh);
        if (!/^data:image\/svg/.test(logoImg.src || '')) report.logoDpi = Math.round(it.iw / (it.lw / pxCm / 2.54));
      } else if (it.k === 'qr') {
        const q = it.qr, quiet = 3, cell = r.w / (q.size + quiet * 2);
        ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = S * 0.01; roundRect(ctx, r.x, r.y, r.w, r.h, r.w * 0.04); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#000';
        for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.get(x, y)) {
          const x0 = Math.round(r.x + (x + quiet) * cell), y0 = Math.round(r.y + (y + quiet) * cell);
          ctx.fillRect(x0, y0, Math.round(r.x + (x + quiet + 1) * cell) - x0, Math.round(r.y + (y + quiet + 1) * cell) - y0);
        }
      } else if (it.k === 'badge') {
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        ctx.save(); ctx.translate(cx, cy); if (st.badge.tilt) ctx.rotate(-0.17);
        ctx.fillStyle = pal.accent; ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = S * 0.015; ctx.shadowOffsetY = S * 0.006;
        if (st.badge.shape === 'burst') burst(ctx, 0, 0, Math.min(r.w, r.h) / 2, 16, 0.86);
        else if (st.badge.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, Math.min(r.w, r.h) / 2, 0, 6.2832); }
        else roundRect(ctx, -r.w / 2, -r.h / 2, r.w, r.h, r.h * 0.2);
        ctx.fill(); ctx.shadowColor = 'transparent';
        const inner = st.badge.shape === 'ribbon' ? 0.84 : 0.66, bw = r.w * inner, bh = r.h * inner;
        const bt = fit(ctx, up(st.badge.text.trim()), { x: -bw / 2, y: -bh / 2, w: bw, h: bh }, { font: [FONTS[st.font].head[0], FONTS[st.font].head[1]], lh: 1.02, maxLines: 2 });
        paintLines(ctx, bt, { x: -bw / 2, y: -bh / 2, w: bw, h: bh }, { font: [FONTS[st.font].head[0], FONTS[st.font].head[1]], lh: 1.02, align: 'center', color: pal.onAccent });
        ctx.restore();
      }
    }

    // kolizje bloków tekstu z elementami dodatkowymi
    const gap = S * 0.025, blocks = layout.blocks, keys = Object.keys(blocks);
    keys.forEach(k => { let b = blocks[k]; reserved.forEach(rv => { b = { ...avoid(b, rv, gap), align: b.align, on: b.on, rot: b.rot, pivot: b.pivot }; }); blocks[k] = b; });

    const colorOf = b => b.on === 'band' ? pal.onAccent : pal.text;
    const txtColor = k => colorOf(blocks[k] || {});
    const F = FONTS[st.font], align = b => st.align === 'auto' ? b.align : st.align;

    // 1) plan: dopasowanie rozmiaru tekstu do pól
    const plans = {};
    const plan = (k, text, o) => {
      const b = blocks[k]; if (!b) return null;
      const fin = { ...o, align: align(b), color: txtColor(k) };
      const box = b.rot ? R(-b.w / 2, -b.h / 2, b.w, b.h) : b;
      const r = fit(ctx, text, box, fin);
      plans[k] = { k, b, fin, box, r, used: r.lines.length * r.size * fin.lh };
      return r;
    };
    let headSize = 0;
    if (blocks.head) {
      const r = plan('head', texts.head, { font: F.head, lh: 1.05, maxLines: 4, scale: st.headScale / 100, spacing: st.spacing, shadow: st.shadow, outline: st.outline ? (pal.accent === pal.text ? pal.bg1 : pal.accent) : '', valign: 'middle' });
      headSize = r ? r.size : 0;
    }
    const subCap = headSize ? headSize * 0.62 : null, conCap = headSize ? headSize * 0.46 : null;
    if (blocks.sub) plan('sub', texts.sub, { font: F.body, lh: 1.22, maxLines: 3, maxSize: subCap, scale: st.subScale / 100, shadow: st.shadow && st.bg.type === 'photo', valign: 'middle' });
    if (blocks.contact) plan('contact', texts.contact, { font: [F.body[0], Math.max(F.body[1], 700)], lh: 1.2, maxLines: 2, maxSize: conCap, scale: st.contactScale / 100, shadow: st.shadow && st.bg.type === 'photo', valign: 'middle' });
    if (blocks.cta) {
      const b = blocks.cta, band = b.on === 'band';
      const probe = fit(ctx, texts.cta, R(0, 0, b.w * 0.8, b.h * 0.5), { font: F.head, lh: 1, maxLines: 1, maxSize: headSize ? headSize * 0.5 : null });
      setFont(ctx, F.head, probe.size);
      const tw = ctx.measureText(texts.cta).width, pad = probe.size * 0.85, bh = Math.min(b.h, probe.size * 2), bw = Math.min(b.w, tw + 2 * pad);
      plans.cta = { k: 'cta', b, box: b, used: bh, cta: { size: probe.size, bw, bh, fill: band ? pal.bg1 : pal.accent, tcol: band ? pal.text : pal.onAccent } };
    }

    // 2) zagęszczenie: bloki jednego stosu tworzą zwartą, wyśrodkowaną grupę (zamiast rozciągać się na całą wysokość)
    const groups = {};
    Object.values(plans).forEach(p => { if (p.b.grp && !p.b.rot) (groups[p.b.grp] = groups[p.b.grp] || []).push(p); });
    Object.values(groups).forEach(list => {
      list.sort((a, c) => a.b.y - c.b.y);
      const top = list[0].b.y, bottom = Math.max(...list.map(p => p.b.y + p.b.h)), sum = list.reduce((a, p) => a + p.used, 0), free = bottom - top - sum;
      if (free <= 0) return;
      const n = list.length, gapPx = Math.min(n > 1 ? free / (n + 1) : 0, Math.max(S * 0.03, headSize * 0.55));
      let y = top + (bottom - top - sum - gapPx * (n - 1)) / 2;
      list.forEach(p => { p.box = { ...p.b, y, h: p.used }; y += p.used + gapPx; });
    });

    // 3) pomiar kontrastu pod tekstem (tylko podgląd)
    if (opts.analyze) Object.values(plans).forEach(p => { if (p.k !== 'cta' && !p.b.rot) { const c = sampleContrast(ctx, p.box, txtColor(p.k)); if (c) report.blocks[p.k] = { contrast: c }; } });

    // 4) rysowanie
    Object.values(plans).forEach(p => {
      if (p.k === 'cta') {
        const c = p.cta, b = p.box, al = align(p.b);
        const bx = al === 'left' ? b.x : al === 'right' ? b.x + b.w - c.bw : b.x + (b.w - c.bw) / 2, by = b.y + (b.h - c.bh) / 2;
        ctx.save(); ctx.fillStyle = c.fill; ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = c.size * 0.35; ctx.shadowOffsetY = c.size * 0.1;
        roundRect(ctx, bx, by, c.bw, c.bh, c.bh * 0.32); ctx.fill(); ctx.restore();
        ctx.save(); ctx.fillStyle = c.tcol; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; setFont(ctx, F.head, c.size); ctx.fillText(texts.cta, bx + c.bw / 2, by + c.bh / 2); ctx.restore();
        report.blocks.cta = { ...(report.blocks.cta || {}), size: c.size, box: R(bx, by, c.bw, c.bh) };
        return;
      }
      ctx.save();
      if (p.b.rot) { ctx.translate(p.b.pivot[0], p.b.pivot[1]); ctx.rotate(p.b.rot); }
      paintLines(ctx, p.r, p.box, p.fin);
      ctx.restore();
      report.blocks[p.k] = { ...(report.blocks[p.k] || {}), size: p.r.size, lines: p.r.lines.length, overflow: p.r.overflow, box: p.box, capCm: p.r.size / pxCm * 0.72 };
    });

    // przewodnik (tylko podgląd): margines bezpieczny i oczka
    if (opts.guides) {
      ctx.save();
      const lw = Math.max(1.5, S * 0.003);
      ctx.setLineDash([lw * 5, lw * 4]); ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(0,200,255,.95)';
      ctx.strokeRect(SAFE_CM * pxCm, SAFE_CM * pxCm, W - 2 * SAFE_CM * pxCm, H - 2 * SAFE_CM * pxCm);
      ctx.setLineDash([]);
      const er = Math.max(2.5, 0.9 * pxCm), off = 1.6 * pxCm, pts = [];
      const along = (len, f) => { const n = Math.max(1, Math.ceil((len - 2 * off) / pxCm / EYELET_STEP_CM)); for (let i = 0; i <= n; i++) f(off + (len - 2 * off) * i / n); };
      if (opts.eyelets !== false) {
        along(W, x => { pts.push([x, off], [x, H - off]); });
        if (H / pxCm > EYELET_STEP_CM * 1.2) along(H, y => { if (y > off + 1 && y < H - off - 1) pts.push([off, y], [W - off, y]); });
      }
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.strokeStyle = 'rgba(20,20,20,.85)'; ctx.lineWidth = Math.max(1, er * 0.22);
      pts.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, er, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, er * 0.42, 0, 6.2832); ctx.fillStyle = 'rgba(30,30,30,.8)'; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.95)'; });
      ctx.restore();
    }
    ctx.restore();

    // raport jakości
    const h = report.blocks.head;
    if (h && h.size) { report.headCm = h.capCm; report.distM = Math.max(1, Math.round(h.capCm * 1.2)); }
    const cs = Object.values(report.blocks).map(b => b.contrast).filter(Boolean);
    if (cs.length) { report.minContrast = Math.min(...cs); }
    report.rating = report.minContrast == null ? null : report.minContrast >= 7 ? 'great' : report.minContrast >= 4.5 ? 'good' : report.minContrast >= 3 ? 'weak' : 'bad';
    if (!has.head) report.issues.push({ id: 'no-head', level: 'warn' });
    if (Object.values(report.blocks).some(b => b.overflow)) report.issues.push({ id: 'overflow', level: 'warn' });
    if (report.rating === 'weak' || report.rating === 'bad') report.issues.push({ id: 'contrast', level: report.rating === 'bad' ? 'bad' : 'warn' });
    if (report.qrCm != null) { if (report.qrCm < 4) report.issues.push({ id: 'qr-small', level: 'warn', v: report.qrCm }); else report.issues.push({ id: 'qr-ok', level: 'ok', v: report.qrCm }); }
    if (report.photoDpi != null && report.photoDpi < 30) report.issues.push({ id: 'photo-dpi', level: 'warn', v: report.photoDpi });
    if (report.logoDpi != null && report.logoDpi < 30) report.issues.push({ id: 'logo-dpi', level: 'warn', v: report.logoDpi });
    if (report.needsPhoto) report.issues.push({ id: 'need-photo', level: 'warn' });
    return report;
  }

  // ---------- szablony ----------
  const T = (id, cat, layout, pal, font, head, sub, cta, contact, extra) => ({ id, cat, layout, pal, font, head, sub, cta, contact, ...(extra || {}) });
  const TEMPLATE_CATS = [
    { id: 'all', name: { pl: 'Wszystkie', en: 'All' } }, { id: 'promo', name: { pl: 'Promocje', en: 'Sales' } },
    { id: 'open', name: { pl: 'Otwarcia', en: 'Openings' } }, { id: 'service', name: { pl: 'Usługi', en: 'Services' } },
    { id: 'food', name: { pl: 'Gastronomia', en: 'Food' } }, { id: 'estate', name: { pl: 'Nieruchomości', en: 'Real estate' } },
    { id: 'event', name: { pl: 'Wydarzenia', en: 'Events' } }, { id: 'job', name: { pl: 'Rekrutacja', en: 'Hiring' } }
  ];
  const TEMPLATES = [
    T('promo-sale', 'promo', 'giant', 'red-white', 'impact', 'WYPRZEDAŻ', 'Wszystko do -50% • tylko w tym tygodniu', 'Sprawdź ofertę', 'www.twojsklep.pl', { badge: { text: '-50%', anchor: 'tr', shape: 'burst' } }),
    T('promo-30', 'promo', 'center', 'yellow-black', 'impact', 'PROMOCJA -30%', 'Na całą kolekcję wiosna / lato', 'Zapraszamy', 'ul. Przykładowa 12, Szczecin', { pattern: 'dots' }),
    T('promo-mega', 'promo', 'diagonal', 'black-orange', 'impact', 'MEGA OKAZJA', 'Tylko do końca miesiąca', 'Kup teraz', 'tel. 500 600 700'),
    T('promo-black', 'promo', 'frame', 'black-gold', 'serif', 'BLACK WEEK', 'Najlepsze ceny roku', 'Zobacz więcej', 'www.twojsklep.pl', { upper: true }),
    T('open-grand', 'open', 'bandBottom', 'teal-white', 'modern', 'WIELKIE OTWARCIE', 'Sobota od 10:00 • atrakcje i rabaty', 'Zapraszamy', 'ul. Przykładowa 12, Szczecin'),
    T('open-now', 'open', 'left', 'navy-gold', 'modern', 'JUŻ OTWARTE', 'Zapraszamy do nowego salonu', 'Wejdź', 'tel. 500 600 700 • www.twojafirma.pl', { pattern: 'lines' }),
    T('open-soon', 'open', 'ribbon', 'purple-pink', 'round', 'WKRÓTCE OTWARCIE', 'Śledź nas w mediach społecznościowych', '', 'www.twojafirma.pl'),
    T('open-welcome', 'open', 'stripes', 'green-yellow', 'modern', 'ZAPRASZAMY', 'Otwarte codziennie 8:00–20:00', 'Odwiedź nas', 'ul. Przykładowa 12'),
    T('srv-reno', 'service', 'bandBottom', 'navy-gold', 'condensed', 'REMONTY MIESZKAŃ', 'Solidnie • Terminowo • Z gwarancją', 'Bezpłatna wycena', 'tel. 500 600 700'),
    T('srv-wash', 'service', 'split', 'sky', 'impact', 'MYJNIA RĘCZNA', 'Dokładnie • Szybko • Bez kolejek', 'Zajedź', 'ul. Przykładowa 12, Szczecin'),
    T('srv-clean', 'service', 'minimal', 'mint', 'modern', 'FIRMA SPRZĄTAJĄCA', 'Biura • Domy • Po remoncie', 'Zadzwoń', 'tel. 500 600 700 • www.twojafirma.pl'),
    T('srv-bike', 'service', 'center', 'orange-brown', 'condensed', 'SERWIS ROWEROWY', 'Naprawy od ręki • Przeglądy • Części', 'Zapraszamy', 'ul. Przykładowa 12'),
    T('food-pizza', 'food', 'left', 'red-white', 'impact', 'PIZZA NA WYNOS', 'Od 19 zł • dowóz gratis od 60 zł', 'Zamów online', 'tel. 500 600 700', { badge: { text: '2 w cenie 1', anchor: 'br', shape: 'circle' } }),
    T('food-cafe', 'food', 'frame', 'cream-burgundy', 'serif', 'KAWIARNIA', 'Świeże ciasta i kawa z lokalnej palarni', '', 'ul. Przykładowa 12, Szczecin', { upper: true }),
    T('food-ice', 'food', 'ribbon', 'blush-rose', 'round', 'LODY RZEMIEŚLNICZE', 'Nowe smaki każdego dnia', 'Spróbuj', 'ul. Przykładowa 12'),
    T('food-fast', 'food', 'bandBottom', 'yellow-black', 'impact', 'BURGERY • FRYTKI', 'Pyszne jedzenie na każdą porę', 'Zamawiam', 'tel. 500 600 700'),
    T('est-sale', 'estate', 'split', 'blue-red', 'modern', 'NA SPRZEDAŻ', 'Mieszkanie 3-pokojowe • 62 m²', 'Zadzwoń', 'tel. 500 600 700'),
    T('est-rent', 'estate', 'minimal', 'black-gold', 'serif', 'DO WYNAJĘCIA', 'Lokal użytkowy 120 m² • centrum miasta', '', 'tel. 500 600 700 • www.twojafirma.pl'),
    T('est-plots', 'estate', 'right', 'green-yellow', 'modern', 'DZIAŁKI BUDOWLANE', 'Media • Dojazd • Okazyjna cena', 'Zapytaj o szczegóły', 'tel. 500 600 700'),
    T('evt-concert', 'event', 'diagonal', 'purple-pink', 'impact', 'KONCERT', 'Sobota, godz. 18:00 • wstęp wolny', '', 'Rynek Główny', { pattern: 'dots' }),
    T('evt-fair', 'event', 'ribbon', 'orange-brown', 'round', 'FESTYN RODZINNY', 'Atrakcje dla dzieci • gry • konkursy', 'Zapraszamy', 'Park Miejski'),
    T('evt-expo', 'event', 'center', 'navy-gold', 'modern', 'TARGI', 'Wystawcy • warsztaty • strefa networkingu', 'Zarejestruj się', 'www.twojeevent.pl'),
    T('job-hire', 'job', 'giant', 'yellow-black', 'impact', 'ZATRUDNIMY', 'Kierowca kat. C • Magazynier • Sprzedawca', 'Zgłoś się', 'praca@twojafirma.pl'),
    T('job-join', 'job', 'left', 'lavender', 'modern', 'DOŁĄCZ DO NAS', 'Pracuj w zgranym zespole • dobre warunki', 'Wyślij CV', 'praca@twojafirma.pl')
  ];

  function applyTemplate(state, tpl, withTexts) {
    const s = normalizeState(state), p = paletteById(tpl.pal);
    s.tpl = tpl.id; s.layout = tpl.layout; s.pal = p.id; s.font = tpl.font; s.custom = { text: '', accent: '' };
    s.bg = { ...s.bg, type: s.bg.type === 'photo' && s.bg.photo ? 'photo' : 'gradient', c1: '', c2: '', pattern: tpl.pattern || 'none' };
    s.upper = tpl.upper !== false; s.frame = false; s.headScale = s.subScale = s.contactScale = 100; s.align = 'auto'; s.spacing = 0; s.shadow = false; s.outline = false;
    if (tpl.badge) s.badge = { ...s.badge, on: true, text: tpl.badge.text, anchor: tpl.badge.anchor, shape: tpl.badge.shape, tilt: true }; else s.badge = { ...s.badge, on: false };
    if (withTexts) { s.headline = tpl.head; s.sub = tpl.sub; s.contact = tpl.contact; s.cta = tpl.cta || s.cta; s.ctaOn = !!tpl.cta; }
    return s;
  }
  function randomize(state, rnd = Math.random) {
    const s = normalizeState(state), pick = a => a[Math.floor(rnd() * a.length)];
    s.tpl = ''; s.layout = pick(LAYOUTS).id; s.pal = pick(PALETTES).id; s.font = pick(Object.keys(FONTS));
    s.custom = { text: '', accent: '' }; s.bg = { ...s.bg, type: s.bg.type === 'photo' && s.bg.photo ? 'photo' : (rnd() < 0.3 ? 'solid' : 'gradient'), c1: '', c2: '', angle: pick([90, 135, 160, 180, 45]), pattern: pick(['none', 'none', 'dots', 'lines', 'grid']) };
    return s;
  }

  const SUGGEST = [
    { id: 'promo', name: { pl: 'Promocja / wyprzedaż', en: 'Sale' }, heads: ['WYPRZEDAŻ', 'PROMOCJA -30%', 'MEGA OKAZJA', 'TYLKO DZIŚ', 'OUTLET'], subs: ['Wszystko do -50%', 'Tylko w tym tygodniu', 'Do wyczerpania zapasów', 'Drugi produkt 50% taniej'], ctas: ['Sprawdź ofertę', 'Kup teraz', 'Zapraszamy'] },
    { id: 'open', name: { pl: 'Otwarcie / zapraszamy', en: 'Opening' }, heads: ['WIELKIE OTWARCIE', 'JUŻ OTWARTE', 'WKRÓTCE OTWARCIE', 'ZAPRASZAMY', 'NOWE MIEJSCE'], subs: ['Atrakcje i rabaty na otwarcie', 'Otwarte codziennie 8:00–20:00', 'Zapraszamy do nowego salonu', 'Sprawdź, co dla Ciebie mamy'], ctas: ['Zapraszamy', 'Odwiedź nas', 'Wejdź'] },
    { id: 'service', name: { pl: 'Usługi i firmy', en: 'Services' }, heads: ['REMONTY', 'SERWIS', 'TRANSPORT', 'SPRZĄTANIE', 'USŁUGI BUDOWLANE'], subs: ['Solidnie • Terminowo • Z gwarancją', 'Bezpłatna wycena', 'Doświadczenie od 2005 roku', 'Szybki termin realizacji'], ctas: ['Zadzwoń teraz', 'Bezpłatna wycena', 'Zapytaj o ofertę'] },
    { id: 'food', name: { pl: 'Gastronomia', en: 'Food' }, heads: ['PIZZA NA WYNOS', 'DOMOWE OBIADY', 'KAWA I CIASTA', 'LODY', 'BURGERY'], subs: ['Zamów online', 'Dowóz gratis od 60 zł', 'Codziennie świeże', 'Menu na każdą kieszeń'], ctas: ['Zamów online', 'Zapraszamy', 'Sprawdź menu'] },
    { id: 'estate', name: { pl: 'Nieruchomości', en: 'Real estate' }, heads: ['NA SPRZEDAŻ', 'DO WYNAJĘCIA', 'DZIAŁKI BUDOWLANE', 'LOKAL DO WYNAJĘCIA', 'OKAZJA'], subs: ['Mieszkanie 3-pokojowe • 62 m²', 'Centrum • parking • winda', 'Media i dojazd', 'Bez pośredników'], ctas: ['Zadzwoń', 'Umów prezentację', 'Zapytaj o szczegóły'] },
    { id: 'event', name: { pl: 'Wydarzenia', en: 'Events' }, heads: ['KONCERT', 'FESTYN', 'TARGI', 'WYSTAWA', 'ZAPRASZAMY NA IMPREZĘ'], subs: ['Sobota, godz. 18:00', 'Wstęp wolny', 'Atrakcje dla całej rodziny', 'Bilety dostępne online'], ctas: ['Kup bilet', 'Zapraszamy', 'Zarejestruj się'] },
    { id: 'job', name: { pl: 'Rekrutacja', en: 'Hiring' }, heads: ['ZATRUDNIMY', 'SZUKAMY PRACOWNIKÓW', 'DOŁĄCZ DO NAS', 'PRACA OD ZARAZ'], subs: ['Dobre warunki i terminowa wypłata', 'Umowa o pracę', 'Zgłoś się już dziś', 'Wyślij CV na adres poniżej'], ctas: ['Wyślij CV', 'Zgłoś się', 'Zadzwoń'] },
    { id: 'school', name: { pl: 'Kursy i edukacja', en: 'Courses' }, heads: ['ZAPISY TRWAJĄ', 'KURSY', 'DNI OTWARTE', 'NAUKA JĘZYKÓW'], subs: ['Wolne miejsca w grupach', 'Zajęcia dla dzieci i dorosłych', 'Pierwsza lekcja gratis'], ctas: ['Zapisz się', 'Sprawdź ofertę', 'Zadzwoń'] }
  ];

  window.Druk24BannerEngine = {
    LIMITS, PALETTES, FONTS, LAYOUTS, PATTERNS, ANCHORS, TEMPLATES, TEMPLATE_CATS, SUGGEST, SAFE_CM,
    defaultState, normalizeState, effPalette, paletteById, render, applyTemplate, randomize, qrFor
  };
})();
