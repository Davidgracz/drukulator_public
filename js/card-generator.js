/*! Drukulator 0.26.24v — generator wizytówek (strona „Wizytówki 24h”).
 *
 * Panel z miniaturą tuż pod formularzem wizytówek + okno edytora (ten sam wzór co generator banerów): u góry format, orientacja i zadruk
 * (zmieniają formularz na stronie, a z nim cenę), po lewej podgląd awersu i rewersu z oceną (najmniejszy tekst w pt, rozdzielczość logo,
 * gęstość kodu QR), po prawej: układ (6 gotowych), kolory (akcent + tło + krój pisma), dane osoby i firmy, logo, rewers (kolor / białe,
 * hasło, kod QR) oraz „Użyj w zamówieniu”.
 * Wizytówka powstaje w mm: format netto z formularza (90 × 50 albo 85 × 55 mm, poziomo lub pionowo) + spad 1,5 mm z każdej strony,
 * tekst trzymany jest w polu bezpiecznym (min. 4 mm od krawędzi cięcia). PDF ma tyle stron, ile stron zadruku (1 albo 2), MediaBox = format
 * ze spadem, TrimBox = format netto, obrazy 600 dpi.
 * Bez eksportu: nie ma pobierania PDF / JPG — jedyną akcją jest „Użyj w zamówieniu” (projekt dołącza się do zamówienia jako PDF w koszyku)
 * przez window.Druk24CardSimple.getAttachFiles() → app.js (quote.files). Dodatkowo „Zobacz w 3D” przekazuje obie strony do podglądu 3D.
 * Silnik rysowania jest własny (poniżej); korzysta z krojów pisma Druk24BannerEngine, kodu QR Druk24QR i zapisu PDF Druk24PDF.
 */
(() => {
  'use strict';
  const E = window.Druk24BannerEngine, PDF = window.Druk24PDF, QR = window.Druk24QR;
  const content = document.getElementById('content');
  if (!E || !PDF || !PDF.fromJpegPages || !content) return;

  const isEn = () => document.documentElement.lang === 'en';
  const tr = (pl, en) => (isEn() ? en : pl);
  const fmtNum = (n, d = 1) => new Intl.NumberFormat(isEn() ? 'en-US' : 'pl-PL', { maximumFractionDigits: d }).format(n);
  const formEl = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hexOk = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/gi, 'l').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);
  const KEY = 'druk24-card-simple-v1', KEY_LOGO = 'druk24-card-logo-v1';

  const BLEED = 1.5;             // mm spadu z każdej strony (tak samo w podglądzie 3D)
  const SAFE = 4;                // mm od krawędzi cięcia — tu nic ważnego nie leży
  const M = 5;                   // mm: standardowy margines tekstu (≥ SAFE)
  const PT_MM = 25.4 / 72;       // 1 pt w mm
  const PDF_K = 600 / 25.4;      // px na mm w pliku do druku (600 dpi)
  const LIM = { name: 34, title: 44, company: 40, phone: 26, email: 48, web: 48, address: 70, tagline: 50, qrText: 180 };
  const TEXT_KEYS = ['name', 'title', 'company', 'phone', 'email', 'web', 'address', 'tagline'];
  const SAMPLE_KEYS = ['name', 'title', 'company', 'phone', 'email', 'web', 'address'];
  const FONT_IDS = ['modern', 'serif', 'condensed', 'round'];
  const PAPERS = [['white', 'Białe', 'White'], ['accent', 'Kolorowe', 'Colour'], ['dark', 'Ciemne', 'Dark']];
  const LAYOUT_NAMES = {
    bar: ['Pasek z boku', 'Side bar'], band: ['Kolorowy nagłówek', 'Colour header'], split: ['Podział', 'Split'],
    center: ['Wyśrodkowana', 'Centred'], minimal: ['Minimalistyczna', 'Minimal'], corner: ['Narożnik', 'Corner']
  };
  const COLORS = [
    ['#ffffff', 'Biały', 'White'], ['#111111', 'Czarny', 'Black'], ['#d71920', 'Czerwony', 'Red'], ['#ff6a13', 'Pomarańczowy', 'Orange'],
    ['#ffd60a', 'Żółty', 'Yellow'], ['#0b8a4b', 'Zielony', 'Green'], ['#08808b', 'Turkusowy', 'Teal'], ['#1d6fe0', 'Niebieski', 'Blue'],
    ['#0f2747', 'Granatowy', 'Navy'], ['#6a2fb0', 'Fioletowy', 'Purple'], ['#e0408a', 'Różowy', 'Pink'], ['#5b6470', 'Szary', 'Grey']
  ];
  const SAMPLES = {
    pl: { name: 'Jan Kowalski', title: 'Dyrektor handlowy', company: 'Twoja Firma Sp. z o.o.', phone: '+48 500 600 700', email: 'jan@twojafirma.pl', web: 'www.twojafirma.pl', address: 'ul. Przykładowa 1, 70-001 Szczecin', tagline: 'Twoje hasło firmowe' },
    en: { name: 'John Smith', title: 'Sales director', company: 'Your Company Ltd', phone: '+48 500 600 700', email: 'john@yourcompany.com', web: 'www.yourcompany.com', address: '1 Sample Street, 70-001 Szczecin', tagline: 'Your company slogan' }
  };
  const isSample = (k, v) => { const t = String(v || '').trim(); return !!t && ['pl', 'en'].some(l => SAMPLES[l][k] === t); };

  // ---------- kolory ----------
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = h => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const onColor = h => { const l = lum(h) + 0.05; return 1.05 / l >= l / (lum('#111111') + 0.05) ? '#ffffff' : '#111111'; };
  const ratio = (a, b) => { const x = lum(a) + 0.05, y = lum(b) + 0.05; return Math.max(x, y) / Math.min(x, y); };
  const mix = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); const ch = s => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join(''); };

  // ---------- stan ----------
  const fresh = () => {
    const d = SAMPLES[isEn() ? 'en' : 'pl'];
    return { color: '#0f2747', paper: 'white', layout: 'bar', font: 'modern', orient: 'landscape', back: 'color', qrOn: false, qrText: '', nameScale: 100, textScale: 100,
      name: d.name, title: d.title, company: d.company, phone: d.phone, email: d.email, web: d.web, address: d.address, tagline: d.tagline };
  };
  const data = fresh();
  const touched = {}; TEXT_KEYS.forEach(k => { touched[k] = false; });
  const logo = { img: null, url: '', name: '', vector: false, ver: 0, error: '' };
  let showGuides = true;

  function applyRaw(raw) {
    if (!raw || typeof raw !== 'object') return;
    if (hexOk(raw.color)) data.color = raw.color.toLowerCase();
    if (PAPERS.some(p => p[0] === raw.paper)) data.paper = raw.paper;
    if (LAYOUT_NAMES[raw.layout]) data.layout = raw.layout;
    if (FONT_IDS.includes(raw.font)) data.font = raw.font;
    if (['landscape', 'portrait'].includes(raw.orient)) data.orient = raw.orient;
    if (['color', 'white'].includes(raw.back)) data.back = raw.back;
    if (typeof raw.qrOn === 'boolean') data.qrOn = raw.qrOn;
    if (typeof raw.qrText === 'string') data.qrText = raw.qrText.slice(0, LIM.qrText);
    ['nameScale', 'textScale'].forEach(k => { const n = Number(raw[k]); if (raw[k] != null && Number.isFinite(n)) data[k] = clamp(Math.round(n), 60, 100); });
    TEXT_KEYS.forEach(k => { if (typeof raw[k] === 'string') { data[k] = raw[k].slice(0, LIM[k]); touched[k] = true; } });
  }
  function loadSaved() {
    try { applyRaw(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { /* brak dostępu do pamięci przeglądarki — działamy bez zapisu */ }
    try { const u = localStorage.getItem(KEY_LOGO); if (u && /^data:image\//.test(u)) loadLogoUrl(u, '', false); } catch (e) { /* bez zapisu */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* bez zapisu */ } }

  // ---------- dane z formularza ----------
  function baseFormat() {
    const v = String((formEl('bcFormat') && formEl('bcFormat').value) || ''), m = v.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/);
    const a = m ? Number(m[1].replace(',', '.')) : 90, b = m ? Number(m[2].replace(',', '.')) : 50;
    return { w: Math.max(a, b), h: Math.min(a, b) };
  }
  function netSize() { const f = baseFormat(); return data.orient === 'portrait' ? { w: f.h, h: f.w } : { w: f.w, h: f.h }; }
  const twoSided = () => !formEl('bcSides') || formEl('bcSides').value !== 'Jednostronne';
  const isCardPage = () => !!content.querySelector(':scope > .card #bcFormat');
  const sideList = () => (twoSided() ? ['front', 'back'] : ['front']);
  const backMode = () => (data.back === 'white' ? 'white' : data.paper === 'accent' ? 'dark' : 'accent');
  const t = v => String(v || '').trim();
  function contentNow() {
    const lines = [['phone', data.phone], ['email', data.email], ['web', data.web], ['address', data.address]].filter(x => t(x[1])).map(x => ({ kind: x[0], text: t(x[1]) }));
    return { name: t(data.name), title: t(data.title), company: t(data.company), lines, logo: logo.img };
  }
  function qrTextEff() {
    const own = t(data.qrText), src = own || t(data.web);
    if (!src) return '';
    return /^[a-z][a-z0-9+.-]*:/i.test(src) || own ? src : 'https://' + src.replace(/^\/+/, '');
  }
  function qrMatrix() {
    if (!QR || !data.qrOn) return null;
    const txt = qrTextEff(); if (!txt) return null;
    try { return QR.encode(txt, 'M'); } catch (e) { return null; }
  }

  // ---------- paleta ----------
  function makePal(mode) {
    const acc0 = data.color;
    let paper, ink, accent;
    if (mode === 'accent') { paper = acc0; ink = onColor(acc0); accent = ink; }
    else {
      paper = mode === 'dark' ? '#141414' : '#ffffff'; ink = mode === 'dark' ? '#ffffff' : '#141414';
      accent = ratio(acc0, paper) < 1.8 ? ink : acc0;        // akcent zlewający się z tłem zamienia się na kolor tekstu
    }
    const onAccent = mode === 'accent' ? paper : onColor(accent);
    return { paper, ink, accent, onAccent, muted: mix(ink, paper, 0.36), accentText: ratio(accent, paper) >= 3 ? accent : ink };
  }

  // ---------- rysowanie (w px, współrzędne w mm względem pola netto) ----------
  const hasSpacing = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  const fontSet = () => E.FONTS[data.font] || E.FONTS.modern;
  function makeR(canvas, net, k) {
    const cw = Math.round((net.w + 2 * BLEED) * k), ch = Math.round((net.h + 2 * BLEED) * k);
    if (canvas.width !== cw) canvas.width = cw; if (canvas.height !== ch) canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    return { ctx, k, W: net.w, H: net.h, minSize: Infinity, minRole: '', logoDpi: Infinity, qrModule: 0 };
  }
  const gx = (R, v) => (v + BLEED) * R.k;
  function rect(R, x, y, w, h, color) { R.ctx.fillStyle = color; R.ctx.fillRect(gx(R, x), gx(R, y), w * R.k, h * R.k); }
  function poly(R, pts, color) {
    const c = R.ctx; c.fillStyle = color; c.beginPath();
    pts.forEach((p, i) => { const x = gx(R, p[0]), y = gx(R, p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath(); c.fill();
  }
  function setFont(R, f, sizeMm, em) {
    R.ctx.font = `${f[1]} ${sizeMm * R.k}px ${f[0]}`;
    if (hasSpacing) R.ctx.letterSpacing = em ? (em * sizeMm * R.k) + 'px' : '0px';
  }
  function wrapText(R, text, maxPx) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(/ +/).filter(Boolean);
      if (!words.length) { lines.push(''); continue; }
      let line = words[0];
      for (let i = 1; i < words.length; i++) {
        const tt = line + ' ' + words[i];
        if (R.ctx.measureText(tt).width <= maxPx) line = tt; else { lines.push(line); line = words[i]; }
      }
      lines.push(line);
    }
    return lines;
  }
  // dopasowanie: największy rozmiar ≤ spec.size × spec.scale, przy którym tekst mieści się w szerokości i w maxLines
  function measure(R, spec, wMm) {
    const text = spec.upper ? spec.text.toUpperCase() : spec.text, lh = spec.lh || 1.2, maxLines = spec.maxLines || 2, em = spec.em || 0;
    const attempt = size => {
      setFont(R, spec.font, size, em);
      const lines = wrapText(R, text, wMm * R.k); let widest = 0;
      for (const l of lines) widest = Math.max(widest, R.ctx.measureText(l).width);
      return { lines, widest, size };
    };
    const ok = r => r.widest <= wMm * R.k + 0.5 && r.lines.length <= maxLines;
    const top = Math.max(0.8, spec.size * (spec.scale == null ? 1 : spec.scale));
    let best = attempt(top);
    if (!ok(best)) {
      let lo = 0.8, hi = top; best = attempt(lo);
      for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2, r = attempt(mid); if (ok(r)) { lo = mid; best = r; } else hi = mid; }
    }
    return { ...best, text, lh, em, font: spec.font, h: best.lines.length * best.size * lh };
  }
  function paint(R, m, x, y, w, align, color, role) {
    const c = R.ctx; setFont(R, m.font, m.size, m.em);
    c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color;
    const xx = align === 'left' ? x : align === 'right' ? x + w : x + w / 2;
    m.lines.forEach((line, i) => c.fillText(line, gx(R, xx), gx(R, y + (i + 0.5) * m.size * m.lh)));
    if (hasSpacing) c.letterSpacing = '0px';
    if (m.size < R.minSize) { R.minSize = m.size; R.minRole = role || ''; }
  }
  // kilka bloków tekstu jeden pod drugim; gdy nie mieszczą się w availH, wszystkie maleją proporcjonalnie
  function flow(R, specs, x, y, w, align, availH, gap, valign) {
    specs = specs.filter(s => s && s.text && s.text.trim());
    if (!specs.length) return { top: y, h: 0 };
    const run = f => {
      const ms = specs.map(s => measure(R, { ...s, scale: (s.scale == null ? 1 : s.scale) * f }, w));
      return { ms, total: ms.reduce((a, m, i) => a + m.h + (i ? (specs[i].gapBefore == null ? gap : specs[i].gapBefore) : 0), 0) };
    };
    let r = run(1);
    if (r.total > availH + 0.05) {            // największy współczynnik, przy którym całość mieści się w wysokości (wysokość maleje wraz z rozmiarem pisma)
      let lo = 0.3, hi = 1; r = run(lo);
      for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2, x = run(mid); if (x.total <= availH + 0.05) { lo = mid; r = x; } else hi = mid; }
    }
    const ms = r.ms, total = r.total;
    let yy = valign === 'bottom' ? y + availH - total : valign === 'middle' ? y + (availH - total) / 2 : y;
    const top = yy;
    ms.forEach((m, i) => { if (i) yy += specs[i].gapBefore == null ? gap : specs[i].gapBefore; paint(R, m, x, yy, w, align, specs[i].color, specs[i].role); yy += m.h; });
    return { top, h: total };
  }
  function drawLogo(R, img, box, halign, valign) {
    if (!img || !box.w || !box.h) return null;
    const iw = img.naturalWidth || 300, ih = img.naturalHeight || 300, s = Math.min(box.w / iw, box.h / ih), dw = iw * s, dh = ih * s;
    const x = halign === 'right' ? box.x + box.w - dw : halign === 'left' ? box.x : box.x + (box.w - dw) / 2;
    const y = valign === 'top' ? box.y : valign === 'bottom' ? box.y + box.h - dh : box.y + (box.h - dh) / 2;
    try { R.ctx.drawImage(img, gx(R, x), gx(R, y), dw * R.k, dh * R.k); } catch (e) { return null; }
    if (!logo.vector) R.logoDpi = Math.min(R.logoDpi, iw / (dw / 25.4));
    return { x, y, w: dw, h: dh };
  }
  function drawQr(R, qr, box, p) {
    const pad = box.w * 0.09, mod = (box.w - 2 * pad) / qr.size, c = R.ctx;
    c.fillStyle = '#ffffff'; c.beginPath();
    const r = Math.min(1.2, box.w / 8) * R.k, x = gx(R, box.x), y = gx(R, box.y), w = box.w * R.k, h = box.h * R.k;
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill();
    c.fillStyle = '#111111';
    for (let j = 0; j < qr.size; j++) for (let i = 0; i < qr.size; i++) {
      if (qr.get(i, j)) c.fillRect(gx(R, box.x + pad + i * mod) - 0.3, gx(R, box.y + pad + j * mod) - 0.3, mod * R.k + 0.6, mod * R.k + 0.6);
    }
    R.qrModule = mod;
  }

  // ---------- bloki treści ----------
  function identitySpecs(c, p, o = {}) {
    const F = fontSet(), sc = data.nameScale / 100, ts = data.textScale / 100;
    const name = { role: 'name', text: c.name, font: F.head, size: 5.0, lh: 1.12, maxLines: 2, color: o.ink || p.ink, scale: sc };
    const title = { role: 'title', text: c.title, font: F.body, size: 2.9, lh: 1.2, maxLines: 2, color: o.muted || p.muted, scale: ts };
    const company = { role: 'company', text: c.company, font: [F.head[0], 700], size: 2.6, lh: 1.2, maxLines: 2, em: 0.09, upper: true, color: o.accentText || p.accentText, scale: ts, gapBefore: o.companyFirst ? 0 : 2.2 };
    return o.companyFirst ? [company, { ...name, gapBefore: 1.4 }, title] : [name, title, company];
  }
  // dane kontaktowe przyklejone do dołu pola; wszystkie wiersze mają ten sam rozmiar pisma. Zwraca wysokość bloku.
  function drawContacts(R, c, x, yBottom, w, align, p, pair, color) {
    if (!c.lines.length) return 0;
    const F = fontSet(), base = 2.8 * data.textScale / 100;
    const rows = pair ? c.lines.reduce((a, l, i) => { if (i % 2) a[a.length - 1].push(l); else a.push([l]); return a; }, []).map(r => ({ text: r.map(l => l.text).join('   •   '), kind: r[0].kind })) : c.lines;
    let specs = rows.map(r => ({ role: 'contact', text: r.text, font: F.body, size: base, lh: 1.3, maxLines: r.kind === 'address' && !pair ? 2 : 1, color: color || p.ink }));
    const sz = Math.min(...specs.map(s => measure(R, s, w).size));
    specs = specs.map(s => ({ ...s, size: sz, scale: 1 }));
    const cap = R.H - 2 * M;
    return flow(R, specs, x, yBottom - cap, w, align, cap, 1.0, 'bottom').h;
  }
  const brandSpec = (c, p) => ({ role: 'brand', text: c.company || c.name, font: fontSet().head, size: 6.2, lh: 1.1, maxLines: 3, color: p.ink, scale: 1 });

  // ---------- układy awersu ----------
  const LAYOUTS = {
    // pasek akcentu z boku; logo w prawym górnym rogu (pionowo: nad nazwiskiem)
    bar(R, c, p) { const bw = R.W >= R.H ? 5.5 : 4; sideLayout(R, c, p, { x0: bw + 5, deco() { rect(R, -BLEED, -BLEED, bw + BLEED, R.H + 2 * BLEED, p.accent); } }); },
    // trójkąt w dolnym rogu
    corner(R, c, p) {
      const land = R.W >= R.H, s = land ? Math.round(R.H * 0.34) : Math.round(R.W * 0.2);
      sideLayout(R, c, p, { x0: M + 1.5, contactCut: land ? s * 0.8 : 0, deco() { poly(R, [[R.W + BLEED, R.H + BLEED], [R.W - s, R.H + BLEED], [R.W + BLEED, R.H - s]], p.accent); } });
    },
    // kolorowy nagłówek z imieniem i nazwiskiem; dane kontaktowe i logo na jasnym polu poniżej
    band(R, c, p) {
      const { W, H } = R, land = W >= H, hb = land ? 22 : 32;
      rect(R, -BLEED, -BLEED, W + 2 * BLEED, hb + BLEED, p.accent);
      const bp = { ink: p.onAccent, muted: mix(p.onAccent, p.accent, 0.22), accentText: p.onAccent };
      flow(R, identitySpecs(c, p, { companyFirst: true, ink: bp.ink, muted: bp.muted, accentText: bp.accentText }), M, 2.6, W - 2 * M, 'left', hb - 5.2, 1.0, 'middle');
      let cw = W - 2 * M;
      if (c.logo) {
        if (land) { const lw = Math.min(24, cw * 0.34); drawLogo(R, c.logo, { x: W - M - lw, y: hb + 4, w: lw, h: H - hb - 8 }, 'right', 'middle'); cw -= lw + 4; }
        else drawLogo(R, c.logo, { x: M, y: hb + 5, w: Math.min(30, cw), h: 12 }, 'left', 'top');
      }
      drawContacts(R, c, M, H - M, cw, 'left', p, false);
    },
    // lewy (albo górny) panel w kolorze z logo lub nazwą firmy
    split(R, c, p) {
      const { W, H } = R, land = W >= H, pw = land ? Math.round(W * 0.36) : W, ph = land ? H : Math.round(H * 0.32);
      rect(R, -BLEED, -BLEED, pw + BLEED + (land ? 0 : BLEED), ph + BLEED + (land ? BLEED : 0), p.accent);
      const box = land ? { x: 4, y: 6, w: pw - 8, h: H - 12 } : { x: M, y: 4, w: W - 2 * M, h: ph - 8 };
      let showCompany = true;
      if (c.logo) drawLogo(R, c.logo, box, 'center', 'middle');
      else if (c.company || c.name) { showCompany = false; const bs = { ...brandSpec(c, p), color: p.onAccent, scale: 0.8 }; bs.text = c.company || ''; if (bs.text) flow(R, [bs], box.x, box.y, box.w, 'center', box.h, 1, 'middle'); else showCompany = true; }
      const x0 = land ? pw + 5 : M, w = land ? W - x0 - M : W - 2 * M, y0 = land ? M : ph + 5;
      const cc = { ...c, company: showCompany ? c.company : '' };
      const hC = drawContacts(R, c, x0, H - M, w, 'left', p, false);
      flow(R, identitySpecs(cc, p), x0, y0, w, 'left', H - M - hC - 3 - y0, 1.3, 'top');
    },
    // wszystko na środku: logo, imię i nazwisko, cienka linia, dane kontaktowe parami
    center(R, c, p) {
      const { W, H } = R, land = W >= H, w = W - 2 * M;
      let top = M;
      if (c.logo) { const lh = land ? 9 : 14; drawLogo(R, c.logo, { x: M, y: M, w, h: lh }, 'center', 'middle'); top += lh + 2.5; }
      const hC = drawContacts(R, c, M, H - M, w, 'center', p, land);
      const lineH = 0.5, lineGap = 2.2, bottom = H - M - hC - (hC ? lineGap * 2 + lineH : 0);
      const r = flow(R, identitySpecs(c, p), M, top, w, 'center', Math.max(4, bottom - top), 1.1, 'middle');
      if (hC) rect(R, (W - 12) / 2, H - M - hC - lineGap - lineH, 12, lineH, p.accent);
      return r;
    },
    // dużo wolnego miejsca: imię i nazwisko u góry z krótką linią, dane na dole, logo w rogu
    minimal(R, c, p) {
      const { W, H } = R, land = W >= H, mm = 7, w = W - 2 * mm;
      let top = mm, cw = w;
      if (c.logo) {
        if (land) { const lw = Math.min(22, w * 0.3); drawLogo(R, c.logo, { x: W - mm - lw, y: H - mm - 10, w: lw, h: 10 }, 'right', 'bottom'); cw = w - lw - 4; }
        else { drawLogo(R, c.logo, { x: mm, y: mm, w: Math.min(28, w), h: 12 }, 'left', 'top'); top += 12 + 6; }
      }
      const hC = drawContacts(R, c, mm, H - mm, cw, 'left', p, false);
      const ids = identitySpecs(c, p);
      const r = flow(R, ids, mm, top, w, 'left', H - mm - hC - 4 - top, 1.4, 'top');
      if (r.h) rect(R, mm, r.top + r.h + 2.2, 9, 0.5, p.accent);
    }
  };
  // układy „pasek” i „narożnik”: tożsamość u góry, kontakty na dole, logo w prawym górnym rogu (pionowo: nad nazwiskiem)
  function sideLayout(R, c, p, o) {
    const { W, H } = R, land = W >= H, x0 = o.x0, w = W - x0 - M;
    o.deco();
    let topY = M, idW = w;
    if (c.logo) {
      if (land) { const lw = Math.min(24, w * 0.36); drawLogo(R, c.logo, { x: W - M - lw, y: M, w: lw, h: 13 }, 'right', 'top'); idW = w - lw - 4; }
      else { drawLogo(R, c.logo, { x: x0, y: M, w: Math.min(30, w), h: 13 }, 'left', 'top'); topY = M + 13 + 4; }
    }
    const hC = drawContacts(R, c, x0, H - M, w - (o.contactCut || 0), 'left', p, false);
    flow(R, identitySpecs(c, p), x0, topY, idW, 'left', H - M - hC - 3 - topY, 1.3, 'top');
  }

  // ---------- rewers ----------
  function drawBack(R, c, p) {
    const { W, H } = R, land = W >= H, F = fontSet(), qr = qrMatrix();
    const qs = land ? Math.min(H - 2 * M - 4, 30) : Math.min(W - 2 * M, 32);
    let box = { x: M, y: M, w: W - 2 * M, h: H - 2 * M }, qbox = null;
    if (qr) {
      if (land) { qbox = { x: W - M - qs, y: (H - qs) / 2, w: qs, h: qs }; box = { x: M, y: M, w: W - 2 * M - qs - 6, h: H - 2 * M }; }
      else { qbox = { x: (W - qs) / 2, y: H - M - qs, w: qs, h: qs }; box = { x: M, y: M, w: W - 2 * M, h: H - 2 * M - qs - 5 }; }
    }
    const tag = t(data.tagline), tagSpec = tag ? { role: 'tagline', text: tag, font: F.body, size: 3.0, lh: 1.25, maxLines: 3, color: p.ink, scale: data.textScale / 100, gapBefore: 3 } : null;
    if (c.logo) {
      const tagH = tagSpec ? measure(R, tagSpec, box.w).h + 3 : 0, lh = Math.min(box.h - tagH, land ? 24 : 26), total = lh + tagH, y0 = box.y + (box.h - total) / 2;
      drawLogo(R, c.logo, { x: box.x, y: y0, w: box.w, h: lh }, 'center', 'middle');
      if (tagSpec) flow(R, [tagSpec], box.x, y0 + lh, box.w, 'center', tagH, 0, 'top');
    } else {
      flow(R, [brandSpec(c, p), tagSpec].filter(Boolean), box.x, box.y, box.w, 'center', box.h, 2.5, 'middle');
    }
    if (qr && qbox) drawQr(R, qr, qbox, p);
  }

  function renderSide(canvas, side, o = {}) {
    const net = o.net || netSize(), R = makeR(canvas, net, o.k || 12);
    const p = makePal(side === 'front' ? data.paper : backMode());
    R.ctx.fillStyle = p.paper; R.ctx.fillRect(0, 0, canvas.width, canvas.height);
    const c = contentNow();
    if (side === 'front') (LAYOUTS[o.layout || data.layout] || LAYOUTS.bar)(R, c, p); else drawBack(R, c, p);
    return R;
  }
  // raport z obu stron (na małej skali — wystarczy do oceny)
  function report(k = 8) {
    const net = netSize(), rep = { minSize: Infinity, minRole: '', logoDpi: Infinity, qrModule: 0 }, cv = document.createElement('canvas');
    sideList().forEach(s => {
      const R = renderSide(cv, s, { k, net });
      if (R.minSize < rep.minSize) { rep.minSize = R.minSize; rep.minRole = R.minRole; }
      rep.logoDpi = Math.min(rep.logoDpi, R.logoDpi); rep.qrModule = Math.max(rep.qrModule, R.qrModule);
    });
    rep.minPt = Number.isFinite(rep.minSize) ? rep.minSize / PT_MM : null;
    return rep;
  }

  // ---------- co blokuje „Użyj w zamówieniu” ----------
  function problem() {
    const c = contentNow();
    if (!c.name && !c.company) return tr('Wpisz imię i nazwisko albo nazwę firmy.', 'Enter a name or a company name.');
    const keys = SAMPLE_KEYS.concat(twoSided() ? ['tagline'] : []), k = keys.find(x => isSample(x, data[x]));
    if (k) return tr(`Zamień przykładowy tekst („${t(data[k])}”) na własny albo go usuń.`, `Replace the sample text (“${t(data[k])}”) with your own or delete it.`);
    if (logo.error) return logo.error;
    if (data.qrOn && twoSided()) {
      if (!QR) return tr('Kod QR jest niedostępny.', 'The QR code is not available.');
      if (!qrTextEff()) return tr('Wpisz adres strony albo własny adres do kodu QR.', 'Enter a website or a custom address for the QR code.');
      if (!qrMatrix()) return tr('Adres w kodzie QR jest za długi.', 'The address in the QR code is too long.');
    }
    const rep = report();
    if (rep.minPt != null && rep.minPt < 5) return tr(`Tekst jest za mały (${fmtNum(rep.minPt, 1)} pt). Skróć treść albo usuń jedną linię.`, `The text is too small (${fmtNum(rep.minPt, 1)} pt). Shorten it or remove a line.`);
    return '';
  }

  // ---------- logo ----------
  function loadLogoUrl(url, name, persist) {
    const img = new Image();
    img.onload = () => {
      logo.img = img; logo.url = url; logo.name = name || logo.name; logo.vector = /^data:image\/svg/i.test(url); logo.error = ''; logo.ver++;
      if (persist) { try { if (url.length <= 700000) localStorage.setItem(KEY_LOGO, url); else localStorage.removeItem(KEY_LOGO); } catch (e) { /* bez zapisu */ } }
      refreshAll();
    };
    img.onerror = () => { logo.error = tr('Nie udało się wczytać logo — wybierz plik PNG, JPG, WebP albo SVG.', 'Could not load the logo — choose a PNG, JPG, WebP or SVG file.'); logo.img = null; logo.url = ''; if (persist) say(logo.error, true); refreshAll(); };
    img.src = url;
  }
  function setLogoFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/i.test(file.type) && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) { say(tr('Logo: wybierz plik PNG, JPG, WebP albo SVG.', 'Logo: choose a PNG, JPG, WebP or SVG file.'), true); return; }
    if (file.size > 8 * 1048576) { say(tr('Logo jest za duże (maks. 8 MB).', 'The logo is too large (max 8 MB).'), true); return; }
    const fr = new FileReader();
    fr.onload = () => { say(''); loadLogoUrl(String(fr.result), file.name, true); };
    fr.onerror = () => say(tr('Nie udało się odczytać pliku z logo.', 'Could not read the logo file.'), true);
    fr.readAsDataURL(file);
  }
  function removeLogo() {
    logo.img = null; logo.url = ''; logo.name = ''; logo.error = ''; logo.vector = false; logo.ver++;
    try { localStorage.removeItem(KEY_LOGO); } catch (e) { /* bez zapisu */ }
    refreshAll();
  }

  // ---------- pliki do druku ----------
  let dlg = null, ui = null, entry = null, curCard = null, previewQueued = false, resetArmed = 0;
  const sigNow = () => JSON.stringify([netSize(), twoSided(), data, logo.ver, qrTextEff()]);
  async function sideJpeg(side, k, q) {
    const c = document.createElement('canvas'); renderSide(c, side, { k });
    const jpg = await new Promise(res => c.toBlob(res, 'image/jpeg', q)); if (!jpg) throw new Error('jpg');
    return { blob: jpg, wPx: c.width, hPx: c.height };
  }
  async function buildPdf() {
    const net = netSize(), pages = [];
    for (const s of sideList()) { const j = await sideJpeg(s, PDF_K, 0.93); pages.push({ jpeg: new Uint8Array(await j.blob.arrayBuffer()), wPx: j.wPx, hPx: j.hPx }); }
    const fm = v => fmtNum(v, 1).replace(/\s/g, '').replace(',', '.');
    const base = `wizytowka-${fm(net.w)}x${fm(net.h)}mm-${pages.length > 1 ? 'dwustronna' : 'jednostronna'}${slug(data.name || data.company) ? '-' + slug(data.name || data.company) : ''}`;
    const pdf = PDF.fromJpegPages({ pages, wMm: net.w, hMm: net.h, bleedMm: BLEED, title: data.name || data.company || 'Wizytowka', creator: 'Drukulator - generator wizytowek Druk24' });
    return { blob: new Blob([pdf.bytes], { type: 'application/pdf' }), name: base + '.pdf', pages: pages.length };
  }

  // ---------- załącznik do zamówienia ----------
  const attach = { enabled: false, file: null, sig: '', busy: false, error: '', token: 0 };
  let attachTimer = 0, entryNote = '';
  function scheduleAttach() { if (!attach.enabled) return; clearTimeout(attachTimer); attachTimer = setTimeout(buildAttach, 700); updateEntry(); }
  async function buildAttach() {
    if (!attach.enabled) return;
    const token = ++attach.token, sig = sigNow();
    attach.busy = true; attach.error = ''; updateEntry();
    try {
      await new Promise(r => setTimeout(r, 20));
      const out = await buildPdf();
      if (token !== attach.token) return;
      attach.file = new File([out.blob], out.name, { type: 'application/pdf', lastModified: Date.now() });
      attach.sig = sig;
    } catch (e) {
      if (token !== attach.token) return;
      attach.file = null; attach.error = tr('Nie udało się przygotować pliku PDF.', 'Could not prepare the PDF file.');
    }
    attach.busy = false; updateEntry();
    if (attach.enabled && attach.sig !== sigNow() && attach.file) scheduleAttach();
  }
  function setAttach(on) {
    entryNote = '';
    if (!on) { attach.enabled = false; clearTimeout(attachTimer); attach.token++; attach.busy = false; attach.error = ''; attach.file = null; updateEntry(); return; }
    const pr = problem();
    if (pr) { attach.enabled = false; entryNote = pr; updateEntry(); return; }
    attach.enabled = true; buildAttach();
  }
  async function useInOrder() {
    const pr = problem(); if (pr) { say(pr, true); return; }
    ui.root.classList.add('is-busy'); say(tr('Zapisuję projekt jako PDF…', 'Saving the design as PDF…'));
    entryNote = ''; attach.enabled = true; clearTimeout(attachTimer);
    await buildAttach();
    ui.root.classList.remove('is-busy');
    if (attach.file && !attach.error) { say(''); dlg.close(); } else say(attach.error || tr('Nie udało się zapisać projektu.', 'Could not save the design.'), true);
  }
  // przekazanie obu stron do podglądu 3D (spad 1,5 mm rozpoznaje sam po proporcjach obrazu)
  async function view3d() {
    const api = window.Druk24Card3D; if (!api || !api.setFiles) return;
    ui.root.classList.add('is-busy'); say(tr('Przygotowuję podgląd 3D…', 'Preparing the 3D preview…'));
    try {
      const files = [];
      for (const s of sideList()) { const j = await sideJpeg(s, 300 / 25.4, 0.9); files.push(new File([j.blob], `wizytowka-${s === 'front' ? 'przod' : 'tyl'}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })); }
      api.setFiles(files[0], files[1] || null); if (api.open) api.open();
      say(''); dlg.close();
      const panel = content.querySelector('.d24c3-panel'); if (panel && panel.scrollIntoView) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } catch (e) { say(tr('Nie udało się przygotować podglądu 3D.', 'Could not prepare the 3D preview.'), true); }
    ui.root.classList.remove('is-busy');
  }

  // ---------- podgląd ----------
  function refreshAll() { save(); if (ui) syncUI(false); schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); else updateEntry(); }
  function schedulePreview() { if (previewQueued) return; previewQueued = true; requestAnimationFrame(renderPreview); }
  function drawGuides(R, ctx, cw, ch) {
    const k = R.k, b = BLEED * k, w = R.W * k, h = R.H * k, s = SAFE * k;
    ctx.save(); ctx.lineWidth = Math.max(1, k * 0.12);
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.strokeRect(b, b, w, h);
    ctx.setLineDash([k * 0.6, k * 0.5]); ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeRect(b, b, w, h);
    ctx.strokeStyle = 'rgba(20,184,90,.95)'; ctx.setLineDash([k * 0.5, k * 0.4]); ctx.strokeRect(b + s, b + s, w - 2 * s, h - 2 * s);
    ctx.restore();
  }
  function renderPreview() {
    previewQueued = false;
    if (!ui || !dlg || !dlg.open) return;
    const net = netSize(), k = net.w >= net.h ? 12 : 10, off = document.createElement('canvas'), two = twoSided(), rep = { minSize: Infinity, logoDpi: Infinity, qrModule: 0 };
    ['front', 'back'].forEach(side => {
      const fig = ui.figs[side]; fig.hidden = side === 'back' && !two; if (fig.hidden) return;
      const R = renderSide(off, side, { k, net }), cv = fig.querySelector('canvas'), ctx = cv.getContext('2d');
      if (R.minSize < rep.minSize) rep.minSize = R.minSize;
      rep.logoDpi = Math.min(rep.logoDpi, R.logoDpi); rep.qrModule = Math.max(rep.qrModule, R.qrModule);
      if (showGuides) { if (cv.width !== off.width) cv.width = off.width; if (cv.height !== off.height) cv.height = off.height; ctx.drawImage(off, 0, 0); drawGuides(R, ctx); }
      else {
        const cw = Math.round(net.w * k), ch = Math.round(net.h * k), b = Math.round(BLEED * k);
        if (cv.width !== cw) cv.width = cw; if (cv.height !== ch) cv.height = ch;
        ctx.drawImage(off, b, b, cw, ch, 0, 0, cw, ch);
      }
    });
    updateChips(net, rep);
    renderThumbs();
  }
  function updateChips(net, rep) {
    const chips = [`<span class="d24bg-chip" title="${tr('Format po przycięciu; plik do druku ma jeszcze 1,5 mm spadu z każdej strony', 'Trimmed size; the print file also has 1.5 mm bleed on every side')}">${fmtNum(net.w, 1)} × ${fmtNum(net.h, 1)} mm + ${tr('spad', 'bleed')} ${fmtNum(BLEED, 1)} mm</span>`];
    if (Number.isFinite(rep.minSize)) {
      const pt = rep.minSize / PT_MM, cls = pt >= 7 ? 'great' : pt >= 6 ? 'good' : pt >= 5 ? 'weak' : 'bad';
      chips.push(`<span class="d24bg-chip d24bg-chip--${cls}" title="${tr('Najmniejszy tekst na wizytówce; zalecane co najmniej 6 pt', 'Smallest text on the card; at least 6 pt is recommended')}">${tr('Najmniejszy tekst: ', 'Smallest text: ')}${fmtNum(pt, 1)} pt</span>`);
    }
    if (logo.img && !logo.vector && Number.isFinite(rep.logoDpi)) {
      const d = Math.round(rep.logoDpi), cls = d >= 250 ? 'great' : d >= 150 ? 'good' : d >= 100 ? 'weak' : 'bad';
      chips.push(`<span class="d24bg-chip d24bg-chip--${cls}" title="${tr('Rozdzielczość logo przy tej wielkości na wizytówce', 'Logo resolution at its size on the card')}">${tr('Logo: ', 'Logo: ')}${d} dpi</span>`);
    }
    if (rep.qrModule > 0) {
      const m = rep.qrModule, cls = m >= 0.5 ? 'great' : m >= 0.4 ? 'good' : m >= 0.33 ? 'weak' : 'bad';
      chips.push(`<span class="d24bg-chip d24bg-chip--${cls}" title="${tr('Wielkość pojedynczego „piksela” kodu QR w druku; poniżej ok. 0,4 mm kod może się źle skanować', 'Size of one QR module in print; below about 0.4 mm the code may scan poorly')}">${tr('Kod QR: ', 'QR code: ')}${fmtNum(m, 2)} mm</span>`);
    }
    if (data.qrOn && twoSided() && !qrMatrix()) chips.push(`<span class="d24bg-chip d24bg-chip--bad">${tr('Kod QR: brak adresu albo jest za długi', 'QR code: missing or too long address')}</span>`);
    const html = chips.join('');
    if (ui.chips.innerHTML !== html) ui.chips.innerHTML = html;
  }
  function renderThumbs() {
    if (!ui) return;
    const net = netSize(), k = 2.6;
    dlg.querySelectorAll('[data-layout] canvas').forEach(cv => { renderSide(cv, 'front', { k, net, layout: cv.parentNode.dataset.layout }); });
  }
  function renderEntryThumb() {
    const c = entry && entry.isConnected ? entry.querySelector('canvas') : null; if (!c) return;
    renderSide(c, 'front', { k: 6 });
  }

  // ---------- panel pod formularzem ----------
  function buildEntry() {
    entry = document.createElement('section');
    entry.className = 'd24bg-entry d24bgs-entry d24cg-entry';
    entry.innerHTML = `<div class="d24bg-entry__copy">
      <span class="d24bg-eyebrow">${tr('GENERATOR WIZYTÓWEK', 'BUSINESS CARD GENERATOR')}</span>
      <h3>${tr('Zaprojektuj wizytówkę: układ, kolory, logo i dane kontaktowe', 'Design your business card: layout, colours, logo and contact details')}</h3>
      <p>${tr('Wybierz gotowy układ i kolory, wpisz dane, wgraj logo i (przy zadruku dwustronnym) ułóż rewers z kodem QR. Zobaczysz awers i rewers z linią cięcia, a gotowy projekt — z poprawnym spadem 1,5 mm — trafi do zamówienia razem z wizytówkami.', 'Pick a ready layout and colours, enter your details, upload a logo and (for double-sided printing) design the back with a QR code. You will see the front and back with the trim line, and the finished design — with a proper 1.5 mm bleed — goes into your order together with the cards.')}</p>
      <div class="d24bg-entry__actions">
        <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="open">${tr('Zaprojektuj wizytówkę', 'Design my card')}</button>
        <label class="d24bg-check"><input type="checkbox" data-attach><span>${tr('Dołącz projekt do zamówienia', 'Attach the design to my order')}</span></label>
      </div>
      <p class="d24bg-entry__status" data-status aria-live="polite"></p>
    </div>
    <button type="button" class="d24bg-entry__thumb" data-act="open" aria-label="${tr('Otwórz generator wizytówek', 'Open business card generator')}"><canvas></canvas><span>${tr('Edytuj projekt', 'Edit design')}</span></button>`;
    entry.addEventListener('click', e => { if (e.target.closest('[data-act="open"]')) openEditor(); });
    entry.addEventListener('change', e => { if (e.target.matches('[data-attach]')) setAttach(e.target.checked); });
  }
  function updateEntry() {
    if (!entry || !entry.isConnected) return;
    const cb = entry.querySelector('[data-attach]'), s = entry.querySelector('[data-status]');
    if (cb) cb.checked = attach.enabled;
    let msg = entryNote, cls = entryNote ? 'is-bad' : '';
    if (attach.enabled) {
      if (attach.error) { msg = attach.error; cls = 'is-bad'; }
      else if (attach.busy || !attach.file || attach.sig !== sigNow()) { msg = tr('Przygotowuję plik PDF z projektem…', 'Preparing the design PDF…'); cls = ''; }
      else { msg = tr(`✓ Projekt zapisany — do zamówienia zostanie dołączony plik ${attach.file.name} (${fmtNum(attach.file.size / 1048576, 1)} MB). Pojawi się po dodaniu do koszyka.`, `✓ Design saved — ${attach.file.name} (${fmtNum(attach.file.size / 1048576, 1)} MB) will be attached to your order. It will appear once you add the cards to the cart.`); cls = 'is-ok'; }
    }
    if (s.textContent !== msg) s.textContent = msg;
    s.className = 'd24bg-entry__status ' + cls;
  }

  // ---------- okno ----------
  function buildDialog() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'd24cg-dialog';
    dlg.setAttribute('aria-labelledby', 'd24cg-title');
    const sw = COLORS.map(([hex, pl, en]) => `<button type="button" data-color="${hex}" aria-pressed="false" title="${isEn() ? en : pl}" aria-label="${isEn() ? en : pl}" style="background:${hex}"></button>`).join('');
    const seg = (attr, items, label) => `<div class="d24bg-seg d24cg-seg" role="group" aria-label="${label}">${items.map(([k, pl, en]) => `<button type="button" ${attr}="${k}" aria-pressed="false">${tr(pl, en)}</button>`).join('')}</div>`;
    const layouts = Object.keys(LAYOUT_NAMES).map(id => `<button type="button" data-layout="${id}" aria-pressed="false" title="${tr(LAYOUT_NAMES[id][0], LAYOUT_NAMES[id][1])}"><canvas aria-hidden="true"></canvas><span>${tr(LAYOUT_NAMES[id][0], LAYOUT_NAMES[id][1])}</span></button>`).join('');
    const fonts = FONT_IDS.map(id => [id, E.FONTS[id].name.pl, E.FONTS[id].name.en]);
    const field = (k, pl, en) => `<label class="d24bgs-field"><span class="d24bgs-field__lbl">${tr(pl, en)}<small data-count="${k}"></small></span><input type="text" data-f="${k}" maxlength="${LIM[k]}" autocomplete="off" spellcheck="false"></label>`;
    const slider = (k, pl, en) => `<label class="d24bg-row"><span>${tr(pl, en)}</span><input type="range" data-s="${k}" min="60" max="100" step="1"><output data-out="${k}"></output></label>`;
    const fmtItems = formatList().map(v => `<button type="button" data-format="${v}" aria-pressed="false">${v.replace(/\s*x\s*/i, ' × ')}</button>`).join('');
    dlg.innerHTML = `<div class="d24bg d24bgs d24cg">
      <div class="d24bgs-top d24cg-top">
        <strong id="d24cg-title">${tr('Generator wizytówek', 'Business card generator')}</strong>
        <div class="d24cg-ctl"><span>${tr('Format', 'Size')}</span><div class="d24bg-seg d24cg-seg" role="group" aria-label="${tr('Format wizytówki', 'Card size')}" data-formats>${fmtItems}</div></div>
        <div class="d24cg-ctl">${seg('data-orient', [['landscape', 'Poziomo', 'Landscape'], ['portrait', 'Pionowo', 'Portrait']], tr('Orientacja', 'Orientation'))}</div>
        <div class="d24cg-ctl"><span>${tr('Zadruk', 'Printing')}</span>${seg('data-sides', [['Jednostronne', 'Jednostronny', 'Single-sided'], ['Dwustronne', 'Dwustronny', 'Double-sided']], tr('Zadruk', 'Printing'))}</div>
        <button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="reset">${tr('Wyczyść projekt', 'Reset design')}</button>
        <button type="button" class="d24bg-icon d24bgs-close" data-act="close" aria-label="${tr('Zamknij', 'Close')}" title="${tr('Zamknij', 'Close')}">✕</button>
      </div>
      <div class="d24bgs-main">
        <div class="d24bgs-left">
          <div class="d24cg-stage">
            <div class="d24cg-figs">
              <figure data-fig="front"><canvas role="img" aria-label="${tr('Podgląd awersu wizytówki', 'Card front preview')}"></canvas><figcaption>${tr('Awers', 'Front')}</figcaption></figure>
              <figure data-fig="back"><canvas role="img" aria-label="${tr('Podgląd rewersu wizytówki', 'Card back preview')}"></canvas><figcaption>${tr('Rewers', 'Back')}</figcaption></figure>
            </div>
            <div class="d24bg-chips d24bgs-chips" data-chips role="status" aria-live="polite"></div>
            <label class="d24bg-check d24cg-guides"><input type="checkbox" data-guides checked><span>${tr('Pokaż spad, linię cięcia i margines bezpieczny', 'Show bleed, trim line and safe margin')}</span></label>
          </div>
        </div>
        <div class="d24bgs-side">
          <section class="d24cg-sec"><h4>${tr('Układ', 'Layout')}</h4><div class="d24cg-layouts" role="group" aria-label="${tr('Układ awersu', 'Front layout')}">${layouts}</div></section>
          <section class="d24cg-sec"><h4>${tr('Kolory i pismo', 'Colours and type')}</h4>
            <div class="d24bgs-swatches" data-swatches role="group" aria-label="${tr('Kolor akcentu', 'Accent colour')}">${sw}</div>
            <div class="d24cg-row"><span>${tr('Tło', 'Background')}</span>${seg('data-paper', PAPERS, tr('Tło wizytówki', 'Card background'))}</div>
            <div class="d24cg-row"><span>${tr('Pismo', 'Typeface')}</span>${seg('data-font', fonts, tr('Krój pisma', 'Typeface'))}</div>
          </section>
          <section class="d24cg-sec"><h4>${tr('Dane na wizytówce', 'Card details')}</h4>
            <div class="d24bgs-fields">
              ${field('name', 'Imię i nazwisko', 'Name')}${field('title', 'Stanowisko', 'Job title')}${field('company', 'Firma', 'Company')}${field('phone', 'Telefon', 'Phone')}${field('email', 'E-mail', 'Email')}${field('web', 'Strona www', 'Website')}${field('address', 'Adres', 'Address')}
            </div>
            <div class="d24bgs-sliders">${slider('nameScale', 'Rozmiar nazwiska', 'Name size')}${slider('textScale', 'Rozmiar pozostałych', 'Other text size')}</div>
          </section>
          <section class="d24cg-sec"><h4>${tr('Logo', 'Logo')}</h4>
            <div class="d24cg-logo"><button type="button" class="d24bg-btn" data-act="logo">${tr('Wgraj logo', 'Upload logo')}</button><button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="logo-off">${tr('Usuń logo', 'Remove logo')}</button><span data-logoname></span>
              <input type="file" data-logofile accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" hidden></div>
            <p class="d24cg-hint">${tr('PNG, JPG, WebP lub SVG do 8 MB. Najlepiej plik z przezroczystym tłem; wektorowe SVG drukuje się najostrzej.', 'PNG, JPG, WebP or SVG up to 8 MB. A file with a transparent background works best; vector SVG prints sharpest.')}</p>
          </section>
          <section class="d24cg-sec" data-backsec><h4>${tr('Rewers', 'Back')}</h4>
            <div class="d24cg-row"><span>${tr('Tło rewersu', 'Back colour')}</span>${seg('data-back', [['color', 'Kolorowe', 'Coloured'], ['white', 'Białe', 'White']], tr('Tło rewersu', 'Back background'))}</div>
            <div class="d24bgs-fields">${field('tagline', 'Hasło', 'Slogan')}
              <div class="d24bgs-field"><label class="d24bgs-field__lbl d24bgs-check"><input type="checkbox" data-qr-on aria-label="${tr('Pokaż kod QR', 'Show a QR code')}"><span>${tr('Kod QR', 'QR code')}</span></label><input type="text" data-qr maxlength="${LIM.qrText}" autocomplete="off" spellcheck="false" aria-label="${tr('Adres w kodzie QR', 'Address in the QR code')}"></div></div>
            <p class="d24cg-hint">${tr('Kod QR prowadzi pod adres ze strony www (pole „Adres w kodzie QR” zostaw puste) albo pod własny adres.', 'The QR code points to your website (leave the QR address empty) or to a custom address.')}</p>
          </section>
          <div class="d24bgs-actions">
            <p class="d24bgs-msg" data-msg aria-live="polite"></p>
            <div class="d24cg-btns"><button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="view3d">${tr('Zobacz w 3D', 'View in 3D')}</button>
              <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="use">${tr('Użyj w zamówieniu', 'Use in order')}</button></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(dlg);
    const q = s => dlg.querySelector(s);
    ui = { root: q('.d24cg'), chips: q('[data-chips]'), msg: q('[data-msg]'), figs: { front: q('[data-fig="front"]'), back: q('[data-fig="back"]') }, backSec: q('[data-backsec]'), logoName: q('[data-logoname]'), logoFile: q('[data-logofile]') };
    dlg.addEventListener('click', e => {
      const sb = e.target.closest('[data-color]'); if (sb) { data.color = sb.dataset.color; changed(); return; }
      const lb = e.target.closest('[data-layout]'); if (lb) { data.layout = lb.dataset.layout; changed(); return; }
      const pb = e.target.closest('[data-paper]'); if (pb) { data.paper = pb.dataset.paper; changed(); return; }
      const fb = e.target.closest('[data-font]'); if (fb) { data.font = fb.dataset.font; changed(); return; }
      const ob = e.target.closest('[data-orient]'); if (ob) { data.orient = ob.dataset.orient; changed(); return; }
      const bb = e.target.closest('[data-back]'); if (bb) { data.back = bb.dataset.back; changed(); return; }
      const fm = e.target.closest('[data-format]'); if (fm) { setFormSelect('bcFormat', fm.dataset.format); return; }
      const sd = e.target.closest('[data-sides]'); if (sd) { if (!sd.disabled) setFormSelect('bcSides', sd.dataset.sides); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'close') dlg.close();
      else if (b.dataset.act === 'use') useInOrder();
      else if (b.dataset.act === 'view3d') view3d();
      else if (b.dataset.act === 'reset') resetDesign();
      else if (b.dataset.act === 'logo') ui.logoFile.click();
      else if (b.dataset.act === 'logo-off') removeLogo();
    });
    dlg.addEventListener('input', e => {
      const el = e.target;
      if (el.matches('[data-f]')) { const k = el.dataset.f; data[k] = el.value; touched[k] = true; changed(true); }
      else if (el.matches('[data-qr]')) { data.qrText = el.value; if (el.value.trim() && !data.qrOn) data.qrOn = true; changed(true); }
      else if (el.matches('[data-s]')) { data[el.dataset.s] = clamp(Number(el.value) || 100, 60, 100); changed(true); }
    });
    dlg.addEventListener('change', e => {
      const el = e.target;
      if (el.matches('[data-qr-on]')) { data.qrOn = el.checked; changed(); }
      else if (el.matches('[data-guides]')) { showGuides = el.checked; schedulePreview(); }
      else if (el.matches('[data-logofile]')) { setLogoFile(el.files && el.files[0]); el.value = ''; }
    });
    dlg.addEventListener('focusin', e => { const el = e.target; if (el.matches && el.matches('[data-f]') && isSample(el.dataset.f, el.value)) el.select(); });   // pierwsze kliknięcie w przykładowy tekst zaznacza go
    dlg.addEventListener('close', () => { clearTimeout(resetArmed); resetArmed = 0; resetLabel(false); save(); updateEntry(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
  const formatList = () => { const s = formEl('bcFormat'); return s ? [...s.options].map(o => o.value) : ['90x50 mm', '85x55 mm']; };
  function say(text, bad) { if (!ui) return; ui.msg.textContent = text || ''; ui.msg.classList.toggle('is-bad', !!bad); }
  function setFormSelect(id, value) {
    const el = formEl(id); if (!el || el.value === value || ![...el.options].some(o => o.value === value)) return;
    el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    syncUI(false); schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); else updateEntry();
  }
  function syncUI(force) {
    if (!ui) return;
    const pr = (attr, val) => dlg.querySelectorAll(`[${attr}]`).forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)));
    pr('data-layout', data.layout); pr('data-paper', data.paper); pr('data-font', data.font); pr('data-orient', data.orient); pr('data-back', data.back);
    pr('data-format', String((formEl('bcFormat') && formEl('bcFormat').value) || '')); pr('data-sides', twoSided() ? 'Dwustronne' : 'Jednostronne');
    const sel = formEl('bcSides'), opts = sel ? [...sel.options].map(o => o.value) : ['Jednostronne', 'Dwustronne'];
    dlg.querySelectorAll('[data-sides]').forEach(b => { b.disabled = !opts.includes(b.dataset.sides); b.title = b.disabled ? tr('Przy druku offsetowym dostępny jest tylko zadruk dwustronny', 'Offset printing is available double-sided only') : ''; });
    dlg.querySelectorAll('[data-format]').forEach(b => { b.disabled = !formatList().includes(b.dataset.format); });
    dlg.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === data.color)));
    dlg.querySelectorAll('[data-f]').forEach(i => {
      const k = i.dataset.f;
      if ((force || document.activeElement !== i) && i.value !== data[k]) i.value = data[k];
      const c = dlg.querySelector(`[data-count="${k}"]`); if (c) c.textContent = `${data[k].length}/${LIM[k]}`;
    });
    const qrInput = dlg.querySelector('[data-qr]'); if ((force || document.activeElement !== qrInput) && qrInput.value !== data.qrText) qrInput.value = data.qrText;
    qrInput.placeholder = t(data.web) ? tr('domyślnie: adres strony www', 'default: your website') : tr('adres strony lub własny tekst', 'website or custom text');
    dlg.querySelector('[data-qr-on]').checked = data.qrOn; dlg.querySelector('[data-qr-on]').disabled = !QR;
    dlg.querySelectorAll('[data-s]').forEach(i => { const k = i.dataset.s; if (Number(i.value) !== data[k]) i.value = String(data[k]); dlg.querySelector(`[data-out="${k}"]`).textContent = data[k] + '%'; });
    ui.backSec.hidden = !twoSided(); ui.root.setAttribute('data-cg-orient', data.orient); ui.root.setAttribute('data-cg-two', twoSided() ? '1' : '0');   // (nie data-orient — to nazwa przycisków, a closest() trafiałby w korzeń okna)
    ui.logoName.textContent = logo.img ? (logo.name || tr('logo wgrane', 'logo uploaded')) : '';
    dlg.querySelector('[data-act="logo-off"]').hidden = !logo.img;
    dlg.querySelector('[data-act="view3d"]').hidden = !window.Druk24Card3D;
  }
  function changed(fromTyping) {
    save(); syncUI(false); say(''); schedulePreview(); renderEntryThumb();
    if (attach.enabled) scheduleAttach();
    if (!fromTyping) updateEntry();
  }
  function resetLabel(armed) {
    if (!dlg) return;
    const b = dlg.querySelector('[data-act="reset"]'); if (b) b.textContent = armed ? tr('Na pewno? Kliknij ponownie', 'Sure? Click again') : tr('Wyczyść projekt', 'Reset design');
  }
  function resetDesign() {       // dwa kliknięcia; format i zadruk zostają — są częścią zamówienia
    if (!resetArmed) { resetArmed = setTimeout(() => { resetArmed = 0; resetLabel(false); }, 3500); resetLabel(true); return; }
    clearTimeout(resetArmed); resetArmed = 0; resetLabel(false);
    Object.assign(data, fresh()); TEXT_KEYS.forEach(k => { touched[k] = false; });
    removeLogo();
    if (attach.enabled) setAttach(false);
    try { localStorage.removeItem(KEY); } catch (e) { /* bez zapisu */ }
    changed();
  }
  function openEditor() {
    if (!isCardPage()) return;
    buildDialog(); say('');
    if (!dlg.open) dlg.showModal();
    syncUI(true); ensureFonts(); schedulePreview();
    const first = dlg.querySelector('[data-f="name"]'); if (first && !(window.matchMedia && matchMedia('(pointer: coarse)').matches)) first.focus({ preventScroll: true });
  }
  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    ['800 40px Montserrat', '600 40px Montserrat', '700 40px Montserrat'].forEach(f => document.fonts.load(f).then(() => { schedulePreview(); renderEntryThumb(); }).catch(() => {}));
  }

  // ---------- cykl życia strony ----------
  let scheduled = false;
  function decorate() {
    scheduled = false;
    const card = content.querySelector(':scope > .card');
    const grid = card && card.querySelector(':scope > .form-grid');
    if (!card || !grid || !card.querySelector('#bcFormat')) {
      if (curCard) { curCard = null; if (entry) entry.remove(); if (dlg && dlg.open) dlg.close(); if (attach.enabled) setAttach(false); }
      return;
    }
    if (card !== curCard) { curCard = card; if (entry) entry.remove(); entry = null; }
    if (!entry) buildEntry();
    if (grid.nextElementSibling !== entry) grid.after(entry);     // tuż pod formularzem (podgląd 3D układa się pod generatorem)
    renderEntryThumb(); updateEntry();
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(decorate); }
  new MutationObserver(ms => { if (ms.every(m => m.target.closest && m.target.closest('.d24cg-entry'))) return; schedule(); }).observe(content, { childList: true, subtree: true });
  const onForm = e => {
    const id = e.target && e.target.id;
    if (id !== 'bcFormat' && id !== 'bcSides' && id !== 'bcPrint' && id !== 'bcFinish') return;
    requestAnimationFrame(() => { if (ui) syncUI(false); if (dlg && dlg.open) schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); else updateEntry(); });
  };
  content.addEventListener('input', onForm, true); content.addEventListener('change', onForm, true);
  new MutationObserver(() => {   // zmiana języka: odbudowa okna i panelu; nietknięte teksty wracają do przykładów w nowym języku
    if (dlg) { if (dlg.open) dlg.close(); dlg.remove(); dlg = null; ui = null; }
    if (entry) { entry.remove(); entry = null; }
    const d = SAMPLES[isEn() ? 'en' : 'pl']; TEXT_KEYS.forEach(k => { if (!touched[k]) data[k] = d[k]; });
    schedule();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.Druk24CardSimple = {
    open: openEditor,
    getState: () => ({ ...data }),
    setState(s) { applyRaw(s); refreshAll(); },
    getAttachFiles() { return isCardPage() && attach.enabled && attach.file && attach.sig === sigNow() ? [attach.file] : []; },
    isAttachEnabled: () => attach.enabled,
    setAttach,
    buildPdf,
    render: (canvas, side) => renderSide(canvas, side || 'front', {}),
    getReport: () => report(8),
    getProblem: problem,
    setLogoFile,
    removeLogo,
    BLEED_MM: BLEED
  };
  loadSaved();
  ensureFonts();
  schedule();
})();
