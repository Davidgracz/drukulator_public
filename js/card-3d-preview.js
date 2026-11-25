/* Drukulator 0.26.13v — podgląd 3D wizytówki (przód / tył).
 * Lokalny moduł: bez bibliotek 3D (transformacje CSS 3D), bez wysyłania plików, bez wpływu na cenę, opcje i zamówienie.
 * PDF jest renderowany przez pdf.js (assets/vendor/pdfjs/), który ładuje się dopiero przy pierwszym wgranym PDF-ie.
 * Wgrane tu pliki NIE są załącznikami zamówienia — załączniki dodaje się w koszyku (tak samo jak w „Podglądzie wydruku”).
 *
 * Aby włączyć podgląd na innej stronie produktu, dopisz wpis do PRODUCTS (id pola formatu, opcjonalnie id pól „Zadruk” i „Wykończenie”).
 */
(() => {
  'use strict';
  const content = document.getElementById('content');
  if (!content) return;
  const tr = (pl, en) => document.documentElement.lang === 'en' ? en : pl;

  const MAX_BYTES = 50 * 1024 * 1024;
  const BLEED_MM = 1.5;
  const ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';
  const PDFJS_URL = 'assets/vendor/pdfjs/pdf.min.js';
  const PDFJS_WORKER_URL = 'assets/vendor/pdfjs/pdf.worker.min.js';
  const PRODUCTS = [
    { formatId: 'bcFormat', sidesId: 'bcSides', finishId: 'bcFinish', thicknessMm: 0.4 }
  ];
  const REDUCED_MOTION = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const PAPER = '#fbfaf6';

  // ---------- stan modułu (resetowany przy zmianie strony produktu) ----------
  const emptySide = () => ({ file: null, name: '', src: null, face: null, version: 0, token: 0, busy: false, error: '', note: '', fromPdfPage: 0, pdfKey: '' });
  let card = null, panel = null, product = null, ui = null;
  let sides = { front: emptySide(), back: emptySide() };
  let rotatedManual = null;        // null = automatycznie według pliku
  let bleedOverride = null;        // null = automatycznie według pliku
  let fillFrame = false;
  let lastSig = '';
  let scheduled = false;
  let texLong = 0;
  let pdfjsPromise = null;

  // ---------- widok 3D ----------
  const REST = { rx: -8, ry: -24 };
  let rx = REST.rx, ry = REST.ry, wx = 0, wy = 0, target = null;
  let idleStart = 0, idleOn = false, dragging = null, raf = 0, interacted = false;
  const LIGHT = (() => { const v = [-0.32, -0.5, 0.8]; const n = Math.hypot(...v); return v.map(x => x / n); })();
  const HALF = (() => { const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1]; const n = Math.hypot(...v); return v.map(x => x / n); })();

  // ---------- pomocnicze ----------
  function readable(n, max = 1) {
    return new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'pl-PL', { maximumFractionDigits: max }).format(n);
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function classify(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf' && (file.type === 'application/pdf' || !file.type)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) && (!file.type || /^image\/(jpeg|png|webp)$/.test(file.type))) return 'image';
    return null;
  }
  function parseNet(select) {
    if (!select) return null;
    const text = String(select.selectedOptions?.[0]?.textContent || select.value || '').replace(/ /g, ' ');
    const m = text.match(/(\d{1,4}(?:[.,]\d+)?)\s*[x×]\s*(\d{1,4}(?:[.,]\d+)?)/i);
    if (!m) return null;
    const w = Number(m[1].replace(',', '.')), h = Number(m[2].replace(',', '.'));
    return w > 0 && h > 0 && w <= 1000 && h <= 1000 ? { w, h } : null;
  }
  function sheenFor(finish) {
    const text = String(finish || '');
    if (/z[łl]ocenie|srebrzenie|lakier/i.test(text)) return { gloss: 0.46, note: tr('Podgląd nie odwzorowuje złocenia, srebrzenia ani lakieru UV 3D — te wykończenia zobaczysz na gotowej wizytówce.', 'The preview does not reproduce gold/silver foil or 3D UV varnish — you will see them on the finished card.') };
    if (/foli/i.test(text)) return { gloss: 0.38, note: tr('Połysk zależy od wybranej folii (błysk lub soft touch); na podglądzie jest orientacyjny.', 'Shine depends on the chosen film (gloss or soft touch); it is only approximate here.') };
    return { gloss: 0.1, note: '' };
  }

  // ---------- pdf.js (ładowany leniwie) ----------
  function loadPdfjs() {
    if (!pdfjsPromise) {
      const base = document.baseURI;
      pdfjsPromise = import(new URL(PDFJS_URL, base).href).then(mod => {
        mod.GlobalWorkerOptions.workerSrc = new URL(PDFJS_WORKER_URL, base).href;
        return mod;
      }).catch(error => { pdfjsPromise = null; throw error; });
    }
    return pdfjsPromise;
  }

  // ---------- wczytywanie plików ----------
  function downscaleToCanvas(img, w, h, maxSide) {
    const k = Math.min(1, maxSide / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    let cur = img, curW = w, curH = h;
    while (curW / 2 >= cw && curH / 2 >= ch) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(curW / 2)); c.height = Math.max(1, Math.round(curH / 2));
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, c.width, c.height);
      cur = c; curW = c.width; curH = c.height;
    }
    const out = document.createElement('canvas'); out.width = cw; out.height = ch;
    const ctx = out.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cur, 0, 0, cw, ch);
    return out;
  }
  function loadImageSource(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) throw new Error('empty');
          const drawable = downscaleToCanvas(img, w, h, 2800);
          resolve({ drawable, w, h, isPdf: false });
        } catch (error) { reject(error); } finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.decoding = 'async';
      img.src = url;
    });
  }
  async function loadPdfPages(file, wantPages) {
    const pdfjs = await loadPdfjs();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
    try {
      const pages = [];
      for (let index = 1; index <= Math.min(doc.numPages, wantPages); index += 1) {
        const page = await doc.getPage(index);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2400 / Math.max(base.width, base.height), 16);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width)); canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, viewport }).promise;
        pages.push({ drawable: canvas, w: canvas.width, h: canvas.height, mmW: base.width * 25.4 / 72, mmH: base.height * 25.4 / 72, isPdf: true, pageNumber: index, numPages: doc.numPages });
        page.cleanup?.();
      }
      return pages;
    } finally { doc.destroy?.(); }
  }
  function setSideSource(side, file, src, extra = {}) {
    side.file = file; side.name = file ? file.name : ''; side.src = src; side.version += 1;
    side.error = ''; side.note = extra.note || ''; side.busy = false; side.face = null;
  }
  function clearSide(side) {
    side.token += 1;
    Object.assign(side, { file: null, name: '', src: null, face: null, busy: false, error: '', note: '', fromPdfPage: 0, pdfKey: '' });
    side.version += 1;
  }
  async function loadIntoSide(sideKey, file, opts = {}) {
    const side = sides[sideKey];
    const token = ++side.token;
    const kind = classify(file);
    if (!kind || file.size > MAX_BYTES || file.size === 0) {
      side.error = tr('Obsługiwane formaty: JPG, PNG, WebP i PDF (do 50 MB).', 'Supported: JPG, PNG, WebP and PDF (up to 50 MB).');
      refresh(true); return false;
    }
    side.busy = true; side.error = ''; refresh(true);
    try {
      if (kind === 'image') {
        const src = await loadImageSource(file);
        if (side.token !== token) return false;
        setSideSource(side, file, src);
      } else {
        const wantSecond = sideKey === 'front' && !opts.single;
        const pages = await loadPdfPages(file, wantSecond ? 2 : 1);
        if (side.token !== token) return false;
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        const front = pages[0];
        setSideSource(side, file, front, { note: front.numPages > 1 && sideKey === 'back' ? tr('Użyto strony 1 pliku PDF.', 'Page 1 of the PDF was used.') : '' });
        side.fromPdfPage = 1; side.pdfKey = key;
        // PDF dwustronny (strona 1 = przód, strona 2 = tył): uzupełniamy pusty tył albo tył wzięty z poprzedniego PDF-a.
        if (wantSecond && pages[1]) {
          const back = sides.back;
          if (!back.file || back.fromPdfPage) {
            back.token += 1;
            setSideSource(back, file, pages[1], { note: tr('Tył z drugiej strony tego samego PDF-a.', 'Back taken from page 2 of the same PDF.') });
            back.fromPdfPage = 2; back.pdfKey = key;
          }
          side.note = tr('PDF ma kilka stron: strona 1 = przód, strona 2 = tył.', 'Multi-page PDF: page 1 = front, page 2 = back.');
        } else if (wantSecond && front.numPages > 2) {
          side.note = tr(`PDF ma ${front.numPages} stron — pokazuję pierwszą.`, `The PDF has ${front.numPages} pages — showing the first.`);
        }
      }
    } catch (error) {
      if (side.token !== token) return false;
      side.busy = false; side.src = null; side.file = null; side.name = ''; side.face = null; side.version += 1;
      const pdf = kind === 'pdf';
      side.error = pdf
        ? tr('Nie udało się odczytać PDF-a. Spróbuj zapisać projekt jako JPG lub PNG.', 'Could not read the PDF. Try saving the artwork as JPG or PNG.')
        : tr('Nie można odczytać obrazu.', 'Unable to read this image.');
      console.warn('[card-3d]', error);
    }
    interacted = false; startIdle();
    refresh(true);
    return true;
  }
  function handleFiles(fileList, preferred) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    const order = preferred === 'back' ? ['back', 'front'] : ['front', 'back'];
    if (preferred) {
      // Wiele plików upuszczonych na jedno pole: pierwszy trafia tam, drugi do pustej strony obok.
      loadIntoSide(preferred, files[0], { single: files.length > 1 });
      if (files[1]) { const other = order[1]; loadIntoSide(other, files[1], { single: true }); }
      return;
    }
    // Upuszczenie na scenę: najpierw puste pola.
    const free = ['front', 'back'].filter(key => !sides[key].file && !sides[key].busy);
    const slots = free.length ? free : ['front', 'back'];
    files.slice(0, 2).forEach((file, i) => loadIntoSide(slots[i] || slots[slots.length - 1], file, { single: files.length > 1 }));
  }

  // ---------- geometria i tekstura ----------
  function srcRatio(src) { return src.mmW ? src.mmW / src.mmH : src.w / src.h; }
  function detectBleed(src, net) {
    const nr = net.w / net.h, gw = net.w + 2 * BLEED_MM, gh = net.h + 2 * BLEED_MM, gr = gw / gh;
    if (src.mmW) {
      const dn = Math.hypot(src.mmW - net.w, src.mmH - net.h), dg = Math.hypot(src.mmW - gw, src.mmH - gh);
      if (dg <= 1 && dg < dn) return true;
      if (dn <= 1) return false;
    }
    const r = srcRatio(src), dN = Math.abs(r / nr - 1), dG = Math.abs(r / gr - 1);
    return dG < dN && dG < 0.012;
  }
  function bleedFor(side, net) {
    if (!side.src) return false;
    return bleedOverride === null ? detectBleed(side.src, net) : bleedOverride;
  }
  // Wymiary i miejsce pliku względem wizytówki (w mm, w układzie „netto”).
  function artworkRect(side, net) {
    const bleed = bleedFor(side, net), B = bleed ? BLEED_MM : 0;
    const gw = net.w + 2 * B, gh = net.h + 2 * B, gr = gw / gh;
    const r = srcRatio(side.src);
    const matchHeight = fillFrame ? r > gr : r <= gr;
    const ah = matchHeight ? gh : gw / r, aw = matchHeight ? gh * r : gw;
    return { bleed, x: (gw - aw) / 2 - B, y: (gh - ah) / 2 - B, w: aw, h: ah, mismatch: Math.abs(r / gr - 1) > 0.035 };
  }
  function autoRotated(base) {
    const src = sides.front.src || sides.back.src;
    if (!src) return false;
    const r = srcRatio(src), br = base.w / base.h;
    return (r - 1) * (br - 1) < 0 && Math.abs(r - 1) > 0.08 && Math.abs(br - 1) > 0.08;
  }
  function drawPlaceholder(ctx, w, h, key, backEnabled) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    if (key === 'back' && !backEnabled) return; // jednostronna: biały tył
    if (key === 'front') {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#fdfdfd'); g.addColorStop(.64, '#e8f4fa'); g.addColorStop(1, '#c7e9f8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(w * .5, h * 1.02); ctx.rotate(-12 * Math.PI / 180);
      ctx.fillStyle = 'rgba(16,141,195,.92)'; ctx.fillRect(-w * .8, -h * .12, w * 1.6, h * .28); ctx.restore();
    }
    const unit = Math.max(w, h) / 100;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (key === 'front') {
      ctx.fillStyle = '#13191b'; ctx.font = `900 ${unit * 7.2}px Montserrat, Arial, sans-serif`;
      const label = 'DRUK'; const w1 = ctx.measureText(label).width, w2 = ctx.measureText('24').width;
      const x0 = w / 2 - (w1 + w2) / 2;
      ctx.textAlign = 'left'; ctx.fillText(label, x0, h * .42); ctx.fillStyle = '#078bc7'; ctx.fillText('24', x0 + w1, h * .42);
      ctx.textAlign = 'center'; ctx.fillStyle = '#58636c'; ctx.font = `700 ${unit * 2.6}px Montserrat, Arial, sans-serif`;
      ctx.fillText(tr('TWÓJ PROJEKT — PRZÓD', 'YOUR DESIGN — FRONT'), w / 2, h * .56);
    } else {
      ctx.strokeStyle = 'rgba(88,99,108,.35)'; ctx.setLineDash([unit * 1.4, unit * 1]); ctx.lineWidth = Math.max(1, unit * .35);
      ctx.strokeRect(w * .06, h * .1, w * .88, h * .8); ctx.setLineDash([]);
      ctx.fillStyle = '#7a868e'; ctx.font = `700 ${unit * 2.8}px Montserrat, Arial, sans-serif`;
      ctx.fillText(tr('TYŁ WIZYTÓWKI', 'BACK OF THE CARD'), w / 2, h * .5);
    }
  }
  function composeFace(key, net, backEnabled) {
    const side = sides[key];
    const k = texLong / Math.max(net.w, net.h);
    const cw = Math.max(2, Math.round(net.w * k)), ch = Math.max(2, Math.round(net.h * k));
    const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (!side.src) { drawPlaceholder(ctx, cw, ch, key, backEnabled); return { canvas, info: null }; }
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
    const rect = artworkRect(side, net);
    ctx.drawImage(side.src.drawable, rect.x * k, rect.y * k, rect.w * k, rect.h * k);
    const dpi = side.src.isPdf ? null : Math.round(25.4 * side.src.w / rect.w);
    return { canvas, info: { rect, dpi } };
  }

  // ---------- DOM ----------
  function panelMarkup() {
    return `<details class="d24-fold d24-preview-fold d24c3-fold">
    <summary class="d24-fold__summary"><span class="d24-fold__label">◈ ${tr('Podgląd 3D wizytówki', 'Business card 3D preview')}</span><span class="d24-fold__hint">${tr('Wgraj przód i tył, obracaj kartę', 'Upload front and back, rotate the card')}</span><span class="d24-fold__chevron" aria-hidden="true">⌄</span></summary>
    <div class="d24-fold__body"><div class="d24-preview-header">
      <div><span class="d24-preview-eyebrow">${tr('PODGLĄD 3D', '3D PREVIEW')}</span>
      <h3>${tr('Zobacz swoją wizytówkę z każdej strony', 'See your card from every side')}</h3>
      <p>${tr('Wgraj przód i tył projektu, a następnie obracaj kartę myszką lub palcem. Wizualizacja poglądowa — nie wpływa na cenę ani przesyłane zamówienie.', 'Upload the front and back of your artwork, then rotate the card with the mouse or your finger. Illustrative only — does not affect the quote or order.')}</p></div>
      <span class="d24-preview-local">${tr('Tylko w przeglądarce', 'Browser only')}</span>
    </div>
    <div class="d24c3-layout">
      <div class="d24c3-viewer">
        <div class="d24c3-stage" tabindex="0" role="group" aria-label="${tr('Podgląd 3D wizytówki. Strzałki obracają kartę, Enter obraca na drugą stronę.', 'Business card 3D preview. Arrow keys rotate the card, Enter flips it.')}">
          <div class="d24c3-scene" data-scene></div>
          <div class="d24c3-shadow" aria-hidden="true"></div>
          <div class="d24c3-hint" data-hint aria-hidden="true">${tr('Przeciągnij, aby obrócić', 'Drag to rotate')}</div>
          <div class="d24c3-busy" data-busy hidden>${tr('Wczytuję plik…', 'Loading file…')}</div>
        </div>
        <div class="d24c3-toolbar" role="toolbar" aria-label="${tr('Widok karty', 'Card view')}">
          <button type="button" data-view="front">${tr('Przód', 'Front')}</button>
          <button type="button" data-view="back">${tr('Tył', 'Back')}</button>
          <button type="button" data-view="angle">${tr('Skos', 'Angle')}</button>
          <button type="button" data-view="orientation">⟲ <span data-orientation-label>${tr('Pionowo', 'Portrait')}</span></button>
        </div>
      </div>
      <div class="d24c3-side">
        <div class="d24c3-slots">
          ${['front', 'back'].map(key => `<div class="d24c3-slot" data-slot="${key}">
            <label class="d24c3-drop" data-drop="${key}">
              <input type="file" accept="${ACCEPT}" data-input="${key}">
              <span class="d24c3-drop__thumb" data-thumb="${key}" aria-hidden="true"><i>+</i></span>
              <span class="d24c3-drop__text"><strong>${key === 'front' ? tr('Przód', 'Front') : tr('Tył', 'Back')}</strong><small data-slot-text="${key}"></small></span>
            </label>
            <button type="button" class="d24c3-clear" data-clear="${key}" hidden>${tr('Usuń', 'Remove')}</button>
          </div>`).join('')}
        </div>
        <p class="d24c3-formats">${tr('JPG, PNG, WebP lub PDF — max. 50 MB. Jeden PDF z dwiema stronami wypełni przód i tył.', 'JPG, PNG, WebP or PDF — max. 50 MB. A two-page PDF fills both front and back.')}</p>
        <div class="d24-preview-dims" data-dims aria-live="polite"></div>
        <div class="d24c3-switches">
          <label class="d24-preview-switch" data-bleed-row hidden><input type="checkbox" data-bleed> ${tr('Plik ma spad 1,5 mm (przytnij do netto)', 'File includes 1.5 mm bleed (trim to final size)')}</label>
          <label class="d24-preview-switch" data-fill-row hidden><input type="checkbox" data-fill> ${tr('Wypełnij format (przycięcie)', 'Fill frame (crop)')}</label>
        </div>
        <div class="d24c3-notes" data-notes role="status" aria-live="polite"></div>
      </div>
    </div>
    <p class="d24-preview-footer" data-footer></p></div></details>`;
  }
  function mountPanel(grid) {
    const first = !panel;
    if (first) {
      panel = document.createElement('section');
      panel.className = 'd24-preview-panel d24c3-panel';
      panel.setAttribute('aria-label', tr('Podgląd 3D wizytówki', 'Business card 3D preview'));
    }
    const wasOpen = panel.querySelector('details')?.open;
    panel.innerHTML = panelMarkup();
    if (wasOpen) panel.querySelector('details').open = true;
    if (!panel.isConnected) grid.after(panel);
    ui = {
      details: panel.querySelector('details'),
      stage: panel.querySelector('.d24c3-stage'),
      scene: panel.querySelector('[data-scene]'),
      shadow: panel.querySelector('.d24c3-shadow'),
      hint: panel.querySelector('[data-hint]'),
      busy: panel.querySelector('[data-busy]'),
      dims: panel.querySelector('[data-dims]'),
      notes: panel.querySelector('[data-notes]'),
      footer: panel.querySelector('[data-footer]'),
      bleed: panel.querySelector('[data-bleed]'), bleedRow: panel.querySelector('[data-bleed-row]'),
      fill: panel.querySelector('[data-fill]'), fillRow: panel.querySelector('[data-fill-row]'),
      orientationLabel: panel.querySelector('[data-orientation-label]'),
      faces: null
    };
    buildScene();
    bindPanel();
  }
  function buildScene() {
    const mk = (cls, parent) => { const el = document.createElement('div'); el.className = cls; parent?.appendChild(el); return el; };
    const makeFace = key => {
      const face = mk(`d24c3-face d24c3-face--${key}`, ui.scene);
      face.dataset.face = key;
      const holder = mk('d24c3-face__art', face);
      mk('d24c3-shade', face); mk('d24c3-gloss', face);
      return { face, holder };
    };
    const front = makeFace('front'), back = makeFace('back');
    const edges = {};
    ['right', 'left', 'top', 'bottom'].forEach(name => { edges[name] = mk(`d24c3-edge d24c3-edge--${name}`, ui.scene); });
    ui.faces = { front, back, edges };
  }
  function bindPanel() {
    const stage = ui.stage;
    ui.details.addEventListener('toggle', () => { if (ui.details.open) { lastSig = ''; refresh(true); startIdle(); } });
    panel.querySelectorAll('[data-input]').forEach(input => input.addEventListener('change', event => {
      const key = event.target.dataset.input;
      handleFiles(event.target.files, key);
      event.target.value = '';
    }));
    panel.querySelectorAll('[data-clear]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.clear;
      clearSide(sides[key]); refresh(true);
    }));
    panel.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.view)));
    ui.fill.addEventListener('change', () => { fillFrame = ui.fill.checked; refresh(true); });
    ui.bleed.addEventListener('change', () => { bleedOverride = ui.bleed.checked; refresh(true); });
    // przeciąganie plików
    const dropTargets = [...panel.querySelectorAll('[data-drop]'), stage];
    dropTargets.forEach(el => {
      const key = el.dataset?.drop || null;
      el.addEventListener('dragenter', e => { if (hasFiles(e)) { e.preventDefault(); el.classList.add('is-dragover'); } });
      el.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; el.classList.add('is-dragover'); } });
      el.addEventListener('dragleave', () => el.classList.remove('is-dragover'));
      el.addEventListener('drop', e => {
        if (!hasFiles(e)) return;
        e.preventDefault(); el.classList.remove('is-dragover');
        handleFiles(e.dataTransfer.files, key);
      });
    });
    // obracanie
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('dblclick', () => goTo(isShowingFront() ? 'back' : 'front'));
    stage.addEventListener('keydown', onKeyDown);
    if (window.ResizeObserver) new ResizeObserver(() => { if (ui?.stage === stage) { lastSig = ''; refresh(true); } }).observe(stage);
  }
  function hasFiles(event) { return Array.from(event.dataTransfer?.types || []).includes('Files'); }

  // ---------- obracanie ----------
  function isShowingFront() { return Math.cos(ry * Math.PI / 180) >= 0; }
  function stopIdle() { idleOn = false; }
  function startIdle() {
    if (REDUCED_MOTION.matches || interacted || dragging || !ui?.details?.open) return;
    idleOn = true; idleStart = performance.now(); schedule3d();
  }
  function schedule3d() { if (!raf) raf = requestAnimationFrame(tick); }
  function goTo(view) {
    if (view === 'orientation') { rotatedManual = !currentRotated(); lastSig = ''; refresh(true); return; }
    interacted = true; stopIdle(); wx = wy = 0;
    const desired = view === 'back' ? { rx: -4, ry: 180 } : view === 'angle' ? { rx: -16, ry: isShowingFront() ? -34 : 146 } : { rx: -4, ry: 0 };
    const delta = ((desired.ry - ry + 540) % 360) - 180;
    target = { rx: desired.rx, ry: ry + delta };
    if (REDUCED_MOTION.matches) { rx = target.rx; ry = target.ry; target = null; applyView(); } else schedule3d();
    ui.hint?.classList.add('is-gone');
  }
  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    interacted = true; stopIdle(); target = null; wx = wy = 0;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, type: event.pointerType, t: performance.now() };
    try { ui.stage.setPointerCapture(event.pointerId); } catch { /* brak przechwycenia nie przeszkadza */ }
    ui.stage.classList.add('is-dragging'); ui.hint?.classList.add('is-gone');
  }
  function onPointerMove(event) {
    if (!dragging || event.pointerId !== dragging.id) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    dragging.x = event.clientX; dragging.y = event.clientY;
    wy = dx * 0.5;
    ry += wy;
    // Na dotyku pionowy ruch przewija stronę (touch-action: pan-y), więc przechylanie góra/dół tylko myszką i rysikiem.
    if (dragging.type !== 'touch') { wx = -dy * 0.35; rx = clamp(rx + wx, -75, 75); } else wx = 0;
    applyView();
  }
  function onPointerUp(event) {
    if (!dragging || event.pointerId !== dragging.id) return;
    dragging = null; ui.stage.classList.remove('is-dragging');
    try { ui.stage.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
    if (REDUCED_MOTION.matches) { wx = wy = 0; return; }
    schedule3d();
  }
  function onKeyDown(event) {
    const step = event.shiftKey ? 30 : 12;
    let handled = true;
    interacted = true; stopIdle(); target = null; wx = wy = 0; ui.hint?.classList.add('is-gone');
    if (event.key === 'ArrowLeft') ry -= step;
    else if (event.key === 'ArrowRight') ry += step;
    else if (event.key === 'ArrowUp') rx = clamp(rx + step * .6, -75, 75);
    else if (event.key === 'ArrowDown') rx = clamp(rx - step * .6, -75, 75);
    else if (event.key === 'Enter' || event.key === ' ') goTo(isShowingFront() ? 'back' : 'front');
    else if (event.key === 'Home') goTo('front');
    else handled = false;
    if (handled) { event.preventDefault(); applyView(); }
  }
  function tick(now) {
    raf = 0;
    if (!ui || !ui.stage.isConnected || !ui.details.open) return;
    let active = false;
    if (dragging) { active = false; }
    else if (target) {
      const dy = target.ry - ry, dx = target.rx - rx;
      ry += dy * 0.16; rx += dx * 0.16;
      if (Math.abs(dy) < 0.05 && Math.abs(dx) < 0.05) { ry = target.ry; rx = target.rx; target = null; } else active = true;
    } else if (idleOn) {
      const t = now - idleStart;
      if (t > 5200) { idleOn = false; target = { rx: REST.rx, ry: REST.ry + Math.round((ry - REST.ry) / 360) * 360 }; active = true; }
      else {
        const fade = Math.min(1, t / 500);
        const baseRy = REST.ry + Math.round((ry - REST.ry) / 360) * 360;
        ry += (baseRy + Math.sin(t / 1000) * 20 * fade - ry) * 0.14;
        rx += (REST.rx + Math.cos(t / 1500) * 3 * fade - rx) * 0.14;
        active = true;
      }
    } else if (Math.abs(wx) > 0.02 || Math.abs(wy) > 0.02) {
      ry += wy; rx = clamp(rx + wx, -75, 75); wy *= 0.93; wx *= 0.9; active = true;
    }
    applyView();
    if (active) schedule3d();
  }
  function applyView() {
    if (!ui?.faces) return;
    ui.scene.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    const a = rx * Math.PI / 180, b = ry * Math.PI / 180;
    const sa = Math.sin(a), ca = Math.cos(a), sb = Math.sin(b), cb = Math.cos(b);
    const rot = v => { const x1 = v[0] * cb + v[2] * sb, y1 = v[1], z1 = -v[0] * sb + v[2] * cb; return [x1, y1 * ca - z1 * sa, y1 * sa + z1 * ca]; };
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const shade = n => clamp((0.8 - dot(n, LIGHT)) / 0.8, 0, 1) * 0.3;
    const nf = rot([0, 0, 1]), nb = [-nf[0], -nf[1], -nf[2]];
    const gloss = (n, mirrored) => {
      const facing = Math.max(0, n[2]);
      const dx = n[0] - HALF[0], dy = n[1] - HALF[1];
      const reach = Math.exp(-(dx * dx + dy * dy) / 0.55);
      let pos = 50 - 300 * dx; if (mirrored) pos = 100 - pos;
      return { pos: clamp(pos, -40, 140), alpha: sheen.gloss * reach * facing * facing * 0.75 };
    };
    const sf = ui.faces.front, sbk = ui.faces.back;
    sf.face.style.setProperty('--sh', shade(nf).toFixed(3));
    sbk.face.style.setProperty('--sh', shade(nb).toFixed(3));
    const gf = gloss(nf, false), gb = gloss(nb, true);
    sf.face.style.setProperty('--gp', gf.pos.toFixed(1) + '%'); sf.face.style.setProperty('--ga', gf.alpha.toFixed(3));
    sbk.face.style.setProperty('--gp', gb.pos.toFixed(1) + '%'); sbk.face.style.setProperty('--ga', gb.alpha.toFixed(3));
    const normals = { right: [1, 0, 0], left: [-1, 0, 0], top: [0, -1, 0], bottom: [0, 1, 0] };
    Object.entries(ui.faces.edges).forEach(([name, el]) => el.style.setProperty('--sh', (0.1 + shade(rot(normals[name])) * 0.9).toFixed(3)));
    // cień na podłożu
    const flat = Math.abs(cb) * Math.abs(ca);
    ui.shadow.style.setProperty('--sx', (0.62 + 0.38 * flat).toFixed(3));
    ui.shadow.style.setProperty('--so', (0.5 - 0.18 * (1 - flat)).toFixed(3));
  }
  let sheen = { gloss: 0.1, note: '' };

  // ---------- odświeżanie ----------
  function currentRotated() {
    const base = parseNet(formatSelect());
    if (!base) return false;
    return rotatedManual === null ? autoRotated(base) : rotatedManual;
  }
  function formatSelect() { return card?.querySelector('#' + product.formatId) || null; }
  function sidesValue() { return product.sidesId ? card?.querySelector('#' + product.sidesId)?.value || '' : ''; }
  function finishValue() { return product.finishId ? card?.querySelector('#' + product.finishId)?.value || '' : ''; }
  function isBackPrinted() { return !/jednostronn|single/i.test(sidesValue()); }

  function refresh(force = false) {
    if (!panel || !panel.isConnected || !ui) return;
    const base = parseNet(formatSelect());
    if (!base) { panel.hidden = true; return; }
    panel.hidden = false;
    const rotated = rotatedManual === null ? autoRotated(base) : rotatedManual;
    const net = rotated ? { w: base.h, h: base.w } : base;
    const backEnabled = isBackPrinted();
    sheen = sheenFor(finishValue());
    const open = ui.details.open;
    const stageW = ui.stage.clientWidth, stageH = ui.stage.clientHeight;
    const pxPerMm = open && stageW > 0 ? Math.min(stageW * 0.66 / net.w, stageH * 0.62 / net.h, 6.2) : 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const wantTex = clamp(Math.round(pxPerMm * Math.max(net.w, net.h) * dpr * 1.3 / 100) * 100, 700, 2000);
    const sig = JSON.stringify([net, rotated, backEnabled, fillFrame, bleedOverride, sheen.gloss, wantTex, open, Math.round(pxPerMm * 10),
      sides.front.version, sides.back.version, sides.front.busy, sides.back.busy, sides.front.error, sides.back.error,
      document.documentElement.lang]);
    if (!force && sig === lastSig) return;
    if (!open) { lastSig = ''; return; }
    lastSig = sig;
    texLong = wantTex || 1000;

    const results = { front: composeFace('front', net, backEnabled), back: composeFace('back', net, backEnabled) };
    ['front', 'back'].forEach(key => {
      const holder = ui.faces[key].holder;
      const canvas = results[key].canvas; canvas.className = 'd24c3-canvas';
      holder.replaceChildren(canvas);
    });
    if (pxPerMm > 0) {
      const W = net.w * pxPerMm, H = net.h * pxPerMm, T = clamp(product.thicknessMm * pxPerMm * 2.2, 2.4, 9);
      ui.stage.style.setProperty('--w', W.toFixed(1) + 'px');
      ui.stage.style.setProperty('--h', H.toFixed(1) + 'px');
      ui.stage.style.setProperty('--t', T.toFixed(1) + 'px');
    }
    ui.busy.hidden = !(sides.front.busy || sides.back.busy);
    ui.orientationLabel.textContent = rotated ? tr('Poziomo', 'Landscape') : tr('Pionowo', 'Portrait');
    renderSide(results, net, rotated, backEnabled);
    applyView();
  }

  function renderSide(results, net, rotated, backEnabled) {
    // pola wgrywania
    ['front', 'back'].forEach(key => {
      const side = sides[key];
      const slot = panel.querySelector(`[data-slot="${key}"]`);
      const text = panel.querySelector(`[data-slot-text="${key}"]`);
      const thumb = panel.querySelector(`[data-thumb="${key}"]`);
      const input = panel.querySelector(`[data-input="${key}"]`);
      slot.classList.toggle('has-file', Boolean(side.file));
      input.disabled = false;
      panel.querySelector(`[data-clear="${key}"]`).hidden = !side.file;
      if (side.busy) text.textContent = tr('Wczytywanie…', 'Loading…');
      else if (side.file) {
        const kb = side.file.size / 1024;
        text.textContent = `${side.name} · ${kb < 1024 ? readable(kb, 0) + ' KB' : readable(kb / 1024, 1) + ' MB'}`;
      } else if (key === 'back' && !backEnabled) text.textContent = tr('Opcjonalnie — przy zadruku jednostronnym tył zostanie biały', 'Optional — with single-sided print the back stays blank');
      else text.textContent = tr('Wybierz lub upuść plik', 'Choose or drop a file');
      thumb.replaceChildren();
      if (side.file && results[key].canvas) {
        const c = document.createElement('canvas'), src = results[key].canvas;
        c.width = 120; c.height = Math.max(2, Math.round(120 * src.height / src.width));
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        thumb.appendChild(c);
      } else { const plus = document.createElement('i'); plus.textContent = '+'; thumb.appendChild(plus); }
    });

    // wymiary
    ui.dims.replaceChildren();
    const addDim = (label, value) => {
      const item = document.createElement('div'); item.className = 'd24-preview-dimension';
      const s = document.createElement('span'); s.textContent = label;
      const v = document.createElement('strong'); v.textContent = value;
      item.append(s, v); ui.dims.append(item);
    };
    addDim(tr('Format netto', 'Trim size'), `${readable(Math.max(net.w, net.h))} × ${readable(Math.min(net.w, net.h))} mm`);
    addDim(tr('Orientacja', 'Orientation'), rotated ? tr('Pionowa', 'Portrait') : tr('Pozioma', 'Landscape'));

    // przełączniki
    const anySrc = Boolean(sides.front.src || sides.back.src);
    const anyImage = ['front', 'back'].some(key => sides[key].src);
    ui.bleedRow.hidden = !anySrc; ui.fillRow.hidden = !anyImage;
    const detected = ['front', 'back'].some(key => sides[key].src && detectBleed(sides[key].src, net));
    ui.bleed.checked = bleedOverride === null ? detected : bleedOverride;
    ui.fill.checked = fillFrame;

    // uwagi
    ui.notes.replaceChildren();
    const addNote = (text, kind) => {
      if (!text) return;
      const p = document.createElement('p'); p.className = 'd24-preview-resolution' + (kind === 'warn' ? ' d24-preview-mismatch' : kind === 'error' ? ' d24-preview-mismatch d24c3-error' : '');
      p.textContent = text; ui.notes.append(p);
    };
    ['front', 'back'].forEach(key => {
      const side = sides[key], label = key === 'front' ? tr('Przód', 'Front') : tr('Tył', 'Back');
      if (side.error) addNote(`${label}: ${side.error}`, 'error');
      if (!side.src || !results[key].info) return;
      const { rect, dpi } = results[key].info;
      const parts = [label];
      if (side.src.isPdf) parts.push(tr(`PDF, strona ${side.src.pageNumber}: ${readable(side.src.mmW)} × ${readable(side.src.mmH)} mm`, `PDF, page ${side.src.pageNumber}: ${readable(side.src.mmW)} × ${readable(side.src.mmH)} mm`));
      else parts.push(`${side.src.w} × ${side.src.h} px`);
      if (rect.bleed) parts.push(tr('spad 1,5 mm obcięty', '1.5 mm bleed trimmed'));
      if (dpi) {
        const quality = dpi < 150 ? tr('może być za niska do druku', 'may be too low for print') : dpi < 300 ? tr('sprawdź jakość przed drukiem', 'check quality before printing') : tr('rozdzielczość odpowiednia', 'resolution is fine');
        parts.push(`≈ ${dpi} DPI — ${quality}`);
      }
      addNote(parts.join(' · '));
      if (side.note) addNote(side.note);
      if (rect.mismatch && !fillFrame) addNote(`${label}: ${tr('proporcje pliku i formatu różnią się — na podglądzie widać białe pola. Zaznacz „Wypełnij format”, aby zobaczyć przycięcie.', 'artwork and card proportions differ — white margins are shown. Tick “Fill frame” to see the crop.')}`, 'warn');
      if (rect.mismatch && fillFrame) addNote(`${label}: ${tr('proporcje pliku i formatu różnią się — fragment projektu zostanie przycięty.', 'artwork and card proportions differ — part of the design will be cropped.')}`, 'warn');
    });
    if (!backEnabled && sides.back.src) addNote(tr('Wybrano zadruk jednostronny — wycena nie obejmuje druku tyłu. Zmień „Zadruk” na „Dwustronne”, jeśli tył ma być zadrukowany.', 'Single-sided print is selected — the quote does not include printing the back. Change “Zadruk” to double-sided if the back should be printed.'), 'warn');
    if (!sides.front.file && !sides.back.file && !sides.front.error && !sides.back.error) addNote(tr('Nie wgrano jeszcze plików — na karcie widać pusty wzór Druk24.', 'No files yet — the card shows an empty Druk24 placeholder.'));
    if (sheen.note) addNote(sheen.note);

    ui.footer.textContent = tr('Pliki zostają w Twojej przeglądarce i nie są wysyłane. Aby dołączyć projekt do zamówienia, wybierz go ponownie w koszyku. Grubość karty jest powiększona dla czytelności, a kolory na ekranie mogą różnić się od druku.',
      'Files stay in your browser and are not uploaded. To attach artwork to your order, choose it again in the cart. Card thickness is exaggerated for clarity and screen colours may differ from print.');
  }

  // ---------- cykl życia ----------
  function teardown() {
    if (panel) { panel.remove(); }
    sides.front.token += 1; sides.back.token += 1;
    panel = null; ui = null; card = null; product = null;
    sides = { front: emptySide(), back: emptySide() };
    rotatedManual = null; bleedOverride = null; fillFrame = false; lastSig = '';
    rx = REST.rx; ry = REST.ry; wx = wy = 0; target = null; interacted = false; idleOn = false; dragging = null;
  }
  function decorate() {
    scheduled = false;
    if (document.body.classList.contains('is-home-page')) { if (card) teardown(); return; }
    const current = content.querySelector(':scope > .card');
    const match = current && PRODUCTS.find(p => current.querySelector('#' + p.formatId));
    if (!match) { if (card) teardown(); return; }
    if (card !== current) { teardown(); card = current; product = match; }
    const grid = card.querySelector(':scope > .form-grid');
    if (!grid) return;
    if (!panel || !panel.isConnected) { mountPanel(grid); lastSig = ''; }
    // „Podgląd 3D” ma być zaraz pod formularzem, przed schematem 2D.
    // 0.26.24v: jeśli jest generator wizytówek (tuż pod formularzem), podgląd 3D układa się zaraz pod nim.
    const lead = card.querySelector(':scope > .d24cg-entry') || grid;
    if (lead.nextElementSibling !== panel) lead.after(panel);
    refresh();
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(decorate); }

  new MutationObserver(mutations => {
    if (mutations.every(m => m.target.closest?.('.d24c3-panel'))) return;
    schedule();
  }).observe(content, { childList: true, subtree: true });
  new MutationObserver(() => { if (panel) { const grid = card?.querySelector(':scope > .form-grid'); if (grid) { mountPanel(grid); lastSig = ''; refresh(true); } } })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  const onFormChange = event => { if (!event.target.closest?.('.d24c3-panel')) schedule(); };
  content.addEventListener('input', onFormChange, true);
  content.addEventListener('change', onFormChange, true);
  window.addEventListener('pagehide', () => { sides.front.token += 1; sides.back.token += 1; });

  // Publiczne API (np. do dołączania plików do zamówienia): pliki wgrane w podglądzie 3D.
  window.Druk24Card3D = {
    getFiles() { return [sides.front.file, sides.back.file].filter((file, i, all) => file && all.indexOf(file) === i); },
    open() { if (ui?.details) ui.details.open = true; },
    setFiles(front, back) { if (front) handleFiles([front], 'front'); if (back) handleFiles([back], 'back'); }
  };
  schedule();
})();
