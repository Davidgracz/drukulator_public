/*! Drukulator 0.26.17v — PROSTY generator banerów: wybierasz kolor tła i wpisujesz treść, i tyle.
 *
 * Osobna wersja obok pełnego generatora (banner-generator.js): to ona jest NA WIERZCHU strony banerów (panel z miniaturą tuż pod formularzem),
 * pełny generator jest pod nią w zwijanej sekcji „Chcesz projektować bardziej?”. Własne małe okno, ten sam silnik rysowania (Druk24BannerEngine) i zapis PDF (Druk24PDF). Rozmiar banera jest brany
 * z formularza (pól „Szerokość / Wysokość”) i nigdy przez ten generator nie zmieniany.
 * Bez eksportu: nie ma pobierania PDF / JPG — jedyną akcją jest zapis projektu, który trafia do zamówienia (jako PDF w koszyku).
 * Do zamówienia dołącza plik tylko za zgodą klienta (checkbox w panelu albo przycisk „Zapisz projekt”)
 * przez window.Druk24BannerSimple.getAttachFiles() → app.js (quote.files). Naraz może być dołączony tylko jeden projekt
 * (z prostego albo z pełnego generatora) — włączenie jednego wyłącza drugi.
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
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hexOk = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/gi, 'l').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);
  const KEY = 'druk24-banner-simple-v1';
  const L = E.LIMITS;

  // kolory tła do wyboru (tekst dobiera się sam: biały albo czarny, zależnie od jasności tła)
  const COLORS = [
    ['#ffffff', 'Biały', 'White'], ['#111111', 'Czarny', 'Black'], ['#d71920', 'Czerwony', 'Red'], ['#ff6a13', 'Pomarańczowy', 'Orange'],
    ['#ffd60a', 'Żółty', 'Yellow'], ['#0b8a4b', 'Zielony', 'Green'], ['#08808b', 'Turkusowy', 'Teal'], ['#1d6fe0', 'Niebieski', 'Blue'],
    ['#0f2747', 'Granatowy', 'Navy'], ['#6a2fb0', 'Fioletowy', 'Purple'], ['#e0408a', 'Różowy', 'Pink'], ['#5b6470', 'Szary', 'Grey']
  ];
  const SAMPLES = {
    pl: { headline: 'TWÓJ NAGŁÓWEK', sub: 'Krótki opis oferty lub hasło reklamowe', contact: 'tel. 500 600 700 • www.twojafirma.pl' },
    en: { headline: 'YOUR HEADLINE', sub: 'Short description or slogan', contact: 'tel. 500 600 700 • www.yourcompany.com' }
  };
  const isSample = v => { const t = String(v || '').trim(); return !!t && ['pl', 'en'].some(l => Object.values(SAMPLES[l]).includes(t)); };

  // ---------- kolor tekstu: biały albo czarny, ten z lepszym kontrastem ----------
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = h => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const onColor = h => { const l = lum(h) + 0.05; return 1.05 / l >= l / (lum('#111111') + 0.05) ? '#ffffff' : '#111111'; };

  // ---------- stan ----------
  const data = { color: '#0f2747', headline: '', sub: '', contact: '' };
  const touched = { headline: false, sub: false, contact: false };
  function loadSaved() {
    const d = SAMPLES[isEn() ? 'en' : 'pl'];
    data.headline = d.headline; data.sub = d.sub; data.contact = d.contact;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && typeof raw === 'object') {
        if (hexOk(raw.color)) data.color = raw.color.toLowerCase();
        ['headline', 'sub', 'contact'].forEach(k => { if (typeof raw[k] === 'string') { data[k] = raw[k].slice(0, L[k]); touched[k] = true; } });
      }
    } catch (e) { /* brak dostępu do pamięci przeglądarki — działamy bez zapisu */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* bez zapisu */ } }
  loadSaved();

  function dims() {
    const w = Number(formEl('bannerWidth')?.value), h = Number(formEl('bannerHeight')?.value);
    const ok = Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0;
    return { ok, w: ok ? clamp(w, 10, 1000) : 200, h: ok ? clamp(h, 10, 1000) : 100 };
  }
  function engineState(d) {
    const s = E.defaultState(), t = onColor(data.color);
    s.widthCm = d.w; s.heightCm = d.h; s.layout = 'center'; s.font = 'modern'; s.upper = true;
    s.headline = data.headline; s.sub = data.sub; s.contact = data.contact; s.ctaOn = false;
    s.bg = { ...s.bg, type: 'solid', c1: data.color };
    s.custom = { text: t, accent: t };
    return E.normalizeState(s);
  }
  // nic nie wyjdzie na druk z przykładowym tekstem ani bez nagłówka
  function problem() {
    const d = dims();
    if (!d.ok) return tr('Najpierw wpisz wymiary banera w formularzu.', 'Enter the banner size in the form first.');
    if (!data.headline.trim()) return tr('Wpisz nagłówek.', 'Enter a headline.');
    const k = ['headline', 'sub', 'contact'].find(x => isSample(data[x]));
    if (k) return tr(`Zamień przykładowy tekst („${data[k].trim()}”) na własny albo go usuń.`, `Replace the sample text (“${data[k].trim()}”) with your own or delete it.`);
    return '';
  }

  // ---------- rysowanie i eksport ----------
  let dlg = null, ui = null, entry = null, curCard = null, previewQueued = false;
  function renderPreview() {
    previewQueued = false;
    if (!ui || !dlg || !dlg.open) return;
    const d = dims(), r = d.w / d.h, long = r > 3 || r < 1 / 3 ? 1500 : 1100, c = ui.canvas;
    const cw = Math.max(40, Math.round(r >= 1 ? long : long * r)), ch = Math.max(40, Math.round(r >= 1 ? long / r : long));
    if (c.width !== cw) c.width = cw; if (c.height !== ch) c.height = ch;
    E.render(c, engineState(d), {}, {});
    ui.size.textContent = d.ok
      ? tr(`Rozmiar: ${fmtNum(d.w)} × ${fmtNum(d.h)} cm — z formularza (zmienisz go po zamknięciu okna)`, `Size: ${fmtNum(d.w)} × ${fmtNum(d.h)} cm — from the form (change it after closing this window)`)
      : tr('Brak wymiarów — wpisz je w formularzu, na razie pokazuję 200 × 100 cm.', 'No size yet — enter it in the form; showing 200 × 100 cm for now.');
  }
  function schedulePreview() { if (previewQueued) return; previewQueued = true; requestAnimationFrame(renderPreview); }

  async function buildPdf() {
    const d = dims(), s = engineState(d), ratio = d.w / d.h, mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), maxArea = mobile ? 16e6 : 30e6;
    let w = ratio >= 1 ? 4000 : 4000 * ratio, h = ratio >= 1 ? 4000 / ratio : 4000;
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
  const sigNow = () => { const d = dims(); return JSON.stringify([d.w, d.h, data.color, data.headline, data.sub, data.contact]); };
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
    const pr = problem();
    if (pr) { attach.enabled = false; entryNote = pr; updateEntry(); return; }
    if (window.Druk24BannerGen && window.Druk24BannerGen.setAttach) window.Druk24BannerGen.setAttach(false);   // jeden projekt naraz
    attach.enabled = true; buildAttach();
  }
  async function saveProject() {
    const pr = problem(); if (pr) { say(pr, true); return; }
    ui.root.classList.add('is-busy'); say(tr('Zapisuję projekt…', 'Saving the design…'));
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
      <h3>${tr('Zaprojektuj baner w minutę: kolor tła i treść', 'Design a banner in a minute: background colour and text')}</h3>
      <p>${tr('Bez szablonów i dodatków — wybierz kolor tła, wpisz treść i zapisz projekt. Trafi do zamówienia razem z banerem.', 'No templates or extras — pick a background colour, type your text and save the design. It goes into your order together with the banner.')}</p>
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
    const field = (k, pl, en, opt) => `<label class="d24bgs-field"><span>${tr(pl, en)}${opt ? ` <em>${tr('(opcjonalnie)', '(optional)')}</em>` : ''}<small data-count="${k}"></small></span><input type="text" data-f="${k}" maxlength="${L[k]}" autocomplete="off" spellcheck="false"></label>`;
    dlg.innerHTML = `<div class="d24bg d24bgs">
      <div class="d24bgs-top">
        <div class="d24bgs-top__title"><strong id="d24bgs-title">${tr('Prosty generator banera', 'Simple banner generator')}</strong><span data-size></span></div>
        <button type="button" class="d24bg-icon" data-act="close" aria-label="${tr('Zamknij', 'Close')}">✕</button>
      </div>
      <div class="d24bgs-main">
        <div class="d24bgs-stage"><canvas aria-label="${tr('Podgląd banera', 'Banner preview')}"></canvas></div>
        <div class="d24bgs-side">
          <section>
            <h4>${tr('1. Kolor tła', '1. Background colour')}</h4>
            <div class="d24bgs-swatches" data-swatches>${sw}</div>
            <label class="d24bgs-custom"><span>${tr('Własny kolor', 'Custom colour')}</span><input type="color" data-custom aria-label="${tr('Własny kolor tła', 'Custom background colour')}"></label>
          </section>
          <section>
            <h4>${tr('2. Treść', '2. Text')}</h4>
            ${field('headline', 'Nagłówek', 'Headline', false)}${field('sub', 'Opis', 'Description', true)}${field('contact', 'Kontakt', 'Contact', true)}
          </section>
          <p class="d24bg-hint">${tr('Kolor tekstu i jego rozmiar dobieramy automatycznie. Potrzebujesz logo, zdjęcia, kodu QR albo gotowych szablonów?', 'Text colour and size are chosen automatically. Need a logo, photo, QR code or ready-made templates?')} <button type="button" class="d24bgs-link" data-act="full">${tr('Otwórz pełny generator', 'Open the full generator')}</button></p>
          <p class="d24bg-hint d24bgs-note">${tr('„Zapisz projekt” dołącza projekt do zamówienia — pojawi się w koszyku po dodaniu banera.', '“Save design” attaches the design to your order — it appears in the cart once you add the banner.')}</p>
          <p class="d24bgs-msg" data-msg aria-live="polite"></p>
          <div class="d24bgs-actions">
            <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="save">${tr('Zapisz projekt', 'Save design')}</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(dlg);
    const q = s => dlg.querySelector(s);
    ui = { root: q('.d24bgs'), canvas: q('canvas'), size: q('[data-size]'), msg: q('[data-msg]'), color: q('[data-custom]') };
    dlg.addEventListener('click', e => {
      const sb = e.target.closest('[data-color]');
      if (sb) { data.color = sb.dataset.color; changed(); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'close') dlg.close();
      else if (b.dataset.act === 'save') saveProject();
      else if (b.dataset.act === 'full') openFull();
    });
    dlg.addEventListener('input', e => {
      const t = e.target;
      if (t.matches('[data-f]')) { data[t.dataset.f] = t.value; touched[t.dataset.f] = true; changed(true); }
      else if (t.matches('[data-custom]')) { data.color = t.value.toLowerCase(); changed(true); }
    });
    dlg.addEventListener('focusin', e => {     // pierwsze kliknięcie w przykładowy tekst zaznacza go, więc wystarczy zacząć pisać
      const t = e.target;
      if (t.matches && t.matches('[data-f]') && isSample(t.value)) t.select();
    });
    dlg.addEventListener('close', () => { save(); updateEntry(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // kliknięcie w tło
  }
  function say(text, bad) { if (!ui) return; ui.msg.textContent = text || ''; ui.msg.classList.toggle('is-bad', !!bad); }
  function syncUI(force) {
    if (!ui) return;
    dlg.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === data.color)));
    ui.color.value = data.color;
    dlg.querySelectorAll('[data-f]').forEach(i => {
      if ((force || document.activeElement !== i) && i.value !== data[i.dataset.f]) i.value = data[i.dataset.f];
      const c = dlg.querySelector(`[data-count="${i.dataset.f}"]`); if (c) c.textContent = `${data[i.dataset.f].length}/${L[i.dataset.f]}`;
    });
  }
  function changed(fromTyping) {
    save(); syncUI(false); say(''); schedulePreview(); renderEntryThumb();
    if (attach.enabled) scheduleAttach();
    if (!fromTyping) updateEntry();
  }
  function openEditor() {
    buildDialog(); say('');
    if (!dlg.open) dlg.showModal();
    syncUI(true); ensureFonts(); schedulePreview();
    const first = dlg.querySelector('[data-f="headline"]'); if (first && !(window.matchMedia && matchMedia('(pointer: coarse)').matches)) first.focus({ preventScroll: true });   // na telefonie bez wysuwania klawiatury od razu
  }
  function openFull() {
    const G = window.Druk24BannerGen; if (!G || !G.open) return;
    try {   // przenosimy kolor i treść do pełnego generatora
      const t = onColor(data.color), s = G.getState();
      G.setState({ ...s, layout: 'center', headline: data.headline, sub: data.sub, contact: data.contact, ctaOn: false, upper: true, bg: { ...s.bg, type: 'solid', c1: data.color }, custom: { text: t, accent: t }, tpl: '' });
    } catch (e) { /* otwieramy pełny generator bez przenoszenia */ }
    dlg.close(); G.open();
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
    if (grid.nextElementSibling !== entry) grid.after(entry);     // na wierzchu, tuż pod formularzem (pełny generator jest pod nim)
    renderEntryThumb(); updateEntry();
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(decorate); }
  new MutationObserver(ms => { if (ms.every(m => m.target.closest && m.target.closest('.d24bg-entry'))) return; schedule(); }).observe(content, { childList: true, subtree: true });
  const onForm = e => {
    const id = e.target && e.target.id;
    if (id === 'bannerWidth' || id === 'bannerHeight') { if (dlg && dlg.open) schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); else updateEntry(); }
  };
  content.addEventListener('input', onForm, true); content.addEventListener('change', onForm, true);
  new MutationObserver(() => {   // zmiana języka: odbudowa okna i panelu
    if (dlg) { if (dlg.open) dlg.close(); dlg.remove(); dlg = null; ui = null; }
    if (entry) { entry.remove(); entry = null; }
    ['headline', 'sub', 'contact'].forEach(k => { if (!touched[k]) data[k] = SAMPLES[isEn() ? 'en' : 'pl'][k]; });
    schedule();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.Druk24BannerSimple = {
    open: openEditor,
    getState: () => ({ ...data }),
    setState(s) { if (s && hexOk(s.color)) data.color = s.color.toLowerCase(); ['headline', 'sub', 'contact'].forEach(k => { if (s && typeof s[k] === 'string') { data[k] = s[k].slice(0, L[k]); touched[k] = true; } }); save(); if (ui) syncUI(true); schedulePreview(); renderEntryThumb(); if (attach.enabled) scheduleAttach(); },
    getAttachFiles() { return attach.enabled && attach.file && attach.sig === sigNow() ? [attach.file] : []; },
    isAttachEnabled: () => attach.enabled,
    setAttach,
    buildPdf,
    render: canvas => E.render(canvas, engineState(dims()), {}, {}),
    getProblem: problem
  };
  ensureFonts();
  schedule();
})();
