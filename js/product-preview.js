/* Drukulator 0.23.2v (0.25.2: plik z kalkulatora obrazów w podglądzie) — local, optional product visualizer.
 * No price/order mutations, no outbound requests, no external libraries.
 * Chosen preview file is NOT an order attachment: attach it in the cart.
 */
(() => {
  'use strict';
  const content = document.getElementById('content');
  if (!content) return;
  const tr = (pl, en) => document.documentElement.lang === 'en' ? en : pl;
  const MAX_PREVIEW_BYTES = 50 * 1024 * 1024;
  const MM = {
    A0:[841,1189],A1:[594,841],A2:[420,594],A3:[297,420],A4:[210,297],
    A5:[148,210],A6:[105,148],A7:[74,105],B0:[1000,1414],B1:[707,1000],
    B2:[500,707],B3:[353,500],B4:[250,353],B5:[176,250],DL:[99,210],
    SRA3:[320,450],SRA4:[225,320]
  };
  const PAIRS = [
    ['bannerWidth','bannerHeight',10], ['stickWidth','stickHeight',1],
    ['posterWidth','posterHeight',10], ['pvcWidth','pvcHeight',10],
    ['digWidth','digHeight',1], ['canvasWidth','canvasHeight',10]
  ];
  // Only specific paper workflows have a standard 1.5 mm bleed diagram.
  const BLEED_IDS = new Set(['bcFormat','flyFormat','posterFormat','digFormat','digWidth','noteFormat',
    'weddingFormat','hospitalityFormat','companyFormat','catalogFormat']);
  const FORMAT_IDS = [
    'bcFormat','flyFormat','posterFormat','noteFormat','foamFormat','digFormat',
    'canvasFormat','weddingFormat','hospitalityFormat','lamFormat','calendarFormat'
  ];
  let currentCard = null;
  let currentPanel = null;
  let currentFile = null;
  let fileUrl = null;
  let filePixels = null;
  let rotated = false;
  let showBleed = true;
  let coverImage = false;
  let lastSignature = '';
  let scheduled = false;
  // 0.25.2: plik wgrany w kalkulatorze („Dopasuj do zdjęcia”) pokazujemy w podglądzie bez drugiego wgrywania.
  let externalFile = false;

  function cleanupFile() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    fileUrl = null;
    currentFile = null;
    filePixels = null;
    externalFile = false;
  }
  function readable(n, max = 1) {
    return new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'pl-PL',
      {maximumFractionDigits:max}).format(n);
  }
  function escapeSelectorId(id) { return document.getElementById(id); }
  function visibleInput(id, card) {
    const element = escapeSelectorId(id);
    if (!element || !card.contains(element) || element.disabled || element.hidden || element.closest('.hidden')) return null;
    if (element.closest('[style*="display: none"]')) return null;
    return element;
  }
  function parsePositive(element) {
    const n = Number(String(element.value).replace(',', '.'));
    return Number.isFinite(n) && n > 0 && n <= 100000 ? n : null;
  }
  function parseFormat(str, id) {
    if (!str) return null;
    const text = String(str).replace(/\u00a0/g,' ');
    // Prefer explicit numeric dimensions, which might precede a named A format.
    const match = text.match(/(\d{1,5}(?:[.,]\d+)?)\s*[x×]\s*(\d{1,5}(?:[.,]\d+)?)\s*(mm|cm|m)?\b/i)
      || text.match(/(\d{1,5}(?:[.,]\d+)?)\s*[x×]\s*(\d{1,5}(?:[.,]\d+)?)(?:\s|$)/i);
    if (match) {
      const first = Number(match[1].replace(',','.'));
      const second = Number(match[2].replace(',','.'));
      // mm is default for business cards; canvas and custom boards normally use cm.
      const unit = (match[3] || (id === 'canvasFormat' ? 'cm' : id === 'bcFormat' ? 'mm' : '')).toLowerCase();
      if (!unit) {
        // Numeric-only dimensions without a known unit must not be presented as exact.
        return null;
      }
      const scale = unit === 'm' ? 1000 : unit === 'cm' ? 10 : 1;
      return first > 0 && second > 0 ? {w:first*scale,h:second*scale} : null;
    }
    const folded = text.toUpperCase().match(/\b(?:A[0-7]|B[0-5]|DL)\s+DO\s+(A[0-7]|B[0-5]|DL)\b/);
    if (folded && MM[folded[1]]) return {w:MM[folded[1]][0],h:MM[folded[1]][1]};
    const named = text.toUpperCase().match(/\b(SRA[34]|A[0-7]|B[0-5]|DL)\b/);
    if (named && MM[named[1]]) return {w:MM[named[1]][0],h:MM[named[1]][1]};
    return null;
  }
  function dimensionsFor(card) {
    // Hidden/dynamic option groups are never treated as authoritative.
    for (const [widthId,heightId,scale] of PAIRS) {
      const width = visibleInput(widthId,card), height = visibleInput(heightId,card);
      if (!width || !height) continue;
      const w = parsePositive(width), h = parsePositive(height);
      if (w && h) {
        const result = {w:w*scale,h:h*scale,source:`${widthId}/${heightId}`};
        // 0.24.2: obrazy na płótnie — własny wymiar pokazujemy jako format, według którego liczona jest cena
        // (np. wpisane 70 × 104 cm → 70 × 110 cm).
        if (widthId === 'canvasWidth') {
          const billing = window.Druk24CanvasBilling?.(w,h);
          if (billing) {
            result.w = billing.displayWidthCm * 10;
            result.h = billing.displayHeightCm * 10;
            result.requested = {w,h};
          }
        }
        return result;
      }
    }
    // 0.25.2: „Dopasuj do zdjęcia” — rozmiar wybranego proponowanego formatu (lub boku z zachowaniem proporcji).
    if (visibleInput('canvasFile',card)) {
      const fit = window.Druk24CanvasFit?.();
      if (fit && fit.widthCm > 0 && fit.heightCm > 0) {
        const result = {w:fit.widthCm*10,h:fit.heightCm*10,source:'canvasFit'};
        if (fit.requested) { result.requested = fit.requested; result.proportional = Boolean(fit.proportional); }
        return result;
      }
    }
    for (const id of FORMAT_IDS) {
      const select = visibleInput(id,card);
      if (!select) continue;
      const name = select.selectedOptions?.[0]?.textContent || select.value;
      const parsed = parseFormat(name,id) || parseFormat(select.value,id);
      if (parsed) return {...parsed,source:id};
    }
    // Generic selectors using a name like vendorFormat, as long as label says Format.
    const grid = card.querySelector(':scope > .form-grid');
    for (const field of grid?.querySelectorAll('.field') || []) {
      if (!/format/i.test(field.querySelector(':scope > label')?.textContent || '')) continue;
      const select = field.querySelector('select');
      if (!select || !visibleInput(select.id,card)) continue;
      const parsed = parseFormat(select.selectedOptions?.[0]?.textContent || select.value, select.id);
      if (parsed) return {...parsed,source:select.id};
    }
    return null;
  }
  function bleedEligible(card, dimensions) {
    if (!dimensions) return false;
    if (BLEED_IDS.has(dimensions.source)) return true;
    return /^(fly|bc|poster|dig|note|wedding)/.test(dimensions.source);
  }
  function panelMarkup() {
    return `<details class="d24-fold d24-preview-fold">
    <summary class="d24-fold__summary"><span class="d24-fold__label">▣ ${tr('Podgląd wydruku','Print preview')}</span><span class="d24-fold__hint">${tr('Format, spady i plik projektu','Size, bleed and artwork')}</span><span class="d24-fold__chevron" aria-hidden="true">⌄</span></summary>
    <div class="d24-fold__body"><div class="d24-preview-header">
      <div><span class="d24-preview-eyebrow">${tr('KONTROLA FORMATU','SIZE CHECK')}</span>
      <h3>${tr('Podgląd produktu','Product preview')}</h3>
      <p>${tr('Wizualizacja poglądowa — nie wpływa na cenę ani przesyłane zamówienie.','Illustrative only — does not affect the quote or order.')}</p></div>
      <span class="d24-preview-local">${tr('Tylko w przeglądarce','Browser only')}</span>
    </div>
    <div class="d24-preview-layout">
      <div class="d24-preview-stage" aria-label="${tr('Schemat rozmiaru produktu','Product size diagram')}">
        <div class="d24-preview-sheet" id="d24PreviewSheet">
          <div class="d24-preview-art" id="d24PreviewArt"><span class="d24-preview-mark">DRUK<span>24</span></span><small>${tr('TWÓJ PROJEKT','YOUR DESIGN')}</small></div>
          <div class="d24-preview-file-render" id="d24PreviewFileRender"></div>
          <div class="d24-preview-trim" id="d24PreviewTrim"><span>NETTO</span></div>
        </div>
      </div>
      <div class="d24-preview-side">
        <div class="d24-preview-dims" id="d24PreviewDims" aria-live="polite"></div>
        <div class="d24-preview-actions">
          <button type="button" class="d24-preview-rotate" id="d24PreviewRotate">↻ ${tr('Obróć widok','Rotate view')}</button>
          <label class="d24-preview-switch" id="d24PreviewBleedRow"><input type="checkbox" id="d24PreviewBleed" checked> ${tr('Pokaż spad 1,5 mm','Show 1.5 mm bleed')}</label>
          <label class="d24-preview-switch" id="d24PreviewCoverRow" hidden><input type="checkbox" id="d24PreviewCover"> ${tr('Wypełnij format (przycięcie)','Fill frame (crop)')}</label>
        </div>
        <div class="d24-preview-upload">
          <label for="d24PreviewFile"><strong>${tr('Sprawdź swój projekt','Preview your artwork')}</strong><small>JPG, PNG, WebP, PDF — max. 50 MB</small></label>
          <input id="d24PreviewFile" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf">
          <p id="d24PreviewFileInfo" role="status" aria-live="polite">${tr('Plik nie jest wysyłany. Aby dołączyć go do zapytania, wybierz go ponownie w koszyku.','No upload occurs. To attach the file to your request, choose it again in the cart.')}</p>
          <button id="d24PreviewClear" type="button" hidden>${tr('Usuń podgląd pliku','Clear file preview')}</button>
        </div>
      </div>
    </div>
    <p class="d24-preview-footer" id="d24PreviewFooter">${tr('Linia przerywana pokazuje obszar po przycięciu. Spad jest schematycznie powiększony.','Dashed line shows the trim area. Bleed is enlarged for clarity.')}</p></div></details>`;
  }
  function setup(card) {
    if (currentCard !== card) {
      cleanupFile(); rotated = false; showBleed = true; coverImage = false;
      currentCard = card; currentPanel = null; lastSignature = '';
    }
    if (currentPanel && currentPanel.isConnected) return;
    const grid = card.querySelector(':scope > .form-grid');
    if (!grid) return;
    currentPanel = document.createElement('section');
    currentPanel.className = 'd24-preview-panel';
    currentPanel.setAttribute('aria-label',tr('Podgląd produktu','Product preview'));
    currentPanel.innerHTML = panelMarkup();
    grid.after(currentPanel);
    currentPanel.querySelector('#d24PreviewRotate').addEventListener('click', () => {rotated = !rotated; draw(true);});
    currentPanel.querySelector('#d24PreviewBleed').addEventListener('change', e => {showBleed = e.target.checked; draw(true);});
    currentPanel.querySelector('#d24PreviewCover').addEventListener('change', e => {coverImage = e.target.checked; draw(true);});
    currentPanel.querySelector('#d24PreviewFile').addEventListener('change', onFileSelected);
    currentPanel.querySelector('#d24PreviewClear').addEventListener('click', () => {
      cleanupFile(); currentPanel.querySelector('#d24PreviewFile').value = '';
      draw(true);
    });
  }
  function infoForFile() {
    if (!currentFile) return tr('Plik nie jest wysyłany. Aby dołączyć go do zapytania, wybierz go ponownie w koszyku.','No upload occurs. To attach the file to your request, choose it again in the cart.');
    const kb = currentFile.size / 1024;
    const size = kb < 1024 ? `${readable(kb,0)} KB` : `${readable(kb/1024,1)} MB`;
    let line = `${currentFile.name} · ${size}`;
    if (filePixels) line += ` · ${filePixels.w} × ${filePixels.h} px`;
    if (externalFile) line += ` — ${tr('wgrany w kalkulatorze powyżej, nie trzeba go wgrywać ponownie','uploaded in the calculator above, no need to upload it again')}`;
    return line;
  }
  function onFileSelected(event) {
    loadFile(event.target.files?.[0], {input:event.target});
  }
  // Wspólna ścieżka dla pola „Sprawdź swój projekt” i pliku przekazanego z kalkulatora (opts.external).
  function loadFile(file, opts = {}) {
    cleanupFile();
    const input = opts.input || null;
    const external = Boolean(opts.external);
    if (!file) { draw(true); return false; }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isPdf = ext === 'pdf' && (file.type === 'application/pdf' || !file.type);
    const imageExt = ['jpg','jpeg','png','webp'];
    const isImage = imageExt.includes(ext) && (!file.type || ['image/jpeg','image/png','image/webp'].includes(file.type));
    if ((!isPdf && !isImage) || file.size > MAX_PREVIEW_BYTES || file.size === 0) {
      if (input) input.value = '';
      if (external) { draw(true); return false; }
      const text = tr('Nieobsługiwany format lub plik większy niż 50 MB. Podgląd nie został wczytany.','Unsupported format or file over 50 MB. Preview not loaded.');
      currentPanel.querySelector('#d24PreviewFileInfo').textContent = text;
      return false;
    }
    currentFile = file;
    externalFile = external;
    fileUrl = URL.createObjectURL(file);
    if (isImage) {
      const url = fileUrl;
      const image = new Image();
      image.onload = () => {
        if (fileUrl !== url) return;
        filePixels = {w:image.naturalWidth,h:image.naturalHeight};
        draw(true);
      };
      image.onerror = () => {
        if (fileUrl !== url) return;
        cleanupFile(); if (input) input.value = '';
        draw(true);
        if (!external) currentPanel.querySelector('#d24PreviewFileInfo').textContent = tr('Nie można odczytać obrazu.','Unable to read this image.');
      };
      image.src = url;
    }
    draw(true);
    return true;
  }
  // Publiczne API dla kalkulatora obrazów na płótnie: pokaż wgrany tam plik w podglądzie i otwórz podgląd.
  window.Druk24Preview = {
    setFile(file, opts = {}) {
      if (!currentPanel || !currentPanel.isConnected) decorate();
      if (!currentPanel || !currentPanel.isConnected) return false;
      const ok = loadFile(file, {external:opts.external !== false});
      if (ok) {
        const fold = currentPanel.querySelector('details.d24-preview-fold');
        if (fold) fold.open = true;
      }
      return ok;
    },
    clearFile(opts = {}) {
      if (!currentPanel || !currentPanel.isConnected) return;
      if (opts.externalOnly && !externalFile) return;
      cleanupFile();
      const input = currentPanel.querySelector('#d24PreviewFile');
      if (input) input.value = '';
      draw(true);
    }
  };
  function draw(force = false) {
    if (!currentPanel || !currentPanel.isConnected || !currentCard) return;
    const dimensions = dimensionsFor(currentCard);
    const signature = JSON.stringify([dimensions,rotated,showBleed,coverImage,fileUrl,filePixels,externalFile,document.documentElement.lang]);
    if (!force && signature === lastSignature) return;
    lastSignature = signature;
    const bleedPossible = bleedEligible(currentCard,dimensions);
    const activeBleed = bleedPossible && showBleed;
    const net = dimensions ? {w:rotated ? dimensions.h : dimensions.w,h:rotated ? dimensions.w : dimensions.h} : null;
    let displayW = net?.w || filePixels?.w || 210;
    let displayH = net?.h || filePixels?.h || 297;
    if (!net && rotated) [displayW,displayH] = [displayH,displayW];
    const grossW = displayW + (activeBleed ? 3 : 0), grossH = displayH + (activeBleed ? 3 : 0);
    const sheet = currentPanel.querySelector('#d24PreviewSheet');
    const ratio = Math.max(.08,Math.min(12,grossW/grossH));
    sheet.style.setProperty('--d24-ratio',String(ratio));
    // Avoid unsupported CSS calc multiplication syntax on older Safari/Chromium.
    const maxH = matchMedia('(max-width:540px)').matches ? 195 : 228;
    sheet.style.width = `${Math.max(16, Math.min(maxH * ratio, 360))}px`; 
    sheet.style.setProperty('--d24-trim-x',`${activeBleed ? Math.max(1.5,1.5/grossW*100) : 0}%`);
    sheet.style.setProperty('--d24-trim-y',`${activeBleed ? Math.max(1.5,1.5/grossH*100) : 0}%`);
    sheet.classList.toggle('has-file', Boolean(fileUrl));
    sheet.classList.toggle('has-bleed',activeBleed);
    currentPanel.querySelector('#d24PreviewTrim').hidden = !activeBleed;
    const dims = currentPanel.querySelector('#d24PreviewDims');
    dims.replaceChildren();
    const addDimension = (label,text) => {
      const item = document.createElement('div'); item.className='d24-preview-dimension';
      const small = document.createElement('span'); small.textContent=label;
      const value = document.createElement('strong'); value.textContent=text;
      item.append(small,value); dims.append(item);
    };
    // 0.24.3: obrazy, PCV i pianki — wymiary w cm (tak jak pola i cennik na tych stronach), reszta w mm.
    const useCm = /^(canvas|pvc|foam)/.test(dimensions?.source || '');
    const sizeText = (w,h) => useCm ? `${readable(w/10)} × ${readable(h/10)} cm` : `${readable(w)} × ${readable(h)} mm`;
    if (net) {
      addDimension(tr('Format netto','Trim size'),sizeText(net.w,net.h));
      if (activeBleed) addDimension(tr('Z plikiem na spad','With bleed'),sizeText(grossW,grossH));
      addDimension(tr('Orientacja podglądu','Preview orientation'),displayW > displayH ? tr('Pozioma','Landscape') : displayW < displayH ? tr('Pionowa','Portrait') : tr('Kwadratowa','Square'));
    } else {
      addDimension(tr('Format produktu','Product size'),tr('Brak wymiarów w wybranej opcji','Not specified by selected options'));
      addDimension(tr('Widok','Diagram'),tr('Schemat poglądowy','Illustration only'));
    }
    const imageLayer = currentPanel.querySelector('#d24PreviewFileRender');
    const fileIsPdf = /\.pdf$/i.test(currentFile?.name || '');
    const imageSignature = `${fileUrl || ''}:${coverImage}:${fileIsPdf}`;
    // Keep the same PDF/embed alive while numeric dimensions are being edited.
    if (imageLayer.dataset.signature !== imageSignature) {
      imageLayer.dataset.signature = imageSignature;
      imageLayer.replaceChildren();
      if (fileUrl && currentFile) {
        if (fileIsPdf) {
          const object = document.createElement('object');
          object.type='application/pdf'; object.data=fileUrl+'#toolbar=0&navpanes=0&view=Fit';
          object.setAttribute('aria-label',tr('Podgląd pliku PDF','PDF file preview'));
          const fallback = document.createElement('span'); fallback.className = 'd24-preview-pdf-fallback';
          fallback.textContent=tr('PDF — podgląd zależy od przeglądarki.','PDF — preview depends on your browser.');
          object.append(fallback); imageLayer.append(object);
        } else {
          const img=document.createElement('img'); img.alt=tr('Podgląd wybranego projektu','Selected artwork preview');
          img.src=fileUrl; img.style.objectFit=coverImage ? 'cover' : 'contain';
          imageLayer.append(img);
        }
      }
    }
    currentPanel.querySelector('#d24PreviewBleedRow').hidden = !bleedPossible;
    currentPanel.querySelector('#d24PreviewBleed').checked=showBleed;
    currentPanel.querySelector('#d24PreviewRotate').disabled=!net && !filePixels;
    currentPanel.querySelector('#d24PreviewCoverRow').hidden=!fileUrl || /\.pdf$/i.test(currentFile?.name || '');
    currentPanel.querySelector('#d24PreviewCover').checked=coverImage;
    currentPanel.querySelector('#d24PreviewFileInfo').textContent=infoForFile();
    currentPanel.querySelector('#d24PreviewClear').hidden=!fileUrl || externalFile;
    const upload = currentPanel.querySelector('.d24-preview-upload');
    upload.classList.toggle('is-external',externalFile);
    upload.querySelector('label strong').textContent = externalFile ? tr('Twój wgrany plik','Your uploaded file') : tr('Sprawdź swój projekt','Preview your artwork');
    upload.querySelector('label small').textContent = externalFile ? tr('Ten sam plik, który wgrano w kalkulatorze','The file you uploaded in the calculator') : 'JPG, PNG, WebP, PDF — max. 50 MB';
    const footer=currentPanel.querySelector('#d24PreviewFooter');
    if (!net) footer.textContent=tr('W tym produkcie nie ma jednoznacznego formatu. Podgląd obrazu nie określa wielkości zamówienia.','This product has no unambiguous dimensions. Artwork preview does not define the order size.');
    else if (activeBleed) footer.textContent=tr('Linia przerywana = cięcie do netto. Spad 1,5 mm z każdej strony jest powiększony dla czytelności.','Dashed line = final trim. 1.5 mm bleed on each side is enlarged for visibility.');
    else footer.textContent=tr('Podgląd i obrót nie zmieniają parametrów ani ceny zamówienia.','Preview and rotation do not change the order options or price.');
    if (dimensions?.requested && net) {
      const sameSize = Math.abs(dimensions.requested.w * 10 - dimensions.w) < 0.5 && Math.abs(dimensions.requested.h * 10 - dimensions.h) < 0.5;
      if (!sameSize) {
        const note = document.createElement('p'); note.className = 'd24-preview-resolution';
        note.textContent = dimensions.proportional
          ? tr(`Wymiar z zachowaniem proporcji ${readable(dimensions.requested.w)} × ${readable(dimensions.requested.h)} cm jest rozliczany jako najbliższy większy format z cennika.`,`The proportional size ${readable(dimensions.requested.w)} × ${readable(dimensions.requested.h)} cm is priced as the nearest larger format in the price list.`)
          : tr(`Wpisany wymiar ${readable(dimensions.requested.w)} × ${readable(dimensions.requested.h)} cm jest rozliczany jako najbliższy większy format z cennika.`,`The entered size ${readable(dimensions.requested.w)} × ${readable(dimensions.requested.h)} cm is priced as the nearest larger format in the price list.`);
        dims.append(note);
      }
    }
    if (filePixels && net) {
      const dpiX = Math.round(25.4*filePixels.w/net.w), dpiY = Math.round(25.4*filePixels.h/net.h);
      const dpiMin = Math.min(dpiX,dpiY);
      const quality=document.createElement('p'); quality.className='d24-preview-resolution';
      quality.textContent=tr('Orientacyjna rozdzielczość przy tym formacie:','Approximate resolution at this size:') + ` ${dpiX} × ${dpiY} DPI. ` +
        (dpiMin < 150 ? tr('Może być niewystarczająca do druku.','May be too low for print.') : dpiMin < 300 ? tr('Sprawdź jakość przed drukiem.','Check print quality.') : tr('Odpowiednia rozdzielczość dla wielu zastosowań.','Suitable resolution for many uses.'));
      dims.append(quality);
      const fileRatio=filePixels.w/filePixels.h, paperRatio=net.w/net.h;
      if (Math.abs(fileRatio/paperRatio-1) > .035) {
        const mismatch=document.createElement('p'); mismatch.className='d24-preview-mismatch';
        mismatch.textContent=tr('Proporcje pliku i formatu różnią się — możliwe białe marginesy lub przycięcie.','Artwork and product aspect ratios differ — blank margins or cropping may occur.');
        dims.append(mismatch);
      }
    }
  }
  function decorate() {
    scheduled=false;
    if (document.body.classList.contains('is-home-page')) {
      if (currentPanel && !currentPanel.isConnected) {cleanupFile(); currentCard=null; currentPanel=null;}
      return;
    }
    const card=content.querySelector(':scope > .card');
    if (!card?.querySelector(':scope > .form-grid')) return;
    const pageName=content.querySelector('.page-header h2')?.textContent || '';
    if (/edycja cen|edycja wyszukiwarki|statystyki|price editor|analytics|koszulki, odzież/i.test(pageName)) {
      if (currentPanel?.isConnected) { currentPanel.remove(); cleanupFile(); currentCard = null; currentPanel = null; }
      return;
    }
    setup(card); draw();
  }
  function schedule() { if (scheduled) return; scheduled=true; requestAnimationFrame(decorate); }
  new MutationObserver(mutations => {
    // Changes inside our own preview should not trigger redundant recalculation loops.
    if (mutations.every(m => m.target.closest?.('.d24-preview-panel'))) return;
    schedule();
  }).observe(content,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  content.addEventListener('input',e=>{if (!e.target.closest('.d24-preview-panel')) schedule();},true);
  content.addEventListener('change',e=>{if (!e.target.closest('.d24-preview-panel')) schedule();},true);
  window.addEventListener('pagehide',cleanupFile);
  schedule();
})();
