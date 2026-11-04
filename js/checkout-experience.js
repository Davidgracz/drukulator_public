/* Drukulator 0.23.3 — client-side cart and attachment experience.
   Only UI/inspection: the existing PHP upload, validation, cart, and mail paths remain authoritative. */
(function () {
  'use strict';
  const entries = new Map();
  let hooks = null;
  let overlay = null;
  let previousFocus = null;
  const imageTypes = new Set(['jpg','jpeg','png','webp']);
  const fmt = n => Number(n).toLocaleString('pl-PL', {maximumFractionDigits: 1});
  const sizeText = n => n < 1048576 ? `${fmt(n/1024)} KB` : `${fmt(n/1048576)} MB`;
  const escapeHTML = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const extension = file => (String(file.name || '').split('.').pop() || '').toLowerCase();

  function releaseRemoved(files) {
    const keep = new Set(files);
    for (const [file, entry] of entries) {
      if (!keep.has(file)) {
        URL.revokeObjectURL(entry.url);
        entries.delete(file);
      }
    }
  }
  function clear() {
    closePreview();
    for (const item of entries.values()) URL.revokeObjectURL(item.url);
    entries.clear();
  }
  function findTarget() {
    if (!hooks || hooks.getCart().length !== 1) return null;
    const description = `${hooks.getCart()[0].description || ''}`;
    const match = description.match(/(\d{1,4}(?:[.,]\d+)?)\s*[×xX]\s*(\d{1,4}(?:[.,]\d+)?)\s*(mm|cm)\b/i);
    if (!match) return null;
    const factor = match[3].toLowerCase() === 'cm' ? 10 : 1;
    const width = Number(match[1].replace(',','.')) * factor;
    const height = Number(match[2].replace(',','.')) * factor;
    return width > 0 && height > 0 && width <= 10000 && height <= 10000 ? {width, height} : null;
  }
  function imageQuality(width, height) {
    const target = findTarget();
    if (target) {
      const dpi1 = Math.min(width/target.width, height/target.height) * 25.4;
      const dpi2 = Math.min(width/target.height, height/target.width) * 25.4;
      const dpi = Math.round(Math.max(dpi1, dpi2));
      return {text:`Około ${dpi} DPI dla formatu ${fmt(target.width)} × ${fmt(target.height)} mm (orientacyjnie, bez spadów).`,
        warning: dpi < 150 ? 'Niska rozdzielczość przy wybranym formacie — sprawdź plik.' : dpi < 250 ? 'Rozdzielczość może być niewystarczająca do drobnego tekstu.' : ''};
    }
    return {text:`Przy 300 DPI obraz odpowiada ok. ${fmt(width * 25.4 / 300)} × ${fmt(height * 25.4 / 300)} mm.`,
      warning:''};
  }
  function entryFor(file) {
    if (entries.has(file)) return entries.get(file);
    const ext = extension(file);
    const kind = imageTypes.has(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'other';
    const entry = {kind, url: URL.createObjectURL(file), state: kind === 'image' ? 'loading' : 'ready', width:0, height:0};
    entries.set(file, entry);
    if (kind === 'image') {
      const preview = new Image();
      preview.onload = () => {
        entry.width = preview.naturalWidth;
        entry.height = preview.naturalHeight;
        entry.state = 'ready';
        if (hooks && hooks.getFiles().includes(file)) renderFiles();
      };
      preview.onerror = () => {
        entry.state = 'failed';
        if (hooks && hooks.getFiles().includes(file)) renderFiles();
      };
      preview.src = entry.url;
    }
    return entry;
  }
  function renderFiles() {
    if (!hooks) return;
    const list = document.getElementById('orderFileList');
    const meter = document.getElementById('d24FileMeter');
    if (!list) return;
    const files = hooks.getFiles();
    releaseRemoved(files);
    const total = files.reduce((sum, file) => sum + file.size, 0);
    if (meter) {
      const count = meter.querySelector('[data-file-count]');
      const bar = meter.querySelector('[data-file-bar]');
      const usage = meter.querySelector('[data-file-usage]');
      if (count) count.textContent = `${files.length} / 5 plików`;
      if (usage) usage.textContent = `${sizeText(total)} / 50 MB`;
      if (bar) bar.style.width = `${Math.min(100, total / (50 * 1048576) * 100)}%`;
    }
    if (!files.length) {
      list.innerHTML = `<p class="d24-files-empty">Nie dodano plików. Możesz wysłać zamówienie bez załączników i dosłać projekt później.</p>`;
      return;
    }
    list.innerHTML = files.map((file, index) => {
      const entry = entryFor(file);
      const ext = extension(file);
      const thumb = entry.kind === 'image' && entry.state !== 'failed'
        ? `<img src="${entry.url}" alt="" loading="lazy">`
        : `<span aria-hidden="true">${ext === 'pdf' ? 'PDF' : escapeHTML(ext.slice(0, 4).toUpperCase())}</span>`;
      let info = `${sizeText(file.size)} · ${escapeHTML(ext.toUpperCase())}`;
      let check = '';
      if (entry.kind === 'image' && entry.state === 'ready') {
        info += ` · ${entry.width} × ${entry.height} px`;
        const quality = imageQuality(entry.width, entry.height);
        check = `<p class="d24-file-check ${quality.warning ? 'is-warning' : ''}">${escapeHTML(quality.text)}${quality.warning ? `<br><strong>${escapeHTML(quality.warning)}</strong>` : ''}</p>`;
      } else if (entry.kind === 'pdf') {
        check = '<p class="d24-file-check">PDF: sprawdź format stron, spady i osadzenie czcionek przed drukiem.</p>';
      } else if (entry.kind === 'other') {
        check = '<p class="d24-file-check">Format projektowy — podgląd nie jest dostępny w przeglądarce.</p>';
      }
      return `<article class="d24-file-card">
        <div class="d24-file-thumb ${entry.kind === 'image' ? 'is-image' : ''}">${thumb}</div>
        <div class="d24-file-info"><strong title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</strong><small>${info}</small>${check}</div>
        <div class="d24-file-actions">
          ${entry.kind !== 'other' ? `<button type="button" class="d24-file-preview-button" data-preview-file="${index}" aria-label="Pokaż plik ${escapeHTML(file.name)}">Podgląd</button>` : ''}
          <button type="button" class="d24-file-remove-button" data-remove-file="${index}" aria-label="Usuń plik ${escapeHTML(file.name)}">Usuń</button>
        </div>
      </article>`;
    }).join('');
  }
  function closePreview() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.classList.remove('d24-preview-modal-open');
    document.removeEventListener('keydown', onEscape);
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    previousFocus = null;
  }
  function onEscape(e) { if (e.key === 'Escape') closePreview(); }
  function openPreview(index) {
    if (!hooks) return;
    const file = hooks.getFiles()[index];
    if (!file) return;
    const entry = entryFor(file);
    if (entry.kind === 'other') return;
    closePreview();
    previousFocus = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'd24-file-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = `<div role="dialog" aria-modal="true" aria-label="Podgląd pliku" class="d24-file-dialog">
      <div class="d24-file-dialog-head"><div><strong>${escapeHTML(file.name)}</strong><small>${sizeText(file.size)} · lokalny podgląd</small></div><button type="button" class="d24-file-dialog-close" aria-label="Zamknij podgląd">Zamknij ×</button></div>
      <div class="d24-file-stage"></div>
      <p>Ten podgląd nie jest weryfikacją pliku do druku. Gotową kontrolę techniczną wykonamy przed realizacją zlecenia.</p>
    </div>`;
    const stage = overlay.querySelector('.d24-file-stage');
    if (entry.kind === 'image') {
      const img = document.createElement('img');
      img.src = entry.url;
      img.alt = `Podgląd: ${file.name}`;
      stage.appendChild(img);
    } else {
      const pdf = document.createElement('object');
      pdf.data = entry.url;
      pdf.type = 'application/pdf';
      pdf.setAttribute('aria-label', `Podgląd PDF: ${file.name}`);
      const fallback = document.createElement('p');
      fallback.textContent = 'Podgląd PDF może być niedostępny w tej przeglądarce.';
      pdf.appendChild(fallback);
      stage.appendChild(pdf);
    }
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('.d24-file-dialog-close')) closePreview(); });
    document.body.appendChild(overlay);
    document.body.classList.add('d24-preview-modal-open');
    document.addEventListener('keydown', onEscape);
    overlay.querySelector('.d24-file-dialog-close').focus();
  }
  function mount(opts) {
    hooks = opts;
    const zone = document.getElementById('orderFileDropZone');
    const list = document.getElementById('orderFileList');
    if (list) {
      list.addEventListener('click', event => {
        const remove = event.target.closest('[data-remove-file]');
        const preview = event.target.closest('[data-preview-file]');
        if (remove) hooks.removeFile(Number(remove.dataset.removeFile));
        if (preview) openPreview(Number(preview.dataset.previewFile));
      });
    }
    if (zone) {
      const setActive = value => zone.classList.toggle('is-dragging', value);
      ['dragenter','dragover'].forEach(event => zone.addEventListener(event, e => {e.preventDefault(); setActive(true); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';}));
      ['dragleave','dragend'].forEach(event => zone.addEventListener(event, e => {e.preventDefault(); if (!zone.contains(e.relatedTarget)) setActive(false);}));
      zone.addEventListener('drop', e => {
        e.preventDefault(); setActive(false);
        const incoming = [...(e.dataTransfer?.files || [])];
        if (incoming.length) hooks.addFiles(incoming);
      });
    }
    renderFiles();
  }
  window.DrukulatorCheckoutUX = { mount, renderFiles, clear };
})();
