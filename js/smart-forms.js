/* Drukulator 0.23.1 — progressive form enhancements. Business logic stays in app.js. */
(() => {
  'use strict';
  const content = document.getElementById('content');
  const cartPanel = document.getElementById('cartPanel');
  if (!content) return;
  const tr = (pl, en) => document.documentElement.lang === 'en' ? en : pl;
  const isForm = (node) => node && node.closest('.content > .card .form-grid') && !node.closest('.order-form-grid');
  const commonFormats = {
    A6: '105 × 148 mm', A5: '148 × 210 mm', A4: '210 × 297 mm',
    A3: '297 × 420 mm', A2: '420 × 594 mm', A1: '594 × 841 mm',
    A0: '841 × 1189 mm', B2: '500 × 707 mm', B1: '707 × 1000 mm', B0: '1000 × 1414 mm',
    DL: '99 × 210 mm'
  };
  // These calculators use concise labels and no generic assistance copy.
  const conciseProductFields = new Set([
    'bcFormat', 'bcSides', 'bcQuantity',
    'flyFormat', 'flyQuantity',
    'posterFormat', 'posterQty',
    'appQty',
    // 0.24.2: roll-upy — bez dodatkowego opisu „Wybierz gotowy rozmiar produktu” pod formatem.
    'rollSize'
  ]);
  const guides = [
    [/nakład|ilość sztuk|liczba kopii/i, ['Wybierz, ile sztuk potrzebujesz. Przy większej ilości zwykle spada cena za sztukę.', 'Choose how many pieces you need. A larger quantity usually lowers the price per piece.']],
    [/format/i, ['Wybierz gotowy rozmiar produktu.','Select the finished product size.']],
    [/zadruk|stronność|stron zadrukować/i, ['Czy drukujemy tylko przód, czy przód i tył — zgodnie z Twoim projektem.','Whether we print the front only or both sides — as your design requires.']],
    [/papier|gramatura/i, ['Większa gramatura oznacza zwykle sztywniejszy papier.','Higher paper weight usually means a stiffer sheet.']],
    [/szerokość|wysokość/i, ['Wpisz wymiary w jednostkach podanych przy polu.','Enter dimensions in the units shown.']]
  ];
  const selectKind = (field, select) => {
    const label = field.querySelector(':scope > label')?.textContent || '';
    const id = select.id || '';
    if (/naklad|qty|quantity|pickup|mode|suggestion|imageSizeMode/i.test(id)) return '';
    if (/format/i.test(label) || /Format$/i.test(id)) return 'format';
    if (/gramatura|papier/i.test(label) || /Paper$/i.test(id)) return 'paper';
    if (/zadruk|rodzaj druku|stronność/i.test(label) || /^(bcSides|bcPrint|digColor|digSide|posterPrint|flyPrint|bindColor|bindSide)$/i.test(id)) return 'print';
    if (/wykończenie/i.test(label) || /^(bcFinish|rollProduct|pvcThickness)$/i.test(id)) return 'finish';
    return '';
  };
  const formatDetail = (label) => {
    const match = label.match(/\b(A[0-6]|B[012]|DL)\b/i);
    if (match) return commonFormats[match[1].toUpperCase()] || '';
    const dim = label.match(/\b\d{2,4}\s*[x×]\s*\d{2,4}\s*(?:mm|cm)?/i);
    return dim ? dim[0].replace(/\s*x\s*/i,' × ') : '';
  };
  const smallDetail = (kind, text) => {
    if (kind === 'format') return formatDetail(text);
    if (kind === 'paper') { const weight = text.match(/\b\d{2,3}\s*g(?:\/m²|\/m2)?\b/i); return weight ? weight[0] : ''; }
    return '';
  };
  const signatureFor = (select) => Array.from(select.options).map(o => `${o.value}\u0002${o.label}\u0002${o.disabled?'1':'0'}\u0002${o.dataset.d24FinalPrice||''}\u0002${o.dataset.d24FinalTotal||''}`).join('\u0001');
  let scheduled = false;
  // A single visual control for every available select option. The native select
  // remains the authoritative value for all existing validators and calculators.
  const INITIAL_CHOICES = 8;
  // A select may ask for a different number of initially visible choices (data-d24-initial-choices).
  const initialChoices = select => Number(select.dataset.d24InitialChoices) || INITIAL_CHOICES;
  function decorateSelect(field, select) {
    const kind = selectKind(field, select) || 'choice';
    const featured = select.dataset.d24FeaturedQuantities?.split(',') || null;
    const options = Array.from(select.options).filter(o => !o.disabled && o.value !== '' && o.label.trim() && !o.dataset.d24CustomOption && (!featured || featured.includes(o.value)));
    let host = field.querySelector(':scope > .d24-smart-options');
    if (!options.length) {
      if (host) host.remove();
      select.classList.remove('d24-native-covered');
      select.removeAttribute('aria-hidden');
      if (select.dataset.d24OldTabindex !== undefined) {
        if (select.dataset.d24OldTabindex === '') select.removeAttribute('tabindex');
        else select.setAttribute('tabindex',select.dataset.d24OldTabindex);
        delete select.dataset.d24OldTabindex;
      }
      return;
    }
    if (!host) {
      host = document.createElement('div');
      host.className = 'd24-smart-options';
      host.setAttribute('role','group');
      select.after(host);
      host.addEventListener('click', event => {
        const more = event.target.closest('button[data-d24-show-more]');
        if (more && host.contains(more)) {
          host.dataset.expanded = host.dataset.expanded === 'true' ? 'false' : 'true';
          syncOptions(host,select);
          return;
        }
        const button = event.target.closest('button[data-option-index]');
        if (!button || !host.contains(button) || select.disabled) return;
        const option = select.options[Number(button.dataset.optionIndex)];
        if (!option || option.disabled || option.value !== button.dataset.optionValue) return;
        if (select.selectedIndex !== option.index) {
          select.selectedIndex = option.index;
          select.dispatchEvent(new Event('change', {bubbles:true}));
        }
        syncOptions(host,select);
      });
    }
    const labelText = field.querySelector(':scope > label')?.textContent?.trim() || tr('Wybierz opcję','Choose an option');
    host.setAttribute('aria-label',labelText);
    const signature = signatureFor(select) + `:${kind}:${document.documentElement.lang}:${select.dataset.d24FeaturedQuantities || ''}`;
    if (host.dataset.signature !== signature) {
      host.dataset.signature = signature;
      host.replaceChildren();
      Array.from(select.options).forEach((option, index) => {
        if (!options.includes(option)) return;
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'd24-smart-choice';
        button.dataset.optionIndex = String(index); button.dataset.optionValue = option.value;
        const title = document.createElement('strong'); title.textContent = option.label.trim();
        button.append(title);
        // 0.24.3: pianki — pod nazwą formatu nie pokazujemy rozmiaru w mm (data-d24-no-detail="1"), tylko cenę.
        const detail = select.dataset.d24NoDetail === '1' ? '' : smallDetail(kind, option.label);
        if (detail && detail !== option.label.trim()) {
          const small = document.createElement('small'); small.textContent = detail; button.append(small);
        }
        // Final gross price prepared by app.js (apparel models, canvas formats),
        // shown under the option name, e.g. "890,00 zł".
        const price = option.dataset.d24FinalPrice;
        if (price) {
          const priceLabel = document.createElement('span');
          priceLabel.className = 'd24-option-price';
          priceLabel.textContent = price;
          button.append(priceLabel);
        }
        host.append(button);
      });
      if (options.length > initialChoices(select) && select.dataset.d24NoMore !== '1') {
        const more = document.createElement('button');
        more.type = 'button'; more.className = 'd24-smart-more';
        more.dataset.d24ShowMore = '1'; host.append(more);
      }
    }
    if (select.dataset.d24OldTabindex === undefined) select.dataset.d24OldTabindex = select.getAttribute('tabindex') || '';
    select.classList.add('d24-native-covered');
    select.setAttribute('aria-hidden','true');
    select.setAttribute('tabindex','-1');
    syncOptions(host,select);
  }
  function syncOptions(host,select) {
    const buttons = Array.from(host.querySelectorAll('button[data-option-index]'));
    const expanded = host.dataset.expanded === 'true';
    let displayed = 0;
    buttons.forEach((button,index) => {
      const option = select.options[Number(button.dataset.optionIndex)];
      const selected = !!option && option.index === select.selectedIndex;
      const visible = expanded || index < initialChoices(select) || selected;
      button.hidden = !visible;
      button.disabled = select.disabled || !option || option.disabled;
      button.setAttribute('aria-pressed',String(selected));
      if (visible) displayed++;
    });
    const more = host.querySelector('button[data-d24-show-more]');
    if (more) {
      more.textContent = expanded
        ? tr('Pokaż mniej','Show fewer')
        : tr(`Pokaż wszystkie opcje (${buttons.length})`,`Show all options (${buttons.length})`);
      more.setAttribute('aria-expanded',String(expanded));
      more.hidden = displayed === buttons.length && !expanded;
    }
  }
  function decorateField(field) {
    if (field.classList.contains('hidden') || field.closest('.hidden') || field.hidden) return;
    const label = field.querySelector(':scope > label');
    const input = field.querySelector(':scope > input, :scope > select, :scope > textarea');
    if (!label || !input || input.disabled || input.type === 'hidden') return;
    if (!label.htmlFor && input.id) label.htmlFor = input.id;
    if (conciseProductFields.has(input.id)) {
      field.querySelector(':scope > .d24-control-guide')?.remove();
    } else if (!field.querySelector(':scope > .d24-control-guide') && !field.querySelector(':scope > small')) {
      const guide = guides.find(([pattern]) => pattern.test(label.textContent));
      if (guide) {
        const elem = document.createElement('div'); elem.className = 'd24-control-guide';
        elem.textContent = tr(...guide[1]);
        elem.dataset.lang = document.documentElement.lang;
        // No aria-describedby mutation: guidance never replaces calculator validations.
        if (input.tagName === 'SELECT') input.before(elem); else label.after(elem);
      }
    } else {
      const guide = field.querySelector(':scope > .d24-control-guide');
      if (guide && guide.dataset.lang !== document.documentElement.lang) {
        const matching = guides.find(([pattern]) => pattern.test(label.textContent));
        if (matching) guide.textContent = tr(...matching[1]);
        guide.dataset.lang = document.documentElement.lang;
      }
    }
    if (input.tagName === 'SELECT') decorateSelect(field, input);
    if (input.tagName === 'SELECT' && /(Quantity|Qty)$/.test(input.id)) decorateOtherQuantity(field);
  }
  // Ilości w kalkulatorze są zdefiniowane w cenniku; dla innych podpowiadamy kontakt.
  function decorateOtherQuantity(field) {
    let note = field.querySelector(':scope > .d24-qty-other');
    if (!note) {
      note = document.createElement('p');
      note.className = 'd24-qty-other';
      field.append(note);
    }
    const lang = document.documentElement.lang;
    if (note.dataset.lang === lang) return;
    note.dataset.lang = lang;
    note.replaceChildren();
    note.append(document.createTextNode(tr('Potrzebujesz innej ilości? ','Need a different quantity? ')));
    const phone = document.createElement('a'); phone.href = 'tel:+48918314747'; phone.textContent = tr('Zadzwoń','Call us');
    const mail = document.createElement('a'); mail.href = 'mailto:biuro@druk24.szczecin.pl'; mail.textContent = tr('napisz','write to us');
    note.append(phone, document.createTextNode(tr(' lub ',' or ')), mail, document.createTextNode(tr(' — pomożemy.',' — we will help.')));
  }
  function decorateStatus(card) {
    // 0.24.0: cena liczy się na żywo (blok ceny i przycisk „Dodaj do koszyka”), więc dawny
    // komunikat o aktualizacji ceny „przy dodawaniu do koszyka” jest usuwany.
    card.querySelectorAll(':scope > .d24-calc-details').forEach(node => node.remove());
  }
  function decorateCart() {
    if (!cartPanel) return;
    cartPanel.querySelectorAll('.order-form-grid .field').forEach(field => {
      if (field.closest('.hidden,[hidden]')) return;
      const select = field.querySelector(':scope > select');
      if (!select) return;
      const label = field.querySelector(':scope > label');
      if (label && select.id && !label.htmlFor) label.htmlFor = select.id;
      decorateSelect(field,select);
    });
  }
  function decorate() {
    scheduled = false;
    decorateCart();
    if (document.body.classList.contains('is-home-page')) return;
    const card = content.querySelector(':scope > .card');
    if (!card) return;
    const h2 = content.querySelector('.page-header h2')?.textContent || '';
    if (/edycja cen|edycja wyszukiwarki|statystyki/i.test(h2)) return;
    const grid = card.querySelector(':scope > .form-grid');
    if (!grid) return;
    grid.querySelectorAll('.field').forEach(field => {
      if (field.closest('.form-grid') === grid) decorateField(field);
    });
    decorateStatus(card);
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(decorate); }
  new MutationObserver(schedule).observe(content, {childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class']});
  if (cartPanel) {
    new MutationObserver(schedule).observe(cartPanel,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class']});
    cartPanel.addEventListener('change',schedule,true);
  }
  new MutationObserver(schedule).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  content.addEventListener('change', event => { if (isForm(event.target)) schedule(); }, true);
  content.addEventListener('d24-apparel-option-prices', schedule);
  content.addEventListener('d24-option-prices', schedule);
  document.querySelectorAll('.druk24-site-logo, .druk24-footer-logo').forEach(link => {
    const img = link.querySelector('img');
    if (!img) return;
    // Local previews may not serve WordPress assets; graceful branded text fallback.
    const fallback = document.createElement('span'); fallback.className = 'druk24-logo-fallback';
    fallback.innerHTML = 'DRUK<strong>24</strong><small>SZCZECIN</small>';
    link.append(fallback);
    const check = () => { link.classList.toggle('logo-missing', !img.naturalWidth); };
    img.addEventListener('error',check);
    img.addEventListener('load',check);
    if (img.complete) check();
  });
  schedule();
})();
