/* Drukulator 0.26.14v — generator banerów (edytor w przeglądarce).
 * Na stronie „Folie i banery 24h” dodaje panel z podglądem projektu i przycisk otwierający pełnoekranowy edytor:
 * szablony, układy, kolory, tło (kolor / gradient / zdjęcie), teksty z podpowiedziami, logo, kod QR, plakietka,
 * podgląd w skali z marginesem bezpiecznym i oczkami, kontrola czytelności, eksport JPG / PNG / PDF (rozmiar = wymiar banera).
 * Projekt powstaje lokalnie (canvas) — nic nie jest wysyłane. Do zamówienia trafia wyłącznie za zgodą klienta
 * (przełącznik „Dołącz projekt do zamówienia”) przez window.Druk24BannerGen.getAttachFiles() → app.js (quote.files).
 * Silnik rysowania: js/banner-gen-engine.js, QR: js/banner-gen-qr.js, PDF: js/banner-gen-pdf.js. */
(() => {
  'use strict';
  const E = window.Druk24BannerEngine;
  const content = document.getElementById('content');
  if (!E || !content) return;
  const isEn = () => document.documentElement.lang === 'en';
  const tr = (pl, en) => isEn() ? en : pl;
  const nm = o => o[isEn() ? 'en' : 'pl'];
  const L = E.LIMITS;
  const STORE_KEY = 'drukulator.bannerGen.v1';
  const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
  const SIZE_PRESETS = [[100, 100], [200, 100], [300, 100], [300, 150], [500, 100], [100, 200], [150, 50], [1000, 100]];
  const fmtNum = (n, d = 1) => new Intl.NumberFormat(isEn() ? 'en-US' : 'pl-PL', { maximumFractionDigits: d }).format(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; };

  // ---------- stan ----------
  const assets = {};            // id → HTMLImageElement
  const assetData = {};         // id → data URL (do zapisu projektu)
  let assetSeq = 0;
  let textTouched = false;      // musi być przed loadSaved(), która może go ustawić
  let st = loadSaved();
  let history = [], hi = -1, commitTimer = 0;
  let tab = 'tpl', tplCat = 'all', suggCat = 'promo', useTplTexts = true;
  let zoom = 1, exportFmt = 'pdf', exportPx = 4000, resetArmed = 0;
  const attach = { enabled: false, file: null, sig: '', busy: false, error: '', token: 0, scale: 1 };
  let dlg = null, ui = null, entry = null, curCard = null;
  let previewQueued = false, thumbsQueued = false, thumbsDirty = { tpl: true, look: true };
  let lastReport = null;

  function loadSaved() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && raw.state) { textTouched = !!raw.touched; const s = E.normalizeState(raw.state); s.logo.id = ''; s.bg.photo = ''; if (s.bg.type === 'photo') s.bg.type = 'gradient'; return s; }
    } catch (e) { /* brak dostępu do pamięci przeglądarki */ }
    return E.defaultState();
  }
  function autosave() {
    try {
      const s = JSON.parse(JSON.stringify(st)); s.logo.id = ''; s.bg.photo = ''; if (s.bg.type === 'photo') s.bg.type = 'gradient';
      localStorage.setItem(STORE_KEY, JSON.stringify({ state: s, touched: textTouched }));
    } catch (e) { /* ignoruj */ }
  }
  const sigNow = () => JSON.stringify(st);

  // ---------- historia ----------
  function commit() {
    clearTimeout(commitTimer); commitTimer = 0;
    const snap = sigNow();
    if (snap === history[hi]) return;
    history = history.slice(0, hi + 1); history.push(snap); if (history.length > 80) history.shift();
    hi = history.length - 1; autosave(); updateHistoryButtons();
  }
  function commitSoon() { clearTimeout(commitTimer); commitTimer = setTimeout(commit, 450); }
  function restore(index) {
    if (index < 0 || index >= history.length) return;
    clearTimeout(commitTimer); hi = index; st = E.normalizeState(JSON.parse(history[hi]));
    syncUI(true); afterChange(); updateHistoryButtons();
  }
  function updateHistoryButtons() {
    if (!ui) return;
    ui.undo.disabled = hi <= 0; ui.redo.disabled = hi >= history.length - 1;
  }

  // ---------- czcionki ----------
  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    ['800 40px Montserrat', '600 40px Montserrat'].forEach(f => document.fonts.load(f).then(() => { schedulePreview(); scheduleThumbs(); renderEntryThumb(); }).catch(() => {}));
  }

  // ---------- reguły materiału (takie jak w calculators.js → calculateBanner) ----------
  const materialName = () => (formEl('bannerMaterial') && formEl('bannerMaterial').value) || '';
  const hasEyelets = () => /^Baner/i.test(materialName());
  function sizeIssues() {
    const m = materialName(), sh = Math.min(st.widthCm, st.heightCm), lg = Math.max(st.widthCm, st.heightCm), out = [];
    const maxShort = /laminat/i.test(m) ? 135 : 160;
    if (sh > maxShort) out.push({ id: 'size-max', level: 'bad', v: maxShort });
    if (!/^Folia\b/i.test(m) && sh < 30) out.push({ id: 'size-min', level: 'bad' });
    if (lg > 1000) out.push({ id: 'size-long', level: 'bad' });
    return out;
  }

  // ---------- rozmiar z formularza ----------
  const formEl = id => document.getElementById(id);
  function syncFromForm() {
    const w = Number(formEl('bannerWidth')?.value), h = Number(formEl('bannerHeight')?.value);
    let changed = false;
    if (Number.isFinite(w) && w > 0) { const v = Math.min(1000, Math.max(10, w)); if (v !== st.widthCm) { st.widthCm = v; changed = true; } }
    if (Number.isFinite(h) && h > 0) { const v = Math.min(1000, Math.max(10, h)); if (v !== st.heightCm) { st.heightCm = v; changed = true; } }
    if (changed) { thumbsDirty = { tpl: true, look: true }; afterChange({ keepFields: true }); }
    return changed;
  }
  function pushSizeToForm() {
    [['bannerWidth', st.widthCm], ['bannerHeight', st.heightCm]].forEach(([id, v]) => {
      const el = formEl(id);
      if (el && Number(el.value) !== v) { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  }

  // ---------- obrazy ----------
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; });
  const readDataUrl = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('read')); r.readAsDataURL(file); });
  async function loadImageFile(file, kind) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error(tr('Plik jest za duży (maks. 25 MB).', 'File is too large (max 25 MB).'));
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const okExt = kind === 'logo' ? ['png', 'jpg', 'jpeg', 'webp', 'svg'] : ['png', 'jpg', 'jpeg', 'webp'];
    if (!okExt.includes(ext)) throw new Error(tr('Dozwolone formaty: ', 'Allowed formats: ') + okExt.join(', ').toUpperCase());
    if (ext === 'svg') { const dataUrl = await readDataUrl(file); const img = await loadImg(dataUrl); return { img, dataUrl }; }
    const url = URL.createObjectURL(file);
    try {
      const src = await loadImg(url), max = kind === 'logo' ? 2000 : 3200, k = Math.min(1, max / Math.max(src.naturalWidth, src.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(src.naturalWidth * k)); c.height = Math.max(1, Math.round(src.naturalHeight * k));
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL(kind === 'logo' ? 'image/png' : 'image/jpeg', 0.9);
      return { img: await loadImg(dataUrl), dataUrl };
    } finally { URL.revokeObjectURL(url); }
  }
  function registerAsset(img, dataUrl) { const id = 'a' + (++assetSeq); assets[id] = img; assetData[id] = dataUrl; return id; }
  async function handleImage(file, kind) {
    try {
      say(tr('Wczytuję plik…', 'Loading file…'));
      const { img, dataUrl } = await loadImageFile(file, kind);
      const id = registerAsset(img, dataUrl);
      if (kind === 'logo') st.logo.id = id; else { st.bg.photo = id; st.bg.type = 'photo'; }
      say(''); syncUI(true); afterChange({ commitNow: true }); updateTabFlags();
    } catch (e) { say(e.message || tr('Nie udało się wczytać pliku.', 'Could not load the file.'), true); }
  }

  // ---------- eksport ----------
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/gi, 'l').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);
  function exportDims(longPx) {
    const ratio = st.widthCm / st.heightCm, mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), maxArea = mobile ? 16e6 : 30e6;
    let w = ratio >= 1 ? longPx : longPx * ratio, h = ratio >= 1 ? longPx / ratio : longPx;
    if (w * h > maxArea) { const k = Math.sqrt(maxArea / (w * h)); w *= k; h *= k; }
    return { w: Math.max(64, Math.round(w)), h: Math.max(64, Math.round(h)) };
  }
  async function exportBlob(fmt, longPx) {
    const { w, h } = exportDims(longPx);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    E.render(c, st, assets, {});
    const toBlob = (type, q) => new Promise(res => c.toBlob(res, type, q));
    const base = `baner-${fmtNum(st.widthCm, 1).replace(/\s/g, '').replace(',', '.')}x${fmtNum(st.heightCm, 1).replace(/\s/g, '').replace(',', '.')}cm${slug(st.headline) ? '-' + slug(st.headline) : ''}`;
    if (fmt === 'png') { const b = await toBlob('image/png'); if (!b) throw new Error('png'); return { blob: b, name: base + '.png', w, h, scale: 1 }; }
    const jpg = await toBlob('image/jpeg', 0.92); if (!jpg) throw new Error('jpg');
    if (fmt === 'jpg') return { blob: jpg, name: base + '.jpg', w, h, scale: 1 };
    const bytes = new Uint8Array(await jpg.arrayBuffer());
    const pdf = window.Druk24PDF.fromJpeg({ jpeg: bytes, wPx: w, hPx: h, wCm: st.widthCm, hCm: st.heightCm, title: st.headline || 'Baner' });
    return { blob: new Blob([pdf.bytes], { type: 'application/pdf' }), name: base + '.pdf', w, h, scale: pdf.scale };
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 15000);
  }
  async function doDownload() {
    const btn = ui.dl; btn.disabled = true; say(tr('Generuję plik…', 'Rendering…'));
    try {
      await new Promise(r => setTimeout(r, 30));
      const out = await exportBlob(exportFmt, exportPx);
      download(out.blob, out.name);
      say(tr(`Pobrano: ${out.name} (${fmtNum(out.blob.size / 1048576, 1)} MB)`, `Downloaded: ${out.name} (${fmtNum(out.blob.size / 1048576, 1)} MB)`) + (out.scale > 1 ? tr(` — PDF w skali 1:${out.scale}`, ` — PDF at 1:${out.scale} scale`) : ''));
    } catch (e) { say(tr('Nie udało się wygenerować pliku — wybierz niższą jakość.', 'Could not render the file — choose a lower quality.'), true); }
    btn.disabled = false;
  }

  // ---------- załącznik do zamówienia ----------
  let attachTimer = 0;
  function scheduleAttach() { if (!attach.enabled) return; clearTimeout(attachTimer); attachTimer = setTimeout(buildAttach, 700); updateEntry(); }
  async function buildAttach() {
    if (!attach.enabled) return;
    const token = ++attach.token, sig = sigNow();
    attach.busy = true; attach.error = ''; updateEntry();
    try {
      await new Promise(r => setTimeout(r, 20));
      const out = await exportBlob('pdf', 4000);
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
    attach.enabled = !!on;
    if (!on) { clearTimeout(attachTimer); attach.token++; attach.busy = false; attach.error = ''; updateEntry(); return; }
    buildAttach();
  }

  // ---------- jakość: komunikaty ----------
  const ISSUE = {
    'no-head': () => tr('Dodaj nagłówek — to on przyciąga wzrok z daleka.', 'Add a headline — it catches the eye from afar.'),
    overflow: () => tr('Tekst jest bardzo długi i został mocno zmniejszony — skróć go, aby był czytelny z daleka.', 'The text is long and had to be shrunk a lot — shorten it to stay readable from afar.'),
    contrast: () => tr('Słaby kontrast tekstu z tłem — zmień kolory, przyciemnij zdjęcie lub włącz cień tekstu.', 'Low text contrast — change colours, darken the photo or enable text shadow.'),
    'qr-small': r => tr(`Kod QR ma tylko ${fmtNum(r.v, 1)} cm — zeskanujesz go z ok. ${fmtNum(Math.max(0.2, r.v / 10), 1)} m. Powiększ go (Dodatki → Kod QR).`, `The QR code is only ${fmtNum(r.v, 1)} cm — scannable from about ${fmtNum(Math.max(0.2, r.v / 10), 1)} m. Make it bigger (Extras → QR code).`),
    'qr-ok': r => tr(`Kod QR ma ${fmtNum(r.v, 1)} cm — zeskanujesz go z ok. ${fmtNum(r.v / 10, 1)} m. Przetestuj go telefonem przed zamówieniem.`, `The QR code is ${fmtNum(r.v, 1)} cm — scannable from about ${fmtNum(r.v / 10, 1)} m. Test it with a phone before ordering.`),
    'qr-fail': () => tr('Nie udało się utworzyć kodu QR — tekst jest za długi.', 'Could not create the QR code — the text is too long.'),
    'photo-dpi': r => tr(`Zdjęcie w tle ma ok. ${r.v} dpi przy tym rozmiarze — może być nieostre. Wybierz większy plik.`, `The background photo is about ${r.v} dpi at this size — it may look soft. Choose a larger file.`),
    'logo-dpi': r => tr(`Logo ma ok. ${r.v} dpi przy tym rozmiarze — może być nieostre. Wgraj większy plik lub SVG.`, `The logo is about ${r.v} dpi at this size — it may look soft. Upload a larger file or an SVG.`),
    'size-max': r => tr(`Ten materiał ma limit ${r.v} cm dla krótszego boku — kalkulator nie wyceni takiego rozmiaru (w sprawie większych skontaktuj się z drukarnią).`, `This material is limited to ${r.v} cm on the shorter side — the calculator cannot price this size (contact the print shop for bigger jobs).`),
    'size-min': () => tr('Minimalny krótszy bok banera to 30 cm.', 'The minimum shorter side of a banner is 30 cm.'),
    'size-long': () => tr('Maksymalny dłuższy bok to 10 m.', 'The maximum longer side is 10 m.'),
    'need-photo': () => tr('Wybrano tło ze zdjęciem — wgraj zdjęcie (Wygląd → Tło).', 'Photo background selected — upload a photo (Look → Background).')
  };
  const RATING = { great: ['świetna', 'great'], good: ['dobra', 'good'], weak: ['słaba', 'weak'], bad: ['zła', 'poor'] };

  // ---------- znaczniki ----------
  const range = (path, label, min, max, step, fmt) => `<label class="d24bg-row"><span>${label}</span><input type="range" data-bind="${path}" min="${min}" max="${max}" step="${step}"><output data-out="${path}" data-fmt="${fmt || ''}"></output></label>`;
  const seg = (path, items, cls = '') => `<div class="d24bg-seg ${cls}" role="group">${items.map(([v, l]) => `<button type="button" data-set="${path}" data-val="${v}" aria-pressed="false">${l}</button>`).join('')}</div>`;
  const check = (path, label) => `<label class="d24bg-check"><input type="checkbox" data-bind="${path}"><span>${label}</span></label>`;
  const anchors = path => `<div class="d24bg-anchors" role="group" aria-label="${tr('Pozycja', 'Position')}">${[['tl', '↖'], ['tc', '↑'], ['tr', '↗'], ['bl', '↙'], ['bc', '↓'], ['br', '↘']].map(([v, a]) => `<button type="button" data-set="${path}" data-val="${v}" aria-pressed="false" title="${v}">${a}</button>`).join('')}</div>`;
  const color = (path, label, clear) => `<label class="d24bg-color"><span>${label}</span><input type="color" data-bind="${path}" data-type="color">${clear ? `<button type="button" class="d24bg-mini" data-act="clear-color" data-k="${path}" title="${tr('Przywróć kolor z palety', 'Reset to palette colour')}">↺</button>` : ''}</label>`;

  function dialogMarkup() {
    const tabs = [['tpl', tr('Szablony', 'Templates')], ['text', tr('Treść', 'Text')], ['look', tr('Wygląd', 'Look')], ['extra', tr('Dodatki', 'Extras')], ['export', tr('Eksport', 'Export')]];
    return `<div class="d24bg" data-d24bg>
    <header class="d24bg-top">
      <div class="d24bg-top__title"><strong>${tr('Generator banera', 'Banner generator')}</strong><span data-mat></span></div>
      <div class="d24bg-size">
        <label><span class="d24bg-lbl">${tr('Wymiary', 'Size')}</span><span class="d24bg-size__inputs"><input type="number" data-size="w" min="10" max="1000" step="1" aria-label="${tr('Szerokość w cm', 'Width in cm')}"> × <input type="number" data-size="h" min="10" max="1000" step="1" aria-label="${tr('Wysokość w cm', 'Height in cm')}"> cm</span></label>
        <button type="button" class="d24bg-icon" data-act="swap" title="${tr('Zamień szerokość z wysokością', 'Swap width and height')}" aria-label="${tr('Zamień wymiary', 'Swap size')}">⇄</button>
        <select data-act="preset" aria-label="${tr('Popularne rozmiary', 'Common sizes')}"><option value="">${tr('Popularne rozmiary…', 'Common sizes…')}</option>${SIZE_PRESETS.map(([w, h]) => `<option value="${w}x${h}">${w} × ${h} cm</option>`).join('')}</select>
      </div>
      <div class="d24bg-top__tools">
        <button type="button" class="d24bg-icon" data-act="undo" title="${tr('Cofnij (Ctrl+Z)', 'Undo (Ctrl+Z)')}" aria-label="${tr('Cofnij', 'Undo')}">↶</button>
        <button type="button" class="d24bg-icon" data-act="redo" title="${tr('Ponów (Ctrl+Y)', 'Redo (Ctrl+Y)')}" aria-label="${tr('Ponów', 'Redo')}">↷</button>
        <button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="reset">${tr('Wyczyść projekt', 'Reset design')}</button>
      </div>
      <div class="d24bg-top__end">
        <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="use" aria-label="${tr('Użyj w zamówieniu', 'Use in order')}"><span class="d24bg-long">${tr('Użyj w zamówieniu', 'Use in order')}</span><span class="d24bg-short">${tr('Do zamówienia', 'To order')}</span></button>
        <button type="button" class="d24bg-icon d24bg-close" data-act="close" aria-label="${tr('Zamknij generator', 'Close generator')}" title="${tr('Zamknij', 'Close')}">✕</button>
      </div>
    </header>
    <div class="d24bg-main">
      <section class="d24bg-left">
      <div class="d24bg-stagewrap" aria-label="${tr('Podgląd banera', 'Banner preview')}">
        <div class="d24bg-stage" data-stage><div class="d24bg-cwrap"><canvas data-canvas role="img" aria-label="${tr('Podgląd projektu banera', 'Banner design preview')}"></canvas></div></div>
        <div class="d24bg-stagebar">
          <label class="d24bg-check"><input type="checkbox" data-guides checked><span data-guidelabel>${tr('Margines bezpieczny i oczka', 'Safe margin and eyelets')}</span></label>
          <label class="d24bg-zoom">${tr('Powiększenie', 'Zoom')}<select data-zoom><option value="1">${tr('Dopasuj', 'Fit')}</option><option value="2">200%</option><option value="4">400%</option></select></label>
          <span class="d24bg-msg" data-msg role="status" aria-live="polite"></span>
        </div>
        <div class="d24bg-chips" data-chips></div>
      </div>
      <ul class="d24bg-quality" data-quality></ul>
      </section>
      <aside class="d24bg-side">
        <div class="d24bg-tabs" role="tablist" aria-label="${tr('Sekcje edytora', 'Editor sections')}">${tabs.map(([id, l]) => `<button type="button" role="tab" id="d24bg-tab-${id}" aria-controls="d24bg-panel-${id}" data-tab="${id}" aria-selected="false">${l}<i class="d24bg-dot" hidden></i></button>`).join('')}</div>
        <div class="d24bg-panels">
          <div class="d24bg-panel" role="tabpanel" id="d24bg-panel-tpl" aria-labelledby="d24bg-tab-tpl" data-panel="tpl">${tplPanel()}</div>
          <div class="d24bg-panel" role="tabpanel" id="d24bg-panel-text" aria-labelledby="d24bg-tab-text" data-panel="text" hidden>${textPanel()}</div>
          <div class="d24bg-panel" role="tabpanel" id="d24bg-panel-look" aria-labelledby="d24bg-tab-look" data-panel="look" hidden>${lookPanel()}</div>
          <div class="d24bg-panel" role="tabpanel" id="d24bg-panel-extra" aria-labelledby="d24bg-tab-extra" data-panel="extra" hidden>${extraPanel()}</div>
          <div class="d24bg-panel" role="tabpanel" id="d24bg-panel-export" aria-labelledby="d24bg-tab-export" data-panel="export" hidden>${exportPanel()}</div>
        </div>
      </aside>
    </div>
    <input type="file" hidden data-file="photo" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
    <input type="file" hidden data-file="logo" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml">
    <input type="file" hidden data-file="project" accept=".json,application/json">
    </div>`;
  }

  function tplPanel() {
    return `<p class="d24bg-hint">${tr('Wybierz gotowy projekt i dopasuj go do siebie. Miniatury pokazują baner w Twoich proporcjach.', 'Pick a ready design and make it yours. Thumbnails use your banner proportions.')}</p>
    <div class="d24bg-chiprow" data-cats>${E.TEMPLATE_CATS.map(c => `<button type="button" class="d24bg-chipbtn" data-act="cat" data-id="${c.id}" aria-pressed="false">${nm(c.name)}</button>`).join('')}</div>
    <label class="d24bg-check"><input type="checkbox" data-tpltexts checked><span>${tr('Wstaw też przykładowe teksty z szablonu', 'Also insert the template sample text')}</span></label>
    <div class="d24bg-tplgrid" data-tplgrid>${E.TEMPLATES.map(t => `<button type="button" class="d24bg-tpl" data-act="tpl" data-id="${t.id}" data-cat="${t.cat}" aria-label="${esc(t.head)}"><canvas></canvas><span>${esc(t.head)}</span></button>`).join('')}</div>
    <button type="button" class="d24bg-btn" data-act="random">🎲 ${tr('Losowa inspiracja', 'Random inspiration')}</button>`;
  }

  function textPanel() {
    return `<div class="d24bg-field"><label for="d24bg-head">${tr('Nagłówek', 'Headline')} <small data-count="headline"></small></label>
      <textarea id="d24bg-head" rows="2" data-bind="headline" maxlength="${L.headline}" placeholder="${tr('np. WIELKIE OTWARCIE', 'e.g. GRAND OPENING')}"></textarea></div>
    <div class="d24bg-field"><label for="d24bg-sub">${tr('Opis / hasło', 'Subheading')} <small data-count="sub"></small></label>
      <textarea id="d24bg-sub" rows="2" data-bind="sub" maxlength="${L.sub}" placeholder="${tr('np. Sobota od 10:00, atrakcje i rabaty', 'e.g. Saturday from 10:00, offers and discounts')}"></textarea></div>
    <div class="d24bg-field"><label for="d24bg-contact">${tr('Kontakt / adres', 'Contact / address')} <small data-count="contact"></small></label>
      <input id="d24bg-contact" type="text" data-bind="contact" maxlength="${L.contact}" placeholder="${tr('tel. 500 600 700 • www.twojafirma.pl', 'tel. 500 600 700 • www.yourcompany.com')}"></div>
    <div class="d24bg-field"><label for="d24bg-cta">${tr('Przycisk', 'Button')} <small data-count="cta"></small></label>
      <div class="d24bg-inline">${check('ctaOn', tr('Pokaż', 'Show'))}<input id="d24bg-cta" type="text" data-bind="cta" maxlength="${L.cta}" placeholder="${tr('np. Zadzwoń teraz', 'e.g. Call now')}"></div></div>
    ${check('upper', tr('Nagłówek i przycisk wielkimi literami', 'Uppercase headline and button'))}
    <h4>${tr('Podpowiedzi tekstów', 'Text ideas')}</h4>
    <select data-sugg aria-label="${tr('Rodzaj ogłoszenia', 'Announcement type')}">${E.SUGGEST.map(s => `<option value="${s.id}">${nm(s.name)}</option>`).join('')}</select>
    <div data-suggbox class="d24bg-sugg"></div>
    <p class="d24bg-hint">${tr('Podpowiedzi to gotowe, uniwersalne hasła — zawsze sprawdź pisownię, ceny, daty i dane kontaktowe.', 'These are ready, generic phrases — always check spelling, prices, dates and contact details.')}</p>`;
  }

  function lookPanel() {
    return `<h4>${tr('Układ', 'Layout')}</h4>
    <div class="d24bg-laygrid" data-laygrid>${E.LAYOUTS.map(l => `<button type="button" data-act="layout" data-id="${l.id}" aria-pressed="false" aria-label="${nm(l.name)}"><canvas></canvas><span>${nm(l.name)}</span></button>`).join('')}</div>
    <h4>${tr('Kolory', 'Colours')}</h4>
    <div class="d24bg-pals" data-pals>${E.PALETTES.map(p => `<button type="button" data-act="palette" data-id="${p.id}" aria-pressed="false" title="${nm(p.name)}" aria-label="${nm(p.name)}" style="background:linear-gradient(135deg,${p.bg1} 0 52%,${p.bg2} 52% 100%)"><i style="background:${p.accent}"></i><b style="color:${p.text}">A</b></button>`).join('')}</div>
    <div class="d24bg-colors">${color('custom.text', tr('Kolor tekstu', 'Text colour'), true)}${color('custom.accent', tr('Kolor akcentu', 'Accent colour'), true)}</div>
    <h4>${tr('Tło', 'Background')}</h4>
    ${seg('bg.type', [['solid', tr('Kolor', 'Solid')], ['gradient', tr('Gradient', 'Gradient')], ['photo', tr('Zdjęcie', 'Photo')]])}
    <div class="d24bg-colors" data-showif="bg.type=solid,gradient">${color('bg.c1', tr('Kolor 1', 'Colour 1'), true)}<span data-showif="bg.type=gradient">${color('bg.c2', tr('Kolor 2', 'Colour 2'), true)}</span></div>
    <div data-showif="bg.type=gradient">${range('bg.angle', tr('Kierunek', 'Angle'), 0, 360, 5, 'deg')}</div>
    <div data-showif="bg.type=photo" class="d24bg-group">
      <div class="d24bg-inline"><button type="button" class="d24bg-btn" data-act="pick-photo">${tr('Wgraj zdjęcie…', 'Upload photo…')}</button><button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="remove-photo" data-showif="bg.photo!=">${tr('Usuń', 'Remove')}</button></div>
      <p class="d24bg-hint">${tr('JPG, PNG lub WebP do 25 MB. Im większe zdjęcie, tym ostrzejszy baner.', 'JPG, PNG or WebP up to 25 MB. The larger the photo, the sharper the banner.')}</p>
      ${range('bg.dim', tr('Przyciemnienie', 'Dimming'), 0, 85, 5, 'pct')}${range('bg.zoom', tr('Powiększenie', 'Zoom'), 100, 300, 5, 'pct')}${range('bg.px', tr('Położenie ←→', 'Position ←→'), 0, 100, 1, 'pct')}${range('bg.py', tr('Położenie ↑↓', 'Position ↑↓'), 0, 100, 1, 'pct')}
    </div>
    <label class="d24bg-row d24bg-row--sel"><span>${tr('Wzór tła', 'Pattern')}</span><select data-bind="bg.pattern">${E.PATTERNS.map(p => `<option value="${p.id}">${nm(p.name)}</option>`).join('')}</select></label>
    <h4>${tr('Czcionka', 'Font')}</h4>
    <div class="d24bg-fonts">${Object.keys(E.FONTS).map(k => `<button type="button" data-set="font" data-val="${k}" aria-pressed="false" style="font-family:${E.FONTS[k].head[0]};font-weight:${E.FONTS[k].head[1]}">${nm(E.FONTS[k].name)}<small>Aa</small></button>`).join('')}</div>
    <h4>${tr('Tekst', 'Text')}</h4>
    ${range('headScale', tr('Rozmiar nagłówka', 'Headline size'), 40, 100, 1, 'pct')}${range('subScale', tr('Rozmiar opisu', 'Subheading size'), 40, 100, 1, 'pct')}${range('contactScale', tr('Rozmiar kontaktu', 'Contact size'), 40, 100, 1, 'pct')}${range('spacing', tr('Odstęp liter', 'Letter spacing'), -3, 12, 1, '')}
    <div class="d24bg-field"><label>${tr('Wyrównanie', 'Alignment')}</label>${seg('align', [['auto', tr('Auto', 'Auto')], ['left', tr('Lewo', 'Left')], ['center', tr('Środek', 'Centre')], ['right', tr('Prawo', 'Right')]])}</div>
    <div class="d24bg-inline">${check('shadow', tr('Cień tekstu', 'Text shadow'))}${check('outline', tr('Obrys nagłówka', 'Headline outline'))}</div>`;
  }

  function extraPanel() {
    return `<h4>${tr('Logo', 'Logo')}</h4>
    <div class="d24bg-inline"><button type="button" class="d24bg-btn" data-act="pick-logo">${tr('Wgraj logo…', 'Upload logo…')}</button><button type="button" class="d24bg-btn d24bg-btn--ghost" data-act="remove-logo" data-showif="logo.id!=">${tr('Usuń', 'Remove')}</button></div>
    <p class="d24bg-hint">${tr('PNG (najlepiej z przezroczystością), JPG, WebP lub SVG. Wektor (SVG) da najostrzejszy wydruk.', 'PNG (ideally transparent), JPG, WebP or SVG. A vector (SVG) gives the sharpest print.')}</p>
    <div data-showif="logo.id!=" class="d24bg-group">${anchors('logo.anchor')}${range('logo.size', tr('Rozmiar logo', 'Logo size'), 8, 60, 1, 'pct')}${check('logo.plate', tr('Białe tło pod logo', 'White plate behind logo'))}</div>
    <h4>${tr('Kod QR', 'QR code')}</h4>
    ${check('qr.on', tr('Dodaj kod QR', 'Add a QR code'))}
    <div data-showif="qr.on=true" class="d24bg-group">
      <div class="d24bg-field"><label for="d24bg-qr">${tr('Adres www lub tekst', 'Web address or text')} <small data-count="qr.text"></small></label><input id="d24bg-qr" type="text" data-bind="qr.text" maxlength="${L.qr}" placeholder="https://twojafirma.pl" inputmode="url" autocapitalize="off" spellcheck="false"></div>
      ${anchors('qr.anchor')}${range('qr.size', tr('Rozmiar kodu', 'Code size'), 8, 45, 1, 'pct')}
      <p class="d24bg-hint" data-qrinfo></p>
    </div>
    <h4>${tr('Plakietka', 'Badge')}</h4>
    ${check('badge.on', tr('Dodaj plakietkę (np. „-30%”)', 'Add a badge (e.g. “-30%”)'))}
    <div data-showif="badge.on=true" class="d24bg-group">
      <div class="d24bg-field"><label for="d24bg-badge">${tr('Tekst plakietki', 'Badge text')} <small data-count="badge.text"></small></label><input id="d24bg-badge" type="text" data-bind="badge.text" maxlength="${L.badge}" placeholder="-30%"></div>
      ${seg('badge.shape', [['burst', tr('Gwiazda', 'Burst')], ['circle', tr('Koło', 'Circle')], ['ribbon', tr('Etykieta', 'Label')]])}
      ${anchors('badge.anchor')}${range('badge.size', tr('Rozmiar', 'Size'), 12, 60, 1, 'pct')}${check('badge.tilt', tr('Lekko pochylona', 'Slight tilt'))}
    </div>
    <h4>${tr('Ramka', 'Frame')}</h4>
    ${check('frame', tr('Dodaj ramkę wokół projektu', 'Add a frame around the design'))}`;
  }

  function exportPanel() {
    return `<h4>${tr('Pobierz projekt', 'Download design')}</h4>
    <div class="d24bg-seg d24bg-seg--fmt" role="group">${['pdf', 'jpg', 'png'].map(f => `<button type="button" data-exportfmt="${f}" aria-pressed="false">${f.toUpperCase()}</button>`).join('')}</div>
    <div class="d24bg-field"><label>${tr('Rozdzielczość', 'Resolution')}</label><div class="d24bg-seg" role="group">${[[2500, tr('Standard', 'Standard')], [4000, tr('Wysoka', 'High')], [6000, tr('Maksymalna', 'Maximum')]].map(([v, l]) => `<button type="button" data-exportpx="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>
    <p class="d24bg-hint" data-exportinfo></p>
    <button type="button" class="d24bg-btn d24bg-btn--primary d24bg-btn--wide" data-act="download" data-dl>${tr('Pobierz plik', 'Download file')}</button>
    <p class="d24bg-hint">${tr('Plik ma dokładnie proporcje Twojego banera. PDF ma wymiar strony równy rozmiarowi banera (dla banerów powyżej ok. 5 m — w skali, z adnotacją w pliku).', 'The file has exactly your banner proportions. The PDF page equals the banner size (for banners above ~5 m it is scaled, noted inside the file).')}</p>
    <h4>${tr('Zamówienie', 'Order')}</h4>
    <p class="d24bg-hint">${tr('„Użyj w zamówieniu” zapisuje projekt jako PDF i dołącza go do wyceny — trafi do koszyka razem z banerem. Możesz to wyłączyć w panelu pod formularzem.', '“Use in order” saves the design as a PDF and attaches it to the quote — it goes to the cart with your banner. You can turn this off in the panel under the form.')}</p>
    <h4>${tr('Zapis projektu', 'Project file')}</h4>
    <div class="d24bg-inline"><button type="button" class="d24bg-btn d24bg-btn--ghost d24bg-reset2" data-act="reset">${tr('Wyczyść projekt', 'Reset design')}</button></div>
    <div class="d24bg-inline"><button type="button" class="d24bg-btn" data-act="save">${tr('Zapisz projekt (.json)', 'Save project (.json)')}</button><button type="button" class="d24bg-btn" data-act="load">${tr('Wczytaj projekt…', 'Load project…')}</button></div>
    <p class="d24bg-hint">${tr('Projekt możesz zapisać i wrócić do niego później. Ostatnie ustawienia (bez zdjęć i logo) zapamiętujemy w tej przeglądarce.', 'Save the project to continue later. Your latest settings (without photos and logo) are remembered in this browser.')}</p>`;
  }

  // ---------- budowa okna ----------
  function buildDialog() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'd24bg-dialog';
    dlg.setAttribute('aria-label', tr('Generator banera', 'Banner generator'));
    dlg.innerHTML = dialogMarkup();
    document.body.appendChild(dlg);
    const q = s => dlg.querySelector(s);
    ui = {
      root: q('[data-d24bg]'), stage: q('[data-stage]'), canvas: q('[data-canvas]'), chips: q('[data-chips]'), quality: q('[data-quality]'),
      msg: q('[data-msg]'), undo: q('[data-act="undo"]'), redo: q('[data-act="redo"]'), dl: q('[data-dl]'), guides: q('[data-guides]'),
      zoom: q('[data-zoom]'), mat: q('[data-mat]'), sizeW: q('[data-size="w"]'), sizeH: q('[data-size="h"]'), sugg: q('[data-sugg]'), suggbox: q('[data-suggbox]'),
      tplgrid: q('[data-tplgrid]'), laygrid: q('[data-laygrid]'), tpltexts: q('[data-tpltexts]'), qrinfo: q('[data-qrinfo]'), exportinfo: q('[data-exportinfo]')
    };
    dlg.addEventListener('input', onInput);
    dlg.addEventListener('change', onChange);
    dlg.addEventListener('click', onClick);
    dlg.addEventListener('close', onClosed);
    dlg.addEventListener('keydown', onKey);
    dlg.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
    dlg.addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f && /\.(png|jpe?g|webp|svg)$/i.test(f.name)) { e.preventDefault(); handleImage(f, tab === 'extra' ? 'logo' : 'photo'); } });
    new ResizeObserver(() => schedulePreview()).observe(ui.stage);
    ui.sugg.value = suggCat;
    renderSuggestions();
    history = [sigNow()]; hi = 0;
    syncUI(true); setTab(tab); updateHistoryButtons();
  }

  // ---------- zdarzenia ----------
  function onInput(e) {
    const el = e.target;
    if (el.dataset.size) { sizeFromInput(el, false); return; }
    if (el.matches('[data-guides]')) { schedulePreview(); return; }
    if (el.matches('[data-bind]')) bindChanged(el, false);
  }
  function onChange(e) {
    const el = e.target;
    if (el.dataset.size) { sizeFromInput(el, true); return; }
    if (el.matches('[data-zoom]')) { zoom = Number(el.value) || 1; schedulePreview(); return; }
    if (el.matches('[data-tpltexts]')) { useTplTexts = el.checked; thumbsDirty.tpl = true; scheduleThumbs(); return; }
    if (el.matches('[data-sugg]')) { suggCat = el.value; renderSuggestions(); return; }
    if (el.matches('[data-act="preset"]')) { const m = String(el.value).match(/^(\d+)x(\d+)$/); if (m) { st.widthCm = +m[1]; st.heightCm = +m[2]; pushSizeToForm(); thumbsDirty = { tpl: true, look: true }; afterChange({ commitNow: true }); syncUI(true); } el.value = ''; return; }
    if (el.dataset.file) { const f = el.files && el.files[0]; el.value = ''; if (!f) return; if (el.dataset.file === 'project') loadProject(f); else handleImage(f, el.dataset.file); return; }
    if (el.matches('[data-bind]')) bindChanged(el, true);
  }
  function bindChanged(el, commitNow) {
    const path = el.dataset.bind;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'range' || el.type === 'number') v = Number(el.value);
    else v = el.value;
    setPath(st, path, v);
    if (/^(headline|sub|contact|cta)$/.test(path)) textTouched = true;
    if (path === 'bg.c1' || path === 'bg.c2') { /* kolor tła ustawiony ręcznie */ }
    if (path === 'bg.type' || path === 'qr.on' || path === 'badge.on' || path === 'bg.pattern') thumbsDirty = { tpl: true, look: true };
    afterChange({ commitNow });
  }
  function sizeFromInput(el, final) {
    const v = Number(el.value);
    if (!Number.isFinite(v)) return;
    if (!final && (v < 10 || v > 1000)) return;
    const k = el.dataset.size === 'w' ? 'widthCm' : 'heightCm';
    st[k] = Math.min(1000, Math.max(10, v));
    if (final) el.value = String(st[k]);
    pushSizeToForm(); thumbsDirty = { tpl: true, look: true };
    afterChange({ commitNow: final, keepFields: true });
  }
  function onClick(e) {
    const t = e.target.closest('button,[data-tab]'); if (!t || !dlg.contains(t)) return;
    if (t.dataset.tab) { setTab(t.dataset.tab); return; }
    if (t.dataset.set) { const path = t.dataset.set; let v = t.dataset.val; if (v === 'true') v = true; if (v === 'false') v = false; setPath(st, path, v); if (path === 'bg.type' || path === 'font') thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true }); return; }
    if (t.dataset.exportfmt) { exportFmt = t.dataset.exportfmt; syncUI(true); return; }
    if (t.dataset.exportpx) { exportPx = Number(t.dataset.exportpx); syncUI(true); return; }
    const act = t.dataset.act; if (!act) return;
    switch (act) {
      case 'close': dlg.close(); break;
      case 'use': useInOrder(); break;
      case 'swap': { const w = st.widthCm; st.widthCm = st.heightCm; st.heightCm = w; pushSizeToForm(); thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true }); break; }
      case 'undo': restore(hi - 1); break;
      case 'redo': restore(hi + 1); break;
      case 'reset': resetDesign(); break;
      case 'cat': tplCat = t.dataset.id; syncUI(true); break;
      case 'tpl': { const tpl = E.TEMPLATES.find(x => x.id === t.dataset.id); if (!tpl) break; const withTexts = useTplTexts || !textTouched; st = E.applyTemplate(st, tpl, withTexts); if (withTexts) textTouched = false; thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true }); break; }
      case 'random': st = E.randomize(st); thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true }); break;
      case 'layout': st.layout = t.dataset.id; st.tpl = ''; syncUI(true); afterChange({ commitNow: true }); break;
      case 'palette': st.pal = t.dataset.id; st.custom = { text: '', accent: '' }; st.bg.c1 = ''; st.bg.c2 = ''; st.tpl = ''; thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true }); break;
      case 'clear-color': { const p = t.dataset.k; setPath(st, p, ''); thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true }); break; }
      case 'pick-photo': dlg.querySelector('[data-file="photo"]').click(); break;
      case 'pick-logo': dlg.querySelector('[data-file="logo"]').click(); break;
      case 'remove-photo': st.bg.photo = ''; st.bg.type = 'gradient'; syncUI(true); afterChange({ commitNow: true }); break;
      case 'remove-logo': st.logo.id = ''; syncUI(true); afterChange({ commitNow: true }); break;
      case 'download': doDownload(); break;
      case 'save': saveProject(); break;
      case 'load': dlg.querySelector('[data-file="project"]').click(); break;
      case 'suggest': { const k = t.dataset.k; if (k === 'head') st.headline = t.dataset.v; else if (k === 'sub') st.sub = t.dataset.v; else { st.cta = t.dataset.v; st.ctaOn = true; } textTouched = true; syncUI(true); afterChange({ commitNow: true }); break; }
      default: break;
    }
  }
  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); restore(hi - 1); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); restore(hi + 1); }
  }
  function onClosed() {
    commit(); autosave(); renderEntryThumb(); updateEntry();
    if (attach.enabled && (!attach.file || attach.sig !== sigNow())) scheduleAttach();
  }

  function resetLabels(armed) {
    dlg.querySelectorAll('[data-act="reset"]').forEach(b => { b.textContent = armed ? tr('Na pewno? Kliknij ponownie', 'Sure? Click again') : tr('Wyczyść projekt', 'Reset design'); });
  }
  function resetDesign() {
    if (!resetArmed) {
      resetArmed = setTimeout(() => { resetArmed = 0; if (dlg) resetLabels(false); }, 3500);
      resetLabels(true); return;
    }
    clearTimeout(resetArmed); resetArmed = 0; resetLabels(false);
    const d = E.defaultState(); d.widthCm = st.widthCm; d.heightCm = st.heightCm; st = d; textTouched = false;
    thumbsDirty = { tpl: true, look: true }; syncUI(true); afterChange({ commitNow: true });
  }

  // ---------- zmiany → odświeżenie ----------
  function afterChange(o = {}) {
    st = E.normalizeState(st);
    if (!o.keepFields) { /* pola zsynchronizowane przez syncUI przy akcjach; przy wpisywaniu nie nadpisujemy aktywnego pola */ }
    if (ui) { updateDerived(); schedulePreview(); scheduleThumbs(); }
    renderEntryThumb(); updateEntry();
    if (o.commitNow) commit(); else commitSoon();
    scheduleAttach();
  }

  // ---------- synchronizacja kontrolek ----------
  function syncUI(force) {
    if (!ui) return;
    const eff = E.effPalette(st);
    dlg.querySelectorAll('[data-bind]').forEach(el => {
      if (!force && document.activeElement === el) return;
      let v = getPath(st, el.dataset.bind);
      if (el.type === 'color') { const p = el.dataset.bind; v = v || (p === 'custom.text' ? eff.text : p === 'custom.accent' ? eff.accent : p === 'bg.c1' ? eff.bg1 : eff.bg2); el.value = v; }
      else if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v == null ? '' : v;
    });
    dlg.querySelectorAll('[data-set]').forEach(b => { if (!b.dataset.set) return; const cur = getPath(st, b.dataset.set); b.setAttribute('aria-pressed', String(String(cur) === b.dataset.val)); });
    dlg.querySelectorAll('[data-act="layout"]').forEach(b => b.setAttribute('aria-pressed', String(st.layout === b.dataset.id)));
    dlg.querySelectorAll('[data-act="palette"]').forEach(b => b.setAttribute('aria-pressed', String(st.pal === b.dataset.id && !st.custom.accent)));
    dlg.querySelectorAll('[data-act="cat"]').forEach(b => b.setAttribute('aria-pressed', String(tplCat === b.dataset.id)));
    dlg.querySelectorAll('[data-act="tpl"]').forEach(b => { b.hidden = tplCat !== 'all' && b.dataset.cat !== tplCat; b.classList.toggle('is-active', st.tpl === b.dataset.id); });
    dlg.querySelectorAll('[data-exportfmt]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.exportfmt === exportFmt)));
    dlg.querySelectorAll('[data-exportpx]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.exportpx) === exportPx)));
    if (document.activeElement !== ui.sizeW || force) ui.sizeW.value = String(st.widthCm);
    if (document.activeElement !== ui.sizeH || force) ui.sizeH.value = String(st.heightCm);
    ui.tpltexts.checked = useTplTexts; ui.zoom.value = String(zoom);
    updateDerived(); updateTabFlags(); updateHistoryButtons();
  }
  function updateDerived() {
    dlg.querySelectorAll('[data-showif]').forEach(el => {
      const spec = el.dataset.showif; let show;
      const neg = spec.indexOf('!=');
      if (neg > -1) { const v = getPath(st, spec.slice(0, neg)); show = String(v || '') !== spec.slice(neg + 2); }
      else { const [p, vals] = spec.split('='); show = vals.split(',').includes(String(getPath(st, p))); }
      el.hidden = !show;
    });
    dlg.querySelectorAll('[data-out]').forEach(o => {
      const v = getPath(st, o.dataset.out), f = o.dataset.fmt;
      o.textContent = f === 'pct' ? v + '%' : f === 'deg' ? v + '°' : String(v);
    });
    dlg.querySelectorAll('[data-count]').forEach(c => {
      const p = c.dataset.count, max = p === 'headline' ? L.headline : p === 'sub' ? L.sub : p === 'contact' ? L.contact : p === 'cta' ? L.cta : p === 'qr.text' ? L.qr : L.badge;
      const n = String(getPath(st, p) || '').length; c.textContent = `${n}/${max}`; c.classList.toggle('is-over', n >= max);
    });
    ui.mat.textContent = materialName();
    const gl = dlg.querySelector('[data-guidelabel]');
    if (gl) gl.textContent = hasEyelets() ? tr('Margines bezpieczny i oczka', 'Safe margin and eyelets') : tr('Margines bezpieczny', 'Safe margin');
    ui.exportinfo.textContent = (() => { const d = exportDims(exportPx); return tr(`Wynik: ${d.w} × ${d.h} px (ok. ${Math.round(d.w / (st.widthCm / 2.54))} dpi przy rozmiarze banera).`, `Output: ${d.w} × ${d.h} px (about ${Math.round(d.w / (st.widthCm / 2.54))} dpi at banner size).`); })();
  }
  function updateTabFlags() {
    const flags = { extra: !!st.logo.id || (st.qr.on && st.qr.text) || st.badge.on, look: st.bg.type === 'photo' };
    dlg.querySelectorAll('[data-tab]').forEach(b => { const d = b.querySelector('.d24bg-dot'); if (d) d.hidden = !flags[b.dataset.tab]; });
  }
  function setTab(id) {
    tab = id;
    dlg.querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    dlg.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
    if (id === 'tpl' || id === 'look') { scheduleThumbs(); }
    syncUI(true);
  }
  function renderSuggestions() {
    const s = E.SUGGEST.find(x => x.id === suggCat) || E.SUGGEST[0];
    const group = (k, label, list) => `<div><span class="d24bg-sugg__label">${label}</span><div class="d24bg-chiprow">${list.map(v => `<button type="button" class="d24bg-chipbtn" data-act="suggest" data-k="${k}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`;
    ui.suggbox.innerHTML = group('head', tr('Nagłówki', 'Headlines'), s.heads) + group('sub', tr('Opisy', 'Subheadings'), s.subs) + group('cta', tr('Przyciski', 'Buttons'), s.ctas);
  }

  // ---------- podgląd ----------
  function schedulePreview() { if (previewQueued || !dlg || !dlg.open) return; previewQueued = true; requestAnimationFrame(renderPreview); }
  function renderPreview() {
    previewQueued = false; if (!dlg || !dlg.open) return;
    const availW = Math.max(220, ui.stage.clientWidth - 28), availH = Math.max(160, ui.stage.clientHeight - 28);
    const ratio = st.widthCm / st.heightCm;
    let cssW = Math.min(availW, availH * ratio) * zoom, cssH = cssW / ratio;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
    const cap = 2800; if (Math.max(pw, ph) > cap) { const k = cap / Math.max(pw, ph); pw = Math.round(pw * k); ph = Math.round(ph * k); }
    pw = Math.max(240, pw); ph = Math.max(24, ph);
    const c = ui.canvas;
    if (c.width !== pw) c.width = pw; if (c.height !== ph) c.height = ph;
    c.style.width = cssW + 'px'; c.style.height = cssH + 'px';
    lastReport = E.render(c, st, assets, { guides: ui.guides.checked, analyze: true, eyelets: hasEyelets() });
    updateQuality(lastReport);
  }
  function updateQuality(r) {
    const chips = [`<span class="d24bg-chip">${fmtNum(st.widthCm, 1)} × ${fmtNum(st.heightCm, 1)} cm</span>`];
    if (r.distM) chips.push(`<span class="d24bg-chip" title="${tr('Orientacyjnie: ok. 1 cm wysokości liter na każde 1,2 m odległości', 'Rule of thumb: about 1 cm of letter height per 1.2 m of distance')}">${tr(`Nagłówek czytelny z ok. ${r.distM} m`, `Headline readable from ~${r.distM} m`)}</span>`);
    if (r.rating) chips.push(`<span class="d24bg-chip d24bg-chip--${r.rating}">${tr('Czytelność: ', 'Readability: ')}${RATING[r.rating][isEn() ? 1 : 0]}</span>`);
    ui.chips.innerHTML = chips.join('');
    const lis = sizeIssues().concat(r.issues).map(i => `<li class="is-${i.level}">${esc((ISSUE[i.id] || (() => i.id))(i))}</li>`);
    lis.push(`<li class="is-tip">${tr('Ważne elementy trzymaj wewnątrz przerywanej ramki (margines bezpieczny ' + E.SAFE_CM + ' cm).' + (hasEyelets() ? ' Oczka pokazano orientacyjnie.' : ''), 'Keep important elements inside the dashed frame (' + E.SAFE_CM + ' cm safe margin).' + (hasEyelets() ? ' Eyelets are shown as a guide.' : ''))}</li>`);
    ui.quality.innerHTML = lis.join('');
    if (ui.qrinfo) {
      ui.qrinfo.textContent = r.qrCm != null ? tr(`Kod ma ${fmtNum(r.qrCm, 1)} cm (${r.qrModules} × ${r.qrModules} pól) — zeskanujesz go z ok. ${fmtNum(r.qrCm / 10, 1)} m. Przetestuj telefonem.`, `The code is ${fmtNum(r.qrCm, 1)} cm (${r.qrModules} × ${r.qrModules} modules) — scannable from about ${fmtNum(r.qrCm / 10, 1)} m. Test it with a phone.`) : tr('Wpisz adres www lub tekst, który ma otwierać kod.', 'Enter the web address or text the code should open.');
    }
  }

  // ---------- miniatury ----------
  function scheduleThumbs() { if (thumbsQueued || !dlg || !dlg.open) return; thumbsQueued = true; setTimeout(renderThumbs, 120); }
  function thumbDims(w) { const r = Math.min(3, Math.max(0.5, st.widthCm / st.heightCm)); return [w, Math.max(40, Math.round(w / r))]; }
  function renderThumbs() {
    thumbsQueued = false; if (!dlg || !dlg.open) return;
    if (tab === 'tpl' && thumbsDirty.tpl) {
      const [w, h] = thumbDims(200);
      ui.tplgrid.querySelectorAll('[data-act="tpl"]').forEach(b => {
        if (b.hidden) return;
        const c = b.querySelector('canvas'); c.width = w; c.height = h; c.style.aspectRatio = `${w} / ${h}`;
        const tpl = E.TEMPLATES.find(x => x.id === b.dataset.id);
        const s = E.applyTemplate(st, tpl, useTplTexts || !textTouched);
        s.qr.on = false; s.logo.id = '';
        E.render(c, s, assets, {});
      });
      thumbsDirty.tpl = false;
    }
    if (tab === 'look' && thumbsDirty.look) {
      const [w, h] = thumbDims(150);
      ui.laygrid.querySelectorAll('[data-act="layout"]').forEach(b => {
        const c = b.querySelector('canvas'); c.width = w; c.height = h; c.style.aspectRatio = `${w} / ${h}`;
        E.render(c, { ...st, layout: b.dataset.id }, assets, {});
      });
      thumbsDirty.look = false;
    }
  }

  // ---------- panel pod formularzem ----------
  function buildEntry() {
    entry = document.createElement('section');
    entry.className = 'd24bg-entry';
    entry.innerHTML = `<div class="d24bg-entry__copy">
      <span class="d24bg-eyebrow">${tr('GENERATOR BANERA', 'BANNER GENERATOR')}</span>
      <h3>${tr('Zaprojektuj baner online — bez grafika', 'Design your banner online — no designer needed')}</h3>
      <p>${tr('Wybierz szablon, wpisz tekst, dodaj logo i kod QR. Zobaczysz baner w skali, z marginesem bezpiecznym i oczkami, a na koniec pobierzesz gotowy plik PDF, JPG lub PNG.', 'Pick a template, type your text, add a logo and QR code. See the banner to scale with safe margin and eyelets, then download a ready PDF, JPG or PNG.')}</p>
      <div class="d24bg-entry__actions">
        <button type="button" class="d24bg-btn d24bg-btn--primary" data-act="open">${tr('Otwórz generator', 'Open generator')}</button>
        <label class="d24bg-check"><input type="checkbox" data-attach><span>${tr('Dołącz projekt do zamówienia', 'Attach the design to my order')}</span></label>
      </div>
      <p class="d24bg-entry__status" data-status aria-live="polite"></p>
      <p class="d24bg-hint">${tr('Projekt powstaje w Twojej przeglądarce i nie jest nigdzie wysyłany, dopóki nie zaznaczysz dołączenia do zamówienia.', 'The design is created in your browser and is not uploaded anywhere unless you tick the attach option.')}</p>
    </div>
    <button type="button" class="d24bg-entry__thumb" data-act="open" aria-label="${tr('Otwórz generator banera', 'Open banner generator')}"><canvas></canvas><span>${tr('Edytuj projekt', 'Edit design')}</span></button>`;
    entry.addEventListener('click', e => { if (e.target.closest('[data-act="open"]')) openEditor(); });
    entry.addEventListener('change', e => { if (e.target.matches('[data-attach]')) setAttach(e.target.checked); });
  }
  function renderEntryThumb() {
    const c = entry && entry.isConnected ? entry.querySelector('canvas') : null; if (!c) return;
    const r = Math.min(6, Math.max(0.5, st.widthCm / st.heightCm)), w = 520, h = Math.round(w / r);
    if (c.width !== w) c.width = w; c.height = h;
    E.render(c, st, assets, {});
  }
  function updateEntry() {
    if (!entry || !entry.isConnected) return;
    const cb = entry.querySelector('[data-attach]'), s = entry.querySelector('[data-status]');
    if (cb) cb.checked = attach.enabled;
    let msg = '', cls = '';
    if (attach.enabled) {
      if (attach.error) { msg = attach.error; cls = 'is-bad'; }
      else if (attach.busy || !attach.file || attach.sig !== sigNow()) { msg = tr('Przygotowuję plik PDF z projektem…', 'Preparing the design PDF…'); }
      else { msg = tr(`✓ Do zamówienia zostanie dołączony plik ${attach.file.name} (${fmtNum(attach.file.size / 1048576, 1)} MB). Pojawi się po dodaniu do koszyka.`, `✓ ${attach.file.name} (${fmtNum(attach.file.size / 1048576, 1)} MB) will be attached to your order once you add it to the cart.`); cls = 'is-ok'; }
    }
    if (s.textContent !== msg) s.textContent = msg;
    s.className = 'd24bg-entry__status ' + cls;
  }
  function openEditor() {
    buildDialog(); syncFromForm(); useTplTexts = !textTouched;
    if (!dlg.open) dlg.showModal();
    thumbsDirty = { tpl: true, look: true };
    syncUI(true); ensureFonts(); setTab(tab);
    requestAnimationFrame(() => { schedulePreview(); scheduleThumbs(); });
  }
  async function useInOrder() {
    ui.root.classList.add('is-busy'); say(tr('Zapisuję projekt jako PDF…', 'Saving the design as PDF…'));
    pushSizeToForm();
    attach.enabled = true; clearTimeout(attachTimer);
    await buildAttach();
    ui.root.classList.remove('is-busy');
    if (attach.file && !attach.error) { say(''); dlg.close(); } else say(attach.error || tr('Nie udało się zapisać projektu.', 'Could not save the design.'), true);
  }
  function say(text, bad) { if (!ui) return; ui.msg.textContent = text || ''; ui.msg.classList.toggle('is-bad', !!bad); }

  // ---------- zapis / odczyt projektu ----------
  function saveProject() {
    const ids = [st.logo.id, st.bg.photo].filter(Boolean), data = {};
    ids.forEach(id => { if (assetData[id]) data[id] = assetData[id]; });
    const blob = new Blob([JSON.stringify({ app: 'drukulator-banner', v: 1, state: st, assets: data })], { type: 'application/json' });
    download(blob, `baner-projekt-${fmtNum(st.widthCm, 0)}x${fmtNum(st.heightCm, 0)}.json`); say(tr('Zapisano plik projektu.', 'Project file saved.'));
  }
  async function loadProject(file) {
    try {
      if (file.size > 40 * 1024 * 1024) throw new Error('size');
      const obj = JSON.parse(await file.text());
      if (!obj || obj.app !== 'drukulator-banner' || !obj.state) throw new Error('format');
      const map = {};
      for (const [id, url] of Object.entries(obj.assets || {})) {
        if (!/^data:image\/(png|jpeg|webp|svg\+xml);base64,/i.test(url)) continue;
        map[id] = registerAsset(await loadImg(url), url);
      }
      const s = E.normalizeState(obj.state);
      s.logo.id = map[s.logo.id] || ''; s.bg.photo = map[s.bg.photo] || ''; if (s.bg.type === 'photo' && !s.bg.photo) s.bg.type = 'gradient';
      st = s; textTouched = true; pushSizeToForm(); thumbsDirty = { tpl: true, look: true };
      syncUI(true); afterChange({ commitNow: true }); say(tr('Wczytano projekt.', 'Project loaded.'));
    } catch (e) { say(tr('To nie jest poprawny plik projektu generatora.', 'This is not a valid generator project file.'), true); }
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
    if (grid.nextElementSibling !== entry) grid.after(entry);
    syncFromForm(); renderEntryThumb(); updateEntry();
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(decorate); }
  new MutationObserver(ms => { if (ms.every(m => m.target.closest && m.target.closest('.d24bg-entry'))) return; schedule(); }).observe(content, { childList: true, subtree: true });
  const onForm = e => {
    const id = e.target && e.target.id;
    if (id === 'bannerWidth' || id === 'bannerHeight') { if (syncFromForm() && dlg && dlg.open) syncUI(false); }
    else if (id === 'bannerMaterial' && ui) { updateDerived(); schedulePreview(); }
  };
  content.addEventListener('input', onForm, true); content.addEventListener('change', onForm, true);
  new MutationObserver(() => {
    if (dlg) { const was = dlg.open; if (was) dlg.close(); dlg.remove(); dlg = null; ui = null; }
    if (entry) { entry.remove(); entry = null; } schedule();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  window.Druk24BannerGen = {
    open: openEditor,
    getState: () => JSON.parse(JSON.stringify(st)),
    setState(s) { st = E.normalizeState(s); if (dlg) { syncUI(true); } afterChange({ commitNow: true }); },
    getAttachFiles() { return attach.enabled && attach.file && attach.sig === sigNow() ? [attach.file] : []; },
    isAttachEnabled: () => attach.enabled,
    setAttach,
    exportBlob: (fmt, px) => exportBlob(fmt || 'pdf', px || 2500),
    render: canvas => E.render(canvas, st, assets, {}),
    getReport: () => lastReport
  };
  schedule();
})();
