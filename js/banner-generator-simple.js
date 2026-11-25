/*! Drukulator 0.26.19v — generator banerów (jedyny na stronie; „pełny” generator banner-generator.js jest wyłączony, kod zostaje w repozytorium).
 *
 * Panel z miniaturą tuż pod formularzem banera + okno edytora: wymiary i „Wyczyść projekt” u góry, podgląd z oceną czytelności po lewej,
 * po prawej: kolory (tylko paleta; wybór: tło / tekst / przycisk), pola Nagłówek / Opis / Kontakt / Przycisk, suwaki rozmiaru
 * (nagłówek, opis, kontakt, przycisk), wyrównanie lewo / środek / prawo i przycisk „Użyj w zamówieniu”.
 * Ten sam silnik rysowania (Druk24BannerEngine) i zapis PDF (Druk24PDF) co w pełnym generatorze. Wymiary są wspólne z formularzem
 * (pola „Szerokość / Wysokość”) — zmiana w oknie zmienia formularz i cenę, i odwrotnie.
 * Bez eksportu: nie ma pobierania PDF / JPG — jedyną akcją jest „Użyj w zamówieniu”, które dołącza projekt do zamówienia (jako PDF w koszyku).
 * Plik do zamówienia dołącza się tylko na życzenie klienta (przycisk w oknie albo checkbox w panelu) przez
 * window.Druk24BannerSimple.getAttachFiles() → app.js (quote.files). Naraz może być dołączony tylko jeden projekt
 * (gdyby pełny generator został włączony — włączenie jednego wyłącza drugi).
 */
(() => {
  'use strict';
  const E = window.Druk24BannerEngine, PDF = window.Druk24PDF;
  const content = document.getElementById('content');
  if (!E || !PDF || !content) return;

  const isEn = () => document.documentElement.lang === 'en';
  const tr = (pl, en) => (isEn() ? en : pl);
  const fmtNum = (n, d = 1) => new Intl.NumberFormat(isEn() ? 'en-US' : 'pl-PL', { maximumFractionDigits: d }).format(n);
  const formEl = id => document.getElementById(id);
  // 0.26.21v: generator tylko dla banerów. Materiały zaczynające się od „Folia” (mat, błysk, OWH, podłogowa…) nie są banerami — tak samo rozróżnia je kalkulator (calculators.js → isFilm).
  function isBannerMaterial() { const m = formEl('bannerMaterial'), v = m ? String(m.value || '') : ''; return !v || !/^Folia\b/i.test(v); }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hexOk = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/gi, 'l').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);
  const KEY = 'druk24-banner-simple-v2', KEY_OLD = 'druk24-banner-simple-v1';
  const L = E.LIMITS;
  const TEXT_KEYS = ['headline', 'sub', 'contact', 'cta'];
  const SCALE_KEYS = ['headScale', 'subScale', 'contactScale', 'ctaScale'];

  // kolory do wyboru — te same dla tła, tekstu i przycisku (bez własnych kolorów RGB)
  const COLORS = [
    ['#ffffff', 'Biały', 'White'], ['#111111', 'Czarny', 'Black'], ['#d71920', 'Czerwony', 'Red'], ['#ff6a13', 'Pomarańczowy', 'Orange'],
    ['#ffd60a', 'Żółty', 'Yellow'], ['#0b8a4b', 'Zielony', 'Green'], ['#08808b', 'Turkusowy', 'Teal'], ['#1d6fe0', 'Niebieski', 'Blue'],
    ['#0f2747', 'Granatowy', 'Navy'], ['#6a2fb0', 'Fioletowy', 'Purple'], ['#e0408a', 'Różowy', 'Pink'], ['#5b6470', 'Szary', 'Grey']
  ];
  const SAMPLES = {
    pl: { headline: 'TWÓJ NAGŁÓWEK', sub: 'Krótki opis oferty lub hasło reklamowe', contact: 'tel. 500 600 700 • www.twojafirma.pl', cta: 'Zadzwoń teraz' },
    en: { headline: 'YOUR HEADLINE', sub: 'Short description or slogan', contact: 'tel. 500 600 700 • www.yourcompany.com', cta: 'Call now' }
  };
  const isSample = v => { const t = String(v || '').trim(); return !!t && ['pl', 'en'].some(l => ['headline', 'sub', 'contact'].some(k => SAMPLES[l][k] === t)); };
  const RATING = { great: ['świetna', 'great'], good: ['dobra', 'good'], weak: ['słaba', 'weak'], bad: ['zła', 'poor'] };

  // ---------- kolory: kontrast (biały albo czarny tekst, ten z lepszym kontrastem) ----------
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = h => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const onColor = h => { const l = lum(h) + 0.05; return 1.05 / l >= l / (lum('#111111') + 0.05) ? '#ffffff' : '#111111'; };
  const ratio = (a, b) => { const x = lum(a) + 0.05, y = lum(b) + 0.05; return Math.max(x, y) / Math.min(x, y); };

  // ---------- stan ----------
  const fresh = () => {
    const d = SAMPLES[isEn() ? 'en' : 'pl'];
    return { color: '#0f2747', textColor: '', btnColor: '', headline: d.headline, sub: d.sub, contact: d.contact, cta: d.cta, ctaOn: false, headScale: 100, subScale: 100, contactScale: 100, ctaScale: 100, align: 'center' };
  };
  const data = fresh();
  const touched = { headline: false, sub: false, contact: false, cta: false };
  let target = 'bg';     // który kolor zmieniają kafelki: 'bg' | 'text' | 'btn'

  function applyRaw(raw) {
    if (!raw || typeof raw !== 'object') return;
    if (hexOk(raw.color)) data.color = raw.color.toLowerCase();
    ['textColor', 'btnColor'].forEach(k => { if (raw[k] === '' || hexOk(raw[k])) data[k] = String(raw[k]).toLowerCase(); });
    TEXT_KEYS.forEach(k => { if (typeof raw[k] === 'string') { data[k] = raw[k].slice(0, L[k]); touched[k] = true; } });
    if (typeof raw.ctaOn === 'boolean') data.ctaOn = raw.ctaOn;
    SCALE_KEYS.forEach(k => { const n = Number(raw[k]); if (raw[k] != null && Number.isFinite(n)) data[k] = clamp(Math.round(n), 40, 100); });
    if (['left', 'center', 'right'].includes(raw.align)) data.align = raw.align;
  }
  function loadSaved() {
    try { applyRaw(JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(KEY_OLD) || 'null')); } catch (e) { /* brak dostępu do pamięci przeglądarki — działamy bez zapisu */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* bez zapisu */ } }
  loadSaved();

  const effText = () => data.textColor || onColor(data.color);
  const effBtn = () => data.btnColor || effText();
  const ctaShown = () => data.ctaOn && !!data.cta.trim();
  const colorOf = t => (t === 'bg' ? data.color : t === 'text' ? effText() : effBtn());

  function dims() {
    const w = Number(formEl('bannerWidth')?.value), h = Number(formEl('bannerHeight')?.value);
    const ok = Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0;
    return { ok, w: ok ? clamp(w, 10, 1000) : 200, h: ok ? clamp(h, 10, 1000) : 100 };
  }
  function engineState(d) {
    const s = E.defaultState();
    s.widthCm = d.w; s.heightCm = d.h; s.layout = 'center'; s.font = 'modern'; s.upper = true; s.align = data.align;
    s.headline = data.headline; s.sub = data.sub; s.contact = data.contact; s.cta = data.cta; s.ctaOn = ctaShown();
    SCALE_KEYS.forEach(k => { s[k] = data[k]; });
    s.bg = { ...s.bg, type: 'solid', c1: data.color };
    s.custom = { text: effText(), accent: effBtn() };
    return E.normalizeState(s);
  }
  // nic nie wyjdzie na druk z przykładowym tekstem ani bez nagłówka
  function problem() {
    const d = dims();
    if (!d.ok) return tr('Najpierw wpisz wymiary banera.', 'Enter the banner size first.');
    if (!data.headline.trim()) return tr('Wpisz nagłówek.', 'Enter a headline.');
    const k = ['headline', 'sub', 'contact'].find(x => isSample(data[x]));
    if (k) return tr(`Zamień przykładowy tekst („${data[k].trim()}”) na własny albo go usuń.`, `Replace the sample text (“${data[k].trim()}”) with your own or delete it.`);
    return '';
  }
  // te same reguły rozmiaru co w kalkulatorze banerów (calculators.js → calculateBanner)
  function sizeIssues(d) {
    const m = (formEl('bannerMaterial') && formEl('bannerMaterial').value) || '', sh = Math.min(d.w, d.h), out = [];
    const maxShort = /laminat/i.test(m) ? 135 : 160;
    if (sh > maxShort) out.push(tr(`Krótszy bok może mieć maks. ${maxShort} cm`, `Shorter side can be at most ${maxShort} cm`));
    if (!/^Folia\b/i.test(m) && sh < 30) out.push(tr('Krótszy bok musi mieć min. 30 cm', 'Shorter side must be at least 30 cm'));
    return out;
  }

  // ---------- rysowanie ----------
  let dlg = null, ui = null, entry = null, curCard = null, previewQueued = false, resetArmed = 0;
  function renderPreview() {
    previewQueued = false;
    if (!ui || !dlg || !dlg.open) return;
    const d = dims(), r = d.w / d.h, long = r > 3 || r < 1 / 3 ? 1800 : 1400, c = ui.canvas;
    const cw = Math.max(40, Math.round(r >= 1 ? long : long * r)), ch = Math.max(40, Math.round(r >= 1 ? long / r : long));
    if (c.width !== cw) c.width = cw; if (c.height !== ch) c.height = ch;
    updateChips(d, E.render(c, engineState(d), {}, { analyze: true }));
  }
  function schedulePreview() { if (previewQueued) return; previewQueued = true; requestAnimationFrame(renderPreview); }
  function updateChips(d, r) {
    const chips = [];
    if (d.ok) chips.push(`<span class="d24bg-chip">${fmtNum(d.w, 1)} × ${fmtNum(d.h, 1)} cm</span>`);
    else chips.push(`<span class="d24bg-chip d24bg-chip--bad">${tr('Wpisz wymiary banera (pokazuję 200 × 100 cm)', 'Enter the banner size (showing 200 × 100 cm)')}</span>`);
    if (r.distM) chips.push(`<span class="d24bg-chip" title="${tr('Orientacyjnie: ok. 1 cm wysokości liter na każde 1,2 m odległości', 'Rule of thumb: about 1 cm of letter height per 1.2 m of distance')}">${tr(`Nagłówek czytelny z ok. ${r.distM} m`, `Headline readable from ~${r.distM} m`)}</span>`);
    if (r.rating) chips.push(`<span class="d24bg-chip d24bg-chip--${r.rating}">${tr('Czytelność: ', 'Readability: ')}${RATING[r.rating][isEn() ? 1 : 0]}</span>`);
    if (ctaShown() && ratio(effBtn(), data.color) < 1.6) chips.push(`<span class="d24bg-chip d24bg-chip--weak">${tr('Przycisk zlewa się z tłem', 'The button blends into the background')}</span>`);
    sizeIssues(d).forEach(t => chips.push(`<span class="d24bg-chip d24bg-chip--bad">${t}</span>`));
    const html = chips.join('');
    if (ui.chips.innerHTML !== html) ui.chips.innerHTML = html;
  }

  async function buildPdf() {
    const d = dims(), s = engineState(d), rt = d.w / d.h, mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), maxArea = mobile ? 16e6 : 30e6;
    let w = rt >= 1 ? 4000 : 4000 * rt, h = rt >= 1 ? 4000 / rt : 4000;
    if (w * h > maxArea) { const k = Math.sqrt(maxArea / (w * h)); w *= k; h *= k; }
    w = Math.max(64, Math.round(w)); h = Math.max(64, Math.round(h));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    E.render(c, s, {}, {});
    const jpg = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.92)); if (!jpg) throw new Error('jpg');
    const base = `baner-${fmtNum(d.w, 1).replace(/\s/g, '').replace(',', '.')}x${fmtNum(d.h, 1).replace(/\s/g, '').replace(',', '.')}cm${slug(data.headline) ? '-' + slug(data.headline) : ''}`;
    const pdf = PDF.fromJpeg({ jpeg: new Uint8Array(await jpg.arrayBuffer()), wPx: w, hPx: h, wCm: d.w, hCm: d.h, title: data.headline || 'Baner' });
    return { blob: new Blob([pdf.bytes], { type: 'application/pdf' }), name: base + '.pdf', scale: pdf.scale };
  }

  // ---------- załącznik do zamówienia ----------
  const attach = { enabled: false, file: null, sig: '', busy: false, error: '', token: 0, scale: 1 };
  let attachTimer = 0, entryNote = '';
  const sigNow = () => { const d = dims(); return JSON.stringify([d.w, d.h, data]); };
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
      attach.sig = sig; attach.scale = out.scale;
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
    if (!isBannerMaterial()) { attach.enabled = false; updateEntry(); return; }   // folie: bez projektu banera
    const pr = problem();
    if (pr) { attach.enabled = false; entryNote = pr; updateEntry(); return; }
    if (window.Druk24BannerGen && window.Druk24BannerGen.setAttach) window.Druk24BannerGen.setAttach(false);   // jeden projekt naraz
    attach.enabled = true; buildAttach();
  }
  async function useInOrder() {
    const pr = problem(); if (pr) { say(pr, true); return; }
    ui.root.classList.add('is-busy'); say(tr('Zapisuję projekt jako PDF…', 'Saving the design as PDF…'));
    if (window.Druk24BannerGen && window.Druk24BannerGen.setAttach) window.Druk24BannerGen.setAttach(false);
    entryNote = ''; attach.enabled = true; clearTimeout(attachTimer);
    await buildAttach();
    ui.root.classList.remove('is-busy');
    if (attach.file && !attach.error) { say(''); dlg.close(); } else say(attach.error || tr('Nie udało się zapisać projektu.', 'Could not save the design.'), true);
  }

  // ---------- panel pod formularzem ----------
  function buildEntry() {
    entry = document.createElement('section');
    entry.className = 'd24bg-entry d24bgs-entry';
    entry.innerHTML = `<div class="d24bg-entry__copy">
      <span class="d24bg-eyebrow">${tr('GENERATOR BANERA', 'BANNER GENERATOR')}</span>
      <h3>${tr('Zaprojektuj baner: kolory, treść i układ napisów', 'Design your banner: colours, text and layout')}</h3>
      <p>${tr('Wybierz kolory, wpisz treść, ustaw rozmiar napisów i wyrównanie. Zobaczysz baner w skali z oceną czytelności, a gotowy projekt trafi do zamówienia razem z banerem.', 'Pick the colours, type your text, set the text size and alignment. You will see the banner to scale with a readability check, and the finished design goes into your order together with the banner.')}</p>
      <div class="d24bg-entry__actions">
        <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="open">${tr('Zaprojektuj baner', 'Design my banner')}</button>
        <label class="d24bg-check"><input type="checkbox" data-attach><span>${tr('Dołącz projekt do zamówienia', 'Attach the design to my order')}</span></label>
      </div>
      <p class="d24bg-entry__status" data-status aria-live="polite"></p>
    </div>
    <button type="button" class="d24bg-entry__thumb" data-act="open" aria-label="${tr('Otwórz generator banera', 'Open banner generator')}"><canvas></canvas><span>${tr('Edytuj projekt', 'Edit design')}</span></button>`;
    entry.addEventListener('click', e => { if (e.target.closest('[data-act="open"]')) openEditor(); });
    entry.addEventListener('change', e => { if (e.target.matches('[data-attach]')) setAttach(e.target.checked); });
  }
  function renderEntryThumb() {
    const c = entry && entry.isConnected ? entry.querySelector('canvas') : null; if (!c) return;
    const d = dims(), r = Math.min(6, Math.max(0.5, d.w / d.h)), w = 520, h = Math.round(w / r);
    if (c.width !== w) c.width = w; if (c.height !== h) c.height = h;
    E.render(c, engineState(d), {}, {});
  }
  function updateEntry() {
    if (!entry || !entry.isConnected) return;
    const cb = entry.querySelector('[data-attach]'), s = entry.querySelector('[data-status]');
    if (cb) cb.checked = attach.enabled;
    let msg = entryNote, cls = entryNote ? 'is-bad' : '';
    if (attach.enabled) {
      if (attach.error) { msg = attach.error; cls = 'is-bad'; }
      else if (attach.busy || !attach.file || attach.sig !== sigNow()) { msg = tr('Przygotowuję plik PDF z projektem…', 'Preparing the design PDF…'); cls = ''; }
      else { msg = tr(`✓ Projekt zapisany — do zamówienia zostanie dołączony plik ${attach.file.name} (${fmtNum(attach.file.size / 1048576, 1)} MB). Pojawi się po dodaniu do koszyka.`, `✓ Design saved — ${attach.file.name} (${fmtNum(attach.file.size / 1048576, 1)} MB) will be attached to your order. It will appear once you add the banner to the cart.`); cls = 'is-ok'; }
    }
    if (s.textContent !== msg) s.textContent = msg;
    s.className = 'd24bg-entry__status ' + cls;
  }

  // ---------- okno ----------
  function buildDialog() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'd24bgs-dialog';
    dlg.setAttribute('aria-labelledby', 'd24bgs-title');
    const sw = COLORS.map(([hex, pl, en]) => `<button type="button" data-color="${hex}" aria-pressed="false" title="${isEn() ? en : pl}" aria-label="${isEn() ? en : pl}" style="background:${hex}"></button>`).join('');
    const tg = [['bg', 'Tło', 'Background'], ['text', 'Tekst', 'Text'], ['btn', 'Przycisk', 'Button']].map(([k, pl, en]) => `<button type="button" data-target="${k}" aria-pressed="false"><i style="background:#888"></i>${tr(pl, en)}</button>`).join('');
    const field = (k, pl, en) => `<label class="d24bgs-field"><span class="d24bgs-field__lbl">${tr(pl, en)}<small data-count="${k}"></small></span><input type="text" data-f="${k}" maxlength="${L[k]}" autocomplete="off" spellcheck="false"></label>`;
    const slider = (k, pl, en) => `<label class="d24bg-row"><span>${tr(pl, en)}</span><input type="range" data-s="${k}" min="40" max="100" step="1"><output data-out="${k}"></output></label>`;
    const al = [['left', 'Do lewej', 'Left'], ['center', 'Środek', 'Centre'], ['right', 'Do prawej', 'Right']].map(([k, pl, en]) => `<button type="button" data-align="${k}" aria-pressed="false">${tr(pl, en)}</button>`).join('');
    dlg.innerHTML = `<div class="d24bg d24bgs">
      <div class="d24bgs-top">
        <strong id="d24bgs-title">${tr('Generator banera', 'Banner generator')}</strong>
        <div class="d24bgs-size"><span>${tr('Wymiary', 'Size')}</span>
          <input type="number" data-size="w" min="10" max="1000" step="1" inputmode="decimal" aria-label="${tr('Szerokość w cm', 'Width in cm')}"> × <input type="number" data-size="h" min="10" max="1000" step="1" inputmode="decimal" aria-label="${tr('Wysokość w cm', 'Height in cm')}"> cm</div>
        <button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="reset">${tr('Wyczyść projekt', 'Reset design')}</button>
        <button type="button" class="d24bg-icon d24bgs-close" data-act="close" aria-label="${tr('Zamknij', 'Close')}" title="${tr('Zamknij', 'Close')}">✕</button>
      </div>
      <div class="d24bgs-main">
        <div class="d24bgs-left">
          <div class="d24bgs-stage"><canvas role="img" aria-label="${tr('Podgląd banera', 'Banner preview')}"></canvas>
            <div class="d24bg-chips d24bgs-chips" data-chips role="status" aria-live="polite"></div></div>
        </div>
        <div class="d24bgs-side">
          <div class="d24bgs-colors">
            <div class="d24bgs-swatches" data-swatches role="group" aria-label="${tr('Kolory', 'Colours')}">${sw}</div>
            <div class="d24bgs-targets" role="group" aria-label="${tr('Który kolor zmieniasz', 'Which colour you are changing')}"><span>${tr('Kolor:', 'Colour of:')}</span>${tg}</div>
          </div>
          <div class="d24bgs-fields">
            ${field('headline', 'Nagłówek', 'Headline')}${field('sub', 'Opis / hasło', 'Description / slogan')}${field('contact', 'Kontakt', 'Contact')}
            <div class="d24bgs-field"><label class="d24bgs-field__lbl d24bgs-check"><input type="checkbox" data-cta-on aria-label="${tr('Pokaż przycisk', 'Show the button')}"><span>${tr('Przycisk', 'Button')}</span></label><input type="text" data-f="cta" maxlength="${L.cta}" autocomplete="off" spellcheck="false" aria-label="${tr('Tekst przycisku', 'Button text')}"></div>
          </div>
          <div class="d24bgs-sliders">
            ${slider('headScale', 'Rozmiar nagłówka', 'Headline size')}${slider('subScale', 'Rozmiar opisu', 'Description size')}${slider('contactScale', 'Rozmiar kontaktu', 'Contact size')}${slider('ctaScale', 'Rozmiar przycisku', 'Button size')}
          </div>
          <div class="d24bg-seg d24bgs-align" role="group" aria-label="${tr('Wyrównanie tekstu', 'Text alignment')}">${al}</div>
          <div class="d24bgs-actions">
            <p class="d24bgs-msg" data-msg aria-live="polite"></p>
            <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="use">${tr('Użyj w zamówieniu', 'Use in order')}</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(dlg);
    const q = s => dlg.querySelector(s);
    ui = { root: q('.d24bgs'), canvas: q('.d24bgs-stage canvas'), chips: q('[data-chips]'), msg: q('[data-msg]'), sizeW: q('[data-size="w"]'), sizeH: q('[data-size="h"]') };
    dlg.addEventListener('click', e => {
      const sb = e.target.closest('[data-color]');
      if (sb) { pickColor(sb.dataset.color); return; }
      const tb = e.target.closest('[data-target]');
      if (tb) { if (tb.dataset.target === 'btn' && !data.ctaOn) return; target = tb.dataset.target; syncUI(false); return; }
      const ab = e.target.closest('[data-align]');
      if (ab) { data.align = ab.dataset.align; changed(); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'close') dlg.close();
      else if (b.dataset.act === 'use') useInOrder();
      else if (b.dataset.act === 'reset') resetDesign();
    });
    dlg.addEventListener('input', e => {
      const t = e.target;
      if (t.matches('[data-f]')) {
        const k = t.dataset.f; data[k] = t.value; touched[k] = true;
        if (k === 'cta' && t.value.trim() && !data.ctaOn) data.ctaOn = true;      // wpisanie tekstu przycisku od razu go pokazuje
        changed(true);
      } else if (t.matches('[data-s]')) { data[t.dataset.s] = clamp(Number(t.value) || 100, 40, 100); changed(true); }
      else if (t.matches('[data-size]')) sizeFromInput(t, false);
    });
    dlg.addEventListener('change', e => {
      const t = e.target;
      if (t.matches('[data-cta-on]')) { data.ctaOn = t.checked; if (!data.ctaOn && target === 'btn') target = 'bg'; changed(); }
      else if (t.matches('[data-size]')) sizeFromInput(t, true);
    });
    dlg.addEventListener('focusin', e => {     // pierwsze kliknięcie w przykładowy tekst zaznacza go, więc wystarczy zacząć pisać
      const t = e.target;
      if (t.matches && t.matches('[data-f]') && isSample(t.value)) t.select();
    });
    dlg.addEventListener('close', () => { clearTimeout(resetArmed); resetArmed = 0; resetLabel(false); save(); updateEntry(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // kliknięcie w tło
  }
  function say(text, bad) { if (!ui) return; ui.msg.textContent = text || ''; ui.msg.classList.toggle('is-bad', !!bad); }
  function pickColor(hex) {
    if (target === 'bg') data.color = hex; else if (target === 'text') data.textColor = hex; else data.btnColor = hex;
    changed();
  }
  function syncSize(force) {
    if (!ui) return;
    const d = dims(), fw = formEl('bannerWidth'), fh = formEl('bannerHeight');
    [[ui.sizeW, fw, d.w], [ui.sizeH, fh, d.h]].forEach(([inp, f, v]) => {
      if (!force && document.activeElement === inp) return;
      const want = f && String(f.value).trim() !== '' && Number(f.value) > 0 ? String(v) : '';
      if (inp.value !== want) inp.value = want;
    });
  }
  function sizeFromInput(el, final) {      // wymiary z okna → formularz na stronie (a z nim cena)
    const raw = String(el.value).trim(), v = Number(raw);
    if (!raw || !Number.isFinite(v)) return;
    if (!final && (v < 10 || v > 1000)) return;       // w trakcie pisania nie wysyłamy wartości niepełnych (np. „2” z „200”)
    const nv = clamp(v, 10, 1000), id = el.dataset.size === 'w' ? 'bannerWidth' : 'bannerHeight', f = formEl(id);
    if (final) el.value = String(nv);
    if (f && Number(f.value) !== nv) { f.value = String(nv); f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function syncUI(force) {
    if (!ui) return;
    if (target === 'btn' && !data.ctaOn) target = 'bg';
    const cur = colorOf(target);
    dlg.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === cur)));
    dlg.querySelectorAll('[data-target]').forEach(b => {
      const k = b.dataset.target; b.setAttribute('aria-pressed', String(k === target));
      b.disabled = k === 'btn' && !data.ctaOn; b.title = b.disabled ? tr('Najpierw włącz przycisk (pole „Przycisk” niżej)', 'Turn the button on first (the “Button” field below)') : '';
      b.querySelector('i').style.background = colorOf(k);
    });
    dlg.querySelectorAll('[data-f]').forEach(i => {
      const k = i.dataset.f;
      if ((force || document.activeElement !== i) && i.value !== data[k]) i.value = data[k];
      const c = dlg.querySelector(`[data-count="${k}"]`); if (c) c.textContent = `${data[k].length}/${L[k]}`;
    });
    dlg.querySelector('[data-cta-on]').checked = data.ctaOn;
    dlg.querySelectorAll('[data-s]').forEach(i => {
      const k = i.dataset.s; if (Number(i.value) !== data[k]) i.value = String(data[k]);
      dlg.querySelector(`[data-out="${k}"]`).textContent = data[k] + '%';
      if (k === 'ctaScale') i.disabled = !data.ctaOn;
    });
    dlg.querySelectorAll('[data-align]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.align === data.align)));
    syncSize(force);
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
  function resetDesign() {       // dwa kliknięcia (jak w pełnym generatorze); wymiary zostają — są częścią zamówienia
    if (!resetArmed) { resetArmed = setTimeout(() => { resetArmed = 0; resetLabel(false); }, 3500); resetLabel(true); return; }
    clearTimeout(resetArmed); resetArmed = 0; resetLabel(false);
    Object.assign(data, fresh()); Object.keys(touched).forEach(k => { touched[k] = false; }); target = 'bg';
    if (attach.enabled) setAttach(false);
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_OLD); } catch (e) { /* bez zapisu */ }
    changed();
  }
  function openEditor() {
    if (!isBannerMaterial()) return;   // folie: bez generatora banera
    buildDialog(); say('');
    if (!dlg.open) dlg.showModal();
    syncUI(true); ensureFonts(); schedulePreview();
    const first = dlg.querySelector('[data-f="headline"]'); if (first && !(window.matchMedia && matchMedia('(pointer: coarse)').matches)) first.focus({ preventScroll: true });   // na telefonie bez wysuwania klawiatury od razu
  }
  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    ['800 40px Montserrat', '600 40px Montserrat'].forEach(f => document.fonts.load(f).then(() => { schedulePreview(); renderEntryThumb(); }).catch(() => {}));
  }

  // ---------- cykl życia strony ----------
  let scheduled = false;
  function decorate() {
    scheduled = false;
    const card = content.querySelector(':scope > .card');
    const grid = card && card.querySelector(':scope > .form-grid');
    if (!card || !grid || !card.querySelector('#bannerWidth')) { if (curCard) { curCard = null; if (entry) entry.remove(); } return; }
    if (card !== curCard) { curCard = card; if (entry) entry.remove(); entry = null; }
    if (!entry) buildEntry();
    if (grid.nextElementSibling !== entry) grid.after(entry);     // tuż pod formularzem
    syncMaterial();
    renderEntryThumb(); updateEntry();
  }
  // panel i dołączanie projektu tylko przy banerach; po przełączeniu na folię panel znika, a projekt przestaje być dołączany
  function syncMaterial() {
    const on = isBannerMaterial();
    if (!on) { if (attach.enabled) setAttach(false); if (dlg && dlg.open) dlg.close(); }
    if (entry) entry.hidden = !on;
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(decorate); }
  new MutationObserver(ms => { if (ms.every(m => m.target.closest && m.target.closest('.d24bg-entry'))) return; schedule(); }).observe(content, { childList: true, subtree: true });
  const onForm = e => {
    const id = e.target && e.target.id;
    if (id === 'bannerMaterial') { syncMaterial(); if (isBannerMaterial()) { if (dlg && dlg.open) schedulePreview(); renderEntryThumb(); updateEntry(); } return; }
    if (id === 'bannerWidth' || id === 'bannerHeight') { syncSize(false); if (dlg && dlg.open) schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); else updateEntry(); }
  };
  content.addEventListener('input', onForm, true); content.addEventListener('change', onForm, true);
  new MutationObserver(() => {   // zmiana języka: odbudowa okna i panelu; nietknięte teksty wracają do przykładów w nowym języku
    if (dlg) { if (dlg.open) dlg.close(); dlg.remove(); dlg = null; ui = null; }
    if (entry) { entry.remove(); entry = null; }
    const d = SAMPLES[isEn() ? 'en' : 'pl']; TEXT_KEYS.forEach(k => { if (!touched[k]) data[k] = d[k]; });
    schedule();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.Druk24BannerSimple = {
    open: openEditor,
    getState: () => ({ ...data }),
    setState(s) { applyRaw(s); save(); if (ui) syncUI(true); schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); },
    getAttachFiles() { return isBannerMaterial() && attach.enabled && attach.file && attach.sig === sigNow() ? [attach.file] : []; },
    isAttachEnabled: () => attach.enabled,
    setAttach,
    buildPdf,
    render: canvas => E.render(canvas, engineState(dims()), {}, {}),
    getReport: () => { const c = document.createElement('canvas'), d = dims(); c.width = 700; c.height = Math.max(40, Math.round(700 * d.h / d.w)); return E.render(c, engineState(d), {}, { analyze: true }); },
    getProblem: problem
  };
  ensureFonts();
  schedule();
})();
